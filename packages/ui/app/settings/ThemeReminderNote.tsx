import { useMessages } from "../i18n/index.js";

// Design linha 383 — o tema mora só no toggle da topbar; esta rota nunca renderiza um controle
// de tema, só o lembrete.
export function ThemeReminderNote() {
  const t = useMessages();
  return <div className="settings-theme-note">{t.settings.themeReminderNote}</div>;
}
