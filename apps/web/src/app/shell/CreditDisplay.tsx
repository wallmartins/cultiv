import { cn, Text } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import type { AppMessages } from "~/i18n/app/types";
import type { CreditBalanceStatus } from "~/platform/credits/use-credit-balance";

export interface CreditDisplayProps {
  readonly status: CreditBalanceStatus;
  readonly balance: number | null;
  readonly messages: AppMessages;
}

export function CreditDisplay({ status, balance, messages }: CreditDisplayProps) {
  const isZero = balance === 0;
  const isLoading = status === "loading" || (status === "ready" && balance === null);

  return (
    <Link
      to="/app/plans"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs tabular-nums backdrop-blur-sm transition-colors hover:border-moss/40",
        isZero
          ? "border-red-700/30 bg-surface-elevated/90 text-red-700"
          : "border-border-subtle/70 bg-surface-elevated/80 text-foreground shadow-[0_4px_20px_color-mix(in_srgb,var(--color-rich-soil)_8%,transparent)]"
      )}
      aria-live="polite"
      aria-busy={isLoading}
    >
      <span aria-hidden className="text-base leading-none">
        ◎
      </span>
      {isLoading ? (
        <Text as="span" variant="meta" className="text-muted-foreground">
          …
        </Text>
      ) : status === "error" ? (
        <Text as="span" variant="meta" className="text-muted-foreground">
          —
        </Text>
      ) : (
        <>
          <Text as="span" variant="meta" className="font-medium">
            {balance}
          </Text>
          <Text as="span" variant="meta" className="text-muted-foreground">
            {messages.shell.credits.label}
          </Text>
        </>
      )}
    </Link>
  );
}
