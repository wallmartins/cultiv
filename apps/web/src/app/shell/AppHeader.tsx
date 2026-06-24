import { CompassMark, cn, CoordinateLabel } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import type { AppMessages } from "~/i18n/app/types";
import type { CreditBalanceStatus } from "~/platform/credits/use-credit-balance";
import { useActiveExecutions } from "~/platform/active-executions/active-execution-store";
import { ActiveExecutionMobileTrigger } from "./ActiveExecutionDrawer";
import { AppAvatarMenu } from "./AppAvatarMenu";
import { CreditDisplay } from "./CreditDisplay";
import {
  useAppSidebar
} from "./app-sidebar-context";
import { getAppShellBreadcrumb } from "./app-shell-nav";

export interface AppHeaderProps {
  readonly messages: AppMessages;
  readonly creditStatus: CreditBalanceStatus;
  readonly creditBalance: number | null;
  readonly inFlightCount: number;
}

export function AppHeader({
  messages,
  creditStatus,
  creditBalance,
  inFlightCount
}: AppHeaderProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const breadcrumb = getAppShellBreadcrumb(pathname, messages);
  const { openDrawer } = useActiveExecutions();
  const { expanded: sidebarExpanded } = useAppSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-[var(--app-header-height)] shrink-0 items-center border-b border-ink-ghost/30 bg-off-white">
      <div className="flex w-full items-center justify-between gap-3 px-[var(--spacing-gutter)]">
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 transition-[margin] duration-[250ms] ease-out motion-reduce:transition-none",
            sidebarExpanded && "md:ml-[9.75rem] lg:ml-[8.75rem]"
          )}
        >
          <Link
            to="/app/generate"
            aria-label="Cultiv"
            className="cartography-logo-hover shrink-0 md:hidden"
          >
            <CompassMark size={24} variant="symbol" color="deep-blue" />
          </Link>
          <CoordinateLabel
            index={breadcrumb.index}
            label={breadcrumb.label}
            className="min-w-0 truncate"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <CreditDisplay status={creditStatus} balance={creditBalance} messages={messages} />
          <ActiveExecutionMobileTrigger inFlightCount={inFlightCount} onOpen={() => openDrawer()} />
          <AppAvatarMenu messages={messages} />
        </div>
      </div>
    </header>
  );
}
