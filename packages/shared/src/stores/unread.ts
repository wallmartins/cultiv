import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

interface UnreadState {
  readonly unread: ReadonlySet<string>;
  readonly markUnread: (id: string) => void;
  readonly markRead: (id: string) => void;
}

// localStorage doesn't serialize Set — bridge it through an array on the way in/out. Access is
// best-effort (same convention as calibrate-view.ts's session helpers): private-mode/sandboxed
// browsers can throw on any localStorage call, and markUnread/markRead fire from click handlers
// (toast, rail, detail loader) that shouldn't break just because persistence isn't available.
const setStorage: PersistStorage<UnreadState> = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { state: UnreadState & { unread: string[] }; version?: number };
      return { ...parsed, state: { ...parsed.state, unread: new Set(parsed.state.unread) } };
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      const unreadArray = Array.from(value.state.unread);
      localStorage.setItem(name, JSON.stringify({ ...value, state: { ...value.state, unread: unreadArray } }));
    } catch {
      // ignore — best-effort persistence
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  }
};

export const useUnreadStore = create<UnreadState>()(
  persist(
    (set) => ({
      unread: new Set<string>(),
      markUnread: (id) => set((state) => ({ unread: new Set(state.unread).add(id) })),
      markRead: (id) =>
        set((state) => {
          const next = new Set(state.unread);
          next.delete(id);
          return { unread: next };
        })
    }),
    { name: "cultiv-unread", storage: setStorage }
  )
);
