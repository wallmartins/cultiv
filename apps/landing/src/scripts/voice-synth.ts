// VoiceMap "harmonic synthesizer" — Ato 3, the Voice Profile made geometry.
// Ported from the design's DCLogic monolith (cultiv-hero-v5.dc.html):
// cInit (2524-2585, S_PILLARS + 13-trait S_NODES), cResize (2682-2701),
// cInteractive/sSample/cBindPointers/sSetHover/sPillarDown/cUpdateOverlays
// (2702-2831), cTick/cRender (2832-3121), plus the constellation slice of
// `readScroll` (1994-2002) and the voicemap renderVals keys (3242-3272).
//
// Three braided waves (pillars TOM/RITMO/EMOÇÃO) are modulated by 13 trait
// nodes; scroll scrubs `q` through entry -> zoom-in -> interactive plateau ->
// collapse -> handoff. Chamber inversion is routed through theme-breath's
// `setChamberT('const', t)` — this module never touches `--t-*` directly.
//
// Deviation from the source (documented, not silently ported): the design's
// `_tick` bails out entirely when `state.reduced` (2024), which makes the
// `cTick` branch that sets `sGrow = [1, 1, 1]` under reduced motion (2872-2873)
// dead code — under reduced motion `sGrow` is permanently `[0, 0, 0]` (only
// ever initialized in `cInit`), so every trait node's `born` test evaluates
// to 0 and NOTHING is drawn: an empty canvas. That directly contradicts
// CONSTELLATION-SPEC.md Fix G ("constelação legível" — a labeled, static
// scene). `render()` below substitutes a local `grow = reduced ? [1,1,1] :
// this.sGrow` so the reduced-motion scene is actually legible, matching the
// spec's explicit acceptance criterion instead of the source's unreachable
// branch.

import {
  addResize,
  addScroll,
  addTick,
  clamp,
  eio,
  lerp,
  mulberry,
  onReducedChange,
  reducedMotion,
  sm,
  smoothScrollTo,
  start,
  win,
} from "./engine";
import { setChamberT } from "./theme-breath";
import { getLang, onLangChange, type Lang } from "./i18n";

/* ---------------- shared pillar data (also consumed by VoiceMap.astro) ---------------- */

export interface PillarMeta {
  readonly id: "tom" | "ritmo" | "emocao";
  readonly labelPt: string;
  readonly labelEn: string;
  readonly color: string;
  readonly rgb: readonly [number, number, number];
  /** Vertical baseline of the pillar's wave, as a 0..1 fraction of frame height (design `p.base`). */
  readonly base: number;
}

// design cInit 2536-2538 (S_PILLARS).
export const PILLARS: readonly PillarMeta[] = [
  { id: "tom", labelPt: "TOM", labelEn: "TONE", color: "#A3DD42", rgb: [163, 221, 66], base: 0.335 },
  { id: "ritmo", labelPt: "RITMO", labelEn: "RHYTHM", color: "#E8B44A", rgb: [232, 180, 74], base: 0.52 },
  { id: "emocao", labelPt: "EMOÇÃO", labelEn: "EMOTION", color: "#63BCA9", rgb: [99, 188, 169], base: 0.705 },
];

export function pillarGlow(rgb: readonly [number, number, number]): string {
  return `rgba(${rgb.join(",")},0.7)`;
}

/** design renderVals `p.topCss` (3255). */
export function pillarTopCss(base: number): string {
  return `calc(${(base * 100).toFixed(1)}% - 19px)`;
}

/** Portrait (phone) horizontal spread of the three pillars, left→right in
    pillar order [tom, ritmo, emoção]. Shared by the canvas geometry
    (`sample()` origin X) and the chip CSS (`--pillar-x`) so a chip sits exactly
    where its wave launches from. The narrow layout flips the synth 90°: pillars
    ride a row across the top and the braids descend down the viewport. */
export const PILLAR_X_PORTRAIT = [0.24, 0.5, 0.76] as const;

export function pillarAriaLabel(labelPt: string, lang: Lang): string {
  return lang === "en"
    ? `Pillar ${labelPt} — drag up or down to adjust the intensity`
    : `Pilar ${labelPt} — arraste para cima ou para baixo para ajustar a intensidade`;
}

// design markup line 281, verbatim pt.
const CANVAS_ARIA_PT =
  "Sintetizador harmônico do Perfil de Voz: três ondas — Tom, Ritmo e Emoção — se entrelaçam da esquerda para a direita. Treze nós modulam as ondas: formalidade, humor, pessoalidade, vocabulário, metáforas, cadência, pontuação, estrutura, respiração, convicção, raciocínio, argumentação e audiência. Passe pelos nós para ver cada traço; arraste um pilar para ajustar a intensidade.";
const CANVAS_ARIA_EN =
  "Harmonic synthesizer of the Voice Profile: three waves — Tone, Rhythm and Emotion — weave together from left to right. Thirteen nodes modulate the waves: formality, humor, personal voice, vocabulary, metaphors, cadence, punctuation, structure, breathing, conviction, reasoning, argumentation and audience. Hover the nodes to see each trait; drag a pillar to adjust its intensity.";

interface TraitSeed {
  readonly w: number;
  readonly t: number;
  readonly labelPt: string;
  readonly labelEn: string;
  readonly descPt: string;
  readonly descEn: string;
  readonly tick: number;
}

