import { createFileRoute } from "@tanstack/react-router";
import { BlogIndexScreen } from "~/blog/screens/BlogIndexScreen";
import { fetchBlogTagPage } from "~/blog/server/blog-fns";
import { resolveBlogTagHead } from "~/blog/seo/resolve-blog-head";
import { getLocaleMessages } from "~/i18n/marketing/get-locale";
import { MarketingLayout } from "~/marketing/layouts/MarketingLayout";

export const Route = createFileRoute("/blog/tag/$tagSlug")({
  loader: async ({ params, location }) => {
    const includeScheduled =
      import.meta.env.DEV && new URLSearchParams(location.search).get("preview") === "future";
    return fetchBlogTagPage({
      data: { locale: "pt", tagSlug: params.tagSlug, includeScheduled }
    });
  },
  head: ({ loaderData }) =>
    loaderData
      ? resolveBlogTagHead("pt", loaderData.tag.slug, loaderData.tag.label.pt)
      : {},
  component: BlogTagPt
});

function BlogTagPt() {
  const { tag, posts } = Route.useLoaderData();
  const messages = getLocaleMessages("pt");
  const headingTitle = messages.blog.tagPageTitle.replace("{tag}", tag.label.pt);

  return (
    <MarketingLayout locale="pt" showSectionRail={false}>
      <BlogIndexScreen
        locale="pt"
        posts={posts}
        activeTagSlug={tag.slug}
        headingTitle={headingTitle}
      />
    </MarketingLayout>
  );
}
