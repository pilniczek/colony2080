import { TOASTER_CYCLE } from "../robot/toaster";

export const SHOT = { cycle: TOASTER_CYCLE, step: 24, lead: 12, frames: 6 };

const BALL: [string, number, number, number][] = [
  ["#ac2c0c", 7.5, 5, 0],
  ["#c8300c", 7, 4.4, 0],
  ["#e86418", 6.4, 3.8, 0.4],
  ["#f09024", 5.6, 3.2, 0.8],
  ["#f4b82c", 4.8, 2.6, 1.2],
  ["#fce438", 3.8, 2, 1.6],
  ["#fcf0c4", 2.4, 1.1, 2],
];
const SIMPLE_BALL = BALL.filter((_, i) => i % 2 === 0);
const TAIL: [string, number, number][] = [
  ["#ac2c0c", 2.4, 1.8],
  ["#e86418", 1.4, 1],
];

const oval = (ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string): void => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
};

const ball = (ctx: CanvasRenderingContext2D, x: number, y: number, simple: boolean): void => {
  for (const [color, rx, ry] of TAIL) oval(ctx, x - 10, y - 0.6, rx, ry, color);
  for (const [color, rx, ry, ahead] of simple ? SIMPLE_BALL : BALL) oval(ctx, x + ahead, y, rx, ry, color);
};

const flash = (ctx: CanvasRenderingContext2D, simple: boolean): void => {
  ctx.save();
  ctx.globalAlpha = 0.55;
  oval(ctx, 2, 0, 6, 4, "#f09024");
  ctx.globalAlpha = 1;
  oval(ctx, 2, 0, simple ? 3 : 2.6, simple ? 2 : 1.6, "#fcf0c4");
  ctx.restore();
};

export const shotFrame = (tick: number): number => (tick % SHOT.cycle) - 1;

export const drawToasterShot = (ctx: CanvasRenderingContext2D, length: number, tick: number, simple = false): void => {
  const f = shotFrame(tick);
  if (f < 0) return;
  const x = SHOT.lead + f * SHOT.step;
  if (f === 0) flash(ctx, simple);
  if (x <= length) ball(ctx, x, 0, simple);
};

const SIGHT = { r: 4, side: 3, tick: 1.4, post: [5.2, 1.8], dot: 0.45, width: 0.7, idle: ["#e86418", 0.4], hit: ["#fce438", 0.9] } as const;

export const drawToasterSight = (ctx: CanvasRenderingContext2D, hit = false, simple = false): void => {
  const [color, alpha] = hit ? SIGHT.hit : SIGHT.idle;
  const { r, side, tick, post, dot } = SIGHT;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = simple ? SIGHT.width * 1.4 : SIGHT.width;
  ctx.beginPath();
  ctx.moveTo(-r + tick, -side);
  ctx.lineTo(-r, -side);
  ctx.lineTo(-r, 0);
  ctx.arc(0, 0, r, Math.PI, 0, true);
  ctx.lineTo(r, -side);
  ctx.lineTo(r - tick, -side);
  ctx.moveTo(0, -post[0]);
  ctx.lineTo(0, -post[1]);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, dot, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};
