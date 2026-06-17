import { Text } from "@my-ai-orchestrator/ui";
import { VoiceTraitChip } from "~/app/voice/components/VoiceTraitChip";
import { VoiceMirrorHero } from "~/app/voice/components/VoiceMirrorHero";
import type { VoiceConfidenceLevel } from "~/app/voice/components/VoiceConfidenceRing";
import type { VoiceReasoningPresentationView } from "@my-ai-orchestrator/contracts";
import type { AppLocale, AppMessages } from "~/i18n/app/types";
import type { AppDisclosureItem } from "~/platform/ui/AppDisclosure";
import { getContentTypeLabel } from "~/i18n/app/content-types";

interface VoiceReasoningLayersProps {
  readonly locale: AppLocale;
  readonly messages: AppMessages["voice"];
  readonly reasoning: VoiceReasoningPresentationView;
}

export function buildReasoningDetailItems({
  locale,
  messages,
  reasoning
}: VoiceReasoningLayersProps): ReadonlyArray<AppDisclosureItem> {
  const reasoningMessages = messages.reasoning;
  const formatCount = reasoning.formatExpressions.length;
  const antiPatternCount = reasoning.core.derivedAntiPatterns.length;

  return [
    {
      id: "formats",
      title: messages.detailLayers.formats,
      count: formatCount > 0 ? formatCount : undefined,
      children:
        formatCount > 0 ? (
          <div className="space-y-4">
            {reasoning.formatExpressions.map((expression) => (
              <div
                key={expression.contentType}
                className="rounded-[var(--workspace-radius-sm)] border border-border-subtle/60 bg-surface-elevated/60 p-4"
              >
                <Text variant="label" className="mb-2 block">
                  {getContentTypeLabel(locale, expression.contentType, expression.contentType)}
                </Text>
                <Text variant="body" className="mb-3 w-full text-muted-foreground">
                  {expression.narrativeProse}
                </Text>
                <div className="flex flex-wrap gap-2">
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
              </div>
            ))}
          </div>
        ) : (
          <Text variant="body" className="w-full text-muted-foreground">
            {reasoningMessages.partialFormats}
          </Text>
        )
    },
    {
      id: "anti-patterns",
      title: messages.detailLayers.antiPatterns,
      count: antiPatternCount > 0 ? antiPatternCount : undefined,
      children:
        antiPatternCount > 0 ? (
          <ul className="list-disc space-y-2 pl-5">
            {reasoning.core.derivedAntiPatterns.map((pattern) => (
              <li key={pattern}>
                <Text variant="body" className="w-full text-foreground">
                  {pattern}
                </Text>
              </li>
            ))}
          </ul>
        ) : (
          <Text variant="body" className="w-full text-muted-foreground">
            {reasoningMessages.noAntiPatterns}
          </Text>
        )
    }
  ];
}

interface VoiceReasoningMirrorProps {
  readonly messages: AppMessages["voice"]["reasoning"];
  readonly reasoning: VoiceReasoningPresentationView;
  readonly confidenceLevel: VoiceConfidenceLevel;
  readonly dialSubline: string;
  readonly dialAccessibleLabel: string;
}

function formatMoveLabel(move: string): string {
  return move
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function VoiceReasoningMirror({
  messages,
  reasoning,
  confidenceLevel,
  dialSubline,
  dialAccessibleLabel
}: VoiceReasoningMirrorProps) {
  const development = reasoning.development;

  return (
    <section className="space-y-8">
      <div>
        <Text as="h2" variant="h2" className="mb-2">
          {messages.title}
        </Text>
        <Text variant="meta" className="w-full text-muted-foreground">
          {messages.subtitle}
        </Text>
      </div>

      <div className="space-y-4">
        <Text variant="label" className="block text-muted-foreground">
          {messages.coreTitle}
        </Text>
        <VoiceMirrorHero
          level={confidenceLevel}
          dialSubline={dialSubline}
          dialAccessibleLabel={dialAccessibleLabel}
          bodyCopy={reasoning.core.narrativeProse}
        />
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
        />
      </div>

      {development ? (
        <div className="space-y-4 border-t border-border-subtle/60 pt-8">
          <div>
            <Text variant="label" className="mb-2 block text-muted-foreground">
              {messages.developmentTitle}
            </Text>
            <Text variant="meta" className="mb-4 w-full text-muted-foreground">
              {messages.developmentSubtitle}
            </Text>
            <Text variant="body-lg" className="w-full whitespace-pre-wrap leading-relaxed text-foreground">
              {development.developmentProse}
            </Text>
            {reasoning.developmentImmature ? (
              <Text variant="meta" className="mt-3 w-full text-muted-foreground">
                {messages.developmentImmature}
              </Text>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <VoiceTraitChip
              label={messages.epistemicPosture}
              value={messages.enums.epistemicPosture[development.epistemicPosture]}
            />
            {development.moveLabels.map((move) => (
              <VoiceTraitChip key={move} label={messages.typicalMoves} value={formatMoveLabel(move)} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
