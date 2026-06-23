import type { BriefingGuidanceView } from "@my-ai-orchestrator/contracts";
import { Text } from "@my-ai-orchestrator/ui";
import { getBriefingGuidance } from "~/i18n/app/briefing-guidance";
import { getIntentBriefingGuidance } from "~/i18n/app/intent-briefing";
import type { AppLocale } from "~/i18n/app/types";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { AppCard } from "~/platform/ui/AppCard";

export function BriefingGuidancePanel({
  locale,
  item,
  guidanceSource = "content-type"
}: {
  readonly locale: AppLocale;
  readonly item: { readonly id: string; readonly briefingGuidance: BriefingGuidanceView };
  readonly guidanceSource?: "content-type" | "intent";
}) {
  const { messages } = useAppLocale();
  const guidance =
    guidanceSource === "intent"
      ? getIntentBriefingGuidance(locale, item.id, item.briefingGuidance)
      : getBriefingGuidance(locale, item.id, item.briefingGuidance);

  return (
    <AppCard className="bg-paper-pressed/30">
      <Text as="h2" variant="label" className="mb-2">
        {messages.generate.guidanceTitle}
      </Text>
      <Text variant="meta" className="mb-3 block">
        {guidance.objective}
      </Text>
      {guidance.tips.length > 0 ? (
        <div className="mb-3">
          <Text variant="meta" className="mb-1 font-medium">
            {messages.generate.guidanceTips}
          </Text>
          <ul className="list-disc space-y-1 pl-5">
            {guidance.tips.map((tip) => (
              <li key={tip}>
                <Text variant="meta">{tip}</Text>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {guidance.commonMistakes.length > 0 ? (
        <div>
          <Text variant="meta" className="mb-1 font-medium">
            {messages.generate.guidanceMistakes}
          </Text>
          <ul className="list-disc space-y-1 pl-5">
            {guidance.commonMistakes.map((mistake) => (
              <li key={mistake}>
                <Text variant="meta">{mistake}</Text>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </AppCard>
  );
}
