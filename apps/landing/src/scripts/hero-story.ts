// Hero — scroll-story (Ato 1). Ported from the design's DCLogic monolith
// (cultiv-hero-v5.dc.html): constructor world/state/tokens/timeline `T`
// (844–950), cast/seal geometry + Atos 1–4 position math (1087–1391),
// drawHuman/puddle/quotes/logo (1392–1697), render2d/overlays/ambient/
// renderStatic (1698–1987), the intro slice of readScroll + `_tick`
// (1988–2068 shell — this module owns only the intro-progress part, not
// the constellation/founder scroll math those sections compute
// themselves), and the walker (2119–2340). See HERO-SCROLL-SPEC.md for
// the narrative concept + the Fix A–F acceptance criteria this preserves.
//
// Architecture: one small mutable state object (`S`) instead of a class —
// this *is* `this` from the design, just not attached to a component
// instance. Per-frame work registers with the page's single rAF loop via
// `engine.addTick`; there is no independent `requestAnimationFrame` here.
//
// JS-off / reduced-motion doctrine (deviation from the design, a client
// SPA with no no-JS concept): the design's first React render already
// computes `heroCopy` opacity as 0 (only reaching 1 once intro timers
// resolve) and renders the full-screen opening curtain unconditionally.
// Ported literally, a no-JS/crawler reader would see nothing (or a stuck
// curtain) forever. So `hero.css` flips the *resting* state: hero copy /
// scroll hint default to visible (`opacity:1` in the stylesheet), and the
// opening curtain defaults to `display:none` — only this module ever
// shows the curtain, and only when `prefers-reduced-motion: no-preference`.
// Reduced-motion's *static scene* requirement is satisfied without any JS
// branch at all: `renderStatic()` still runs (so the canvas isn't blank),
// but the copy/hint/act-overlay visibility is handled declaratively by
// `hero.css` media queries, which react to a live OS toggle for free.

import {
  addTick,
  addScroll,
  addResize,
  start,
  smoothScrollTo,
  reducedMotion,
  onReducedChange,
  clamp,
  lerp,
  sm,
  win,
  eio,
  eob,
  arrive,
  hexToRgb,
  mix,
  rgb,
  dark,
  mulberry,
  angLerp,
} from "./engine";

type RGB = readonly [number, number, number];

/* ---------------- tokens (design 899–913, 916–928) ---------------- */

const GRAPHITE: RGB = [52, 50, 46];
const GRAY: RGB = [165, 160, 153];
const LOGO_INK: RGB = [21, 21, 21]; // #151515 — SVG oficial
const LOGO_GREEN: RGB = [149, 203, 62]; // #95CB3E — SVG oficial
const GREEN_HEX = "#95CB3E";
const INK_HEX = "#151515";

// paleta terrosa das vozes (roupas)
const PALETTE: RGB[] = [
  "#C0653B",
  "#B8892F",
  "#3E7C6F",
  "#6C5B92",
  "#7A8A3A",
  "#3F6E9E",
  "#B65D6E",
  "#8A6A4F",
].map(hexToRgb);
const SKINS: RGB[] = ["#EBC8A4", "#DBA87E", "#BA8058", "#8F5C3C", "#6E4832", "#F1D9BC"].map(hexToRgb);
const HAIRS: RGB[] = ["#26201A", "#40301F", "#5D462D", "#1A1B1D", "#7C7568", "#A99A80"].map(hexToRgb);
const HAIR_STYLES = ["crop", "bun", "bob", "curly", "buzz", "long"] as const;
const TOP_TYPES = ["coat", "jacket", "tee", "hoodie", "dress", "blazer"] as const;
const BOTTOMS: RGB[] = ["#4A463F", "#6B675F", "#3A3733", "#7A7264", "#57524B", "#8A8274"].map(hexToRgb);
const ACCESSORIES = ["none", "backpack", "coffee", "headphones", "book", "bag", "none", "none"] as const;
const QUOTE_D =
  "M62 38c0-9.5-7-16-15.5-16C38 22 32 28.2 32 36.2c0 7.9 6 13.8 14 13.8 1.1 0 2.2-.1 3.2-.4C48 60 42.2 65.6 34.6 68.2l3.4 6.8C50.6 70.6 62 59.6 62 43.6Z";

// ângulos do arco da marca (M54.4 11.6 → A37 → 78.3 26.8, centro 48,48)
const A0 = -1.3968;
const A1 = -0.6107;

const T = {
  copyOutA: 0.1,
  copyOutB: 0.16,
  copyInA: 0.95,
  copyInB: 0.99,
  captureStart: 0.17,
  captureSpread: 0.13,
  captureBlend: 0.055,
  rippleStart: 0.42,
  rippleSpread: 0.09,
  meltDur: 0.05,
  traceStart: 0.72,
  resolveStart: 0.895,
  resolveEnd: 0.935,
  settleStart: 0.945,
  settleEnd: 0.98,
};
const DUR = 80;

/* ---------------- shapes ---------------- */

interface Appearance {
  skin: RGB;
  hair: RGB;
  hairStyle: (typeof HAIR_STYLES)[number];
  topType: (typeof TOP_TYPES)[number];
  bottom: RGB;
  lean: number;
}

type PathKind = "circle" | "arc" | "quote";
interface PersonPath {
  kind: PathKind;
  u0: number;
  span: number;
  q?: number;
  lane?: number;
}

interface Person {
  i: number;
  color: RGB;
  app: Appearance;
  size: number;
  acc: (typeof ACCESSORIES)[number];
  x0: number;
  y0: number;
  ang: number;
  speed: number;
  wAmp: number;
  wFreq: number;
  wPhase: number;
  gaitRate: number;
  gaitPhase: number;
  cT: number;
  wanderR: number;
  wanderF: number;
  wanderP: number;
  travelJit: number;
  lookDir: number;
  rT: number;
  path: PersonPath;
  mT: number;
  finalCol: RGB;
  ink: RGB;
  _mp: [number, number, number] | null;
}

interface PersonState {
  x: number;
  y: number;
  facing: number;
  th: number;
  amp: number;
  size: number;
  grayK: number;
  alpha: number;
  look: number;
  accA: number;
  melt: number;
}

interface DrawHumanOpts {
  x: number;
  y: number;
  size: number;
  facing: number;
  th: number;
  amp: number;
  alpha: number;
  look: number;
  acc: string;
  accA: number;
  grayK: number;
  melt: number;
  app: Appearance;
  top: RGB;
  ink: RGB;
}

interface AmbientPerson {
  dir: number;
  color: RGB;
  app: Appearance;
  ink: RGB;
  size: number;
  speed: number;
  acc: (typeof ACCESSORIES)[number];
  x: number;
  th: number;
  draw: DrawHumanOpts | null;
}

interface LogoState {
  cx: number;
  cy: number;
  R: number;
  lw: number;
  Rs: number;
  settleY: number;
}
interface ZoneState {
  cx: number;
  cy: number;
  hw: number;
  hh: number;
}
interface GridState {
  slots: Array<[number, number]>;
  maxDist: number;
  cx: number;
  cy: number;
}

interface WalkerIdentity {
  app: Appearance;
  color: RGB;
  ink: RGB;
  acc: string;
}
interface WalkerDrawOpts {
  x: number;
  y: number;
  size: number;
  heading: number;
  th: number;
  amp: number;
  alpha: number;
  app: Appearance;
  top: RGB;
  ink: RGB;
}

type Phase = "draw" | "reveal" | "done";
type WalkPhase = "follow" | "auto" | "gone";

/* ---------------- state ---------------- */

const S = {
  reduced: false,
  phase: "done" as Phase,
  scrolled: false,
  introTf: "translate(-40vw, -46vh) scale(0.14)",

  W: 0,
  H: 0,
  DPR: 1,
  ctx: null as CanvasRenderingContext2D | null,
  persons: [] as Person[],
  grid: { slots: [], maxDist: 1, cx: 0, cy: 0 } as GridState,
  logo: { cx: 0, cy: 0, R: 100, lw: 12, Rs: 40, settleY: 0 } as LogoState,
  zone: { cx: 0, cy: 0, hw: 0, hh: 0 } as ZoneState,
  targetP: 0,
  dispP: 0,
  needsRender: true,
  introFade: 0,
  ambient: [] as AmbientPerson[],
  lastSpawn: 0,
  nextGap: 6000,
  _lastHeroOp: -1,
  _lastA2: -1,
  _lastA3: -1,
  _lastHint: -1,
  timers: [] as number[],
  quotePath: null as Path2D | null,

  // walker (design 2119–2340)
  walkDpr: 1,
  walker: null as WalkerIdentity | null,
  walkPhase: "follow" as WalkPhase,
  walkTh: 0.7,
  walkAutoT: 0,
  walkAlpha: 0,
  walkFacing: 1,
  walkLastSy: null as number | null,
  walkPrevX: null as number | null,
  walkPrevY: null as number | null,
  walkHeading: null as number | null,
  followHeading: null as number | null,
};

interface HeroDom {
  intro: HTMLElement;
  sticky: HTMLElement;
  canvas: HTMLCanvasElement;
  heroCopy: HTMLElement;
  h1: HTMLElement;
  sub: HTMLElement;
  ctaWrap: HTMLElement;
  support: HTMLElement;
  ctaPrimary: HTMLButtonElement;
  act2: HTMLElement;
  act3: HTMLElement;
  hint: HTMLElement;
  walkerCanvas: HTMLCanvasElement;
  curtain: HTMLElement;
  curtainBg: HTMLElement;
  curtainLogo: HTMLElement;
}

