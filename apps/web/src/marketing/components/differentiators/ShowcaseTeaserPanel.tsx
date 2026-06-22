import { Text } from "@my-ai-orchestrator/ui";
import { ShowcaseVariantPanel } from "~/marketing/components/ShowcaseVariantPanel";
import type { ShowcaseSample } from "~/marketing/content/showcase/types";
import type { LocaleMessages } from "~/i18n/marketing/types";

export interface ShowcaseTeaserPanelProps {
  readonly sample: ShowcaseSample;
  readonly showcase: LocaleMessages["showcase"];
}

export function ShowcaseTeaserPanel({ sample, showcase }: ShowcaseTeaserPanelProps) {
  return (
    <div className="space-y-4">
      <ShowcaseVariantPanel sample={sample} showcase={showcase} />
      <Text as="p" variant="meta" className="text-ink-muted">
        {sample.briefing}
      </Text>
    </div>
  );
}
