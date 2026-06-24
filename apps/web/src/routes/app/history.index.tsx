import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";

const ExecutionHistoryScreen = lazy(async () => {
  const module = await import("~/app/history/screens/ExecutionHistoryScreen");
  return { default: module.ExecutionHistoryScreen };
});

export const Route = createFileRoute("/app/history/")({
  component: HistoryIndexPage
});

function HistoryIndexPage() {
  return (
    <Suspense fallback={<AppSkeleton className="h-64 w-full" />}>
      <ExecutionHistoryScreen />
    </Suspense>
  );
}
