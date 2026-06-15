import { Button, Text } from "@my-ai-orchestrator/ui";
import { useAppLocale } from "~/i18n/app/use-app-locale";

export interface VoiceTrainingConsentModalProps {
  readonly open: boolean;
  readonly onCancel: () => void;
  readonly onAccept: () => void;
}

export function VoiceTrainingConsentModal({
  open,
  onCancel,
  onAccept
}: VoiceTrainingConsentModalProps) {
  const { messages } = useAppLocale();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-surface/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg"
      >
        <Text as="h2" variant="h2" className="mb-3">
          {messages.voice.consent.title}
        </Text>
        <Text variant="body" className="mb-6 text-muted-foreground">
          {messages.voice.consent.body}
        </Text>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {messages.voice.consent.cancel}
          </Button>
          <Button type="button" onClick={onAccept}>
            {messages.voice.consent.accept}
          </Button>
        </div>
      </div>
    </div>
  );
}
