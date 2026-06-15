import { useRouterState } from "@tanstack/react-router";
import type { AppMessages } from "~/i18n/app/types";
import { AppShellNavDock, AppShellNavItem } from "./app-shell-nav-ui";
import { getAppShellNavItems, isAppShellNavActive } from "./app-shell-nav";

export interface AppBottomNavProps {
  readonly messages: AppMessages;
}

export function AppBottomNav({ messages }: AppBottomNavProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navItems = getAppShellNavItems(messages);
  const activeIndex = Math.max(
    0,
    navItems.findIndex((item) => isAppShellNavActive(pathname, item))
  );

  return (
    <div className="app-bottom-nav-shell pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden">
      <nav
        aria-label="Workspace"
        className="app-bottom-nav-dock pointer-events-auto mx-auto max-w-md px-4"
      >
        <AppShellNavDock
          orientation="horizontal"
          activeIndex={activeIndex}
          itemCount={navItems.length}
        >
          {navItems.map((item) => (
            <AppShellNavItem
              key={item.key}
              item={item}
              active={isAppShellNavActive(pathname, item)}
              orientation="horizontal"
            />
          ))}
        </AppShellNavDock>
      </nav>
    </div>
  );
}
