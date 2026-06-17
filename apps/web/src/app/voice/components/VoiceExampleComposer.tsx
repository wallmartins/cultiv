import { useAuth0 } from "@auth0/auth0-react";
import type { VoiceExampleListItemView } from "@my-ai-orchestrator/contracts";
import { Button, Text } from "@my-ai-orchestrator/ui";
import { useState } from "react";
import { VoiceTrainingConsentModal } from "~/app/voice/components/VoiceTrainingConsentModal";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { HelpTooltip } from "~/platform/ui/HelpTooltip";
import { getContentTypeDescription, getContentTypeLabel } from "~/i18n/app/content-types";
import { getGenerationLanguageLabel } from "~/i18n/app/generation-languages";
import { grantVoiceConsent, hasVoiceConsent } from "~/app/voice/lib/voice-consent-storage";
import { saveVoiceExamples, type VoiceComposerSlot } from "~/app/voice/lib/route-voice-save";
import { VOICE_EXAMPLE_FORMATS } from "~/app/voice/lib/voice-example-formats";
import { useClientSdk } from "~/platform/runtime/client-sdk-context";
import { AppSelect } from "~/platform/ui/AppSelect";
import { lenisScrollRegionProps } from "~/platform/ui/lenis-scroll-region";

type SlotState = {
  readonly id: string;
  readonly text: string;
  readonly format: string;
  readonly language: string;
  readonly context: string;
  readonly antiPatterns: string;
  readonly pinned: boolean;
  readonly error?: string;
};

export interface VoiceExampleComposerProps {
  readonly mode: "create" | "edit";
  readonly initialExample?: VoiceExampleListItemView;
  readonly onSaved?: () => void;
}

function createEmptySlot(): SlotState {
  return {
    id: crypto.randomUUID(),
    text: "",
    format: "",
    language: "",
    context: "",
    antiPatterns: "",
    pinned: false
  };
}

