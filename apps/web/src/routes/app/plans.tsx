import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";

const PlansScreen = lazy(async () => {
  const module = await import("~/app/plans/screens/PlansScreen");
  return { default: module.PlansScreen };
});

type PlansSearch = {
  readonly status?: "success" | "cancel";
  readonly checkout?: "criador" | "pro";
  readonly currency?: "BRL" | "USD";
  readonly period?: "monthly" | "annual";
};

function readPlansSearch(search: Record<string, unknown>): PlansSearch {
  const checkout = search.checkout === "criador" || search.checkout === "pro" ? search.checkout : undefined;
  const currency = search.currency === "BRL" || search.currency === "USD" ? search.currency : undefined;
  const period = search.period === "monthly" || search.period === "annual" ? search.period : undefined;
  const status = search.status === "success" || search.status === "cancel" ? search.status : undefined;
  return { checkout, currency, period, status };
}

export const Route = createFileRoute("/app/plans")({
  validateSearch: readPlansSearch,
  component: PlansPage
});

function PlansPage() {
  return (
    <Suspense fallback={<AppSkeleton className="h-64 w-full" />}>
      <PlansScreen />
    </Suspense>
  );
}
