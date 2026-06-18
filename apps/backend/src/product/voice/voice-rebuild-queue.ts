import { Effect } from "effect";
import type { AppLogger } from "@my-ai-orchestrator/core";
import type { BackendObservabilityService } from "../core/observability-types.js";

interface RebuildQueueState {
  running: boolean;
  queued: boolean;
  activePromise?: Promise<void>;
}

export interface VoiceRebuildQueueDeps {
  readonly now: () => Date;
  readonly observability: BackendObservabilityService;
  readonly logger?: AppLogger;
  readonly processUserRebuild: (userId: string) => Effect.Effect<void>;
  readonly markRebuildQueued: (userId: string) => Effect.Effect<void>;
}

export function createVoiceRebuildQueue(deps: VoiceRebuildQueueDeps) {
  const states = new Map<string, RebuildQueueState>();

  const ensureState = (userId: string): RebuildQueueState => {
    const existing = states.get(userId);
    if (existing) {
      return existing;
    }

    const created: RebuildQueueState = {
      running: false,
      queued: false
    };
    states.set(userId, created);
    return created;
  };

  const startRunner = (userId: string, state: RebuildQueueState): void => {
    if (state.running) {
      return;
    }

    state.running = true;
    state.activePromise = (async () => {
      try {
        while (state.queued) {
          state.queued = false;
          await Effect.runPromise(deps.processUserRebuild(userId));

          if (state.queued) {
            await Effect.runPromise(deps.markRebuildQueued(userId));
          }
        }
      } finally {
        state.running = false;
        state.activePromise = undefined;

        if (state.queued) {
          startRunner(userId, state);
        }
      }
    })().catch((error: unknown) => {
      deps.logger?.error("Voice profile rebuild runner failed", {
        userId,
        reason: error instanceof Error ? error.message : "unknown_error"
      });
    });
  };

  const waitForIdle = async (userId?: string): Promise<void> => {
    while (true) {
      const relevantStates = userId ? [ensureState(userId)] : [...states.values()];
      const activePromises = relevantStates
        .map((state) => state.activePromise)
        .filter((promise): promise is Promise<void> => promise !== undefined);
      const stillBusy = relevantStates.some((state) => state.running || state.queued);

      if (!stillBusy) {
        return;
      }

      if (activePromises.length === 0) {
        await Promise.resolve();
        continue;
      }

      await Promise.all(activePromises);
    }
  };

  return {
    schedule(userId: string) {
      return Effect.sync(() => {
        const state = ensureState(userId);
        state.queued = true;

        Effect.runSync(
          deps.observability.recordVoiceRebuildQueued({
            userId,
            queuedAt: deps.now().toISOString()
          })
        );
        deps.logger?.info("Queued voice profile rebuild", {
          userId
        });

        void Effect.runPromise(deps.markRebuildQueued(userId)).catch(() => undefined);
        startRunner(userId, state);
      });
    },
    drain(userId?: string) {
      return Effect.promise(() => waitForIdle(userId));
    }
  };
}
