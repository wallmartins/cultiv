import { createFileRoute } from "@tanstack/react-router";
import { BlogIndexScreen } from "~/blog/screens/BlogIndexScreen";
import { fetchBlogPosts } from "~/blog/server/blog-fns";
import { resolveBlogIndexHead } from "~/blog/seo/resolve-blog-head";
import { MarketingLayout } from "~/marketing/layouts/MarketingLayout";

export const Route = createFileRoute("/en/blog/")({
  loader: async ({ location }) => {
    const includeScheduled =
      import.meta.env.DEV && new URLSearchParams(location.search).get("preview") === "future";
    return fetchBlogPosts({ data: { locale: "en", includeScheduled } });
  },
  head: () => resolveBlogIndexHead("en"),
  component: BlogIndexEn
});

function BlogIndexEn() {
  const posts = Route.useLoaderData();
  return (
    <MarketingLayout locale="en" showSectionRail={false}>
      <BlogIndexScreen locale="en" posts={posts} />
    </MarketingLayout>
  );
}
