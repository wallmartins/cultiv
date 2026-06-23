import { cn } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import { NavIconGenerate, NavIconHistory, NavIconVoice } from "./app-shell-nav-icons";
import type { AppShellNavItem, AppShellNavKey } from "./app-shell-nav";

export type AppShellNavOrientation = "horizontal" | "vertical";
export type AppShellNavVariant = "labeled" | "icon" | "expandable";

const navIcons: Record<AppShellNavKey, ComponentType<{ readonly active: boolean }>> = {
  generate: NavIconGenerate,
  history: NavIconHistory,
  voice: NavIconVoice
};

const dockClassName =
  "relative rounded-[var(--radius-press)] border border-ink-ghost bg-paper-elevated p-1 press-edge";

const pillClassName =
  "app-shell-nav-pill pointer-events-none absolute rounded-[var(--radius-press)] bg-pigment-terracotta/16 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-pigment-terracotta)_30%,transparent)]";

function pillStyle(
  orientation: AppShellNavOrientation,
  activeIndex: number,
  itemCount: number
): CSSProperties {
  const segment = `calc((100% - 0.5rem) / ${itemCount})`;

  if (orientation === "horizontal") {
    return {
      top: "0.25rem",
      bottom: "0.25rem",
      left: "0.25rem",
      width: segment,
      transform: `translateX(calc(${activeIndex} * 100%))`
    };
  }

  return {
    left: "0.25rem",
    right: "0.25rem",
    top: "0.25rem",
    height: segment,
    transform: `translateY(calc(${activeIndex} * 100%))`
  };
}

export function AppShellNavDock({
  orientation,
  activeIndex,
  itemCount,
  variant = "labeled",
  className,
  children
}: {
  readonly orientation: AppShellNavOrientation;
  readonly activeIndex: number;
  readonly itemCount: number;
  readonly variant?: AppShellNavVariant;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <div
      className={cn(
        dockClassName,
        orientation === "horizontal" ? "flex" : "flex flex-col",
        variant === "icon" && "gap-0.5",
        variant === "expandable" &&
          "app-shell-dock-expandable w-[3.25rem] overflow-hidden group-hover/dock:w-44 group-focus-within/dock:w-44",
        className
      )}
    >
      <span
        aria-hidden
        className={pillClassName}
        style={pillStyle(orientation, activeIndex, itemCount)}
      />
      {children}
    </div>
  );
}

export function AppShellNavItem({
  item,
  active,
  orientation
}: {
  readonly item: AppShellNavItem;
  readonly active: boolean;
  readonly orientation: AppShellNavOrientation;
}) {
  const Icon = navIcons[item.key];
  const isHorizontal = orientation === "horizontal";

  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative z-10 transition-transform duration-150 ease-out active:scale-[0.97]",
        isHorizontal
          ? "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2"
          : "flex min-h-11 items-center gap-3 px-3 py-2"
      )}
    >
      <Icon active={active} />
      <span
        className={cn(
          "max-w-full truncate leading-none transition-all duration-200",
          active
            ? isHorizontal
              ? "font-body text-[0.625rem] font-semibold text-pigment-terracotta"
              : "font-body text-sm font-semibold text-pigment-terracotta"
            : isHorizontal
              ? "font-body text-[0.625rem] font-medium tracking-wide text-ink-muted"
              : "font-body text-sm font-medium text-ink-muted"
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

export function AppShellNavExpandableItem({
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
      className="relative z-10 flex h-11 w-full min-w-0 items-center overflow-hidden rounded-[var(--radius-press)] transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pigment-terracotta"
    >
      <span className="flex size-11 shrink-0 items-center justify-center">
        <Icon active={active} />
      </span>
      <span
        className={cn(
          "min-w-0 truncate pr-3 leading-none transition-all duration-300 ease-out",
          "max-w-0 opacity-0 group-hover/dock:max-w-[9rem] group-hover/dock:opacity-100",
          "group-focus-within/dock:max-w-[9rem] group-focus-within/dock:opacity-100",
          active
            ? "font-body text-sm font-semibold text-pigment-terracotta"
            : "font-body text-sm font-medium text-ink-muted"
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}
