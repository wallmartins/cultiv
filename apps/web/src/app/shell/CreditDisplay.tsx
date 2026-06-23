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
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs tabular-nums transition-colors hover:border-pigment-terracotta/40",
        isZero
          ? "border-red-700/30 bg-paper-elevated/90 text-red-700"
          : "border-ink-ghost/70 bg-paper-elevated/80 text-ink shadow-[0_4px_20px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]"
      )}
      aria-live="polite"
      aria-busy={isLoading}
    >
      <span aria-hidden className="text-base leading-none">
        ◎
      </span>
      {isLoading ? (
        <Text as="span" variant="meta" className="text-ink-muted">
          …
        </Text>
      ) : status === "error" ? (
        <Text as="span" variant="meta" className="text-ink-muted">
          —
        </Text>
      ) : (
        <>
          <Text as="span" variant="meta" className="font-medium">
            {balance}
          </Text>
          <Text as="span" variant="meta" className="text-ink-muted">
            {messages.shell.quota.label}
          </Text>
        </>
      )}
    </Link>
  );
}
