import { getShowcaseSamples } from "./get-samples.js";
import type { ShowcaseSample } from "./types.js";
import type { MarketingLocale } from "~/i18n/marketing/types";

export function getLinkedInShowcaseSample(locale: MarketingLocale): ShowcaseSample {
  const sample = getShowcaseSamples(locale).find((entry) => entry.id === "linkedin-post");
  if (!sample) {
    throw new Error(`LinkedIn showcase sample missing for locale: ${locale}`);
  }

  return sample;
}
