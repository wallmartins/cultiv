import { createFileRoute } from "@tanstack/react-router";
import { BlogStructuredData } from "~/blog/components/BlogStructuredData";
import { buildBlogPostingJsonLd } from "~/blog/seo/blog-json-ld";
import { BlogPostScreen } from "~/blog/screens/BlogPostScreen";
import { fetchBlogPost } from "~/blog/server/blog-fns";
import { resolveBlogPostHead } from "~/blog/seo/resolve-blog-head";
import { MarketingLayout } from "~/marketing/layouts/MarketingLayout";
import { getSiteUrl } from "~/marketing/seo/site-url";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params, location }) => {
    const includeScheduled =
      import.meta.env.DEV && new URLSearchParams(location.search).get("preview") === "future";
    return fetchBlogPost({
      data: { locale: "pt", slug: params.slug, includeScheduled }
    });
  },
  head: ({ loaderData }) =>
    loaderData ? resolveBlogPostHead("pt", loaderData) : {},
  component: BlogPostPt
});

function BlogPostPt() {
  const post = Route.useLoaderData();
  return (
    <MarketingLayout locale="pt" showSectionRail={false}>
      <BlogStructuredData data={buildBlogPostingJsonLd(post, getSiteUrl())} />
      <BlogPostScreen locale="pt" post={post} />
    </MarketingLayout>
  );
}
