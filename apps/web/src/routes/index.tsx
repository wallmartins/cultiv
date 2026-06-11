import { createFileRoute } from "@tanstack/react-router";
import { ProductShowcase } from "~/components/ProductShowcase";
import { MarketingLayout } from "~/layouts/MarketingLayout";
import { resolveHomePageHead } from "~/utils/resolve-page-head";

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
