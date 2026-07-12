// Canvas de ritmo da coluna de identidade: um flow-field de linhas de tinta
// com acentos acid, puramente decorativo (aria-hidden). Pausa quando a aba
// está oculta; com reduced motion desenha um único frame estático.

export interface Rhythm {
  start(): void;
}

export function createRhythm(canvas: HTMLCanvasElement | null, reduced: boolean): Rhythm {
  let started = false;

  const start = () => {
    if (started || !canvas) return;
    started = true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const R = Math.random;
    const lines = Array.from({ length: 16 }, (_, i) => ({
      a: R() * Math.PI * 2,
      r0: 18 + R() * 70,
      s1: R() * 10,
      s2: R() * 10,
      amp: 0.4 + R() * 0.5,
      len: 100 + R() * 70,
      accent: i % 8 === 0,
      aFrom: 0.3 + R() * 0.4,
    }));
    const arcs = Array.from({ length: 3 }, () => ({
      u: 0.15 + R() * 0.7,
      v: 0.12 + R() * 0.76,
      r: 36 + R() * 55,
      ph: R() * 10,
      wob: 2 + R() * 3,
    }));

    const t0 = performance.now();
    let raf = 0;
    const draw = (now: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) {
        raf = requestAnimationFrame(draw);
        return;
      }
      if (canvas.width !== w * 2 || canvas.height !== h * 2) {
        canvas.width = w * 2;
        canvas.height = h * 2;
      }
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const ink = getComputedStyle(canvas).color;
      const t = reduced ? 7 : (now - t0) / 1000;
      let g = reduced ? 1 : Math.min(1, (now - t0) / 2600);
      g = 1 - Math.pow(1 - g, 3);
      const ox = w / 2;
      const oy = h * 0.44;
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      for (const L of lines) {
        let x = ox + Math.cos(L.a) * L.r0;
        let y = oy + Math.sin(L.a) * L.r0;
        const steps = Math.floor(L.len * g);
        if (steps < 2) continue;
        const pts: [number, number][] = [[x, y]];
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < steps; k++) {
          const ra = Math.atan2(y - oy, x - ox);
          const n =
            Math.sin(x * 0.009 + t * 0.07 + L.s1) +
            Math.cos(y * 0.011 - t * 0.05 + L.s2) +
            Math.sin((x + y) * 0.004 + t * 0.03);
          const dir = ra + n * L.amp;
          x += Math.cos(dir) * 5.5;
          y += Math.sin(dir) * 5.5;
          ctx.lineTo(x, y);
          pts.push([x, y]);
        }
        ctx.strokeStyle = ink;
        ctx.globalAlpha = 0.055;
        ctx.stroke();
        if (L.accent && pts.length > 24) {
          const i0 = Math.floor(pts.length * L.aFrom);
          const i1 = Math.min(pts.length - 1, i0 + 14);
          ctx.beginPath();
          ctx.moveTo(pts[i0][0], pts[i0][1]);
          for (let k = i0 + 1; k <= i1; k++) ctx.lineTo(pts[k][0], pts[k][1]);
          ctx.strokeStyle = "#A3DD42";
          ctx.globalAlpha = 0.25;
          ctx.stroke();
        }
      }
      for (const A of arcs) {
        const o = Math.max(0, Math.sin(t * 0.08 + A.ph)) * 0.07 * g;
        if (o > 0.004) {
          ctx.beginPath();
          for (let k = 0; k <= 90; k++) {
            const th = (k / 90) * Math.PI * 1.9 + A.ph;
            const rr = A.r + Math.sin(th * 3 + t * 0.12) * A.wob;
            const px = A.u * w + Math.cos(th) * rr;
            const py = A.v * h + Math.sin(th) * rr;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = ink;
          ctx.globalAlpha = o;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      if (!reduced && !document.hidden) raf = requestAnimationFrame(draw);
      else raf = 0;
    };
    raf = requestAnimationFrame(draw);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (!reduced && !raf) {
        raf = requestAnimationFrame(draw);
      }
    });
  };

  return { start };
}
