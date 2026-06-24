import { useRouterState } from "@tanstack/react-router";
import type { AppMessages } from "~/i18n/app/types";
import { AppShellBottomNavItem } from "./app-shell-nav-ui";
import { getAppBottomNavItems, isAppBottomNavActive } from "./app-shell-nav";

export interface AppBottomNavProps {
  readonly messages: AppMessages;
}

export function AppBottomNav({ messages }: AppBottomNavProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navItems = getAppBottomNavItems(messages);

  return (
    <div className="app-bottom-nav-shell pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden">
      <nav
        aria-label="Workspace"
        className="pointer-events-auto flex border-t border-ink-ghost/30 bg-paper-elevated"
      >
        {navItems.map((item) => (
          <AppShellBottomNavItem
            key={item.key}
            item={item}
            active={isAppBottomNavActive(pathname, item)}
          />
        ))}
      </nav>
    </div>
  );
}
