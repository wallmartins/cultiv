import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AppSkeleton } from "~/platform/ui/AppSkeleton";

const ExecutionHistoryDetail = lazy(async () => {
  const module = await import("~/app/history/screens/ExecutionHistoryDetail");
  return { default: module.ExecutionHistoryDetail };
});

export const Route = createFileRoute("/app/generate/$executionId")({
  component: SyncExecutionPage
});

function SyncExecutionPage() {
  const { executionId } = Route.useParams();
  return (
    <Suspense fallback={<AppSkeleton className="h-64 w-full" />}>
      <ExecutionHistoryDetail executionId={executionId} />
    </Suspense>
  );
}
