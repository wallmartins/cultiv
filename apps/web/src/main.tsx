import "@my-ai-orchestrator/ui/styles.css";
import "@my-ai-orchestrator/ui/type.css";
import "@my-ai-orchestrator/ui/primitives.css";
import "@my-ai-orchestrator/ui/workspace.css";
import "@my-ai-orchestrator/ui/shell.css";

import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { RuntimeProvider, type AppRuntime } from "@my-ai-orchestrator/shared/light";
import { captureReturnTo, router, type AppAuth } from "./router.js";
import { loadRuntime } from "./runtime-loader.js";
import { queryClient } from "./query-client.js";

function App() {
  const auth0 = useAuth0();
  const [runtime, setRuntime] = useState<AppRuntime>();

  // Uma promessa memoizada (runtime-loader): beforeLoad e os hooks recebem a MESMA instância, do
  // contrário haveria dois caches de SDK. getAccessTokenSilently é estável entre renders.
  const requestRuntime = useCallback(() => loadRuntime(() => auth0.getAccessTokenSilently()), []);

  // Só quem tem sessão precisa do runtime. Visitante sem login é redirecionado pro Auth0 pelo
  // beforeLoad e nunca paga por Effect/client-sdk.
  useEffect(() => {
    if (!auth0.isAuthenticated) return;
    let alive = true;
    void requestRuntime().then((loaded) => {
      if (alive) setRuntime(loaded);
    });
    return () => {
      alive = false;
    };
  }, [auth0.isAuthenticated, requestRuntime]);

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

  // Autenticado sem runtime = ele ainda está descendo; as superfícies leem o runtime pelos hooks,
  // então montar o router antes disso quebraria a primeira que renderizasse.
  if (auth0.isLoading || (auth0.isAuthenticated && !runtime)) {
    return <p>Carregando…</p>;
  }

  const routerTree = (
    <RouterProvider router={router} context={{ queryClient, auth, loadRuntime: requestRuntime }} />
  );

  return (
    <QueryClientProvider client={queryClient}>
      {runtime ? <RuntimeProvider runtime={runtime}>{routerTree}</RuntimeProvider> : routerTree}
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
      onRedirectCallback={(appState) => captureReturnTo(appState?.returnTo)}
    >
      <App />
    </Auth0Provider>
  </StrictMode>
);
