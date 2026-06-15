import { createFileRoute } from "@tanstack/react-router";
import { VoiceDashboard } from "~/app/voice/components/VoiceDashboard";

export const Route = createFileRoute("/app/voice/")({
  component: VoiceDashboardPage
});

function VoiceDashboardPage() {
  return <VoiceDashboard />;
}