// design cInit 2542-2559 (S_NODES) — pt verbatim; en is a faithful sibling.
const TRAITS: readonly TraitSeed[] = [
  // TOM — como você soa
  {
    w: 0,
    t: 0.2,
    labelPt: "Formalidade",
    labelEn: "Formality",
    descPt: "Do coloquial ao cerimonioso — onde a sua fala se veste.",
    descEn: "From casual to ceremonial — where your voice gets dressed.",
    tick: -0.6,
  },
  {
    w: 0,
    t: 0.38,
    labelPt: "Humor",
    labelEn: "Humor",
    descPt: "Ironia, leveza ou seriedade: o tempero que escapa sem querer.",
    descEn: "Irony, lightness or gravity — the seasoning that slips out unplanned.",
    tick: 0.9,
  },
  {
    w: 0,
    t: 0.56,
    labelPt: "Pessoalidade",
    labelEn: "Personal voice",
    descPt: "Quanto de “eu” entra no texto — e quando.",
    descEn: "How much “I” enters the text — and when.",
    tick: 0.2,
  },
  {
    w: 0,
    t: 0.74,
    labelPt: "Vocabulário",
    labelEn: "Vocabulary",
    descPt: "As palavras que só você escolheria.",
    descEn: "The words only you would choose.",
    tick: -1.4,
  },
  {
    w: 0,
    t: 0.9,
    labelPt: "Metáforas",
    labelEn: "Metaphors",
    descPt: "As imagens que você usa para explicar o mundo.",
    descEn: "The images you reach for to explain the world.",
    tick: 1.7,
  },
  // RITMO — como você flui
  {
    w: 1,
    t: 0.27,
    labelPt: "Cadência",
    labelEn: "Cadence",
    descPt: "Frases curtas que abrem; longas que respiram e dão a volta.",
    descEn: "Short sentences that open; long ones that breathe and curve back.",
    tick: 1.1,
  },
  {
    w: 1,
    t: 0.46,
    labelPt: "Pontuação",
    labelEn: "Punctuation",
    descPt: "Travessões, reticências, dois-pontos — a sua assinatura gráfica.",
    descEn: "Dashes, ellipses, colons — your graphic signature.",
    tick: -0.9,
  },
  {
    w: 1,
    t: 0.65,
    labelPt: "Estrutura",
    labelEn: "Structure",
    descPt: "Como um parágrafo nasce, cresce e fecha.",
    descEn: "How a paragraph is born, grows and closes.",
    tick: 0.5,
  },
  {
    w: 1,
    t: 0.85,
    labelPt: "Respiração",
    labelEn: "Breathing",
    descPt: "As pausas que dão tempo ao leitor.",
    descEn: "The pauses that give the reader time.",
    tick: -1.8,
  },
  // EMOÇÃO — como você pensa
  {
    w: 2,
    t: 0.235,
    labelPt: "Convicção",
    labelEn: "Conviction",
    descPt: "A força com que você afirma o que pensa.",
    descEn: "The force with which you state what you think.",
    tick: 1.4,
  },
  {
    w: 2,
    t: 0.425,
    labelPt: "Raciocínio",
    labelEn: "Reasoning",
    descPt: "A ordem em que as ideias aparecem na sua cabeça.",
    descEn: "The order your ideas arrive in.",
    tick: -0.3,
  },
  {
    w: 2,
    t: 0.615,
    labelPt: "Argumentação",
    labelEn: "Argumentation",
    descPt: "Cada argumento segue a sua forma de convencer.",
    descEn: "Every argument follows your own way of persuading.",
    tick: 0.7,
  },
  {
    w: 2,
    t: 0.815,
    labelPt: "Audiência",
    labelEn: "Audience",
    descPt: "Como você muda quando muda quem lê.",
    descEn: "How you change when your reader changes.",
    tick: -1.1,
  },
];

/* ---------------- runtime types ---------------- */

interface RuntimePillar {
  readonly meta: PillarMeta;
  readonly el: HTMLElement;
  off: number; // raw drag offset, px
  dOff: number; // damped/display offset, px
  amp: number; // raw target amplitude
  dAmp: number; // damped/display amplitude
  flash: number; // pulse-arrival glow decay
}

interface RuntimeNode extends TraitSeed {
  sx: number;
  sy: number;
}

interface Pulse {
  w: number;
  pos: number;
  life: number;
}

interface Grain {
  x: number;
  y: number;
  a: number;
}

interface WavePoint {
  x: number;
  y: number;
  s: number;
  z: number;
  nx: number;
  ny: number;
}

/* ---------------- the synth ---------------- */

class VoiceSynth {
  private readonly section: HTMLElement;
  private readonly rise: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private readonly legend: HTMLElement;
  private readonly key: HTMLElement;
  private readonly seed: HTMLElement;
  private readonly handoff: HTMLElement;
  private readonly tip: HTMLElement;
  private readonly tipPillarLabel: HTMLElement;
  private readonly tipLabel: HTMLElement;
  private readonly tipDesc: HTMLElement;
  private readonly goBtn: HTMLElement;

  private readonly pillars: RuntimePillar[];
  private readonly nodes: RuntimeNode[];
  private readonly pulses: Pulse[] = [];
  private readonly grain: Grain[];
  private readonly wavePts: [WavePoint[], WavePoint[], WavePoint[]] = [[], [], []];

