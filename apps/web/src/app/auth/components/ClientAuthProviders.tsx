import { Auth0Provider } from "@auth0/auth0-react";
import { useEffect, useState, type ReactNode } from "react";
import { getAuthCallbackUrl, isWebAuthConfigured, readWebAuthConfig } from "~/app/auth/lib/auth-config";
import { API_ACCESS_SCOPES } from "~/app/auth/lib/use-api-access-token";
import { ClientSdkProvider } from "~/platform/runtime/client-sdk-context";
import { isAuthSurfacePath } from "~/app/auth/lib/is-auth-surface-path";
import { AuthLoading } from "./AuthLoading";

const AUTH_RETURN_TO_KEY = "cultiv.auth.returnTo";

export function consumeAuthReturnTo(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const value = window.sessionStorage.getItem(AUTH_RETURN_TO_KEY) ?? undefined;
  window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  return value;
}

export interface ClientAuthProvidersProps {
  readonly children: ReactNode;
}

export function ClientAuthProviders({ children }: ClientAuthProvidersProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    if (isAuthSurfacePath(pathname)) {
      return <AuthLoading />;
    }
    return children;
  }

  const config = readWebAuthConfig();
  if (!config || !isWebAuthConfigured()) {
    return children;
  }

  return (
    <Auth0Provider
      domain={config.domain}
      clientId={config.clientId}
      authorizationParams={{
        redirect_uri: getAuthCallbackUrl(),
        audience: config.audience,
        scope: API_ACCESS_SCOPES
      }}
      cacheLocation="memory"
      useRefreshTokens
      onRedirectCallback={(appState) => {
        const returnTo = typeof appState?.returnTo === "string" ? appState.returnTo : undefined;
        if (returnTo) {
          window.sessionStorage.setItem(AUTH_RETURN_TO_KEY, returnTo);
        }
      }}
    >
      <ClientSdkProvider config={config}>{children}</ClientSdkProvider>
    </Auth0Provider>
  );
}
