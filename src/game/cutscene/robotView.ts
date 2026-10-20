import type { Rect } from "../geometry";
import { filmRect } from "./securityCam";

const FILM = { w: 1600, h: 900 };
const VIEW = {
  fps: 24,
  seed: 2080,
  tint: "#ff2414",
  lift: "rgba(60, 0, 0, 0.5)",
  flicker: [0.16, 0.22] as const,
  band: "rgba(255, 70, 40, 0.1)",
  bandSpeed: 0.3,
  scanline: "rgba(0, 0, 0, 0.32)",
  scanStep: 4,
  vignette: "rgba(10, 0, 0, 0.9)",
  plate: "rgba(16, 0, 0, 0.55)",
  hud: "#ff4a32",
  hot: "#ffe8de",
  dim: "rgba(255, 120, 96, 0.7)",
  font: "Share Tech Mono, monospace",
  inset: 56,
  tape: [560, 1040, 52] as const,
  readout: [1300, 210, 15, 30] as const,
  readoutRate: 7,
  target: [800, 470, 120] as const,
  words: ["SCAN", "MATCH", "TRACE", "RANGE", "LOCK", "PARSE", "ID", "VECTOR", "MASS", "GRIP", "SYNC", "THERM"],
};

function random(seed: number): () => number {
  let a = seed + 0x6d2b79f5;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (rnd: () => number, n: number): string => Math.floor(rnd() * 16 ** n).toString(16).toUpperCase().padStart(n, "0");

export function readoutLine(index: number): string {
  const rnd = random(VIEW.seed * 31 + index);
  const word = VIEW.words[Math.floor(rnd() * VIEW.words.length)]!;
  const kind = Math.floor(rnd() * 3);
  if (kind === 0) return `${hex(rnd, 4)} ${word.padEnd(6)} ${hex(rnd, 2)}`;
  if (kind === 1) return `${word.padEnd(6)} ${(rnd() * 100).toFixed(1).padStart(5)}%`;
  return `>${hex(rnd, 3)}:${hex(rnd, 3)} ${rnd() < 0.5 ? "OK" : "--"}`;
}

function grade(ctx: CanvasRenderingContext2D, r: Rect): void {
  ctx.globalCompositeOperation = "color";
  ctx.fillStyle = VIEW.tint;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = VIEW.lift;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalCompositeOperation = "source-over";
}

function flicker(ctx: CanvasRenderingContext2D, r: Rect, u: number, t: number): void {
  const rnd = random(Math.floor(t * VIEW.fps));
  const [lo, hi] = VIEW.flicker;
  ctx.fillStyle = `rgba(0, 0, 0, ${(lo + rnd() * (hi - lo)).toFixed(3)})`;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  const band = 120 * u;
  const y = r.y - band + ((t * VIEW.bandSpeed) % 1) * (r.h + band);
  const glow = ctx.createLinearGradient(0, y, 0, y + band);
  glow.addColorStop(0, "rgba(255, 70, 40, 0)");
  glow.addColorStop(0.5, VIEW.band);
  glow.addColorStop(1, "rgba(255, 70, 40, 0)");
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = glow;
  ctx.fillRect(r.x, y, r.w, band);
  ctx.globalCompositeOperation = "source-over";
}

function scanlines(ctx: CanvasRenderingContext2D, r: Rect, u: number): void {
  ctx.fillStyle = VIEW.scanline;
  const line = Math.max(2, VIEW.scanStep * u);
  for (let y = r.y; y < r.y + r.h; y += line) ctx.fillRect(r.x, y, r.w, line / 2);
}

function vignette(ctx: CanvasRenderingContext2D, r: Rect): void {
  const glow = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, r.h * 0.3, r.x + r.w / 2, r.y + r.h / 2, r.w * 0.6);
  glow.addColorStop(0, "rgba(10, 0, 0, 0)");
  glow.addColorStop(1, VIEW.vignette);
  ctx.fillStyle = glow;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function tape(ctx: CanvasRenderingContext2D, r: Rect, u: number, t: number): void {
  const [a, b, step] = VIEW.tape;
  const x0 = r.x + a * u;
  const x1 = r.x + b * u;
  const y = r.y + (VIEW.inset + 4) * u;
  const shift = (t * 23) % step;
  ctx.strokeStyle = VIEW.hud;
  ctx.lineWidth = Math.max(1, 2 * u);
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.font = `${14 * u}px ${VIEW.font}`;
  ctx.fillStyle = VIEW.hud;
  ctx.textAlign = "center";
  const first = Math.floor((t * 23) / step);
  for (let i = 0; a + i * step - shift <= b; i++) {
    const x = x0 + (i * step - shift) * u;
    if (x < x0) continue;
    const major = (first + i) % 2 === 0;
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + (major ? 16 : 8) * u);
    if (major) ctx.fillText(String(((first + i) * 5) % 360).padStart(3, "0"), x, y + 34 * u);
  }
  ctx.stroke();
  const mid = (x0 + x1) / 2;
  ctx.fillStyle = VIEW.hot;
  ctx.beginPath();
  ctx.moveTo(mid, y - 2 * u);
  ctx.lineTo(mid - 8 * u, y - 14 * u);
  ctx.lineTo(mid + 8 * u, y - 14 * u);
  ctx.closePath();
  ctx.fill();
}

