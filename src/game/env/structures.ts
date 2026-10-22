import { G } from "./grime";
import { P, TILE, type EnvAsset, type Size } from "./paint";

const { box, flat, poly, cylV, cylH, disc, rivets, hazard, mesh, trefoil, glow, text, stroke, slab } = P;

type Pt = [number, number];

export const dots = (ctx: CanvasRenderingContext2D, pts: Pt[], color: string): void => {
  if (P.simple()) return;
  for (const [x, y] of pts) flat(ctx, x - 0.75, y - 0.75, 1.5, 1.5, color);
};

export const column = (x: number, y0: number, y1: number, step: number): Pt[] => {
  const pts: Pt[] = [];
  for (let y = y0 + step / 2; y < y1; y += step) pts.push([x, y]);
  return pts;
};

const barPts = (ax: number, ay: number, bx: number, by: number, w: number): Pt[] => {
  const len = Math.hypot(bx - ax, by - ay);
  const nx = ((-(by - ay) / len) * w) / 2;
  const ny = (((bx - ax) / len) * w) / 2;
  return [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]];
};

export const bar = (ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, w: number, mat: string, tone = 1): void => {
  poly(ctx, barPts(ax, ay, bx, by, w), mat, tone, { dir: [1, 0] });
};

const shownSpan = (ctx: CanvasRenderingContext2D): [number, number] => {
  const m = ctx.getTransform();
  if (m.b || m.c || !m.a) return [-Infinity, Infinity];
  const a = -m.e / m.a;
  const b = (ctx.canvas.width - m.e) / m.a;
  return [Math.min(a, b) - TILE, Math.max(a, b) + TILE];
};

const grimeRun = (ctx: CanvasRenderingContext2D, x: number, w: number, seed: number, chunk: (cx: number, cw: number, cs: number) => void): void => {
  const [x0, x1] = shownSpan(ctx);
  for (let cx = x; cx < x + w; cx += 96) if (cx + 96 > x0 && cx < x1) chunk(cx, Math.min(96, x + w - cx), seed + Math.round(cx - x) * 3);
};

const arcPts = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 12): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt;
  });

const chamfer = (x: number, y: number, w: number, h: number, c: number): Pt[] => [
  [x + c, y], [x + w - c, y], [x + w, y + c], [x + w, y + h - c], [x + w - c, y + h], [x + c, y + h], [x, y + h - c], [x, y + c],
];

export const wire = (ctx: CanvasRenderingContext2D, pts: Pt[], color: string, k = 1.4): void => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.lineCap = "round";
  stroke(ctx, "rLine", k + 1.4);
  stroke(ctx, color, k);
};

const speckle = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, colors: string[], per: number, seed = 1): void => {
  if (P.simple()) return;
  let s = seed * 9301 + 49297;
  const rnd = (): number => (s = (s * 9301 + 49297) % 233280) / 233280;
  const n = Math.round((w * h) / per);
  for (let i = 0; i < n; i++) {
    const size = 0.6 + rnd() * 1.2;
    flat(ctx, x + rnd() * (w - size), y + rnd() * (h - size), size, size, colors[i % colors.length] as string);
  }
};

const walkway = (ctx: CanvasRenderingContext2D, x: number, w: number): void => {
  box(ctx, x, 0, w, 24, "rust", 1);
  for (let i = x; i < x + w; i += TILE / 2) poly(ctx, chamfer(i + 1, 4, 10, 10, 2.5), "olive", 2);
  box(ctx, x, 0, w, 3, "concrete", 1);
  box(ctx, x, 15.5, w, 2.5, "rust", 2);
  rivets(ctx, x, 16.75, w, 6);
  for (let i = x; i < x + w; i += TILE) flat(ctx, i + 6, 19, 1, 4, "r0");
  const s = 100 + Math.round(w) * 5;
  G.grain(ctx, G.rectRegion(ctx, x, 0, w, 24), s);
  grimeRun(ctx, x, w, s, (cx, cw, cs) => {
    const r = P.rng(cs);
    G.drips(ctx, cx, 3, cw, 12, cs + 1, 2);
    G.drips(ctx, cx, 18, cw, 5, cs + 2, 3, false);
    if (r() < 0.6) G.rustPatch(ctx, cx + r() * cw, 6 + r() * 8, 2 + r() * 3, 1.2 + r(), cs + 3);
    G.chips(ctx, cx, 0.4, cw, cs + 4);
  });
  G.dirt(ctx, x, 10, w, 14, s + 1, 0.5);
  flat(ctx, x, 22, w, 2, "r0");
};

