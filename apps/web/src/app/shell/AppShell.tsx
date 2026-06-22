import type { ReactNode } from "react";
import { AppLocaleProvider, useAppLocale } from "~/i18n/app/use-app-locale";
import { ActiveExecutionProvider, useActiveExecutions } from "~/platform/active-executions/active-execution-store";
import { useCreditBalance } from "~/platform/credits/use-credit-balance";
import { NotificationProvider } from "~/platform/notifications/notification-store";
import { useOptionalClientSdk } from "~/platform/runtime/client-sdk-context";
import { NotificationHost } from "~/platform/notifications/NotificationHost";
import { AppBottomNav } from "./AppBottomNav";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { ActiveExecutionDrawer } from "./ActiveExecutionDrawer";

export interface AppShellProps {
  readonly children: ReactNode;
}

function AppShellFrame({ children }: AppShellProps) {
  const { messages } = useAppLocale();
  const client = useOptionalClientSdk();
  const { status, balance } = useCreditBalance();
  const { items, inFlightCount } = useActiveExecutions();

  return (
    <div className="imprint-grain min-h-screen bg-paper text-ink" data-intensity="quiet">
      <AppHeader
        messages={messages}
        creditStatus={client ? status : "loading"}
        creditBalance={balance}
        inFlightCount={inFlightCount}
      />

      <div className="flex min-h-[calc(100dvh-var(--app-header-height))]">
        <AppSidebar messages={messages} />
        <main className="min-w-0 flex-1 pb-[calc(var(--app-bottom-nav-offset)+1rem)] md:pb-0 md:pl-[4.75rem]">
          {children}
        </main>
      </div>

      <AppBottomNav messages={messages} />
      <ActiveExecutionDrawer />
      <NotificationHost />
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <AppLocaleProvider>
      <NotificationProvider>
        <ActiveExecutionProvider>
          <AppShellFrame>{children}</AppShellFrame>
        </ActiveExecutionProvider>
      </NotificationProvider>
    </AppLocaleProvider>
  );
}
