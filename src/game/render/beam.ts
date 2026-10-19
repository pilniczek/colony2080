import type { Pt } from "../../engine/rig/tree";
import { ARC, bolt, LAYERS, rng, stroke } from "../arcLook";

export const BEAM_FRAMES = 6;

const mix = (seed: number): number => {
  let h = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 11;
};

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
