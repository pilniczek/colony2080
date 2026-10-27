import { SHIP } from "./buildings";
import { G } from "./grime";
import { P, type EnvAsset } from "./paint";

const { rng, path, color, flat, box, poly, cylV, disc, rivets, stroke, tones } = P;
const { PI, sin, cos, atan2, hypot } = Math;

type Pt = [number, number];
type Tones = [string, string, string, string];

const ROCK: Tones = ["k0", "k2", "c1", "c2"];
const LIGHT: Pt = [-0.6, -0.8];

export const facets = (ctx: CanvasRenderingContext2D, pts: Pt[], cx: number, cy: number, tones: Tones, line: string): void => {
  const t = tones.map(color) as Tones;
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length] as Pt;
    const nx = b[1] - a[1];
    const ny = a[0] - b[0];
    const n = hypot(nx, ny) || 1;
    const d = (nx * LIGHT[0] + ny * LIGHT[1]) / n;
    ctx.fillStyle = d > 0.6 ? t[3] : d > 0.05 ? t[2] : d > -0.55 ? t[1] : t[0];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = P.lw(ctx, 0.6);
    ctx.stroke();
  });
  path(ctx, pts);
  stroke(ctx, line);
};

const rock = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, seed: number, shades: Tones = ROCK): void => {
  const rnd = rng(seed);
  const n = 5 + Math.floor(rnd() * 3);
  const a0 = rnd() * PI;
  const pts: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = a0 + (i * 2 * PI) / n + (rnd() - 0.5) * 0.5;
    const k = r * (0.75 + rnd() * 0.3);
    return [cx + cos(a) * k, cy + sin(a) * k * 0.82];
  });
  facets(ctx, pts, cx + r * 0.22, cy + r * 0.16, shades, "kLine");
  G.grain(ctx, G.polyRegion(ctx, pts), seed + 200);
  G.grain(ctx, G.polyRegion(ctx, pts), seed + 300, 0.7);
};

const clipped = (ctx: CanvasRenderingContext2D, pts: Pt[], draw: () => void): void => {
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  draw();
  ctx.restore();
};

const scuff = (ctx: CanvasRenderingContext2D, x: number, w: number): void => {
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = color("hole");
  ctx.beginPath();
  ctx.ellipse(x + w / 2, -0.5, w / 2, 0.9, 0, 0, PI * 2);
  ctx.fill();
  ctx.restore();
  if (P.simple()) return;
  for (const [dx, s] of [[0.15, 1], [0.55, 0.8], [0.8, 1.2]] as Pt[]) flat(ctx, x + w * dx, -1.4 * s, s, s * 0.8, "k2");
};

interface CelOptions {
  line?: string;
  lit?: number;
  dark?: number;
}

const cel = (ctx: CanvasRenderingContext2D, pts: Pt[], shades: string[], { line = "#0a0806", lit = 0.3, dark = 0.3 }: CelOptions = {}): void => {
  const [c0, c1, c2, c3] = shades as Tones;
  const ys = pts.map((p) => p[1]);
  const xs = pts.map((p) => p[0]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const h = y1 - y0;
  path(ctx, pts);
  ctx.fillStyle = color(c1);
  ctx.fill();
  ctx.save();
  ctx.clip();
  flat(ctx, x0, y0, x1 - x0, h * lit, c2);
  if (!P.simple()) flat(ctx, x0, y0, x1 - x0, h * lit * 0.35, c3);
  flat(ctx, x0, y1 - h * dark, x1 - x0, h * dark, c0);
  ctx.restore();
  path(ctx, pts);
  stroke(ctx, line);
};

const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 8): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + cos(a) * rx, cy + sin(a) * ry] as Pt;
  });

const blood = (ctx: CanvasRenderingContext2D, x: number, w: number, h = 1.6): void => {
  ctx.fillStyle = color("blood");
  ctx.beginPath();
  ctx.ellipse(x + w / 2, -h / 2, w / 2, h / 2, 0, 0, PI * 2);
  ctx.fill();
};

interface HumanOptions {
  flip?: boolean;
  suit?: string[];
  breathe?: number;
  arm?: number;
  pocket?: ((ctx: CanvasRenderingContext2D) => void) | null;
}

