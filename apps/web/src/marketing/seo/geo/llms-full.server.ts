import { join } from "node:path";
import { getBlogPostPath } from "~/blog/seo/blog-paths";
import { resolveBlogContentRoot, resolveBlogPublicDir } from "~/blog/lib/blog-content-root.server";
import { loadBlogPostsFromDirectory } from "~/blog/lib/load-posts.server";
import { getMarketingContentTypes } from "~/marketing/content/content-types/catalog";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import type { MarketingLocale } from "~/i18n/marketing/types";
import { getSiteUrl } from "~/marketing/seo/site-url";
import { buildLlmsTxt } from "./llms";

function formatSection(title: string, lines: ReadonlyArray<string>): string {
  return `## ${title}\n\n${lines.join("\n")}\n`;
}

function buildRecentBlogPostsSection(): string {
  const siteUrl = getSiteUrl();
  const contentRoot = resolveBlogContentRoot();
  const publicDir = resolveBlogPublicDir();
  const lines = ["## Recent blog posts", ""];

  for (const blogLocale of ["pt", "en"] as const) {
    const posts = loadBlogPostsFromDirectory(blogLocale, join(contentRoot, blogLocale), {
      publicDir
    }).slice(0, 5);

    if (posts.length === 0) {
      continue;
    }

    lines.push(`### ${blogLocale === "pt" ? "Português" : "English"}`, "");
    for (const post of posts) {
      lines.push(`- ${post.title}: ${siteUrl}${getBlogPostPath(blogLocale, post.slug)}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

export function buildLlmsFullTxt(locale: MarketingLocale): string {
  const messages = getLocaleMessages(locale);
  const { llms } = messages.geo;
  const summary = buildLlmsTxt(locale);
  const contentTypes = getMarketingContentTypes(locale, messages.contentTypes);

  const routeSection = formatSection(
    llms.sections.productFlow,
    messages.route.steps.map((step) => {
      return `### ${step.index}, ${step.title}\n\n${step.body}`;
    })
  );

  const faqSection = formatSection(
    llms.sections.faq,
    messages.faq.items.map((item) => `### ${item.question}\n\n${item.answer}`)
  );

  const overviewSection = formatSection(llms.sections.overview, [
    messages.hero.subheadline
  ]);

  const formatsDetail = formatSection(
    llms.sections.formatsDetail,
    contentTypes.map(
      (type, index) =>
        `${index + 1}. **${type.label}** (\`${type.id}\`)\n   ${type.description}`
    )
  );

  return [
    summary.replace(llms.citationNote, "").trimEnd(),
    "",
    "---",
    "",
    `# ${llms.fullTitle}`,
    "",
    overviewSection.trimEnd(),
    "",
    routeSection.trimEnd(),
    "",
    formatsDetail.trimEnd(),
    "",
    faqSection.trimEnd(),
    "",
    buildRecentBlogPostsSection(),
    "",
    `*${llms.fullFooter}*`,
    ""
  ].join("\n");
}
