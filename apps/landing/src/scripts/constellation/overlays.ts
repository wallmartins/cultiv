// Overlays de jornada (Demo/Planos): abrir um esconde o painel; fechar
// devolve o painel do nó selecionado, se houver. URL sempre em sincronia.

import type { AppData } from "./types";
import type { Els } from "./els";
import type { AppState, OverlayId } from "./state";
import type { Panel } from "./panel";
import type { Router } from "./router";
import type { Selection } from "./selection";

export interface Overlays {
  set(o: OverlayId | null, push?: boolean): void;
}

interface Deps {
  state: AppState;
  els: Els;
  data: AppData;
  panel: Panel;
  router: Router;
  selection: Selection;
}

export function createOverlays({ state, els, data, panel, router, selection }: Deps): Overlays {
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  return {
    set(o, push = true) {
      state.overlay = o;
      els.overlays.demo.hidden = o !== "demo";
      els.overlays.planos.hidden = o !== "planos";
      if (o) {
        state.hoverId = null;
        panel.hide();
        selection.applyActive();
        const n = byId.get(o)!;
        if (push) router.go(`/${n.slug}`, n.title, { overlay: o }, true);
      } else {
        if (state.selId) {
          panel.fill(state.selId);
          panel.show();
        }
        if (push) {
          const n = state.selId ? byId.get(state.selId)! : null;
          router.go(
            n ? `/${n.slug}` : "/",
            n ? n.title : data.siteTitle,
            n ? { sel: n.id } : null,
            true
          );
        }
      }
    },
  };
}