const lyingHuman = (ctx: CanvasRenderingContext2D, x: number, { flip = false, suit = tones("jacket"), breathe = 0, arm = 0, pocket = null }: HumanOptions = {}): void => {
  ctx.save();
  ctx.translate(x, 0);
  if (flip) {
    ctx.translate(42, 0);
    ctx.scale(-1, 1);
  }
  const b = breathe;
  cel(ctx, [[0, 0], [0.4, -3.6], [2.4, -5.2], [5.2, -4.6], [5.6, 0]], tones("boot"));
  cel(ctx, [[4.6, 0], [4.8, -4.4], [11, -6.6], [15, -6], [20.5, -6.4], [21.5, 0]], tones("denim"));
  if (!P.simple()) flat(ctx, 13, -4.4, 6.5, 0.5, "den0");
  cel(ctx, [[19.5, 0], [19.5, -6.6], ...arc(28, -6.4, 8.4, 3.4 + b, PI, PI * 1.85), [36, -5.6], [36, 0]], suit);
  if (pocket) pocket(ctx);
  ctx.save();
  ctx.translate(33.5, -7.6 - b);
  ctx.rotate(arm);
  cel(ctx, [[0, -1.4], [-7.5, -2.2], [-8.6, -0.4], [-7.6, 1.2], [0, 1.4]], suit);
  cel(ctx, [[-7.4, -1.8], [-11.4, -1.2], ...arc(-11.4, -0.2, 1.2, 1.1, PI * 1.5, PI * 0.5, 4), [-7.6, 1.2]], tones("skin"));
  ctx.restore();
  cel(ctx, [[35.4, -5.4], [37.2, -5.8], [37.6, -1], [35.4, -0.6]], tones("skin"), { lit: 0.2 });
  cel(ctx, arc(40, -3.7, 3.5, 3.6, 0, PI * 2, 14), tones("skin"));
  cel(ctx, [...arc(40, -3.7, 3.5, 3.6, -PI * 0.42, PI * 0.42, 6), [41.6, -2.4], [42, -4.4], [41.4, -6]], tones("hair"), { lit: 0.25 });
  if (!P.simple()) poly(ctx, [[37.4, -6.4], [37.6, -7.6], [38.8, -7]], "skin2", 2, { line: false });
  ctx.restore();
};

const girder = (ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, w: number, seed: number): void => {
  const len = hypot(bx - ax, by - ay);
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(atan2(by - ay, bx - ax));
  box(ctx, 0, -w / 2, len, w, "rust", 2);
  flat(ctx, w * 0.3, -w * 0.18, len - w * 0.6, w * 0.36, "r1");
  G.grain(ctx, G.rectRegion(ctx, 0, -w / 2, len, w), seed);
  G.rustPatch(ctx, len * 0.55, 0, w * 0.5, w * 0.25, seed + 1);
  G.chips(ctx, 0, -w / 2, len, seed + 2, G.DIRT);
  rivets(ctx, 0, -w * 0.36, len, 4, "r3");
  poly(ctx, [[len, -w / 2], [len + w * 0.3, -w * 0.2], [len - w * 0.1, w * 0.1], [len + w * 0.2, w / 2], [len, w / 2]], "rust", 1);
  ctx.restore();
};

const drum = (ctx: CanvasRenderingContext2D, x: number, w: number, h: number): void => {
  const simple = P.simple();
  cylV(ctx, x, -h, w, h, "chrome", 1);
  const step = simple ? h / 4 : h / 8;
  for (let y = -h + step; y < -1; y += step) flat(ctx, x + 0.4, y - 0.6, w - 0.8, 1.2, "c0");
  for (const y of [-h + 1, -h * 0.5, -2]) cylV(ctx, x - 0.6, y - 1.2, w + 1.2, 2.4, "chrome", 2);
  poly(ctx, [[x, -h], [x + w, -h], [x + w - 1, -h - 2], [x + 1, -h - 2]], "chrome", 2);
  G.grain(ctx, G.rectRegion(ctx, x - 0.6, -h - 2, w + 1.2, h + 2), 51);
  G.grain(ctx, G.rectRegion(ctx, x - 0.6, -h - 2, w + 1.2, h + 2), 52, 0.8);
  G.rustPatch(ctx, x + w * 0.65, -h * 0.3, 3.5, 2, 53);
  G.rustPatch(ctx, x + w * 0.25, -h * 0.7, 2.2, 1.4, 54);
  G.drips(ctx, x + 1, -h + 2, w - 2, h * 0.45, 55, 3);
  G.dirt(ctx, x - 0.6, -h, w + 1.2, h, 56, 0.45);
  G.chips(ctx, x - 0.6, -h * 0.5 - 1.2, w + 1.2, 57, G.DIRT);
};

export const barrel: EnvAsset = {
  id: "barrel",
  box: [-4, -34, 34, 0],
  draw(ctx) {
    drum(ctx, 3, 22, 29);
  },
};

export const dyingRebel: EnvAsset = {
  id: "dyingRebel",
  box: [-2, -16, 46, 0],
  anim: true,
  draw(ctx, state, t) {
    const dying = state === 0;
    blood(ctx, 14, dying ? 18 : 28, dying ? 1.4 : 2);
    lyingHuman(ctx, 0, {
      breathe: dying ? 0.45 + sin(t * 2.4) * 0.45 : 0,
      arm: dying ? 0.12 + sin(t * 1.3) * 0.08 + sin(t * 11) * 0.02 : 0,
    });
  },
};

export const corpse: EnvAsset = {
  id: "corpse",
  box: [-2, -14, 50, 0],
  draw(ctx, state) {
    blood(ctx, 4, 34, 1.8);
    lyingHuman(ctx, 4, {
      flip: true,
      suit: tones("denim"),
      arm: state ? 0.28 : 0,
      pocket: state
        ? (c) => flat(c, 25, -6.6, 4, 2.6, "hole")
        : (c) => {
            flat(c, 25.5, -8.6, 3, 2.4, "c3", "mLine");
            if (!P.simple()) flat(c, 26, -8, 2, 0.4, "neon");
            disc(c, 30.5, -5.5, 0.9, "plasma");
            P.glow(c, 30.5, -5.5, 3.5, "plasma", 0.5);
          },
    });
  },
};

