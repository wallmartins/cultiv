import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "~/components/LegalDocumentPage";
import { getLegalDocument } from "~/content/legal/get-document";
import { MarketingLayout } from "~/layouts/MarketingLayout";
import { resolvePageSeo } from "~/utils/resolve-page-seo";

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
