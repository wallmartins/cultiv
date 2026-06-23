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
    <AppCard className="bg-creme border-borda/15">
      <div className="flex items-center gap-2 mb-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-terracota/60">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <Text as="h2" variant="label" className="font-playfair text-azul">
          {messages.generate.guidanceTitle}
        </Text>
      </div>
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