export const crowbar: EnvAsset = {
  id: "crowbar",
  box: [-2, -8, 28, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 2, 22);
    poly(ctx, [[0.4, -1.2], [1.6, -2.4], [20.6, -2.4], [23.2, -6.4], [25.2, -6.9], [25.9, -5.9], [22.6, -0.6], [1.6, -0.6]], "chrome", 1);
    if (P.simple()) return;
    flat(ctx, 2, -2.1, 18.4, 0.4, "c3");
    ctx.beginPath();
    ctx.moveTo(24.7, -6.6); ctx.lineTo(23.5, -4.6);
    stroke(ctx, "mLine");
  }
};

const EBLASTER_K = 0.058;
const EBLASTER_PARTS: [number, number, number, number, string, number?][] = [
  [-14, -14, 26, 56, "steel", 1], [-78, -60, 20, 42, "steel", 0], [-44, -90, 92, 22, "steel", 1], [-34, -86, 72, 10, "den2"],
  [-60, -72, 130, 62, "chrome", 1], [-14, -72, 12, 62, "den1"], [14, -10, 46, 34, "steel", 0], [22, -2, 30, 8, "den2"],
  [70, -58, 152, 36, "chrome", 2], [70, -44, 152, 8, "plasma"],
  [84, -66, 12, 52, "steel", 0], [114, -66, 12, 52, "steel", 0], [145, -66, 12, 52, "steel", 0], [176, -66, 12, 52, "steel", 0],
  [214, -74, 14, 68, "steel", 0], [218, -74, 48, 12, "chrome", 1], [218, -18, 48, 12, "chrome", 1],
];
const EBLASTER_ARC: Pt[] = [[260, -62], [268, -54], [262, -46], [270, -40], [262, -34], [268, -26], [260, -18]];
const eblasterAt = ([x, y]: Pt): Pt => [(x + 78) * EBLASTER_K - 1, (y - 42) * EBLASTER_K];

export const eBlaster: EnvAsset = {
  id: "eBlaster",
  box: [-2, -10, 24, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 1, 20);
    for (const [x, y, w, h, mat, tone] of EBLASTER_PARTS) {
      const [px, py] = eblasterAt([x, y]);
      if (tone === undefined) flat(ctx, px, py, w * EBLASTER_K, h * EBLASTER_K, mat);
      else box(ctx, px, py, w * EBLASTER_K, h * EBLASTER_K, mat, tone);
    }
    const arc = EBLASTER_ARC.map(eblasterAt);
    P.line(ctx, arc, "den1", 0.7);
    P.line(ctx, arc, "plasmaCore", P.simple() ? 0.3 : 0.22);
    P.glow(ctx, ...eblasterAt([268, -40]), 3, "plasma", 0.45);
  }
};

export const craneKey: EnvAsset = {
  id: "craneKey",
  box: [-2, -6, 12, 0],
  draw(ctx, state) {
    if (state === 2) return scuff(ctx, 0, 10);
    ctx.save();
    ctx.translate(0, -1.4);
    ctx.beginPath();
    ctx.arc(2.2, -1.2, 2.2, 0, PI * 2);
    ctx.arc(1.6, -1.4, 0.6, 0, PI * 2, true);
    ctx.fillStyle = color("c1");
    ctx.fill("evenodd");
    stroke(ctx, "mLine");
    box(ctx, 4, -1.9, 5.6, 1.4, "chrome", 2);
    poly(ctx, [[7, -0.5], [7.8, -0.5], [7.8, 1], [7, 1]], "chrome", 1);
    poly(ctx, [[8.6, -0.5], [9.6, -0.5], [9.6, 1.4], [8.6, 1.4]], "chrome", 1);
    ctx.restore();
  }
};

export const shipPart: EnvAsset = {
  id: "shipPart",
  box: [-2, -13, 20, 0],
  draw(ctx, state) {
    if (state === 0) return;
    if (state === 2) return scuff(ctx, 1, 16);
    poly(ctx, [[0, 0], [3, -2.6], [19, -2.6], [16, 0]], "chrome", 1);
    box(ctx, 2.2, -10, 1.6, 8.6, "chrome", 2, { vertical: true });
    box(ctx, 3.8, -8.4, 10, 5.6, "chrome", 2);
    for (let x = 5.4; x < 13.5; x += P.simple() ? 3.2 : 1.6) flat(ctx, x, -8.4, 0.45, 5.6, "c0");
    if (!P.simple()) flat(ctx, 3.8, -7.4, 10, 0.5, "c3");
    flat(ctx, 3.8, -10, 10, 0.6, "c1", "mLine");
    box(ctx, 13.8, -11, 2, 9.6, "chrome", 1, { vertical: true });
    for (const y of [-9.4, -4] as const) disc(ctx, 14.8, y, 0.55, "c3", "mLine");
    ctx.save();
    ctx.lineCap = "round";
    for (const [x, top] of [[6.4, -12.2], [9.2, -12.6]] as const) {
      ctx.beginPath();
      ctx.moveTo(x, -8.4);
      ctx.bezierCurveTo(x, top, 13.4, top, 14.4, -10.6);
      ctx.strokeStyle = color("aLine");
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.strokeStyle = color("neon");
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
    ctx.restore();
  }
};

export const controller: EnvAsset = {
  id: "controller",
  box: [-2, -10, 18, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 1, 14);
    box(ctx, 0, -9, 16, 9, "rust", 0);
    flat(ctx, 0, -9, 16, 0.8, "r3");
    flat(ctx, 2, -8, 12, 7, "hole", "mLine");
    poly(ctx, [[5.5, -7], [8.5, -2], [2.5, -2]], "a1", 2);
    for (const [y, c] of [[-6.2, "y2"], [-3.6, "c2"]] as const) flat(ctx, 9.5, y, 4, 0.8, c);
  }
};

