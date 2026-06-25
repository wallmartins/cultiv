import { createFileRoute } from "@tanstack/react-router";
import { BlogIndexScreen } from "~/blog/screens/BlogIndexScreen";
import { fetchBlogPosts } from "~/blog/server/blog-fns";
import { resolveBlogIndexHead } from "~/blog/seo/resolve-blog-head";
import { MarketingLayout } from "~/marketing/layouts/MarketingLayout";

export const Route = createFileRoute("/blog/")({
  loader: async ({ location }) => {
    const includeScheduled =
      import.meta.env.DEV && new URLSearchParams(location.search).get("preview") === "future";
    return fetchBlogPosts({ data: { locale: "pt", includeScheduled } });
  },
  head: () => resolveBlogIndexHead("pt"),
  component: BlogIndexPt
});

function BlogIndexPt() {
  const posts = Route.useLoaderData();
  return (
    <MarketingLayout locale="pt" showSectionRail={false}>
      <BlogIndexScreen locale="pt" posts={posts} />
    </MarketingLayout>
  );
}
