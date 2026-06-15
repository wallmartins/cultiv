import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type AppNotification = {
  readonly id: string;
  readonly title: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly durationMs?: number;
};

type NotificationContextValue = {
  readonly notifications: readonly AppNotification[];
  readonly push: (notification: Omit<AppNotification, "id">) => string;
  readonly dismiss: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

let notificationCounter = 0;

export function NotificationProvider({ children }: { readonly children: ReactNode }) {
  const [notifications, setNotifications] = useState<readonly AppNotification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (notification: Omit<AppNotification, "id">) => {
      const id = `notification-${++notificationCounter}`;
      setNotifications((current) => [...current, { ...notification, id }]);
      const duration = notification.durationMs ?? 6000;
      window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      notifications,
      push,
      dismiss
    }),
    [dismiss, notifications, push]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }

  return context;
}
