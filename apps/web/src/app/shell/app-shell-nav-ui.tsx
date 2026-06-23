import { cn } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import {
  NavIconAccount,
  NavIconGenerate,
  NavIconHistory,
  NavIconVoice
} from "./app-shell-nav-icons";
import type { AppShellBottomNavItem, AppShellBottomNavKey, AppShellNavItem, AppShellNavKey } from "./app-shell-nav";

const navIcons: Record<AppShellNavKey | AppShellBottomNavKey, ComponentType<{ readonly active: boolean }>> = {
  generate: NavIconGenerate,
  history: NavIconHistory,
  voice: NavIconVoice,
  account: NavIconAccount
};

export function AppShellSidebarItem({
  item,
  active
}: {
  readonly item: AppShellNavItem;
  readonly active: boolean;
}) {
  const Icon = navIcons[item.key];

  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-11 min-w-0 items-center overflow-hidden transition-colors duration-150 ease-out",
        active
          ? "bg-off-white text-pigment-terracotta"
          : "text-ink-muted hover:bg-paper-pressed/60 hover:text-ink",
        active &&
          "before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:bg-pigment-terracotta before:content-['']"
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center">
        <Icon active={active} />
      </span>
      <span
        className={cn(
          "min-w-0 truncate pr-3 font-body text-sm leading-none opacity-0 transition-opacity duration-[250ms] ease-out group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100",
          active ? "font-semibold text-pigment-terracotta" : "font-medium"
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

export function AppShellBottomNavItem({
  item,
  active
}: {
  readonly item: AppShellBottomNavItem;
  readonly active: boolean;
}) {
  const Icon = navIcons[item.key];

  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5 transition-colors duration-150 ease-out active:scale-[0.98]",
        active ? "text-pigment-terracotta" : "text-ink-muted"
      )}
    >
      {active ? (
        <span aria-hidden className="absolute inset-x-3 top-0 h-[3px] bg-pigment-terracotta" />
      ) : null}
      <Icon active={active} />
      <span
        className={cn(
          "max-w-full truncate font-body text-[0.625rem] leading-none tracking-wide",
          active ? "font-semibold" : "font-medium"
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}
