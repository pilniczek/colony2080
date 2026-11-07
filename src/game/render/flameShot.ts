import { FLAME_LIFE, FLAME_STEPS } from "../robot/flamethrower";

export const FLAME = { grow: 9, base: 2, rise: 9, fade: 20, sway: 0.25, jitter: 0.15, billow: 0.55, spawnTicks: 2 };

const LAYERS: [string, number][] = [
  ["#ac2c0c", 1],
  ["#e86418", 0.82],
  ["#f09024", 0.64],
  ["#fce438", 0.44],
  ["#fcf0c4", 0.24],
];
const BILLOWS: [number, number, number][] = [
  [-0.55, -0.7, 0.6],
  [0.35, -0.55, 0.5],
  [-1.05, -0.2, 0.45],
];

export const flameTravel = (age: number): number => FLAME_STEPS.slice(0, age).reduce((sum, s) => sum + s, 0);

const oval = (ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string): void => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
};

const tongue = (ctx: CanvasRenderingContext2D, x: number, rx: number, ry: number, curl: number, color: string): void => {
  const [tx, ty] = [x - rx * 1.9, -ry * (0.2 + curl)];
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.quadraticCurveTo(x - rx * 0.9, -ry * 1.05, x, -ry);
  ctx.bezierCurveTo(x + rx * 0.75, -ry, x + rx, -ry * 0.45, x + rx, 0);
  ctx.bezierCurveTo(x + rx, ry * 0.6, x + rx * 0.6, ry, x, ry);
  ctx.quadraticCurveTo(x - rx, ry * 0.9, tx, ty);
  ctx.fill();
};

export const drawFlame = (ctx: CanvasRenderingContext2D, age: number, seed: number, simple = false): void => {
  const u = Math.min(1, Math.max(1, age) / FLAME_LIFE);
  const size = 1 + Math.sin(seed * 2.3) * FLAME.jitter;
  const r = (FLAME.base + FLAME.grow * Math.pow(u, 0.8)) * size;
  const curl = 0.3 + 0.3 * Math.sin(seed * 1.3 + age * 0.7);
  const hot = Math.max(1, Math.ceil(LAYERS.length * (1 - 0.7 * u)));
  const layers = LAYERS.slice(0, hot).filter((_, i) => !simple || i % 2 === 0);
  ctx.save();
  ctx.translate(0, -FLAME.rise * u * u + Math.cos(seed * 3.1) * r * FLAME.jitter);
  ctx.rotate(Math.sin(seed * 1.7 + age * 0.9) * FLAME.sway);
  if (age > FLAME.fade) ctx.globalAlpha *= Math.max(0.2, (FLAME_LIFE + 1 - age) / (FLAME_LIFE + 1 - FLAME.fade));
  if (u > FLAME.billow) {
    const k = (u - FLAME.billow) / (1 - FLAME.billow);
    for (const [bx, by, br] of simple ? BILLOWS.slice(0, 1) : BILLOWS) for (const [color, f] of layers.slice(0, 2)) oval(ctx, bx * r, by * r * k, br * r * f * k, br * r * f * 0.8 * k, color);
  }
  for (const [color, k] of layers) tongue(ctx, r * 0.3 * (1 - k), r * 1.15 * k, r * 0.8 * k, curl, color);
  ctx.restore();
};

export const drawFlameStream = (ctx: CanvasRenderingContext2D, tick: number, simple = false): void => {
  for (let k = Math.max(0, Math.ceil((tick - FLAME_LIFE + 1) / FLAME.spawnTicks) * FLAME.spawnTicks); k <= tick; k += FLAME.spawnTicks) {
    const age = tick - k + 1;
    ctx.save();
    ctx.translate(flameTravel(age), 0);
    drawFlame(ctx, age, k, simple);
    ctx.restore();
  }
};