let dom: HeroDom | null = null;

/* ---------------- utilidades locais (não cobertas por engine.ts) ---------------- */

function makeAppearance(rand: () => number): Appearance {
  return {
    skin: SKINS[(rand() * SKINS.length) | 0] ?? SKINS[0],
    hair: HAIRS[(rand() * HAIRS.length) | 0] ?? HAIRS[0],
    hairStyle: HAIR_STYLES[(rand() * HAIR_STYLES.length) | 0] ?? HAIR_STYLES[0],
    topType: TOP_TYPES[(rand() * TOP_TYPES.length) | 0] ?? TOP_TYPES[0],
    bottom: BOTTOMS[(rand() * BOTTOMS.length) | 0] ?? BOTTOMS[0],
    lean: (rand() - 0.5) * 0.1,
  };
}

function buildCast(): void {
  const rand = mulberry(20260714);
  const isMobile = S.W < 720;
  const N = isMobile ? 20 : 30;
  const persons: Person[] = [];
  for (let i = 0; i < N; i++) {
    const color = PALETTE[i % PALETTE.length] ?? PALETTE[0];
    const band = rand() < 0.5;
    persons.push({
      i,
      color,
      app: makeAppearance(rand),
      size: lerp(0.85, 1.18, rand()),
      acc: ACCESSORIES[(rand() * ACCESSORIES.length) | 0] ?? "none",
      x0: rand(),
      y0: band ? lerp(0.07, 0.32, rand()) : lerp(0.7, 0.93, rand()),
      ang: rand() * Math.PI * 2,
      speed: lerp(0.022, 0.042, rand()),
      wAmp: lerp(26, 64, rand()),
      wFreq: lerp(0.22, 0.48, rand()),
      wPhase: rand() * Math.PI * 2,
      gaitRate: lerp(5.2, 7.2, rand()),
      gaitPhase: rand() * Math.PI * 2,
      cT: T.captureStart + rand() * T.captureSpread,
      wanderR: lerp(9, 18, rand()),
      wanderF: lerp(1.6, 2.6, rand()),
      wanderP: rand() * Math.PI * 2,
      travelJit: (rand() - 0.5) * 0.03,
      lookDir: rand() > 0.5 ? 1 : -1,
      // filled in by layoutGrid/assignPaths below
      rT: 0,
      path: { kind: "circle", u0: 0, span: 0 },
      mT: 0,
      finalCol: LOGO_INK,
      ink: dark(color, 0.1),
      _mp: null,
    });
  }
  S.persons = persons;
  layoutGrid();
  assignPaths(rand);
}

function layoutGrid(): void {
  const N = S.persons.length;
  const W = S.W;
  const H = S.H;
  const g = S.grid;
  const cols = W < 720 ? 4 : 6;
  const rows = Math.ceil(N / cols);
  const sx = Math.min(W * 0.115, 96);
  const sy = Math.min(H * 0.105, 80);
  g.cx = W / 2;
  g.cy = H / 2;
  g.slots = [];
  let maxD = 1;
  for (let i = 0; i < N; i++) {
    const r = (i / cols) | 0;
    const c = i % cols;
    const rowCount = r === rows - 1 ? N - r * cols : cols;
    const x = g.cx + (c - (rowCount - 1) / 2) * sx;
    const y = g.cy + (r - (rows - 1) / 2) * sy;
    g.slots.push([x, y]);
    maxD = Math.max(maxD, Math.hypot(x - g.cx, y - g.cy));
  }
  g.maxDist = maxD;
  for (const p of S.persons) {
    const slot = g.slots[p.i];
    if (!slot) continue;
    p.rT = T.rippleStart + (Math.hypot(slot[0] - g.cx, slot[1] - g.cy) / maxD) * T.rippleSpread;
  }
}

// cada figura pertence a UM trecho do selo; a dissolução acontece na
// ordem de pintura (anel → arco → aspas), um a um
function assignPaths(rand: () => number): void {
  const isMobile = S.W < 720;
  const nCircle = isMobile ? 9 : 14;
  const nArc = isMobile ? 3 : 4;
  let ci = 0;
  let ai = 0;
  let qi = 0;
  for (const p of S.persons) {
    if (ci < nCircle) {
      p.path = { kind: "circle", u0: ci / nCircle + rand() * 0.02, span: (1 / nCircle) * 1.4 };
      p.mT = 0.585 + (ci / nCircle) * 0.05 + rand() * 0.008;
      ci++;
    } else if (ai < nArc) {
      p.path = { kind: "arc", u0: ai / nArc, span: (1 / nArc) * 1.35 };
      p.mT = 0.63 + (ai / nArc) * 0.03 + rand() * 0.008;
      ai++;
    } else {
      const u0 = rand() * 0.22;
      p.path = { kind: "quote", u0, span: 1 - u0, q: qi % 2, lane: (((qi / 2) | 0) % 3) - 1 };
      p.mT = 0.65 + rand() * 0.05;
      qi++;
    }
    p.finalCol = p.path.kind === "arc" ? LOGO_GREEN : LOGO_INK;
    p.ink = dark(p.color, 0.1); // pigmento: a própria paleta da pessoa
    p._mp = null;
  }
}

/* ---------------- geometria do selo (SVG oficial) ---------------- */

function circlePoint(u: number): [number, number, number] {
  const a = u * Math.PI * 2 - Math.PI / 2;
  return [S.logo.cx + Math.cos(a) * S.logo.R, S.logo.cy + Math.sin(a) * S.logo.R, a + Math.PI / 2];
}
function arcPoint(u: number): [number, number, number] {
  const a = lerp(A0, A1, u);
  return [S.logo.cx + Math.cos(a) * S.logo.R, S.logo.cy + Math.sin(a) * S.logo.R, a + Math.PI / 2];
}
function quoteLine(u: number, lane: number, q: number): [number, number, number] {
  const L = S.logo;
  const qc = q === 0 ? L.cx - L.R * 0.32 : L.cx + L.R * 0.32;
  const y = L.cy - L.R * 0.02 + lane * L.R * 0.14;
  const x = lerp(qc - L.R * 0.26, qc + L.R * 0.26, u);
  return [x, y, 0];
}
function pathPoint(pr: Person, u: number): [number, number, number] {
  const k = pr.path.kind;
  if (k === "circle") return circlePoint(u % 1);
  if (k === "arc") return arcPoint(clamp(u, 0, 1));
  return quoteLine(clamp(u, 0, 1), pr.path.lane ?? 0, pr.path.q ?? 0);
}
// deriva com propósito (pós-restauração): a figura caminha devagar na
// direção do seu ponto do selo — e vai parar ali para se dissolver
function driftPos(pr: Person, p: number): [number, number, number] {
  const slot = S.grid.slots[pr.i] ?? [0, 0];
  const tgt = pathPoint(pr, pr.path.u0);
  const t0 = pr.rT + 0.06;
  // caminha até (quase) o seu ponto do selo — derrete já posicionado
  const kd = sm(t0, Math.max(t0 + 0.02, pr.mT - 0.004), p) * 0.94;
  const dxv = tgt[0] - slot[0];
  const dyv = tgt[1] - slot[1];
  const dlen = Math.max(1, Math.hypot(dxv, dyv));
  const sway = Math.sin(p * DUR * pr.wanderF + pr.wanderP) * 4;
  return [
    slot[0] + dxv * kd + (-dyv / dlen) * sway,
    slot[1] + dyv * kd + (dxv / dlen) * sway,
    dxv >= 0 ? 1 : -1,
  ];
}
function meltPos(pr: Person): [number, number, number] {
  if (!pr._mp) pr._mp = driftPos(pr, pr.mT);
  return pr._mp;
}
// ordem de pintura (spec): 1 anel externo · 2 acento verde · 3 aspas
function traceWin(pr: Person): [number, number] {
  const j = pr.travelJit * 0.35;
  if (pr.path.kind === "circle") return [0.735 + j, 0.802 + j];
  if (pr.path.kind === "arc") return [0.803 + j, 0.852 + j];
  return [0.848 + j, 0.892];
}
function traceK(pr: Person, p: number): number {
  const w = traceWin(pr);
  return sm(w[0], w[1], p);
}

/* ---------------- posições (funções puras de p) ---------------- */

function organicPos(pr: Person, p: number): [number, number, number] {
  const t = p * DUR;
  const W = S.W;
  const H = S.H;
  const bx = pr.x0 * W;
  const by = pr.y0 * H;
  const dx = Math.cos(pr.ang);
  const dy = Math.sin(pr.ang);
  const px = -dy;
  const py = dx;
  const w = Math.sin(t * pr.wFreq + pr.wPhase) * pr.wAmp;
  let x = bx + dx * pr.speed * W * t + px * w;
  let y = by + dy * pr.speed * W * t * 0.55 + py * w;
  const dwdt = Math.cos(t * pr.wFreq + pr.wPhase) * pr.wAmp * pr.wFreq;
  const vx = dx * pr.speed * W + px * dwdt;
  const mX = 60;
  const mY = 40;
  const spanX = W + mX * 2;
  const spanY = H + mY * 2;
  x = ((((x + mX) % spanX) + spanX) % spanX) - mX;
  y = ((((y + mY) % spanY) + spanY) % spanY) - mY;
  return [x, y, vx >= 0 ? 1 : -1];
}

