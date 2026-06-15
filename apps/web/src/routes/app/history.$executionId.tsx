import { createFileRoute } from "@tanstack/react-router";
import { ExecutionHistoryDetail } from "~/app/history/screens/ExecutionHistoryDetail";

export const Route = createFileRoute("/app/history/$executionId")({
  component: HistoryDetailPage
});

function HistoryDetailPage() {
  const { executionId } = Route.useParams();
  return <ExecutionHistoryDetail executionId={executionId} />;
}
