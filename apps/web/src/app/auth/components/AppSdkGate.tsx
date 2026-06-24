import { useAuth0 } from "@auth0/auth0-react";
import { Button, Text } from "@my-ai-orchestrator/ui";
import { type ReactNode } from "react";
import { AuthLoading } from "~/app/auth/components/AuthLoading";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useRetrySdkSession, useSdkSessionStatus } from "~/platform/runtime/client-sdk-context";

export interface AppSdkGateProps {
  readonly children: ReactNode;
}

export function AppSdkGate({ children }: AppSdkGateProps) {
  const { logout } = useAuth0();
  const { messages } = useAppLocale();
  const sessionStatus = useSdkSessionStatus();
  const retrySession = useRetrySdkSession();

  if (sessionStatus === "preparing" || sessionStatus === "idle") {
    return <AuthLoading message={messages.auth.preparingSession} />;
  }

  if (sessionStatus === "failed") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-[var(--spacing-gutter)] py-16 text-center">
        <Text variant="body" className="max-w-md text-ink-muted">
          {messages.auth.sessionPrepareFailed}
        </Text>
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" size="compact" onClick={retrySession}>
            {messages.shell.sdk.retry}
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
            {messages.auth.logoutAndSignInAgain}
          </Button>
        </div>
      </div>
    );
  }

  return children;
}
