import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { createClientSdk, type ClientSdk } from "@my-ai-orchestrator/client-sdk";
import type { WebAuthConfig } from "~/app/auth/lib/auth-config";
import { isAuthSessionExpiredError } from "~/app/auth/lib/is-auth-session-expired";
import { useApiAccessToken } from "~/app/auth/lib/use-api-access-token";

const SESSION_PREP_TIMEOUT_MS = 15_000;

export type SdkSessionStatus = "idle" | "preparing" | "ready" | "failed" | "auth_expired";

export interface ClientSdkContextValue {
  readonly client: ClientSdk | null;
  readonly sessionStatus: SdkSessionStatus;
  readonly retrySession: () => void;
}

const ClientSdkContext = createContext<ClientSdkContextValue>({
  client: null,
  sessionStatus: "idle",
  retrySession: () => {}
});

export interface ClientSdkProviderProps {
  readonly config: WebAuthConfig;
  readonly children: ReactNode;
}

export function ClientSdkProvider({ config, children }: ClientSdkProviderProps) {
  const { isAuthenticated, isLoading } = useAuth0();
  const getToken = useApiAccessToken(config.audience);
  const [sessionStatus, setSessionStatus] = useState<SdkSessionStatus>("idle");
  const [prepareAttempt, setPrepareAttempt] = useState(0);

  const retrySession = useCallback(() => {
    setPrepareAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      setSessionStatus("idle");
      return;
    }

    let cancelled = false;
    setSessionStatus("preparing");

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setSessionStatus("failed");
      }
    }, SESSION_PREP_TIMEOUT_MS);

    void getToken()
      .then(() => {
        if (!cancelled) {
          window.clearTimeout(timeoutId);
          setSessionStatus("ready");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          window.clearTimeout(timeoutId);
          setSessionStatus(isAuthSessionExpiredError(error) ? "auth_expired" : "failed");
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [getToken, isAuthenticated, isLoading, prepareAttempt]);

  const client = useMemo(() => {
    if (!isAuthenticated || isLoading || sessionStatus !== "ready") {
      return null;
    }

    return createClientSdk({
      baseUrl: config.apiBaseUrl,
      getToken
    });
  }, [config.apiBaseUrl, getToken, isAuthenticated, isLoading, sessionStatus]);

  const value = useMemo(
    () => ({
      client,
      sessionStatus,
      retrySession
    }),
    [client, retrySession, sessionStatus]
  );

  return <ClientSdkContext.Provider value={value}>{children}</ClientSdkContext.Provider>;
}

function useClientSdkContext(): ClientSdkContextValue {
  return useContext(ClientSdkContext);
}

export function useSdkSessionStatus(): SdkSessionStatus {
  return useClientSdkContext().sessionStatus;
}

export function useRetrySdkSession(): () => void {
  return useClientSdkContext().retrySession;
}

export function useClientSdk(): ClientSdk {
  const { client } = useClientSdkContext();
  if (!client) {
    throw new Error("Client SDK is unavailable until the user is authenticated.");
  }

  return client;
}

export function useOptionalClientSdk(): ClientSdk | null {
  return useClientSdkContext().client;
}
