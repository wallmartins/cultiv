import { useAuth0 } from "@auth0/auth0-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { AuthLoading } from "~/app/auth/components/AuthLoading";
import { AuthNotConfigured } from "~/app/auth/components/AuthNotConfigured";
import { consumeAuthReturnTo } from "~/app/auth/components/ClientAuthProviders";
import { isWebAuthConfigured } from "~/app/auth/lib/auth-config";
import { resolvePostLoginNavigation } from "~/app/auth/lib/resolve-post-login-navigation";
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
  const client = useOptionalClientSdk();
  const sessionStatus = useSdkSessionStatus();
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !client || !user?.sub || redirected.current) {
      return;
    }

    redirected.current = true;
    const intendedPath = consumeAuthReturnTo();

    void resolvePostLoginNavigation(client, { userId: user.sub, intendedPath }).then((path) => {
      void navigate({ to: path });
    });
  }, [client, isAuthenticated, isLoading, navigate, user?.sub]);

  if (error) {
    return (
      <AuthLoading message="Não foi possível concluir o login. Tente novamente em /login." />
    );
  }

  if (isAuthenticated && sessionStatus === "failed") {
    return (
      <AuthLoading message="Não foi possível preparar a sessão. Volte para /login e tente novamente." />
    );
  }

  return <AuthLoading message="Finalizando login…" />;
}
