import { getBlogIndexPath, getBlogRssPath } from "../../../blog/seo/blog-paths.js";
import { getMarketingContentTypes } from "../../content/content-types/catalog.js";
import {
  getHomePath,
  getLocaleMessages,
  getPrivacyPath,
  getTermsPath
} from "../../../i18n/marketing/get-locale.js";
import type { MarketingLocale } from "../../../i18n/marketing/types.js";
import { llmsPath } from "./llms-path.js";
import { getSiteUrl } from "../site-url.js";

function formatSection(title: string, lines: ReadonlyArray<string>): string {
  return `## ${title}\n\n${lines.join("\n")}\n`;
}

export function buildLlmsTxt(locale: MarketingLocale): string {
  const siteUrl = getSiteUrl();
  const messages = getLocaleMessages(locale);
  const { llms } = messages.geo;
  const homeUrl = `${siteUrl}${getHomePath(locale)}`;
  const alternateLocale = locale === "pt" ? "en" : "pt";
  const alternateLlms = `${siteUrl}${llmsPath(alternateLocale, false)}`;
  const fullLlms = `${siteUrl}${llmsPath(locale, true)}`;
  const contentTypes = getMarketingContentTypes(locale, messages.contentTypes);

  const lines = [
    `# ${llms.title}`,
    "",
    `> ${llms.tagline}`,
    "",
    formatSection(llms.sections.product, [llms.summary, "", `**${llms.differentiatorLabel}:** ${llms.differentiator}`]),
    formatSection(llms.sections.audience, [llms.audience]),
    formatSection(llms.sections.pricing, [llms.pricing]),
    formatSection(llms.sections.facts, messages.geo.keyFacts.map((fact) => `- ${fact}`)),
    formatSection(
      llms.sections.formats,
      contentTypes.map((type) => `- **${type.label}** (${type.id}): ${type.description}`)
    ),
    formatSection(llms.sections.urls, [
      `- ${llms.labels.home}: ${homeUrl}`,
      `- ${llms.labels.privacy}: ${siteUrl}${getPrivacyPath(locale)}`,
      `- ${llms.labels.terms}: ${siteUrl}${getTermsPath(locale)}`,
      `- ${llms.labels.signup}: ${siteUrl}/login`
    ]),
    formatSection(llms.sections.contact, [
      `- ${llms.labels.email}: ${messages.footer.contact}`,
      `- ${llms.labels.location}: ${messages.footer.location}`
    ]),
    formatSection("Blog", [
      `- Index (pt): ${siteUrl}${getBlogIndexPath("pt")}`,
      `- RSS (pt): ${siteUrl}${getBlogRssPath("pt")}`,
      `- Index (en): ${siteUrl}${getBlogIndexPath("en")}`,
      `- RSS (en): ${siteUrl}${getBlogRssPath("en")}`
    ]),
    "## Documentation",
    "",
    `- ${llms.labels.fullDoc}: ${fullLlms}`,
    `- ${llms.labels.alternateLocale}: ${alternateLlms}`,
    "",
    llms.citationNote
  ];

  return lines.join("\n").trimEnd() + "\n";
}
