// Raiz de composição do cliente (Cultiv Landing v3).
// Todo o conteúdo já está no HTML servido; estes módulos só animam e navegam.
// Cada um tem uma responsabilidade; este arquivo apenas os liga:
//   theme      — alternador claro/escuro persistido
//   camera     — pan/zoom do mapa celeste (mobile)
//   panel      — painel/bottom sheet do nó (clona <template> do servidor)
//   selection  — hover/seleção e projeção em classes
//   overlays   — Demo e Planos
//   interactions — eventos do usuário → chamadas aos módulos
//   demo       — leitura de voz (heurística pura + render)
//   intro      — cortina + digitação
//   rhythm     — canvas decorativo da identidade

import { readAppData } from "./types";
import { createState } from "./state";
import { collectEls } from "./els";
import { initTheme } from "./theme";
import { createRouter } from "./router";
import { createCamera } from "./camera";
import { createPanel } from "./panel";
import { createSelection } from "./selection";
import { createOverlays } from "./overlays";
import { bindInteractions } from "./interactions";
import { initDemo } from "./demo";
import { runIntro } from "./intro";
import { createRhythm } from "./rhythm";

const app = document.querySelector<HTMLElement>("[data-app]");
if (app) {
  const data = readAppData(app);
  const state = createState(app);
  const els = collectEls(app);

  initTheme();
  const router = createRouter(data);
  const camera = createCamera(els);
  const panel = createPanel(els);
  const selection = createSelection({ state, els, data, camera, panel, router });
  const overlays = createOverlays({ state, els, data, panel, router, selection });
  bindInteractions({ state, els, data, camera, panel, router, selection, overlays });
  initDemo(els);

  // Estado inicial servido pelo servidor (páginas /:slug, /demo, /planos).
  if (state.selId) {
    router.replace({ sel: state.selId });
    els.panelWrap.hidden = false;
    selection.applyActive();
  }
  if (state.overlay) router.replace({ overlay: state.overlay });

  const rhythm = createRhythm(els.rhythm, state.reduced);
  runIntro({ els, state, data, startRhythm: rhythm.start });
}
