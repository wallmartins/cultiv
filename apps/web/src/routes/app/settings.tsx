import { createFileRoute } from "@tanstack/react-router";
import { SettingsScreen } from "~/app/settings/screens/SettingsScreen";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage
});

function SettingsPage() {
  return <SettingsScreen />;
}
