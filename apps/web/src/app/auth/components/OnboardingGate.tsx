import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { resolvePostLoginNavigation } from "~/app/auth/lib/resolve-post-login-navigation";
import { isOnboardingComplete } from "~/app/onboarding/lib/onboarding-flags";
import { APP_ONBOARDING_PATH } from "~/app/auth/lib/is-onboarding-route";
import { useOptionalClientSdk } from "~/platform/runtime/client-sdk-context";

export interface OnboardingGateProps {
  readonly children: ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { user } = useAuth0();
  const client = useOptionalClientSdk();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const userId = user?.sub;

  useEffect(() => {
    if (!client || !userId) {
      return;
    }

    if (isOnboardingComplete(userId)) {
      return;
    }

    void resolvePostLoginNavigation(client, { userId, intendedPath: pathname }).then((path) => {
      if (path === APP_ONBOARDING_PATH) {
        void navigate({ to: APP_ONBOARDING_PATH, replace: true });
      }
    });
  }, [client, navigate, pathname, userId]);

  return children;
}
