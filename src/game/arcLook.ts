import type { Pt } from "../engine/rig/tree";

export const ARC = { e0: "#202488", e1: "#3a52c4", e2: "#6084a4", e3: "#b8dcf4", eLine: "#0c1040", glow: "#7ae0ff", grey: "#c4cccc", core: "#f4f4f4" };

export const stroke = (ctx: CanvasRenderingContext2D, pts: Pt[], color: string, width: number): void => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
};

export const rng = (seed: number): (() => number) => {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
};

export const bolt = (length: number, frame: number): Pt[][] => {
  const r = rng(frame + 1);
  const count = r() < 0.5 ? 2 : 3;
  return Array.from({ length: count }, (_, k) => {
    const pts: Pt[] = [[0, 0]];
    let x = 0;
    let side = k % 2 ? 1 : -1;
    while (x < length) {
      x = Math.min(length, x + 5 + r() * 5);
      side = -side;
      pts.push([x, x === length ? 0 : side * (1 + r() * 3.5)]);
    }
    return pts;
  });
};

export const LAYERS: [string, number, number][] = [[ARC.e0, 5, 0.55], [ARC.e2, 3, 1], [ARC.grey, 1.8, 1], [ARC.core, 1, 1]];
