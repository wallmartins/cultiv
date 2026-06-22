import { createFileRoute, redirect } from "@tanstack/react-router";

type BillingSearch = {
  readonly status?: "success" | "cancel";
};

export const Route = createFileRoute("/app/billing")({
  validateSearch: (search: Record<string, unknown>): BillingSearch => ({
    status:
      search.status === "success" || search.status === "cancel" ? search.status : undefined
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/app/plans",
      search
    });
  }
});
