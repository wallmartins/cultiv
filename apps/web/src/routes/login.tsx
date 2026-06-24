import { useAuth0 } from "@auth0/auth0-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { AuthLoading } from "~/app/auth/components/AuthLoading";
import { AuthNotConfigured } from "~/app/auth/components/AuthNotConfigured";
import { isWebAuthConfigured } from "~/app/auth/lib/auth-config";
import { resolvePostLoginNavigation } from "~/app/auth/lib/resolve-post-login-navigation";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useOptionalClientSdk, useSdkSessionStatus } from "~/platform/runtime/client-sdk-context";

export const Route = createFileRoute("/login")({
  component: LoginPage
});

function LoginPage() {
  if (!isWebAuthConfigured()) {
    return <AuthNotConfigured />;
  }

  return <LoginPageContent />;
}

function LoginPageContent() {
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
  const { messages } = useAppLocale();
  const client = useOptionalClientSdk();
  const sessionStatus = useSdkSessionStatus();
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated && client && user?.sub) {
      if (redirected.current) {
        return;
      }

      redirected.current = true;
      void resolvePostLoginNavigation(client, { userId: user.sub }).then((path) => {
        void navigate({ to: path });
      });
      return;
    }

    if (!isAuthenticated) {
      void loginWithRedirect({
        appState: {
          returnTo: "/app/generate"
        }
      });
    }
  }, [client, isAuthenticated, isLoading, loginWithRedirect, navigate, user?.sub]);

  if (isAuthenticated && sessionStatus === "failed") {
    return <AuthLoading message={messages.auth.sessionPrepareFailedLogin} />;
  }

  return <AuthLoading message={messages.auth.openingLogin} />;
}
