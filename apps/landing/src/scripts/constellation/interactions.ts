// Ligações de entrada do usuário: cliques delegados (nós, chips, CTAs,
// fechar, home), hover/foco dos nós, Escape, popstate e resize. Traduz
// eventos em chamadas de selection/overlays — nenhuma regra de negócio aqui.

import type { AppData } from "./types";
import type { Els } from "./els";
import type { AppState, OverlayId } from "./state";
import { isMobile, isTouch } from "./state";
import type { Camera } from "./camera";
import type { Panel } from "./panel";
import type { Router } from "./router";
import type { Selection } from "./selection";
import type { Overlays } from "./overlays";

interface Deps {
  state: AppState;
  els: Els;
  data: AppData;
  camera: Camera;
  panel: Panel;
  router: Router;
  selection: Selection;
  overlays: Overlays;
}

export function bindInteractions(deps: Deps): void {
  const { state, els, data, camera, panel, router, selection, overlays } = deps;
  const bySlug = new Map(data.nodes.map((n) => [n.slug, n]));

  // ===== Cliques delegados =====
  document.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement;

    const nodeEl = target.closest<HTMLElement>("[data-node]");
    if (nodeEl) {
      ev.preventDefault();
      if (camera.wasDragged()) return;
      const id = nodeEl.dataset.node!;
      // Touch: primeiro toque destaca, segundo abre (evita aberturas acidentais).
      if (isTouch() && state.hoverId !== id && state.selId !== id) {
        selection.setHover(id);
      } else {
        selection.openNode(id);
      }
      return;
    }

    const link = target.closest<HTMLElement>("[data-node-link]");
    if (link) {
      ev.preventDefault();
      selection.openNode(link.dataset.nodeLink!);
      return;
    }
    if (target.closest("[data-open-demo]")) {
      ev.preventDefault();
      overlays.set("demo");
      return;
    }
    if (target.closest("[data-open-plans]")) {
      ev.preventDefault();
      overlays.set("planos");
      return;
    }
    const panelCta = target.closest<HTMLElement>("[data-panel-cta]");
    if (panelCta) {
      ev.preventDefault();
      overlays.set(panelCta.getAttribute("href") === "/planos" ? "planos" : "demo");
      return;
    }
    if (target.closest("[data-close-overlay]")) {
      ev.preventDefault();
      overlays.set(null);
      return;
    }
    if (target.closest("[data-close-panel]")) {
      ev.preventDefault();
      selection.closeSel();
      return;
    }
    if (target.closest("[data-home]")) {
      ev.preventDefault();
      overlays.set(null, false);
      selection.closeSel(false);
      router.go("/", data.siteTitle, null, true);
      return;
    }
  });

  // ===== Hover/foco dos nós (desktop) =====
  for (const [id, el] of els.nodes) {
    const enter = () => {
      if (!isTouch()) selection.setHover(id);
    };
    const leave = () => {
      if (!isTouch() && state.hoverId === id) selection.setHover(null);
    };
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    el.addEventListener("focus", enter);
    el.addEventListener("blur", leave);
  }

  // ===== Teclado =====
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (state.overlay) overlays.set(null);
    else if (state.selId || state.hoverId) selection.closeSel();
  });

  // ===== Histórico (voltar/avançar) =====
  router.onPop((entry, slug) => {
    if (entry?.overlay) {
      overlays.set(entry.overlay, false);
      return;
    }
    overlays.set(null, false);
    const n = bySlug.get(slug);
    if (!n) {
      selection.closeSel(false);
      document.title = data.siteTitle;
      return;
    }
    if (entry?.sel || (n.id !== "demo" && n.id !== "planos")) {
      state.selId = null; // força reabrir
      selection.openNode(n.id, false);
      document.title = n.title;
    } else {
      overlays.set(n.id as OverlayId, false);
    }
  });

  // ===== Dica contextual + resize =====
  const applyHint = () => {
    els.hint.textContent = isMobile()
      ? "arraste para explorar o mapa · toque para descobrir"
      : isTouch()
        ? "toque em uma estrela para explorar"
        : "clique em uma estrela para explorar";
  };
  let wasMobile = isMobile();
  addEventListener("resize", () => {
    if (isMobile() !== wasMobile) {
      wasMobile = isMobile();
      camera.applyEdgeCoords();
    }
    applyHint();
    camera.refresh();
    panel.placeSheet();
  });
  applyHint();
}
