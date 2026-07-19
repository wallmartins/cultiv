import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UiLanguage = "pt-BR" | "en";

interface UiLanguageState {
  readonly language: UiLanguage;
  readonly setLanguage: (language: UiLanguage) => void;
}

// Owned by /app/settings (gap #10a) — client-side only, no backend contract. `language` is read
// by generation requests wherever they're built; this store is just the persisted preference.
export const useUiLanguage = create<UiLanguageState>()(
  persist(
    (set) => ({
      language: "pt-BR",
      setLanguage: (language) => set({ language })
    }),
    { name: "cultiv-ui-language" }
  )
);
