import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface ThemeState {
  readonly theme: Theme;
  readonly setTheme: (theme: Theme) => void;
  readonly toggleTheme: () => void;
}

function applyThemeAttribute(theme: Theme): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => {
        applyThemeAttribute(theme);
        set({ theme });
      },
      toggleTheme: () => get().setTheme(get().theme === "light" ? "dark" : "light")
    }),
    {
      name: "cultiv-theme",
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeAttribute(state.theme);
      }
    }
  )
);
