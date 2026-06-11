import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "~/components/LegalDocumentPage";
import { getLegalDocument } from "~/content/legal/get-document";
import { MarketingLayout } from "~/layouts/MarketingLayout";
import { resolvePageSeo } from "~/utils/resolve-page-seo";

export const Route = createFileRoute("/terms")({
  head: () => resolvePageSeo({ kind: "terms", locale: "pt" }),
  component: TermsPagePt
});

function TermsPagePt() {
  return (
    <MarketingLayout locale="pt">
      <LegalDocumentPage document={getLegalDocument("pt", "terms")} locale="pt" kind="terms" />
    </MarketingLayout>
  );
}
