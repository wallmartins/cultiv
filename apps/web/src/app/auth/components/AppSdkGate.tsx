import { useAuth0 } from "@auth0/auth0-react";
import { Button, Text } from "@my-ai-orchestrator/ui";
import { type ReactNode } from "react";
import { AuthLoading } from "~/app/auth/components/AuthLoading";
import { useRetrySdkSession, useSdkSessionStatus } from "~/platform/runtime/client-sdk-context";

export interface AppSdkGateProps {
  readonly children: ReactNode;
}

export function AppSdkGate({ children }: AppSdkGateProps) {
  const { logout } = useAuth0();
  const sessionStatus = useSdkSessionStatus();
  const retrySession = useRetrySdkSession();

  if (sessionStatus === "preparing" || sessionStatus === "idle") {
    return <AuthLoading message="Preparando sessão…" />;
  }

  if (sessionStatus === "failed") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-[var(--spacing-gutter)] py-16 text-center">
        <Text variant="body" className="max-w-md text-ink-muted">
          Não foi possível preparar a sessão com o backend. Verifique se o servidor está em execução e se o
          audience do Auth0 está correto.
        </Text>
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" size="compact" onClick={retrySession}>
            Tentar novamente
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={() =>
              void logout({
                logoutParams: {
                  returnTo: `${window.location.origin}/login`
                }
              })
            }
          >
            Sair e entrar de novo
          </Button>
        </div>
      </div>
    );
  }

  return children;
}
