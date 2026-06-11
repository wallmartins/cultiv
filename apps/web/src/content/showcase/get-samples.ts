import { blogPostSample as blogPostEn } from "./en/blog-post.js";
import { linkedinPostSample as linkedinEn } from "./en/linkedin-post.js";
import { threadSample as threadEn } from "./en/thread.js";
import { blogPostSample as blogPostPt } from "./pt/blog-post.js";
import { linkedinPostSample as linkedinPt } from "./pt/linkedin-post.js";
import { threadSample as threadPt } from "./pt/thread.js";
import type { ShowcaseSample } from "./types.js";
import type { MarketingLocale } from "~/i18n/types";

const catalogs: Record<MarketingLocale, ReadonlyArray<ShowcaseSample>> = {
  pt: [blogPostPt, linkedinPt, threadPt],
  en: [blogPostEn, linkedinEn, threadEn]
};

export function getShowcaseSamples(locale: MarketingLocale): ReadonlyArray<ShowcaseSample> {
  return catalogs[locale];
}
