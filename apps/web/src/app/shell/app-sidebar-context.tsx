import { useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/** Extra inset when the sidebar grows from collapsed to expanded (md: pl-16 baseline). */
export const APP_SIDEBAR_EXPAND_OFFSET_MD = "9.75rem";
/** Extra inset when the sidebar grows from collapsed to expanded (lg: pl-20 baseline). */
export const APP_SIDEBAR_EXPAND_OFFSET_LG = "8.75rem";

interface AppSidebarContextValue {
  readonly expanded: boolean;
  readonly setExpanded: (expanded: boolean) => void;
  readonly collapse: () => void;
}

const AppSidebarContext = createContext<AppSidebarContextValue | null>(null);

export function AppSidebarProvider({ children }: { readonly children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [pathname]);

  const collapse = () => {
    setExpanded(false);
  };

  return (
    <AppSidebarContext.Provider value={{ expanded, setExpanded, collapse }}>
      {children}
    </AppSidebarContext.Provider>
  );
}

export function useAppSidebar() {
  const context = useContext(AppSidebarContext);

  if (!context) {
    throw new Error("useAppSidebar must be used within AppSidebarProvider");
  }

  return context;
}