export const streetWalkway: EnvAsset = {
  id: "streetWalkway",
  box: [0, -2, 120, 25],
  draw(ctx, _state, _t, { w = 120 }: Size) {
    walkway(ctx, 0, w);
  },
};

const beaconPost = (ctx: CanvasRenderingContext2D, x: number): void => {
  for (let y = 0; y < 24; y += 3) cylH(ctx, x, y, 12, 3, "concrete", 2);
  G.grain(ctx, G.rectRegion(ctx, x, 0, 12, 24), 117 + x);
  G.dirt(ctx, x, 0, 12, 24, 118 + x, 0.4);
  cylV(ctx, x + 1, -1.5, 10, 2, "steel", 2);
  poly(ctx, arcPts(x + 6, -1.5, 4.5, 4.5, Math.PI, Math.PI * 2), "yellow", 2);
  if (!P.simple()) flat(ctx, x + 4, -4.5, 1.5, 1.5, "y3");
  glow(ctx, x + 6, -3, 9, "y2", 0.3);
};

export const hazardPlate: EnvAsset = {
  id: "hazardPlate",
  box: [-2, -12, 194, 25],
  draw(ctx) {
    box(ctx, 12, 0, 168, 24, "rust", 1);
    box(ctx, 12, 0, 168, 6, "concrete", 2);
    rivets(ctx, 12, 3, 168, 8, "k3");
    box(ctx, 14, 7, 164, 6, "rust", 2);
    for (let x = 14 + 20.5; x < 178; x += 20.5) flat(ctx, x, 7, 1, 6, "r0");
    hazard(ctx, 16, 15.5, 160, 4.5, 3);
    G.grain(ctx, G.rectRegion(ctx, 12, 0, 168, 24), 110);
    G.chips(ctx, 12, 0.4, 168, 111);
    G.drips(ctx, 12, 6, 168, 9, 112, 7);
    G.drips(ctx, 14, 13, 164, 6, 113, 5, false);
    G.rustPatch(ctx, 48, 10, 4, 2, 114);
    G.rustPatch(ctx, 141, 9, 3, 1.5, 115);
    G.dirt(ctx, 12, 8, 168, 16, 116, 0.5);
    flat(ctx, 12, 22, 168, 2, "r0");
    beaconPost(ctx, 0);
    beaconPost(ctx, 180);
  },
};

const fencePanel = (ctx: CanvasRenderingContext2D, x: number, w: number, hole?: Pt[]): void => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, -46, w, 46);
  if (hole) hole.forEach(([hx, hy], i) => (i ? ctx.lineTo(x + hx, hy) : ctx.moveTo(x + hx, hy)));
  ctx.clip("evenodd");
  mesh(ctx, x, -46, w, 46, "c1", 3);
  flat(ctx, x, -46, w, 0.8, "c0");
  G.dirt(ctx, x, -46, w, 46, 120 + Math.round(x + w), 0.3);
  G.drips(ctx, x, -46, w, 18, 121 + Math.round(x + w), Math.ceil(w / 30));
  ctx.restore();
  flat(ctx, x, -2, w, 2, "k0");
};

const signPlate = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mat = "chrome", wear = 1): void => {
  box(ctx, x, y, w, h, mat, 1);
  const s = 122 + Math.round(x * 3 + w);
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), s, wear);
  G.drips(ctx, x, y + h - 1, w, h * 0.8 * wear, s + 1, Math.ceil((w * wear) / 12));
  G.chips(ctx, x, y + 0.3, w, s + 2);
};

const toxicSign = (ctx: CanvasRenderingContext2D, x: number): void => {
  signPlate(ctx, x, -42, 60, 13, "chrome", 0.35);
  disc(ctx, x + 7, -35.5, 3.6, "a0", "aLine");
  ctx.save();
  ctx.letterSpacing = "1.2px";
  text(ctx, "TOXIC", x + 34.6, -35.5, 8, "a0");
  ctx.restore();
};