export const wires: EnvAsset = {
  id: "wires",
  box: [-2, -10, 22, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 20);
    const curve = () => {
      ctx.beginPath();
      ctx.moveTo(2, -1.4);
      ctx.bezierCurveTo(8, -3, 10, -8.6, 15, -7.4);
      ctx.bezierCurveTo(17.4, -6.8, 17.6, -5, 16.6, -3.6);
    };
    ctx.save();
    ctx.lineCap = "round";
    curve();
    ctx.strokeStyle = color("aLine");
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.strokeStyle = color("a1");
    ctx.lineWidth = 1.4;
    ctx.stroke();
    if (!P.simple()) {
      ctx.translate(-0.2, -0.35);
      curve();
      ctx.strokeStyle = color("a3");
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = color("c2");
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(2, -1.4); ctx.lineTo(0, -0.8);
    ctx.moveTo(16.6, -3.6); ctx.lineTo(16, -2);
    ctx.stroke();
    ctx.restore();
  }
};

export const tapHandle: EnvAsset = {
  id: "tapHandle",
  box: [-2, -12, 14, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 12);
    box(ctx, 5.4, -9.6, 1.2, 9.2, "chrome", 1, { vertical: true });
    box(ctx, 0.6, -5.6, 10.8, 1.2, "chrome", 1);
    ctx.beginPath();
    ctx.ellipse(6, -5, 5.6, 5, 0, 0, PI * 2);
    ctx.ellipse(6, -5, 4.3, 3.8, 0, 0, PI * 2);
    ctx.fillStyle = color("c1");
    ctx.fill("evenodd");
    stroke(ctx, "mLine");
    if (!P.simple()) {
      ctx.beginPath();
      ctx.ellipse(6, -5, 4.95, 4.4, 0, PI * 1.05, PI * 1.7);
      ctx.strokeStyle = color("c3");
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    disc(ctx, 6, -5, 1.8, "c0", "mLine");
  }
};

export const card: EnvAsset = {
  id: "card",
  box: [-2, -9, 16, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 14);
    poly(ctx, [[0, 0], [1.6, -7.6], [13.6, -7.6], [12, 0]], "chrome", 1);
    poly(ctx, [[4.6, 0], [6.2, -7.6], [9, -7.6], [7.4, 0]], "a1", 2, { line: false });
    poly(ctx, [[0.3, -1.4], [0.6, -2.8], [7.6, -2.8], [7.3, -1.4]], "a1", 2, { line: false });
    poly(ctx, [[0.6, -2.8], [1.6, -7.6], [6.2, -7.6], [5.2, -2.8]], "c2", 2, { line: false });
    poly(ctx, [[1.8, -3.6], [2.1, -5], [3.9, -5], [3.6, -3.6]], "y1", 2, { line: false });
    path(ctx, [[0, 0], [1.6, -7.6], [13.6, -7.6], [12, 0]]);
    stroke(ctx, "mLine");
    if (P.simple()) return;
    poly(ctx, [[1.4, -5.4], [1.6, -6.4], [3.4, -6.4], [3.2, -5.4]], "y0", 2, { line: false });
    ctx.strokeStyle = color("mLine");
    ctx.lineWidth = 0.25;
    ctx.beginPath();
    for (let x = 9.8; x < 12.6; x += 0.5) { ctx.moveTo(x + 0.6, -6.8); ctx.lineTo(x + 0.2, -5); }
    ctx.stroke();
    flat(ctx, 9.4, -4, 2.6, 0.4, "c0");
    flat(ctx, 9.2, -3, 2.4, 0.4, "c0");
  }
};

export const holoPlan: EnvAsset = {
  id: "holoPlan",
  box: [-2, -14, 14, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 12);
    poly(ctx, [[1, -8], [3, -10], [11, -10], [9, -8]], "c3", 2);
    poly(ctx, [[9, -8], [11, -10], [11, -2], [9, 0]], "rust", 1);
    box(ctx, 1, -8, 8, 8, "rust", 2);
    flat(ctx, 1, -8.6, 8, 0.6, "water");
    poly(ctx, [[9, -8.6], [11, -10.6], [11, -10], [9, -8]], "water", 2, { line: false });
    for (let x = 2.4; x < 8.5; x += P.simple() ? 3 : 1.8) flat(ctx, x, -6.6, 0.9, 5.6, "r0");
    if (!P.simple()) P.glow(ctx, 6, -10.5, 5, "plasma", 0.3);
  }
};

