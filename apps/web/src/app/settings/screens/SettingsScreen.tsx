import { useAuth0 } from "@auth0/auth0-react";
import { Button, Container, Text } from "@my-ai-orchestrator/ui";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { hasVoiceConsent } from "~/app/voice/lib/voice-consent-storage";
import { AppCard } from "~/platform/ui/AppCard";

function SectionLabel({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 bg-terracota/15" />
      <span className="font-inter text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-terracota/70">
        {children}
      </span>
      <div className="h-px flex-1 bg-terracota/15" />
    </div>
  );
}

export function SettingsScreen() {
  const { user, logout } = useAuth0();
  const { locale, messages, setLocale } = useAppLocale();

  const consentActive = hasVoiceConsent(user?.sub);

  return (
    <Container className="py-8 md:py-10">
      <div className="mb-8">
        <Text as="h1" variant="h1" className="mb-2 font-playfair text-azul">
          {messages.settings.title}
        </Text>
        <Text variant="body" className="text-ink-muted">
          Ajustes finos do mapa e da bússola.
        </Text>
      </div>

      <section className="mb-8">
        <SectionLabel>{messages.settings.profile}</SectionLabel>
        <AppCard className="border-borda/15">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-azul/20 bg-creme">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-azul">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <Text variant="label" className="font-inter text-xs font-semibold uppercase tracking-wider text-texto-sec">
                {messages.settings.email}
              </Text>
              <Text variant="body" className="font-inter">
                {user?.email ?? "—"}
              </Text>
            </div>
          </div>
        </AppCard>
      </section>

      <section className="mb-8">
        <SectionLabel>{messages.settings.locale}</SectionLabel>
        <AppCard className="border-borda/15">
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
      </section>

      <section className="mb-8">
        <SectionLabel>{messages.settings.privacy}</SectionLabel>
        <AppCard className="border-borda/15">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                consentActive
                  ? "border-musgo/30 bg-musgo/10"
                  : "border-borda/20 bg-creme"
              }`}>
                {consentActive ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-musgo">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-4 w-4 text-borda">
                    <circle cx="10" cy="10" r="7" />
                    <path d="M10 7v3M10 12h.01" />
                  </svg>
                )}
              </div>
              <div>
                <Text variant="label" className="font-inter text-sm font-medium">
                  {consentActive ? messages.settings.consentActive : messages.settings.consentMissing}
                </Text>
              </div>
            </div>

            <div className="border-t border-borda/15 pt-4">
              <Button type="button" variant="ghost" size="compact" disabled>
                {messages.settings.revokeConsent}
              </Button>
              <Text variant="meta" className="mt-2 block text-borda">
                {messages.settings.revokeDisabled}
              </Text>
            </div>
          </div>
        </AppCard>
      </section>

      <div className="border-t border-borda/15 pt-6">
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
          className="text-terracota hover:text-terracota/80"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {messages.settings.logout}
        </Button>
      </div>
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
    <label className="flex items-center gap-3 cursor-pointer group">
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
        checked
          ? "border-terracota bg-terracota"
          : "border-borda/40 bg-creme group-hover:border-borda/60"
      }`}>
        {checked && (
          <span className="h-2 w-2 rounded-full bg-white" />
        )}
      </span>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <Text variant="meta" className="font-inter">{label}</Text>
    </label>
  );
}
