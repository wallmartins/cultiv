import { Suspense, lazy, useEffect, useState } from "react";
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
  useNavigate
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import type { Effect } from "effect";
import type { ClientSdk, ClientSdkError } from "@my-ai-orchestrator/client-sdk";
import type { LogoutOptions, RedirectLoginOptions, User as Auth0User } from "@auth0/auth0-react";
// "/light" e não o barrel: o barrel reexporta makeAppRuntime (ManagedRuntime) e traria
// Effect + client-sdk pro chunk inicial. Ver packages/shared/src/light.ts.
import {
  deriveAppMode,
  hasVoiceProfile,
  queryKeys,
  useUnreadStore,
  type AppMode,
  type AppRuntime
} from "@my-ai-orchestrator/shared/light";
import { queryClient } from "./query-client.js";
import { readPendingCheckout } from "./routes/pending-checkout-storage.js";
import { BrandError, BrandLoader } from "./boot-states.js";

// Cada superfície vira um chunk próprio: o primeiro carregamento (que muitas vezes só redireciona
// pro Auth0) não paga por telas que o autor ainda não abriu. As rotas continuam declaradas aqui,
// só o componente é que desce sob demanda.
const WorkspaceShellContainer = lazyRouteComponent(
  () => import("./shell/WorkspaceShellContainer.js"),
  "WorkspaceShellContainer"
);
const GenerateContainer = lazyRouteComponent(() => import("./routes/generate.js"), "GenerateContainer");
const ExecutionDetailContainer = lazyRouteComponent(() => import("./routes/g.$id.js"), "ExecutionDetailContainer");
const PlansContainer = lazyRouteComponent(() => import("./routes/plans.js"), "PlansRoute");
const BillingContainer = lazyRouteComponent(() => import("./routes/billing.js"), "BillingRoute");
const VoiceContainer = lazyRouteComponent(() => import("./routes/voice.js"), "VoiceContainer");
const SettingsContainer = lazyRouteComponent(() => import("./routes/settings.js"), "SettingsContainer");
const CalibrateContainer = lazyRouteComponent(() => import("./routes/calibrate.js"), "CalibrateContainer");
const PendingCheckoutWatcher = lazy(() => import("./routes/pending-checkout.js"));

export interface AppAuth {
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly user?: Auth0User;
  readonly getAccessTokenSilently: () => Promise<string>;
  readonly loginWithRedirect: (options?: RedirectLoginOptions) => Promise<void>;
  readonly logout: (options?: LogoutOptions) => Promise<void>;
}

export interface RouterContext {
  readonly queryClient: QueryClient;
  readonly auth: AppAuth;
  // Função, não valor: o runtime carrega sob demanda (runtime-loader.ts), então quem precisa dele
  // aguarda aqui em vez de forçá-lo para dentro do chunk inicial.
  readonly loadRuntime: () => Promise<AppRuntime>;
}

// packages/shared's hooks reach the SDK through useRun() (a hook), which beforeLoad/loader can't
// call — this mirrors hooks/with-sdk.ts's withSdk() + useRun()'s runtime.runPromise() inline.
// Effect e o client-sdk entram por import dinâmico: já estão em memória quando o runtime existe,
// e ficam fora do carregamento inicial de quem só vai ser redirecionado pro login.
async function runSdk<A>(
  runtime: AppRuntime,
  f: (sdk: ClientSdk) => Effect.Effect<A, ClientSdkError>
): Promise<A> {
  // "effect/Effect", não "effect": o barrel raiz reexporta 179 módulos e um import dinâmico dele
  // desliga o tree-shaking (o chunk vai de ~190 kB para ~926 kB — medido).
  const [E, { ClientSdkService }] = await Promise.all([
    import("effect/Effect"),
    import("@my-ai-orchestrator/client-sdk")
  ]);
  return runtime.runPromise(E.flatMap(ClientSdkService, f));
}

