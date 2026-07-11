// History API (SEO doc 05): cada nó/overlay tem URL própria. Este módulo é o
// único que toca history/título/meta description; quem navega chama go().

import type { AppData } from "./types";
import type { OverlayId } from "./state";

export interface HistoryEntry {
  sel?: string;
  overlay?: OverlayId;
}

export interface Router {
  /** Atualiza URL (pushState opcional), <title> e meta description. */
  go(path: string, title: string, entry: HistoryEntry | null, push: boolean): void;
  /** Marca o estado inicial servido pelo servidor sem criar entrada nova. */
  replace(entry: HistoryEntry): void;
  onPop(cb: (entry: HistoryEntry | null, slug: string) => void): void;
}

export function createRouter(data: AppData): Router {
  const bySlug = new Map(data.nodes.map((n) => [n.slug, n]));
  return {
    go(path, title, entry, push) {
      if (push) history.pushState(entry, "", path);
      document.title = title;
      const n = bySlug.get(path.replace(/^\//, ""));
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", n ? n.description : data.siteDescription);
    },
    replace(entry) {
      history.replaceState(entry, "");
    },
    onPop(cb) {
      addEventListener("popstate", (ev) => {
        const slug = location.pathname.replace(/^\//, "").replace(/\/$/, "");
        cb(ev.state as HistoryEntry | null, slug);
      });
    },
  };
}
