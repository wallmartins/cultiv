import { reducedMotion } from "./engine";

export type ChamberKey = "const" | "founder";

const chambers = new Map<ChamberKey, number>();
let lastAppliedT = -1;

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
  ["--theme-t", "--theme-bg-k", "--theme-ink-k"].forEach((p) => root.removeProperty(p));
  lastAppliedT = -1;
  setThemeColorMeta(false);
}

export function setChamberT(key: ChamberKey, t: number): void {
  if (reducedMotion()) return;
  chambers.set(key, t);
  let max = 0;
  for (const v of chambers.values()) if (v > max) max = v;
  if (max <= 0.001) clearTheme();
  else applyTheme(max);
}
