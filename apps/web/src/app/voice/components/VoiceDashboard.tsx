import { Button, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppCard } from "~/platform/ui/AppCard";
import { AppDisclosureGroup } from "~/platform/ui/AppDisclosure";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";
import { toVoiceConfidenceLevel, VoiceConfidenceRing } from "~/app/voice/components/VoiceConfidenceRing";
import { VoiceNextStepCard } from "~/app/voice/components/VoiceNextStepCard";
import {
  buildReasoningDetailItems,
  VoiceReasoningMirror
} from "~/app/voice/components/VoiceReasoningSection";
import {
  getMissingVoiceFormats,
  getUnderrepresentedVoiceFormats,
  getVoiceAdaptationModeCopy,
  getVoiceConfidenceDescription,
  getVoiceDiagnosticsText,
  resolveVoiceNextStepFromDiagnostics
} from "~/app/voice/lib/voice-dashboard-copy";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { getContentTypeLabel } from "~/i18n/app/content-types";
import { isSdkResourceNotFound } from "~/platform/sdk/is-sdk-resource-not-found";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import type { VoiceProfileScreenView } from "@my-ai-orchestrator/contracts";

type DashboardStatus = "loading" | "ready" | "empty" | "error";

export function VoiceDashboard() {
  const { locale, messages } = useAppLocale();
  const client = useClientSdk();
  const [status, setStatus] = useState<DashboardStatus>("loading");
  const [profile, setProfile] = useState<VoiceProfileScreenView | null>(null);

  useEffect(() => {
    void client
      .toPromise(client.voice.getProfile())
      .then((next) => {
        setProfile(next);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        setStatus(isSdkResourceNotFound(error) ? "empty" : "error");
      });
  }, [client]);

  if (status === "loading") {
    return (
      <div className="space-y-4 px-[var(--spacing-gutter)] py-8">
        <AppSkeleton className="h-10 w-56" />
        <AppSkeleton className="h-40 w-full max-w-xl" />
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="space-y-6 px-[var(--spacing-gutter)] py-8 md:py-10">
        <div>
          <Text as="h1" variant="h1" className="mb-3">
            {messages.voice.dashboardTitle}
          </Text>
          <Text variant="body" className="text-muted-foreground">
            {messages.voice.dashboardEmpty}
          </Text>
        </div>
        <Link to="/app/voice/examples/new">
          <Button type="button">{messages.voice.dashboardEmptyAction}</Button>
        </Link>
      </div>
    );
  }

  if (status === "error" || !profile) {
    return (
      <Text variant="meta" className="px-[var(--spacing-gutter)] py-8 text-red-700">
        {messages.errors.default.message}
      </Text>
    );
  }

  const voiceMessages = messages.voice;
  const confidenceLabel =
    voiceMessages.confidenceLabels[profile.profile.confidence] ??
    voiceMessages.confidenceLabels.none;
  const confidenceDescription = getVoiceConfidenceDescription(profile.profile, voiceMessages);
  const adaptationMode = getVoiceAdaptationModeCopy(profile.profile.adaptationMode, voiceMessages);
  const missingFormats = getMissingVoiceFormats(profile.materialBase);
  const underrepresentedFormats = getUnderrepresentedVoiceFormats(profile.diagnostics);
  const coverageComplete = missingFormats.length === 0 && underrepresentedFormats.length === 0;
  const nextStep = resolveVoiceNextStepFromDiagnostics(profile.diagnostics, voiceMessages);
  const rebuildStatus = profile.diagnostics.pendingRebuild.status;

  const healthLayer = (
    <div className="space-y-4">
      <div>
        <Text variant="label" className="mb-2 block">
          {voiceMessages.adaptationMode}
        </Text>
        <Text variant="body" className="mb-1 font-medium text-foreground">
          {adaptationMode.label}
        </Text>
        <Text variant="meta" className="max-w-prose text-muted-foreground">
          {adaptationMode.description}
        </Text>
      </div>
      <div>
        <Text variant="label" className="mb-2 block">
          {voiceMessages.diagnostics}
        </Text>
        <Text variant="body" className="max-w-prose text-muted-foreground">
          {getVoiceDiagnosticsText(
            profile.diagnostics,
            profile.profile.confidence,
            voiceMessages
          )}
        </Text>
      </div>
      <div>
        <Text variant="label" className="mb-2 block">
          {voiceMessages.coverage}
        </Text>
        {coverageComplete ? (
          <Text variant="body" className="text-muted-foreground">
            {voiceMessages.coverageComplete}
          </Text>
        ) : (
          <div className="space-y-2">
            {missingFormats.length > 0 ? (
              <Text variant="body" className="text-muted-foreground">
                {voiceMessages.coverageMissingFormats}{" "}
                {missingFormats
                  .map((format) => getContentTypeLabel(locale, format, format))
                  .join(", ")}
              </Text>
            ) : null}
            {underrepresentedFormats.length > 0 ? (
              <Text variant="body" className="text-muted-foreground">
                {voiceMessages.underrepresented}{" "}
                {underrepresentedFormats
                  .map((format) => getContentTypeLabel(locale, format, format))
                  .join(", ")}
              </Text>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="workspace-stagger-group space-y-8 px-[var(--spacing-gutter)] py-8 md:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Text as="h1" variant="h1" className="mb-2">
            {voiceMessages.dashboardTitle}
          </Text>
          <Text variant="meta" className="max-w-prose text-muted-foreground">
            {voiceMessages.dashboardSubtitle}
          </Text>
        </div>
        <Link to="/app/voice/examples">
          <Button type="button" variant="ghost">
            {voiceMessages.manageExamples}
          </Button>
        </Link>
      </div>

      {rebuildStatus === "in_progress" ? (
        <AppCard padding="compact" className="border-golden/40 bg-golden/10">
          <Text variant="body">{voiceMessages.updatingBanner}</Text>
        </AppCard>
      ) : null}

      {rebuildStatus === "failed" ? (
        <AppCard padding="compact" className="border-red-700/30 bg-red-700/10">
          <Text variant="body" className="text-red-800">
            {voiceMessages.rebuildFailed}
          </Text>
        </AppCard>
      ) : null}

      <AppCard padding="compact" className="bg-surface-elevated/80">
        <div className="flex flex-wrap items-center gap-4">
          <VoiceConfidenceRing
            size="compact"
            level={toVoiceConfidenceLevel(profile.profile.confidence)}
            label={confidenceLabel}
          />
          <Text variant="meta" className="text-muted-foreground">
            {voiceMessages.adaptationModeLabels[profile.profile.adaptationMode]}
          </Text>
        </div>
      </AppCard>

      {profile.reasoning ? (
        <VoiceReasoningMirror messages={voiceMessages.reasoning} reasoning={profile.reasoning} />
      ) : (
        <section className="space-y-3">
          <div>
            <Text as="h2" variant="h2" className="mb-2">
              {voiceMessages.mirrorFallbackTitle}
            </Text>
            <Text variant="meta" className="max-w-prose text-muted-foreground">
              {voiceMessages.mirrorFallbackSubtitle}
            </Text>
          </div>
          <Text variant="body-lg" className="max-w-prose leading-relaxed text-foreground">
            {confidenceDescription}
          </Text>
        </section>
      )}

      <AppDisclosureGroup
        items={[
          ...(profile.reasoning
            ? buildReasoningDetailItems({
                locale,
                messages: voiceMessages,
                reasoning: profile.reasoning
              })
            : []),
          {
            id: "profile-health",
            title: voiceMessages.detailLayers.profileHealth,
            children: healthLayer
          }
        ]}
      />

      {profile.reasoning ? (
        <Text variant="meta" className="max-w-prose text-muted-foreground">
          {voiceMessages.reasoning.refineHint}
        </Text>
      ) : null}

      <VoiceNextStepCard eyebrow={voiceMessages.nextStep.eyebrow} step={nextStep} />
    </div>
  );
}
