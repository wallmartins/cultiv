import { Effect, Schema } from "effect";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { QualityMode } from "@my-ai-orchestrator/contracts";
import type { CandidateText, VoiceProfile } from "@my-ai-orchestrator/text-quality";
import type { BackendObservabilityService } from "../../product/core/observability-types.js";
import type { BackendProviderTransport } from "../pipeline/provider-transport.js";
import type { AIPolicyProviderModelAttempt } from "../../product/ai-policy/ai-policy-types.js";
import { selectVoiceJudgeCandidates, shouldInvokeVoiceJudge } from "./voice-judge-policy.js";

const VoiceJudgeResultSchema = Schema.Struct({
  score: Schema.Number,
  rationale: Schema.String
});

export interface VoiceJudgeInput {
  readonly candidate: CandidateText;
  readonly voiceProfile: VoiceProfile;
  readonly qualityMode: QualityMode;
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
  readonly observability?: BackendObservabilityService;
  readonly pipelineName?: string;
}

export { shouldInvokeVoiceJudge, selectVoiceJudgeCandidates };

export function evaluateWithVoiceJudge(
  input: VoiceJudgeInput
): Effect.Effect<number | undefined> {
  return Effect.gen(function* () {
    if (!input.voiceProfile.coreReasoningSignature) {
      return undefined;
    }

    const core = input.voiceProfile.coreReasoningSignature;
    const examples = input.voiceProfile.examples.slice(0, 2).join("\n\n---\n\n");

    for (const attempt of input.attempts) {
      const completion = yield* Effect.either(
        input.aiAdapters.complete({
          request: {
            provider: attempt.provider,
            model: attempt.model,
            messages: [
              {
                role: "system",
                content: [
                  "You are a voice fidelity judge.",
                  "Score the candidate from 0 to 100 for reasoning alignment with the author signature.",
                  "Respond with JSON only: {\"score\": number, \"rationale\": string}"
                ].join("\n")
              },
              {
                role: "user",
                content: [
                  `Author reasoning:\n${core.narrativeProse}`,
                  `Certainty: ${core.certaintyLevel}; Judgment: ${core.judgmentFrequency}; Conclusion pace: ${core.conclusionPace}`,
                  `Examples:\n${examples.slice(0, 600)}`,
                  `Candidate:\n${input.candidate.refinedDraft.slice(0, 2500)}`
                ].join("\n\n")
              }
            ],
            temperature: 0,
            metadata: {
              purpose: "voice-judge",
              adapter: attempt.provider,
              model: attempt.model,
              ...(typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {})
            }
          },
          transport: input.providerTransport.complete
        })
      );

      if (completion._tag === "Left") {
        continue;
      }

      const parsed = yield* parseJudgeResponse(completion.right.response.text);
      if (parsed) {
        yield* input.observability?.recordVoiceJudgeInvoked({
          pipelineName: input.pipelineName,
          laneId: input.candidate.laneId,
          provider: attempt.provider,
          model: attempt.model,
          score: parsed.score
        }) ?? Effect.void;
        return parsed.score;
      }
    }

    yield* input.observability?.recordVoiceJudgeFallback({
      pipelineName: input.pipelineName,
      laneId: input.candidate.laneId,
      reason: "provider_or_parse_failure"
    }) ?? Effect.void;

    return undefined;
  });
}

function parseJudgeResponse(
  content: string
): Effect.Effect<{ readonly score: number; readonly rationale: string } | undefined> {
  return Effect.gen(function* () {
    const trimmed = content.trim();
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) {
      return undefined;
    }

    const jsonText = trimmed.startsWith("{") ? trimmed : trimmed.slice(start, end + 1);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return undefined;
    }

    const decoded = yield* Schema.decodeUnknown(VoiceJudgeResultSchema)(parsed).pipe(
      Effect.map((value) => ({
        score: Math.max(0, Math.min(100, value.score)),
        rationale: value.rationale
      })),
      Effect.catchAll(() => Effect.succeed(undefined))
    );

    return decoded;
  });
}

export function applyVoiceJudgeScores(
  candidates: readonly CandidateText[],
  judgeScores: Readonly<Record<string, number>>
): readonly CandidateText[] {
  return candidates.map((candidate) => {
    const judgeScore = judgeScores[candidate.laneId];
    if (judgeScore === undefined) {
      return candidate;
    }

    const blendedFinal = Math.round(candidate.score.finalScore * 0.7 + judgeScore * 0.3);
    return {
      ...candidate,
      score: {
        ...candidate.score,
        finalScore: blendedFinal
      }
    };
  });
}

export function runVoiceJudgePass(args: {
  readonly candidates: readonly CandidateText[];
  readonly voiceProfile: VoiceProfile;
  readonly qualityMode: QualityMode;
  readonly reasoningSignatureEnabled: boolean;
  readonly attempts: readonly AIPolicyProviderModelAttempt[];
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
  readonly observability?: BackendObservabilityService;
  readonly pipelineName?: string;
}): Effect.Effect<readonly CandidateText[]> {
  return Effect.gen(function* () {
    if (
      !shouldInvokeVoiceJudge({
        qualityMode: args.qualityMode,
        reasoningSignatureEnabled: args.reasoningSignatureEnabled,
        voiceProfile: args.voiceProfile,
        candidates: args.candidates
      })
    ) {
      return args.candidates;
    }

    const finalists = selectVoiceJudgeCandidates(args.candidates);
    const judgeScores: Record<string, number> = {};

    for (const candidate of finalists) {
      const score = yield* evaluateWithVoiceJudge({
        candidate,
        voiceProfile: args.voiceProfile,
        qualityMode: args.qualityMode,
        attempts: args.attempts,
        aiAdapters: args.aiAdapters,
        providerTransport: args.providerTransport,
        observability: args.observability,
        pipelineName: args.pipelineName
      });

      if (typeof score === "number") {
        judgeScores[candidate.laneId] = score;
      }
    }

    return applyVoiceJudgeScores(args.candidates, judgeScores);
  });
}
