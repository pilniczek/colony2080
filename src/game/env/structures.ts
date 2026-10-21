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

export const bar = (ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, w: number, mat: string, tone = 1): void => {
  const len = Math.hypot(bx - ax, by - ay);
  const nx = ((-(by - ay) / len) * w) / 2;
  const ny = (((bx - ax) / len) * w) / 2;
  poly(ctx, [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]], mat, tone, { dir: [1, 0] });
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
  if (!P.simple()) for (let i = x + TILE; i < x + w; i += TILE) wire(ctx, [[i, 3], [i, 9], [i + 0.6, 10.6], [i + 2.2, 10.6], [i + 2.6, 9]], "r3", 0.9);
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
  ctx.restore();
  flat(ctx, x, -2, w, 2, "k0");
};

const signPlate = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, mat = "chrome"): void => {
  wire(ctx, [[x + 2, y], [x + 4, y - 4]], "c1", 0.5);
  wire(ctx, [[x + w - 2, y], [x + w - 4, y - 4]], "c1", 0.5);
  box(ctx, x, y, w, h, mat, 1);
};

const TEAR: Pt[] = [[0, -46], [30, -46], [26, -40], [31, -36], [22, -31], [25, -24], [14, -20], [16, -12], [6, -9], [0, -4]];

export const chainFence: EnvAsset = {
  id: "chainFence",
  box: [-2, -52, 194, 0],
  draw(ctx) {
    fencePanel(ctx, 0, 96, TEAR);
    fencePanel(ctx, 96, 96);
    signPlate(ctx, 62, -40, 18, 8);
    if (!P.simple()) for (const y of [-38, -36, -34]) flat(ctx, 64, y, 12, 0.8, "c0");
    signPlate(ctx, 102, -42, 60, 13);
    disc(ctx, 109, -35.5, 3.6, "a1", "aLine");
    text(ctx, "TOXIC!!", 136, -35.5, 7, "a1");
    signPlate(ctx, 168, -40, 16, 7);
    if (!P.simple()) for (const y of [-38, -35.5]) flat(ctx, 170, y, 12, 1, "neon");
    for (const x of [0, 96, 192]) {
      cylV(ctx, x - 1.75, -50, 3.5, 50, "chrome", 1);
      cylV(ctx, x - 2.25, -51, 4.5, 2, "chrome", 0);
    }
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
  }
};

export const latticePylon: EnvAsset = {
  id: "latticePylon",
  box: [-10, -168, 34, 0],
  draw(ctx) {
    pylonTruss(ctx, 0, -168, -22);
    box(ctx, -5, -22, 34, 6, "concrete", 2);
    poly(ctx, [[-9, 0], [33, 0], [28, -16], [-4, -16]], "concrete", 1, { dir: [1, 0] });
    for (const x of [2.5, 10, 17.5]) flat(ctx, x, -9, 4, 7, "hole", "kLine");
  },
};

const gusset = (ctx: CanvasRenderingContext2D, x: number): void => {
  box(ctx, x, -24, 24, 24, "concrete", 2);
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
    rivets(ctx, 24, -21.5, w - 48, 8, "k3");
    rivets(ctx, 24, -2.5, w - 48, 8, "k3");
    gusset(ctx, 0);
    gusset(ctx, w - 24);
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
    for (const x of [0, w - 5]) {
      box(ctx, x, -2, 5, 8, "steel", 2);
      if (!P.simple()) flat(ctx, x + 1, -1.4, 3, 0.8, "m3");
    }
  },
};

export const pipeColumn: EnvAsset = {
  id: "pipeColumn",
  box: [-4, -168, 28, 0],
  draw(ctx) {
    cylV(ctx, 0, -168, 24, 168, "concrete", 2);
    for (const y of [-150, -78]) {
      cylV(ctx, -1.5, y, 27, 4, "concrete", 1);
      flat(ctx, -1.5, y + 1.5, 27, 0.8, "k3");
    }
    cylV(ctx, -3, -6, 30, 6, "concrete", 1);
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
    pipeRing(ctx, 76, -121, 26, false);
    pipeRing(ctx, -1, -46, 26, true);
    cylV(ctx, -3, -5, 30, 5, "chrome", 0);
  },
};

