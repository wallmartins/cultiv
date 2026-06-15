import { useAuth0 } from "@auth0/auth0-react";
import { Button, Container, Text } from "@my-ai-orchestrator/ui";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { hasVoiceConsent } from "~/app/voice/lib/voice-consent-storage";
import { AppCard } from "~/platform/ui/AppCard";

export function SettingsScreen() {
  const { user, logout } = useAuth0();
  const { locale, messages, setLocale } = useAppLocale();

  return (
    <Container className="py-8 md:py-10">
      <Text as="h1" variant="h1" className="mb-8">
        {messages.settings.title}
      </Text>

      <section className="mb-8 space-y-4">
        <AppCard>
          <Text variant="label" className="mb-3 block">
            {messages.settings.profile}
          </Text>
          <div>
            <Text variant="meta" className="text-muted-foreground">
              {messages.settings.email}
            </Text>
            <Text variant="body">{user?.email ?? "—"}</Text>
          </div>
        </AppCard>
      </section>

      <section className="mb-8 space-y-4">
        <AppCard>
          <Text variant="label" className="mb-3 block">
            {messages.settings.locale}
          </Text>
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
        </AppCard>
      </section>

      <section className="mb-8 space-y-4">
        <AppCard>
          <Text variant="label" className="mb-3 block">
            {messages.settings.privacy}
          </Text>
          <Text variant="meta">
            {hasVoiceConsent(user?.sub) ? messages.settings.consentActive : messages.settings.consentMissing}
          </Text>
          <Button type="button" variant="ghost" size="compact" disabled>
            {messages.settings.revokeConsent}
          </Button>
          <Text variant="meta" className="text-muted-foreground">
            {messages.settings.revokeDisabled}
          </Text>
        </AppCard>
      </section>

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
      >
        {messages.settings.logout}
      </Button>
    </Container>
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
    <label className="flex items-center gap-2">
      <input type="radio" name={name} checked={checked} onChange={onSelect} />
      <Text variant="meta">{label}</Text>
    </label>
  );
}