function globalGait(p: number): number {
  return p * DUR * 6.4;
}

function personState(pr: Person, p: number): PersonState {
  const slot = S.grid.slots[pr.i] ?? [0, 0];
  const t = p * DUR;
  const st: PersonState = {
    x: 0,
    y: 0,
    facing: 1,
    th: t * pr.gaitRate + pr.gaitPhase,
    amp: 1,
    size: pr.size,
    grayK: 0,
    alpha: 1,
    look: 0,
    accA: 1,
    melt: 0,
  };

  // ---- Ato 4: dissolução em tinta (a figura PARA e derrete no lugar) ----
  if (p >= pr.mT) {
    const mp = meltPos(pr);
    st.x = mp[0];
    st.y = mp[1];
    st.facing = mp[2];
    st.th = pr.mT * DUR * pr.gaitRate + pr.gaitPhase;
    st.amp = 0;
    st.melt = sm(pr.mT, pr.mT + T.meltDur, p);
    st.alpha = 1 - sm(0.85, 1, st.melt);
    return st;
  }

  // ---- Ato 3: ripple de restauração ----
  if (p >= pr.rT) {
    const dt = p - pr.rT;
    const STOP = 0.014;
    const LOOK = 0.026;
    const POP = 0.02;
    st.x = slot[0];
    st.y = slot[1];
    st.facing = 1;
    if (dt < STOP) {
      const k = dt / STOP;
      st.amp = 1 - k;
      st.th = globalGait(pr.rT);
      st.grayK = 1;
      st.size = 1;
      st.accA = 0;
    } else if (dt < STOP + LOOK) {
      const k = (dt - STOP) / LOOK;
      st.amp = 0;
      st.th = globalGait(pr.rT);
      st.look = Math.sin(k * Math.PI * 2) * pr.lookDir;
      st.grayK = 1 - sm(0.55, 1, k) * 0.35;
      st.size = 1;
      st.accA = 0;
    } else if (dt < STOP + LOOK + POP) {
      const k = (dt - STOP - LOOK) / POP;
      const e = eob(k);
      st.amp = 0;
      st.grayK = 1 - e;
      st.size = lerp(1, pr.size, e) * (1 + 0.1 * Math.sin(k * Math.PI));
      st.accA = k;
    } else {
      // segue devagar rumo ao seu ponto do selo; aquieta antes de derreter
      const w = driftPos(pr, p);
      st.x = w[0];
      st.y = w[1];
      st.facing = w[2];
      st.amp = 0.7 * (1 - 0.85 * sm(pr.mT - 0.05, pr.mT - 0.006, p));
    }
    return st;
  }

  // ---- Ato 2: captura escalonada ----
  if (p >= pr.cT) {
    const k = eio(sm(pr.cT, pr.cT + T.captureBlend, p));
    const o = organicPos(pr, p);
    st.x = lerp(o[0], slot[0], k);
    st.y = lerp(o[1], slot[1], k);
    st.facing = k > 0.5 ? 1 : o[2];
    st.grayK = k;
    st.size = lerp(pr.size, 1, k);
    st.accA = 1 - k;
    st.th = lerp(t * pr.gaitRate + pr.gaitPhase, globalGait(p), k);
    return st;
  }

  // ---- Ato 1: caminhada orgânica ----
  const o = organicPos(pr, p);
  st.x = o[0];
  st.y = o[1];
  st.facing = o[2];
  return st;
}

/* ---------------- figura humana editorial (design 1392–1616) ---------------- */

