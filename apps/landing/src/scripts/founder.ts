// Ato 6 — founder-vídeo runtime. Ported from the design's
// `fPlay`/`_fAlign`/`fReplay`/`fStreamTick`/`founderTick`
// (cultiv-hero-v5.dc.html 2591–2655) plus the founder half of `readScroll`
// (1988–2020: pin progress on desktop, proximity-based entry on mobile).
//
// The section is a CONSTANT-HEIGHT dark chamber, pinned like the voice-map
// (Ato 3): on desktop it is always 200vh with a 100svh sticky viewport,
// regardless of the video-sim state — so playing the video never resizes the
// section (user request 2026-07-16). The pin + chamber inversion are driven
// purely by SCROLL (a symmetric enter/exit window, same shape as voicemap's
// `cThemeT`), fully decoupled from the video-sim phase.
//
// State machine (`phase`) drives ONLY the video-sim visuals (poster/stream/
// note reveal), never the layout height:
//   idle  → poster + play button, note collapsed.
//   play  → poster replaced by the streaming "video" simulation.
//   split → triggered by the stream reaching its cue point (F_CUE); the
//           note reveals alongside the still-looping stream.
// `data-fphase`/`data-reduced`/`data-pinned` on the section root drive every
// discrete visual (see styles/founder.css); the continuous scroll-easing
// (sticky background, inner opacity/rise, theme-breath) is written as direct
// inline styles per frame.
import { addResize, addScroll, addTick, clamp, eio, mix, onReducedChange, reducedMotion, rgb, sm, start } from "./engine";
import { setChamberT } from "./theme-breath";
import { getLang, onLangChange, type Lang } from "./i18n";

const MOBILE_BREAKPOINT = 720; // design's `cMobile = width < 720`; matches founder.css's `min-width: 720px`.
const F_CLIP = 7.4; // duração do clipe simulado (s) — design F_CLIP.
const F_CUE = 3.4; // instante em que o resultado é revelado (split) — design F_CUE.

const BG_LIGHT: [number, number, number] = [248, 247, 244];
const BG_DARK: [number, number, number] = [21, 20, 17];

// Primeira frase de cada nota (autêntica) — usada no stream de "geração"
// dentro do vídeo, mesma técnica do design (`F_STREAM = FOUNDER_NOTE[0].split(' ')`).
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
    // Pinned whenever desktop + non-reduced — INDEPENDENT of the video phase,
    // so height stays 200vh in idle/play/split alike.
    section!.toggleAttribute("data-pinned", !reduced && !mobile);
  }

  // Reserve a CONSTANT height for the split row = the taller of the video frame
  // and the fully-revealed note, measured off the note's real column width.
  // With the row height fixed, opening the note never grows the block, so the
  // vertically-centered content — and the video with it — never jumps ("pulinho").
  // (The `height:auto` default let it grow with the note's transient sliver-width
  // wrap and re-center.) Recomputed on resize + language change (pt/en differ).
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

  // Continuous scroll-driven chamber inversion + entrance easing. Symmetric
  // enter/exit window mirrors voicemap's `cThemeT` (voice-synth.ts): light →
  // dark on ENTER, dark → light on EXIT. Decoupled from `phase`.
  function paint(): void {
    if (reduced) {
      // Static dark card (like voicemap's reduced frame); the page chamber is
      // left untouched (setChamberT 0), matching voicemap's reduced branch.
      sticky!.style.backgroundColor = rgb(BG_DARK);
      inner!.style.opacity = "1";
      inner!.style.transform = "none";
      setChamberT("founder", 0);
      return;
    }
    const q = fQ;
    // Desktop (pinned): symmetric window over the scroll progress, same shape
    // as voicemap. Mobile (not pinned): coverage-based q (see onScroll), a
    // gentler single ramp that still releases as the section leaves.
    // Symmetric window, same shape/timing as voicemap's `cThemeT`: the chamber
    // is fully LIGHT at both section edges (q≈0 and q≈1) and only dark across
    // the middle plateau — so the previous (Plans) and next (FAQ) sections are
    // never on screen while the global --t-* palette is inverted. Lightening
    // finishes by q≈0.88 (well before the section un-pins) to keep the handoff
    // clean, like the voice-map exit.
    const themeT = mobile ? sm(0.2, 0.78, q) : sm(0.04, 0.18, q) * (1 - sm(0.72, 0.88, q));
    sticky!.style.backgroundColor = rgb(mix(BG_LIGHT, BG_DARK, themeT));
    // Inner content rises/fades IN on enter and OUT on exit, tracking the
    // chamber so the light-on-dark text never sits on a light background.
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
    if (fClock >= F_CLIP) fClock = 0; // loop — o vídeo continua rodando.
  }

  function tick(dt: number): void {
    if (fRunning) {
      fClock += dt;
      streamTick();
    }
    if (reduced) return; // design's `_tick` bails entirely under reduced; the one-time init paint below covers it.
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
      // Not pinned on mobile (auto height): darken by how much of the viewport
      // the section covers — symmetric by construction (0 before AND after).
      const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
      fTargetQ = clamp(visible / Math.min(rect.height || vh, vh), 0, 1);
    } else {
      // Pinned (200vh): scroll progress through the section — EXACT same mapping
      // as voice-synth.ts's onScroll, so the enter/exit windows line up.
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
    applyAttrs(); // toggles the video-sim state only — height/pin stay constant.
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
      // Snap straight to the fully-resolved state — same spirit as the
      // design's `applyMotion` (no lingering unrevealed idle button).
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

  onLangChange(() => fixSplitHeight()); // pt/en notes differ in length → re-reserve.

  applyAttrs();
  fixSplitHeight();
  onScroll(window.scrollY || document.documentElement.scrollTop || 0); // design's componentDidMount: readScroll() once at mount.
  paint(); // design's componentDidMount: founderTick(0.016) once at mount — essential for reduced-motion.
  // Fonts change the note's wrapped height — re-measure once they load.
  if (document.fonts?.ready) document.fonts.ready.then(() => fixSplitHeight());
  addTick(tick);
  addScroll(onScroll);
  start();
}