// The shell gate. A brand-new author hasn't finished onboarding and has no Voice Profile yet, so
// GET /me/voice-profile 404s — that's expected. Don't fetch it until onboarding is complete: an
// incomplete author is sent to /calibrate, and only a *completed* author's missing profile is a real
// inconsistency worth surfacing (the fetch rejects → the route's error screen takes over). Fetching
// the profile before we know onboarding status is what put the raw 404 on every first-run screen.
async function resolveAppMode(qc: QueryClient, runtime: AppRuntime): Promise<AppMode> {
  const onboarding = await qc.ensureQueryData({
    queryKey: queryKeys.onboarding(),
    queryFn: () => runSdk(runtime, (sdk) => sdk.onboarding.getStatus())
  });
  if (!onboarding?.completed) {
    return "calibrate";
  }

  // Onboarding done: seed the same query keys useConsentStatus/useVoiceProfile read, so the shell
  // and the surfaces that mount under it share one fetch.
  const [consent, voiceProfile] = await Promise.all([
    qc.ensureQueryData({
      queryKey: queryKeys.voiceConsent(),
      queryFn: () => runSdk(runtime, (sdk) => sdk.voice.getConsentStatus())
    }),
    qc.ensureQueryData({
      queryKey: queryKeys.voiceProfile(),
      queryFn: () => runSdk(runtime, (sdk) => sdk.voice.getProfile())
    })
  ]);

  return deriveAppMode(onboarding, consent, voiceProfile.diagnostics);
}

// Only reached when appMode !== "calibrate" (onboarding complete), so resolveAppMode already cached
// the profile — this is a cache read, and a genuine 404 here would have failed the gate above first.
async function resolveHasVoiceProfile(qc: QueryClient, runtime: AppRuntime): Promise<boolean> {
  const voiceProfile = await qc.ensureQueryData({
    queryKey: queryKeys.voiceProfile(),
    queryFn: () => runSdk(runtime, (sdk) => sdk.voice.getProfile())
  });
  return hasVoiceProfile(voiceProfile);
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout
});

function RootLayout() {
  // Ler o handle é síncrono e sem dependências; o watcher em si (SDK + overlay) só desce quando
  // existe mesmo um checkout aguardando confirmação — o caso raro. Exige sessão: os hooks dele
  // leem o runtime, que só existe depois do login.
  const { auth } = rootRoute.useRouteContext();
  const [hasPendingCheckout] = useState(() => Boolean(readPendingCheckout()));
  const watchCheckout = hasPendingCheckout && auth.isAuthenticated;

  return (
    <>
      <Outlet />
      {watchCheckout ? (
        <Suspense fallback={null}>
          <PendingCheckoutWatcher />
        </Suspense>
      ) : null}
    </>
  );
}

// Auth0 devolve o appState só pro onRedirectCallback (main.tsx), que roda fora da árvore do
// router — este handoff leva o destino original até a rota /callback.
let pendingReturnTo: string | undefined;

export function captureReturnTo(returnTo: unknown): void {
  pendingReturnTo = typeof returnTo === "string" ? returnTo : undefined;
}

const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/callback",
  component: CallbackRoute
});

function CallbackRoute() {
  const { auth } = callbackRoute.useRouteContext();
  const navigate = useNavigate();

  // Auth0Provider processes the redirect (code exchange) itself; once it settles, move on.
  useEffect(() => {
    if (auth.isLoading) return;
    const returnTo = pendingReturnTo;
    pendingReturnTo = undefined;
    // Todo CTA da landing aponta pra /calibrate (apps/landing/src/config.ts: trialUrl), então
    // esse returnTo não é um destino escolhido — é só "entrar no app". Manda pro /generate e
    // deixa o gate do shell devolver pra /calibrate quem de fato ainda não calibrou.
    if (!returnTo || new URL(returnTo, window.location.origin).pathname.endsWith("/calibrate")) {
      void navigate({ to: "/generate" });
      return;
    }
    // beforeLoad guarda location.href (já sem o basepath). Passar isso inteiro como `to` monta um
    // pathname com a query grudada e `search` vazio — só volta ao normal porque o commit
    // re-parseia a URL. Separar aqui não depende dessa normalização.
    const url = new URL(returnTo, window.location.origin);
    void navigate({ to: url.pathname, search: Object.fromEntries(url.searchParams) });
  }, [auth.isLoading, navigate]);

  return null;
}

const calibrateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calibrate",
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      await context.auth.loginWithRedirect({ appState: { returnTo: location.href } });
      return;
    }
    const runtime = await context.loadRuntime();
    // O gate do shell manda pra cá enquanto appMode === "calibrate"; sair daqui nesse modo
    // devolveria o usuário pro shell, que redirecionaria de volta — ping-pong infinito. Só quem
    // já saiu do modo calibrate pode ser desviado.
    if ((await resolveAppMode(context.queryClient, runtime)) === "calibrate") {
      return;
    }
    // Quem já tem voz não recalibra pela URL: o único caminho de recalibração é o "Recalibrar"
    // de /voice (overlay leve). Entrar aqui abriria o wizard cheio e queimaria uma das
    // tentativas limitadas do plano (voice-calibration-service.ts: maxWizards).
    if (await resolveHasVoiceProfile(context.queryClient, runtime)) {
      throw redirect({ to: "/voice" });
    }
  },
  component: CalibrateContainer
});

const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_shell",
  beforeLoad: async ({ context, location }) => {
    const { auth, queryClient: qc } = context;
    if (!auth.isAuthenticated) {
      await auth.loginWithRedirect({ appState: { returnTo: location.href } });
      return { appMode: "locked" as const }; // unreachable — loginWithRedirect navigates away
    }

    const appMode = await resolveAppMode(qc, await context.loadRuntime());
    // Quem chega decidido pela landing (card de plano) assina antes de calibrar — só /plans
    // escapa do gate; toda outra rota continua atrás dele.
    if (appMode === "calibrate" && !location.pathname.endsWith("/plans")) {
      throw redirect({ to: "/calibrate" });
    }
    return { appMode };
  },
  component: ShellLayout
});

function ShellLayout() {
  return (
    <WorkspaceShellContainer>
      <Outlet />
    </WorkspaceShellContainer>
  );
}

const shellIndexRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/generate" });
  }
});

const generateRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/generate",
  component: GenerateContainer
});

const executionDetailRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/g/$executionId",
  // Forces a fresh ExecutionDetailContainer (and its useState) per execution — otherwise
  // navigating between two executions reuses the instance and stale per-generation UI state
  // (e.g. the voice alignment band) leaks across generations.
  remountDeps: ({ params }) => params.executionId,
  loader: async ({ context, params }) => {
    const runtime = await context.loadRuntime();
    const execution = await context.queryClient.ensureQueryData({
      queryKey: queryKeys.execution(params.executionId),
      queryFn: () => runSdk(runtime, (sdk) => sdk.executions.get({ executionId: params.executionId }))
    });
    useUnreadStore.getState().markRead(params.executionId);
    return execution;
  },
  component: ExecutionDetailContainer
});

const voiceRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/voice",
  component: VoiceContainer
});

const settingsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/settings",
  component: SettingsContainer
});

const plansRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/plans",
  component: PlansContainer
});

const billingRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/billing",
  component: BillingContainer
});

const routeTree = rootRoute.addChildren([
  callbackRoute,
  calibrateRoute,
  shellRoute.addChildren([
    shellIndexRoute,
    generateRoute,
    executionDetailRoute,
    voiceRoute,
    settingsRoute,
    plansRoute,
    billingRoute
  ])
]);

export const router = createRouter({
  routeTree,
  basepath: "/app",
  // auth/runtime only exist once Auth0Provider/makeAppRuntime mount in main.tsx (F4) — it
  // overrides these via <RouterProvider context={{queryClient, auth, runtime}}/>.
  context: {
    queryClient,
    auth: undefined!,
    loadRuntime: undefined!
  },
  defaultPreload: "intent",
  // Com as superfícies em chunks separados, uma navegação pode esperar um download. O padrão de
  // defaultPendingMs (1s) segura este aviso: carregamento rápido não pisca nada na tela.
  defaultPendingComponent: () => <BrandLoader />,
  // Sem isto, um loader que rejeita (ex.: o GET da execução em /g/$id) não renderiza nada: a URL
  // já mudou e a tela fica em branco, com o erro só no console. BrandError (boot-states, local ao
  // apps/web — não puxa o chunk de packages/ui) mapeia o ClientSdkError para uma mensagem amigável
  // em vez de despejar o "Failed to fetch" cru; reset re-executa o loader.
  defaultErrorComponent: ({ error, reset }) => <BrandError error={error} onRetry={reset} />
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
