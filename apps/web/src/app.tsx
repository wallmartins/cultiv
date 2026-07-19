import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { RuntimeProvider, type AppRuntime } from "@my-ai-orchestrator/shared/light";
import { router, type AppAuth } from "./router.js";
import { loadRuntime } from "./runtime-loader.js";
import { queryClient } from "./query-client.js";

export function App() {
  const auth0 = useAuth0();
  const [runtime, setRuntime] = useState<AppRuntime>();
  const [runtimeFailed, setRuntimeFailed] = useState(false);

  // Uma promessa memoizada (runtime-loader): beforeLoad e os hooks recebem a MESMA instância, do
  // contrário haveria dois caches de SDK. getAccessTokenSilently é estável entre renders.
  const requestRuntime = useCallback(() => loadRuntime(() => auth0.getAccessTokenSilently()), []);

  // Só quem tem sessão precisa do runtime. Visitante sem login é redirecionado pro Auth0 pelo
  // beforeLoad e nunca paga por Effect/client-sdk.
  useEffect(() => {
    if (!auth0.isAuthenticated) return;
    let alive = true;
    void requestRuntime().then(
      (loaded) => {
        if (alive) setRuntime(loaded);
      },
      // Sem isto o app fica no "Carregando…" para sempre: o gate abaixo espera o runtime, e uma
      // rejeição silenciosa nunca o resolve.
      () => {
        if (alive) setRuntimeFailed(true);
      }
    );
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

  // Autenticado sem runtime = ele ainda está descendo; as superfícies leem o runtime pelos hooks,
  // então montar o router antes disso quebraria a primeira que renderizasse. Uma condição só:
  // quem invalida abaixo precisa concordar com o que é renderizado, senão o router roda sem
  // context.
  const routerMounted = !auth0.isLoading && (!auth0.isAuthenticated || runtime !== undefined);

  // Re-runs the shell's beforeLoad gate on login/logout. Só depois que o RouterProvider montou:
  // é ele quem injeta o context real (router.update, no render), então invalidar antes disso faz
  // beforeLoad ler o placeholder do createRouter — auth undefined. O primeiro load é do mount.
  const loadedOnce = useRef(false);
  useEffect(() => {
    if (!routerMounted) return;
    if (loadedOnce.current) router.invalidate();
    else loadedOnce.current = true;
  }, [routerMounted, auth.isAuthenticated]);

  // Recarregar, e não só tentar de novo: a causa provável é um deploy novo que trocou os hashes
  // dos chunks, e só um index.html fresco aponta pros que existem.
  if (runtimeFailed) {
    return (
      <p role="alert">
        Não foi possível carregar o app.{" "}
        <button type="button" onClick={() => window.location.reload()}>
          Recarregar
        </button>
      </p>
    );
  }

  if (!routerMounted) {
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
