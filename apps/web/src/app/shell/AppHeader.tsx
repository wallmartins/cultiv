import { Link } from "@tanstack/react-router";
import type { AppMessages } from "~/i18n/app/types";
import type { CreditBalanceStatus } from "~/platform/credits/use-credit-balance";
import { useActiveExecutions } from "~/platform/active-executions/active-execution-store";
import { ActiveExecutionMobileTrigger } from "./ActiveExecutionDrawer";
import { AppAvatarMenu } from "./AppAvatarMenu";
import { CreditDisplay } from "./CreditDisplay";

function CompassLogo({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity={0.15} />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

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
    <header className="sticky top-0 z-40 flex h-[var(--app-header-height)] items-center border-b border-borda/30 bg-creme/98">
      <div className="flex w-full items-center justify-between gap-3 px-[var(--spacing-gutter)]">
        <Link to="/app/generate" aria-label="Cultiv" className="rebrand-logo-hover shrink-0 flex items-center gap-2">
          <CompassLogo className="rebrand-logo-icon h-6 w-6 text-azul" />
          <span className="rebrand-logo-text font-playfair text-base font-semibold text-azul hidden sm:inline">
            Cultiv
          </span>
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