const fencePosts = (ctx: CanvasRenderingContext2D, xs: number[]): void => {
  for (const x of xs) {
    cylV(ctx, x - 1.75, -50, 3.5, 50, "chrome", 1);
    cylV(ctx, x - 2.25, -51, 4.5, 2, "chrome", 0);
    G.drips(ctx, x - 1, -49, 2, 16, 123 + Math.round(x), 1);
    G.rustPatch(ctx, x, -8, 1.6, 1.4, 124 + Math.round(x));
  }
};

const TEAR: Pt[] = [[0, -46], [30, -46], [26, -40], [31, -36], [22, -31], [25, -24], [14, -20], [16, -12], [6, -9], [0, -4]];

export const chainFence: EnvAsset = {
  id: "chainFence",
  box: [-2, -52, 194, 0],
  draw(ctx, _state, _t, { w }: Size) {
    if (w !== undefined && w < 192) {
      fencePanel(ctx, 0, w);
      toxicSign(ctx, (w - 60) / 2);
      fencePosts(ctx, [0, w]);
      return;
    }
    fencePanel(ctx, 0, 96, TEAR);
    fencePanel(ctx, 96, 96);
    signPlate(ctx, 62, -40, 18, 8);
    if (!P.simple()) for (const y of [-38, -36, -34]) flat(ctx, 64, y, 12, 0.8, "c0");
    toxicSign(ctx, 102);
    signPlate(ctx, 168, -40, 16, 7);
    if (!P.simple()) for (const y of [-38, -35.5]) flat(ctx, 170, y, 12, 1, "neon");
    fencePosts(ctx, [0, 96, 192]);
  },
};

const pylonTruss = (ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number): void => {
  for (let y = y0; y < y1; y += TILE) {
    const yb = Math.min(y1, y + TILE);
    bar(ctx, x + 4, y, x + 20, yb, 3.4, "concrete", 1);
    bar(ctx, x + 20, y, x + 4, yb, 3.4, "concrete", 2);
  }
  for (const fx of [x, x + 19]) {
    box(ctx, fx, y0, 5, y1 - y0, "concrete", 2, { vertical: true });
    dots(ctx, column(fx + 2.5, y0, y1, 8), "k3");
    G.grain(ctx, G.rectRegion(ctx, fx, y0, 5, y1 - y0), 130 + fx + Math.round(y0));
    for (let y = y0; y < y1; y += TILE) G.drips(ctx, fx + 1, y + 4, 3, 16, 131 + fx + Math.round(y - y0) * 2 + Math.round(y0), 1);
  }
  for (let y = y0; y < y1; y += TILE) {
    const s = 132 + Math.round(y - y0) * 2 + Math.round(y0);
    if (P.rng(s)() < 0.4) G.rustPatch(ctx, x + 12, y + 12, 2.5, 2, s + 1);
  }
};

export const latticePylon: EnvAsset = {
  id: "latticePylon",
  box: [-10, -168, 34, 0],
  draw(ctx, _state, _t, { h = 168 }: Size) {
    pylonTruss(ctx, 0, -h, -22);
    box(ctx, -5, -22, 34, 6, "concrete", 2);
    poly(ctx, [[-9, 0], [33, 0], [28, -16], [-4, -16]], "concrete", 1, { dir: [1, 0] });
    G.grain(ctx, G.polyRegion(ctx, [[-9, 0], [33, 0], [28, -22], [-4, -22]]), 133);
    G.drips(ctx, -4, -16, 32, 10, 134, 3);
    G.dirt(ctx, -9, -16, 42, 16, 135, 0.6);
    G.chips(ctx, -5, -21.6, 34, 136);
    for (const x of [2.5, 10, 17.5]) flat(ctx, x, -9, 4, 7, "hole", "kLine");
  },
};

const gusset = (ctx: CanvasRenderingContext2D, x: number, seed: number): void => {
  box(ctx, x, -24, 24, 24, "concrete", 2);
  G.surface(ctx, x, -24, 24, 24, seed, { rise: 0.4, drip: 2, dripLen: 16 });
  flat(ctx, x + 2, -22, 20, 1, "k3");
  dots(ctx, [[x + 3, -21], [x + 21, -21], [x + 3, -3], [x + 21, -3]], "k3");
};

