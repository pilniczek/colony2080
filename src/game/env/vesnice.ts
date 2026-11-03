import { G } from "./grime";
import { P } from "./paint";

const { rng, color, flat, glow, stroke, shape, line } = P;
const { PI, sin, cos, min, floor } = Math;

type Pt = [number, number];

const simple = (): boolean => P.simple();

const ellipse = (ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, fill: string, edge: string | null = null): void => {
  ctx.fillStyle = color(fill);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
  ctx.fill();
  if (edge) stroke(ctx, edge);
};

export const shadow = (ctx: CanvasRenderingContext2D, cx: number, w: number, alpha = 0.4): void => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ellipse(ctx, cx, -0.4, w / 2, 0.9, "hole");
  ctx.restore();
};

export const smoke = (ctx: CanvasRenderingContext2D, x: number, y: number, t: number, n = 3, h = 22): void => {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const k = (t * 0.35 + i / n) % 1;
    ctx.globalAlpha = 0.22 * (1 - k);
    ellipse(ctx, x + sin(t * 1.3 + i * 2) * 2 + k * 5, y - k * h, 2 + k * 5, 1.6 + k * 3.5, k < 0.3 ? "k1" : "k2");
  }
  ctx.restore();
};

export const spark = (ctx: CanvasRenderingContext2D, x: number, y: number, t: number, seed = 0): void => {
  if (floor(t * 7 + seed) % 4) return;
  const r = rng(floor(t * 7) + seed * 13);
  if (!simple()) glow(ctx, x, y, 5, "y3", 0.8);
  for (let i = 0; i < 4; i++) {
    const a = r() * PI * 2;
    const l = 2 + r() * 3;
    line(ctx, [[x, y], [x + cos(a) * l, y + sin(a) * l]], "y3", 0.5);
  }
};

export const flame = (ctx: CanvasRenderingContext2D, x: number, base: number, w: number, h: number, t: number, seed = 0): void => {
  const f = 0.85 + sin(t * 11 + seed * 2.3) * 0.08 + sin(t * 17.3 + seed) * 0.07;
  const tip = h * f;
  const lean = sin(t * 6 + seed) * w * 0.12;
  const pts = (k: number, s: number): Pt[] => [
    [x + w * (0.5 - s / 2), base],
    [x + w * (0.5 - s / 2) + w * 0.05, base - tip * k * 0.45],
    [x + w / 2 + lean * k - w * s * 0.18, base - tip * k * 0.75],
    [x + w / 2 + lean * k, base - tip * k],
    [x + w / 2 + lean * k + w * s * 0.2, base - tip * k * 0.7],
    [x + w * (0.5 + s / 2) - w * 0.04, base - tip * k * 0.4],
    [x + w * (0.5 + s / 2), base],
  ];
  if (!simple()) glow(ctx, x + w / 2, base - tip * 0.4, w * 1.3, "a1", 0.35);
  shape(ctx, pts(1, 1), "fire0");
  shape(ctx, pts(0.75, 0.7), "fire1");
  shape(ctx, pts(0.45, 0.42), "fire2");
};

export const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, n = 12): Pt[] => {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * PI * 2;
    const k = 0.75 + r() * 0.35;
    return [cx + cos(a) * rx * k, cy + sin(a) * ry * k] as Pt;
  });
};

export const RUIN = ["#4a4840", "#6e6a5c", "#8e8a78", "#aca692", "#1c1a16"] as const;

const BOULDER = ["#2a2620", "#4c463a", "#6e6654", "#968c74", "#b4aa8e"] as const;

export const boulder = (ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, seed: number): void => {
  shape(ctx, blob(cx, cy, rx, ry, seed, 10), BOULDER[1], BOULDER[0]);
  shape(ctx, blob(cx - rx * 0.18, cy - ry * 0.22, rx * 0.72, ry * 0.6, seed + 1, 9), BOULDER[2]);
  shape(ctx, blob(cx - rx * 0.32, cy - ry * 0.4, rx * 0.36, ry * 0.26, seed + 2, 8), BOULDER[3]);
  flat(ctx, cx - rx * 0.4, cy - ry * 0.55, rx * 0.25, 0.8, BOULDER[4]);
  line(ctx, [[cx - rx * 0.6, cy + ry * 0.5], [cx + rx * 0.5, cy + ry * 0.62]], BOULDER[0], 0.8);
};

export const PLANK = ["#24160c", "#3e2814", "#5a3c1e", "#7a5430", "#0e0804"] as const;

export const planks = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, vertical = false): void => {
  const r = rng(seed);
  flat(ctx, x, y, w, h, PLANK[1]);
  if (vertical) {
    for (let px = x; px < x + w; px += 6) {
      flat(ctx, px, y, min(5.4, x + w - px), h, r() < 0.3 ? PLANK[2] : PLANK[1]);
      flat(ctx, px + 5.4, y, 0.6, h, PLANK[4]);
    }
  } else {
    for (let py = y; py < y + h; py += 5) {
      flat(ctx, x, py, w, min(4.4, y + h - py), r() < 0.3 ? PLANK[2] : PLANK[1]);
      flat(ctx, x, py + 4.4, w, 0.6, PLANK[4]);
    }
  }
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed + 1);
  G.dirt(ctx, x, y, w, h, seed + 2, 0.3);
};

export const concreteBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number): void => {
  flat(ctx, x, y, w, h, RUIN[2], RUIN[4]);
  flat(ctx, x, y, w, 1.6, RUIN[3]);
  flat(ctx, x + w - 2, y, 2, h, RUIN[1]);
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed);
};

export const VESNICE_IDS = [
  "sourceTeleport", "targetTeleport", "teleportPad", "brokenTeleport", "fuseBox", "electricCabinet", "cannon", "fireBarricade", "dynamiteWall", "energyBarrier", "powerBridge",
  "bridgeGuardPost", "smoulderingRemains", "smallKey", "walkieTalkie", "detonator", "projectileCrate", "projectile", "fuse", "dynamite", "navCircuit", "toaster", "energyPickup",
  "ammoPickup", "shieldPickup",
] as const;
