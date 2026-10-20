import { TILE } from "./paint";

export const BLAST = { grow: 0.25, hideBody: 0.45, center: -84, spin: 3.2, pull: [0.75, 1.1], fade: [0.9, 1.2], ring: [0.95, 1.45], ringRadius: 72, ringWidth: 11, swirl: 0.16, size: 1.6, loop: 2 } as const;
export const BLAST_PX = (1.9 * TILE) / 147;

const FIREBALLS: [number, number, number, number][] = [
  [6, -96, 0, 22],
  [-14, -72, 0.08, 26],
  [22, -60, 0.16, 24],
  [-4, -116, 0.24, 30],
  [-26, -100, 0.3, 24],
  [18, -128, 0.36, 28],
  [0, -84, 0.4, 36],
  [-18, -40, 0.46, 22],
  [24, -36, 0.5, 20],
];
const COLORS = { core: "#fff3b0", mid: "#ffb030", edge: "#e8641a", out: "rgba(150,40,10,0)", vortex: "#d8301c", scrap: "#5d6668", scrapLight: "#a9b3b5" };
const SCRAP: [number, number][] = [[-34, 0], [-26, -8], [-14, -10], [-8, -18], [2, -12], [10, -22], [18, -12], [28, -10], [36, 0]];

const span = (t: number, [a, b]: readonly [number, number]): number => Math.min(1, Math.max(0, (t - a) / (b - a)));

function fireball(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, COLORS.core);
  g.addColorStop(0.45, COLORS.mid);
  g.addColorStop(0.8, COLORS.edge);
  g.addColorStop(1, COLORS.out);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function swirlBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number, alpha: number): void {
  fireball(ctx, x, y, r, alpha);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = COLORS.edge;
  ctx.lineWidth = r * BLAST.swirl;
  ctx.lineCap = "round";
  for (const [k, from, sweep] of [[0.62, 0, 1.3], [0.34, Math.PI, 1.1]] as const) {
    ctx.beginPath();
    ctx.arc(x, y, r * k, angle + from, angle + from + Math.PI * sweep);
    ctx.stroke();
  }
  ctx.restore();
}

function vortexRing(ctx: CanvasRenderingContext2D, cy: number, age: number): void {
  const u = span(age, BLAST.ring);
  if (u <= 0 || u >= 1) return;
  const angle = BLAST.spin * 1.5 * age;
  ctx.save();
  ctx.globalAlpha *= 1 - u;
  ctx.strokeStyle = COLORS.vortex;
  ctx.lineWidth = BLAST.ringWidth * (1 - u * 0.8);
  ctx.lineCap = "round";
  const radius = BLAST.ringRadius * (0.7 + 0.5 * u);
  for (let i = 0; i < 3; i++) {
    const from = angle + (i * 2 * Math.PI) / 3;
    ctx.beginPath();
    ctx.arc(0, cy, radius * (1 - 0.08 * i), from, from + Math.PI * (0.55 - 0.25 * u));
    ctx.stroke();
  }
  ctx.restore();
}

export function drawBlast(ctx: CanvasRenderingContext2D, age: number, facing = 1): void {
  const cy = BLAST.center;
  const angle = facing * BLAST.spin * age;
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  const pull = 1 - 0.85 * span(age, BLAST.pull);
  const alpha = 1 - span(age, BLAST.fade);
  FIREBALLS.forEach(([dx, dy, start, r], i) => {
    const t = age - start;
    if (t < 0 || alpha <= 0) return;
    const [ox, oy] = [facing * dx * BLAST.size, (dy - BLAST.center) * BLAST.size];
    const grow = Math.min(1, t / BLAST.grow) * (1 + 0.4 * (1 - pull));
    swirlBall(ctx, (ox * cos - oy * sin) * pull, cy + (ox * sin + oy * cos) * pull, r * BLAST.size * (0.3 + 0.7 * grow), angle * 1.6 + i, alpha);
  });
  vortexRing(ctx, cy, age);
}

export function drawScrap(ctx: CanvasRenderingContext2D, facing = 1): void {
  ctx.fillStyle = COLORS.scrap;
  ctx.beginPath();
  for (const [dx, dy] of SCRAP) ctx.lineTo(facing * dx, dy);
  ctx.fill();
  ctx.fillStyle = COLORS.scrapLight;
  for (const [dx, dy, w] of [[-12, -9, 6], [8, -18, 4], [20, -10, 5]] as const) ctx.fillRect(facing * dx, dy, w, 2);
}

export function inBlastUnits(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, draw: () => void): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  draw();
  ctx.restore();
}
