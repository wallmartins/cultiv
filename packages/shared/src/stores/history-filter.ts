import { create } from "zustand";
import type { ExecutionsListPeriod, ExecutionsListStatusFilter } from "@my-ai-orchestrator/contracts";

interface HistoryFilterState {
  readonly q: string;
  readonly period: ExecutionsListPeriod;
  readonly status: ExecutionsListStatusFilter;
  readonly contentType?: string;
  readonly setQuery: (q: string) => void;
  readonly setPeriod: (period: ExecutionsListPeriod) => void;
  readonly setStatus: (status: ExecutionsListStatusFilter) => void;
  readonly setContentType: (contentType: string | undefined) => void;
  readonly reset: () => void;
}

const DEFAULTS = { q: "", period: "all" as const, status: "all" as const, contentType: undefined };

// Ephemeral — mirrors the rail's search params, never persisted.
export const useHistoryFilterStore = create<HistoryFilterState>((set) => ({
  ...DEFAULTS,
  setQuery: (q) => set({ q }),
  setPeriod: (period) => set({ period }),
  setStatus: (status) => set({ status }),
  setContentType: (contentType) => set({ contentType }),
  reset: () => set(DEFAULTS)
}));
