import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "~/marketing/components/LegalDocumentPage";
import { getLegalDocument } from "~/marketing/content/legal/get-document";
import { MarketingLayout } from "~/marketing/layouts/MarketingLayout";
import { resolvePageSeo } from "~/marketing/seo/resolve-page-seo";

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
