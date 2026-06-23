import { CompassMark } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import type { AppMessages } from "~/i18n/app/types";
import { AppShellSidebarItem } from "./app-shell-nav-ui";
import { getAppShellNavItems, isAppShellNavActive } from "./app-shell-nav";

export interface AppSidebarProps {
  readonly messages: AppMessages;
}

export function AppSidebar({ messages }: AppSidebarProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navItems = getAppShellNavItems(messages);

  return (
    <aside className="group/sidebar fixed inset-y-0 left-0 z-30 hidden w-16 overflow-hidden border-r border-ink-ghost/25 bg-paper-elevated transition-[width] duration-[250ms] ease-out hover:w-[13.75rem] focus-within:w-[13.75rem] md:flex md:flex-col">
      <div className="flex h-[var(--app-header-height)] shrink-0 items-center justify-center border-b border-ink-ghost/25">
        <Link to="/app/generate" aria-label="Cultiv" className="cartography-logo-hover flex items-center justify-center">
          <CompassMark size={28} variant="symbol" color="deep-blue" />
        </Link>
      </div>

      <nav aria-label="Workspace" className="flex flex-1 flex-col gap-0.5 p-2">
        {navItems.map((item) => (
          <AppShellSidebarItem
            key={item.key}
            item={item}
            active={isAppShellNavActive(pathname, item)}
          />
        ))}
      </nav>
    </aside>
  );
}