function readout(ctx: CanvasRenderingContext2D, r: Rect, u: number, t: number): void {
  const [x, y, rows, lineH] = VIEW.readout;
  const flow = t * VIEW.readoutRate;
  const first = Math.floor(flow);
  const lift = (flow - first) * lineH;
  const px = r.x + (x - 16) * u;
  const py = r.y + (y - 6) * u;
  const pw = 210 * u;
  const ph = (rows * lineH + 22) * u;
  ctx.fillStyle = VIEW.plate;
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = VIEW.hud;
  ctx.lineWidth = Math.max(1, 2 * u);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px, py + ph);
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.font = `${20 * u}px ${VIEW.font}`;
  ctx.textAlign = "left";
  for (let i = 0; i < rows; i++) {
    const age = rows - 1 - i;
    ctx.fillStyle = age === 0 ? VIEW.hot : age < 4 ? VIEW.hud : VIEW.dim;
    ctx.fillText(readoutLine(first + i), r.x + x * u, r.y + (y + i * lineH + lineH - lift) * u);
  }
  ctx.restore();
}

function target(ctx: CanvasRenderingContext2D, r: Rect, u: number, t: number): void {
  const [tx, ty, size] = VIEW.target;
  const settle = Math.min(1, t / 1.2);
  const wobble = 1 - settle * 0.85;
  const cx = r.x + (tx + Math.sin(t * 2.3) * 60 * wobble) * u;
  const cy = r.y + (ty + Math.cos(t * 1.7) * 40 * wobble) * u;
  const s = size * u * (1.6 - 0.6 * settle);
  const k = s * 0.3;
  ctx.strokeStyle = VIEW.hud;
  ctx.lineWidth = Math.max(1, 2.5 * u);
  ctx.beginPath();
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    ctx.moveTo(cx + dx * s, cy + dy * (s - k));
    ctx.lineTo(cx + dx * s, cy + dy * s);
    ctx.lineTo(cx + dx * (s - k), cy + dy * s);
  }
  ctx.moveTo(cx - s * 0.5, cy);
  ctx.lineTo(cx - s * 0.15, cy);
  ctx.moveTo(cx + s * 0.15, cy);
  ctx.lineTo(cx + s * 0.5, cy);
  ctx.moveTo(cx, cy - s * 0.5);
  ctx.lineTo(cx, cy - s * 0.15);
  ctx.moveTo(cx, cy + s * 0.15);
  ctx.lineTo(cx, cy + s * 0.5);
  ctx.stroke();
  ctx.strokeStyle = VIEW.dim;
  ctx.beginPath();
  const spin = t * 1.4;
  for (let i = 0; i < 4; i++) {
    const a = spin + (i * Math.PI) / 2;
    ctx.moveTo(cx + Math.cos(a) * s * 0.7, cy + Math.sin(a) * s * 0.7);
    ctx.arc(cx, cy, s * 0.7, a, a + 0.9);
  }
  ctx.stroke();
  const match = Math.min(99.7, settle * 99.7);
  ctx.font = `${18 * u}px ${VIEW.font}`;
  ctx.textAlign = "left";
  ctx.fillStyle = VIEW.hot;
  ctx.fillText(settle < 1 ? "ANALYSIS" : "MATCH", cx + s + 14 * u, cy - s + 14 * u);
  ctx.fillText(`${match.toFixed(1)}%`, cx + s + 14 * u, cy - s + 38 * u);
  ctx.fillStyle = VIEW.dim;
  ctx.fillRect(cx + s + 14 * u, cy - s + 48 * u, 90 * u, 3 * u);
  ctx.fillStyle = VIEW.hot;
  ctx.fillRect(cx + s + 14 * u, cy - s + 48 * u, 90 * u * settle, 3 * u);
}

export function drawRobotView(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const r = { x: 0, y: 0, w, h };
  const stage = filmRect(w, h);
  const u = stage.h / FILM.h;
  ctx.save();
  grade(ctx, r);
  flicker(ctx, r, u, t);
  scanlines(ctx, r, u);
  vignette(ctx, r);
  tape(ctx, stage, u, t);
  readout(ctx, stage, u, t);
  target(ctx, stage, u, t);
  ctx.restore();
}
