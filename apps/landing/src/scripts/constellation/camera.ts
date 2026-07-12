// Câmera do mapa celeste (mobile): pan, pinch, momentum, toque duplo e voo
// até um nó. Fora do mobile o CSS centraliza o campo; aqui só assumimos o
// controle quando isMobile(). Também é dona das coordenadas dos nós e da
// troca de geometria das arestas entre desktop e mobile.

import type { Els } from "./els";
import { isMobile } from "./state";

interface Coord {
  x: number;
  y: number;
  mx: number;
  my: number;
}

export interface Camera {
  focusNode(id: string, z: number, fly: boolean, cyFrac?: number): void;
  /** Reaplica x1/y1/x2/y2 das arestas para o breakpoint atual. */
  applyEdgeCoords(): void;
  /** Reinicializa (ou libera) a câmera após mudança de breakpoint/tamanho. */
  refresh(): void;
  /** True logo após um arrasto — suprime o clique acidental no nó. */
  wasDragged(): boolean;
  currentZ(): number;
}

export function createCamera(els: Els): Camera {
  const { viewport, fieldbox } = els;
  const cam = { x: 0, y: 0, z: 1 };
  let camReady = false;
  let justDragged = false;

  // Coordenadas por nó a partir dos estilos do template (--x/--y em % de 600×800).
  const coords = new Map<string, Coord>();
  for (const [id, el] of els.nodes) {
    const px = (v: string, scale: number) => (parseFloat(v) / 100) * scale;
    const s = el.style;
    const x = px(s.getPropertyValue("--x"), 600);
    const y = px(s.getPropertyValue("--y"), 800);
    const mxRaw = s.getPropertyValue("--mx");
    const myRaw = s.getPropertyValue("--my");
    coords.set(id, {
      x,
      y,
      mx: mxRaw ? px(mxRaw, 600) : x,
      my: myRaw ? px(myRaw, 800) : y,
    });
  }

  const applyEdgeCoords = () => {
    const mob = isMobile();
    for (const e of els.edges) {
      const ca = coords.get(e.a)!;
      const cb = coords.get(e.b)!;
      for (const line of e.lines) {
        line.setAttribute("x1", String(mob ? ca.mx : ca.x));
        line.setAttribute("y1", String(mob ? ca.my : ca.y));
        line.setAttribute("x2", String(mob ? cb.mx : cb.x));
        line.setAttribute("y2", String(mob ? cb.my : cb.y));
      }
    }
  };

  const vpSize = () => ({ w: viewport.clientWidth, h: viewport.clientHeight });
  const fieldDims = () => {
    const { w, h } = vpSize();
    if (isMobile()) {
      const fh = Math.max(h, 10);
      return { fw: fh * 0.75, fh };
    }
    let fh = Math.max(h, 10);
    let fw = fh * 0.75;
    if (fw > w && w > 10) {
      fw = w;
      fh = fw / 0.75;
    }
    return { fw, fh };
  };
  const minZ = () => {
    const { fw } = fieldDims();
    return Math.min(1, vpSize().w / Math.max(fw, 1)) * 0.95;
  };
  const clampCam = (x: number, y: number, z: number) => {
    const { fw, fh } = fieldDims();
    const { w: vpW, h: vpH } = vpSize();
    // Folga extra na base/laterais para o anel e o rótulo dos nós de borda.
    const mx = 24;
    const mb = 64;
    const clX = (v: number, vp: number, sz: number) =>
      sz <= vp - mx * 2 ? (vp - sz) / 2 : Math.min(mx, Math.max(vp - sz - mx, v));
    const clY = (v: number, vp: number, sz: number) =>
      sz <= vp - mb ? (vp - sz) / 2 : Math.min(12, Math.max(vp - sz - mb, v));
    return { x: clX(x, vpW, fw * z), y: clY(y, vpH, fh * z), z };
  };
  const renderCam = (fly = false) => {
    if (!isMobile()) return;
    const { fw, fh } = fieldDims();
    viewport.dataset.cam = "";
    fieldbox.style.width = `${Math.round(fw)}px`;
    fieldbox.style.height = `${Math.round(fh)}px`;
    fieldbox.style.transition = fly
      ? "transform 0.65s cubic-bezier(0.22,1,0.36,1)"
      : "none";
    fieldbox.style.transform = `translate(${cam.x.toFixed(1)}px, ${cam.y.toFixed(1)}px) scale(${cam.z.toFixed(3)})`;
  };
  const setCam = (x: number, y: number, z: number, fly = false) => {
    Object.assign(cam, clampCam(x, y, z));
    renderCam(fly);
    if (fly) setTimeout(() => renderCam(false), 720);
  };
  const focusNode = (id: string, z: number, fly: boolean, cyFrac = 0.5) => {
    if (!isMobile()) return;
    const c = coords.get(id);
    if (!c) return;
    const { fw, fh } = fieldDims();
    const { w: vpW, h: vpH } = vpSize();
    const zz = Math.min(2.6, Math.max(minZ(), z));
    const px = (c.mx / 600) * fw;
    const py = (c.my / 800) * fh;
    setCam(vpW / 2 - px * zz, vpH * cyFrac - py * zz, zz, fly);
  };
  const refresh = () => {
    if (!isMobile()) {
      delete viewport.dataset.cam;
      fieldbox.style.cssText = "";
      camReady = false;
      return;
    }
    if (camReady || vpSize().w < 50) return;
    camReady = true;
    // Posição inicial da câmera: foco no Perfil de Voz.
    focusNode("perfil", 1.35, false, 0.5);
  };

  // ===== Gestos: pan / pinch / momentum / toque duplo =====
  const ptrs = new Map<number, { x: number; y: number }>();
  let drag: {
    sx: number;
    sy: number;
    cx: number;
    cy: number;
    moved: boolean;
    vx: number;
    vy: number;
    lx: number;
    ly: number;
    lt: number;
    target: EventTarget | null;
  } | null = null;
  let pinch: {
    d0: number;
    z0: number;
    x0: number;
    y0: number;
    mx: number;
    my: number;
  } | null = null;
  let momentum = 0;
  let lastTap: { t: number; x: number; y: number } | null = null;

  const stopMomentum = () => {
    if (momentum) cancelAnimationFrame(momentum);
    momentum = 0;
  };
  const startMomentum = (vx: number, vy: number) => {
    const step = () => {
      vx *= 0.93;
      vy *= 0.93;
      if (Math.abs(vx) < 0.03 && Math.abs(vy) < 0.03) {
        momentum = 0;
        return;
      }
      setCam(cam.x + vx * 16, cam.y + vy * 16, cam.z);
      momentum = requestAnimationFrame(step);
    };
    momentum = requestAnimationFrame(step);
  };

  viewport.addEventListener("pointerdown", (e) => {
    if (!isMobile()) return;
    stopMomentum();
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) {
      drag = {
        sx: e.clientX,
        sy: e.clientY,
        cx: cam.x,
        cy: cam.y,
        moved: false,
        vx: 0,
        vy: 0,
        lx: e.clientX,
        ly: e.clientY,
        lt: performance.now(),
        target: e.target,
      };
      pinch = null;
    } else if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = {
        d0: Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)),
        z0: cam.z,
        x0: cam.x,
        y0: cam.y,
        mx: (a.x + b.x) / 2,
        my: (a.y + b.y) / 2,
      };
      drag = null;
    }
  });
  addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.max(20, Math.hypot(a.x - b.x, a.y - b.y));
      const z = Math.min(2.6, Math.max(minZ(), pinch.z0 * (d / pinch.d0)));
      const rect = viewport.getBoundingClientRect();
      const mx = pinch.mx - rect.left;
      const my = pinch.my - rect.top;
      const f = z / pinch.z0;
      setCam(mx - (mx - pinch.x0) * f, my - (my - pinch.y0) * f, z);
    } else if (drag && ptrs.size === 1) {
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) > 7) drag.moved = true;
      if (drag.moved) {
        const now = performance.now();
        const dt = Math.max(1, now - drag.lt);
        drag.vx = (e.clientX - drag.lx) / dt;
        drag.vy = (e.clientY - drag.ly) / dt;
        drag.lx = e.clientX;
        drag.ly = e.clientY;
        drag.lt = now;
        setCam(drag.cx + dx, drag.cy + dy, cam.z);
      }
    }
  });
  const pointerUp = (e: PointerEvent) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (pinch && ptrs.size < 2) pinch = null;
    const d = drag;
    if (d && ptrs.size === 0) {
      drag = null;
      if (d.moved) {
        justDragged = true;
        setTimeout(() => (justDragged = false), 80);
        if (Math.hypot(d.vx, d.vy) > 0.15) startMomentum(d.vx, d.vy);
      } else if (!(d.target instanceof Element && d.target.closest("a,button"))) {
        // toque duplo em área vazia = zoom
        const now = performance.now();
        if (
          lastTap &&
          now - lastTap.t < 320 &&
          Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 40
        ) {
          lastTap = null;
          const rect = viewport.getBoundingClientRect();
          if (cam.z > 1.25) {
            const zz = minZ() / 0.95;
            const { fw, fh } = fieldDims();
            const { w, h } = vpSize();
            setCam((w - fw * zz) / 2, (h - fh * zz) / 2, zz, true);
          } else {
            const tx = e.clientX - rect.left;
            const ty = e.clientY - rect.top;
            const z = 2;
            const f = z / cam.z;
            setCam(tx - (tx - cam.x) * f, ty - (ty - cam.y) * f, z, true);
          }
        } else {
          lastTap = { t: now, x: e.clientX, y: e.clientY };
        }
      }
    }
  };
  addEventListener("pointerup", pointerUp);
  addEventListener("pointercancel", pointerUp);
  viewport.addEventListener(
    "click",
    (e) => {
      if (justDragged) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    true
  );

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => refresh()).observe(viewport);
  }

  applyEdgeCoords();
  refresh();

  return {
    focusNode,
    applyEdgeCoords,
    refresh,
    wasDragged: () => justDragged,
    currentZ: () => cam.z,
  };
}
