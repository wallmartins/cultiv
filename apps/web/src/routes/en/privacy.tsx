import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "~/components/LegalDocumentPage";
import { getLegalDocument } from "~/content/legal/get-document";
import { MarketingLayout } from "~/layouts/MarketingLayout";
import { resolvePageSeo } from "~/utils/resolve-page-seo";

export const Route = createFileRoute("/en/privacy")({
  head: () => resolvePageSeo({ kind: "privacy", locale: "en" }),
  component: PrivacyPageEn
});

function PrivacyPageEn() {
  return (
    <MarketingLayout locale="en">
      <LegalDocumentPage
        document={getLegalDocument("en", "privacy")}
        locale="en"
        kind="privacy"
      />
    </MarketingLayout>
  );
}