function drawHuman(c: CanvasRenderingContext2D, o: DrawHumanOpts): void {
  if (o.alpha <= 0.004) return;
  const baseH = (S.W < 720 ? 30 : 37) * o.size;
  const u = baseH / 44;
  const melt = o.melt || 0;
  const inkMix = sm(0.02, 0.45, melt);
  const gk = o.grayK || 0;
  const mx = (col: RGB): RGB => {
    let cc = col;
    if (gk > 0) cc = mix(cc, GRAY, gk);
    if (inkMix > 0) cc = mix(cc, o.ink, inkMix);
    return cc;
  };
  const top = mx(o.top);
  const topD = dark(top, 0.2);
  const bot = mx(o.app.bottom);
  const botD = dark(bot, 0.22);
  const skin = mx(o.app.skin);
  const skinD = dark(skin, 0.12);
  const hairC = mx(o.app.hair);
  const shoe = mx([48, 44, 40]);

  c.save();
  c.translate(o.x, o.y);
  // derretimento: o corpo cede e escorre para o chão (nada por cima dele)
  const collapse = eio(sm(0.28, 1, melt));
  c.rotate(o.app.lean * 0.6 * (1 - collapse));
  c.scale(o.facing * (1 + 0.85 * collapse), Math.max(0.04, 1 - 0.94 * collapse));
  c.globalAlpha = o.alpha;
  c.lineCap = "round";
  c.lineJoin = "round";

  const amp = o.amp * (1 - sm(0, 0.3, melt));
  const th = o.th;
  const bob = Math.sin(th * 2) * 1.2 * amp * u;
  const sag = sm(0.05, 0.55, melt) * 5 * u;
  const hipY = -20 * u + bob + sag * 0.45;
  const shY = -31.5 * u + bob + sag;
  const swing = Math.sin(th) * 0.52 * amp;

  // mochila (atrás do torso)
  if (o.accA > 0.02 && o.acc === "backpack") {
    c.globalAlpha = o.alpha * o.accA;
    c.fillStyle = rgb(mx([94, 76, 56]));
    c.beginPath();
    if (c.roundRect) c.roundRect(-4.4 * u - 3.2 * u, shY + 1.6 * u, 3.4 * u, 8.6 * u, 1.4 * u);
    else c.rect(-4.4 * u - 3.2 * u, shY + 1.6 * u, 3.4 * u, 8.6 * u);
    c.fill();
    c.globalAlpha = o.alpha;
  }

  // pernas + sapatos (traseira mais escura = volume)
  for (const s of [-1, 1]) {
    const sw = swing * s;
    const lift = Math.max(0, Math.cos(th) * s) * 2.6 * u * amp;
    const fx = Math.sin(sw) * 10.5 * u;
    const fy = -lift;
    c.strokeStyle = rgb(s === -1 ? botD : bot);
    c.lineWidth = 3.6 * u;
    c.beginPath();
    c.moveTo(0, hipY);
    c.quadraticCurveTo(fx * 0.4 + lift * 0.5, (hipY + fy) * 0.5 + 1.6 * u, fx, fy - 1.6 * u);
    c.stroke();
    c.strokeStyle = rgb(s === -1 ? dark(shoe, 0.2) : shoe);
    c.lineWidth = 2.2 * u;
    c.beginPath();
    c.moveTo(fx - 0.4 * u, fy - 1.2 * u);
    c.lineTo(fx + 2.6 * u, fy - 1.2 * u);
    c.stroke();
  }

  // braços: manga + antebraço em pele; devolve a mão da frente
  let handX = 0;
  let handY = shY + 10 * u;
  const arm = (s: number): void => {
    const swA = -swing * s * 0.85;
    const ex = Math.sin(swA) * 7.5 * u;
    const ey = shY + Math.cos(swA * 0.6) * 10.5 * u;
    c.strokeStyle = rgb(s === -1 ? topD : top);
    c.lineWidth = 2.9 * u;
    c.beginPath();
    c.moveTo(0, shY + 1.2 * u);
    c.quadraticCurveTo(ex * 0.35, shY + 5.5 * u, ex * 0.75, shY + (ey - shY) * 0.68);
    c.stroke();
    c.strokeStyle = rgb(s === -1 ? skinD : skin);
    c.lineWidth = 2.0 * u;
    c.beginPath();
    c.moveTo(ex * 0.75, shY + (ey - shY) * 0.68);
    c.lineTo(ex, ey);
    c.stroke();
    if (s === 1) {
      handX = ex;
      handY = ey;
    }
  };
  arm(-1);

  // torso: silhueta muda com a peça (casaco/vestido alongam e alargam)
  const HEM: Record<string, number> = { coat: -10.5, dress: -11.5, blazer: -16, jacket: -16.5, hoodie: -17, tee: -17.5 };
  const hem = (HEM[o.app.topType] ?? -16.5) * u + bob * 0.4 + sag * 0.3;
  const flared = o.app.topType === "coat" || o.app.topType === "dress";
  const shW = 4.4 * u;
  const hemW = flared ? shW * 1.35 : shW * 0.88;
  c.fillStyle = rgb(top);
  c.beginPath();
  c.moveTo(-shW, shY + 0.4 * u);
  c.quadraticCurveTo(-shW - 0.5 * u, (shY + hem) / 2, -hemW, hem);
  c.lineTo(hemW, hem);
  c.quadraticCurveTo(shW + 0.5 * u, (shY + hem) / 2, shW, shY + 0.4 * u);
  c.quadraticCurveTo(0, shY - 2.6 * u, -shW, shY + 0.4 * u);
  c.closePath();
  c.fill();
  // sombra lateral sutil — luz suave vinda da frente
  c.fillStyle = "rgba(20,16,10,0.10)";
  c.beginPath();
  c.moveTo(-shW, shY + 0.4 * u);
  c.quadraticCurveTo(-shW - 0.5 * u, (shY + hem) / 2, -hemW, hem);
  c.lineTo(-hemW * 0.28, hem);
  c.quadraticCurveTo(-shW * 0.32, (shY + hem) / 2, -shW * 0.3, shY - 1 * u);
  c.closePath();
  c.fill();

  // capuz atrás da cabeça
  if (o.app.topType === "hoodie") {
    c.fillStyle = rgb(topD);
    c.beginPath();
    c.arc(-1.6 * u, shY - 4.6 * u, 3.4 * u, 0, Math.PI * 2);
    c.fill();
  }

  arm(1);

  // pescoço + cabeça
  const headX = 0.8 * u + (o.look || 0) * 2.2 * u;
  const headY = shY - 6.6 * u + sag * 0.5;
  c.strokeStyle = rgb(skin);
  c.lineWidth = 1.9 * u;
  c.beginPath();
  c.moveTo(0, shY + 0.6 * u);
  c.lineTo(headX * 0.5, headY + 3.1 * u);
  c.stroke();
  c.fillStyle = rgb(skin);
  c.beginPath();
  c.arc(headX, headY, 3.4 * u, 0, Math.PI * 2);
  c.fill();

  // cabelo — silhuetas distintas, zero detalhe facial
  c.fillStyle = rgb(hairC);
  const hr = 3.4 * u;
  switch (o.app.hairStyle) {
    case "crop":
      c.beginPath();
      c.arc(headX - 0.2 * u, headY - 0.5 * u, hr * 1.02, Math.PI * 0.95, Math.PI * 2.02);
      c.fill();
      break;
    case "buzz":
      c.beginPath();
      c.arc(headX - 0.1 * u, headY - 0.9 * u, hr * 0.92, Math.PI, Math.PI * 2);
      c.fill();
      break;
    case "bun":
      c.beginPath();
      c.arc(headX - 0.2 * u, headY - 0.5 * u, hr * 1.02, Math.PI * 0.9, Math.PI * 2.05);
      c.fill();
      c.beginPath();
      c.arc(headX - hr * 1.15, headY - hr * 0.75, 1.5 * u, 0, Math.PI * 2);
      c.fill();
      break;
    case "bob":
      c.beginPath();
      c.arc(headX - 0.2 * u, headY + 0.2 * u, hr * 1.18, Math.PI * 0.62, Math.PI * 2.1);
      c.closePath();
      c.fill();
      break;
    case "curly":
      for (const q3 of [
        [-1.8, -1.6, 1.7],
        [0.2, -2.6, 1.9],
        [2.0, -1.4, 1.6],
      ]) {
        c.beginPath();
        c.arc(headX + (q3[0] ?? 0) * u, headY + (q3[1] ?? 0) * u, (q3[2] ?? 0) * u, 0, Math.PI * 2);
        c.fill();
      }
      break;
    case "long":
      c.beginPath();
      c.arc(headX - 0.2 * u, headY - 0.4 * u, hr * 1.06, Math.PI * 0.85, Math.PI * 2.1);
      c.fill();
      c.beginPath();
      if (c.roundRect) c.roundRect(headX - hr * 1.5, headY - 0.8 * u, 1.9 * u, 8 * u, 1 * u);
      else c.rect(headX - hr * 1.5, headY - 0.8 * u, 1.9 * u, 8 * u);
      c.fill();
      break;
  }

  // acessórios ancorados (mão / cabeça / ombro)
  if (o.accA > 0.02 && o.acc !== "none" && o.acc !== "backpack") {
    c.globalAlpha = o.alpha * o.accA;
    switch (o.acc) {
      case "coffee": {
        c.fillStyle = rgb(mx([120, 96, 70]));
        c.beginPath();
        if (c.roundRect) c.roundRect(handX - 1.4 * u, handY - 1.7 * u, 3 * u, 3.6 * u, 0.8 * u);
        else c.rect(handX - 1.4 * u, handY - 1.7 * u, 3 * u, 3.6 * u);
        c.fill();
        break;
      }
      case "headphones": {
        c.strokeStyle = rgb(mx([40, 38, 35]));
        c.fillStyle = rgb(mx([40, 38, 35]));
        c.lineWidth = 1.4 * u;
        c.beginPath();
        c.arc(headX, headY, 4.4 * u, Math.PI * 1.06, Math.PI * 1.94);
        c.stroke();
        c.beginPath();
        c.arc(headX - 4.1 * u, headY + 0.7 * u, 1.35 * u, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(headX + 4.1 * u, headY + 0.7 * u, 1.35 * u, 0, Math.PI * 2);
        c.fill();
        break;
      }
      case "book": {
        c.fillStyle = rgb(mx([158, 128, 92]));
        c.beginPath();
        if (c.roundRect) c.roundRect(handX - 1.2 * u, handY - 1.6 * u, 5 * u, 3.4 * u, 0.7 * u);
        else c.rect(handX - 1.2 * u, handY - 1.6 * u, 5 * u, 3.4 * u);
        c.fill();
        break;
      }
      case "bag": {
        const leather = mx([110, 84, 58]);
        c.strokeStyle = rgb(leather);
        c.fillStyle = rgb(leather);
        c.lineWidth = 1.1 * u;
        c.beginPath();
        c.moveTo(0.6 * u, shY);
        c.quadraticCurveTo(4.6 * u, shY + 5 * u, 4.8 * u, shY + 11 * u);
        c.stroke();
        c.beginPath();
        if (c.roundRect) c.roundRect(2.8 * u, shY + 11 * u, 4.2 * u, 4.4 * u, 1.2 * u);
        else c.rect(2.8 * u, shY + 11 * u, 4.2 * u, 4.4 * u);
        c.fill();
        break;
      }
    }
  }
  c.restore();
}

/* ---------------- poça de tinta (borda orgânica, molhada) ---------------- */

function drawPuddle(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  col: RGB,
  alpha: number,
  ph: number,
  stretch: number,
  ang: number,
  wet: number
): void {
  if (alpha <= 0.01 || r <= 0.4) return;
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = rgb(col);
  c.translate(x, y);
  c.rotate(ang || 0);
  c.scale(1 + (stretch || 0), 1);
  c.beginPath();
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + (wet ?? 1) * (0.14 * Math.sin(3 * a + ph) + 0.08 * Math.sin(5 * a + ph * 1.7)));
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr * 0.34;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
  c.restore();
}

/* ---------------- selo (geometria EXATA do SVG oficial) ---------------- */

function drawQuotes(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  qkL: number,
  qkR?: number,
  colL?: string,
  colR?: string
): void {
  const kR = qkR === undefined ? qkL : qkR;
  if (qkL <= 0 && kR <= 0) return;
  const s = R / 37;
  const P = S.quotePath || (S.quotePath = new Path2D(QUOTE_D));
  const glyphs = [
    { tx: 26.5, k: qkL, x0: cx - R * 0.6, col: colL || INK_HEX },
    { tx: 51, k: kR, x0: cx + R * 0.05, col: colR || colL || INK_HEX },
  ];
  for (const g of glyphs) {
    if (g.k <= 0) continue;
    c.save();
    c.fillStyle = g.col;
    if (g.k < 1) {
      c.beginPath();
      c.rect(g.x0, cy - R * 0.52, R * 0.56 * g.k, R * 1.06);
      c.clip();
    }
    c.translate(cx, cy);
    c.scale(s, s);
    c.translate(-48, -48);
    c.translate(g.tx, 31.6);
    c.scale(0.62, 0.62);
    c.translate(-32, -22);
    c.fill(P);
    c.restore();
  }
}

interface LogoOpts {
  circleK?: number;
  arcK?: number;
  quoteK?: number;
}
function drawLogo(c: CanvasRenderingContext2D, cx: number, cy: number, R: number, alpha: number, opts: LogoOpts): void {
  if (alpha <= 0) return;
  const lw = R * (5 / 37);
  c.save();
  c.globalAlpha = alpha;
  c.lineCap = "round";
  const ck = opts.circleK ?? 1;
  if (ck > 0) {
    c.strokeStyle = INK_HEX;
    c.lineWidth = lw;
    c.beginPath();
    c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ck);
    c.stroke();
  }
  const ak = opts.arcK ?? 1;
  if (ak > 0) {
    c.strokeStyle = GREEN_HEX;
    c.lineWidth = lw;
    c.beginPath();
    c.arc(cx, cy, R, A0, lerp(A0, A1, ak));
    c.stroke();
  }
  drawQuotes(c, cx, cy, R, opts.quoteK ?? 1);
  c.restore();
}

/* ---------------- render principal (design 1698–1844) ---------------- */

