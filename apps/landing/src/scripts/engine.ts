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
  dispatchScroll();
}

function frame(ts: number): void {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
  lastTs = ts;
  for (const fn of ticks) fn(dt, ts);
  requestAnimationFrame(frame);
}

export function addTick(fn: TickFn): () => void {
  ticks.add(fn);
  return () => ticks.delete(fn);
}

export function addScroll(fn: ScrollFn): () => void {
  scrolls.add(fn);
  return () => scrolls.delete(fn);
}

export function addResize(fn: ResizeFn): () => void {
  resizes.add(fn);
  return () => resizes.delete(fn);
}

export function start(): void {
  if (started) return;
  started = true;
  window.addEventListener("scroll", dispatchScroll, { passive: true });
  window.addEventListener("resize", dispatchResize);
  dispatchResize();
  lastTs = performance.now();
  requestAnimationFrame(frame);
}

const rmQuery: MediaQueryList | null =
  typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;

export function reducedMotion(): boolean {
  return rmQuery?.matches ?? false;
}

interface LegacyMediaQueryList {
  addListener?(fn: (ev: MediaQueryListEvent) => void): void;
  removeListener?(fn: (ev: MediaQueryListEvent) => void): void;
}

export function onReducedChange(fn: (reduced: boolean) => void): () => void {
  if (!rmQuery) return () => {};
  const legacy = rmQuery as unknown as LegacyMediaQueryList;
  const handler = () => fn(reducedMotion());
  if (rmQuery.addEventListener) rmQuery.addEventListener("change", handler);
  else legacy.addListener?.(handler);
  return () => {
    if (rmQuery.removeEventListener) rmQuery.removeEventListener("change", handler);
    else legacy.removeListener?.(handler);
  };
}

export function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v));
}
export function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}
export function sm(a: number, b: number, v: number): number {
  const k = clamp((v - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
}
export function win(p: number, a: number, b: number, c: number, d: number): number {
  return sm(a, b, p) * (1 - sm(c, d, p));
}
export function eio(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
export function eob(t: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}
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
export function angLerp(a: number, b: number, k: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * k;
}

let scrollAnim = 0;

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
