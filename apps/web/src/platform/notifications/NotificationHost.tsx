import { Text } from "@my-ai-orchestrator/ui";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { useNotifications } from "~/platform/notifications/notification-store";

export function NotificationHost() {
  const { messages } = useAppLocale();
  const { notifications, dismiss } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--app-header-height)+0.75rem)] z-[80] flex flex-col items-center gap-2 px-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-ink bg-paper-elevated px-4 py-3 shadow-lg"
          role="status"
        >
          <Text variant="meta" className="font-medium">
            {notification.title}
          </Text>
          <div className="flex items-center gap-2">
            {notification.actionLabel && notification.onAction ? (
              <button
                type="button"
                className="text-sm font-medium text-pigment-terracotta underline-offset-2 hover:underline"
                onClick={() => {
                  notification.onAction?.();
                  dismiss(notification.id);
                }}
              >
                {notification.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              className="text-sm text-ink-muted"
              aria-label={messages.notifications.dismiss}
              onClick={() => dismiss(notification.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
