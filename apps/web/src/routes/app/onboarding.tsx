import { useAuth0 } from "@auth0/auth0-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { OnboardingFlow } from "~/app/onboarding/screens/OnboardingFlow";
import { isOnboardingComplete } from "~/app/onboarding/lib/onboarding-flags";

export const Route = createFileRoute("/app/onboarding")({
  component: OnboardingPage
});

function OnboardingPage() {
  const { user } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const userId = user?.sub;
    if (userId && isOnboardingComplete(userId)) {
      void navigate({ to: "/app/generate", replace: true });
    }
  }, [navigate, user?.sub]);

  return <OnboardingFlow />;
}
