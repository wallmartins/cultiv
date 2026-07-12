// Registro de elementos: toda consulta ao DOM acontece uma vez, aqui.
// Os demais módulos recebem referências tipadas, nunca seletores.

import type { OverlayId } from "./state";

export interface EdgeEl {
  g: Element;
  a: string;
  b: string;
  lines: SVGLineElement[];
}

export interface DemoEls {
  text: HTMLTextAreaElement;
  words: HTMLElement;
  btn: HTMLButtonElement;
  card: HTMLElement;
  empty: HTMLElement;
  metrics: HTMLElement;
  summary: HTMLElement;
}

export interface Els {
  app: HTMLElement;
  viewport: HTMLElement;
  fieldbox: HTMLElement;
  nodes: Map<string, HTMLAnchorElement>;
  edges: EdgeEl[];
  panelWrap: HTMLElement;
  panel: HTMLElement;
  panelBody: HTMLElement;
  sheetHandle: HTMLElement;
  panelTemplates: Map<string, HTMLTemplateElement>;
  overlays: Record<OverlayId, HTMLElement>;
  hint: HTMLElement;
  curtain: HTMLElement;
  curtainLogo: HTMLElement;
  typed: HTMLElement;
  caret: HTMLElement;
  foot: HTMLElement;
  rhythm: HTMLCanvasElement | null;
  demo: DemoEls;
}

export function collectEls(app: HTMLElement): Els {
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) =>
    app.querySelector<T>(sel)!;
  return {
    app,
    viewport: $("[data-viewport]"),
    fieldbox: $("[data-fieldbox]"),
    nodes: new Map(
      [...app.querySelectorAll<HTMLAnchorElement>("[data-node]")].map((el) => [
        el.dataset.node!,
        el,
      ])
    ),
    edges: [...app.querySelectorAll(".edge")].map((g) => ({
      g,
      a: (g as HTMLElement).dataset.a!,
      b: (g as HTMLElement).dataset.b!,
      lines: [...g.querySelectorAll("line")],
    })),
    panelWrap: $("[data-panel-wrap]"),
    panel: $("[data-panel]"),
    panelBody: $("[data-panel-body]"),
    sheetHandle: $("[data-sheet-handle]"),
    panelTemplates: new Map(
      [...app.querySelectorAll<HTMLTemplateElement>("[data-panel-template]")].map((t) => [
        t.dataset.panelTemplate!,
        t,
      ])
    ),
    overlays: {
      demo: $('[data-overlay="demo"]'),
      planos: $('[data-overlay="planos"]'),
    },
    hint: $("[data-hint]"),
    curtain: $("[data-curtain]"),
    curtainLogo: $("[data-curtain-logo]"),
    typed: $("[data-typed]"),
    caret: $(".caret"),
    foot: $("[data-foot]"),
    rhythm: app.querySelector<HTMLCanvasElement>("[data-rhythm]"),
    demo: {
      text: $("[data-demo-text]") as unknown as HTMLTextAreaElement,
      words: $("[data-demo-words]"),
      btn: $("[data-demo-analyze]") as HTMLButtonElement,
      card: $("[data-demo-result]"),
      empty: $("[data-demo-empty]"),
      metrics: $("[data-demo-metrics]"),
      summary: $("[data-demo-summary]"),
    },
  };
}
