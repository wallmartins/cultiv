import { useEffect } from "react";
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  useNavigate
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Effect } from "effect";
import { ClientSdkService, type ClientSdk, type ClientSdkError } from "@my-ai-orchestrator/client-sdk";
import type { LogoutOptions, RedirectLoginOptions, User as Auth0User } from "@auth0/auth0-react";
import { deriveAppMode, queryKeys, useUnreadStore, type AppMode, type AppRuntime } from "@my-ai-orchestrator/shared";
import { queryClient } from "./query-client.js";
import { WorkspaceShellContainer } from "./shell/WorkspaceShellContainer.js";
import { GenerateContainer } from "./routes/generate.js";
import { ExecutionDetailContainer } from "./routes/g.$id.js";
import { PlansRoute as PlansContainer } from "./routes/plans.js";
import { BillingRoute as BillingContainer } from "./routes/billing.js";
import { VoiceContainer } from "./routes/voice.js";
import { SettingsContainer } from "./routes/settings.js";
import { CalibrateContainer } from "./routes/calibrate.js";

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
  readonly runtime: AppRuntime;
}

// packages/shared's hooks reach the SDK through useRun() (a hook), which beforeLoad/loader can't
// call — this mirrors hooks/with-sdk.ts's withSdk() + useRun()'s runtime.runPromise() inline.
function runSdk<A>(runtime: AppRuntime, f: (sdk: ClientSdk) => Effect.Effect<A, ClientSdkError>): Promise<A> {
  return runtime.runPromise(Effect.flatMap(ClientSdkService, f));
}

// Seeds the same query keys useOnboarding/useConsentStatus/useVoiceProfile read, so the shell's
// gate and the surfaces that later mount under it share one fetch.
async function resolveAppMode(qc: QueryClient, runtime: AppRuntime): Promise<AppMode> {
  const [onboarding, consent, voiceProfile] = await Promise.all([
    qc.ensureQueryData({
      queryKey: queryKeys.onboarding(),
      queryFn: () => runSdk(runtime, (sdk) => sdk.onboarding.getStatus())
    }),
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

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />
});

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
    if (!auth.isLoading) {
      void navigate({ to: "/generate" });
    }
  }, [auth.isLoading, navigate]);

  return null;
}

const calibrateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calibrate",
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      await context.auth.loginWithRedirect({ appState: { returnTo: location.href } });
    }
  },
  component: CalibrateContainer
});

const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_shell",
  beforeLoad: async ({ context, location }) => {
    const { auth, queryClient: qc, runtime } = context;
    if (!auth.isAuthenticated) {
      await auth.loginWithRedirect({ appState: { returnTo: location.href } });
      return { appMode: "locked" as const }; // unreachable — loginWithRedirect navigates away
    }

    const appMode = await resolveAppMode(qc, runtime);
    if (appMode === "calibrate") {
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
    const execution = await context.queryClient.ensureQueryData({
      queryKey: queryKeys.execution(params.executionId),
      queryFn: () => runSdk(context.runtime, (sdk) => sdk.executions.get({ executionId: params.executionId }))
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
    runtime: undefined!
  },
  defaultPreload: "intent"
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
