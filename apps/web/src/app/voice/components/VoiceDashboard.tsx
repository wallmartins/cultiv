import { Button, cn, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { TraitConfirmationInput } from "@my-ai-orchestrator/contracts";
import { AppCard } from "~/platform/ui/AppCard";
import { AppDisclosureGroup } from "~/platform/ui/AppDisclosure";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";
import { toVoiceConfidenceLevel } from "~/app/voice/components/VoiceConfidenceRing";
import { VoiceMirrorHero } from "~/app/voice/components/VoiceMirrorHero";
import { VoiceRebuildStatusBanner } from "~/app/voice/components/VoiceRebuildStatusBanner";
import { VoiceNextStepPanel } from "~/app/voice/components/VoiceNextStepPanel";
import {
  buildReasoningDetailItems,
  VoiceReasoningMirror
} from "~/app/voice/components/VoiceReasoningSection";
import {
  selectTraitConfirmationTarget,
  VoiceTraitConfirmationCard
} from "~/app/voice/components/VoiceTraitConfirmationCard";
import {
  getMissingVoiceFormats,
  getUnderrepresentedVoiceFormats,
  getVoiceAdaptationModeCopy,
  getVoiceConfidenceDialAccessibleLabel,
  getVoiceConfidenceDialSubline,
  getVoiceConfidencePanelMessage,
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
  const [confirmationDismissed, setConfirmationDismissed] = useState(false);
  const [confirmationSubmitting, setConfirmationSubmitting] = useState(false);
  const authorityAnchorRef = useRef<HTMLDivElement | null>(null);

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
          <Text as="h1" variant="h1" className="mb-3 font-playfair text-azul">
            {messages.voice.dashboardTitle}
          </Text>
          <Text variant="body" className="text-ink-muted">
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
      <div className="px-[var(--spacing-gutter)] py-8">
        <AppCard className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-terracota/20 bg-terracota/5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-terracota">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <Text variant="meta" className="text-terracota">
            {messages.errors.default.message}
          </Text>
        </AppCard>
      </div>
    );
  }

  const voiceMessages = messages.voice;
  const confidenceLabel =
    voiceMessages.confidenceLabels[profile.profile.confidence] ??
    voiceMessages.confidenceLabels.none;
  const adaptationMode = getVoiceAdaptationModeCopy(profile.profile.adaptationMode, voiceMessages);
  const missingFormats = getMissingVoiceFormats(profile.materialBase);
  const underrepresentedFormats = getUnderrepresentedVoiceFormats(profile.diagnostics);
  const coverageComplete = missingFormats.length === 0 && underrepresentedFormats.length === 0;
  const nextStep = resolveVoiceNextStepFromDiagnostics(profile.diagnostics, voiceMessages);
  const rebuildStatus = profile.diagnostics.pendingRebuild.status;
  const confidenceLevel = toVoiceConfidenceLevel(profile.profile.confidence);
  const dialSubline = getVoiceConfidenceDialSubline(profile.profile.confidence, voiceMessages);
  const dialAccessibleLabel = getVoiceConfidenceDialAccessibleLabel(
    confidenceLabel,
    dialSubline,
    voiceMessages
  );
  const mirrorBodyCopy = getVoiceConfidencePanelMessage(profile.profile, voiceMessages, {
    detailed: true
  });
  const traitConfirmationTarget =
    profile.reasoning?.traitProfile && !confirmationDismissed
      ? selectTraitConfirmationTarget(
          profile.reasoning.traitProfile,
          profile.diagnostics.traitConfirmations
        )
      : undefined;

  const handleTraitConfirmation = (input: TraitConfirmationInput) => {
    setConfirmationSubmitting(true);
    void client
      .toPromise(client.voice.recordTraitConfirmation(input))
      .then((diagnostics) => {
        setProfile((current) =>
          current
            ? {
                ...current,
                diagnostics
              }
            : current
        );
        setConfirmationDismissed(true);
      })
      .finally(() => {
        setConfirmationSubmitting(false);
      });
  };

  const scrollToAuthority = () => {
    document.getElementById("voice-core-authority")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const healthLayer = (
    <div className="space-y-4">
      <div>
        <Text variant="label" className="mb-2 block font-inter text-xs font-semibold uppercase tracking-wider text-texto-sec">
          {voiceMessages.confidence}
        </Text>
        <Text variant="body" className="mb-1 font-medium text-ink">
          {confidenceLabel}
        </Text>
        <Text variant="meta" className="w-full text-ink-muted">
          {getVoiceConfidencePanelMessage(profile.profile, voiceMessages, { detailed: false })}
        </Text>
      </div>
      <div>
        <Text variant="label" className="mb-2 block font-inter text-xs font-semibold uppercase tracking-wider text-texto-sec">
          {voiceMessages.adaptationMode}
        </Text>
        <Text variant="body" className="mb-1 font-medium text-ink">
          {adaptationMode.label}
        </Text>
        <Text variant="meta" className="w-full text-ink-muted">
          {adaptationMode.description}
        </Text>
      </div>
      <div>
        <Text variant="label" className="mb-2 block font-inter text-xs font-semibold uppercase tracking-wider text-texto-sec">
          {voiceMessages.diagnostics}
        </Text>
        <Text variant="body" className="w-full text-ink-muted">
          {getVoiceDiagnosticsText(
            profile.diagnostics,
            profile.profile.confidence,
            voiceMessages
          )}
        </Text>
      </div>
      <div>
        <Text variant="label" className="mb-2 block font-inter text-xs font-semibold uppercase tracking-wider text-texto-sec">
          {voiceMessages.coverage}
        </Text>
        {coverageComplete ? (
          <Text variant="body" className="w-full text-ink-muted">
            {voiceMessages.coverageComplete}
          </Text>
        ) : (
          <div className="space-y-2">
            {missingFormats.length > 0 ? (
              <Text variant="body" className="w-full text-ink-muted">
                {voiceMessages.coverageMissingFormats}{" "}
                {missingFormats
                  .map((format) => getContentTypeLabel(locale, format, format))
                  .join(", ")}
              </Text>
            ) : null}
            {underrepresentedFormats.length > 0 ? (
              <Text variant="body" className="w-full text-ink-muted">
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
    <div className="space-y-8 px-[var(--spacing-gutter)] py-8 md:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Text as="h1" variant="h1" className="mb-2 font-playfair text-azul">
            {voiceMessages.dashboardTitle}
          </Text>
          <Text variant="meta" className="text-ink-muted">
            {voiceMessages.dashboardSubtitle}
          </Text>
        </div>
        <Link
          to="/app/voice/examples"
          className="rebrand-hover inline-flex items-center justify-center gap-2 rounded-sm border border-azul/20 bg-azul/5 px-4 py-2 font-inter text-sm font-medium text-azul transition-all duration-300 hover:bg-azul/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {voiceMessages.manageExamples}
        </Link>
      </div>

      <VoiceRebuildStatusBanner
        status={rebuildStatus}
        updatingMessage={voiceMessages.updatingBanner}
        failedMessage={voiceMessages.rebuildFailed}
      />

      {profile.reasoning ? (
        <div ref={authorityAnchorRef}>
          <VoiceReasoningMirror
            locale={locale}
            messages={voiceMessages.reasoning}
            reasoning={profile.reasoning}
            confidenceLevel={confidenceLevel}
            dialSubline={dialSubline}
            dialAccessibleLabel={dialAccessibleLabel}
            onAuthorityLinkClick={scrollToAuthority}
          />
        </div>
      ) : (
        <section className="space-y-6">
          <div>
            <Text as="h2" variant="h2" className="mb-2 font-playfair text-azul">
              {voiceMessages.mirrorFallbackTitle}
            </Text>
            <Text variant="meta" className="w-full text-ink-muted">
              {voiceMessages.mirrorFallbackSubtitle}
            </Text>
          </div>
          <VoiceMirrorHero
            level={confidenceLevel}
            dialSubline={dialSubline}
            dialAccessibleLabel={dialAccessibleLabel}
            bodyCopy={mirrorBodyCopy}
          />
        </section>
      )}

      {traitConfirmationTarget && profile.reasoning?.traitProfile ? (
        <VoiceTraitConfirmationCard
          messages={voiceMessages.reasoning.traitConfirmation}
          traitKey={traitConfirmationTarget}
          traitProfile={profile.reasoning.traitProfile}
          submitting={confirmationSubmitting}
          onConfirm={handleTraitConfirmation}
        />
      ) : null}

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
        <Text variant="meta" className="w-full text-ink-muted">
          {voiceMessages.reasoning.refineHint}
        </Text>
      ) : null}

      <VoiceNextStepPanel eyebrow={voiceMessages.nextStep.eyebrow} step={nextStep} />
    </div>
  );
}
