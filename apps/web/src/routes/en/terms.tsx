import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "~/components/LegalDocumentPage";
import { getLegalDocument } from "~/content/legal/get-document";
import { MarketingLayout } from "~/layouts/MarketingLayout";
import { resolvePageSeo } from "~/utils/resolve-page-seo";

export const Route = createFileRoute("/en/terms")({
  head: () => resolvePageSeo({ kind: "terms", locale: "en" }),
  component: TermsPageEn
});

function TermsPageEn() {
  return (
    <MarketingLayout locale="en">
      <LegalDocumentPage
        document={getLegalDocument("en", "terms")}
        locale="en"
        kind="terms"
      />
    </MarketingLayout>
  );
}
