import { createFileRoute } from "@tanstack/react-router";
import { VoiceExamplesList } from "~/app/voice/components/VoiceExamplesList";

export const Route = createFileRoute("/app/voice/examples/")({
  component: VoiceExamplesPage
});

function VoiceExamplesPage() {
  return <VoiceExamplesList />;
}
