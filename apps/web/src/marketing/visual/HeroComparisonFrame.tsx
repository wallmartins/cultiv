import type { LocaleMessages } from "~/i18n/marketing/types";
import { ComparisonFrame } from "~/marketing/visual/ComparisonFrame";

type HeroMessages = LocaleMessages["hero"];

export interface HeroComparisonFrameProps {
  readonly messages: HeroMessages;
}

export function HeroComparisonFrame({ messages }: HeroComparisonFrameProps) {
  return (
    <ComparisonFrame
      idPrefix="hero"
      className="max-w-xl lg:max-w-none"
      messages={{
        comparisonLabel: messages.comparisonLabel,
        genericLabel: messages.genericLabel,
        voiceLabel: messages.voiceLabel,
        genericLine1: messages.genericLine1,
        genericLine2: messages.genericLine2,
        voiceLine1: messages.voiceLine1,
        voiceLine2: messages.voiceLine2,
      }}
    />
  );
}