  private sTime: number;
  private sHoverK = 0;
  private hover: RuntimeNode | null = null;
  private lastHover: RuntimeNode | null = null;
  private readonly par = { x: 0, y: 0, tx: 0, ty: 0 };
  private sGrow: [number, number, number] = [0, 0, 0];
  private sGrowStart = -1;
  private sEnt = 1;
  private seedPos = { x: 0, y: 0, k: 0 };

  private cQ = 0;
  private cTargetQ = 0;
  private cClock = 0;
  private cNeeds = true;
  private cW = 0;
  private cH = 0;
  private cThemeT = 0;

  private lastT = -1;
  private lastLegOp = -1;
  private lastSeedOp = -1;
  private lastRiseTy = -1;
  private lastRiseOp = -1;

  private lang: Lang = getLang();

  constructor(section: HTMLElement) {
    this.section = section;
    this.rise = req(section, "[data-vmap-rise]");
    this.canvas = req<HTMLCanvasElement>(section, "[data-vmap-canvas]");
    this.legend = req(section, "[data-vmap-legend]");
    this.key = req(section, "[data-vmap-key]");
    this.tip = req(section, "[data-vmap-tip]");
    this.tipPillarLabel = req(this.tip, "[data-vmap-tip-pillar]");
    this.tipLabel = req(this.tip, "[data-vmap-tip-label]");
    this.tipDesc = req(this.tip, "[data-vmap-tip-desc]");
    this.goBtn = req(section, "[data-vmap-go]");
    this.handoff = req(document, "[data-vmap-handoff]");
    this.seed = req(this.handoff, "[data-cseed]");

    this.pillars = PILLARS.map((meta) => ({
      meta,
      el: req(section, `[data-pillar="${meta.id}"]`),
      off: 0,
      dOff: 0,
      amp: 1,
      dAmp: 1,
      flash: 0,
    }));
    this.nodes = TRAITS.map((t) => ({ ...t, sx: -99, sy: -99 }));

    // film grain — deterministic (mulberry32 seed 77), design cInit 2570-2574.
    const grand = mulberry(77);
    this.grain = [];
    for (let gi = 0; gi < 150; gi++) {
      this.grain.push({ x: grand(), y: grand(), a: 0.4 + grand() * 0.6 });
    }

    this.sTime = reducedMotion() ? 4.2 : 0;
  }

  /* ---------------- mount ---------------- */

  mount(): void {
    this.bindPointers();
    this.bindPillars();
    this.goBtn.addEventListener("click", () => this.goNext());
    this.syncAriaLabels();
    onLangChange((lang) => this.onLangChange(lang));
    onReducedChange(() => this.applyMotionMode());

    addResize(() => this.resize());
    addScroll((sy) => this.onScroll(sy));
    addTick((dt) => this.tick(dt));

    this.applyMotionMode();
    start();
  }

  private applyMotionMode(): void {
    const reduced = reducedMotion();
    this.section.dataset.motion = reduced ? "static" : "scrub";
    this.handoff.style.display = reduced ? "none" : "flex";
    if (reduced) {
      this.sTime = 4.2;
      this.cQ = 0.5;
      this.cTargetQ = 0.5;
    } else {
      this.sTime = 0;
      this.sGrow = [0, 0, 0];
      this.sGrowStart = -1;
      this.cQ = 0;
      this.cTargetQ = 0;
    }
    this.resize();
    this.onScroll(currentScrollY());
  }

  /* ---------------- resize (design cResize 2682-2701) ---------------- */

