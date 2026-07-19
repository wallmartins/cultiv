import "@my-ai-orchestrator/ui/styles.css";
import "@my-ai-orchestrator/ui/type.css";
import "@my-ai-orchestrator/ui/primitives.css";
import "@my-ai-orchestrator/ui/workspace.css";
import "@my-ai-orchestrator/ui/shell.css";

import { StrictMode, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { makeAppRuntime, RuntimeProvider } from "@my-ai-orchestrator/shared";
import { router, type AppAuth } from "./router.js";
import { queryClient } from "./query-client.js";

function App() {
  const auth0 = useAuth0();

  // Built once (empty deps) — beforeLoad's runtime.runPromise() needs the same instance
  // RuntimeProvider hands to hooks. getAccessTokenSilently is stable across renders.
  const runtime = useMemo(
    () =>
      makeAppRuntime({
        baseUrl: import.meta.env.VITE_API_URL,
        getToken: () => auth0.getAccessTokenSilently()
      }),
    []
  );

  const auth: AppAuth = {
    isLoading: auth0.isLoading,
    isAuthenticated: auth0.isAuthenticated,
    user: auth0.user,
    getAccessTokenSilently: () => auth0.getAccessTokenSilently(),
    loginWithRedirect: auth0.loginWithRedirect,
    logout: auth0.logout
  };

  // Re-runs the shell's beforeLoad gate on login/logout; skipped while auth is still resolving.
  useEffect(() => {
    if (!auth0.isLoading) {
      router.invalidate();
    }
  }, [auth0.isLoading, auth.isAuthenticated]);

  if (auth0.isLoading) {
    return <p>Carregando…</p>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider runtime={runtime}>
        <RouterProvider router={router} context={{ queryClient, auth, runtime }} />
      </RuntimeProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/app/callback`,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE
      }}
      cacheLocation="localstorage"
      useRefreshTokens
    >
      <App />
    </Auth0Provider>
  </StrictMode>
);