export const girderBridge: EnvAsset = {
  id: "girderBridge",
  box: [0, -25, 144, 1],
  draw(ctx, _state, _t, { w = 144 }: Size) {
    for (let x = 24; x < w - 24; x += TILE) {
      bar(ctx, x + 1, -19, x + TILE - 1, -5, 3, "concrete", 1);
      bar(ctx, x + 1, -5, x + TILE - 1, -19, 3, "concrete", 2);
    }
    box(ctx, 0, -24, w, 5, "concrete", 2);
    box(ctx, 0, -5, w, 5, "concrete", 1);
    const s = 140 + Math.round(w) * 5;
    G.grain(ctx, G.rectRegion(ctx, 0, -24, w, 5), s);
    G.grain(ctx, G.rectRegion(ctx, 0, -5, w, 5), s + 2);
    grimeRun(ctx, 24, w - 48, s, (cx, cw, cs) => {
      const r = P.rng(cs);
      G.drips(ctx, cx, -24, cw, 5, cs + 1, 3);
      G.drips(ctx, cx, -5, cw, 5, cs + 2, 2);
      if (r() < 0.5) G.rustPatch(ctx, cx + r() * cw, -21.5, 2.5, 1.2, cs + 3);
      G.chips(ctx, cx, -23.6, cw, cs + 4);
    });
    rivets(ctx, 24, -21.5, w - 48, 8, "k3");
    rivets(ctx, 24, -2.5, w - 48, 8, "k3");
    gusset(ctx, 0, s + 1);
    gusset(ctx, w - 24, s + 7);
  },
};

export const ladderRungs = (h: number, rung: number): number[] => {
  const ys: number[] = [];
  for (let k = 1; -rung * k > -h; k++) ys.push(-rung * k);
  return ys;
};

export const ladder: EnvAsset = {
  id: "ladder",
  box: [0, -168, 17.2, 0],
  draw(ctx, _state, _t, { h = 168, w = 17.2, rung = 6.76 }: Size) {
    box(ctx, 0, -h, 2.4, h, "steel", 2, { vertical: true });
    box(ctx, w - 2.4, -h, 2.4, h, "steel", 2, { vertical: true });
    const ys = ladderRungs(h, rung);
    for (const y of ys) box(ctx, 2.4, y - 0.7, w - 4.8, 1.4, "chrome", 2);
    if (!P.simple()) for (let k = 0; k < ys.length; k += 4) for (const x of [0.6, w - 1.8]) flat(ctx, x, (ys[k] as number) - 0.6, 1.2, 1.2, "m3");
  },
};

const liftLanding: EnvAsset = {
  id: "liftLanding",
  box: [0, -3, 72, 7],
  draw(ctx, _state, _t, { w = 72 }) {
    flat(ctx, 5, 0, w - 10, 3, "hole");
    mesh(ctx, 5, 0, w - 10, 3, "m2", 3);
    flat(ctx, 5, 3, w - 10, 0.8, "mLine");
    const s = 150 + Math.round(w) * 3;
    G.drips(ctx, 5, 0, w - 10, 4, s, Math.ceil(w / 24), false);
    for (const x of [0, w - 5]) {
      box(ctx, x, -2, 5, 8, "steel", 2);
      if (!P.simple()) flat(ctx, x + 1, -1.4, 3, 0.8, "m3");
      G.grain(ctx, G.rectRegion(ctx, x, -2, 5, 8), s + x);
      G.drips(ctx, x + 1.5, -1, 2, 7, s + x + 1, 1);
    }
  },
};

export const pipeRings = (h: number): number[] => {
  const ys: number[] = [];
  for (let y = -h + 18; y < -24; y += 72) ys.push(y);
  return ys;
};

