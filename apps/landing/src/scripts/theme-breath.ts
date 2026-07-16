// Chamber color-breath — ported from the design's `cApplyTheme`/`cClearTheme`
// (2656–2681) and `_applyTheme` (2586), generalized from the design's two
// hardcoded chambers (`cThemeT`, `fThemeT`) to a small named map so any
// section can register its own chamber. The applied progress is always the
// MAX across all registered chambers, exactly like the design's
// `Math.max(this.cThemeT || 0, this.fThemeT || 0)` — two dark chambers
// overlapping in the viewport never fight over the palette.
//
// This module no longer knows any colours: the light↔dark endpoints are the
// packages/ui field tokens and their `--x*` duals (SSOT), color-mixed in
// root.css. Here we only write the breath PROGRESS — two curves (Fix E: ink
// resolves before the background) plus the raw chamber depth — and let the
// CSS cascade repaint the ~6 `--t-*` tokens for free.
//
// Only VoiceMap (`const`) and FounderProof (`founder`) are dark chambers in
// v5; every other section reads the plain light `--t-*` palette from
// `root.css` and never calls this module.

import { reducedMotion } from "./engine";

export type ChamberKey = "const" | "founder";

const chambers = new Map<ChamberKey, number>();
let lastAppliedT = -1;

// Smoothstep, clamped — the design's easing for the two breath curves.
function sm(a: number, b: number, v: number): number {
  const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return k * k * (3 - 2 * k);
}

function setThemeColorMeta(dark: boolean): void {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#151512" : "#F8F7F4");
}

function applyTheme(t: number): void {
  if (Math.abs(t - lastAppliedT) < 0.003) return;
  lastAppliedT = t;
  // Fix E: the background resolves early and slow (0.06→0.5) while the ink
  // jumps in a narrow late window (0.3→0.38), so mid-breath samples never
  // drop a legible body of text below AA against a half-dark field.
  const bgK = sm(0.06, 0.5, t);
  const inkK = sm(0.3, 0.38, t);
  const root = document.documentElement.style;
  root.setProperty("--theme-t", String(t));
  root.setProperty("--theme-bg-k", String(bgK));
  root.setProperty("--theme-ink-k", String(inkK));
  setThemeColorMeta(inkK >= 0.5);
}

function clearTheme(): void {
  const root = document.documentElement.style;
  // Fall back to root.css defaults (all 0 → resting ui light tokens).
  ["--theme-t", "--theme-bg-k", "--theme-ink-k"].forEach((p) => root.removeProperty(p));
  lastAppliedT = -1;
  setThemeColorMeta(false);
}

/** Register a chamber's breath progress (0..1, how "inside the dark camera"
    it currently is). The page `--t-*` palette follows the MAX across every
    registered chamber. Call with `t=0` when a chamber is fully out of view
    rather than unregistering — that's what keeps `Math.max` correct once a
    second chamber (e.g. founder) starts contributing later in the scroll.
    No-ops entirely under reduced motion (design's "Fix G: nenhuma tinta
    global" — no global tint plays there). */
export function setChamberT(key: ChamberKey, t: number): void {
  if (reducedMotion()) return;
  chambers.set(key, t);
  let max = 0;
  for (const v of chambers.values()) if (v > max) max = v;
  if (max <= 0.001) clearTheme();
  else applyTheme(max);
}
