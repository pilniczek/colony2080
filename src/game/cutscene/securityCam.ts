import type { Rect } from "../geometry";

const FILM = { w: 1600, h: 900 };
const CAM = {
  date: "2080-03-14",
  start: 23 * 3600 + 41 * 60 + 7,
  fps: 24,
  inset: 80,
  arm: 70,
  grains: 12000,
  grainFrames: 12,
  grainTile: 256,
  grainCap: 40,
  deadPixels: 12,
  deadSeed: 2080,
  dead: ["#000000", "#ffffff", "#ff3b30", "#3bff6a"],
  tint: "#b4c4ac",
  lift: "rgba(40, 52, 44, 0.35)",
  scanline: "rgba(0, 0, 0, 0.22)",
  vignette: "rgba(0, 0, 0, 0.6)",
  text: "#e4eedc",
  rec: "#e23b2e",
  font: "Share Tech Mono, monospace",
};

export function filmRect(w: number, h: number): Rect {
  const s = Math.min(w / FILM.w, h / FILM.h);
  return { x: (w - FILM.w * s) / 2, y: (h - FILM.h * s) / 2, w: FILM.w * s, h: FILM.h * s };
}

const two = (n: number): string => String(n).padStart(2, "0");

export function camClock(t: number): string {
  const s = CAM.start + Math.floor(t);
  return `${CAM.date} ${two(Math.floor(s / 3600) % 24)}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}`;
}

function grainRandom(seed: number): () => number {
  let a = seed + 0x6d2b79f5;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function grade(ctx: CanvasRenderingContext2D, r: Rect): void {
  ctx.globalCompositeOperation = "saturation";
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#808080";
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = CAM.tint;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = CAM.lift;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalCompositeOperation = "source-over";
}

export const grainCount = (r: Rect): number =>
  Math.min(Math.round((CAM.grains * CAM.grainTile * CAM.grainTile) / (r.w * r.h)), Math.floor((CAM.grainTile * CAM.grainTile) / CAM.grainCap));

const grainTiles: { key: string; tiles: HTMLCanvasElement[] } = { key: "", tiles: [] };

function grainTile(index: number, u: number, r: Rect): HTMLCanvasElement {
  const key = `${r.w}x${r.h}`;
  if (grainTiles.key !== key) {
    grainTiles.key = key;
    grainTiles.tiles = [];
  }
  const cached = grainTiles.tiles[index];
  if (cached) return cached;
  const size = CAM.grainTile;
  const tile = document.createElement("canvas");
  tile.width = tile.height = size;
  const c = tile.getContext("2d")!;
  const random = grainRandom(index + 1);
  const speck = Math.max(1, 2 * u);
  const count = grainCount(r);
  for (let i = 0; i < count; i++) {
    const side = speck * (1 + Math.floor(random() * 2));
    c.fillStyle = `rgba(${random() < 0.5 ? "0, 0, 0" : "255, 255, 255"}, ${0.1 + random() * 0.25})`;
    c.fillRect(Math.floor(random() * size), Math.floor(random() * size), side, side);
  }
  grainTiles.tiles[index] = tile;
  return tile;
}

function grain(ctx: CanvasRenderingContext2D, r: Rect, u: number, t: number): void {
  const frame = Math.floor(t * CAM.fps);
  const shift = grainRandom(frame);
  const pattern = ctx.createPattern(grainTile(frame % CAM.grainFrames, u, r), "repeat");
  if (!pattern) return;
  pattern.setTransform(new DOMMatrix().translate(r.x + Math.floor(shift() * CAM.grainTile), r.y + Math.floor(shift() * CAM.grainTile)));
  ctx.fillStyle = pattern;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function scanlines(ctx: CanvasRenderingContext2D, r: Rect, u: number): void {
  ctx.fillStyle = CAM.scanline;
  const line = Math.max(2, 6 * u);
  for (let y = r.y; y < r.y + r.h; y += line) ctx.fillRect(r.x, y, r.w, line / 2);
}

function vignette(ctx: CanvasRenderingContext2D, r: Rect): void {
  const glow = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, r.h * 0.35, r.x + r.w / 2, r.y + r.h / 2, r.w * 0.62);
  glow.addColorStop(0, "rgba(0, 0, 0, 0)");
  glow.addColorStop(1, CAM.vignette);
  ctx.fillStyle = glow;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function deadPixels(ctx: CanvasRenderingContext2D, r: Rect, u: number): void {
  const stuck = grainRandom(CAM.deadSeed);
  const dot = Math.max(1, 4 * u);
  for (let i = 0; i < CAM.deadPixels; i++) {
    ctx.fillStyle = CAM.dead[Math.floor(stuck() * CAM.dead.length)]!;
    ctx.fillRect(Math.round(r.x + stuck() * r.w), Math.round(r.y + stuck() * r.h), dot, dot);
  }
}

function captions(ctx: CanvasRenderingContext2D, r: Rect, u: number, t: number, label: string): void {
  const size = 34 * u;
  const inset = CAM.inset * u;
  const left = r.x + inset;
  const right = r.x + r.w - inset;
  const top = r.y + inset / 2;
  const bottom = r.y + r.h - inset / 2;
  ctx.font = `${size}px ${CAM.font}`;
  ctx.fillStyle = CAM.text;
  const caps = ctx.measureText("REC");
  const lift = (caps.actualBoundingBoxAscent - caps.actualBoundingBoxDescent) / 2;
  const radius = size * 0.32;
  if (Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = CAM.rec;
    ctx.beginPath();
    ctx.arc(right - caps.width - size * 0.3 - radius, top, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CAM.text;
  }
  ctx.fillText(label, left, top + lift);
  ctx.textAlign = "right";
  ctx.fillText("REC", right, top + lift);
  ctx.fillText(camClock(t), right, bottom + lift);
}

function corners(ctx: CanvasRenderingContext2D, r: Rect, u: number): void {
  const inset = CAM.inset * u;
  const arm = CAM.arm * u;
  const x0 = r.x + inset;
  const y0 = r.y + inset;
  const x1 = r.x + r.w - inset;
  const y1 = r.y + r.h - inset;
  ctx.strokeStyle = CAM.text;
  ctx.lineWidth = Math.max(1, 4 * u);
  ctx.lineCap = "square";
  ctx.beginPath();
  for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]] as const) {
    ctx.moveTo(x + dx * arm, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * arm);
  }
  ctx.stroke();
}

export function drawSecurityCam(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, label: string): void {
  const r = filmRect(w, h);
  const u = r.h / FILM.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  grade(ctx, r);
  grain(ctx, r, u, t);
  scanlines(ctx, r, u);
  vignette(ctx, r);
  deadPixels(ctx, r, u);
  captions(ctx, r, u, t, label);
  corners(ctx, r, u);
  ctx.restore();
}
