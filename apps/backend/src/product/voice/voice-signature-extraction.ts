import { Effect } from "effect";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { VoiceExampleRecord } from "@my-ai-orchestrator/database";
import type { BackendProviderTransport } from "../../execution/pipeline/provider-transport.js";
import type { AIPolicyProviderModelAttempt } from "../ai-policy/ai-policy-types.js";
import { parseJsonFromLlmResponse } from "./voice-extraction-json.js";
import { resolveWizardStepId } from "./wizard-voice-examples.js";
import {
  TOPIC_LEAKAGE_RETRY_SUFFIX,
  detectTopicLeakage,
  type VoiceSignatureBrief
} from "./voice-signature-brief.js";

export interface ReasoningOutputLanguage {
  readonly primary: string;
  readonly bcp47: string;
  readonly label: string;
}

export function normalizeExampleLanguage(language: string): string {
  const lower = language.trim().toLowerCase();
  if (lower.startsWith("pt")) {
    return "pt";
  }
  if (lower.startsWith("en")) {
    return "en";
  }

  return lower.split("-")[0] ?? lower;
}

export function resolvePrimaryExampleLanguage(
  examples: readonly VoiceExampleRecord[]
): string | undefined {
  const counts = new Map<string, number>();

  for (const example of examples.filter((item) => item.state === "active")) {
    const language = normalizeExampleLanguage(example.language);
    counts.set(language, (counts.get(language) ?? 0) + 1);
  }

  let primary: string | undefined;
  let highestCount = 0;

  for (const [language, count] of counts) {
    if (count > highestCount) {
      primary = language;
      highestCount = count;
    }
  }

  return primary;
}

export function resolveReasoningOutputLanguage(
  examples: readonly VoiceExampleRecord[]
): ReasoningOutputLanguage {
  const primary = resolvePrimaryExampleLanguage(examples);

  if (primary === "pt") {
    return {
      primary: "pt",
      bcp47: "pt-BR",
      label: "Brazilian Portuguese"
    };
  }

  if (primary === "en") {
    return {
      primary: "en",
      bcp47: "en-US",
      label: "English"
    };
  }

  const dominantExample = examples.find((example) => example.state === "active");

  return {
    primary: primary ?? "unknown",
    bcp47: dominantExample?.language ?? "unknown",
    label: "the same language as the majority of examples"
  };
}

export function isLikelyPortugueseText(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) {
    return true;
  }

  if (/^(The author|They |Author |This author|Opens with|LinkedIn posts stay)/i.test(normalized)) {
    return false;
  }

  return /[áàâãéêíóôõúç]/i.test(normalized) || /\b(que|com|para|não|autor|abordagem|observa|tom|estilo)\b/i.test(normalized);
}

export function buildExampleBlocks(examples: readonly VoiceExampleRecord[]): string {
  return examples
    .map((example, index) => {
      const stepId = resolveWizardStepId(example);
      const stepLabel = stepId ? `, step: ${stepId}` : "";
      return `Example ${index + 1} (language: ${example.language}${stepLabel}):\n${example.text.trim()}`;
    })
    .join("\n\n");
}

export function resolveLanguageInstruction(
  outputLanguage: ReasoningOutputLanguage,
  variants: { readonly pt: string; readonly en: string; readonly fallback: string }
): string {
  if (outputLanguage.primary === "pt") {
    return variants.pt;
  }

  if (outputLanguage.primary === "en") {
    return variants.en;
  }

  return variants.fallback;
}

