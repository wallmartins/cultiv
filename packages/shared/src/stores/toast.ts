import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  readonly id: string;
  readonly kind: ToastKind;
  readonly topic?: string;
  readonly message?: string;
  // Only completion toasts point at a real execution; id alone is not a route param
  // (export-*/calibrate-*/dispatch-error ids would resolve to /g/<id> and 404).
  readonly executionId?: string;
}

interface ToastState {
  readonly toasts: readonly ToastItem[];
  readonly push: (toast: ToastItem) => void;
  readonly dismiss: (id: string) => void;
  readonly clear: () => void;
}

// Errata 3 (ADR 0007) — ambient toast host mounted at the shell, outside <Outlet/>, so it
// survives route changes. Not persisted: toasts are transient by nature.
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => set((state) => ({ toasts: [...state.toasts.filter((item) => item.id !== toast.id), toast] })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
  clear: () => set({ toasts: [] })
}));
