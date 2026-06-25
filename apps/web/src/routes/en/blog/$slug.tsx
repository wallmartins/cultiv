import { createFileRoute } from "@tanstack/react-router";
import { BlogStructuredData } from "~/blog/components/BlogStructuredData";
import { buildBlogPostingJsonLd } from "~/blog/seo/blog-json-ld";
import { BlogPostScreen } from "~/blog/screens/BlogPostScreen";
import { fetchBlogPost } from "~/blog/server/blog-fns";
import { resolveBlogPostHead } from "~/blog/seo/resolve-blog-head";
import { MarketingLayout } from "~/marketing/layouts/MarketingLayout";
import { getSiteUrl } from "~/marketing/seo/site-url";

export const Route = createFileRoute("/en/blog/$slug")({
  loader: async ({ params, location }) => {
    const includeScheduled =
      import.meta.env.DEV && new URLSearchParams(location.search).get("preview") === "future";
    return fetchBlogPost({
      data: { locale: "en", slug: params.slug, includeScheduled }
    });
  },
  head: ({ loaderData }) =>
    loaderData ? resolveBlogPostHead("en", loaderData) : {},
  component: BlogPostEn
});

function BlogPostEn() {
  const post = Route.useLoaderData();
  return (
    <MarketingLayout locale="en" showSectionRail={false}>
      <BlogStructuredData data={buildBlogPostingJsonLd(post, getSiteUrl())} />
      <BlogPostScreen locale="en" post={post} />
    </MarketingLayout>
  );
}
