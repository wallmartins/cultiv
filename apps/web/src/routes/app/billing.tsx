import { createFileRoute } from "@tanstack/react-router";
import { BillingScreen } from "~/app/billing/screens/BillingScreen";

type BillingSearch = {
  readonly status?: "success" | "cancel";
};

export const Route = createFileRoute("/app/billing")({
  validateSearch: (search: Record<string, unknown>): BillingSearch => ({
    status:
      search.status === "success" || search.status === "cancel" ? search.status : undefined
  }),
  component: BillingPage
});

function BillingPage() {
  return <BillingScreen />;
}
