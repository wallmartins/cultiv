import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";

const PlansScreen = lazy(async () => {
  const module = await import("~/app/plans/screens/PlansScreen");
  return { default: module.PlansScreen };
});

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
  return (
    <Suspense fallback={<AppSkeleton className="h-64 w-full" />}>
      <PlansScreen />
    </Suspense>
  );
}
