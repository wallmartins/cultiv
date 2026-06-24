import { Button, cn, CoordinateLabel, LogbookProse, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { TraitConfirmationInput } from "@my-ai-orchestrator/contracts";
import type { AppDisclosureItem } from "~/platform/ui/AppDisclosure";
import { AppSegmentedControl } from "~/platform/ui/AppSegmentedControl";
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
type VoiceDashboardTab = "overview" | "layers" | "health";

const voiceLogbookClassName = "border-0 bg-off-white shadow-cartography";

function formatLayerTitle(title: string, count: number | undefined): string {
  if (count === undefined) {
    return title;
  }

  return `${title} (${count})`;
}

function NumberedMapLayerAccordion({
  items
}: {
  readonly items: ReadonlyArray<AppDisclosureItem>;
}) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = (id: string) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIds.has(item.id);
        const panelId = `${baseId}-${item.id}`;

        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-[5px] bg-off-white shadow-cartography"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              onClick={() => toggle(item.id)}
            >
              <div className="min-w-0 space-y-1">
                <CoordinateLabel
                  index={index + 1}
                  label={formatLayerTitle(item.title, item.count)}
                  className="block"
                />
              </div>
              <span
                aria-hidden
                className="shrink-0 font-inter text-lg leading-none text-ink-muted transition-transform duration-200"
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            <div
              id={panelId}
              className={cn(
                "border-t border-ink-ghost/20 px-5 pb-5 pt-4",
                isOpen ? "block" : "hidden"
              )}
            >
              {item.children}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HealthStat({
  label,
  children
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <CoordinateLabel index={0} label={label} className="block" />
      {children}
    </div>
  );
}

export function VoiceDashboard() {
  const { locale, messages } = useAppLocale();
  const client = useClientSdk();
  const [status, setStatus] = useState<DashboardStatus>("loading");
  const [profile, setProfile] = useState<VoiceProfileScreenView | null>(null);
  const [confirmationDismissed, setConfirmationDismissed] = useState(false);
  const [confirmationSubmitting, setConfirmationSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<VoiceDashboardTab>("overview");
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
      <div className="mx-auto max-w-3xl space-y-6 px-[var(--spacing-gutter)] py-8 md:py-10">
        <div>
          <Text as="h1" variant="h1" className="mb-3 font-playfair text-ink">
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
        <LogbookProse className="space-y-3 p-5 text-center">
          <Text variant="meta" className="text-terracotta">
            {messages.errors.default.message}
          </Text>
        </LogbookProse>
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
    <LogbookProse className={cn(voiceLogbookClassName, "space-y-5 p-4")}>
      <HealthStat label={voiceMessages.confidence}>
        <Text variant="body" className="font-medium text-ink">
          {confidenceLabel}
        </Text>
        <Text variant="meta" className="w-full text-ink-muted">
          {getVoiceConfidencePanelMessage(profile.profile, voiceMessages, { detailed: false })}
        </Text>
      </HealthStat>
      <HealthStat label={voiceMessages.adaptationMode}>
        <Text variant="body" className="font-medium text-ink">
          {adaptationMode.label}
        </Text>
        <Text variant="meta" className="w-full text-ink-muted">
          {adaptationMode.description}
        </Text>
      </HealthStat>
      <HealthStat label={voiceMessages.diagnostics}>
        <Text variant="body" className="w-full text-ink-muted">
          {getVoiceDiagnosticsText(
            profile.diagnostics,
            profile.profile.confidence,
            voiceMessages
          )}
        </Text>
      </HealthStat>
      <HealthStat label={voiceMessages.coverage}>
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
      </HealthStat>
    </LogbookProse>
  );

  const mapLayerItems: ReadonlyArray<AppDisclosureItem> = profile.reasoning
    ? buildReasoningDetailItems({
        locale,
        messages: voiceMessages,
        reasoning: profile.reasoning
      })
    : [];

  const dashboardTabs: readonly { readonly value: VoiceDashboardTab; readonly label: string }[] = [
    { value: "overview", label: voiceMessages.dashboardTabs.overview },
    { value: "layers", label: voiceMessages.dashboardTabs.layers },
    { value: "health", label: voiceMessages.dashboardTabs.health }
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-[var(--spacing-gutter)] py-8 md:py-10">
      <VoiceRebuildStatusBanner
        status={rebuildStatus}
        updatingMessage={voiceMessages.updatingBanner}
        failedMessage={voiceMessages.rebuildFailed}
      />

      <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Text as="h1" variant="h1" className="mb-2 font-playfair text-ink">
              {voiceMessages.dashboardTitle}
            </Text>
            <Text variant="meta" className="text-ink-muted">
              {voiceMessages.dashboardSubtitle}
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/app/generate">
              <Button type="button">{voiceMessages.nextStep.generateCta}</Button>
            </Link>
            <Link to="/app/voice/examples">
              <Button type="button" variant="ghost">
                {voiceMessages.manageExamples}
              </Button>
            </Link>
          </div>
        </div>

        <AppSegmentedControl
          name="voice-dashboard-tab"
          value={activeTab}
          onChange={(value) => setActiveTab(value as VoiceDashboardTab)}
          options={dashboardTabs.map((tab) => ({
            value: tab.value,
            label: tab.label
          }))}
          className="max-w-xl"
        />
      </section>

      {activeTab === "overview" ? (
        <section className="space-y-6">
          {profile.reasoning ? (
            <div ref={authorityAnchorRef}>
              <VoiceReasoningMirror
                locale={locale}
                messages={voiceMessages.reasoning}
                voiceMessages={voiceMessages}
                reasoning={profile.reasoning}
                confidenceLevel={confidenceLevel}
                dialSubline={dialSubline}
                dialAccessibleLabel={dialAccessibleLabel}
                onAuthorityLinkClick={scrollToAuthority}
              />
            </div>
          ) : (
            <section className="space-y-6">
              <div className="space-y-2">
                <Text as="h2" variant="h2" className="font-playfair text-ink">
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
                healthLabel={voiceMessages.detailLayers.profileHealth}
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
        </section>
      ) : null}

      {activeTab === "layers" ? (
        <section>
          {mapLayerItems.length > 0 ? (
            <NumberedMapLayerAccordion items={mapLayerItems} />
          ) : (
            <LogbookProse className={cn(voiceLogbookClassName, "p-5")}>
              <Text variant="body" className="w-full text-ink-muted">
                {voiceMessages.mirrorFallbackSubtitle}
              </Text>
            </LogbookProse>
          )}
        </section>
      ) : null}

      {activeTab === "health" ? <section>{healthLayer}</section> : null}

      <div className="flex flex-col gap-6 border-t border-ink-ghost/20 pt-8 sm:flex-row sm:items-center sm:justify-between">
        {profile.reasoning ? (
          <Text variant="meta" className="max-w-md text-ink-muted">
            {voiceMessages.reasoning.refineHint}
          </Text>
        ) : (
          <div />
        )}
        <VoiceNextStepPanel eyebrow={voiceMessages.nextStep.eyebrow} step={nextStep} />
      </div>
    </div>
  );
}
