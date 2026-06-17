import { Button, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppCard } from "~/platform/ui/AppCard";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";
import { toVoiceConfidenceLevel, VoiceConfidenceRing } from "~/app/voice/components/VoiceConfidenceRing";
import {
  getMissingVoiceFormats,
  getUnderrepresentedVoiceFormats,
  getVoiceAdaptationModeCopy,
  getVoiceConfidenceDescription,
  getVoiceDiagnosticsText
} from "~/app/voice/lib/voice-dashboard-copy";
import { VoiceReasoningSection } from "~/app/voice/components/VoiceReasoningSection";
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

  const confidenceLabel =
    messages.voice.confidenceLabels[profile.profile.confidence] ??
    messages.voice.confidenceLabels.none;
  const confidenceDescription = getVoiceConfidenceDescription(profile.profile, messages.voice);
  const diagnosticsText = getVoiceDiagnosticsText(
    profile.diagnostics,
    profile.profile.confidence,
    messages.voice
  );
  const adaptationMode = getVoiceAdaptationModeCopy(profile.profile.adaptationMode, messages.voice);
  const missingFormats = getMissingVoiceFormats(profile.materialBase);
  const underrepresentedFormats = getUnderrepresentedVoiceFormats(profile.diagnostics);
  const coverageComplete = missingFormats.length === 0 && underrepresentedFormats.length === 0;

  return (
    <div className="workspace-stagger-group space-y-8 px-[var(--spacing-gutter)] py-8 md:py-10">
      <div>
        <Text as="h1" variant="h1" className="mb-3">
          {messages.voice.dashboardTitle}
        </Text>
        <Text variant="body" className="text-muted-foreground">
          {messages.voice.dashboardSubtitle}
        </Text>
      </div>

      {profile.diagnostics.pendingRebuild.status === "in_progress" ? (
        <AppCard padding="compact" className="border-golden/40 bg-golden/10">
          <Text variant="meta">{messages.voice.updatingBanner}</Text>
        </AppCard>
      ) : null}

      {profile.diagnostics.pendingRebuild.status === "failed" ? (
        <AppCard padding="compact" className="border-red-700/30 bg-red-700/10">
          <Text variant="meta" className="text-red-800">
            {messages.voice.rebuildFailed}
          </Text>
        </AppCard>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <AppCard className="md:col-span-2">
          <Text variant="label" className="mb-4 block">
            {messages.voice.confidence}
          </Text>
          <VoiceConfidenceRing
            level={toVoiceConfidenceLevel(profile.profile.confidence)}
            label={confidenceLabel}
            description={confidenceDescription}
          />
        </AppCard>
        <AppCard>
          <Text variant="label" className="mb-2 block">
            {messages.voice.adaptationMode}
          </Text>
          <Text variant="meta" className="mb-2 block font-medium text-foreground">
            {adaptationMode.label}
          </Text>
          <Text variant="meta" className="text-muted-foreground">
            {adaptationMode.description}
          </Text>
        </AppCard>
        <AppCard>
          <Text variant="label" className="mb-2 block">
            {messages.voice.diagnostics}
          </Text>
          <Text variant="meta" className="text-muted-foreground">
            {diagnosticsText}
          </Text>
        </AppCard>
      </section>

      <AppCard>
        <Text variant="label" className="mb-3 block">
          {messages.voice.coverage}
        </Text>
        {coverageComplete ? (
          <Text variant="meta" className="text-muted-foreground">
            {messages.voice.coverageComplete}
          </Text>
        ) : (
          <>
            {missingFormats.length > 0 ? (
              <Text variant="meta" className="mb-2 block text-muted-foreground">
                {messages.voice.coverageMissingFormats}{" "}
                {missingFormats
                  .map((format) => getContentTypeLabel(locale, format, format))
                  .join(", ")}
              </Text>
            ) : null}
            {underrepresentedFormats.length > 0 ? (
              <Text variant="meta" className="text-muted-foreground">
                {messages.voice.underrepresented}{" "}
                {underrepresentedFormats
                  .map((format) => getContentTypeLabel(locale, format, format))
                  .join(", ")}
              </Text>
            ) : null}
          </>
        )}
      </AppCard>

      {profile.reasoning ? (
        <VoiceReasoningSection
          locale={locale}
          messages={messages.voice.reasoning}
          reasoning={profile.reasoning}
          diagnostics={profile.diagnostics}
        />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link to="/app/voice/examples">
          <Button type="button" variant="ghost">
            {messages.voice.examplesTitle}
          </Button>
        </Link>
        <Link to="/app/voice/examples/new">
          <Button type="button">{messages.voice.addExamples}</Button>
        </Link>
      </div>
    </div>
  );
}
