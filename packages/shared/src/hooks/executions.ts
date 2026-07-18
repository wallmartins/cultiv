import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  ExecutionReactionValue,
  ExecutionsPageView,
  ExecutionStatusView,
  ExecutionTransition,
  MeExecutionRequest,
  ObservationFailure
} from "@my-ai-orchestrator/contracts";
import type { ObservationHandle } from "@my-ai-orchestrator/client-sdk";
import { useRun, type Run } from "../runtime/useRun.js";
import { useToastStore } from "../stores/toast.js";
import { useUnreadStore } from "../stores/unread.js";
import { queryKeys, type ExecutionsListFilters } from "./query-keys.js";
import { withSdk, withSdkSync } from "./with-sdk.js";

export type { ExecutionsListFilters };

export function useExecutionsList(filters: ExecutionsListFilters = {}, options?: { readonly enabled?: boolean }) {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.executionsList(filters),
    queryFn: () => run(withSdk((sdk) => sdk.executions.list(filters))),
    enabled: options?.enabled
  });
}

export function useExecution(id: string) {
  const run = useRun();
  return useQuery({
    queryKey: queryKeys.execution(id),
    queryFn: () => run(withSdk((sdk) => sdk.executions.get({ executionId: id }))),
    enabled: Boolean(id)
  });
}

export function useGenerate() {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: MeExecutionRequest) => run(withSdk((sdk) => sdk.executions.create(request))),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["executions", "list"] });
      void qc.invalidateQueries({ queryKey: queryKeys.entitlement() });
    }
  });
}

export function useCancelExecution(id: string) {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => run(withSdk((sdk) => sdk.executions.cancel({ executionId: id, reason }))),
    onSuccess: (snapshot) => {
      qc.setQueryData(queryKeys.execution(id), snapshot);
      void qc.invalidateQueries({ queryKey: ["executions", "list"] });
    }
  });
}

export interface SubmitReactionInput {
  readonly reaction: ExecutionReactionValue;
  readonly reason?: string;
}

export function useReaction(id: string) {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitReactionInput) =>
      run(withSdk((sdk) => sdk.executions.submitReaction({ executionId: id, ...input }))),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.execution(id) });
      const previous = qc.getQueryData<ExecutionStatusView>(queryKeys.execution(id));
      if (previous) {
        qc.setQueryData<ExecutionStatusView>(queryKeys.execution(id), {
          ...previous,
          reaction: { value: input.reaction, reason: input.reason, reactedAt: new Date().toISOString() }
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.execution(id), context.previous);
      }
    },
    onSuccess: (reaction) => {
      qc.setQueryData<ExecutionStatusView | undefined>(queryKeys.execution(id), (current) =>
        current ? { ...current, reaction } : current
      );
    }
  });
}

export function useClearReaction(id: string) {
  const run = useRun();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => run(withSdk((sdk) => sdk.executions.clearReaction({ executionId: id }))),
    onSuccess: () => {
      qc.setQueryData<ExecutionStatusView | undefined>(queryKeys.execution(id), (current) =>
        current ? { ...current, reaction: null } : current
      );
    }
  });
}

function patchExecutionsListPage(page: ExecutionsPageView | undefined, snapshot: ExecutionStatusView): ExecutionsPageView | undefined {
  if (!page) return page;
  const index = page.items.findIndex((item) => item.jobId === snapshot.jobId);
  if (index === -1) return page;
  const items = [...page.items];
  items[index] = snapshot;
  return { ...page, items };
}

function applyTransitionToCache(qc: QueryClient, id: string, transition: ExecutionTransition): void {
  if (!transition.snapshot) return;
  const snapshot = transition.snapshot;
  qc.setQueryData(queryKeys.execution(id), snapshot);
  qc.setQueriesData<ExecutionsPageView>({ queryKey: ["executions", "list"] }, (page) =>
    patchExecutionsListPage(page, snapshot)
  );
}

// Mirrors the SDK's own "stopped flag + late-arriving handle" idiom (execution-watch.ts) so a
// watch can be torn down before its start-up promise even resolves.
function startExecutionWatch(
  run: Run,
  qc: QueryClient,
  id: string,
  onTerminal?: (transition: ExecutionTransition) => void,
  onObservationFailure?: (failure: ObservationFailure) => void
): ObservationHandle {
  let stopped = false;
  let real: ObservationHandle | undefined;

  void run(
    withSdkSync((sdk) =>
      sdk.executions.watch({
        executionId: id,
        onTransition: (transition) => {
          applyTransitionToCache(qc, id, transition);
          if (transition.type === "completed" || transition.type === "failed" || transition.type === "cancelled") {
            onTerminal?.(transition);
          }
        },
        onObservationFailure
      })
    )
  ).then((handle) => {
    if (stopped) {
      handle.stop();
      return;
    }
    real = handle;
  });

  return {
    stop: () => {
      stopped = true;
      real?.stop();
    }
  };
}

// Per-detail watch — mounted at /app/g/$id (and once per live item in the rail).
export function useExecutionWatch(id: string, onObservationFailure?: (failure: ObservationFailure) => void) {
  const run = useRun();
  const qc = useQueryClient();

  useEffect(() => {
    if (!id) return;
    const handle = startExecutionWatch(run, qc, id, undefined, onObservationFailure);
    return () => handle.stop();
  }, [id, run, qc, onObservationFailure]);
}

// Shell-scoped multi-watch: observes every queued|running job so the rail, the completion
// toast, and Web Notifications stay live regardless of which route is mounted.
export function useRunningExecutionsWatch() {
  const run = useRun();
  const qc = useQueryClient();
  const markUnread = useUnreadStore((state) => state.markUnread);
  const pushToast = useToastStore((state) => state.push);
  const { data } = useExecutionsList({ status: "all", limit: 20 });
  const handlesRef = useRef(new Map<string, ObservationHandle>());

  const runningIds = (data?.items ?? [])
    .filter((item) => item.status === "queued" || item.status === "running")
    .map((item) => item.jobId)
    .sort()
    .join(",");

  useEffect(() => {
    const handles = handlesRef.current;
    const currentIds = new Set(runningIds ? runningIds.split(",") : []);

    for (const [id, handle] of handles) {
      if (!currentIds.has(id)) {
        handle.stop();
        handles.delete(id);
      }
    }

    for (const id of currentIds) {
      if (handles.has(id)) continue;
      handles.set(
        id,
        startExecutionWatch(run, qc, id, (transition) => {
          markUnread(id);
          pushToast({
            id,
            kind: transition.type === "completed" ? "success" : "error",
            topic: transition.snapshot?.briefingTopic
          });
        })
      );
    }
  }, [runningIds, run, qc, markUnread, pushToast]);

  useEffect(
    () => () => {
      for (const handle of handlesRef.current.values()) handle.stop();
      handlesRef.current.clear();
    },
    []
  );
}