const PLAN = { x: 4.3, y: -6.9, k: 0.068 };

const shipSketch = (ctx: CanvasRenderingContext2D): void => {
  const { HULL, WING, COCKPIT, DOOR } = SHIP;
  ctx.save();
  ctx.translate(PLAN.x, PLAN.y);
  ctx.scale(PLAN.k, PLAN.k);
  ctx.lineWidth /= PLAN.k;
  ctx.beginPath();
  for (const [first, ...rest] of [HULL, WING, COCKPIT]) {
    ctx.moveTo(...(first as Pt));
    for (const p of rest) ctx.lineTo(...p);
    ctx.closePath();
  }
  if (!P.simple()) {
    const [x, y, w, h] = DOOR;
    ctx.moveTo(x, y + h); ctx.lineTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h);
    ctx.moveTo(4, -32); ctx.lineTo(150, -32); ctx.lineTo(186, -22);
  }
  ctx.stroke();
  ctx.restore();
};

export const shipPlan: EnvAsset = {
  id: "shipPlan",
  box: [-2, -14, 22, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 20);
    poly(ctx, [[0, 0], [2.4, -12], [19, -12.4], [20, 0]], "c2", 2, { dir: [1, 0] });
    ctx.save();
    ctx.strokeStyle = color("m1");
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    shipSketch(ctx);
    ctx.beginPath();
    ctx.moveTo(15.4, -6.4); ctx.lineTo(15.8, -1.6);
    ctx.moveTo(13, -4.6); ctx.lineTo(15.6, -3.6); ctx.lineTo(18.4, -4.6);
    if (!P.simple()) {
      ctx.moveTo(2.8, -2); ctx.quadraticCurveTo(3.4, -5.6, 6, -6);
      for (const x of [7.4, 10] as const) { ctx.rect(x, -6, 1.6, 4.4); ctx.moveTo(x + 0.8, -6); ctx.lineTo(x + 0.8, -1.6); }
      ctx.moveTo(2.6, -7); ctx.lineTo(18.6, -7.2);
    }
    ctx.stroke();
    ctx.restore();
  }
};

export const decoder: EnvAsset = {
  id: "decoder",
  box: [-2, -10, 16, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 14);
    box(ctx, 3, -2.6, 6, 2.6, "chrome", 1);
    poly(ctx, [[0, -2.6], [1.2, -8], [13, -8], [14, -2.6]], "chrome", 1);
    box(ctx, 0, -4, 14, 1.4, "chrome", 0);
    flat(ctx, 1.8, -7.4, 3.4, 1.8, "neon", "mLine");
    for (let x = 6; x < 10.5; x += P.simple() ? 2.2 : 1.1) flat(ctx, x, -6.6, 0.6, 2.4, "c3", "mLine");
    disc(ctx, 11.6, -6.6, 0.55, "screen");
    disc(ctx, 12.6, -5.6, 0.55, "a2");
  }
};

export const crate: EnvAsset = {
  id: "crate",
  box: [-2, -30, 34, 0],
  draw(ctx) {
    box(ctx, 1, -25, 26, 25, "brick", 1);
    box(ctx, 0, -27, 28, 2.6, "brick", 3);
    const cols = P.simple() ? 5 : 7;
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const w = 20 / cols;
        flat(ctx, 4 + c * w + w * 0.2, -21.5 + r * 5, w * 0.6, 3.4, "hole");
      }
    }
    G.surface(ctx, 1, -25, 26, 25, 58, { rise: 0.4, drip: 3, dripLen: 12 });
    G.rustPatch(ctx, 22, -6, 3, 1.8, 62);
    G.grain(ctx, G.rectRegion(ctx, 0, -27, 28, 2.6), 63);
    G.chips(ctx, 0, -27, 28, 64, G.DIRT);
    flat(ctx, 1, -2, 26, 2, "b0", "bLine");
  },
};

export const signPost: EnvAsset = {
  id: "signPost",
  box: [-8, -60, 12, 0],
  draw(ctx) {
    poly(ctx, [[-4, 0], [-3, -2], [5, -2], [6, 0]], "steel", 2);
    cylV(ctx, -0.5, -40, 3, 38, "chrome", 1);
    box(ctx, -1, -42, 4, 2.5, "chrome", 0);
    box(ctx, -4.5, -59, 11, 18, "chrome", 1, { vertical: true });
    flat(ctx, -3.5, -57, 5, 14, "screenOff", "gLine");
    G.grain(ctx, G.rectRegion(ctx, -0.5, -40, 3, 38), 65);
    G.dirt(ctx, -0.5, -40, 3, 38, 66, 0.3);
    G.rustPatch(ctx, 1, -12, 1.4, 1.2, 67);
    G.grain(ctx, G.rectRegion(ctx, -4.5, -59, 11, 18), 68, 0.8);
    G.drips(ctx, -4, -59, 10, 10, 69, 2);
    G.chips(ctx, -4.5, -59, 11, 70, G.DIRT);
    G.grain(ctx, G.polyRegion(ctx, [[-4, 0], [-3, -2], [5, -2], [6, 0]]), 71);
    if (P.simple()) return;
    for (let y = -55; y < -45; y += 2.6) flat(ctx, -2.8, y, 3.4, 0.8, "screen");
    disc(ctx, 3.5, -55, 0.8, "neon");
  },
};

