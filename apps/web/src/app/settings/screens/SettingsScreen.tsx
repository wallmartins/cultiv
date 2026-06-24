import { useAuth0 } from "@auth0/auth0-react";
import { Button, cn, CoordinateLabel, Text } from "@my-ai-orchestrator/ui";
import { useState } from "react";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { hasVoiceConsent } from "~/app/voice/lib/voice-consent-storage";
import { AppCard } from "~/platform/ui/AppCard";

function DeleteFootprintsModal({
  open,
  onClose,
  messages
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly messages: {
    readonly title: string;
    readonly body: string;
    readonly cancel: string;
    readonly confirm: string;
    readonly disabled: string;
  };
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-cream/80 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-[5px] border border-ink-ghost/25 bg-off-white p-6 shadow-cartography"
      >
        <Text as="h2" variant="h2" className="mb-3 font-playfair text-ink">
          {messages.title}
        </Text>
        <Text variant="body" className="mb-2 text-ink-muted">
          {messages.body}
        </Text>
        <Text variant="meta" className="mb-6 text-ink-muted">
          {messages.disabled}
        </Text>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {messages.cancel}
          </Button>
          <Button type="button" disabled>
            {messages.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SettingsScreen() {
  const { user, logout } = useAuth0();
  const { locale, messages, setLocale } = useAppLocale();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const consentActive = hasVoiceConsent(user?.sub);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-[var(--spacing-gutter)] py-8 md:py-10">
      <div className="mb-4">
        <Text as="h1" variant="h1" className="mb-2 font-playfair text-ink">
          {messages.settings.title}
        </Text>
        <Text variant="body" className="text-ink-muted">
          {messages.settings.subtitle}
        </Text>
      </div>

      <AppCard className="space-y-3">
        <CoordinateLabel index={1} label={messages.settings.profile} className="block" />
        <Text variant="meta" className="block text-ink-muted">
          {messages.settings.email}
        </Text>
        <Text variant="body" className="font-inter text-ink">
          {user?.email ?? "—"}
        </Text>
      </AppCard>

      <AppCard className="space-y-4">
        <CoordinateLabel index={2} label={messages.settings.locale} className="block" />
        <div className="space-y-3">
          <LocaleOption
            name="app-locale"
            checked={locale === "pt"}
            label={messages.settings.localePt}
            onSelect={() => setLocale("pt")}
          />
          <LocaleOption
            name="app-locale"
            checked={locale === "en"}
            label={messages.settings.localeEn}
            onSelect={() => setLocale("en")}
          />
        </div>
      </AppCard>

      <AppCard className="space-y-4">
        <CoordinateLabel index={3} label={messages.settings.privacy} className="block" />
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full border",
              consentActive ? "border-moss/30 bg-moss/10" : "border-ink-ghost/30 bg-cream"
            )}
          >
            <span
              className={cn("size-2 rounded-full", consentActive ? "bg-moss" : "bg-ink-ghost")}
              aria-hidden
            />
          </span>
          <Text variant="body" className="font-inter text-sm">
            {consentActive ? messages.settings.consentActive : messages.settings.consentMissing}
          </Text>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="text-red-700 hover:text-red-700/80"
          onClick={() => setDeleteModalOpen(true)}
        >
          {messages.settings.revokeConsent}
        </Button>
      </AppCard>

      <div className="pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            void logout({
              logoutParams: {
                returnTo: `${window.location.origin}/login`
              }
            })
          }
          className="text-terracotta hover:text-terracotta/80"
        >
          {messages.settings.logout}
        </Button>
      </div>

      <DeleteFootprintsModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        messages={{
          title: messages.settings.privacy,
          body: messages.voice.consent.body,
          cancel: messages.voice.consent.cancel,
          confirm: messages.settings.revokeConsent,
          disabled: messages.settings.revokeDisabled
        }}
      />
    </div>
  );
}

function LocaleOption({
  name,
  checked,
  label,
  onSelect
}: {
  readonly name: string;
  readonly checked: boolean;
  readonly label: string;
  readonly onSelect: () => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
          checked
            ? "border-terracotta bg-terracotta"
            : "border-ink-ghost/40 bg-cream group-hover:border-terracotta/40"
        )}
      >
        {checked ? <span className="size-2 rounded-full bg-off-white" /> : null}
      </span>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <Text variant="meta" className="font-inter text-ink">
        {label}
      </Text>
    </label>
  );
}
