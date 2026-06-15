import { createFileRoute } from "@tanstack/react-router";
import { ProductShowcase } from "~/marketing/components/ProductShowcase";
import { MarketingLayout } from "~/marketing/layouts/MarketingLayout";
import { resolveHomePageHead } from "~/marketing/seo/resolve-page-head";

export const Route = createFileRoute("/en/")({
  head: () => resolveHomePageHead("en"),
  component: EnglishShowcasePage
});

function EnglishShowcasePage() {
  return (
    <MarketingLayout locale="en">
      <ProductShowcase locale="en" />
    </MarketingLayout>
  );
}