export const floorVent: EnvAsset = {
  id: "floorVent",
  box: [-2, -10, 24, 0],
  draw(ctx) {
    box(ctx, 0, -8, 22, 7, "steel", 1);
    flat(ctx, 1.6, -6.6, 18.8, 4.6, "hole");
    const n = P.simple() ? 4 : 6;
    for (let i = 0; i < n; i++) box(ctx, 2.6 + i * (17 / n), -6.6, 1.2, 4.6, "steel", 2, { vertical: true, line: false });
    G.surface(ctx, 0, -8, 22, 7, 72, { rise: 0.5 });
    G.rustPatch(ctx, 17, -5, 2.5, 1, 76);
  },
};

const PILE: Pt[] = [[-2, 0], [6, -22], [22, -46], [36, -66], [48, -86], [60, -96], [76, -96], [82, -74], [92, -48], [100, -16], [102, 0]];
const BOULDERS: [number, number, number][] = [
  [10, -10, 12], [33, -11, 13], [58, -10, 12], [82, -11, 12],
  [21, -31, 11], [45, -32, 12], [70, -30, 11], [90, -26, 7],
  [36, -51, 10], [60, -52, 11], [80, -46, 8],
  [48, -69, 10], [68, -70, 9],
  [57, -85, 9], [72, -90, 7],
  [2, -4, 5], [94, -6, 5], [27, -48, 5], [86, -60, 5],
];

type Brick = [number, number, number, number, number, number];

const BRICKS: Brick[] = (() => {
  const r = rng(91);
  const list: Brick[] = [];
  for (let i = 0; i < 46; i++) {
    const x = 4 + r() * 56;
    const top = -16 * sin(PI * (x / 64)) ** 0.8;
    list.push([x, top * r() - 1, 6 + r() * 3, 3, (r() - 0.5) * 1.2, r() < 0.25 ? 1 : r() < 0.6 ? 2 : 3]);
  }
  return list.sort((a, b) => a[1] - b[1]).reverse();
})();
const RODS: [number, number, number, number][] = [[10, -4, 4, -20], [22, -10, 30, -30], [26, -9, 38, -26], [40, -8, 56, -24], [46, -6, 50, -18], [14, -6, -2, -12]];
const HEAP: Pt[] = [[0, 0], [4, -5], [12, -9], [22, -15], [32, -17], [42, -14], [52, -9], [60, -4], [66, 0]];

export const brickPile: EnvAsset = {
  id: "brickPile",
  box: [-4, -32, 70, 0],
  draw(ctx) {
    poly(ctx, HEAP, "brick", 0);
    G.grain(ctx, G.polyRegion(ctx, HEAP), 92);
    for (const [ax, ay, bx, by] of RODS.slice(0, 3)) P.line(ctx, [[ax, ay], [(ax + bx) / 2 + 2, (ay + by) / 2], [bx, by]], "rLine", 1.6);
    const list = P.simple() ? BRICKS.filter((_, i) => i % 2) : BRICKS;
    for (const [x, y, w, h, a, tone] of list) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      box(ctx, -w / 2, -h / 2, w, h, "brick", tone);
      if (!P.simple()) flat(ctx, -w / 2 + 0.6, -h / 2 + 0.4, w - 1.2, 0.6, "b3");
      ctx.restore();
    }
    poly(ctx, [[30, -12], [44, -16], [46, -11], [32, -7]], "concrete", 1);
    G.grain(ctx, G.rectRegion(ctx, 30, -16, 16, 9), 93);
    for (const [ax, ay, bx, by] of RODS.slice(3)) P.line(ctx, [[ax, ay], [(ax + bx) / 2 - 1, (ay + by) / 2 + 1], [bx, by]], "r2", 1.3);
    for (const [ax, ay, bx, by] of RODS.slice(0, 3)) P.line(ctx, [[(ax + bx) / 2 + 2, (ay + by) / 2], [bx, by]], "r3", 0.7);
    G.rustPatch(ctx, 42, -10, 3, 1.5, 94);
    clipped(ctx, HEAP, () => G.dirt(ctx, 0, -18, 66, 18, 95, 0.55));
  },
};

const CAR_SCALE = 0.72;
const TYRE_SCALE = 0.45;

const tyre = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, seed: number): void => {
  disc(ctx, cx, cy, r, "#151210", "#050404");
  if (!P.simple()) P.line(ctx, arc(cx, cy, r * 0.8, r * 0.8, PI * 1.05, PI * 1.6, 6), "#3a332c", 1);
  disc(ctx, cx, cy, r * 0.58, "#221e1a");
  disc(ctx, cx, cy, r * 0.44, "r1", "rLine");
  disc(ctx, cx, cy, r * 0.16, "r0");
  G.rustPatch(ctx, cx + r * 0.18, cy - r * 0.12, r * 0.16, r * 0.1, seed);
};

