import { Button, Text } from "@my-ai-orchestrator/ui";
import { useId } from "react";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { AppModal } from "~/platform/ui/AppModal";

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
  const titleId = useId();

  return (
    <AppModal
      open={open}
      onClose={onCancel}
      titleId={titleId}
      overlayClassName="bg-paper/80"
      panelClassName="w-full max-w-md rounded-[var(--radius-cartography)] border border-ink bg-paper-elevated p-6 shadow-lg"
    >
      <Text as="h2" variant="h2" className="mb-3" id={titleId}>
        {messages.voice.consent.title}
      </Text>
      <Text variant="body" className="mb-6 text-ink-muted">
        {messages.voice.consent.body}
      </Text>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {messages.voice.consent.cancel}
        </Button>
        <Button type="button" data-app-modal-initial-focus onClick={onAccept}>
          {messages.voice.consent.accept}
        </Button>
      </div>
    </AppModal>
  );
}
