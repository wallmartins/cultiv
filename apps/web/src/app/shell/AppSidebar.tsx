import { useRouterState } from "@tanstack/react-router";
import type { AppMessages } from "~/i18n/app/types";
import { AppShellNavDock, AppShellNavExpandableItem } from "./app-shell-nav-ui";
import { getAppShellNavItems, isAppShellNavActive } from "./app-shell-nav";

export interface AppSidebarProps {
  readonly messages: AppMessages;
}

export function AppSidebar({ messages }: AppSidebarProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navItems = getAppShellNavItems(messages);
  const activeIndex = Math.max(
    0,
    navItems.findIndex((item) => isAppShellNavActive(pathname, item))
  );

  return (
    <aside className="app-shell-dock pointer-events-none fixed top-1/2 left-[max(1rem,env(safe-area-inset-left))] z-30 hidden -translate-y-1/2 md:block">
      <nav aria-label="Workspace" className="group/dock pointer-events-auto">
        <AppShellNavDock
          orientation="vertical"
          variant="expandable"
          activeIndex={activeIndex}
          itemCount={navItems.length}
        >
          {navItems.map((item) => (
            <AppShellNavExpandableItem
              key={item.key}
              item={item}
              active={isAppShellNavActive(pathname, item)}
            />
          ))}
        </AppShellNavDock>
      </nav>
    </aside>
  );
}
