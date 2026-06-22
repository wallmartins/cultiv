import { createFileRoute } from "@tanstack/react-router";
import { PlansScreen } from "~/app/plans/screens/PlansScreen";

type PlansSearch = {
  readonly status?: "success" | "cancel";
};

export const Route = createFileRoute("/app/plans")({
  validateSearch: (search: Record<string, unknown>): PlansSearch => ({
    status:
      search.status === "success" || search.status === "cancel" ? search.status : undefined
  }),
  component: PlansPage
});

function PlansPage() {
  return <PlansScreen />;
}