export const pipeColumn: EnvAsset = {
  id: "pipeColumn",
  box: [-4, -168, 28, 0],
  draw(ctx, _state, _t, { h = 168 }: Size) {
    const s = 160 + Math.round(h) * 3;
    cylV(ctx, 0, -h, 24, h, "concrete", 2);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, 24, h), s);
    G.drips(ctx, 0, -h, 24, 40, s + 1, 2);
    for (const y of pipeRings(h)) {
      cylV(ctx, -1.5, y, 27, 4, "concrete", 1);
      flat(ctx, -1.5, y + 1.5, 27, 0.8, "k3");
      G.drips(ctx, 0, y + 4, 24, 30, s + 2 + Math.round(y), 3);
      G.chips(ctx, -1.5, y + 0.3, 27, s + 3 + Math.round(y));
    }
    G.dirt(ctx, 0, -48, 24, 48, s + 4, 0.7);
    cylV(ctx, -3, -6, 30, 6, "concrete", 1);
    G.grain(ctx, G.rectRegion(ctx, -3, -6, 30, 6), s + 5);
    G.dirt(ctx, -3, -6, 30, 6, s + 6, 0.6);
  },
};

const pipeRing = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, vertical: boolean): void => {
  if (vertical) box(ctx, x, y, w, 4, "chrome", 2, { vertical: true });
  else box(ctx, x, y, 4, w, "chrome", 2);
};

export const pipeBend: EnvAsset = {
  id: "pipeBend",
  box: [-4, -122, 124, 0],
  draw(ctx) {
    poly(ctx, [[0, -120], [24, -96], [24, 0], [0, 0]], "chrome", 1, { dir: [1, 0] });
    poly(ctx, [[0, -120], [120, -120], [120, -96], [24, -96]], "chrome", 1);
    G.grain(ctx, G.polyRegion(ctx, [[0, -120], [120, -120], [120, -96], [24, -96], [24, 0], [0, 0]]), 170);
    G.drips(ctx, 24, -120, 96, 18, 171, 5);
    G.drips(ctx, 0, -100, 24, 50, 172, 2);
    G.rustPatch(ctx, 14, -104, 5, 3, 173);
    G.rustPatch(ctx, 104, -101, 4, 2, 174);
    G.dirt(ctx, 0, -40, 24, 40, 175, 0.7);
    pipeRing(ctx, 76, -121, 26, false);
    pipeRing(ctx, -1, -46, 26, true);
    G.grain(ctx, G.rectRegion(ctx, 76, -121, 4, 26), 176);
    G.grain(ctx, G.rectRegion(ctx, -1, -46, 26, 4), 179);
    G.drips(ctx, 0, -42, 24, 22, 177, 2);
    cylV(ctx, -3, -5, 30, 5, "chrome", 0);
    G.grain(ctx, G.rectRegion(ctx, -3, -5, 30, 5), 178);
  },
};

const dome = (ctx: CanvasRenderingContext2D, cx: number, a0: number, a1: number): void => {
  poly(ctx, arcPts(cx, -48, 11, 24, a0, a1, 16), "chrome", 1);
};

const wornSign = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, seed: number): void => {
  trefoil(ctx, cx, cy, r);
  const rand = P.rng(seed);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 0.6, 0, Math.PI * 2);
  ctx.clip();
  G.grain(ctx, G.rectRegion(ctx, cx - r, cy - r, r * 2, r * 2), seed);
  G.grain(ctx, G.rectRegion(ctx, cx - r, cy - r, r * 2, r * 2), seed + 1, 0.8);
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2;
    const d = r * (0.35 + rand() * 0.75);
    const px = cx + Math.cos(a) * d;
    const py = cy + Math.sin(a) * d;
    const s = 0.6 + rand() * 1.8;
    P.shape(ctx, [[px - s, py - s * 0.6], [px + s * 0.4, py - s], [px + s, py + s * 0.3], [px - s * 0.2, py + s * 0.8]], rand() < 0.6 ? "c1" : "r2");
  }
  G.dirt(ctx, cx - r, cy - r, r * 2, r * 2, seed + 2, 0.45);
  ctx.restore();
  G.drips(ctx, cx - r * 0.6, cy + r * 0.6, r * 1.2, r * 1.6, seed + 3, 2);
};