function render2d(p: number): void {
  const c = S.ctx;
  const L = S.logo;
  if (!c) return;
  c.clearRect(0, 0, S.W, S.H);
  const f = S.introFade;
  const vis = copyVis(p);

  // a câmera continua subindo, devagar, durante a dissolução
  const rise = S.H * 0.028 * win(p, 0.56, 0.64, 0.67, 0.78);

  c.save();
  c.translate(0, rise);

  // poças de pigmento — multiply: ao se tocarem, as tintas se misturam
  if (p > 0.57 && p < T.resolveEnd) {
    c.save();
    c.globalCompositeOperation = "multiply";
    for (const pr of S.persons) {
      const melt = p >= pr.mT ? sm(pr.mT, pr.mT + T.meltDur, p) : 0;
      if (melt <= 0.03) continue;
      const mp = meltPos(pr);
      const w0 = traceWin(pr)[0];
      const flowT0 = pr.mT + T.meltDur;
      const fk = arrive(clamp((p - flowT0) / Math.max(0.02, w0 - 0.004 - flowT0), 0, 1));
      const entry = pathPoint(pr, pr.path.u0);
      const x = lerp(mp[0], entry[0], fk);
      const y = lerp(mp[1], entry[1], fk);
      const tk = traceK(pr, p);
      const drain = 1 - sm(0.05, 0.8, tk);
      if (drain <= 0.02) continue;
      const grow = sm(0.18, 1, melt);
      const r = L.lw * (0.6 + 0.75 * grow) * (0.3 + 0.7 * drain) * pr.size;
      const colK = Math.max(sm(0.55, 1, fk) * 0.55, sm(0, 0.5, tk));
      const col = mix(pr.ink, pr.finalCol, colK);
      const wet = 1 - sm(T.resolveStart - 0.03, T.resolveEnd, p);
      const ang = Math.atan2(entry[1] - mp[1], entry[0] - mp[0]);
      const stretch = Math.sin(Math.PI * fk) * 0.9;
      drawPuddle(c, x, y, r, col, (0.55 + 0.4 * grow) * f, pr.wanderP, stretch, ang, wet);
      // escorrido fino enquanto o corpo cede (tinta, não partícula)
      if (melt > 0.12 && melt < 0.9) {
        c.globalAlpha = 0.45 * f * (1 - sm(0.65, 0.9, melt));
        c.strokeStyle = rgb(pr.ink);
        c.lineWidth = Math.max(1.2, L.lw * 0.06);
        const hgt = 30 * pr.size * (1 - 0.75 * melt);
        const ox = 3.5 * Math.sin(pr.wanderP * 2.3);
        c.beginPath();
        c.moveTo(mp[0] + ox, mp[1] - hgt);
        c.lineTo(mp[0] + ox, mp[1] - 1);
        c.stroke();
      }
    }
    c.restore();
  }

  // pessoas (desenhadas DEPOIS das poças — nada cobre a figura)
  if (p < 0.78) {
    const states = S.persons
      .map((pr) => ({ pr, st: personState(pr, p) }))
      .filter((o) => o.st.alpha > 0.004)
      .sort((a, b) => a.st.y - b.st.y);
    for (const { pr, st } of states) {
      const zf = zoneFactor(st.x, st.y - 15 * st.size, vis);
      drawHuman(c, {
        x: st.x,
        y: st.y,
        size: st.size,
        facing: st.facing,
        th: st.th,
        amp: st.amp,
        alpha: st.alpha * f * zf,
        look: st.look,
        acc: pr.acc,
        accA: st.accA,
        grayK: st.grayK,
        melt: st.melt,
        app: pr.app,
        top: pr.color,
        ink: pr.ink,
      });
    }
  }

  // anel do ripple (Ato 3)
  if (p > T.rippleStart && p < T.rippleStart + T.rippleSpread + 0.02) {
    const k = (p - T.rippleStart) / (T.rippleSpread + 0.02);
    const r = k * S.grid.maxDist * 1.25;
    c.save();
    c.globalAlpha = (1 - k) * 0.22 * f;
    c.strokeStyle = rgb(GRAPHITE);
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(S.grid.cx, S.grid.cy, r, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = (1 - k) * 0.14 * f;
    c.strokeStyle = GREEN_HEX;
    c.beginPath();
    c.arc(S.grid.cx, S.grid.cy, r * 0.94, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  // Ato 5: a tinta escoa pelos canais do selo (carimbos molhados)
  if (p > T.traceStart && p < T.resolveEnd) {
    const wet = 1 - sm(T.resolveStart, T.resolveEnd, p);
    const fadeAll = (1 - sm(T.resolveStart, T.resolveEnd, p)) * f;
    c.save();
    c.globalCompositeOperation = "multiply";
    c.globalAlpha = 0.92 * Math.max(0.06, fadeAll);
    let qkL = 0;
    let qkR = 0;
    let qColL: RGB = LOGO_INK;
    let qColR: RGB = LOGO_INK;
    for (const pr of S.persons) {
      const k = traceK(pr, p);
      if (k <= 0.002) continue;
      // o traço nasce com o pigmento da pessoa e seca para a cor oficial
      const col = mix(pr.ink, pr.finalCol, Math.max(0.4, sm(0.25, 0.95, k)));
      if (pr.path.kind === "quote") {
        if (pr.path.q === 0) {
          if (k > qkL) {
            qkL = k;
            qColL = col;
          }
        } else if (k > qkR) {
          qkR = k;
          qColR = col;
        }
        continue;
      }
      const angSpan = pr.path.kind === "circle" ? Math.PI * 2 : Math.abs(A1 - A0);
      const spanLen = angSpan * L.R * pr.path.span * k;
      const n = Math.min(60, Math.max(2, Math.ceil(spanLen / Math.max(4, L.lw * 0.32))));
      c.fillStyle = rgb(col);
      c.beginPath();
      for (let i = 0; i <= n; i++) {
        const uu = pr.path.u0 + pr.path.span * k * (i / n);
        const pt = pathPoint(pr, uu);
        const wob = 1 + wet * (0.1 * Math.sin(uu * 43 + pr.wanderP) + 0.06 * Math.sin(uu * 77 + pr.wanderP * 1.7));
        let rr = (L.lw / 2) * wob;
        if (i === n && k < 0.98) rr *= 1 + 0.35 * wet;
        c.moveTo(pt[0] + rr, pt[1]);
        c.arc(pt[0], pt[1], rr, 0, Math.PI * 2);
      }
      c.fill();
    }
    if (qkL > 0 || qkR > 0) {
      drawQuotes(c, L.cx, L.cy, L.R, qkL, qkR, rgb(qColL), rgb(qColR));
    }
    c.restore();
  }

  c.restore(); // rise

  // a tinta seca: SVG oficial, sem mudança geométrica → assenta
  if (p >= T.resolveStart) {
    const rk = sm(T.resolveStart, T.resolveEnd, p);
    const sk = eio(sm(T.settleStart, T.settleEnd, p));
    const R = lerp(L.R, L.Rs, sk);
    const cy = lerp(L.cy, L.settleY, sk);
    drawLogo(c, L.cx, cy, R, rk * f, {});
  }

  // estado permanente
  for (const a of S.ambient) {
    if (a.draw) {
      const zf = zoneFactor(a.draw.x, a.draw.y - 15, vis);
      drawHuman(c, { ...a.draw, alpha: a.draw.alpha * f * zf });
    }
  }

  updateOverlays(p);
}

/* ---------------- overlays HTML dirigidos por p (design 1847–1882) ---------------- */

function updateOverlays(p: number): void {
  const d = dom;
  if (!d) return;
  const gate = S.phase === "draw" ? 0 : 1;
  const early = 1 - sm(T.copyOutA, T.copyOutB, p);
  const late = sm(T.copyInA, T.copyInB, p);
  const op = Math.max(early, late) * gate;
  if (Math.abs(op - S._lastHeroOp) > 0.004) {
    S._lastHeroOp = op;
    d.heroCopy.style.opacity = op.toFixed(3);
    d.heroCopy.style.pointerEvents = op > 0.35 ? "auto" : "none";
    const rise = late > 0 ? (1 - late) * 18 : 0;
    d.heroCopy.style.transform = "translate(-50%, calc(-50% + " + rise.toFixed(1) + "px))";
    d.heroCopy.setAttribute("aria-hidden", op < 0.1 ? "true" : "false");
  }
  const a2 = win(p, 0.235, 0.3, 0.34, 0.41) * gate;
  if (Math.abs(a2 - S._lastA2) > 0.004) {
    S._lastA2 = a2;
    d.act2.style.opacity = a2.toFixed(3);
    d.act2.style.transform = "translate(-50%, " + ((1 - a2) * 14).toFixed(1) + "px)";
    d.act2.setAttribute("aria-hidden", a2 < 0.1 ? "true" : "false");
  }
  const a3 = win(p, 0.46, 0.51, 0.555, 0.6) * gate;
  if (Math.abs(a3 - S._lastA3) > 0.004) {
    S._lastA3 = a3;
    d.act3.style.opacity = a3.toFixed(3);
    d.act3.style.transform = "translate(-50%, " + ((1 - a3) * 14).toFixed(1) + "px)";
    d.act3.setAttribute("aria-hidden", a3 < 0.1 ? "true" : "false");
  }
  const hint = (1 - sm(0.78, 0.93, p)) * gate;
  if (Math.abs(hint - S._lastHint) > 0.004) {
    S._lastHint = hint;
    d.hint.style.opacity = hint.toFixed(3);
  }
}

/* ---------------- estado permanente: pessoas nascem do selo (design 1885–1923) ---------------- */

function updateAmbient(now: number, dt: number): void {
  if (S.reduced || S.targetP < 0.96 || document.hidden) {
    S.ambient = [];
    return;
  }
  if (now - S.lastSpawn > S.nextGap && S.ambient.length < 2) {
    S.lastSpawn = now;
    S.nextGap = 5000 + Math.random() * 4000;
    const color = PALETTE[(Math.random() * PALETTE.length) | 0] ?? PALETTE[0];
    S.ambient.push({
      dir: Math.random() > 0.5 ? 1 : -1,
      color,
      app: makeAppearance(Math.random),
      ink: dark(color, 0.1),
      size: lerp(0.8, 1.05, Math.random()),
      speed: lerp(34, 52, Math.random()),
      acc: ACCESSORIES[(Math.random() * ACCESSORIES.length) | 0] ?? "none",
      x: S.logo.cx,
      th: Math.random() * 6,
      draw: null,
    });
  }
  const L = S.logo;
  const zoneTop = S.zone.cy - S.zone.hh;
  const yBase = Math.min(L.settleY + L.Rs * 0.95, zoneTop - 24);
  S.ambient = S.ambient.filter((a) => {
    a.x += a.dir * a.speed * dt;
    a.th += dt * 6.2;
    const dist = Math.abs(a.x - L.cx);
    const edge = S.W / 2 + 60;
    const grow = sm(0, L.Rs * 1.1, dist);
    const fadeOut = 1 - sm(edge - 120, edge, dist);
    const alpha = Math.min(grow, fadeOut);
    if (dist > edge) return false;
    a.draw = {
      x: a.x,
      y: yBase,
      size: a.size * lerp(0.6, 1, grow),
      facing: a.dir,
      th: a.th,
      amp: 1,
      alpha,
      look: 0,
      acc: a.acc,
      accA: 1,
      grayK: 0,
      melt: 0,
      app: a.app,
      top: a.color,
      ink: a.ink,
    };
    return true;
  });
}

/* ---------------- cena estática (reduced-motion) (design 1926–1985) ---------------- */

function renderStatic(): void {
  const c = S.ctx;
  if (!c) return;
  c.clearRect(0, 0, S.W, S.H);
  const z = S.zone;
  const L = S.logo;
  const leftBand = z.cx - z.hw;
  const narrow = S.W < 720 || leftBand < 180;
  const P = S.persons;
  const opt = (i: number, over: Partial<DrawHumanOpts>): DrawHumanOpts => {
    const pr = P[i % P.length];
    const base: DrawHumanOpts = {
      x: 0,
      y: 0,
      size: pr?.size ?? 1,
      facing: 1,
      th: 0.9,
      amp: 0.18,
      alpha: 1,
      look: 0,
      acc: pr?.acc ?? "none",
      accA: 1,
      grayK: 0,
      melt: 0,
      app: pr?.app ?? makeAppearance(mulberry(1)),
      top: pr?.color ?? GRAPHITE,
      ink: pr?.ink ?? GRAPHITE,
    };
    return { ...base, ...over };
  };

  // Narrow (phones): the copy is tall (H1 wraps + sub + two CTAs) and fills
  // the safe zone, so `layoutLogo` has no room above it — settleY gets clamped
  // down INTO the copy and the mark overlaps the H1. The mobile resting hero is
  // just the (legible) HTML copy on the plain field; the mark still lives in the
  // nav. So the static logo + ambient crowd are desktop-only, same as the crowd
  // grid below already is.
  if (!narrow) {
    drawLogo(c, S.W / 2, L.settleY, L.Rs, 1, {});
    const gx = leftBand / 2;
    const gy = z.cy - 10;
    const sp = Math.min(56, leftBand * 0.24);
    let n = 0;
    for (let r = 0; r < 3; r++) {
      for (let col2 = 0; col2 < 3; col2++) {
        drawHuman(
          c,
          opt(n++, {
            x: gx + (col2 - 1) * sp,
            y: gy + (r - 1) * sp * 1.15,
            grayK: 1,
            accA: 0,
            amp: 0.14,
            size: 0.95,
          })
        );
      }
    }
    const rightBand = S.W - (z.cx + z.hw);
    const dx = z.cx + z.hw + rightBand / 2;
    const rand = mulberry(7);
    for (let i = 0; i < 8; i++) {
      drawHuman(
        c,
        opt(9 + i, {
          x: dx + (rand() - 0.5) * Math.min(210, rightBand * 0.72),
          y: z.cy - 10 + (rand() - 0.5) * 150,
          facing: rand() > 0.5 ? 1 : -1,
          th: rand() * 6,
          amp: 0.2,
        })
      );
    }
  } else {
    const rowY = z.cy - z.hh - 54;
    const rand = mulberry(7);
    for (let i = 0; i < 3; i++) {
      drawHuman(c, opt(i, { x: S.W * 0.14 + i * 36, y: rowY, grayK: 1, accA: 0, amp: 0.14, size: 0.8 }));
    }
    for (let i = 0; i < 3; i++) {
      drawHuman(
        c,
        opt(4 + i, {
          x: S.W * 0.62 + i * 40,
          y: rowY + (rand() - 0.5) * 10,
          facing: rand() > 0.5 ? 1 : -1,
          th: rand() * 6,
          amp: 0.2,
          size: 0.85,
        })
      );
    }
  }

  const hero = dom?.heroCopy;
  if (hero) {
    hero.style.opacity = "1";
    hero.style.pointerEvents = "auto";
    hero.style.transform = "translate(-50%, -50%)";
    hero.removeAttribute("aria-hidden");
  }
}

/* ---------------- zona de segurança da copy (Fix A) ---------------- */

function measureZone(): void {
  const el = dom?.heroCopy;
  if (!el) return;
  const r = el.getBoundingClientRect();
  S.zone = {
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
    hw: r.width / 2 + 8,
    hh: r.height / 2 + 8,
  };
}

function zoneFactor(x: number, y: number, vis: number): number {
  if (vis <= 0.01) return 1;
  const z = S.zone;
  const dx = Math.max(Math.abs(x - z.cx) - z.hw, 0);
  const dy = Math.max(Math.abs(y - z.cy) - z.hh, 0);
  const f = sm(0, 46, Math.hypot(dx, dy));
  return 1 - vis * (1 - f);
}

function copyVis(p: number): number {
  return Math.max(1 - sm(0.085, 0.165, p), sm(0.94, 0.985, p));
}

function layoutLogo(): void {
  const W = S.W;
  const H = S.H;
  const L = S.logo;
  L.R = Math.min(W, H) * (W < 720 ? 0.3 : 0.26);
  L.lw = L.R * (5 / 37); // stroke-width 5 do SVG oficial
  L.cx = W / 2;
  L.cy = H / 2 - H * 0.02;
  const zoneTop = S.zone.cy - S.zone.hh;
  const Rs0 = L.R * (W < 720 ? 0.42 : 0.36);
  // Phones get extra top clearance so the settled mark doesn't crowd the fixed
  // nav (short viewport, proportionally taller nav). The size cap uses the same
  // clearance, so the mark self-shrinks to still clear the copy below it — no
  // overlap at any width.
  const topClear = W < 720 ? 108 : 84;
  L.Rs = Math.max(34, Math.min(Rs0, (zoneTop - topClear) * 0.45));
  L.settleY = Math.max((W < 720 ? 108 : 80) + L.Rs, zoneTop - L.Rs - 26);
}

/* ---------------- setup do mundo / resize (design 1087–1103) ---------------- */

function resize(): void {
  const d = dom;
  if (!d) return;
  S.DPR = Math.min(2, window.devicePixelRatio || 1);
  S.W = d.sticky.clientWidth;
  S.H = d.sticky.clientHeight;
  d.canvas.width = S.W * S.DPR;
  d.canvas.height = S.H * S.DPR;
  const ctx = d.canvas.getContext("2d");
  S.ctx = ctx;
  if (ctx) ctx.setTransform(S.DPR, 0, 0, S.DPR, 0, 0);
  measureZone();
  layoutLogo();
  buildCast();
  S.needsRender = true;
  if (S.reduced) renderStatic();
}

/* ---------------- scroll (design 1988–2019, intro slice only) ---------------- */

function readScroll(sy: number): void {
  const intro = dom?.intro;
  if (!intro) return;
  const range = Math.max(1, intro.offsetHeight - window.innerHeight);
  // Phones give the hero a taller scroll range (hero.css: 540vh). Map the whole
  // animation into the first ~3/4 of it so `p` reaches 1 early and the settled
  // logo + copy HOLD for the last quarter — a brief dwell before the demo.
  const animFrac = window.innerWidth < 720 ? 0.77 : 1;
  S.targetP = clamp(sy / (range * animFrac), 0, 1);
  const scrolled = sy > 24;
  if (scrolled !== S.scrolled) {
    S.scrolled = scrolled;
    document.documentElement.toggleAttribute("data-scrolled", scrolled);
  }
  S.needsRender = true;
}

/* ---------------- rAF tick (design 2021–2063, hero slice only) ---------------- */

function tick(dt: number, ts: number): void {
  if (S.reduced) return;

  if (S.phase !== "draw" && S.introFade < 1) {
    S.introFade = Math.min(1, S.introFade + dt / 0.9);
    S.needsRender = true;
  }

  const diff = S.targetP - S.dispP;
  if (Math.abs(diff) > 0.0004) {
    let step = diff * (1 - Math.exp(-dt * 4.2));
    const maxStep = 0.5 * dt;
    if (step > maxStep) step = maxStep;
    else if (step < -maxStep) step = -maxStep;
    S.dispP += step;
    S.needsRender = true;
  } else if (S.dispP !== S.targetP) {
    S.dispP = S.targetP;
    S.needsRender = true;
  }

  const hadAmbient = S.ambient.length > 0;
  updateAmbient(ts, dt);
  if (S.ambient.length || hadAmbient) S.needsRender = true;

  walkTick(dt);

  if (S.needsRender) {
    render2d(S.dispP);
    S.needsRender = false;
  }

  syncScrub();
}

/* ---------------- walker (design 2119–2340) ---------------- */

function resizeWalker(): void {
  const cv = dom?.walkerCanvas;
  if (!cv) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  cv.width = Math.round(vw * dpr);
  cv.height = Math.round(vh * dpr);
  S.walkDpr = dpr;
}

function pathAt(pts: Array<[number, number, number]>, t: number): { x: number; y: number; facing: number } {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (!a || !b) continue;
    if (t <= b[0] || i === pts.length - 2) {
      const k = clamp((t - a[0]) / Math.max(1e-4, b[0] - a[0]), 0, 1);
      const dx = b[1] - a[1];
      let facing = S.walkFacing || 1;
      if (Math.abs(dx) > 4) facing = dx > 0 ? 1 : -1;
      return { x: a[1] + dx * k, y: a[2] + (b[2] - a[2]) * k, facing };
    }
  }
  const first = pts[0];
  return { x: first?.[1] ?? 0, y: first?.[2] ?? 0, facing: S.walkFacing || 1 };
}

// bonequinho-guia: caminha com o scroll até o texto da respiração, depois
// contorna e desce sozinho. Lê `[data-breath-box]`/o container da seção de
// respiração lazily a cada frame (Breath owns those nodes) — tolera ausência
// (a seção pode não existir ainda, ou nunca, se integração falhar).
function walkTick(dt: number): void {
  if (S.reduced) return;
  const cv = dom?.walkerCanvas;
  const box = document.querySelector<HTMLElement>("[data-breath-box]");
  const bsec = document.querySelector<HTMLElement>("#respiracao");
  if (!cv || !box || !bsec) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const dpr = S.walkDpr || 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, vw, vh);

  if (!S.walker) {
    const rnd = mulberry(70714);
    S.walker = {
      app: makeAppearance(rnd),
      color: PALETTE[3] ?? PALETTE[0], // roxo terroso — destaca-se do fundo claro
      ink: dark(PALETTE[3] ?? PALETTE[0], 0.1),
      acc: "backpack",
    };
    S.walkPhase = "follow";
    S.walkTh = 0.7;
    S.walkAutoT = 0;
    S.walkAlpha = 0;
    S.walkFacing = 1;
    S.walkLastSy = null;
  }

  const sy = window.scrollY || document.documentElement.scrollTop || 0;
  const secTop = bsec.getBoundingClientRect().top + sy;
  const S1 = secTop; // texto centralizado na viewport
  const S0 = secTop - vh * 1.15; // começa a descer ~1 viewport antes
  const fp = clamp((sy - S0) / Math.max(1, S1 - S0), 0, 1);

  const last = S.walkLastSy == null ? sy : S.walkLastSy;
  const dScroll = sy - last;
  S.walkLastSy = sy;

  // voltou pra cima da faixa → rearma a caminhada
  if (sy < S1 - vh * 0.4 && S.walkPhase !== "follow") {
    S.walkPhase = "follow";
    S.walkAutoT = 0;
  }

  let x = S.walkPrevX != null ? S.walkPrevX : vw * 0.5;
  let y = S.walkPrevY != null ? S.walkPrevY : vh * 0.5;
  let facing = S.walkFacing;
  let amp = 0.9;

  if (S.walkPhase === "follow") {
    S.walkTh += Math.abs(dScroll) * 0.011; // passo ∝ distância rolada
    const e = eio(fp);
    const boxTop = box.getBoundingClientRect().top;
    y = vh * 0.13 + (boxTop - 10 - vh * 0.13) * e;
    x = vw * 0.5;
    facing = 1;
    amp = clamp(Math.abs(dScroll) * 0.05 + 0.12, 0.12, 1); // pernas mexem com o scroll
    // olha na direção do scroll: descendo → baixo, subindo → cima
    if (dScroll > 0.4) S.followHeading = Math.PI / 2;
    else if (dScroll < -0.4) S.followHeading = -Math.PI / 2;
    if (S.followHeading == null) S.followHeading = Math.PI / 2;
    if (fp >= 1) {
      S.walkPhase = "auto";
      S.walkAutoT = 0;
    }
  } else if (S.walkPhase === "auto") {
    S.walkAutoT = Math.min(1, S.walkAutoT + dt / 4.2);
    S.walkTh += dt * 6.5; // passo constante, sozinho
    amp = 1;
    const r = box.getBoundingClientRect();
    const m = 34;
    const cx = r.left + r.width / 2;
    const pts: Array<[number, number, number]> = [
      [0.0, cx, r.top - 10],
      [0.16, r.right + m, r.top - 10],
      [0.52, r.right + m, r.bottom + m],
      [0.74, cx, r.bottom + m],
      [1.0, cx, r.bottom + vh * 0.95],
    ];
    const pt = pathAt(pts, S.walkAutoT);
    x = pt.x;
    y = pt.y;
    facing = pt.facing;
    if (S.walkAutoT >= 1) S.walkPhase = "gone";
  }

  // some ANTES da seção de planos entrar (não no meio dela): força o fade quando o topo
  // de #planos se aproxima da viewport, independente da fase auto (que é por tempo)
  let beforePlanos = true;
  const planosEl = document.getElementById("planos");
  if (planosEl) beforePlanos = planosEl.getBoundingClientRect().top > vh * 0.9;
  const wantVisible = sy > S0 - vh * 0.5 && S.walkPhase !== "gone" && beforePlanos;
  S.walkAlpha = clamp(S.walkAlpha + (wantVisible ? 0.07 : -0.09), 0, 1);
  S.walkFacing = facing;

  // rumo (heading): follow olha na direção do scroll; auto segue o caminho
  if (S.walkPhase === "follow") {
    S.walkHeading = S.walkHeading == null ? S.followHeading : angLerp(S.walkHeading, S.followHeading ?? Math.PI / 2, 0.2);
  } else if (S.walkPrevX != null && S.walkPrevY != null) {
    const dx = x - S.walkPrevX;
    const dy = y - S.walkPrevY;
    if (Math.hypot(dx, dy) > 0.4) {
      const target = Math.atan2(dy, dx);
      S.walkHeading = S.walkHeading == null ? target : angLerp(S.walkHeading, target, 0.18);
    }
  }
  if (S.walkHeading == null) S.walkHeading = Math.PI / 2; // padrão: descendo
  S.walkPrevX = x;
  S.walkPrevY = y;

  if (S.walkAlpha <= 0.002) return;

  const w = S.walker;
  drawWalkerTop(ctx, {
    x,
    y,
    size: 1.4,
    heading: S.walkHeading,
    th: S.walkTh,
    amp,
    alpha: S.walkAlpha,
    app: w.app,
    top: w.color,
    ink: w.ink,
  });
}

// visão de cima do bonequinho — gira para o rumo do movimento (forward = +x local)
function drawWalkerTop(c: CanvasRenderingContext2D, o: WalkerDrawOpts): void {
  const u = 3.1 * o.size;
  const top = o.top;
  const topD = dark(top, 0.22);
  const bot = o.app.bottom;
  const botD = dark(bot, 0.18);
  const skin = o.app.skin;
  const skinD = dark(skin, 0.14);
  const hair = o.app.hair;
  const sw = Math.sin(o.th) * 3.4 * u * (0.35 + 0.65 * o.amp);

  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.heading);
  c.globalAlpha = o.alpha;
  c.lineCap = "round";
  c.lineJoin = "round";

  // sombra de contato no chão
  c.save();
  c.globalAlpha = o.alpha * 0.14;
  c.fillStyle = "#2A2620";
  c.beginPath();
  c.ellipse(-0.6 * u, 0, 6.2 * u, 5.2 * u, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // mochila (atrás = -x)
  c.fillStyle = rgb(dark(top, 0.12));
  c.beginPath();
  if (c.roundRect) c.roundRect(-5.2 * u, -2.6 * u, 2.8 * u, 5.2 * u, 1.2 * u);
  else c.rect(-5.2 * u, -2.6 * u, 2.8 * u, 5.2 * u);
  c.fill();

  // pernas + pés (passada fore/aft, alternada)
  for (const s of [-1, 1]) {
    const stepX = s === 1 ? sw : -sw;
    c.strokeStyle = rgb(s === 1 ? bot : botD);
    c.lineWidth = 2.4 * u;
    c.beginPath();
    c.moveTo(-1.2 * u, s * 1.7 * u);
    c.lineTo(-1.2 * u + stepX, s * 2.2 * u);
    c.stroke();
  }

  // braços (opostos às pernas): manga + antebraço de pele
  for (const s of [-1, 1]) {
    const swingA = (s === 1 ? -sw : sw) * 0.85;
    c.strokeStyle = rgb(s === 1 ? top : topD);
    c.lineWidth = 1.9 * u;
    c.beginPath();
    c.moveTo(0.4 * u, s * 3.4 * u);
    c.lineTo(0.4 * u + swingA, s * 4.6 * u);
    c.stroke();
  }

  // torso (ombros largos na lateral, corpo curto no eixo do movimento)
  c.fillStyle = rgb(top);
  c.beginPath();
  c.ellipse(-0.2 * u, 0, 3.2 * u, 4.4 * u, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(20,16,10,0.10)";
  c.beginPath();
  c.ellipse(-1.2 * u, 0, 1.6 * u, 4.2 * u, 0, 0, Math.PI * 2);
  c.fill();

  // cabeça (à frente do torso)
  c.fillStyle = rgb(skin);
  c.beginPath();
  c.arc(2.4 * u, 0, 2.7 * u, 0, Math.PI * 2);
  c.fill();
  // cabelo cobrindo a parte de trás da cabeça
  c.fillStyle = rgb(hair);
  c.beginPath();
  c.arc(2.1 * u, 0, 2.75 * u, Math.PI * 0.5, Math.PI * 1.5);
  c.fill();
  // nariz — dica de direção (aponta para +x)
  c.fillStyle = rgb(skinD);
  c.beginPath();
  c.moveTo(4.9 * u, -0.9 * u);
  c.lineTo(6.0 * u, 0);
  c.lineTo(4.9 * u, 0.9 * u);
  c.closePath();
  c.fill();

  c.restore();
}

/* ---------------- CTAs ---------------- */

function goDemo(): void {
  const el = document.getElementById("demo");
  if (!el) return;
  const y = el.getBoundingClientRect().top + (window.scrollY || document.documentElement.scrollTop || 0);
  smoothScrollTo(y);
  const textarea = el.querySelector<HTMLTextAreaElement>("textarea");
  if (textarea) {
    // preventScroll: smoothScrollTo already owns the scroll animation —
    // a focus-triggered jump would fight it.
    window.setTimeout(() => textarea.focus({ preventScroll: true }), 60);
  }
}

/* ---------------- abertura: a logo se constrói no centro (design 995–1012) ---------------- */

function computeIntroTransform(): string {
  let tf = "translate(-40vw, -46vh) scale(0.14)";
  const tgt = document.querySelector<HTMLElement>("[data-cultiv-nav-brand]");
  const cur = document.querySelector<HTMLElement>("[data-cultiv-intro-logo]");
  if (tgt && cur) {
    const a = tgt.getBoundingClientRect();
    const b = cur.getBoundingClientRect();
    const amb = Math.max(0.001, b.width / Math.max(1, cur.offsetWidth || b.width));
    const sc = a.width / b.width;
    const dx = (a.left + a.width / 2 - (b.left + b.width / 2)) / amb;
    const dy = (a.top + a.height / 2 - (b.top + b.height / 2)) / amb;
    tf = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sc.toFixed(4)})`;
  }
  return tf;
}

function setIntroAttr(phase: Phase): void {
  document.documentElement.setAttribute("data-intro", phase);
}

function armEntranceAnimations(): void {
  const d = dom;
  if (!d) return;
  const anim = (dur: number, delay: number): string =>
    `cultivFadeUp ${dur}s ${delay}s cubic-bezier(0.16,1,0.3,1) both`;
  d.h1.style.animation = anim(0.8, 0.1);
  d.sub.style.animation = anim(0.8, 0.26);
  d.ctaWrap.style.animation = anim(0.8, 0.4);
  d.support.style.animation = anim(0.8, 0.52);
}

function clearTimers(): void {
  for (const t of S.timers) clearTimeout(t);
  S.timers = [];
}

// Roda a abertura em curtain apenas quando !reduced — reduced-motion pula
// direto para 'done' (spec §7: "sem pin, sem scrub, sem animação").
function runIntro(): void {
  const d = dom;
  clearTimers();
  if (S.reduced || !d) {
    S.phase = "done";
    S.introFade = 1;
    setIntroAttr("done");
    d?.curtain.removeAttribute("data-active");
    return;
  }
  S.phase = "draw";
  S.introFade = 0;
  setIntroAttr("draw");
  d.curtain.setAttribute("data-active", "true");
  d.curtainBg.style.opacity = "1";
  d.curtainLogo.style.transform = "translate(0px, 0px) scale(1)";
  d.curtainLogo.style.opacity = "1";

  const t1 = window.setTimeout(() => {
    S.introTf = computeIntroTransform();
    S.phase = "reveal";
    setIntroAttr("reveal");
    d.curtainBg.style.opacity = "0";
    d.curtainLogo.style.transform = S.introTf;
    armEntranceAnimations();
  }, 1700);
  const t2 = window.setTimeout(() => {
    S.phase = "done";
    setIntroAttr("done");
    d.curtain.removeAttribute("data-active");
  }, 2950);
  S.timers = [t1, t2];
}

// Reduced-motion pode mudar em runtime (OS toggle com a aba aberta) —
// design's applyMotion (1069–1084): cancela a abertura, força o estado
// final e refaz a medição/render (estática se reduced, animada se não).
function applyMotion(): void {
  const reduced = reducedMotion();
  S.reduced = reduced;
  clearTimers();
  if (reduced) {
    S.phase = "done";
    S.introFade = 1;
    setIntroAttr("done");
    dom?.curtain.removeAttribute("data-active");
  }
  resize();
  readScroll(window.scrollY || document.documentElement.scrollTop || 0);
}

/* ---------------- scrub de dev (gate: location.search contém "scrub") ---------------- */

let scrubInput: HTMLInputElement | null = null;
let scrubValEl: HTMLSpanElement | null = null;

function setupDevScrub(): void {
  if (S.reduced) return;
  if (!location.search.includes("scrub")) return;
  const wrap = document.createElement("div");
  wrap.className = "hero-scrub";
  wrap.innerHTML =
    '<span>scrub</span><input type="range" min="0" max="1000" aria-label="Controle de desenvolvimento da timeline"><span data-scrub-val>0.000</span>';
  document.body.appendChild(wrap);
  scrubInput = wrap.querySelector("input");
  scrubValEl = wrap.querySelector("[data-scrub-val]");
  scrubInput?.addEventListener("input", (e) => {
    const intro = dom?.intro;
    if (!intro) return;
    const val = Number((e.target as HTMLInputElement).value) / 1000;
    const range = Math.max(1, intro.offsetHeight - window.innerHeight);
    window.scrollTo({ top: val * range, behavior: "instant" });
  });
}

function syncScrub(): void {
  if (scrubValEl) scrubValEl.textContent = S.dispP.toFixed(3);
  if (scrubInput && document.activeElement !== scrubInput) {
    scrubInput.value = String(Math.round(S.targetP * 1000));
  }
}

/* ---------------- init ---------------- */

export function initHeroStory(): void {
  const intro = document.querySelector<HTMLElement>("[data-hero-intro]");
  const sticky = document.querySelector<HTMLElement>("[data-hero-sticky]");
  const canvas = document.querySelector<HTMLCanvasElement>("[data-hero-canvas]");
  const heroCopy = document.querySelector<HTMLElement>("[data-hero-copy]");
  const h1 = document.querySelector<HTMLElement>("[data-hero-h1]");
  const sub = document.querySelector<HTMLElement>("[data-hero-sub]");
  const ctaWrap = document.querySelector<HTMLElement>("[data-hero-cta-wrap]");
  const support = document.querySelector<HTMLElement>("[data-hero-support]");
  const ctaPrimary = document.querySelector<HTMLButtonElement>("[data-hero-cta-demo]");
  const act2 = document.querySelector<HTMLElement>("[data-hero-act2]");
  const act3 = document.querySelector<HTMLElement>("[data-hero-act3]");
  const hint = document.querySelector<HTMLElement>("[data-hero-hint]");
  const walkerCanvas = document.querySelector<HTMLCanvasElement>("[data-hero-walker]");
  const curtain = document.querySelector<HTMLElement>("[data-hero-curtain]");
  const curtainBg = document.querySelector<HTMLElement>("[data-hero-curtain-bg]");
  const curtainLogo = document.querySelector<HTMLElement>("[data-hero-curtain-logo]");

  if (
    !intro ||
    !sticky ||
    !canvas ||
    !heroCopy ||
    !h1 ||
    !sub ||
    !ctaWrap ||
    !support ||
    !ctaPrimary ||
    !act2 ||
    !act3 ||
    !hint ||
    !walkerCanvas ||
    !curtain ||
    !curtainBg ||
    !curtainLogo
  ) {
    return; // markup incomplete — nothing safe to wire up
  }

  dom = {
    intro,
    sticky,
    canvas,
    heroCopy,
    h1,
    sub,
    ctaWrap,
    support,
    ctaPrimary,
    act2,
    act3,
    hint,
    walkerCanvas,
    curtain,
    curtainBg,
    curtainLogo,
  };

  S.reduced = reducedMotion();
  S.introFade = S.reduced ? 1 : 0;

  ctaPrimary.addEventListener("click", goDemo);

  resizeWalker();
  runIntro();
  setupDevScrub();

  addResize(() => {
    resize();
    resizeWalker();
  });
  addScroll(readScroll);
  addTick(tick);
  onReducedChange(applyMotion);

  start();
}
