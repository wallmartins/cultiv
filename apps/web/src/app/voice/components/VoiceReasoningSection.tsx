import { Text } from "@my-ai-orchestrator/ui";
import { AppCard } from "~/platform/ui/AppCard";
import { getContentTypeLabel } from "~/i18n/app/content-types";
import type { VoiceProfileScreenView, VoiceReasoningPresentationView } from "@my-ai-orchestrator/contracts";
import type { AppLocale, AppMessages } from "~/i18n/app/types";

interface VoiceReasoningSectionProps {
  readonly locale: AppLocale;
  readonly messages: AppMessages["voice"]["reasoning"];
  readonly reasoning: VoiceReasoningPresentationView;
  readonly diagnostics: VoiceProfileScreenView["diagnostics"];
}

export function VoiceReasoningSection({
  locale,
  messages,
  reasoning,
  diagnostics
}: VoiceReasoningSectionProps) {
  const rebuildStatus = diagnostics.pendingRebuild.status;

  return (
    <section className="space-y-4">
      <div>
        <Text as="h2" variant="h2" className="mb-2">
          {messages.title}
        </Text>
        <Text variant="body" className="text-muted-foreground">
          {messages.subtitle}
        </Text>
      </div>

      {rebuildStatus === "in_progress" ? (
        <AppCard padding="compact" className="border-golden/40 bg-golden/10">
          <Text variant="meta">{messages.rebuilding}</Text>
        </AppCard>
      ) : null}

      {rebuildStatus === "failed" ? (
        <AppCard padding="compact" className="border-amber-700/30 bg-amber-700/10">
          <Text variant="meta" className="text-amber-900">
            {messages.failedKeepLast}
          </Text>
        </AppCard>
      ) : null}

      <AppCard>
        <Text variant="label" className="mb-3 block">
          {messages.coreTitle}
        </Text>
        <Text variant="body" className="mb-4 whitespace-pre-wrap text-foreground">
          {reasoning.core.narrativeProse}
        </Text>
        <dl className="grid gap-3 sm:grid-cols-2">
          <ReasoningEnumItem label={messages.certaintyLevel} value={messages.enums.certaintyLevel[reasoning.core.certaintyLevel]} />
          <ReasoningEnumItem label={messages.judgmentFrequency} value={messages.enums.judgmentFrequency[reasoning.core.judgmentFrequency]} />
          <ReasoningEnumItem label={messages.conclusionPace} value={messages.enums.conclusionPace[reasoning.core.conclusionPace]} />
          <ReasoningEnumItem label={messages.readerRelationship} value={messages.enums.readerRelationship[reasoning.core.readerRelationship]} />
          <ReasoningEnumItem label={messages.authoritySource} value={messages.enums.authoritySource[reasoning.core.authoritySource]} />
        </dl>
      </AppCard>

      {reasoning.formatExpressions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {reasoning.formatExpressions.map((expression) => (
            <AppCard key={expression.contentType}>
              <Text variant="label" className="mb-2 block">
                {getContentTypeLabel(locale, expression.contentType, expression.contentType)}
              </Text>
              <Text variant="meta" className="mb-3 block text-muted-foreground">
                {expression.narrativeProse}
              </Text>
              <Text variant="meta" className="text-muted-foreground">
                {messages.register}: {messages.enums.register[expression.register]}
              </Text>
              <Text variant="meta" className="text-muted-foreground">
                {messages.openingStyle}: {messages.enums.openingStyle[expression.openingStyle]}
              </Text>
              <Text variant="meta" className="text-muted-foreground">
                {messages.technicalDensity}: {messages.enums.technicalDensity[expression.technicalDensity]}
              </Text>
            </AppCard>
          ))}
        </div>
      ) : (
        <AppCard padding="compact">
          <Text variant="meta" className="text-muted-foreground">
            {messages.partialFormats}
          </Text>
        </AppCard>
      )}

      <AppCard>
        <Text variant="label" className="mb-3 block">
          {messages.antiPatternsTitle}
        </Text>
        {reasoning.core.derivedAntiPatterns.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {reasoning.core.derivedAntiPatterns.map((pattern) => (
              <li key={pattern}>
                <Text variant="meta">{pattern}</Text>
              </li>
            ))}
          </ul>
        ) : (
          <Text variant="meta" className="text-muted-foreground">
            {messages.noAntiPatterns}
          </Text>
        )}
        <Text variant="meta" className="mt-4 text-muted-foreground">
          {messages.refineHint}
        </Text>
      </AppCard>
    </section>
  );
}

function ReasoningEnumItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <Text variant="meta" className="text-muted-foreground">
        {label}
      </Text>
      <Text variant="meta" className="font-medium text-foreground">
        {value}
      </Text>
    </div>
  );
}
