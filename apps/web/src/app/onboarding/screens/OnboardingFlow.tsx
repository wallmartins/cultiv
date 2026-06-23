import { useAuth0 } from "@auth0/auth0-react";
import { Button, Container, Text } from "@my-ai-orchestrator/ui";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { VoiceExampleComposer } from "~/app/voice/components/VoiceExampleComposer";
import { AppCard } from "~/platform/ui/AppCard";
import { toVoiceConfidenceLevel, VoiceConfidenceRing } from "~/app/voice/components/VoiceConfidenceRing";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useCreditBalance } from "~/platform/credits/use-credit-balance";
import {
  markOnboardingComplete,
  markVoiceStepSkipped
} from "~/app/onboarding/lib/onboarding-flags";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import type { VoiceProfileScreenView } from "@my-ai-orchestrator/contracts";
import { useEffect } from "react";

export function OnboardingFlow() {
  const { user } = useAuth0();
  const { messages } = useAppLocale();
  const navigate = useNavigate();
  const client = useClientSdk();
  const userId = user?.sub;
  const { balance } = useCreditBalance();
  const [step, setStep] = useState<1 | 2>(1);
  const [profile, setProfile] = useState<VoiceProfileScreenView | null>(null);

  useEffect(() => {
    if (step !== 2) {
      return;
    }

    void client.toPromise(client.voice.getProfile()).then(setProfile).catch(() => undefined);
  }, [client, step]);

  function finishOnboarding() {
    if (!userId) {
      return;
    }

    markOnboardingComplete(userId);
    void navigate({ to: "/app/generate" });
  }

  return (
    <Container className="py-8 md:py-10">
      <div className="mb-6">
        <Text variant="meta" className="mb-2 text-ink-muted">
          {messages.onboarding.stepLabel.replace("{current}", String(step)).replace("{total}", "2")}
        </Text>
        <div className="h-1.5 overflow-hidden rounded-full bg-paper-pressed">
          <div
            className="h-full rounded-full bg-pigment-terracotta transition-[width] duration-300 ease-out"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
      </div>

      {step === 1 ? (
        <div className="workspace-stagger-group space-y-6">
          <div>
            <Text as="h1" variant="h1" className="mb-3">
              {messages.onboarding.step1Title}
            </Text>
            <Text variant="body" className="text-ink-muted">
              {messages.onboarding.step1Subtitle}
            </Text>
          </div>

          <AppCard>
            <VoiceExampleComposer mode="create" onSaved={() => setStep(2)} />
          </AppCard>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (userId) {
                  markVoiceStepSkipped(userId);
                }
                setStep(2);
              }}
            >
              {messages.onboarding.skip}
            </Button>
            <Button type="button" onClick={() => setStep(2)}>
              {messages.onboarding.continue}
            </Button>
          </div>
        </div>
      ) : (
        <div className="workspace-stagger-group space-y-6">
          <div>
            <Text as="h1" variant="h1" className="mb-3">
              {messages.onboarding.step2Title}
            </Text>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AppCard>
              <Text variant="label" className="mb-4 block">
                {messages.onboarding.confidence}
              </Text>
              <VoiceConfidenceRing
                level={toVoiceConfidenceLevel(profile?.profile.confidence)}
                label={
                  profile?.profile.confidence
                    ? (messages.voice.confidenceLabels[profile.profile.confidence] ??
                      messages.voice.confidenceLabels.none)
                    : messages.voice.confidenceLabels.none
                }
              />
            </AppCard>
            <AppCard>
              <Text variant="label" className="mb-2 block">
                {messages.onboarding.credits}
              </Text>
              <Text variant="meta" className="font-mono text-lg">
                {balance ?? "…"}
              </Text>
            </AppCard>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="ghost" onClick={finishOnboarding}>
              {messages.onboarding.skip}
            </Button>
            <Button type="button" onClick={finishOnboarding}>
              {messages.onboarding.goGenerate}
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}
