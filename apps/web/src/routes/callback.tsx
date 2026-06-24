import { useAuth0 } from "@auth0/auth0-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { AuthLoading } from "~/app/auth/components/AuthLoading";
import { AuthNotConfigured } from "~/app/auth/components/AuthNotConfigured";
import { consumeAuthReturnTo } from "~/app/auth/components/ClientAuthProviders";
import { isWebAuthConfigured } from "~/app/auth/lib/auth-config";
import { resolvePostLoginNavigation } from "~/app/auth/lib/resolve-post-login-navigation";
import { useRelogin } from "~/app/auth/lib/use-relogin";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useOptionalClientSdk, useSdkSessionStatus } from "~/platform/runtime/client-sdk-context";

export const Route = createFileRoute("/callback")({
  component: CallbackPage
});

function CallbackPage() {
  if (!isWebAuthConfigured()) {
    return <AuthNotConfigured />;
  }

  return <CallbackPageContent />;
}

function CallbackPageContent() {
  const { isAuthenticated, isLoading, error, user } = useAuth0();
  const { messages } = useAppLocale();
  const client = useOptionalClientSdk();
  const sessionStatus = useSdkSessionStatus();
  const relogin = useRelogin();
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    if (!isLoading && sessionStatus === "auth_expired") {
      relogin();
      return;
    }

    if (isLoading || !isAuthenticated || !client || !user?.sub || redirected.current) {
      return;
    }

    redirected.current = true;
    const intendedPath = consumeAuthReturnTo();

    void resolvePostLoginNavigation(client, { userId: user.sub, intendedPath }).then((path) => {
      void navigate({ to: path });
    });
  }, [client, isAuthenticated, isLoading, navigate, relogin, sessionStatus, user?.sub]);

  if (error) {
    return <AuthLoading message={messages.auth.loginFailed} />;
  }

  if (sessionStatus === "auth_expired") {
    return <AuthLoading message={messages.auth.redirectingToLogin} />;
  }

  if (isAuthenticated && sessionStatus === "failed") {
    return <AuthLoading message={messages.auth.sessionPrepareFailedCallback} />;
  }

  return <AuthLoading message={messages.auth.finishingLogin} />;
}
