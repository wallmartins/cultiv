import { createFileRoute } from "@tanstack/react-router";
import { ExecutionHistoryScreen } from "~/app/history/screens/ExecutionHistoryScreen";

export const Route = createFileRoute("/app/history")({
  component: HistoryPage
});

function HistoryPage() {
  return <ExecutionHistoryScreen />;
}
