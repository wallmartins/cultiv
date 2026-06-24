import { cn, CompassMark } from "@my-ai-orchestrator/ui";
import { Link } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import type { AppMessages } from "~/i18n/app/types";
import { useAppSidebar } from "./app-sidebar-context";
import { AppShellSidebarItem } from "./app-shell-nav-ui";
import { getAppShellNavItems, isAppShellNavActive } from "./app-shell-nav";

export interface AppSidebarProps {
  readonly messages: AppMessages;
}

const expandedWidthClass = "w-[13.75rem]";
const collapsedWidthClass = "w-16";

export function AppSidebar({ messages }: AppSidebarProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navItems = getAppShellNavItems(messages);
  const { expanded, setExpanded, collapse } = useAppSidebar();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 hidden overflow-hidden border-r border-ink-ghost/25 bg-paper-elevated transition-[width] duration-[250ms] ease-out md:flex md:flex-col",
        expanded ? expandedWidthClass : collapsedWidthClass
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocusCapture={() => setExpanded(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setExpanded(false);
        }
      }}
    >
      <div className="relative z-10 flex h-[var(--app-header-height)] shrink-0 items-center justify-center border-b border-ink-ghost/25 bg-paper-elevated">
        <Link
          to="/app/generate"
          aria-label="Cultiv"
          className="cartography-logo-hover flex items-center justify-center"
          onClick={collapse}
        >
          <CompassMark size={28} variant="symbol" color="deep-blue" />
        </Link>
      </div>

      <nav aria-label="Workspace" className="flex flex-1 flex-col gap-0.5 p-2">
        {navItems.map((item) => (
          <AppShellSidebarItem
            key={item.key}
            item={item}
            active={isAppShellNavActive(pathname, item)}
            expanded={expanded}
            onNavigate={collapse}
          />
        ))}
      </nav>
    </aside>
  );
}