const dome = (ctx: CanvasRenderingContext2D, cx: number, a0: number, a1: number): void => {
  poly(ctx, arcPts(cx, -48, 11, 24, a0, a1, 16), "chrome", 1);
};

export const fuelTank: EnvAsset = {
  id: "fuelTank",
  box: [0, -74, 106, 0],
  draw(ctx) {
    box(ctx, 14, -26, 28, 26, "concrete", 1);
    for (let gx = 0; gx < 4; gx++) for (let gy = 0; gy < 4; gy++) flat(ctx, 17 + gx * 6.25, -23 + gy * 5.75, 3.5, 3.5, "hole");
    cylV(ctx, 82, -26, 5, 26, "steel", 2);
    box(ctx, 78, -27, 13, 3, "steel", 2);
    dome(ctx, 12, Math.PI / 2, Math.PI * 1.5);
    dome(ctx, 94, -Math.PI / 2, Math.PI / 2);
    box(ctx, 12, -72, 82, 48, "chrome", 1);
    for (const x of [17, 88]) flat(ctx, x, -72, 1, 48, "c0");
    if (!P.simple()) flat(ctx, 30, -69, 22, 3, "c0");
    trefoil(ctx, 78, -48, 7.5);
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
  for (const px of posts) {
    cylV(ctx, px - 1.75, -3, 3.5, 22, "chrome", 1);
    flat(ctx, px - 2.25, -3.5, 4.5, 1.5, "c2", "mLine");
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
    for (const x of [-3, 83]) box(ctx, x, -96, 4, 96, "steel", 1, { vertical: true });
    box(ctx, -3, -72, 90, 4, "steel", 2);
  },
};

const tunnelPillar = (ctx: CanvasRenderingContext2D, x: number): void => {
  box(ctx, x, -66, 24, 66, "steel", 1, { vertical: true });
  for (const cx of [x + 3, x + 21]) dots(ctx, column(cx, -66, 0, 9), "m3");
  for (const y of [-52, -24]) disc(ctx, x + 12, y, 2.4, "hole", "mLine");
};

export const tunnelWall: EnvAsset = {
  id: "tunnelWall",
  box: [0, -122, 168, 0],
  draw(ctx) {
    flat(ctx, 0, -120, 168, 54, "hole");
    box(ctx, 0, -98, 168, 24, "concrete", 1);
    for (const x of [40, 112]) box(ctx, x, -99, 4, 26, "concrete", 2, { vertical: true });
    box(ctx, 0, -70, 168, 4, "steel", 2);
    flat(ctx, 0, -66, 168, 66, "k1");
    flat(ctx, 0, -66, 168, 4, "k0");
    speckle(ctx, 24, -62, 120, 42, ["k0", "k2", "k0", "k3"], 14, 3);
    flat(ctx, 0, -18, 168, 1.5, "r2");
    flat(ctx, 0, -13, 168, 1.5, "r1");
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
    box(ctx, 0, -100, 144, 4, "chrome", 1);
    bricks(ctx, 0, -96, 144, 24);
    box(ctx, 0, -76, 144, 4, "rust", 1);
    flat(ctx, 0, -72, 144, 72, "m1");
    grid(ctx, 0, -72, 144, 72, 8, "m2");
    fan(ctx, 96, -72, t * 6);
  },
};

export const structureAssets: EnvAsset[] = [streetWalkway, hazardPlate, girderBridge, ladder, liftLanding, pipeColumn, pipeBend, fuelTank, staircase, chainFence, latticePylon, stripLight, tunnelGate, tunnelFloor, tunnelWall, metroPlatformWall];
