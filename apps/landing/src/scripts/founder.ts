import { addResize, addScroll, addTick, clamp, eio, mix, onReducedChange, reducedMotion, rgb, sm, start } from "./engine";
import { setChamberT } from "./theme-breath";
import { getLang, onLangChange, type Lang } from "./i18n";

const MOBILE_BREAKPOINT = 720;
const F_CLIP = 7.4;
const F_CUE = 3.4;

const BG_LIGHT: [number, number, number] = [248, 247, 244];
const BG_DARK: [number, number, number] = [21, 20, 17];

const STREAM_WORDS: Record<Lang, string[]> = {
  pt: "Tenho notado que o receio de perder nossa essência para as máquinas, muitas vezes, ignora a natureza técnica de como elas operam hoje. A maioria das ferramentas entrega textos plásticos porque se baseia em médias estatísticas genéricas, enquanto um modelo ajustado absorve sua bagagem, aprendendo seu ritmo e preferências vocabulares específicas.".split(
    " "
  ),
  en: "I have noticed that most of what I read lately feels like a plastic, predictable version of human thought because these tools rely on statistical averages that erase our unique traits. When I observe my own way of writing, I realize that technology should act as an extension of our personal cadence, not as a substitute that impoverishes what we truly intend to convey.".split(
    " "
  ),
};

type Phase = "idle" | "play" | "split";

export function initFounder(): void {
  const section = document.getElementById("founder");
  const sticky = section?.querySelector<HTMLElement>("[data-founder-sticky]");
  const inner = section?.querySelector<HTMLElement>("[data-founder-inner]");
  if (!section || !sticky || !inner) return;

  const playBtn = section.querySelector<HTMLButtonElement>("[data-fplay]");
  const replayBtn = section.querySelector<HTMLButtonElement>("[data-freplay]");
  const streamEl = section.querySelector<HTMLElement>("[data-fstream]");
  const progressEl = section.querySelector<HTMLElement>("[data-fprogress]");
  const split = section.querySelector<HTMLElement>(".founder__split");
  const textPanel = section.querySelector<HTMLElement>("[data-founder-text]");
  const frame = section.querySelector<HTMLElement>(".founder__frame");

  let reduced = reducedMotion();
  let mobile = window.innerWidth < MOBILE_BREAKPOINT;
  let phase: Phase = reduced ? "split" : "idle";
  let fClock = 0;
  let fRunning = false;
  let fTargetQ = 0;
  let fQ = 0;

  function applyAttrs(): void {
    section!.dataset.fphase = phase;
    section!.toggleAttribute("data-reduced", reduced);
    section!.toggleAttribute("data-pinned", !reduced && !mobile);
  }

  function fixSplitHeight(): void {
    if (!split) return;
    if (reduced || mobile) {
      split.style.height = "";
      return;
    }
    const total = split.clientWidth;
    const csv = getComputedStyle(split);
    const gapPx = parseFloat(csv.columnGap || csv.gap || "0") || 0;
    let noteH = 0;
    if (textPanel) {
      const s = textPanel.style;
      const prev = [s.maxHeight, s.width, s.position, s.visibility, s.opacity] as const;
      s.maxHeight = "none";
      s.width = Math.max(1, (total - gapPx) * 0.53) + "px";
      s.position = "absolute";
      s.visibility = "hidden";
      s.opacity = "1";
      noteH = textPanel.scrollHeight;
      [s.maxHeight, s.width, s.position, s.visibility, s.opacity] = prev;
    }
    const frameH = frame ? frame.offsetHeight : 0;
    split.style.height = Math.max(frameH, noteH) + "px";
  }

  function paint(): void {
    if (reduced) {
      sticky!.style.backgroundColor = rgb(BG_DARK);
      inner!.style.opacity = "1";
      inner!.style.transform = "none";
      setChamberT("founder", 0);
      return;
    }
    const q = fQ;
    const themeT = mobile ? sm(0.2, 0.78, q) : sm(0.04, 0.18, q) * (1 - sm(0.72, 0.88, q));
    sticky!.style.backgroundColor = rgb(mix(BG_LIGHT, BG_DARK, themeT));
    const inK = mobile ? sm(0.12, 0.5, q) : sm(0.13, 0.27, q);
    const outK = mobile ? 1 : 1 - sm(0.74, 0.88, q);
    inner!.style.opacity = Math.max(0, Math.min(inK, outK)).toFixed(3);
    const rise = (1 - eio(mobile ? sm(0.08, 0.5, q) : sm(0.05, 0.2, q))) * 42;
    inner!.style.transform = `translate3d(0,${rise.toFixed(1)}px,0)`;
    setChamberT("founder", themeT);
  }

  function streamTick(): void {
    const words = STREAM_WORDS[getLang()];
    const n = Math.min(words.length, Math.max(0, Math.round((fClock / F_CUE) * words.length)));
    if (streamEl) streamEl.textContent = words.slice(0, n).join(" ") + " ";
    if (progressEl) progressEl.style.width = Math.min(100, (fClock / F_CLIP) * 100) + "%";
    if (fClock >= F_CUE && phase === "play") {
      phase = "split";
      applyAttrs();
    }
    if (fClock >= F_CLIP) fClock = 0;
  }

  function tick(dt: number): void {
    if (fRunning) {
      fClock += dt;
      streamTick();
    }
    if (reduced) return;
    const diff = fTargetQ - fQ;
    if (Math.abs(diff) > 0.0004) fQ += diff * (1 - Math.exp(-dt * 6));
    else fQ = fTargetQ;
    paint();
  }

  function onScroll(sy: number): void {
    if (reduced) return;
    const vh = window.innerHeight;
    const rect = section!.getBoundingClientRect();
    if (mobile) {
      const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
      fTargetQ = clamp(visible / Math.min(rect.height || vh, vh), 0, 1);
    } else {
      const top = rect.top + sy;
      const start = top - vh * 0.55;
      const end = top + section!.offsetHeight - vh;
      fTargetQ = clamp((sy - start) / Math.max(1, end - start), 0, 1);
    }
  }

  function fPlay(): void {
    if (reduced) {
      phase = "split";
      applyAttrs();
      return;
    }
    fClock = 0;
    fRunning = true;
    phase = "play";
    applyAttrs();
  }

  function fReplay(): void {
    fClock = 0;
    fRunning = true;
    phase = "play";
    applyAttrs();
  }

  playBtn?.addEventListener("click", fPlay);
  replayBtn?.addEventListener("click", fReplay);

  onReducedChange((r) => {
    reduced = r;
    if (reduced) {
      phase = "split";
      fRunning = false;
      fClock = 0;
    }
    applyAttrs();
    paint();
  });

  addResize(() => {
    mobile = window.innerWidth < MOBILE_BREAKPOINT;
    applyAttrs();
    fixSplitHeight();
  });

  onLangChange(() => fixSplitHeight());

  applyAttrs();
  fixSplitHeight();
  onScroll(window.scrollY || document.documentElement.scrollTop || 0);
  paint();
  if (document.fonts?.ready) document.fonts.ready.then(() => fixSplitHeight());
  addTick(tick);
  addScroll(onScroll);
  start();
}
