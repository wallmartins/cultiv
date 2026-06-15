import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/voice")({
  component: VoiceLayout
});

function VoiceLayout() {
  return <Outlet />;
}
