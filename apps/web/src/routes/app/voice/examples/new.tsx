import { createFileRoute } from "@tanstack/react-router";
import { VoiceExampleComposer } from "~/app/voice/components/VoiceExampleComposer";
import { Container, Text } from "@my-ai-orchestrator/ui";
import { useNavigate } from "@tanstack/react-router";
import { useAppLocale } from "~/i18n/app/use-app-locale";

export const Route = createFileRoute("/app/voice/examples/new")({
  component: NewVoiceExamplePage
});

function NewVoiceExamplePage() {
  const navigate = useNavigate();
  const { messages } = useAppLocale();

  return (
    <Container className="py-8 md:py-10">
      <Text as="h1" variant="h1" className="mb-6">
        {messages.voice.newExampleTitle}
      </Text>
      <VoiceExampleComposer
        mode="create"
        onSaved={() => void navigate({ to: "/app/voice" })}
      />
    </Container>
  );
}