export const fuelTank: EnvAsset = {
  id: "fuelTank",
  box: [0, -74, 106, 0],
  draw(ctx) {
    box(ctx, 14, -26, 28, 26, "concrete", 1);
    for (let gx = 0; gx < 4; gx++) for (let gy = 0; gy < 4; gy++) flat(ctx, 17 + gx * 6.25, -23 + gy * 5.75, 3.5, 3.5, "hole");
    G.surface(ctx, 14, -26, 28, 26, 180, { rise: 0.45, drip: 2, dripLen: 12 });
    cylV(ctx, 82, -26, 5, 26, "steel", 2);
    box(ctx, 78, -27, 13, 3, "steel", 2);
    G.drips(ctx, 82, -24, 5, 20, 181, 1);
    G.dirt(ctx, 82, -26, 5, 26, 182, 0.4);
    dome(ctx, 12, Math.PI / 2, Math.PI * 1.5);
    dome(ctx, 94, -Math.PI / 2, Math.PI / 2);
    box(ctx, 12, -72, 82, 48, "chrome", 1);
    for (const x of [17, 88]) flat(ctx, x, -72, 1, 48, "c0");
    if (!P.simple()) flat(ctx, 30, -69, 22, 3, "c0");
    G.grain(ctx, G.polyRegion(ctx, [...arcPts(12, -48, 11, 24, Math.PI / 2, Math.PI * 1.5, 16), ...arcPts(94, -48, 11, 24, -Math.PI / 2, Math.PI / 2, 16)]), 183);
    G.drips(ctx, 12, -72, 82, 26, 184, 7);
    for (const x of [17, 88]) G.drips(ctx, x - 1, -70, 3, 30, 185 + x, 1);
    G.rustPatch(ctx, 40, -30, 7, 3, 186);
    G.rustPatch(ctx, 96, -36, 3, 4, 187);
    G.dirt(ctx, 12, -72, 82, 48, 188, 0.3);
    G.chips(ctx, 12, -71.6, 82, 189);
    wornSign(ctx, 78, -48, 7.5, 190);
  },
};

export const staircase: EnvAsset = {
  id: "staircase",
  box: [-3, -118, 124, 1],
  draw(ctx) {
    bar(ctx, 34, -96, 122, 0, 4, "concrete", 1);
    box(ctx, 0, -98, 30, 3, "concrete", 2);
    for (let k = 1; k < 12; k++) box(ctx, 24 + (k * 22) / 3 + 1, -96 + k * 8, 9, 2, "concrete", 2);
    bar(ctx, 24, -96, 112, 0, 4, "concrete", 2);
    for (const [pts, seed] of [[barPts(34, -96, 122, 0, 4), 190], [barPts(24, -96, 112, 0, 4), 191], [[[0, -98], [30, -98], [30, -95], [0, -95]], 192]] as [Pt[], number][]) G.grain(ctx, G.polyRegion(ctx, pts), seed);
    for (let k = 1; k < 12; k += 2) G.drips(ctx, 24 + (k * 22) / 3 - 2, -96 + k * 8, 4, 4, 193 + k, 1);
    G.drips(ctx, 0, -98, 30, 3, 205, 3);
    for (let x = 32; x <= 104; x += TILE) cylV(ctx, x - 1, -96 + (x - 24) - 18, 2, 18, "steel", 2);
    cylV(ctx, 0, -116, 2, 18, "steel", 2);
    bar(ctx, 0, -114, 24, -114, 2, "armor", 1);
    bar(ctx, 24, -114, 108, -30, 2, "armor", 1);
    bar(ctx, 0, -106, 20, -106, 1.6, "armor", 1);
  },
};

const floorRail = (ctx: CanvasRenderingContext2D, x: number, w: number, posts: number[]): void => {
  box(ctx, x, 3, w, 17, "steel", 0);
  box(ctx, x, 0, w, 3, "chrome", 1);
  hazard(ctx, x, 9, w, 2.5, 3);
  G.grain(ctx, G.rectRegion(ctx, x, 0, w, 20), 210);
  G.drips(ctx, x, 3, w, 12, 211, 6);
  G.dirt(ctx, x, 3, w, 17, 212, 0.45);
  G.rustPatch(ctx, x + w * 0.45, 6, 4, 1.8, 213);
  G.chips(ctx, x, 0.3, w, 214);
  for (const px of posts) {
    cylV(ctx, px - 1.75, -3, 3.5, 22, "chrome", 1);
    flat(ctx, px - 2.25, -3.5, 4.5, 1.5, "c2", "mLine");
    G.drips(ctx, px - 1.75, -2, 3.5, 14, 215 + px, 1);
  }
};

