import { create } from "zustand";

interface ShellState {
  readonly companionOpen: boolean;
  readonly railOpen: boolean;
  readonly recalOpen: boolean;
  readonly toggleCompanion: () => void;
  readonly toggleRail: () => void;
  readonly toggleRecal: () => void;
  readonly closeCompanion: () => void;
  readonly closeRail: () => void;
  readonly closeRecal: () => void;
}

// Ephemeral layout state — never persisted, reset on reload by design.
export const useShellStore = create<ShellState>((set) => ({
  companionOpen: false,
  railOpen: false,
  recalOpen: false,
  toggleCompanion: () => set((state) => ({ companionOpen: !state.companionOpen })),
  toggleRail: () => set((state) => ({ railOpen: !state.railOpen })),
  toggleRecal: () => set((state) => ({ recalOpen: !state.recalOpen })),
  closeCompanion: () => set({ companionOpen: false }),
  closeRail: () => set({ railOpen: false }),
  closeRecal: () => set({ recalOpen: false })
}));
