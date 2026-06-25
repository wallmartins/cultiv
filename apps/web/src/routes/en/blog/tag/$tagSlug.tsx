import { createFileRoute } from "@tanstack/react-router";
import { BlogIndexScreen } from "~/blog/screens/BlogIndexScreen";
import { fetchBlogTagPage } from "~/blog/server/blog-fns";
import { resolveBlogTagHead } from "~/blog/seo/resolve-blog-head";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import { MarketingLayout } from "~/marketing/layouts/MarketingLayout";

export const Route = createFileRoute("/en/blog/tag/$tagSlug")({
  loader: async ({ params, location }) => {
    const includeScheduled =
      import.meta.env.DEV && new URLSearchParams(location.search).get("preview") === "future";
    return fetchBlogTagPage({
      data: { locale: "en", tagSlug: params.tagSlug, includeScheduled }
    });
  },
  head: ({ loaderData }) =>
    loaderData
      ? resolveBlogTagHead("en", loaderData.tag.slug, loaderData.tag.label.en)
      : {},
  component: BlogTagEn
});

function BlogTagEn() {
  const { tag, posts } = Route.useLoaderData();
  const messages = getLocaleMessages("en");
  const headingTitle = messages.blog.tagPageTitle.replace("{tag}", tag.label.en);

  return (
    <MarketingLayout locale="en" showSectionRail={false}>
      <BlogIndexScreen
        locale="en"
        posts={posts}
        activeTagSlug={tag.slug}
        headingTitle={headingTitle}
      />
    </MarketingLayout>
  );
}
