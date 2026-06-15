import { createFileRoute } from "@tanstack/react-router";
import { Container, Text } from "@my-ai-orchestrator/ui";
import { useEffect, useState } from "react";
import { VoiceExampleComposer } from "~/app/voice/components/VoiceExampleComposer";
import type { VoiceExampleListItemView } from "@my-ai-orchestrator/contracts";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { useNavigate } from "@tanstack/react-router";
import { useAppLocale } from "~/i18n/app/use-app-locale";

export const Route = createFileRoute("/app/voice/examples/$id/edit")({
  component: EditVoiceExamplePage
});

function EditVoiceExamplePage() {
  const { id } = Route.useParams();
  const client = useClientSdk();
  const navigate = useNavigate();
  const { messages } = useAppLocale();
  const [example, setExample] = useState<VoiceExampleListItemView | null>(null);

  useEffect(() => {
    void client
      .toPromise(client.voice.listExamples({ limit: 100, offset: 0 }))
      .then((page) => setExample(page.items.find((item) => item.exampleId === id) ?? null));
  }, [client, id]);

  if (!example) {
    return (
      <Container className="py-8">
        <Text variant="meta">…</Text>
      </Container>
    );
  }

  return (
    <Container className="py-8 md:py-10">
      <Text as="h1" variant="h1" className="mb-6">
        {messages.voice.editExampleTitle}
      </Text>
      <VoiceExampleComposer
        mode="edit"
        initialExample={example}
        onSaved={() => void navigate({ to: "/app/voice/examples" })}
      />
    </Container>
  );
}