export const tunnelFloor: EnvAsset = {
  id: "tunnelFloor",
  box: [0, -5, 144, 21],
  draw(ctx) {
    floorRail(ctx, 0, 144, [24, 120]);
  },
};

const stripBar = (ctx: CanvasRenderingContext2D, x: number, y: number, lit: boolean): void => {
  if (lit) {
    ctx.save();
    for (const [spread, alpha, end] of [[6, 0.07, -8], [1, 0.08, -24]] as [number, number, number][]) {
      ctx.globalAlpha = alpha;
      poly(ctx, [[x, y + 4], [x + 36, y + 4], [x + 36 + spread, end], [x - spread, end]], "c3", 2, { line: false });
    }
    ctx.restore();
    glow(ctx, x + 18, y + 2, 22, "c3", 0.3);
  }
  box(ctx, x, y, 36, 4, "chrome", lit ? 3 : 0);
  if (lit) flat(ctx, x + 1.5, y + 2.5, 33, 1.5, "c3");
};

export const stripLight: EnvAsset = {
  id: "stripLight",
  box: [-14, -96, 50, 0],
  draw(ctx, state) {
    box(ctx, -2, -96, 40, 3, "steel", 1);
    for (const x of [5, 29]) box(ctx, x, -93, 2, 23, "steel", 1, { vertical: true });
    stripBar(ctx, 0, -70, state === 0);
  },
};

export const tunnelGate: EnvAsset = {
  id: "tunnelGate",
  box: [-4, -96, 88, 0],
  draw(ctx) {
    slab(ctx, 1, -96, 82, 96, "concrete", 1);
    if (!P.simple()) for (let y = -84; y < -4; y += 24) flat(ctx, 1, y, 82, 1, "k0");
    G.surface(ctx, 1, -96, 82, 96, 220, { rise: 0.3, drip: 4, dripLen: 30 });
    for (let y = -84; y < -4; y += 24) G.drips(ctx, 1, y + 1, 82, 14, 221 - y, 3);
    G.rustPatch(ctx, 22, -40, 6, 3, 222);
    G.rustPatch(ctx, 64, -14, 5, 2.5, 223);
    for (const x of [-3, 83]) {
      box(ctx, x, -96, 4, 96, "steel", 1, { vertical: true });
      G.grain(ctx, G.rectRegion(ctx, x, -96, 4, 96), 224 + x);
    }
    box(ctx, -3, -72, 90, 4, "steel", 2);
    G.drips(ctx, -3, -68, 90, 18, 228, 5);
  },
};

const tunnelPillar = (ctx: CanvasRenderingContext2D, x: number): void => {
  box(ctx, x, -66, 24, 66, "steel", 1, { vertical: true });
  for (const cx of [x + 3, x + 21]) dots(ctx, column(cx, -66, 0, 9), "m3");
  G.grain(ctx, G.rectRegion(ctx, x, -66, 24, 66), 236 + x);
  for (const y of [-52, -24]) {
    G.drips(ctx, x + 10, y + 1, 4, 18, 237 + x - y, 2);
    disc(ctx, x + 12, y, 2.4, "hole", "mLine");
  }
  G.drips(ctx, x, -66, 24, 20, 238 + x, 3);
  G.dirt(ctx, x, -66, 24, 66, 239 + x, 0.25);
};

export const tunnelWall: EnvAsset = {
  id: "tunnelWall",
  box: [0, -122, 168, 0],
  draw(ctx) {
    flat(ctx, 0, -120, 168, 54, "hole");
    box(ctx, 0, -98, 168, 24, "concrete", 1);
    for (const x of [40, 112]) box(ctx, x, -99, 4, 26, "concrete", 2, { vertical: true });
    G.surface(ctx, 0, -98, 168, 24, 230, { rise: 0.35, drip: 5, dripLen: 16 });
    for (const x of [40, 112]) G.drips(ctx, x, -96, 4, 22, 231 + x, 1);
    box(ctx, 0, -70, 168, 4, "steel", 2);
    flat(ctx, 0, -66, 168, 66, "k1");
    flat(ctx, 0, -66, 168, 4, "k0");
    speckle(ctx, 24, -62, 120, 42, ["k0", "k2", "k0", "k3"], 14, 3);
    G.grain(ctx, G.rectRegion(ctx, 0, -70, 168, 70), 232);
    G.drips(ctx, 24, -66, 120, 34, 233, 7);
    G.rustPatch(ctx, 70, -40, 6, 3, 234);
    flat(ctx, 0, -18, 168, 1.5, "r2");
    flat(ctx, 0, -13, 168, 1.5, "r1");
    G.dirt(ctx, 0, -66, 168, 66, 235, 0.3);
    flat(ctx, 0, -66, 168, 2, "k0");
    tunnelPillar(ctx, 0);
    tunnelPillar(ctx, 144);
  },
};