export function VoiceExampleComposer({ mode, initialExample, onSaved }: VoiceExampleComposerProps) {
  const { user } = useAuth0();
  const { locale, messages } = useAppLocale();
  const client = useClientSdk();
  const userId = user?.sub;
  const [slots, setSlots] = useState<readonly SlotState[]>(() => [
    initialExample
      ? {
          id: initialExample.exampleId,
          text: initialExample.text,
          format: initialExample.explicitContentType ?? "linkedin-post",
          language: initialExample.language,
          context: "",
          antiPatterns: "",
          pinned: initialExample.pinned
        }
      : createEmptySlot()
  ]);
  const [advancedOpen, setAdvancedOpen] = useState<Record<string, boolean>>({});
  const [consentOpen, setConsentOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [batchErrors, setBatchErrors] = useState<Record<string, string>>({});

  function updateSlot(id: string, patch: Partial<SlotState>) {
    setSlots((current) => current.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)));
  }

  function validateSlots(nextSlots: readonly SlotState[]): readonly SlotState[] {
    return nextSlots.map((slot) => {
      if (!slot.text.trim()) {
        return { ...slot, error: messages.voice.composer.required };
      }

      if (slot.text.trim().length < 20) {
        return { ...slot, error: messages.voice.composer.tooShort };
      }

      if (!slot.format) {
        return { ...slot, error: messages.voice.composer.formatRequired };
      }

      if (!slot.language) {
        return { ...slot, error: messages.voice.composer.languageRequired };
      }

      return { ...slot, error: undefined };
    });
  }

  async function persistSlots() {
    const validated = validateSlots(slots);
    setSlots(validated);
    if (validated.some((slot) => slot.error)) {
      return;
    }

    setSaving(true);
    setBatchErrors({});

    try {
      if (mode === "edit" && initialExample) {
        const slot = validated[0]!;
        await client.toPromise(
          client.voice.updateExample({
            exampleId: initialExample.exampleId,
            text: slot.text,
            language: slot.language,
            explicitContentType: slot.format,
            context: slot.context || undefined,
            antiPatternsExplicit: slot.antiPatterns
              ? slot.antiPatterns.split(",").map((part) => part.trim()).filter(Boolean)
              : undefined,
            pinned: slot.pinned
          })
        );
        onSaved?.();
        return;
      }

      const payload: VoiceComposerSlot[] = validated.map((slot) => ({
        clientItemId: slot.id,
        text: slot.text,
        language: slot.language,
        explicitContentType: slot.format,
        context: slot.context || undefined,
        antiPatternsExplicit: slot.antiPatterns
          ? slot.antiPatterns.split(",").map((part) => part.trim()).filter(Boolean)
          : undefined,
        pinned: slot.pinned
      }));

      const result = await saveVoiceExamples(client, payload);
      if (result.mode === "batch" && result.rejected.length > 0) {
        const nextErrors: Record<string, string> = {};
        for (const rejected of result.rejected) {
          nextErrors[rejected.clientItemId] = rejected.message;
        }
        setBatchErrors(nextErrors);
        return;
      }

      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  function handleSaveClick() {
    if (!hasVoiceConsent(userId)) {
      setConsentOpen(true);
      return;
    }

    void persistSlots();
  }

  return (
    <div className="space-y-6">
      {slots.map((slot, index) => (
        <div key={slot.id} className="rounded-2xl border border-border-subtle p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Text variant="label">
              {messages.voice.composer.slotTitle.replace("{n}", String(index + 1))}
            </Text>
            {mode === "create" && slots.length > 1 ? (
              <button
                type="button"
                className="text-sm text-muted-foreground"
                onClick={() => setSlots((current) => current.filter((entry) => entry.id !== slot.id))}
              >
                {messages.voice.composer.removeSlot}
              </button>
            ) : null}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                {messages.voice.composer.text} *
              </label>
              <textarea
                className="mt-2 min-h-32 w-full border border-foreground bg-transparent px-4 py-3"
                {...lenisScrollRegionProps}
                value={slot.text}
                onChange={(event) => updateSlot(slot.id, { text: event.target.value })}
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                {messages.voice.composer.format} *
                {slot.format && getContentTypeDescription(locale, slot.format) ? (
                  <HelpTooltip
                    text={getContentTypeDescription(locale, slot.format)!}
                    ariaLabel={messages.voice.composer.formatHelp}
                    placement="responsive-end"
                    size="wide"
                  />
                ) : null}
              </label>
              <AppSelect
                className="mt-2"
                value={slot.format}
                onChange={(format) => updateSlot(slot.id, { format })}
                placeholder={messages.shell.selectPlaceholder}
                options={VOICE_EXAMPLE_FORMATS.map((format) => ({
                  value: format,
                  label: getContentTypeLabel(locale, format, format)
                }))}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                {messages.voice.composer.language} *
              </label>
              <AppSelect
                className="mt-2"
                value={slot.language}
                onChange={(language) => updateSlot(slot.id, { language })}
                placeholder={messages.shell.selectPlaceholder}
                options={[
                  { value: "pt-BR", label: getGenerationLanguageLabel(locale, "pt-BR") },
                  { value: "en", label: getGenerationLanguageLabel(locale, "en") }
                ]}
              />
            </div>

            <button
              type="button"
              className="text-sm font-medium text-moss"
              onClick={() =>
                setAdvancedOpen((current) => ({ ...current, [slot.id]: !current[slot.id] }))
              }
            >
              {messages.voice.composer.advanced}
            </button>

            {advancedOpen[slot.id] ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {messages.voice.composer.context}
                  </label>
                  <textarea
                    className="mt-2 min-h-20 w-full border border-foreground bg-transparent px-4 py-3"
                    {...lenisScrollRegionProps}
                    value={slot.context}
                    onChange={(event) => updateSlot(slot.id, { context: event.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {messages.voice.composer.antiPatterns}
                  </label>
                  <input
                    className="mt-2 w-full border border-foreground bg-transparent px-4 py-3"
                    value={slot.antiPatterns}
                    onChange={(event) => updateSlot(slot.id, { antiPatterns: event.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={slot.pinned}
                    onChange={(event) => updateSlot(slot.id, { pinned: event.target.checked })}
                  />
                  <Text variant="meta">{messages.voice.composer.pinned}</Text>
                </label>
              </div>
            ) : null}
          </div>

          {slot.error ? (
            <Text variant="meta" className="mt-2 text-red-700">
              {slot.error}
            </Text>
          ) : null}
          {batchErrors[slot.id] ? (
            <Text variant="meta" className="mt-2 text-red-700">
              {batchErrors[slot.id]}
            </Text>
          ) : null}
        </div>
      ))}

      {mode === "create" ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSlots((current) => [...current, createEmptySlot()])}
        >
          {messages.voice.composer.addSlot}
        </Button>
      ) : null}

      <Button type="button" disabled={saving} onClick={handleSaveClick}>
        {saving ? messages.voice.composer.saving : messages.voice.composer.save}
      </Button>

      <VoiceTrainingConsentModal
        open={consentOpen}
        onCancel={() => setConsentOpen(false)}
        onAccept={() => {
          setConsentOpen(false);
          void (async () => {
            try {
              const status = await client.toPromise(client.voice.grantConsent());
              if (userId && status.granted) {
                grantVoiceConsent(userId);
              }
              await persistSlots();
            } catch {
              setConsentOpen(true);
            }
          })();
        }}
      />
    </div>
  );
}
