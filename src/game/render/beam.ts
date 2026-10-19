import type { Pt } from "../../engine/rig/tree";
import { ARC, stroke } from "../robot/eblaster";

export const BEAM_FRAMES = 6;
export const BEAM_TICK_HZ = 32;

export const rng = (seed: number): (() => number) => {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
};

const mix = (seed: number): number => {
  let h = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 11;
};

export const beamFrame = (t: number): number => Math.floor(t * BEAM_TICK_HZ) % BEAM_FRAMES;

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

const knot = (ctx: CanvasRenderingContext2D): void => {
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = ARC.glow;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  stroke(ctx, [[-3, -3], [3, 3]], ARC.core, 1);
  stroke(ctx, [[-3, 3], [3, -3]], ARC.core, 1);
};

export const drawBeam = (ctx: CanvasRenderingContext2D, length: number, frame: number, seed: number): void => {
  const dy = Math.floor(rng(mix(seed))() * 3) - 1;
  const strands = bolt(length, frame).map((pts) => pts.map(([x, y], i): Pt => [x, i > 1 ? y + dy : y]));
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const [color, width, alpha] of LAYERS) {
    ctx.globalAlpha = alpha;
    for (const pts of strands) stroke(ctx, pts, color, width);
  }
  ctx.globalAlpha = 1;
  knot(ctx);
  ctx.restore();
};
