import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/history")({
  component: HistoryLayout
});

function HistoryLayout() {
  return <Outlet />;
}
