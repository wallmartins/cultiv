import { createFileRoute } from "@tanstack/react-router";
import { ProductShowcase } from "~/marketing/components/ProductShowcase";
import { MarketingLayout } from "~/marketing/layouts/MarketingLayout";
import { resolveHomePageHead } from "~/marketing/seo/resolve-page-head";

export const Route = createFileRoute("/")({
  head: () => resolveHomePageHead("pt"),
  component: PortugueseShowcasePage
});

function PortugueseShowcasePage() {
  return (
    <MarketingLayout locale="pt">
      <ProductShowcase locale="pt" />
    </MarketingLayout>
  );
}
