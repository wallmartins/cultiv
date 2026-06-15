import { Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "~/app/shell/AppShell";
import { AuthNotConfigured } from "~/app/auth/components/AuthNotConfigured";
import { OnboardingGate } from "~/app/auth/components/OnboardingGate";
import { AppSdkGate } from "~/app/auth/components/AppSdkGate";
import { RequireAuth } from "~/app/auth/components/RequireAuth";
import { isWebAuthConfigured } from "~/app/auth/lib/auth-config";
import { isOnboardingRoute } from "~/app/auth/lib/is-onboarding-route";
import { OnboardingLayout } from "~/app/layouts/OnboardingLayout";

export function AppLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const onboarding = isOnboardingRoute(pathname);

  if (!isWebAuthConfigured()) {
    return <AuthNotConfigured />;
  }

  return (
    <RequireAuth>
      <AppSdkGate>
        {onboarding ? (
          <OnboardingLayout>
            <Outlet />
          </OnboardingLayout>
        ) : (
          <OnboardingGate>
            <AppShell>
              <Outlet />
            </AppShell>
          </OnboardingGate>
        )}
      </AppSdkGate>
    </RequireAuth>
  );
}