export function dedupeStrings(items: readonly string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

export interface SignatureExtractionConfig<TResult, TError> {
  readonly purpose: string;
  readonly buildMessages: (
    examples: readonly VoiceExampleRecord[],
    outputLanguage: ReasoningOutputLanguage,
    brief?: VoiceSignatureBrief
  ) => { readonly system: string; readonly user: string };
  readonly decode: (input: unknown) => Effect.Effect<TResult, unknown>;
  readonly normalize: (result: TResult) => TResult;
  readonly selectProse: (result: TResult) => string;
  readonly languageRetrySuffix: string;
  readonly makeError: (message: string) => TError;
  readonly failMessage: string;
  readonly precondition?: (activeExamples: readonly VoiceExampleRecord[]) => Effect.Effect<void, TError>;
  // Coerce hallucinated categorical enums to safe defaults before decode (never fabricates prose).
  readonly sanitizeRaw?: (raw: unknown) => unknown;
  // Suffix appended to re-ask the SAME model after a schema-decode failure (deterministic fault).
  readonly schemaRepairSuffix?: (errorMessage: string) => string;
}

export interface SignatureExtractionArgs {
  readonly examples: readonly VoiceExampleRecord[];
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
  readonly brief?: VoiceSignatureBrief;
}

const MAX_CORRECTIVE_PASSES = 3;

export function runSignatureExtraction<TResult, TError>(
  config: SignatureExtractionConfig<TResult, TError>,
  args: SignatureExtractionArgs
): Effect.Effect<TResult, TError> {
  return Effect.gen(function* () {
    const activeExamples = args.examples.filter((example) => example.state === "active");
    if (config.precondition) {
      yield* config.precondition(activeExamples);
    }

    const outputLanguage = resolveReasoningOutputLanguage(activeExamples);
    const messages = config.buildMessages(activeExamples, outputLanguage, args.brief);
    const systemPrompt = messages.system;
    const baseUserPrompt = messages.user;

    let lastError: TError | undefined;

    // Model fallback is the ONLY fallback: try each provider/model attempt in order. Within one
    // model we allow a few corrective passes — schema repair, wrong-language, topic-leakage. A
    // transport error is transient, so we jump straight to the next model; a schema-decode failure
    // is deterministic for that output, so we re-ask the SAME model with the error before moving on.
    for (const attempt of args.attempts) {
      let userPrompt = baseUserPrompt;

      for (let pass = 0; pass < MAX_CORRECTIVE_PASSES; pass += 1) {
        const completion = yield* Effect.either(
          args.aiAdapters.complete({
            request: {
              provider: attempt.provider,
              model: attempt.model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              temperature: 0.2,
              metadata: {
                purpose: config.purpose,
                adapter: attempt.provider,
                model: attempt.model,
                ...(typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {})
              }
            },
            transport: args.providerTransport.complete
          })
        );

        if (completion._tag === "Left") {
          lastError = config.makeError(completion.left.message);
          break;
        }

        const parsed = yield* parseSignatureResponse(config, completion.right.response.text).pipe(
          Effect.either
        );
        if (parsed._tag === "Left") {
          lastError = parsed.left.error;
          if (config.schemaRepairSuffix && pass < MAX_CORRECTIVE_PASSES - 1) {
            userPrompt = `${baseUserPrompt}${config.schemaRepairSuffix(parsed.left.message)}`;
            continue;
          }
          break;
        }

        const prose = config.selectProse(parsed.right);
        const canRetry = pass < MAX_CORRECTIVE_PASSES - 1;

        if (outputLanguage.primary === "pt" && canRetry && !isLikelyPortugueseText(prose)) {
          userPrompt = `${baseUserPrompt}${config.languageRetrySuffix}`;
          continue;
        }

        if (canRetry && detectTopicLeakage(prose, activeExamples)) {
          userPrompt = `${baseUserPrompt}${TOPIC_LEAKAGE_RETRY_SUFFIX}`;
          continue;
        }

        return parsed.right;
      }
    }

    return yield* Effect.fail(lastError ?? config.makeError(config.failMessage));
  });
}

function parseSignatureResponse<TResult, TError>(
  config: SignatureExtractionConfig<TResult, TError>,
  content: string
): Effect.Effect<TResult, { readonly error: TError; readonly message: string }> {
  return Effect.gen(function* () {
    const parsed = yield* parseJsonFromLlmResponse(content).pipe(
      Effect.mapError((error) => {
        const message = typeof error === "string" ? error : "Invalid JSON in extraction response";
        return { error: config.makeError(message), message };
      })
    );
    const sanitized = config.sanitizeRaw ? config.sanitizeRaw(parsed) : parsed;
    const decoded = yield* config.decode(sanitized).pipe(
      Effect.mapError((error) => {
        const message = error instanceof Error ? error.message : "Invalid extraction schema";
        return { error: config.makeError(message), message };
      })
    );

    return config.normalize(decoded);
  });
}
