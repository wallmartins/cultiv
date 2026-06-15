import { createFileRoute } from "@tanstack/react-router";
import { GenerationScreen } from "~/app/generation/screens/GenerationScreen";

export const Route = createFileRoute("/app/generate")({
  component: GeneratePage
});

function GeneratePage() {
  return <GenerationScreen />;
}
