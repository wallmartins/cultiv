import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "~/marketing/components/LegalDocumentPage";
import { getLegalDocument } from "~/marketing/content/legal/get-document";
import { MarketingLayout } from "~/marketing/layouts/MarketingLayout";
import { resolvePageSeo } from "~/marketing/seo/resolve-page-seo";

export const Route = createFileRoute("/privacy")({
  head: () => resolvePageSeo({ kind: "privacy", locale: "pt" }),
  component: PrivacyPagePt
});

function PrivacyPagePt() {
  return (
    <MarketingLayout locale="pt">
      <LegalDocumentPage
        document={getLegalDocument("pt", "privacy")}
        locale="pt"
        kind="privacy"
      />
    </MarketingLayout>
  );
}
