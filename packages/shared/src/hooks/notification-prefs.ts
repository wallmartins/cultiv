import { useCallback, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CompletionNotificationPermission = "default" | "granted" | "denied";

interface NotificationsEnabledState {
  readonly enabled: boolean;
  readonly setEnabled: (enabled: boolean) => void;
}

const useNotificationsEnabledStore = create<NotificationsEnabledState>()(
  persist(
    (set) => ({ enabled: false, setEnabled: (enabled) => set({ enabled }) }),
    { name: "cultiv-completion-notifications" }
  )
);

// No Notification global in older/unsupported browsers (or jsdom) — treated as permanently
// denied, same inert UX as a user-denied permission.
function currentPermission(): CompletionNotificationPermission {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission;
}

// Web Notifications (ADR 0005 §6) — client-side toggle + browser permission, no backend
// contract (gap #10a). The toggle always reflects the real Notification.permission, not just
// the persisted preference, so a browser-level revoke shows up without a second source of truth.
export function useCompletionNotifications() {
  const enabled = useNotificationsEnabledStore((state) => state.enabled);
  const setEnabled = useNotificationsEnabledStore((state) => state.setEnabled);
  const [permission, setPermission] = useState<CompletionNotificationPermission>(currentPermission);

  const toggle = useCallback(() => {
    if (enabled) {
      setEnabled(false);
      return;
    }
    if (permission === "denied") return;
    if (permission === "default") {
      void Notification.requestPermission().then((result) => {
        setPermission(result);
        if (result === "granted") setEnabled(true);
      });
      return;
    }
    setEnabled(true);
  }, [enabled, permission, setEnabled]);

  return { enabled: enabled && permission === "granted", permission, toggle };
}
