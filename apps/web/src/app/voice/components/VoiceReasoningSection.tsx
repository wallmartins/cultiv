import { CoordinateLabel, LogbookProse, Text } from "@my-ai-orchestrator/ui";
import { VoiceTraitChip } from "~/app/voice/components/VoiceTraitChip";
import { VoiceDevelopmentTraitsStrip } from "~/app/voice/components/VoiceDevelopmentTraitsStrip";
import {
  VoiceConfidenceRing,
  type VoiceConfidenceLevel
} from "~/app/voice/components/VoiceConfidenceRing";
import type { DevelopmentTraitProfile, TraitKey, VoiceReasoningPresentationView } from "@my-ai-orchestrator/contracts";
import { getMoveLabel } from "~/i18n/app/move-labels";
import type { AppLocale, AppMessages } from "~/i18n/app/types";
import type { AppDisclosureItem } from "~/platform/ui/AppDisclosure";
import { getContentTypeLabel } from "~/i18n/app/content-types";
import { getVoiceDashboardSectionTitles } from "~/app/voice/lib/voice-dashboard-copy";

interface VoiceReasoningLayersProps {
  readonly locale: AppLocale;
  readonly messages: AppMessages["voice"];
  readonly reasoning: VoiceReasoningPresentationView;
  readonly exampleExcerpts?: Readonly<Partial<Record<string, { readonly previewText: string; readonly contentType: string }>>>;
}

export function buildReasoningDetailItems({
  locale,
  messages,
  reasoning,
  exampleExcerpts
}: VoiceReasoningLayersProps): ReadonlyArray<AppDisclosureItem> {
  const reasoningMessages = messages.reasoning;
  const formatCount = reasoning.formatExpressions.length;
  const antiPatternCount = reasoning.core.derivedAntiPatterns.length;
  const traitProfile = reasoning.traitProfile;
  const evidenceCount = traitProfile
    ? countTraitsWithEvidence(traitProfile)
    : 0;
  const gapCount = traitProfile ? countUnknownTraits(traitProfile) : 0;

  return [
    {
      id: "formats",
      title: messages.detailLayers.formats,
      count: formatCount > 0 ? formatCount : undefined,
      children:
          formatCount > 0 ? (
          <div className="space-y-4">
            {reasoning.formatExpressions.map((expression) => (
              <LogbookProse key={expression.contentType} className="space-y-3 p-4">
                <Text variant="label" className="block font-inter text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  {getContentTypeLabel(locale, expression.contentType, expression.contentType)}
                </Text>
                <Text variant="body" className="w-full whitespace-pre-wrap leading-relaxed text-ink">
                  {expression.narrativeProse}
                </Text>
                <div className="flex flex-wrap gap-2 border-t border-dotted-cartography pt-3">
                  <VoiceTraitChip
                    label={reasoningMessages.register}
                    value={reasoningMessages.enums.register[expression.register]}
                  />
                  <VoiceTraitChip
                    label={reasoningMessages.openingStyle}
                    value={reasoningMessages.enums.openingStyle[expression.openingStyle]}
                  />
                  <VoiceTraitChip
                    label={reasoningMessages.technicalDensity}
                    value={reasoningMessages.enums.technicalDensity[expression.technicalDensity]}
                  />
                </div>
              </LogbookProse>
            ))}
          </div>
        ) : (
          <Text variant="body" className="w-full text-ink-muted">
            {reasoningMessages.partialFormats}
          </Text>
        )
    },
    ...(traitProfile
      ? [
          {
            id: "trait-evidence",
            title: reasoningMessages.developmentTraits.evidenceTitle,
            count: evidenceCount > 0 ? evidenceCount : undefined,
            children: (
              <TraitEvidenceDisclosure
                locale={locale}
                messages={reasoningMessages}
                traitProfile={traitProfile}
                exampleExcerpts={exampleExcerpts}
              />
            )
          },
          ...(gapCount > 0
            ? [
                {
                  id: "trait-gaps",
                  title: reasoningMessages.developmentTraits.gapsTitle,
                  count: gapCount,
                  children: (
                    <Text variant="body" className="w-full text-ink-muted">
                      {reasoningMessages.developmentTraits.gapsBody}
                    </Text>
                  )
                }
              ]
            : [])
        ]
      : []),
    {
      id: "anti-patterns",
      title: messages.detailLayers.antiPatterns,
      count: antiPatternCount > 0 ? antiPatternCount : undefined,
      children:
        antiPatternCount > 0 ? (
          <ul className="list-disc space-y-2 pl-5">
            {reasoning.core.derivedAntiPatterns.map((pattern) => (
              <li key={pattern}>
                <Text variant="body" className="w-full text-ink">
                  {pattern}
                </Text>
              </li>
            ))}
          </ul>
        ) : (
          <Text variant="body" className="w-full text-ink-muted">
            {reasoningMessages.noAntiPatterns}
          </Text>
        )
    }
  ];
}

