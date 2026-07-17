import { addTick, clamp, reducedMotion } from "./engine";
import { getLang, onLangChange } from "./i18n";

const DIM: readonly [number, number, number] = [206, 203, 196];
const INK: readonly [number, number, number] = [52, 50, 46];
const SPREAD = 2.4;

function paint(w: HTMLElement, t: number, cache: WeakMap<HTMLElement, number>): void {
  const q = Math.round(t * 1000);
  if (cache.get(w) === q) return;
  cache.set(w, q);
  const r = Math.round(DIM[0] + (INK[0] - DIM[0]) * t);
  const g = Math.round(DIM[1] + (INK[1] - DIM[1]) * t);
  const b = Math.round(DIM[2] + (INK[2] - DIM[2]) * t);
  w.style.color = `rgb(${r},${g},${b})`;
}

export function initBreath(): void {
  const section = document.getElementById("respiracao");
  if (!section) return;

  const cache = new WeakMap<HTMLElement, number>();
  let words: HTMLElement[] = [];
  let n = 1;

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
    const local = clamp((p - 0.08) / 0.7, 0, 1);
    const head = local * (n + SPREAD);
    for (let i = 0; i < words.length; i++) {
      let t = (head - i) / SPREAD;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      t = t * t * (3 - 2 * t);
      paint(words[i], t, cache);
    }
  });
}