const flatTyre = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void => {
  const rr = h / 2;
  const pts = [...arc(x + w - rr, y - rr, rr, rr, -PI / 2, PI / 2, 6), ...arc(x + rr, y - rr, rr, rr, PI / 2, PI * 1.5, 6)];
  P.shape(ctx, pts, "#151210", "#050404");
  flat(ctx, x + rr, y - h + 1, w - h, 1, "#3a332c");
  flat(ctx, x + rr, y - rr - 0.4, w - h, 0.8, "#050404");
};

export const tyres: EnvAsset = {
  id: "tyres",
  box: [-2, -16, 18, 0],
  draw(ctx, state) {
    ctx.save();
    ctx.scale(TYRE_SCALE, TYRE_SCALE);
    if (state === 1) {
      flatTyre(ctx, 0, 0, 26, 7);
      tyre(ctx, 22, -11, 11, 96);
      G.dirt(ctx, 0, -22, 34, 22, 97, 0.5);
    } else {
      for (let i = 0; i < 3; i++) flatTyre(ctx, i === 1 ? 2 : 0, -i * 7, 26, 7);
      G.dirt(ctx, 0, -21, 28, 21, 98, 0.45);
    }
    ctx.restore();
  },
};

type Car = { body: Pt[]; glass: Pt[][]; wheels: [number, number, number][]; arches: number[]; frame: Pt[][]; lift: number; tilt: number; doors: number[]; seed: number };

const CARS: Car[] = [
  {
    body: [[0, -6], [2, -15], [20, -17], [34, -27], [62, -28], [74, -18], [94, -16], [96, -6]],
    glass: [[[36, -18], [40, -25], [52, -25], [52, -18]], [[55, -18], [55, -25], [61, -25], [70, -18]]],
    wheels: [[18, 7.5, 0], [78, 7, 1]], arches: [], frame: [], lift: 2, tilt: 0, doors: [34, 53], seed: 100,
  },
  {
    body: [[0, -1], [2, -9], [12, -12], [22, -24], [38, -25], [42, -20], [39, -16], [45, -12], [41, -7], [46, -3], [43, 0], [2, 0]],
    glass: [[[24, -14], [28, -22], [36, -22], [36, -14]]],
    wheels: [], arches: [12], frame: [[[42, -19], [50, -20], [55, -18]], [[44, -11], [53, -12]], [[43, -1], [57, -1]], [[41, -6], [49, -8], [52, -4]]],
    lift: 0, tilt: -0.04, doors: [20], seed: 120,
  },
];

const wheelAt = (ctx: CanvasRenderingContext2D, x: number, r: number, kind: number, seed: number): void => {
  if (kind === 2) {
    disc(ctx, x, -r * 0.5, r * 0.32, "r0", "rLine");
    return;
  }
  tyre(ctx, x, -r, r, seed);
  if (kind === 1) flat(ctx, x - r - 1, -2.4, r * 2 + 2, 2.4, "#151210");
};

const burnt = (ctx: CanvasRenderingContext2D, pts: Pt[], seed: number, x: number, y: number, w: number, h: number): void => {
  clipped(ctx, pts, () => {
    G.grain(ctx, G.polyRegion(ctx, pts), seed);
    G.rustPatch(ctx, x + w * 0.3, y + h * 0.6, w * 0.12, h * 0.25, seed + 1);
    G.rustPatch(ctx, x + w * 0.7, y + h * 0.4, w * 0.1, h * 0.2, seed + 2);
    ctx.globalAlpha = 0.55;
    P.shape(ctx, [[x + w * 0.35, y], [x + w * 0.62, y], [x + w * 0.7, y + h * 0.5], [x + w * 0.4, y + h * 0.6]], "hole");
    ctx.globalAlpha = 1;
    G.drips(ctx, x, y + h * 0.4, w, h * 0.5, seed + 3, Math.round(w / 14));
    G.dirt(ctx, x, y, w, h, seed + 4, 0.5);
  });
};

const glassHole = (ctx: CanvasRenderingContext2D, pts: Pt[], seed: number): void => {
  G.scorch(ctx, pts, seed);
  P.shape(ctx, pts, "hole");
  G.rim(ctx, pts, seed + 1, "r2", "rLine");
};

const car = (ctx: CanvasRenderingContext2D, c: Car): void => {
  const w = Math.max(...c.body.map((p) => p[0]));
  ctx.save();
  ctx.scale(CAR_SCALE, CAR_SCALE);
  ctx.translate(0, -c.lift);
  ctx.rotate(c.tilt);
  for (const [x, r] of c.wheels) flat(ctx, x - r * 0.9, -r * 1.6, r * 1.8, r * 1.2, "hole");
  for (const pts of c.frame) P.line(ctx, pts, "r1", 1.4);
  poly(ctx, c.body, "rust", 1);
  burnt(ctx, c.body, c.seed, 0, -30, w, 26);
  for (const x of c.arches) {
    const arch = arc(x, 0, 7, 7, PI, 2 * PI, 8);
    G.scorch(ctx, arch, c.seed + 30);
    P.shape(ctx, arch, "hole");
    disc(ctx, x, -2, 1.6, "r0", "rLine");
  }
  flat(ctx, 0, -9, w * 0.9, 2, "r0");
  for (const x of c.doors) P.line(ctx, [[x, -8], [x, -20]], "rLine", 0.8);
  c.glass.forEach((g, i) => glassHole(ctx, g, c.seed + 10 + i * 2));
  c.wheels.forEach(([x, r, kind], i) => wheelAt(ctx, x, r, kind, c.seed + 20 + i));
  ctx.restore();
};

