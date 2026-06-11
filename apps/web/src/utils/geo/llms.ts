import { getMarketingContentTypes } from "../../content/content-types/catalog.js";
import {
  getHomePath,
  getLocaleMessages,
  getPrivacyPath,
  getTermsPath
} from "../../i18n/get-locale.js";
import type { MarketingLocale } from "../../i18n/types.js";
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
  const contentTypes = getMarketingContentTypes(locale, messages.formats.types);

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
      `- ${llms.labels.waitlist}: ${homeUrl}#waitlist`
    ]),
    formatSection(llms.sections.contact, [
      `- ${llms.labels.email}: ${messages.footer.contact}`,
      `- ${llms.labels.location}: ${messages.footer.location}`
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

export function buildLlmsFullTxt(locale: MarketingLocale): string {
  const siteUrl = getSiteUrl();
  const messages = getLocaleMessages(locale);
  const { llms } = messages.geo;
  const summary = buildLlmsTxt(locale);
  const contentTypes = getMarketingContentTypes(locale, messages.formats.types);

  const methodSection = formatSection(
    llms.sections.method,
    messages.method.steps.map(
      (step) => `### ${step.index} — ${step.title}\n\n${step.body}`
    )
  );

  const faqSection = formatSection(
    llms.sections.faq,
    messages.faq.items.map((item) => `### ${item.question}\n\n${item.answer}`)
  );

  const aboutSection = formatSection(llms.sections.about, [
    messages.about.intro,
    "",
    messages.about.detail
  ]);

  const formatsDetail = formatSection(
    llms.sections.formatsDetail,
    contentTypes.map(
      (type, index) =>
        `${index + 1}. **${type.label}** (\`${type.id}\`)\n   ${type.description}`
    )
  );

  const showcaseSection = formatSection(llms.sections.showcase, [
    messages.showcase.description,
    "",
    llms.showcaseNote
  ]);

  return [
    summary.replace(llms.citationNote, "").trimEnd(),
    "",
    "---",
    "",
    `# ${llms.fullTitle}`,
    "",
    aboutSection.trimEnd(),
    "",
    methodSection.trimEnd(),
    "",
    formatsDetail.trimEnd(),
    "",
    showcaseSection.trimEnd(),
    "",
    faqSection.trimEnd(),
    "",
    `*${llms.fullFooter}*`,
    ""
  ].join("\n");
}

export function buildGeoRobotsTxt(siteUrl: string): string {
  const aiAgents = [
    "GPTBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "Google-Extended",
    "PerplexityBot",
    "Applebot-Extended",
    "cohere-ai"
  ];

  const aiRules = aiAgents
    .map((agent) => `User-agent: ${agent}\nAllow: /`)
    .join("\n\n");

  return `User-agent: *
Allow: /

${aiRules}

Sitemap: ${siteUrl}/sitemap.xml
Llms-txt: ${siteUrl}/llms.txt
`;
}
