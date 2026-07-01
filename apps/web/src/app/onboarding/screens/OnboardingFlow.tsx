import { useAuth0 } from "@auth0/auth0-react";
import { Button, CompassMark, CoordinateLabel, LogbookProse, Text } from "@my-ai-orchestrator/ui";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { VoiceCalibrationSession } from "~/app/onboarding/screens/VoiceCalibrationSession";
import { toVoiceConfidenceLevel, VoiceConfidenceRing } from "~/app/voice/components/VoiceConfidenceRing";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useCreditBalance } from "~/platform/credits/use-credit-balance";
import {
  markOnboardingComplete,
  markVoiceStepSkipped
} from "~/app/onboarding/lib/onboarding-flags";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import type { VoiceProfileScreenView } from "@my-ai-orchestrator/contracts";

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
    <div className="mx-auto max-w-[560px] px-[var(--spacing-gutter)] py-8 md:py-10">
      <div className="mb-6">
        <CoordinateLabel
          index={step}
          label={messages.onboarding.stepLabel
            .replace("{current}", String(step))
            .replace("{total}", "2")}
          className="mb-3 block"
        />
        <div className="h-1.5 overflow-hidden rounded-[5px] border border-dotted-cartography bg-cream">
          <div
            className="h-full rounded-[4px] bg-terracotta transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
      </div>

      {step === 1 ? (
        <VoiceCalibrationSession
          onComplete={() => setStep(2)}
          onSkip={() => {
            if (userId) {
              markVoiceStepSkipped(userId);
            }
            setStep(2);
          }}
        />
      ) : (
        <div className="workspace-stagger-group space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full border border-dotted-cartography bg-off-white">
              <CompassMark size={48} variant="symbol" color="ochre" />
            </div>
            <Text as="h1" variant="h1" className="mb-3 font-playfair text-ink">
              {messages.onboarding.step2Title}
            </Text>
            <Text variant="body" className="text-ink-muted">
              {messages.onboarding.step2Subtitle}
            </Text>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <LogbookProse className="space-y-4 p-5">
              <CoordinateLabel index={1} label={messages.onboarding.confidence} className="block" />
              <VoiceConfidenceRing
                level={toVoiceConfidenceLevel(profile?.profile.confidence)}
                label={
                  profile?.profile.confidence
                    ? (messages.voice.confidenceLabels[profile.profile.confidence] ??
                      messages.voice.confidenceLabels.none)
                    : messages.voice.confidenceLabels.none
                }
                size="panel"
              />
            </LogbookProse>
            <LogbookProse className="space-y-3 p-5">
              <CoordinateLabel index={2} label={messages.onboarding.credits} className="block" />
              <Text variant="meta" className="font-mono text-2xl text-ink">
                {balance ?? "…"}
              </Text>
            </LogbookProse>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button type="button" variant="ghost" onClick={finishOnboarding}>
              {messages.onboarding.skip}
            </Button>
            <Button type="button" onClick={finishOnboarding}>
              {messages.onboarding.goGenerate}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
