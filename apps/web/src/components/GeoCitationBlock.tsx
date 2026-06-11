import { Text } from "@my-ai-orchestrator/ui";
import { getLocaleMessages } from "~/i18n/get-locale";
import type { MarketingLocale } from "~/i18n/types";

export interface GeoCitationBlockProps {
  readonly locale: MarketingLocale;
}

export function GeoCitationBlock({ locale }: GeoCitationBlockProps) {
  const { geo } = getLocaleMessages(locale);

  return (
    <aside
      id="product-definition"
      aria-label={geo.citationLabel}
      className="border-l border-moss/35 pl-5"
    >
      <Text as="p" variant="meta" className="mb-3 text-moss">
        {geo.citationLabel}
      </Text>
      <Text as="p" variant="body-lg" className="max-w-xl text-foreground">
        {geo.productDefinition}
      </Text>
    </aside>
  );
}
