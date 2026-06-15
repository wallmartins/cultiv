import { Effect } from "effect";
import type { AIAdapterServiceContract } from "@my-ai-orchestrator/ai-adapters";
import type { Context, ExecutionAdapter, StructuredPrompt } from "@my-ai-orchestrator/core";
import { createExecutionFailure } from "./execution-failure.js";
import { normalizeText, stripTemplateHeaders } from "../quality/quality.js";
import { buildAdapterStepContext } from "./step-context.js";
import type { BackendAdapterMetrics, BackendProviderAttempt } from "./pipeline-attempt-types.js";
import type { BackendProviderTransport } from "./provider-transport.js";

interface BackendExecutionAdapter extends ExecutionAdapter {
  readonly inspect: () => {
    readonly metrics: BackendAdapterMetrics;
    readonly attempts: readonly BackendProviderAttempt[];
  };
}

export function createBackendExecutionAdapter(args: {
  readonly attempts: ReadonlyArray<{
    readonly provider: string;
    readonly model: string;
    readonly timeoutMs?: number;
  }>;
  readonly qualityMode: "fast" | "balanced" | "strict";
  readonly aiAdapters: AIAdapterServiceContract;
  readonly providerTransport: BackendProviderTransport;
  readonly onAttemptEvent?: (event: {
    readonly provider: string;
    readonly model: string;
    readonly attemptIndex: number;
    readonly totalAttempts: number;
    readonly path: "preferred" | "fallback";
    readonly status: "started" | "succeeded" | "failed";
    readonly error?: string;
  }) => Effect.Effect<void, never>;
}) : BackendExecutionAdapter {
  const metrics: BackendAdapterMetrics = {
    inputTokensTotal: 0,
    outputTokensTotal: 0,
    debitedCredits: 0,
    estimatedUsdCost: 0
  };
  const attempts: BackendProviderAttempt[] = [];
  const primaryAttempt = args.attempts[0] ?? { provider: "openai", model: "gpt-4.1" };

  return {
    name: primaryAttempt.provider,
    configure: () => undefined,
    inspect: () => ({
      metrics,
      attempts: [...attempts]
    }),
    execute: (instruction, context) =>
      Effect.gen(function* () {
        let lastError = "Provider transport failed";
        const stepName = context.pipeline.steps[context.stepIndex]?.name ?? `step-${context.stepIndex}`;

        const systemContent = typeof instruction === "string"
          ? "You are a writing assistant. Return ONLY the final text. Do NOT echo headers, labels, or instructions."
          : instruction.system;

        const stepContext = buildAdapterStepContext(stepName, context.state, context.inputs);
        const userContent = typeof instruction === "string"
          ? `${instruction}\n\ncontext=${JSON.stringify(stepContext)}`
          : `${instruction.user}\n\ncontext=${JSON.stringify(stepContext)}`;

        for (const [index, attempt] of args.attempts.entries()) {
          yield* args.onAttemptEvent?.({
            provider: attempt.provider,
            model: attempt.model,
            attemptIndex: index + 1,
            totalAttempts: args.attempts.length,
            path: index === 0 ? "preferred" : "fallback",
            status: "started"
          }) ?? Effect.void;

          const completion = yield* Effect.either(
            args.aiAdapters.complete({
              request: {
                provider: attempt.provider,
                model: attempt.model,
                messages: [
                  { role: "system", content: systemContent },
                  { role: "user", content: userContent }
                ],
                metadata: {
                  adapter: attempt.provider,
                  model: attempt.model,
                  qualityMode: args.qualityMode,
                  ...(typeof attempt.timeoutMs === "number" ? { timeoutMs: attempt.timeoutMs } : {})
                }
              },
              transport: args.providerTransport.complete
            })
          );

          if (completion._tag === "Right") {
            const inputTokens = completion.right.response.usage?.inputTokens ?? estimateTokens(instruction);
            const outputTokens = completion.right.response.usage?.outputTokens ?? estimateTokens(completion.right.response.text);
            const debitedCredits = Math.max(1, Math.ceil((inputTokens + outputTokens) / 300));
            const estimatedUsdCost = estimateCost(inputTokens, outputTokens);
            metrics.inputTokensTotal += inputTokens;
            metrics.outputTokensTotal += outputTokens;
            metrics.debitedCredits += debitedCredits;
            metrics.estimatedUsdCost += estimatedUsdCost;
            attempts.push({
              provider: attempt.provider,
              model: attempt.model,
              path: index === 0 ? "preferred" : "fallback",
              status: "succeeded",
              inputTokens,
              outputTokens,
              estimatedUsdCost,
              debitedCredits
            });
            yield* args.onAttemptEvent?.({
              provider: attempt.provider,
              model: attempt.model,
              attemptIndex: index + 1,
              totalAttempts: args.attempts.length,
              path: index === 0 ? "preferred" : "fallback",
              status: "succeeded"
            }) ?? Effect.void;

            return stripTemplateHeaders(completion.right.response.text);
          }

          lastError = String(completion.left);
          attempts.push({
            provider: attempt.provider,
            model: attempt.model,
            path: index === 0 ? "preferred" : "fallback",
            status: "failed"
          });
          yield* args.onAttemptEvent?.({
            provider: attempt.provider,
            model: attempt.model,
            attemptIndex: index + 1,
            totalAttempts: args.attempts.length,
            path: index === 0 ? "preferred" : "fallback",
            status: "failed",
            error: lastError
          }) ?? Effect.void;
        }

        return yield* Effect.fail(
          createExecutionFailure({
            message: `Provider attempts were exhausted for step "${stepName}" using primary provider "${primaryAttempt.provider}": ${lastError}`,
            reason: "provider_attempts_exhausted"
          })
        );
      })
  };
}

function estimateTokens(value: string | StructuredPrompt): number {
  const text = typeof value === "string" ? value : `${value.system}\n${value.user}`;
  return Math.max(1, Math.ceil(normalizeText(text).length / 4));
}

function estimateCost(inputTokens: number, outputTokens: number): number {
  return Math.round((inputTokens * 0.000004 + outputTokens * 0.000015) * 10000) / 10000;
}