interface VoiceReasoningMirrorProps {
  readonly locale: AppLocale;
  readonly messages: AppMessages["voice"]["reasoning"];
  readonly voiceMessages: AppMessages["voice"];
  readonly reasoning: VoiceReasoningPresentationView;
  readonly confidenceLevel: VoiceConfidenceLevel;
  readonly dialSubline: string;
  readonly dialAccessibleLabel: string;
  readonly onAuthorityLinkClick?: () => void;
}

export function VoiceReasoningMirror({
  locale,
  messages,
  voiceMessages,
  reasoning,
  confidenceLevel,
  dialSubline,
  dialAccessibleLabel,
  onAuthorityLinkClick
}: VoiceReasoningMirrorProps) {
  const development = reasoning.development;
  const traitProfile = reasoning.traitProfile ?? development?.traitProfile;
  const sectionTitles = getVoiceDashboardSectionTitles(voiceMessages);

  return (
    <section className="space-y-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CoordinateLabel
          index={0}
          label={voiceMessages.detailLayers.profileHealth}
          className="block"
        />
        <VoiceConfidenceRing
          level={confidenceLevel}
          label={dialAccessibleLabel}
          centerLabel={dialSubline}
          size="hero"
          hideLabel
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LogbookProse className="space-y-3 p-5">
          <CoordinateLabel index={1} label={sectionTitles.navigate} className="mb-1 block" />
          <Text variant="meta" className="block text-ink-muted">
            {messages.subtitle}
          </Text>
          <Text variant="body" className="w-full whitespace-pre-wrap leading-relaxed text-ink">
            {reasoning.core.narrativeProse}
          </Text>
        </LogbookProse>

        <LogbookProse className="space-y-3 p-5">
          <CoordinateLabel index={2} label={sectionTitles.mapRoutes} className="mb-1 block" />
          <Text variant="meta" className="block text-ink-muted">
            {messages.developmentSubtitle}
          </Text>
          {development ? (
            <>
              <Text variant="body" className="w-full whitespace-pre-wrap leading-relaxed text-ink">
                {development.developmentProse}
              </Text>
              {reasoning.developmentImmature ? (
                <Text variant="meta" className="w-full text-ink-muted">
                  {messages.developmentImmature}
                </Text>
              ) : null}
            </>
          ) : (
            <Text variant="body" className="w-full text-ink-muted">
              {messages.developmentImmature}
            </Text>
          )}
        </LogbookProse>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <VoiceTraitChip
          label={messages.certaintyLevel}
          value={messages.enums.certaintyLevel[reasoning.core.certaintyLevel]}
        />
        <VoiceTraitChip
          label={messages.judgmentFrequency}
          value={messages.enums.judgmentFrequency[reasoning.core.judgmentFrequency]}
        />
        <VoiceTraitChip
          label={messages.conclusionPace}
          value={messages.enums.conclusionPace[reasoning.core.conclusionPace]}
        />
        <VoiceTraitChip
          label={messages.readerRelationship}
          value={messages.enums.readerRelationship[reasoning.core.readerRelationship]}
        />
        <VoiceTraitChip
          label={messages.authoritySource}
          value={messages.enums.authoritySource[reasoning.core.authoritySource]}
          id="voice-core-authority"
        />
      </div>

      {development ? (
        <div className="space-y-4 border-t border-dotted-cartography pt-8">
          <div className="flex flex-wrap gap-2">
            <VoiceTraitChip
              label={messages.epistemicPosture}
              value={messages.enums.epistemicPosture[development.epistemicPosture]}
            />
          </div>

          {development.moveLabels.length > 0 ? (
            <LogbookProse className="space-y-3 p-4">
              <CoordinateLabel index={3} label={messages.typicalMoves} className="block" />
              <ul className="flex flex-wrap gap-2">
                {development.moveLabels.map((move) => (
                  <li
                    key={move}
                    className="rounded-[5px] border border-dotted-cartography bg-cream px-3 py-1 font-inter text-sm font-medium text-terracotta"
                  >
                    {getMoveLabel(locale, move)}
                  </li>
                ))}
              </ul>
            </LogbookProse>
          ) : null}

          {traitProfile ? (
            <VoiceDevelopmentTraitsStrip
              messages={messages}
              traitProfile={traitProfile}
              developmentImmature={reasoning.developmentImmature}
              onAuthorityLinkClick={onAuthorityLinkClick}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function TraitEvidenceDisclosure({
  locale,
  messages,
  traitProfile,
  exampleExcerpts
}: {
  readonly locale: AppLocale;
  readonly messages: AppMessages["voice"]["reasoning"];
  readonly traitProfile: DevelopmentTraitProfile;
  readonly exampleExcerpts?: Readonly<Partial<Record<string, { readonly previewText: string; readonly contentType: string }>>>;
}) {
  const traitMessages = messages.developmentTraits;
  const traitsWithEvidence = (Object.keys(traitProfile.records) as TraitKey[]).filter(
    (key) => (traitProfile.records[key]?.evidenceExampleIds.length ?? 0) > 0
  );

  if (traitsWithEvidence.length === 0) {
    return (
      <Text variant="body" className="w-full text-ink-muted">
        {traitMessages.noEvidence}
      </Text>
    );
  }

  return (
    <div className="space-y-4">
      {traitsWithEvidence.map((traitKey) => {
        const record = traitProfile.records[traitKey]!;
        return (
          <LogbookProse key={traitKey} className="space-y-3 p-4">
            <Text variant="label" className="block">
              {traitMessages.evidenceHeading(traitMessages.labels[traitKey], record.value)}
            </Text>
            <div className="space-y-3">
              {record.evidenceExampleIds.map((exampleId) => {
                const excerpt = exampleExcerpts?.[exampleId];
                return (
                  <div key={exampleId}>
                    <Text variant="meta" className="mb-1 block text-ink-muted">
                      {excerpt
                        ? traitMessages.exampleLabel(
                            getContentTypeLabel(locale, excerpt.contentType, excerpt.contentType)
                          )
                        : traitMessages.exampleFallback}
                    </Text>
                    <Text variant="body" className="w-full text-ink">
                      {excerpt?.previewText ? `"${excerpt.previewText}"` : traitMessages.exampleUnavailable}
                    </Text>
                  </div>
                );
              })}
            </div>
          </LogbookProse>
        );
      })}
      <a href="/app/voice/examples" className="text-sm font-medium text-terracotta underline-offset-2 hover:underline">
        {traitMessages.manageExamplesLink}
      </a>
    </div>
  );
}

function countTraitsWithEvidence(traitProfile: DevelopmentTraitProfile): number {
  return (Object.keys(traitProfile.records) as TraitKey[]).filter(
    (key) => (traitProfile.records[key]?.evidenceExampleIds.length ?? 0) > 0
  ).length;
}

function countUnknownTraits(traitProfile: DevelopmentTraitProfile): number {
  return (Object.keys(traitProfile.records) as TraitKey[]).filter(
    (key) => traitProfile.records[key]?.status === "unknown"
  ).length;
}
