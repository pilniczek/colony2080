import { P, type EnvAsset } from "./paint";

const { rng, path, color, flat, box, poly, cylV, disc, rivets, stroke, tones } = P;
const { PI, sin, cos, atan2, hypot } = Math;

type Pt = [number, number];
type Tones = [string, string, string, string];

const ROCK: Tones = ["k0", "k2", "c1", "c2"];
const LIGHT: Pt = [-0.6, -0.8];

const facets = (ctx: CanvasRenderingContext2D, pts: Pt[], cx: number, cy: number, tones: Tones, line: string): void => {
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

const girder = (ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, w: number): void => {
  const len = hypot(bx - ax, by - ay);
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(atan2(by - ay, bx - ax));
  box(ctx, 0, -w / 2, len, w, "rust", 2);
  flat(ctx, w * 0.3, -w * 0.18, len - w * 0.6, w * 0.36, "r1");
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
  box: [-2, -8, 18, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 1, 14);
    box(ctx, 0.6, -1.6, 14, 1.6, "chrome", 0);
    poly(ctx, [[0.6, -1.6], [2.4, -6.4], [16, -6.4], [14.6, -1.6]], "chrome", 1);
    poly(ctx, [[10.6, -2.6], [11.2, -5.4], [13.8, -5.4], [13.2, -2.6]], "neon", 2);
    for (let i = 0; i < 4; i++) poly(ctx, [[2.6 + i * 1.8, -2.4], [3.2 + i * 1.8, -4], [4.2 + i * 1.8, -4], [3.6 + i * 1.8, -2.4]], "c3", 2);
    if (P.simple()) return;
    flat(ctx, 3.6, -5.6, 6, 0.4, "c0");
    flat(ctx, 9.6, -2.2, 0.4, 0.4, "c0");
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
    ctx.moveTo(3.4, -10); ctx.lineTo(9, -10.2); ctx.lineTo(10.4, -9.2); ctx.lineTo(8.6, -8.6); ctx.lineTo(3.6, -9.2); ctx.closePath();
    ctx.moveTo(12, -10); ctx.lineTo(18, -10.2);
    ctx.moveTo(15, -10.1); ctx.lineTo(15, -8.6);
    ctx.moveTo(15.4, -6.4); ctx.lineTo(15.8, -1.6);
    ctx.moveTo(13, -4.6); ctx.lineTo(15.6, -3.6); ctx.lineTo(18.4, -4.6);
    if (!P.simple()) {
      ctx.moveTo(2.8, -2); ctx.quadraticCurveTo(3.4, -5.6, 6, -6);
      for (const x of [7.4, 10] as const) { ctx.rect(x, -6, 1.6, 4.4); ctx.moveTo(x + 0.8, -6); ctx.lineTo(x + 0.8, -1.6); }
      ctx.moveTo(2.6, -7); ctx.lineTo(18.6, -7.2);
    }
    ctx.stroke();
    ctx.restore();
    disc(ctx, 15, -8.6, 0.6, "m0");
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
    if (P.simple()) return;
    for (let y = -55; y < -45; y += 2.6) flat(ctx, -2.8, y, 3.4, 0.8, "screen");
    disc(ctx, 3.5, -55, 0.8, "neon");
  },
};

export const floorVent: EnvAsset = {
  id: "floorVent",
  box: [-2, -10, 24, 0],
  draw(ctx) {
    box(ctx, 0, -8, 22, 7, "chrome", 1);
    flat(ctx, 1.6, -6.6, 18.8, 4.6, "hole");
    const n = P.simple() ? 4 : 6;
    for (let i = 0; i < n; i++) box(ctx, 2.6 + i * (17 / n), -6.6, 1.2, 4.6, "chrome", 2, { vertical: true, line: false });
  },
};

const BOULDERS: [number, number, number][] = [
  [10, -10, 12], [33, -11, 13], [58, -10, 12], [82, -11, 12],
  [21, -31, 11], [45, -32, 12], [70, -30, 11], [90, -26, 7],
  [36, -51, 10], [60, -52, 11], [80, -46, 8],
  [48, -69, 10], [68, -70, 9],
  [57, -85, 9], [72, -90, 7],
  [2, -4, 5], [94, -6, 5], [27, -48, 5], [86, -60, 5],
];

export const rubblePile: EnvAsset = {
  id: "rubblePile",
  box: [-6, -100, 102, 0],
  draw(ctx) {
    path(ctx, [[-2, 0], [6, -22], [22, -46], [36, -66], [48, -86], [60, -96], [76, -96], [82, -74], [92, -48], [100, -16], [102, 0]]);
    ctx.fillStyle = color("hole");
    ctx.fill();
    const list = P.simple() ? BOULDERS.filter((b) => b[2] > 6) : BOULDERS;
    list
      .map((b, i): [number, number, number, number] => [b[0], b[1], b[2], i])
      .sort((a, b) => a[1] - b[1])
      .forEach(([x, y, r, i]) => rock(ctx, x, y, r * 1.3, i + 3));
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
    chunks(P.simple() ? 10 : 26).forEach(([x, y, r], i) => rock(ctx, x, y, r, i + 40, DEBRIS));
    for (const g of GIRDERS) girder(ctx, ...g);
  },
};

export const propAssets: EnvAsset[] = [barrel, dyingRebel, corpse, crowbar, craneKey, shipPart, controller, wires, tapHandle, card, holoPlan, shipPlan, decoder, crate, signPost, floorVent, rubblePile, fallenGirders];
