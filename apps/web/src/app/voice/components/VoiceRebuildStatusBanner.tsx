import { Text } from "@my-ai-orchestrator/ui";
import { AppCard } from "~/platform/ui/AppCard";

export function VoiceRebuildStatusBanner(props: {
  readonly status: "idle" | "in_progress" | "failed";
  readonly updatingMessage: string;
  readonly failedMessage: string;
}) {
  if (props.status === "in_progress") {
    return (
      <AppCard padding="compact" className="border-pigment-ochre/40 bg-pigment-ochre/10">
        <Text variant="body">{props.updatingMessage}</Text>
      </AppCard>
    );
  }

  if (props.status === "failed") {
    return (
      <AppCard padding="compact" className="border-red-700/30 bg-red-700/10">
        <Text variant="body" className="text-red-800">
          {props.failedMessage}
        </Text>
      </AppCard>
    );
  }

  return null;
}
