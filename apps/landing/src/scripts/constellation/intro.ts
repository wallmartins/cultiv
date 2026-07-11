// Entrada da página: cortina (marca se desenha e voa até a identidade),
// fade da marca, digitação da tagline e liberação do rodapé. Com
// prefers-reduced-motion tudo aparece pronto, sem coreografia.

import type { Els } from "./els";
import type { AppState } from "./state";
import { isStacked } from "./state";
import type { AppData } from "./types";

interface Deps {
  els: Els;
  state: AppState;
  data: AppData;
  /** Disparado no momento certo da coreografia para acender o canvas de ritmo. */
  startRhythm: () => void;
}

export function runIntro({ els, state, data, startRhythm }: Deps): void {
  const { app, curtain, curtainLogo, typed, caret, foot } = els;

  const typeStep = (i: number) => {
    typed.textContent = data.tagline.slice(0, i);
    caret.style.opacity = "1";
    if (i < data.tagline.length) {
      setTimeout(() => typeStep(i + 1), 42);
    } else {
      caret.style.opacity = "0";
      setTimeout(() => foot.classList.add("is-in"), 250);
    }
  };

  const startEntry = () => {
    app.classList.add("is-on");
    if (state.reduced) {
      typed.textContent = data.tagline;
      foot.classList.add("is-in");
      return;
    }
    typed.textContent = "";
    setTimeout(() => typeStep(1), 550);
  };

  if (state.reduced) {
    curtain.dataset.curtain = "done";
    startEntry();
    startRhythm();
    return;
  }

  setTimeout(() => {
    // A logo da cortina voa até o seu lugar na coluna de identidade.
    const tgt = isStacked()
      ? app.querySelector(".brand-glyph")
      : app.querySelector(".side-logo") || app.querySelector(".brand-glyph");
    const cur = curtainLogo.querySelector("svg");
    if (tgt && cur) {
      const a = tgt.getBoundingClientRect();
      const b = cur.getBoundingClientRect();
      const dx = a.left + a.width / 2 - (b.left + b.width / 2);
      const dy = a.top + a.height / 2 - (b.top + b.height / 2);
      const sc = a.width / b.width;
      curtainLogo.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sc.toFixed(3)})`;
    } else {
      curtainLogo.style.transform = "translateX(-35vw) scale(0.55)";
    }
    curtain.dataset.curtain = "exit";
  }, 1500);
  setTimeout(() => (curtain.dataset.curtain = "settle"), 2400);
  setTimeout(() => (curtain.dataset.curtain = "done"), 5000);
  setTimeout(startEntry, 2450);
  setTimeout(startRhythm, 2750);
}
