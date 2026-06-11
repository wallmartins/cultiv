import { createFileRoute } from "@tanstack/react-router";
import { ProductShowcase } from "~/components/ProductShowcase";
import { MarketingLayout } from "~/layouts/MarketingLayout";
import { resolveHomePageHead } from "~/utils/resolve-page-head";

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
