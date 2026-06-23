import { PressMark } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import type { AppMessages } from "~/i18n/app/types";
import type { CreditBalanceStatus } from "~/platform/credits/use-credit-balance";
import { useActiveExecutions } from "~/platform/active-executions/active-execution-store";
import { ActiveExecutionMobileTrigger } from "./ActiveExecutionDrawer";
import { AppAvatarMenu } from "./AppAvatarMenu";
import { CreditDisplay } from "./CreditDisplay";

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
  const { openDrawer } = useActiveExecutions();

  return (
    <header className="sticky top-0 z-40 flex h-[var(--app-header-height)] items-center border-b border-ink-ghost bg-paper">
      <div className="flex w-full items-center justify-between gap-3 px-[var(--spacing-gutter)]">
        <Link to="/app/generate" aria-label="Cultiv" className="shrink-0">
          <PressMark size={28} className="block shrink-0 text-ink" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <CreditDisplay status={creditStatus} balance={creditBalance} messages={messages} />
          <ActiveExecutionMobileTrigger inFlightCount={inFlightCount} onOpen={() => openDrawer()} />
          <AppAvatarMenu messages={messages} />
        </div>
      </div>
    </header>
  );
}
