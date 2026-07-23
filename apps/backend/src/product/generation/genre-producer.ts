import { Effect, Schema } from "effect";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import {
  GenreSignatureSchema,
  type GenreInferenceResponse,
  type GenreSignature
} from "@my-ai-orchestrator/contracts";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import type {
  AIPolicyProviderModelAttempt,
  BackendAIPolicyServiceContract
} from "../ai-policy/ai-policy-types.js";
import { parseJsonFromLlmResponse } from "../voice/voice-extraction-json.js";
import { getBriefingText } from "../../execution/skill-inputs.js";

// F4-7 (ADR 0010 §10) — the genre producer. Reads the four slot answers (carried in the briefing) at
// the end of the generation questions and infers the text's GenreSignature by SUBSTANCE, never lexicon
// (invariant 5): the model reads what the payload/resistance/stake DO, it never scans for the word
// "promote". Generation-side, so it DEGRADES to the default (expository prose) and never blocks —
// distinct from the onboarding seed (G1), which hard-blocks.

// ponytail: shares the default-llm routing profile with generation-prefill (12s timeout, gemini chain);
// split into a dedicated profile once eval shows genre inference needs a different latency/cost budget.
const ROUTING_PROFILE_ID = "default-llm";

const DEFAULT_GENRE: GenreSignature = {
  rhetoricalMode: { dominant: "expound" },
  epistemicPosture: "expository",
  prose: ""
};

// Aggregate ceiling so a slow provider chain degrades to the default genre instead of holding the
// request handler open (default-llm chain, no retry-doubling here — roughly two attempts' worth).
const GENRE_INFERENCE_BUDGET = "30 seconds" as const;

const decodeGenreSignature = Schema.decodeUnknown(GenreSignatureSchema);

export interface BackendGenreInferenceRequest {
  readonly briefing: string | Record<string, unknown>;
  readonly language?: string;
}

export interface BackendGenreInferenceService {
  // Never fails: any error (policy, provider chain, parse) degrades to DEFAULT_GENRE — genre inference
  // is generation-side and must not block the flow (ADR 0004 §5 / ADR 0010 §10).
  readonly infer: (args: BackendGenreInferenceRequest) => Effect.Effect<GenreInferenceResponse>;
}

export function createBackendGenreInferenceService(options: {
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
  readonly aiPolicy: BackendAIPolicyServiceContract;
}): BackendGenreInferenceService {
  return {
    infer(args) {
      return Effect.gen(function* () {
        // Nest under `briefing` so getBriefingText renders the labeled slots (Topic/Payload/…) rather
        // than a raw JSON dump — the substance the model reads to classify the mode.
        const answers = getBriefingText({ briefing: args.briefing });
        if (answers.trim().length === 0) {
          return { genre: DEFAULT_GENRE };
        }

        const attempts = yield* resolveAttempts(options.aiPolicy);
        if (attempts.length === 0) {
          return { genre: DEFAULT_GENRE };
        }

        const genre = yield* runGenreInference({
          answers,
          language: args.language,
          attempts,
          aiAdapters: options.aiAdapters,
          providerTransport: options.providerTransport
        }).pipe(
          Effect.timeoutFail({ onTimeout: () => "genre inference timed out", duration: GENRE_INFERENCE_BUDGET }),
          Effect.orElseSucceed(() => DEFAULT_GENRE)
        );

        return { genre };
      });
    }
  };
}

function resolveAttempts(
  aiPolicy: BackendAIPolicyServiceContract
): Effect.Effect<readonly AIPolicyProviderModelAttempt[]> {
  return aiPolicy.getActivePolicy().pipe(
    Effect.map((policy) => {
      const routingProfile = policy.routingProfiles[ROUTING_PROFILE_ID];
      return routingProfile
        ? [...routingProfile.preferredAttempts, ...routingProfile.fallbackAttempts]
        : [];
    }),
    Effect.orElseSucceed(() => [])
  );
}

function runGenreInference(args: {
  readonly answers: string;
  readonly language: string | undefined;
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
}): Effect.Effect<GenreSignature, string> {
  return Effect.gen(function* () {
    const system = buildSystemPrompt();
    const user = buildUserPrompt(args.answers, args.language);

    for (const attempt of args.attempts) {
      const completion = yield* Effect.either(
        args.aiAdapters.complete({
          request: {
            provider: attempt.provider,
            model: attempt.model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user }
            ],
            temperature: 0.1,
            metadata: {
              purpose: "genre-inference",
              adapter: attempt.provider,
              model: attempt.model,
              ...(typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {})
            }
          },
          transport: args.providerTransport.complete
        })
      );

      if (completion._tag === "Left") {
        continue;
      }

      const parsed = yield* parseJsonFromLlmResponse(completion.right.response.text).pipe(Effect.either);
      if (parsed._tag === "Left") {
        continue;
      }

      const decoded = yield* decodeGenreSignature(parsed.right).pipe(Effect.either);
      if (decoded._tag === "Left") {
        continue;
      }

      return decoded.right;
    }

    return yield* Effect.fail("genre inference exhausted all attempts");
  });
}

function buildSystemPrompt(): string {
  return [
    "You classify the GENRE of a piece of writing from the author's answers to four framing questions.",
    "Classify by SUBSTANCE — what each answer DOES — never by keyword. Read the action and belief behind an answer (e.g. an answer that sells a next step is promotional even if it never says 'promote').",
    "",
    "The four answers describe: payload (what the reader takes away), anchor (what backs the claim), resistance (the honest other side), stake (why the reader acts now).",
    "",
    "Rhetorical modes (pick the dominant, and a secondary only if genuinely mixed):",
    "- expound: clarifies and transmits, neutral exposition.",
    "- narrate: recounts lived experience, testimonial.",
    "- argue: takes and defends a position, weighs evidence.",
    "- instruct: teaches step by step, didactic.",
    "- promote: persuades with the author's material interest in what the reader does next.",
    "",
    "epistemicPosture (the characteristic stance): exploratory, investigative, advocacy, expository, instructive, experiential, promotional, or not_applicable.",
    "prose: one sentence naming the genre in the author's terms (e.g. 'promotional via competitive comparison + CTA').",
    "",
    "Respond with JSON only — no markdown fences or commentary — matching:",
    "{",
    '  "rhetoricalMode": { "dominant": "expound|narrate|argue|instruct|promote", "secondary": "expound|narrate|argue|instruct|promote (optional)" },',
    '  "epistemicPosture": "exploratory|investigative|advocacy|expository|instructive|experiential|promotional|not_applicable",',
    '  "prose": "string"',
    "}"
  ].join("\n");
}

function buildUserPrompt(answers: string, language: string | undefined): string {
  return [
    "Author's framing answers:",
    answers,
    language ? `Language: ${language}` : ""
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}
