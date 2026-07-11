// Seleção e hover: o coração da constelação. Deriva o conjunto de nós/arestas
// relacionados ao ponto ativo e projeta isso em classes CSS; abre/fecha o
// painel e mantém a URL em sincronia via router.

import type { AppData } from "./types";
import type { Els } from "./els";
import type { AppState } from "./state";
import { isMobile } from "./state";
import type { Camera } from "./camera";
import type { Panel } from "./panel";
import type { Router } from "./router";

export interface Selection {
  openNode(id: string, push?: boolean): void;
  closeSel(push?: boolean): void;
  setHover(id: string | null): void;
  /** Reprojeta o estado atual em classes (nós, arestas, app). */
  applyActive(): void;
}

interface Deps {
  state: AppState;
  els: Els;
  data: AppData;
  camera: Camera;
  panel: Panel;
  router: Router;
}

export function createSelection({ state, els, data, camera, panel, router }: Deps): Selection {
  const byId = new Map(data.nodes.map((n) => [n.id, n]));

  const relatedTo = (active: string) => {
    const rel = new Set([active]);
    for (const [a, b] of data.edges) {
      if (a === active) rel.add(b);
      if (b === active) rel.add(a);
    }
    return rel;
  };

  const applyActive = () => {
    const active = state.hoverId || state.selId;
    const rel = active ? relatedTo(active) : new Set<string>();
    els.app.classList.toggle("has-active", !!active);
    els.app.classList.toggle("has-sel", !!state.selId);
    for (const [id, el] of els.nodes) {
      el.classList.toggle("is-active", active === id);
      el.classList.toggle("is-sel", state.selId === id);
      el.classList.toggle("is-hot", !!active && rel.has(id));
      el.classList.toggle("is-dim", !!active && !rel.has(id));
      el.classList.toggle("is-rel", !!active && rel.has(id));
    }
    for (const e of els.edges) {
      e.g.classList.toggle("is-lit", !!active && (e.a === active || e.b === active));
    }
  };

  const closeSel = (push = true) => {
    if (!state.selId && !state.hoverId) return;
    state.selId = null;
    state.hoverId = null;
    panel.hide();
    applyActive();
    if (push) router.go("/", data.siteTitle, null, true);
  };

  const openNode = (id: string, push = true) => {
    if (state.selId === id) {
      closeSel(push);
      return;
    }
    const n = byId.get(id);
    if (!n) return;
    const doOpen = () => {
      state.selId = id;
      panel.fill(id);
      if (!state.overlay) panel.show();
      applyActive();
      if (push) router.go(`/${n.slug}`, n.title, { sel: id }, true);
    };
    if (isMobile()) {
      // Navegação inteligente: voa até o nó, destaca conexões, depois abre.
      state.hoverId = id;
      applyActive();
      camera.focusNode(id, Math.max(camera.currentZ(), 1.5), true, 0.32);
      setTimeout(doOpen, 500);
    } else {
      doOpen();
    }
  };

  panel.onDismiss(() => closeSel());

  return {
    openNode,
    closeSel,
    applyActive,
    setHover(id) {
      state.hoverId = id;
      applyActive();
    },
  };
}
