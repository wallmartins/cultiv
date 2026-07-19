// Design linha 383 — o tema mora só no toggle da topbar; esta rota nunca renderiza um controle
// de tema, só o lembrete.
export function ThemeReminderNote() {
  return <div className="settings-theme-note">o tema claro/escuro mora no topo do app — não é uma configuração</div>;
}
