// Painel do nó: preenchimento (clonando os <template> renderizados no
// servidor — mesma marcação e estilos do HTML inicial) e o comportamento de
// bottom sheet no modo empilhado (posições full/half/collapsed + arrasto).

import type { Els } from "./els";
import { isStacked } from "./state";

export interface Panel {
  /** Troca o conteúdo pelo do nó (clone do template server-rendered). */
  fill(id: string): void;
  show(): void;
  hide(): void;
  /** Reposiciona o sheet no estado atual (chamar em resize). */
  placeSheet(): void;
  /** Callback quando o usuário descarta o sheet arrastando para baixo. */
  onDismiss(cb: () => void): void;
}

export function createPanel(els: Els): Panel {
  const { panel, panelWrap, panelBody } = els;
  let sheetPos: "full" | "half" | "collapsed" = "half";
  let dismiss: () => void = () => {};

  const sheetDims = () => {
    const h = Math.min(Math.round(innerHeight * 0.8), 620);
    return { h, half: Math.round(h * 0.45), collapsed: h - 104 };
  };
  const placeSheet = () => {
    if (!isStacked()) {
      panel.style.transform = "";
      return;
    }
    const d = sheetDims();
    const y = sheetPos === "full" ? 0 : sheetPos === "collapsed" ? d.collapsed : d.half;
    panel.style.transform = `translateY(${y}px)`;
  };

  els.sheetHandle.addEventListener("pointerdown", (e) => {
    if (!isStacked()) return;
    e.preventDefault();
    const d = sheetDims();
    const startY = e.clientY;
    const baseY =
      sheetPos === "full" ? 0 : sheetPos === "collapsed" ? d.collapsed : d.half;
    let lastY = e.clientY;
    let lastT = performance.now();
    let vy = 0;
    let curY = baseY;
    panel.classList.add("dragging");
    const move = (ev: PointerEvent) => {
      const now = performance.now();
      vy = (ev.clientY - lastY) / Math.max(1, now - lastT);
      lastY = ev.clientY;
      lastT = now;
      curY = Math.min(d.h, Math.max(0, baseY + (ev.clientY - startY)));
      panel.style.transform = `translateY(${curY}px)`;
    };
    const up = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", up);
      panel.classList.remove("dragging");
      if (vy > 0.85 || curY > d.h - 60) {
        dismiss();
        return;
      }
      const targets: ["full" | "half" | "collapsed", number][] = [
        ["full", 0],
        ["half", d.half],
        ["collapsed", d.collapsed],
      ];
      let best = targets[0];
      for (const t of targets) if (Math.abs(t[1] - curY) < Math.abs(best[1] - curY)) best = t;
      if (vy < -0.4) best = curY > d.half ? ["half", d.half] : ["full", 0];
      sheetPos = best[0];
      placeSheet();
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
  });

  return {
    fill(id) {
      const tpl = els.panelTemplates.get(id);
      if (!tpl) return;
      panelBody.replaceChildren(tpl.content.cloneNode(true));
    },
    show() {
      panelWrap.hidden = false;
      sheetPos = "half";
      placeSheet();
      panel.focus({ preventScroll: true });
    },
    hide() {
      panelWrap.hidden = true;
    },
    placeSheet,
    onDismiss(cb) {
      dismiss = cb;
    },
  };
}
