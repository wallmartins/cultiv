import { useMessages } from "../i18n/index.js";

export type NotificationsPermissionUI = "default" | "granted" | "denied";

export interface NotificationsToggleProps {
  readonly enabled: boolean;
  readonly permission: NotificationsPermissionUI;
  readonly onToggle: () => void;
}

export function NotificationsToggle({ enabled, permission, onToggle }: NotificationsToggleProps) {
  const t = useMessages();
  const denied = permission === "denied";
  const classes = ["settings-toggle", enabled && "is-on", denied && "is-denied"].filter(Boolean).join(" ");

  return (
    <div className="settings-pref-row">
      <div className="settings-pref-row-text">
        <div className="settings-pref-label">{t.settings.notificationsLabel}</div>
        <div className="settings-pref-sub">{t.settings.notificationsSub}</div>
        {denied ? <div className="settings-pref-sub">{t.settings.notificationsDeniedHint}</div> : null}
      </div>
      <button type="button" role="switch" aria-checked={enabled} disabled={denied} className={classes} onClick={onToggle}>
        <span className="settings-toggle-knob" />
      </button>
    </div>
  );
}