const grid = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, step: number, color: string): void => {
  ctx.beginPath();
  for (let i = x; i <= x + w; i += step) {
    ctx.moveTo(i, y);
    ctx.lineTo(i, y + h);
  }
  for (let j = y; j <= y + h; j += step) {
    ctx.moveTo(x, j);
    ctx.lineTo(x + w, j);
  }
  stroke(ctx, color, 0.6);
};

const bricks = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void => {
  slab(ctx, x, y, w, h, "brick", 1);
  ctx.beginPath();
  for (let r = 0; r * 6 < h; r++) {
    ctx.moveTo(x, y + r * 6);
    ctx.lineTo(x + w, y + r * 6);
    for (let i = x + (r % 2) * 6; i < x + w; i += 12) {
      ctx.moveTo(i, y + r * 6);
      ctx.lineTo(i, y + r * 6 + 6);
    }
  }
  stroke(ctx, "bLine", 0.8);
};

const FAN_BLADE: Pt[] = [[0, 0], [6, -17], [15, -10], [4, 2]];

const fan = (ctx: CanvasRenderingContext2D, x: number, y: number, a: number): void => {
  box(ctx, x, y, 48, 48, "concrete", 2);
  box(ctx, x + 3, y + 3, 42, 42, "concrete", 1);
  G.surface(ctx, x, y, 48, 48, 246, { rise: 0.3, drip: 2, dripLen: 14 });
  disc(ctx, x + 24, y + 24, 19, "g0", "gLine");
  for (let i = 0; i < 3; i++) {
    const r = a + (i * Math.PI * 2) / 3;
    const pts = FAN_BLADE.map(([px, py]): Pt => [x + 24 + px * Math.cos(r) - py * Math.sin(r), y + 24 + px * Math.sin(r) + py * Math.cos(r)]);
    poly(ctx, pts, "green", 1);
  }
  disc(ctx, x + 24, y + 24, 4, "g2", "gLine");
};

export const metroPlatformWall: EnvAsset = {
  id: "metroPlatformWall",
  box: [0, -168, 144, 0],
  anim: true,
  draw(ctx, _state, t) {
    flat(ctx, 0, -168, 144, 72, "k1");
    speckle(ctx, 0, -168, 144, 70, ["k0", "r1", "k2", "k0"], 7, 7);
    G.grain(ctx, G.rectRegion(ctx, 0, -168, 144, 68), 245);
    box(ctx, 0, -100, 144, 4, "chrome", 1);
    bricks(ctx, 0, -96, 144, 24);
    G.grain(ctx, G.rectRegion(ctx, 0, -100, 144, 28), 240);
    G.drips(ctx, 0, -96, 144, 16, 241, 6);
    box(ctx, 0, -76, 144, 4, "rust", 1);
    flat(ctx, 0, -72, 144, 72, "m1");
    grid(ctx, 0, -72, 144, 72, 8, "m2");
    G.grain(ctx, G.rectRegion(ctx, 0, -72, 144, 72), 242);
    G.drips(ctx, 0, -72, 144, 30, 243, 6);
    G.dirt(ctx, 0, -72, 144, 72, 244, 0.3);
    fan(ctx, 96, -72, t * 6);
  },
};

export const structureAssets: EnvAsset[] = [streetWalkway, hazardPlate, girderBridge, ladder, liftLanding, pipeColumn, pipeBend, fuelTank, staircase, chainFence, latticePylon, stripLight, tunnelGate, tunnelFloor, tunnelWall, metroPlatformWall];
