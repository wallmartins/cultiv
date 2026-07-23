import { Mono, Panel } from "../primitives/index.js";
import { useMessages } from "../i18n/index.js";
import { LanguageToggle, type LanguageToggleProps } from "./LanguageToggle.js";
import { NotificationsToggle, type NotificationsToggleProps } from "./NotificationsToggle.js";
import { ThemeReminderNote } from "./ThemeReminderNote.js";

export interface PreferencesSectionProps {
  readonly language: LanguageToggleProps;
  readonly notifications: NotificationsToggleProps;
}

export function PreferencesSection({ language, notifications }: PreferencesSectionProps) {
  const t = useMessages();
  return (
    <Panel className="settings-section">
      <Mono as="div" className="settings-section-eyebrow">
        {t.settings.preferencesEyebrow}
      </Mono>
      <div className="settings-pref-row">
        <div className="settings-pref-label">{t.settings.interfaceLanguage}</div>
        <LanguageToggle {...language} />
      </div>
      <NotificationsToggle {...notifications} />
      <ThemeReminderNote />
    </Panel>
  );
}
