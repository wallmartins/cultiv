import type { QueuedExecutionView } from "@my-ai-orchestrator/contracts";
import type { ObservationHandle } from "@my-ai-orchestrator/client-sdk";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode
} from "react";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { formatSdkError } from "~/platform/sdk/format-sdk-error";
import { useNotifications } from "~/platform/notifications/notification-store";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { MAX_ACTIVE_EXECUTIONS, type ActiveExecutionItem } from "./types";

type ActiveExecutionState = {
  readonly items: readonly ActiveExecutionItem[];
};

type ActiveExecutionAction =
  | { readonly type: "add"; readonly item: ActiveExecutionItem }
  | { readonly type: "patch"; readonly id: string; readonly patch: Partial<ActiveExecutionItem> };

function reduceActiveExecutions(
  state: ActiveExecutionState,
  action: ActiveExecutionAction
): ActiveExecutionState {
  switch (action.type) {
    case "add": {
      const withoutDuplicate = state.items.filter((item) => item.id !== action.item.id);
      return {
        items: [action.item, ...withoutDuplicate].slice(0, MAX_ACTIVE_EXECUTIONS)
      };
    }
    case "patch": {
      return {
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, ...action.patch } : item
        )
      };
    }
    default:
      return state;
  }
}

type ActiveExecutionContextValue = {
  readonly items: readonly ActiveExecutionItem[];
  readonly inFlightCount: number;
  readonly drawerOpen: boolean;
  readonly drawerExecutionId: string | null;
  readonly openDrawer: (executionId?: string) => void;
  readonly closeDrawer: () => void;
  readonly registerQueuedExecution: (
    queued: QueuedExecutionView,
    meta: {
      readonly contentTypeLabel: string;
      readonly briefing?: Record<string, unknown>;
      readonly language?: string;
      readonly qualityMode?: ActiveExecutionItem["qualityMode"];
    }
  ) => void;
  readonly refreshExecution: (executionId: string) => Promise<void>;
};

const ActiveExecutionContext = createContext<ActiveExecutionContextValue | null>(null);

export function ActiveExecutionProvider({ children }: { readonly children: ReactNode }) {
  const client = useClientSdk();
  const { messages } = useAppLocale();
  const { push } = useNotifications();
  const [{ items }, dispatch] = useReducer(reduceActiveExecutions, { items: [] });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerExecutionId, setDrawerExecutionId] = useState<string | null>(null);
  const watchesRef = useRef<Map<string, ObservationHandle>>(new Map());
  const drawerExecutionIdRef = useRef<string | null>(null);

  useEffect(() => {
    drawerExecutionIdRef.current = drawerExecutionId;
  }, [drawerExecutionId]);

  const openDrawer = useCallback((executionId?: string) => {
    setDrawerOpen(true);
    setDrawerExecutionId(executionId ?? null);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawerExecutionId(null);
  }, []);

  const registerQueuedExecution = useCallback(
    (
      queued: QueuedExecutionView,
      meta: {
        readonly contentTypeLabel: string;
        readonly briefing?: Record<string, unknown>;
        readonly language?: string;
        readonly qualityMode?: ActiveExecutionItem["qualityMode"];
      }
    ) => {
      dispatch({
        type: "add",
        item: {
          id: queued.jobId,
          contentType: queued.contentType,
          contentTypeLabel: meta.contentTypeLabel,
          status: "queued",
          progress: null,
          result: null,
          error: null,
          createdAt: queued.createdAt,
          briefing: meta.briefing,
          language: meta.language,
          qualityMode: meta.qualityMode
        }
      });
    },
    []
  );

  const refreshExecution = useCallback(
    async (executionId: string) => {
      const snapshot = await client.toPromise(client.executions.get({ executionId }));
      dispatch({
        type: "patch",
        id: executionId,
        patch: {
          status: snapshot.status,
          progress: snapshot.progress,
          result: snapshot.result,
          error: snapshot.error
        }
      });
    },
    [client]
  );

  useEffect(() => {
    for (const item of items) {
      if (item.status !== "queued" && item.status !== "running") {
        continue;
      }

      if (watchesRef.current.has(item.id)) {
        continue;
      }

      const handle = client.executions.watch({
        executionId: item.id,
        onTransition: (transition) => {
          if (transition.type === "started" || transition.type === "progressed") {
            dispatch({
              type: "patch",
              id: item.id,
              patch: {
                status: "running",
                progress: transition.progress
              }
            });
            return;
          }

          if (transition.type === "completed") {
            dispatch({
              type: "patch",
              id: item.id,
              patch: {
                status: "done",
                result: transition.result
              }
            });

            if (drawerExecutionIdRef.current !== item.id) {
              push({
                title: messages.notifications.readyTitle,
                actionLabel: messages.notifications.readyAction,
                onAction: () => {
                  setDrawerOpen(true);
                  setDrawerExecutionId(item.id);
                }
              });
            }
            return;
          }

          dispatch({
            type: "patch",
            id: item.id,
            patch: {
              status: "failed",
              error: transition.error
            }
          });
        },
        onObservationFailure: () => {
          const mapped = messages.errors.observationFailure;
          push({
            title: mapped.title,
            actionLabel: mapped.action,
            onAction: () => {
              void refreshExecution(item.id).catch(() => undefined);
            }
          });
        }
      });

      watchesRef.current.set(item.id, handle);
    }

    for (const [executionId, handle] of watchesRef.current.entries()) {
      const current = items.find((item) => item.id === executionId);
      if (!current || (current.status !== "queued" && current.status !== "running")) {
        handle.stop();
        watchesRef.current.delete(executionId);
      }
    }
  }, [client, items, messages, push, refreshExecution]);

  useEffect(() => {
    return () => {
      for (const handle of watchesRef.current.values()) {
        handle.stop();
      }
      watchesRef.current.clear();
    };
  }, []);

  const inFlightCount = useMemo(
    () => items.filter((item) => item.status === "queued" || item.status === "running").length,
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      inFlightCount,
      drawerOpen,
      drawerExecutionId,
      openDrawer,
      closeDrawer,
      registerQueuedExecution,
      refreshExecution
    }),
    [
      closeDrawer,
      drawerOpen,
      drawerExecutionId,
      inFlightCount,
      items,
      openDrawer,
      refreshExecution,
      registerQueuedExecution
    ]
  );

  return <ActiveExecutionContext.Provider value={value}>{children}</ActiveExecutionContext.Provider>;
}

export function useActiveExecutions(): ActiveExecutionContextValue {
  const context = useContext(ActiveExecutionContext);
  if (!context) {
    throw new Error("useActiveExecutions must be used within ActiveExecutionProvider");
  }

  return context;
}

export function formatActiveExecutionError(error: unknown, messages: ReturnType<typeof useAppLocale>["messages"]) {
  return formatSdkError(error, messages);
}
