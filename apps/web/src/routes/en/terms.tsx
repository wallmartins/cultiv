import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "~/marketing/components/LegalDocumentPage";
import { getLegalDocument } from "~/marketing/content/legal/get-document";
import { MarketingLayout } from "~/marketing/layouts/MarketingLayout";
import { resolvePageSeo } from "~/marketing/seo/resolve-page-seo";

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