const truck = (ctx: CanvasRenderingContext2D): void => {
  const cab: Pt[] = [[100, -6], [100, -40], [116, -42], [124, -28], [134, -24], [136, -6]];
  const bed: Pt[] = [[0, -10], [0, -46], [96, -46], [96, -10]];
  flat(ctx, 4, -10, 128, 4, "r0", "rLine");
  poly(ctx, bed, "rust", 1);
  burnt(ctx, bed, 140, 0, -46, 96, 36);
  for (let x = 12; x < 96; x += 12) P.line(ctx, [[x, -44], [x, -12]], "r0", 1.2);
  const breach: Pt[] = [[52, -46], [58, -34], [70, -38], [74, -30], [80, -46]];
  G.scorch(ctx, breach, 145);
  P.shape(ctx, breach, "hole");
  G.rim(ctx, breach, 146, "r2", "rLine");
  poly(ctx, cab, "rust", 2);
  burnt(ctx, cab, 150, 100, -42, 36, 36);
  glassHole(ctx, [[105, -24], [105, -37], [115, -38], [121, -24]], 155);
  P.line(ctx, [[104, -10], [104, -22]], "rLine", 0.8);
  [[18, 0], [36, 1], [118, 0]].forEach(([x, kind], i) => wheelAt(ctx, x as number, 9, kind as number, 160 + i));
};

export const carWreck: EnvAsset = {
  id: "carWreck",
  box: [-2, -48, 140, 0],
  draw(ctx, state) {
    if (state === 2) truck(ctx);
    else car(ctx, CARS[state] ?? (CARS[0] as Car));
  },
};

export const rubblePile: EnvAsset = {
  id: "rubblePile",
  box: [-6, -100, 102, 0],
  draw(ctx) {
    path(ctx, PILE);
    ctx.fillStyle = color("hole");
    ctx.fill();
    const list = P.simple() ? BOULDERS.filter((b) => b[2] > 6) : BOULDERS;
    list
      .map((b, i): [number, number, number, number] => [b[0], b[1], b[2], i])
      .sort((a, b) => a[1] - b[1])
      .forEach(([x, y, r, i]) => rock(ctx, x, y, r * 1.3, i + 3));
    clipped(ctx, PILE, () => G.dirt(ctx, -6, -100, 108, 100, 78, 0.6));
  },
};

const GIRDERS: [number, number, number, number, number][] = [
  [6, -8, 42, -16, 5], [26, -34, 70, -6, 6], [16, -44, 60, -40, 5],
  [48, -58, 94, -22, 7], [62, -72, 114, -52, 6], [84, -92, 104, -28, 6],
  [94, -90, 120, -74, 5], [36, -76, 58, -72, 4], [54, -88, 68, -93, 3],
  [70, -40, 118, -12, 6], [30, -20, 56, -30, 4], [100, -70, 116, -6, 5],
];
const MOUND: Pt[] = [[0, 0], [6, -5], [14, -6], [22, -12], [30, -11], [40, -24], [48, -22], [58, -36], [66, -34], [74, -50], [82, -48], [90, -64], [98, -62], [104, -80], [112, -84], [116, -94], [122, -92], [122, 0]];
const DEBRIS: Tones = ["r0", "r1", "r2", "r3"];

const chunks = (n: number): [number, number, number][] => {
  const rnd = rng(17);
  return Array.from({ length: n }, () => {
    const x = 6 + rnd() * 112;
    return [x, -rnd() * x * 0.72 - 3, 3.5 + rnd() * 4.5];
  });
};

export const fallenGirders: EnvAsset = {
  id: "fallenGirders",
  box: [-2, -98, 124, 0],
  draw(ctx) {
    poly(ctx, MOUND, "rust", 1);
    G.grain(ctx, G.polyRegion(ctx, MOUND), 81);
    chunks(P.simple() ? 10 : 26).forEach(([x, y, r], i) => rock(ctx, x, y, r, i + 40, DEBRIS));
    clipped(ctx, MOUND, () => G.dirt(ctx, 0, -94, 122, 94, 82, 0.25));
    GIRDERS.forEach((g, i) => girder(ctx, ...g, 90 + i * 4));
  },
};

export const propAssets: EnvAsset[] = [barrel, dyingRebel, corpse, crowbar, eBlaster, craneKey, shipPart, controller, wires, tapHandle, card, holoPlan, shipPlan, decoder, crate, signPost, floorVent, rubblePile, brickPile, tyres, carWreck, fallenGirders];
