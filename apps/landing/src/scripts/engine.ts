// Shared runtime for the v5 landing scroll-story. Ported from the design's
// DCLogic monolith (cultiv-hero-v5.dc.html): the *shell* of `_tick`
// (2021–2068) and `readScroll` (1988–2020) — one rAF loop, one scroll
// listener, one resize listener for the whole page — plus its math
// utilities (954–975, `_angLerp` 2255) and `smoothScrollTo` (2342–2361).
//
// The per-frame CHOREOGRAPHY (cTick, breathTick, walkTick, founderTick,
// render2d…) is NOT here — each section owns that in its own script and
// registers it via `addTick`. This module only guarantees there is exactly
// ONE `requestAnimationFrame` loop and ONE pair of scroll/resize listeners
// driving all of them, matching the design's single-component architecture
// without forcing every section into one file.

type TickFn = (dt: number, ts: number) => void;
type ScrollFn = (scrollY: number) => void;
type ResizeFn = () => void;

const ticks = new Set<TickFn>();
const scrolls = new Set<ScrollFn>();
const resizes = new Set<ResizeFn>();

let started = false;
let lastTs = 0;

function currentScrollY(): number {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function dispatchScroll(): void {
  const sy = currentScrollY();
  for (const fn of scrolls) fn(sy);
}

function dispatchResize(): void {
  for (const fn of resizes) fn();
  // The design's `_onResize` shell also calls `readScroll()` — a resize can
  // change the scroll-progress math (section heights, viewport) even when
  // the user hasn't scrolled.
  dispatchScroll();
}

function frame(ts: number): void {
  // Same clamp as the design: a stalled tab (backgrounded, DevTools break)
  // must not report a multi-second `dt` on resume.
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
  lastTs = ts;
  for (const fn of ticks) fn(dt, ts);
  requestAnimationFrame(frame);
}

/** Register per-frame work; runs inside the page's single rAF loop.
    Returns an unregister function. */
export function addTick(fn: TickFn): () => void {
  ticks.add(fn);
  return () => ticks.delete(fn);
}

/** Register scroll-position work; fires on scroll AND on resize (a resize
    alone can change scroll-progress math). Returns an unregister function. */
export function addScroll(fn: ScrollFn): () => void {
  scrolls.add(fn);
  return () => scrolls.delete(fn);
}

/** Register resize-only work (canvas re-measurement, layout). Returns an
    unregister function. */
export function addResize(fn: ResizeFn): () => void {
  resizes.add(fn);
  return () => resizes.delete(fn);
}

/** Boots the shared scroll/resize listeners + rAF loop. Idempotent — safe
    to call from every section's mount script; only the first call actually
    starts anything, so the page still ends up with exactly one loop and one
    listener pair. Seeds one immediate resize+scroll pass so sections
    registered before `start()` get their initial measurement (mirrors the
    design's `componentDidMount`: `resize(); readScroll();`). */
export function start(): void {
  if (started) return;
  started = true;
  window.addEventListener("scroll", dispatchScroll, { passive: true });
  window.addEventListener("resize", dispatchResize);
  dispatchResize();
  lastTs = performance.now();
  requestAnimationFrame(frame);
}

/* ---------------- reduced motion ---------------- */

const rmQuery: MediaQueryList | null =
  typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;

/** Current `prefers-reduced-motion: reduce` state. Read fresh each call
    (matchMedia results can change at runtime, e.g. OS setting toggled with
    the tab open). */
export function reducedMotion(): boolean {
  return rmQuery?.matches ?? false;
}

/** Safari <14 exposed `addListener`/`removeListener` instead of the standard
    `EventTarget` methods; `lib.dom.d.ts` marks them `@deprecated` (they're
    gone from the modern types), so this fallback is typed by hand rather
    than tripping a deprecation hint on every build. */
interface LegacyMediaQueryList {
  addListener?(fn: (ev: MediaQueryListEvent) => void): void;
  removeListener?(fn: (ev: MediaQueryListEvent) => void): void;
}

/** Subscribe to `prefers-reduced-motion` changes (design's `componentDidMount`
    RM listener, 977–980). Returns an unregister function. */
export function onReducedChange(fn: (reduced: boolean) => void): () => void {
  if (!rmQuery) return () => {};
  const legacy = rmQuery as unknown as LegacyMediaQueryList;
  const handler = () => fn(reducedMotion());
  if (rmQuery.addEventListener) rmQuery.addEventListener("change", handler);
  else legacy.addListener?.(handler); // Safari <14 fallback — same pattern the design uses at 979–980.
  return () => {
    if (rmQuery.removeEventListener) rmQuery.removeEventListener("change", handler);
    else legacy.removeListener?.(handler);
  };
}

/* ---------------- math utilities (design 954–975, 2255) ---------------- */

export function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v));
}
export function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}
/** Smoothstep: 0→1 ease as `v` crosses [a, b]. */
export function sm(a: number, b: number, v: number): number {
  const k = clamp((v - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
}
/** A rise-then-fall "window": smoothstep up across [a,b], down across [c,d]. */
export function win(p: number, a: number, b: number, c: number, d: number): number {
  return sm(a, b, p) * (1 - sm(c, d, p));
}
/** Ease-in-out cubic. */
export function eio(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
/** Ease-out-back (slight overshoot). */
export function eob(t: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}
/** "Arrival" ease — exponential settle, exact 1 at t>=1. */
export function arrive(t: number): number {
  const s = t * t * (3 - 2 * t);
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * s);
}
export function hexToRgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
export function mix(
  c1: readonly [number, number, number],
  c2: readonly [number, number, number],
  k: number
): [number, number, number] {
  return [lerp(c1[0], c2[0], k) | 0, lerp(c1[1], c2[1], k) | 0, lerp(c1[2], c2[2], k) | 0];
}
export function rgb(c: readonly [number, number, number]): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
export function dark(c: readonly [number, number, number], k: number): [number, number, number] {
  return [(c[0] * (1 - k)) | 0, (c[1] * (1 - k)) | 0, (c[2] * (1 - k)) | 0];
}
/** Deterministic PRNG (mulberry32) — same seed always yields the same
    sequence, used by sections that synthesize a scene (VoiceMap's grain
    nodes, Hero's cast). */
export function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Shortest-path angle interpolation (radians), design 2255–2260 — used by
    the Hero walker to turn toward its heading without spinning the long way
    around. */
export function angLerp(a: number, b: number, k: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * k;
}

/* ---------------- smooth scroll (design 2342–2361) ---------------- */

let scrollAnim = 0;

/** Eased scroll to an absolute `top` offset. Jumps instantly under reduced
    motion (matches the design's own reduced-motion branch). */
export function smoothScrollTo(top: number): void {
  if (reducedMotion()) {
    window.scrollTo(0, top);
    return;
  }
  const start = currentScrollY();
  const delta = top - start;
  if (Math.abs(delta) < 1) return;
  const dur = Math.min(900, Math.max(400, Math.abs(delta) * 0.35));
  const t0 = performance.now();
  if (scrollAnim) cancelAnimationFrame(scrollAnim);
  const step = (now: number) => {
    const k = clamp((now - t0) / dur, 0, 1);
    const e = eio(k);
    window.scrollTo(0, start + delta * e);
    if (k < 1) scrollAnim = requestAnimationFrame(step);
  };
  scrollAnim = requestAnimationFrame(step);
}
