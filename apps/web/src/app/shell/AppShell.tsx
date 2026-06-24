import type { ReactNode } from "react";
import { useAppLocale } from "~/i18n/app/use-app-locale";
import { ActiveExecutionProvider, useActiveExecutions } from "~/platform/active-executions/active-execution-store";
import { useCreditBalance } from "~/platform/credits/use-credit-balance";
import { NotificationProvider } from "~/platform/notifications/notification-store";
import { useOptionalClientSdk } from "~/platform/runtime/client-sdk-context";
import { NotificationHost } from "~/platform/notifications/NotificationHost";
import { AppBottomNav } from "./AppBottomNav";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { AppSidebarProvider } from "./app-sidebar-context";
import { ActiveExecutionDrawer } from "./ActiveExecutionDrawer";

export interface AppShellProps {
  readonly children: ReactNode;
}

function AppShellFrame({ children }: AppShellProps) {
  const { messages } = useAppLocale();
  const client = useOptionalClientSdk();
  const { status, balance } = useCreditBalance();
  const { inFlightCount } = useActiveExecutions();

  return (
    <AppSidebarProvider>
      <div
        className="cartography-grain cartography-grain-quiet relative min-h-screen bg-paper text-ink"
        data-surface="workspace"
      >
        <AppSidebar messages={messages} />

        <div className="flex min-h-screen flex-col pl-0 md:pl-16 lg:pl-20">
          <AppHeader
            messages={messages}
            creditStatus={client ? status : "loading"}
            creditBalance={balance}
            inFlightCount={inFlightCount}
          />

          <main className="min-w-0 flex-1 pb-[var(--app-bottom-nav-offset)] md:pb-0">
            {children}
          </main>
        </div>

        <AppBottomNav messages={messages} />
        <ActiveExecutionDrawer />
        <NotificationHost />
      </div>
    </AppSidebarProvider>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <NotificationProvider>
      <ActiveExecutionProvider>
        <AppShellFrame>{children}</AppShellFrame>
      </ActiveExecutionProvider>
    </NotificationProvider>
  );
}