  private resize(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1); // Fix H
    this.cW = this.canvas.clientWidth;
    this.cH = this.canvas.clientHeight;
    this.canvas.width = Math.max(1, Math.round(this.cW * dpr));
    this.canvas.height = Math.max(1, Math.round(this.cH * dpr));
    this.ctx = this.canvas.getContext("2d");
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cNeeds = true;
    if (reducedMotion()) {
      this.legend.style.opacity = "1";
      this.legend.style.visibility = "visible";
      this.key.style.opacity = "1";
      this.render();
    }
  }

  /* ---------------- scroll progress (design readScroll 1994-2002) ---------------- */

  private onScroll(sy: number): void {
    if (reducedMotion()) return;
    const vh = window.innerHeight;
    const rect = this.section.getBoundingClientRect();
    const top = rect.top + sy;
    const start = top - vh * 0.55;
    const end = top + this.section.offsetHeight - vh;
    this.cTargetQ = clamp((sy - start) / Math.max(1, end - start), 0, 1);
  }

  /* ---------------- interaction (design cInteractive 2702-2705) ---------------- */

  private interactive(): boolean {
    if (reducedMotion()) return true;
    return this.cQ > 0.24 && this.cQ < 0.7;
  }

  /* ---------------- braid geometry (design sSample 2707-2737) ---------------- */

  private sample(pIdx: number, t: number): WavePoint {
    const p = this.pillars[pIdx]!;
    const W = this.cW;
    const H = this.cH;

    // Portrait (phones): the whole synth is transposed 90°. `t` now sweeps
    // top→bottom (waves descend), the braid oscillates in X, and each wave's
    // origin is a column across the top (PILLAR_X_PORTRAIT) — the pillar chip
    // rides that column via CSS. Everything downstream (line drawing, normals,
    // node sx/sy, tooltip, seed collapse) reads these x/y, so it all follows.
    if (W < 720) {
      const y0 = clamp(H * 0.235, 200, 272);
      const y1 = H * 0.93;
      const Y = y0 + (y1 - y0) * t;
      const cx = W * 0.5;
      const th = t * Math.PI * 2.7 + pIdx * ((Math.PI * 2) / 3) + this.sTime * 0.16;
      const env = sm(0, 0.22, t) * (1 - 0.35 * sm(0.86, 1, t));
      const braidR = W * 0.22 * p.dAmp * (0.25 + 0.75 * this.sEnt);
      const X3 = cx + Math.sin(th) * braidR * env;
      const Z = Math.cos(th) * W * 0.11 * env;
      const startX = W * PILLAR_X_PORTRAIT[pIdx]! + p.dOff;
      const blend = sm(0, 0.24, t);
      let X = startX + (X3 - startX) * blend;
      if (!reducedMotion()) {
        X += Math.sin(t * 36 + this.sTime * 2.2 + pIdx * 2.1) * 1.7 * (0.35 + 0.65 * env);
        X += Math.sin(t * 13 - this.sTime * 1.3 + pIdx * 4.7) * 2.4 * env;
      }
      for (const pl of this.pulses) {
        if (pl.w === pIdx) X -= 13 * pl.life * Math.exp(-Math.pow(t - pl.pos, 2) / 0.0022);
      }
      const f = 760;
      const s = f / (f + Z);
      let px = cx + (X - cx) * s;
      let py = H * 0.5 + (Y - H * 0.5) * s;
      px += this.par.x * 9 * (1.35 - s);
      py += this.par.y * 7 * (1.35 - s);
      if (this.seedPos.k > 0.001) {
        px = lerp(px, this.seedPos.x, this.seedPos.k);
        py = lerp(py, this.seedPos.y, this.seedPos.k);
      }
      return { x: px, y: py, s, z: Z, nx: 0, ny: 0 };
    }

    const x0 = clamp(W * 0.16, 130, 214);
    const x1 = W * 0.965;
    const X = x0 + (x1 - x0) * t;
    const cy = H * 0.53;
    const th = t * Math.PI * 2.7 + pIdx * ((Math.PI * 2) / 3) + this.sTime * 0.16;
    const env = sm(0, 0.22, t) * (1 - 0.35 * sm(0.86, 1, t));
    const braidR = H * 0.155 * p.dAmp * (0.25 + 0.75 * this.sEnt);
    const Y3 = cy + Math.sin(th) * braidR * env;
    const Z = Math.cos(th) * H * 0.085 * env;
    const startY = H * p.meta.base + p.dOff;
    const blend = sm(0, 0.24, t);
    let Y = startY + (Y3 - startY) * blend;
    const reduced = reducedMotion();
    if (!reduced) {
      Y += Math.sin(t * 36 + this.sTime * 2.2 + pIdx * 2.1) * 1.7 * (0.35 + 0.65 * env);
      Y += Math.sin(t * 13 - this.sTime * 1.3 + pIdx * 4.7) * 2.4 * env;
    }
    for (const pl of this.pulses) {
      if (pl.w === pIdx) Y -= 13 * pl.life * Math.exp(-Math.pow(t - pl.pos, 2) / 0.0022);
    }
    const f = 760;
    const s = f / (f + Z);
    let px = W * 0.5 + (X - W * 0.5) * s;
    let py = cy + (Y - cy) * s;
    px += this.par.x * 9 * (1.35 - s);
    py += this.par.y * 7 * (1.35 - s);
    if (this.seedPos.k > 0.001) {
      px = lerp(px, this.seedPos.x, this.seedPos.k);
      py = lerp(py, this.seedPos.y, this.seedPos.k);
    }
    return { x: px, y: py, s, z: Z, nx: 0, ny: 0 };
  }

  /* ---------------- pointers (design cBindPointers 2739-2779) ---------------- */

  private bindPointers(): void {
    const cv = this.canvas;
    cv.addEventListener("pointermove", (e) => {
      const r = cv.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      this.par.tx = (mx / Math.max(1, this.cW) - 0.5) * 2;
      this.par.ty = (my / Math.max(1, this.cH) - 0.5) * 2;
      if (!this.interactive()) {
        if (this.hover) this.setHover(null);
        cv.style.cursor = "default";
        return;
      }
      let found: RuntimeNode | null = null;
      let best = 1e9;
      for (const n of this.nodes) {
        const d = Math.hypot(mx - n.sx, my - n.sy);
        if (d < 26 && d < best) {
          best = d;
          found = n;
        }
      }
      // hysteresis: keep the current hover until the cursor truly moves away.
      const cur = this.hover;
      if (!found && cur && Math.hypot(mx - cur.sx, my - cur.sy) < 56) found = cur;
      cv.style.cursor = found ? "pointer" : "default";
      if (found !== cur && (found || e.pointerType !== "touch")) this.setHover(found);
      this.cNeeds = true;
    });
    cv.addEventListener("pointerleave", () => this.setHover(null));
    cv.addEventListener("click", (e) => {
      if (!this.interactive()) return;
      const r = cv.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      let found: RuntimeNode | null = null;
      let best = 1e9;
      for (const n of this.nodes) {
        const d = Math.hypot(mx - n.sx, my - n.sy);
        if (d < 26 && d < best) {
          best = d;
          found = n;
        }
      }
      this.setHover(found);
    });
  }

  /* ---------------- hover (design sSetHover 2781-2793) ---------------- */

  private setHover(n: RuntimeNode | null): void {
    if (n === this.hover) return;
    this.hover = n;
    if (n) {
      if (!reducedMotion()) this.pulses.push({ w: n.w, pos: n.t, life: 1 });
      let tx = n.sx + 22;
      let ty = n.sy - 118;
      if (tx > this.cW - 292) tx = n.sx - 290;
      ty = clamp(ty, 14, this.cH - 170);
      tx = clamp(tx, 12, this.cW - 292);
      this.tip.style.setProperty("--tip-x", `${tx}px`);
      this.tip.style.setProperty("--tip-y", `${ty}px`);
      this.renderTipContent(n);
      this.tip.classList.add("is-visible");
    } else {
      this.tip.classList.remove("is-visible");
    }
    if (reducedMotion()) this.render();
  }

  /** Fills the tooltip's text/color from the active language — split out of
      `setHover` so a language change can refresh an already-open tooltip
      without tripping `setHover`'s "same node, no-op" guard. */
  private renderTipContent(n: RuntimeNode): void {
    const pillar = this.pillars[n.w]!;
    this.tip.style.setProperty("--tip-color", pillar.meta.color);
    this.tip.style.setProperty("--tip-glow", pillarGlow(pillar.meta.rgb));
    const pillarLabel = this.lang === "en" ? pillar.meta.labelEn : pillar.meta.labelPt;
    this.tipPillarLabel.textContent = (this.lang === "en" ? "PILLAR · " : "PILAR · ") + pillarLabel;
    this.tipLabel.textContent = this.lang === "en" ? n.labelEn : n.labelPt;
    this.tipDesc.textContent = this.lang === "en" ? n.descEn : n.descPt;
  }

  /* ---------------- pillar drag (design sPillarDown 2795-2812) ---------------- */

  private bindPillars(): void {
    for (const p of this.pillars) {
      p.el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        // Portrait pillars sit on a top row and their waves run down the
        // screen, so the fader axis is horizontal there (drag ←/→); landscape
        // keeps the vertical drag.
        const portrait = this.cW < 720;
        const startAxis = portrait ? e.clientX : e.clientY;
        const startOff = p.off;
        document.body.style.cursor = "grabbing";
        const move = (ev: PointerEvent) => {
          const cur = portrait ? ev.clientX : ev.clientY;
          p.off = clamp(startOff + (cur - startAxis), -92, 92);
          p.amp = clamp(1 - p.off / 110, 0.3, 1.85);
          this.cNeeds = true;
          if (reducedMotion()) {
            p.dOff = p.off;
            p.dAmp = p.amp;
            this.render();
          }
        };
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          document.body.style.cursor = "";
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      });
    }
  }

  /* ---------------- overlays (design cUpdateOverlays 2814-2830) ---------------- */

  private updateOverlays(q: number): void {
    const lop = win(q, 0.3, 0.37, 0.6, 0.67);
    if (Math.abs(lop - this.lastLegOp) > 0.004) {
      this.lastLegOp = lop;
      this.legend.style.opacity = lop.toFixed(3);
      this.legend.style.visibility = lop < 0.08 ? "hidden" : "visible";
      this.legend.style.transform = `translateY(${((1 - lop) * 14).toFixed(1)}px)`;
      this.legend.setAttribute("aria-hidden", lop < 0.1 ? "true" : "false");
      this.key.style.opacity = (lop * 0.9).toFixed(3);
    }
    const sop = sm(0.93, 1, q);
    if (Math.abs(sop - this.lastSeedOp) > 0.004) {
      this.lastSeedOp = sop;
      this.seed.style.opacity = sop.toFixed(3);
    }
  }

  /* ---------------- tick (design cTick 2832-2912) ---------------- */

  private tick(dt: number): void {
    if (reducedMotion()) return; // design `_tick` bails out entirely under reduced motion.
    if (!this.ctx) return;

    const diff = this.cTargetQ - this.cQ;
    if (Math.abs(diff) > 0.0004) {
      let step = diff * (1 - Math.exp(-dt * 5));
      const mx = 0.6 * dt;
      if (step > mx) step = mx;
      else if (step < -mx) step = -mx;
      this.cQ += step;
      this.cNeeds = true;
    } else if (this.cQ !== this.cTargetQ) {
      this.cQ = this.cTargetQ;
      this.cNeeds = true;
    }
    const q = this.cQ;

    const kA = 1 - Math.exp(-dt * 8);
    const kH = 1 - Math.exp(-dt * 10);
    const kP = 1 - Math.exp(-dt * 6);
    const portrait = this.cW < 720;
    for (const p of this.pillars) {
      p.dAmp += (p.amp - p.dAmp) * kA;
      p.dOff += (p.off - p.dOff) * kA;
      p.flash *= Math.exp(-dt * 3.2);
      // Portrait: the chip is centred on its wave's column (translateX(-50%),
      // matching the CSS), and the fader drag rides the X axis; landscape keeps
      // the vertical fader. This inline transform replaces the CSS one each
      // frame, so the centring has to live here too or the chips drift right.
      p.el.style.transform = portrait
        ? `translateX(-50%) translateX(${p.dOff.toFixed(1)}px)`
        : `translateY(${p.dOff.toFixed(1)}px)`;
      p.el.style.boxShadow =
        p.flash > 0.02
          ? `0 0 ${(26 * p.flash).toFixed(0)}px rgba(${p.meta.rgb.join(",")},${(0.55 * p.flash).toFixed(2)})`
          : "none";
    }
    const hTarget = this.hover ? 1 : 0;
    this.sHoverK += (hTarget - this.sHoverK) * kH;
    if (this.hover) this.lastHover = this.hover;
    this.par.x += (this.par.tx - this.par.x) * kP;
    this.par.y += (this.par.ty - this.par.y) * kP;
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pl = this.pulses[i]!;
      pl.pos -= dt * 0.52;
      if (pl.pos < 0.1) pl.life = Math.max(0, pl.pos / 0.1);
      if (pl.pos <= 0.02) {
        this.pillars[pl.w]!.flash = 1;
        this.pulses.splice(i, 1);
      }
    }

    // wave birth: fires once the section settles (q > 0.30); rearms if the
    // reader scrolls back above the entry.
    if (q > 0.3) {
      if (this.sGrowStart < 0) {
        this.sGrowStart = this.cClock;
        for (const p of this.pillars) p.flash = Math.max(p.flash, 0.9);
      }
      const el = this.cClock - this.sGrowStart;
      for (let w = 0; w < 3; w++) {
        const t = clamp((el - w * 0.55) / 1.25, 0, 1);
        this.sGrow[w] = eio(t);
      }
      if (this.sGrow[2]! < 1) this.cNeeds = true;
    } else if (q < 0.12 && this.sGrowStart >= 0) {
      this.sGrowStart = -1;
      this.sGrow = [0, 0, 0];
    }

    // page-wide color breath — routed through the shared chamber, never
    // written directly (design `_applyTheme`/`cApplyTheme`, 2586/2656-2674).
    this.cThemeT = sm(0.02, 0.16, q) * (1 - sm(0.68, 0.85, q));
    if (Math.abs(this.cThemeT - this.lastT) > 0.001) {
      this.lastT = this.cThemeT;
      setChamberT("const", this.cThemeT);
    }

    // entrance: rises from below.
    const ty = (1 - sm(0, 0.15, q)) * 42;
    const ro = sm(0, 0.08, q);
    if (Math.abs(ty - this.lastRiseTy) > 0.05 || Math.abs(ro - this.lastRiseOp) > 0.004) {
      this.lastRiseTy = ty;
      this.lastRiseOp = ro;
      this.rise.style.transform = `translateY(${ty.toFixed(2)}vh)`;
      this.rise.style.opacity = ro.toFixed(3);
    }

    this.updateOverlays(q);

    // permanent state: the waves keep breathing on a real clock, not scrub.
    if (q > 0.01 && q < 0.995 && !document.hidden) {
      this.cClock += dt;
      this.sTime += dt;
      this.cNeeds = true;
    }

    if (this.cNeeds) {
      this.render();
      this.cNeeds = false;
    }
  }

  /* ---------------- render (design cRender 2914-3119) ---------------- */

  private render(): void {
    const c = this.ctx;
    if (!c) return;
    const W = this.cW;
    const H = this.cH;
    c.clearRect(0, 0, W, H);
    const red = reducedMotion();
    const q = red ? 0.5 : this.cQ;
    if (!red && (q <= 0.005 || q >= 0.999)) return;
    const mobile = W < 720;
    // Fix G: the source's own reduced branch that sets sGrow to [1,1,1]
    // (design cTick 2872-2873) is unreachable dead code — substitute the
    // intended value locally so the reduced-motion scene is legible.
    const grow: [number, number, number] = red ? [1, 1, 1] : this.sGrow;

    const ent = red ? 1 : sm(0.1, 0.3, q);
    const seedK = red ? 0 : eio(sm(0.66, 0.84, q));
    const seedRise = red ? 0 : sm(0.86, 0.99, q);
    const fadeOut = 1 - sm(0.66, 0.82, q);
    this.sEnt = ent;
    // Landscape collapses the braid up to the rising seed; portrait descends,
    // so it converges DOWN toward the bottom-centre where the walker handoff
    // (Ato 4) lives.
    this.seedPos = {
      x: lerp(W * 0.56, W * 0.5, eio(seedRise)),
      y: W < 720 ? lerp(H * 0.6, H * 0.9, eio(seedRise)) : lerp(H * 0.53, H * 0.12, eio(seedRise)),
      k: seedK,
    };
    const sA = (0.25 + 0.75 * ent) * fadeOut;
    const zMax = H * 0.085;
    const hv = this.lastHover;

    const gp = red ? 1 : sm(0.04, 0.14, q) * (1 - sm(0.85, 0.97, q));
    if (gp > 0.02) {
      c.fillStyle = `rgba(233,230,222,${(0.05 * gp).toFixed(3)})`;
      for (const gd of this.grain) {
        if (gd.a > 0.7) c.fillRect(gd.x * W, gd.y * H, 1.2, 1.2);
        else c.fillRect(gd.x * W, gd.y * H, 1, 1);
      }
    }

    // ripple echo of the hero's act 3 zoom-in.
    if (!red && q > 0.12 && q < 0.34) {
      const rk = (q - 0.12) / 0.22;
      const r = rk * Math.max(W, H) * 0.42;
      c.save();
      c.globalAlpha = (1 - rk) * 0.2;
      c.strokeStyle = "#E9E6DE";
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(W * 0.56, H * 0.53, r, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = (1 - rk) * 0.13;
      c.strokeStyle = "#A3DD42";
      c.beginPath();
      c.arc(W * 0.56, H * 0.53, r * 0.93, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }

    if (sA <= 0.01 && seedK < 0.55) return;

    const NS = 96;
    for (let w = 0; w < 3; w++) {
      const arr: WavePoint[] = new Array(NS);
      for (let i = 0; i < NS; i++) arr[i] = this.sample(w, i / (NS - 1));
      for (let i = 0; i < NS; i++) {
        const a = arr[Math.max(0, i - 1)]!;
        const b = arr[Math.min(NS - 1, i + 1)]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const L = Math.hypot(dx, dy) || 1;
        arr[i]!.nx = -dy / L;
        arr[i]!.ny = dx / L;
      }
      this.wavePts[w] = arr;
    }

    const chunks: { w: number; i0: number; i1: number; z: number }[] = [];
    const step = 8;
    for (let w = 0; w < 3; w++) {
      const maxI = Math.round(grow[w] * (NS - 1));
      for (let i0 = 0; i0 < maxI; i0 += step) {
        const i1 = Math.min(i0 + step, maxI);
        let z = 0;
        for (let i = i0; i <= i1; i++) z += this.wavePts[w]![i]!.z;
        chunks.push({ w, i0, i1, z: z / (i1 - i0 + 1) });
      }
    }
    chunks.sort((a, b) => b.z - a.z);

    const nodeFade = (1 - sm(0.55, 0.92, seedK)) * sA;

    if (nodeFade > 0.005 || seedK < 0.92) {
      for (const ch of chunks) {
        const p = this.pillars[ch.w]!;
        const arr = this.wavePts[ch.w]!;
        const zn = clamp((zMax - ch.z) / (2 * zMax), 0, 1);
        const sAvg = arr[(ch.i0 + ch.i1) >> 1]!.s;
        const boost = hv && hv.w === ch.w ? 1 + 0.55 * this.sHoverK : 1;
        for (let f = -1; f <= 1; f++) {
          const sep = 3.0 * sAvg * (1 - seedK);
          c.beginPath();
          for (let i = ch.i0; i <= ch.i1; i++) {
            const pt = arr[i]!;
            const px = pt.x + pt.nx * f * sep;
            const py = pt.y + pt.ny * f * sep;
            if (i === ch.i0) c.moveTo(px, py);
            else c.lineTo(px, py);
          }
          const a = (0.2 + 0.42 * zn) * (f === 0 ? 1 : 0.45) * boost * sA;
          c.strokeStyle = `rgba(${p.meta.rgb.join(",")},${Math.min(1, a).toFixed(3)})`;
          c.lineWidth = (f === 0 ? 2.0 : 1.0) * sAvg;
          c.stroke();
        }
      }
      c.globalCompositeOperation = "lighter";
      for (const ch of chunks) {
        const p = this.pillars[ch.w]!;
        const arr = this.wavePts[ch.w]!;
        const zn = clamp((zMax - ch.z) / (2 * zMax), 0, 1);
        const sAvg = arr[(ch.i0 + ch.i1) >> 1]!.s;
        const boost = hv && hv.w === ch.w ? 1 + 1.4 * this.sHoverK : 1;
        c.beginPath();
        for (let i = ch.i0; i <= ch.i1; i++) {
          const pt = arr[i]!;
          if (i === ch.i0) c.moveTo(pt.x, pt.y);
          else c.lineTo(pt.x, pt.y);
        }
        c.strokeStyle = `rgba(${p.meta.rgb.join(",")},${(0.045 * (0.5 + 0.5 * zn) * boost * sA).toFixed(3)})`;
        c.lineWidth = 7 * sAvg;
        c.stroke();
      }
      for (let w = 0; w < 3; w++) {
        const gw = grow[w]!;
        if (gw <= 0.005 || gw >= 0.995) continue;
        const p = this.pillars[w]!;
        const pt = this.sample(w, gw);
        const r = 17 * pt.s;
        const g = c.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
        g.addColorStop(0, `rgba(${p.meta.rgb.join(",")},${(0.85 * sA).toFixed(2)})`);
        g.addColorStop(0.35, `rgba(${p.meta.rgb.join(",")},${(0.3 * sA).toFixed(2)})`);
        g.addColorStop(1, `rgba(${p.meta.rgb.join(",")},0)`);
        c.fillStyle = g;
        c.beginPath();
        c.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        c.fill();
      }
      for (const pl of this.pulses) {
        const p = this.pillars[pl.w]!;
        const pt = this.sample(pl.w, Math.max(0.01, pl.pos));
        const r = 15 * pt.s * (0.4 + 0.6 * pl.life);
        const g = c.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
        g.addColorStop(0, `rgba(${p.meta.rgb.join(",")},${(0.7 * pl.life * sA).toFixed(2)})`);
        g.addColorStop(1, `rgba(${p.meta.rgb.join(",")},0)`);
        c.fillStyle = g;
        c.beginPath();
        c.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        c.fill();
        for (let tr = 1; tr <= 3; tr++) {
          const qt = this.sample(pl.w, Math.min(0.99, pl.pos + tr * 0.022));
          c.fillStyle = `rgba(${p.meta.rgb.join(",")},${(0.16 * pl.life * sA / tr).toFixed(3)})`;
          c.beginPath();
          c.arc(qt.x, qt.y, (4.5 * qt.s) / tr, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.globalCompositeOperation = "source-over";
    }

    if (nodeFade > 0.02) {
      c.textAlign = "center";
      c.textBaseline = "alphabetic";
      try {
        c.letterSpacing = "0.08em";
      } catch {
        /* Safari < 17 has no CanvasRenderingContext2D.letterSpacing — cosmetic only. */
      }
      for (const n of this.nodes) {
        const born = sm(n.t, n.t + 0.05, grow[n.w]!);
        if (born <= 0.02) {
          n.sx = -99;
          n.sy = -99;
          continue;
        }
        const p = this.pillars[n.w]!;
        const pt = this.sample(n.w, n.t);
        n.sx = pt.x;
        n.sy = pt.y;
        const isH = this.hover === n;
        const k = isH ? this.sHoverK : 0;
        const r = (9.5 + 4.5 * k) * pt.s * (0.4 + 0.6 * born);
        c.globalAlpha = born;
        if (k > 0.01) {
          c.globalCompositeOperation = "lighter";
          const g = c.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r * 3.4);
          g.addColorStop(0, `rgba(${p.meta.rgb.join(",")},${(0.32 * k * nodeFade).toFixed(2)})`);
          g.addColorStop(1, `rgba(${p.meta.rgb.join(",")},0)`);
          c.fillStyle = g;
          c.beginPath();
          c.arc(pt.x, pt.y, r * 3.4, 0, Math.PI * 2);
          c.fill();
          c.globalCompositeOperation = "source-over";
        }
        c.fillStyle = `rgba(244,242,235,${((0.09 + 0.05 * k) * nodeFade).toFixed(3)})`;
        c.beginPath();
        c.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = `rgba(241,239,233,${((0.34 + 0.42 * k) * nodeFade).toFixed(2)})`;
        c.lineWidth = 1.1;
        c.stroke();
        c.strokeStyle = `rgba(241,239,233,${((0.5 + 0.3 * k) * nodeFade).toFixed(2)})`;
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(pt.x, pt.y, Math.max(0.5, r - 2.5), -2.35, -0.85);
        c.stroke();
        c.fillStyle = `rgba(${p.meta.rgb.join(",")},${((0.8 + 0.2 * k) * nodeFade).toFixed(2)})`;
        c.beginPath();
        c.arc(pt.x, pt.y, r * 0.4, 0, Math.PI * 2);
        c.fill();
        const ang = n.tick - Math.PI / 2 + (isH ? this.sHoverK * 0.35 : 0);
        c.strokeStyle = `rgba(241,239,233,${(0.9 * nodeFade).toFixed(2)})`;
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(pt.x + Math.cos(ang) * r * 0.5, pt.y + Math.sin(ang) * r * 0.5);
        c.lineTo(pt.x + Math.cos(ang) * r * 0.86, pt.y + Math.sin(ang) * r * 0.86);
        c.stroke();
        if (k > 0.01) {
          c.strokeStyle = `rgba(${p.meta.rgb.join(",")},${(0.55 * k * nodeFade).toFixed(2)})`;
          c.lineWidth = 1.3;
          c.beginPath();
          c.arc(pt.x, pt.y, r + 5.5 * k, 0, Math.PI * 2);
          c.stroke();
        }
        // Per-node trait labels are drawn beneath each node. On a narrow canvas
        // the 13 nodes compress horizontally and the labels pile into an
        // illegible smear, so they're desktop-only — the nodes/dials still read
        // as the signature, the eyebrow already says "13 TRAÇOS", and the
        // tooltip surfaces a trait's name on interaction.
        const la = mobile ? 0 : Math.max(0, (ent - 0.5) / 0.5) * nodeFade;
        if (la > 0.02) {
          c.font = `500 ${mobile ? 9 : 10}px ui-monospace, "SF Mono", Menlo, monospace`;
          c.fillStyle = `rgba(241,239,233,${((isH ? 0.95 : 0.48) * la).toFixed(2)})`;
          const label = this.lang === "en" ? n.labelEn : n.labelPt;
          c.fillText(label.toUpperCase(), pt.x, pt.y + r + 16);
        }
        c.globalAlpha = 1;
      }
    }
  }

  /* ---------------- micro-CTA (design renderVals cGoNext 3266-3272) ---------------- */

  private goNext(): void {
    const sy = currentScrollY();
    const y =
      this.section.getBoundingClientRect().top + sy + this.section.offsetHeight - window.innerHeight * 0.6;
    smoothScrollTo(y);
  }

  /* ---------------- i18n ---------------- */

  private syncAriaLabels(): void {
    this.canvas.setAttribute("aria-label", this.lang === "en" ? CANVAS_ARIA_EN : CANVAS_ARIA_PT);
    for (const p of this.pillars) {
      p.el.setAttribute("aria-label", pillarAriaLabel(p.meta.labelPt, this.lang));
    }
  }

  private onLangChange(lang: Lang): void {
    this.lang = lang;
    this.syncAriaLabels();
    if (this.hover) this.renderTipContent(this.hover); // refresh open tooltip in place
    this.render();
  }
}

/* ---------------- helpers ---------------- */

function req<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`voice-synth: missing required element "${selector}"`);
  return el;
}

function currentScrollY(): number {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

/* ---------------- entry point ---------------- */

export function initVoiceMap(): void {
  const section = document.querySelector<HTMLElement>("#constelacao");
  if (!section) return;
  new VoiceSynth(section).mount();
}
