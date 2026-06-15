import { createFileRoute } from "@tanstack/react-router";
import { ExecutionHistoryDetail } from "~/app/history/screens/ExecutionHistoryDetail";

export const Route = createFileRoute("/app/generate/$executionId")({
  component: SyncExecutionPage
});

function SyncExecutionPage() {
  const { executionId } = Route.useParams();
  return <ExecutionHistoryDetail executionId={executionId} />;
}
