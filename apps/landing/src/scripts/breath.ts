// Breath (Ato 4) — ported from the design's `breathTick` (cultiv-hero-v5.dc.html
// 2069–2112). Word-by-word ink reveal driven by the `#respiracao` section's
// scroll position: a "reading head" sweeps across the visible language
// block's words, painting each from a dim resting color to full ink as it
// passes, with a short smoothstep spread so a few words light up together
// rather than one at a time.
//
// JS-off and prefers-reduced-motion both resolve to full ink via CSS alone
// (breath.css) — this module only needs to *reproduce* that resting state
// when reduced-motion is live (design's own `if (this.state.reduced)`
// branch, 2092–2095) so a runtime OS toggle mid-scroll doesn't leave stray
// inline colors fighting the stylesheet.
import { addTick, clamp, reducedMotion } from "./engine";
import { getLang, onLangChange } from "./i18n";

const DIM: readonly [number, number, number] = [206, 203, 196]; // quase o fundo, mas legível
const INK: readonly [number, number, number] = [52, 50, 46]; // a cor certa de leitura
const SPREAD = 2.4; // palavras que acendem em conjunto ao redor da cabeça de leitura

function paint(w: HTMLElement, t: number, cache: WeakMap<HTMLElement, number>): void {
  const q = Math.round(t * 1000);
  if (cache.get(w) === q) return;
  cache.set(w, q);
  const r = Math.round(DIM[0] + (INK[0] - DIM[0]) * t);
  const g = Math.round(DIM[1] + (INK[1] - DIM[1]) * t);
  const b = Math.round(DIM[2] + (INK[2] - DIM[2]) * t);
  w.style.color = `rgb(${r},${g},${b})`;
}

/** Mounts the Breath section's scroll-driven word reveal. No-ops quietly if
    the section isn't on the page (defensive — every other section tolerates
    absence of its own hooks the same way). */
export function initBreath(): void {
  const section = document.getElementById("respiracao");
  if (!section) return;

  const cache = new WeakMap<HTMLElement, number>();
  let words: HTMLElement[] = [];
  let n = 1;

  // Only the currently visible language block's words participate — the
  // hidden sibling (`[data-l]` display:none via root.css) sits at zero size
  // and would otherwise just waste paint cycles.
  const collectWords = () => {
    const active = section.querySelector<HTMLElement>(`h2[data-l="${getLang()}"]`);
    words = active ? Array.from(active.querySelectorAll<HTMLElement>("[data-breath-word]")) : [];
    n = words.length || 1;
  };
  collectWords();
  onLangChange(collectWords);

  addTick(() => {
    if (!words.length) return;

    if (reducedMotion()) {
      for (const w of words) paint(w, 1, cache);
      return;
    }

    const rect = section.getBoundingClientRect();
    const range = Math.max(1, section.offsetHeight - window.innerHeight);
    const p = clamp(-rect.top / range, 0, 1);
    // respira: segura um pouco no começo e no fim da faixa de scroll
    const local = clamp((p - 0.08) / 0.7, 0, 1);
    // a cabeça de leitura vai além da última palavra (+SPREAD) para que a
    // última palavra resolva 100% no fim do scroll, não pela metade
    const head = local * (n + SPREAD);
    for (let i = 0; i < words.length; i++) {
      let t = (head - i) / SPREAD;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      t = t * t * (3 - 2 * t); // smoothstep
      paint(words[i], t, cache);
    }
  });
}
