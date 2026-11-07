import { G } from "./grime";
import {
  BRASS, BUNKER, CLINE, CONDUIT, DOME, GOLD, MOSS, RED, ROCK, SLATE, SLINE, SPIKE, STONE, TEAL, WATER, WOOD, band, barredWindow, blobPts, blockGrime, bunkerBlock, column, conduit, door, eSign, eggPts,
  fern, grass, mossCap, oval, simple, slab, stone, vine, within, type Ctx, type Pt,
} from "./jungle";
import { vehicle, type Wreck } from "./jungleClutter";
import { P, type EnvAsset } from "./paint";

const { rng, path, flat, box, poly, cylH, disc, glow, stroke, shape, line, curve, hazard } = P;
const { PI, sin, cos, min, max, round } = Math;

const flamethrowerDoor: EnvAsset = {
  id: "flamethrowerDoor",
  box: [-3, -102, 243, 0],
  draw(ctx, state, _t, { w = 240, h = 96 }) {
    const seed = 580 + round(w);
    const k = w / 240;
    const low = round(h * 0.75);
    const back = [44 * k, w - 44 * k] as const;
    const wing = 168 * k;
    const front = [0, 100 * k] as const;
    bunkerBlock(ctx, back[0], back[1], h, seed);
    for (const x of [124 * k, 154 * k]) {
      flat(ctx, x, -h, 10, h - 5, BUNKER[2], CLINE);
      if (!simple()) flat(ctx, x + 1, -h, 2, h - 5, BUNKER[3]);
    }
    barredWindow(ctx, 92 * k, -h + 14, 22, 28, seed + 1);
    barredWindow(ctx, wing + 12, -h + 16, w - wing - 24, 34, seed + 3);
    blockGrime(ctx, back[0], back[1], h, seed + 4);
    bunkerBlock(ctx, front[0], front[1], low, seed + 7);
    door(ctx, 22 * k, min(low - 20, 50), state === 1, 48);
    blockGrime(ctx, front[0], front[1], low, seed + 8);
  },
};

const FALL_FOOT = 24;

const fallFoam = (ctx: Ctx, w: number, seed: number): void => {
  const r = rng(seed);
  flat(ctx, 0, -FALL_FOOT - 3, w, 4, "#b4bcb6");
  for (let x = 0; x < w; x += 4 + r() * 5) oval(ctx, x + 2, -FALL_FOOT - 2 + r() * 2, 3 + r() * 3, 1.6 + r() * 1.4, r() < 0.5 ? "#dce0dc" : WATER[3]);
};

const waterFlow = (ctx: Ctx, w: number, h: number, t: number): void => {
  const r = rng(630 + round(w));
  ctx.save();
  ctx.globalAlpha *= 0.5;
  for (let x = 1; x < w - 1; x += 4 + r() * 5) {
    const speed = 150 + r() * 90;
    const gap = 48 + r() * 50;
    const len = 10 + r() * 18;
    const width = 1 + r() * 1.6;
    const shift = (r() * gap + t * speed) % gap;
    for (let y = -h - gap + shift; y < -FALL_FOOT - len; y += gap) if (y > -h) flat(ctx, x, y, width, len, "#c8ccc8");
    if (simple()) x += 6;
  }
  ctx.restore();
};

const STEPS: readonly Pt[] = [[48, 216], [96, 240]];

const fallStone = (ctx: Ctx, x: number, y: number, seed: number): void => {
  const r = rng(seed);
  const pts: Pt[] = [[x, y + 3], [x + 5, y], [x + 16, y + 0.6], [x + 24, y + 2.4], [x + 24.6, y + 17], [x + 23, y + 23], [x + 1, y + 23], [x - 0.6, y + 15]];
  shape(ctx, pts, "#4c4436");
  within(ctx, pts, () => {
    for (let i = 0; i < (simple() ? 2 : 5); i++) shape(ctx, blobPts(x + 3 + r() * 18, y + 3 + r() * 9, 3 + r() * 3, 2 + r() * 2, seed + i, 7, 0.35), i % 2 ? "#5c5444" : "#3c3428");
    shape(ctx, [[x - 2, y + 16], [x + 8, y + 14], [x + 18, y + 14.6], [x + 26, y + 16.4], [x + 26, y + 24], [x - 2, y + 24]], "#b8b49c");
    flat(ctx, x - 2, y + 21, 28, 3, "#7c7864");
    if (!simple()) line(ctx, [[x + 1, y + 15.4], [x + 8, y + 14.2], [x + 18, y + 14.8], [x + 23, y + 16]], "#e0dcc4", 0.9);
    G.grain(ctx, G.polyRegion(ctx, pts), seed + 9, 0.7);
  });
  path(ctx, pts);
  stroke(ctx, SLINE);
  mossCap(ctx, x + 3, y + 0.8, 10, seed + 11, 1.5);
  if (simple()) return;
  ctx.save();
  ctx.globalAlpha *= 0.7;
  for (let px = x + 2; px < x + 23; px += 3 + r() * 3) flat(ctx, px, y - 1 - r() * 2, 1, 1 + r() * 2, "#dce0dc");
  ctx.restore();
};

const waterfall: EnvAsset = {
  id: "waterfall",
  box: [-10, -441, 154, -18],
  anim: true,
  draw(ctx, state, t, { w = 144, h = 432 }) {
    const seed = 620 + round(w);
    const r = rng(seed);
    flat(ctx, 0, -h, w, h - FALL_FOOT, WATER[2]);
    for (let x = 0; x < w; x += 3 + r() * 4) {
      const k = r();
      flat(ctx, x, -h, 1 + r() * 2.4, h - FALL_FOOT, k < 0.15 ? WATER[0] : k < 0.45 ? WATER[1] : k < 0.75 ? "#909c94" : WATER[3]);
    }
    if (!simple()) for (let x = 2; x < w; x += 5 + r() * 6) for (let y = -h + r() * 24; y < -FALL_FOOT - 6; y += 12 + r() * 16) flat(ctx, x, y, 1.2, 3 + r() * 5, r() < 0.5 ? WATER[0] : "#909c94");
    flat(ctx, 0, -h, w, 2, WATER[3]);
    waterFlow(ctx, w, h, t);
    fallFoam(ctx, w, seed + 7);
    if (state === 1) for (const [x, y] of STEPS) fallStone(ctx, (x * w) / 144, -h + y, seed + x);
  },
};

const spike = (ctx: Ctx, x: number, hh: number, lean: number): void => {
  const tip: Pt = [x + 1.9 + lean * hh, -hh];
  shape(ctx, [[x, -3], tip, [x + 3.8, -3]], SPIKE[1], "#0a1010");
  shape(ctx, [[x, -3], tip, [x + 1.9, -3]], SPIKE[2]);
  if (!simple()) line(ctx, [[x + 0.9, -4], [tip[0] - 0.2, tip[1] + 2]], SPIKE[3], 0.5);
};

const rubble = (ctx: Ctx, x0: number, x1: number, seed: number): void => {
  const r = rng(seed);
  const mid = (x0 + x1) / 2;
  const top: Pt[] = [[x0 - 7, 0], [x0 - 5, -10], [x0 - 1, -19], [x0 + 4, -22]];
  for (let x = x0 + 16; x < x1 - 10; x += 14 + r() * 8) top.push([x, -21.4 - r() * 1.6]);
  top.push([x1 - 4, -22], [x1 + 1, -19], [x1 + 5, -10], [x1 + 7, 0]);
  shape(ctx, top, ROCK[0], SLINE);
  for (let i = 0; i < (simple() ? 8 : round((x1 - x0) / 7)); i++) {
    const cx = x0 + 2 + r() * (x1 - x0 - 4);
    stone(ctx, cx, -3 - r() * 13, 4 + r() * 5, 3 + r() * 3, seed + i * 3, ROCK);
  }
  for (let x = x0; x < x1 - 4; x += 24) {
    const w = min(24, x1 - x);
    const deck: Pt[] = [[x + 0.6, -19.4], [x + 3.4, -22.6 - r() * 0.6], [x + w - 4, -23], [x + w - 0.6, -19.2], [x + w * 0.6, -16.8], [x + w * 0.2, -17.2]];
    shape(ctx, deck, ROCK[2], SLINE);
    within(ctx, deck, () => {
      flat(ctx, x, -24, w, 2, ROCK[3]);
      flat(ctx, x, -18.4, w, 3, ROCK[1]);
    });
  }
  mossCap(ctx, mid - 14, -22.4, 16, seed + 40, 1.5);
  mossCap(ctx, x0 + 10, -22.4, 10, seed + 44, 1.2);
  G.grain(ctx, G.polyRegion(ctx, top), seed + 41, 0.7);
  G.dirt(ctx, x0, -21, x1 - x0, 21, seed + 42, 0.4);
  G.scorch(ctx, [[mid + 8, -20], [mid + 22, -20], [mid + 20, -12], [mid + 6, -13]], seed + 43);
};

const spikes: EnvAsset = {
  id: "spikes",
  box: [0, -24, 192, 1],
  draw(ctx, state, _t, { w = 192 }) {
    const seed = 640 + round(w);
    const r = rng(seed);
    const heap: Pt | null = state === 1 ? [24, 168] : null;
    flat(ctx, 0, -6, w, 6, "#0a100e");
    for (let x = 1; x < w - 3; x += 4.6) {
      const hh = 15 + r() * 4;
      const bend = r();
      if (heap && x > heap[0] - 6 && x < heap[1] + 2) continue;
      const near = heap && x > heap[0] - 10 && x < heap[1] + 4 && bend < 0.7;
      spike(ctx, x, hh, near && heap ? (x < (heap[0] + heap[1]) / 2 ? -0.3 : 0.3) * bend : 0);
    }
    flat(ctx, 0, -5, w, 3, TEAL[3], CLINE);
    if (!simple()) {
      flat(ctx, 0, -5, w, 0.8, "#8c9898");
      for (let x = 6; x < w; x += 12) flat(ctx, x, -4, 1.2, 1.2, TEAL[0]);
    }
    G.grain(ctx, G.rectRegion(ctx, 0, -6, w, 6), seed + 1, 0.6);
    G.dirt(ctx, 0, -8, w, 8, seed + 2, 0.5);
    G.drips(ctx, 0, -5, w, 4, seed + 3, round(w / 24));
    if (heap) rubble(ctx, heap[0], heap[1], seed + 4);
  },
};

const BOULDER = eggPts(52, -44, 50, 36, -0.7, 0.26, 701, 48);
const CHUNKS: Pt[][] = [
  [[6, 0], [8, -12], [18, -19], [30, -15], [32, 0]],
  [[26, 0], [30, -17], [44, -25], [58, -22], [62, -8], [60, 0]],
  [[56, 0], [60, -14], [72, -18], [84, -12], [86, 0]],
  [[80, 0], [84, -9], [94, -7], [97, 0]],
];
const CRACKS: [Pt[], number][] = [
  [[[4, -40], [24, -44], [40, -38], [58, -46], [78, -52], [96, -62]], 1.2],
  [[[58, -46], [66, -62], [80, -78], [92, -86]], 1],
  [[[40, -38], [44, -24], [38, -10]], 0.9],
];

const boulderRock = (ctx: Ctx, seed: number): void => {
  shape(ctx, BOULDER, ROCK[1]);
  within(ctx, BOULDER, () => {
    oval(ctx, 42, -58, 46, 32, ROCK[2], null, -0.7);
    if (!simple()) oval(ctx, 40, -68, 24, 10, ROCK[3], null, -0.7);
    oval(ctx, 78, -4, 54, 22, ROCK[0], null, -0.36);
    G.grain(ctx, G.polyRegion(ctx, BOULDER), seed, 0.5);
    for (const [pts, w] of CRACKS) {
      curve(ctx, pts, "#1c1c14", w);
      if (!simple()) curve(ctx, pts.map(([x, y]) => [x + 0.8, y + 0.9] as Pt), ROCK[3], 0.5);
    }
    G.dirt(ctx, 0, -36, 104, 36, seed + 1, 0.45);
  });
  path(ctx, BOULDER);
  stroke(ctx, SLINE);
};

const boulder: EnvAsset = {
  id: "boulder",
  box: [-4, -100, 104, 1],
  draw(ctx, state) {
    const seed = 700;
    const r = rng(seed + 9);
    if (state === 1) {
      for (const [i, pts] of CHUNKS.entries()) {
        shape(ctx, pts, ROCK[1]);
        within(ctx, pts, () => {
          shape(ctx, pts.map(([x, y]) => [x - 1, y - 4] as Pt), ROCK[2]);
          shape(ctx, pts.map(([x, y]) => [x + 3, y + 8] as Pt), ROCK[1]);
          flat(ctx, 0, -4, 100, 4, ROCK[0]);
          G.grain(ctx, G.polyRegion(ctx, pts), seed + i, 0.5);
        });
        path(ctx, pts);
        stroke(ctx, SLINE);
      }
      for (let i = 0; i < (simple() ? 5 : 10); i++) stone(ctx, -2 + r() * 100, -2 - r() * 3, 3 + r() * 4, 2 + r() * 2, seed + 20 + i, ROCK);
      mossCap(ctx, 64, -16, 14, seed + 4, 1.5);
      grass(ctx, 2, 10, 6, seed + 5);
      return;
    }
    for (let i = 0; i < (simple() ? 3 : 6); i++) stone(ctx, 4 + r() * 92, -3, 4 + r() * 5, 3 + r() * 2, seed + 30 + i, ROCK);
    boulderRock(ctx, seed);
    mossCap(ctx, 8, -3, 74, seed + 6, 4);
    mossCap(ctx, 10, -58, 22, seed + 7, 2.5);
    if (!simple()) {
      vine(ctx, 20, -56, 22, seed + 8);
      fern(ctx, 96, 14, seed + 10, MOSS);
    }
    grass(ctx, 0, 20, 7, seed + 11);
  },
};

const strut = (ctx: Ctx, a: Pt, b: Pt, w: number, c: string): void => {
  line(ctx, [a, b], "kLine", w + 1.2, "butt");
  line(ctx, [a, b], c, w, "butt");
};

const JEEP: Wreck = {
  top: [[0, -10], [0, -30], [2, -31.5], [40, -31.5], [42.5, -25], [55.5, -25], [58, -32.5], [89, -31], [93, -28], [94, -10]],
  base: -10,
  belt: -25,
  roof: [58, 89, -32.5],
  wheels: [[20, 10.5, "tyre"], [76, 10.5, "tyre"]],
  glass: [],
  doors: [42.5, 55.5],
  handles: [[49, -21.5]],
  holes: [],
  seams: [[[58, -32.5], [59.5, -18]], [[86, -31], [87, -18]]],
  bars: [
    [[3, -30], [-6, -54]],
    [[15, -30], [-6, -54]],
    [[-1, -42], [9, -42]],
    [[58.5, -32.5], [56, -50], [58, -51.5], [62, -51.5], [64.5, -32.5]],
  ],
  screen: [[59.5, -33], [57.4, -49.6], [61.2, -49.6], [63.2, -33]],
  seats: [
    { pts: [[22, -30], [20.5, -41.5], [26, -43], [29, -30]], lit: [18, -44, 4, 16] },
    { pts: [[42, -25], [40, -40], [44.5, -41.5], [47, -25]], lit: [38, -42, 4, 18] },
  ],
  wheelPost: [[57, -26], [52, -35.5]],
  grille: [89, 93, -28, -15],
  tail: [0.4, -29, 2.4, 3.4],
  head: [90, -26, 3.4, 3.4],
  bumpers: [[-3, -14, 5, 3], [92, -14, 6, 3]],
  moss: [],
  leaves: [],
  vines: [],
  ferns: [],
  tones: ["#14302a", "#24543f", "#34704f", "#68a080", "#08120e"],
  mid: "#2c624a",
  camo: [[12, -24, 8, 3.4, "#122a20"], [33, -19, 7, 3, "#122a20"], [50, -21, 4, 2.4, "#4c6a38"], [68, -27.5, 9, 3, "#122a20"], [83, -19, 6, 2.6, "#4c6a38"], [25, -27.5, 6, 2.2, "#4c6a38"], [72, -17, 6, 2.2, "#122a20"]],
  rust: 14,
  seed: 7560,
};

const jeep: EnvAsset = {
  id: "jeep",
  box: [-16, -58, 100, 1],
  draw(ctx, state) {
    const c = JEEP;
    vehicle(ctx, c);
    flat(ctx, -8, -24, 10, 10, "m1", "mLine");
    disc(ctx, -4, -19, 4, "m2", "mLine");
    if (!simple()) for (let a = 0; a < PI * 2; a += PI / 3) flat(ctx, -4 + cos(a) * 2.5 - 0.5, -19 + sin(a) * 2.5 - 0.5, 1, 1, "m3");
    G.inside(ctx, G.rectRegion(ctx, -8, -24, 10, 10), () => G.dirt(ctx, -8, -24, 10, 10, c.seed + 150, 0.5));
    disc(ctx, -6, -54, 2.6, "m2", "mLine");
    line(ctx, [[-4, -23], [-5, -52]], "#1a1a18", 0.7);
    if (state === 2) line(ctx, [[-8, -54], [-16, -46]], "#1a1a18", 0.8);
    else {
      line(ctx, [[-8.4, -54], [-9, -38]], "#1a1a18", 0.6);
      curve(ctx, [[-9, -38], [-9, -34.6], [-7, -34.2], [-6.6, -36]], "m3", 0.9);
    }
    flat(ctx, 33, -33, 4, 1.6, state === 0 ? "m1" : "m3", "mLine");
    if (!simple()) flat(ctx, 80, -33.2, 3, 2, state === 0 ? "#86200e" : "y2", c.tones?.[4]);
    mossCap(ctx, 66, -32.6, 9, c.seed + 41, 1.2);
    mossCap(ctx, 4, -31.8, 6, c.seed + 42, 1);
    grass(ctx, 30, 36, 3, c.seed + 130);
  },
};

const DOME_PTS: Pt[] = [[9, -26], [11, -32], [17, -36.6], [24, -38], [31, -36.6], [37, -32], [39, -26]];
const RIM = ["#303c3c", "#485454", "#6c8480", "#a8b4b4"] as const;

const turretFlash = (ctx: Ctx, x: number, y: number, t: number): void => {
  const heat = 1 - Math.floor((t % 0.36) / 0.06) / 6;
  const len = 9 + 7 * heat;
  if (!simple()) glow(ctx, x + len * 0.4, y, 9 + 6 * heat, "#ffb040", 0.55 * heat + 0.2);
  shape(ctx, [[x, y - 4.4], [x + len * 0.55, y - 5.6], [x + len * 0.5, y - 1.6], [x + len, y], [x + len * 0.5, y + 1.6], [x + len * 0.55, y + 5.6], [x, y + 4.4]], "#e0601c");
  shape(ctx, [[x, y - 2.6], [x + len * 0.7, y], [x, y + 2.6]], "#ffd060");
  oval(ctx, x + 1.6, y, 2 + heat, 1.6 + heat * 0.6, "#fff4c8");
};

const cannonTurret: EnvAsset = {
  id: "cannonTurret",
  box: [-4, -46, 60, 1],
  draw(ctx, state, t = 0) {
    const off = state === 1;
    band(ctx, -2, -6, 50, 6, BUNKER, 2);
    if (!simple()) for (let x = 2; x < 46; x += 8) flat(ctx, x, -4, 1.4, 1.4, BUNKER[0]);
    column(ctx, 16, -24, 16, 18, DOME, 1);
    hazard(ctx, 16, -10, 16, 4, 3);
    band(ctx, 30, -21, 22, 4.4, TEAL, 2);
    flat(ctx, 50, -22.4, 5, 7, TEAL[1], CLINE);
    flat(ctx, 27, -24, 8, 10, TEAL[2], CLINE);
    disc(ctx, 31, -15.6, 1.6, off ? "#300a08" : "neon", CLINE);
    if (!off && !simple()) glow(ctx, 31, -15.6, 6, "neonGlow", 0.5);
    shape(ctx, DOME_PTS, DOME[1]);
    within(ctx, DOME_PTS, () => {
      oval(ctx, 18, -32, 10, 7, DOME[2]);
      oval(ctx, 36, -26, 8, 10, DOME[0]);
      if (!simple()) line(ctx, [[14, -31], [19, -35.4], [24, -36.4]], DOME[3], 1.3);
    });
    path(ctx, DOME_PTS);
    stroke(ctx, CLINE);
    band(ctx, 5, -27, 38, 3.4, RIM, 2);
    flat(ctx, 21, -40, 6, 2, DOME[3], CLINE);
    G.grain(ctx, G.polyRegion(ctx, DOME_PTS), 781);
    G.grain(ctx, G.rectsRegion(ctx, [[-2, -6, 50, 6], [16, -24, 16, 18], [27, -24, 28, 10]]), 785, 0.6);
    G.drips(ctx, 17, -24, 14, 12, 782, 3);
    G.dirt(ctx, 16, -24, 16, 18, 783, 0.6);
    G.dirt(ctx, -2, -6, 50, 6, 786, 0.5);
    if (state === 2) turretFlash(ctx, 55, -18.9, t);
    if (!off) return;
    ctx.save();
    ctx.globalAlpha *= 0.4;
    shape(ctx, DOME_PTS, "#060806");
    flat(ctx, 16, -24, 16, 14, "#060806");
    ctx.restore();
    G.drips(ctx, 18, -26, 12, 8, 787, 3, false);
  },
};

const HOLE: Pt[] = [[6, -29], [14, -30], [22, -27], [29, -29], [29, -16], [26, -7], [16, -5], [8, -8], [5, -18]];

const distributionCabinet: EnvAsset = {
  id: "distributionCabinet",
  box: [-6, -46, 42, 1],
  draw(ctx, state) {
    const broken = state === 1;
    conduit(ctx, [[-6, -20], [3, -20]]);
    conduit(ctx, [[24, -1], [24, 0], [40, 0]]);
    band(ctx, 2, -32, 30, 32, CONDUIT, 2);
    if (broken) {
      G.scorch(ctx, HOLE, 801);
      shape(ctx, HOLE, "#060808", CLINE);
      for (const [x, y] of [[12, -20], [20, -14], [15, -10]] as const) line(ctx, [[x, y], [x + 4, y + 2], [x + 1, y + 6]], RED[2], 0.7);
      line(ctx, [[3, -20], [6, -18], [5, -14]], "y1", 0.6);
      line(ctx, [[3, -21], [7, -23], [8, -20]], "a1", 0.6);
      shape(ctx, [[4, -31], [9, -30.4], [3, -8], [-2, -9.6]], "#6c4c2c", "rLine");
      if (!simple()) flat(ctx, 3.4, -28, 2, 2, "#2a1c10");
      G.rim(ctx, HOLE, 802, "#5c6c6c", "#060808");
      eSign(ctx, 21, -38, 5, 0.35);
    } else {
      band(ctx, 5, -29, 24, 26, CONDUIT, 1);
      if (!simple()) for (let y = -26; y < -16; y += 2.4) flat(ctx, 8, y, 10, 1, CONDUIT[0]);
      flat(ctx, 24, -18, 2, 6, "m3", "mLine");
      for (const y of [-26, -8]) flat(ctx, 3.6, y, 1.6, 3, "m2");
      disc(ctx, 23, -25, 1.3, "screen", CLINE);
      eSign(ctx, 17, -38, 5.5);
    }
    line(ctx, [[17, -32.5], [17, -34]], "m1", 1);
    G.grain(ctx, G.rectRegion(ctx, 2, -32, 30, 32), 803);
    G.drips(ctx, 2, -32, 30, 18, 804, 4);
    G.dirt(ctx, 2, -32, 30, 32, 805, 0.4);
  },
};

const PANEL: Pt[] = [[9, -37], [39, -37.6], [39.6, -7], [8.6, -7]];
const FACES: Pt[][] = [
  [[12.6, -34], [23, -34], [17, -25], [12.6, -24]],
  [[25.6, -34], [36, -34], [36, -22.4], [24, -22.4], [20, -26.4]],
  [[12.6, -21.6], [16.6, -22.6], [22.4, -10], [12.6, -10]],
  [[25, -20], [36, -20], [36, -10], [27.6, -10]],
];

const stonePuzzle: EnvAsset = {
  id: "stonePuzzle",
  box: [-3, -40, 51, 1],
  draw(ctx, state) {
    const t = state === 1 ? GOLD : SLATE;
    slab(ctx, 0, -9, 48, 9, 820, true);
    shape(ctx, PANEL, SLATE[2], SLINE);
    within(ctx, PANEL, () => {
      flat(ctx, 8, -38, 32, 2, SLATE[3]);
      flat(ctx, 37.6, -38, 3, 32, SLATE[0]);
      flat(ctx, 11.4, -35.2, 25.8, 26.4, SLATE[0]);
    });
    for (const [i, pts] of FACES.entries()) {
      shape(ctx, pts, t[2], SLINE);
      within(ctx, pts, () => {
        flat(ctx, 10, -36, 30, 1.6, t[3]);
        shape(ctx, pts.map(([x, y]) => [x + 2.4, y + 2.2] as Pt), t[1]);
        shape(ctx, pts.map(([x, y]) => [x + 1, y + 1] as Pt), t[2]);
        const [fx, fy] = pts[0] as Pt;
        if (!simple()) line(ctx, [[fx + 2, fy + 3], [fx + 5, fy + 6]], t[0], 0.5);
        G.grain(ctx, G.polyRegion(ctx, pts), 830 + i, 0.5);
      });
    }
    if (state === 1 && !simple()) glow(ctx, 24, -22, 18, GOLD[3], 0.3);
    G.grain(ctx, G.polyRegion(ctx, PANEL), 826, 0.7);
    G.dirt(ctx, 8, -37, 32, 30, 827, 0.3);
    mossCap(ctx, 10, -37.4, 14, 828, 1.6);
    if (!simple()) for (const x of [6, 42]) line(ctx, [[x, -6], [x + 2, -4], [x, -2]], STONE[0], 0.8);
  },
};

const BLOCK_PTS: Pt[] = [[0, 0], [-0.6, -10], [2, -14.4], [11, -15.2], [15, -12], [15.4, 0]];
const STONE_AT: Pt = [26, -27];
const WIRE_END: Pt = [94, -6];
const BOARD: Pt[] = [[2, 0], [2.6, -15.4], [21, -16.2], [21.6, 0]];
const POST: Pt[] = [[38.6, 0], [39, -27.4], [41.4, -27.4], [41.8, 0]];

const tripwire: EnvAsset = {
  id: "tripwire",
  box: [-2, -50, 98, 1],
  draw(ctx, state) {
    const cut = state === 1;
    shape(ctx, BOARD, WOOD[2], "rLine");
    within(ctx, BOARD, () => {
      flat(ctx, 2, -17, 20, 2, WOOD[3]);
      flat(ctx, 2, -3, 20, 3, WOOD[1]);
      if (!simple()) for (const y of [-11, -6]) line(ctx, [[3, y], [21, y + 0.6]], WOOD[1], 0.5);
      G.grain(ctx, G.polyRegion(ctx, BOARD), 846, 0.6);
    });
    flat(ctx, 5, -13, 1.2, 1.2, "m3");
    flat(ctx, 17.4, -13, 1.2, 1.2, "m3");
    shape(ctx, POST, WOOD[2], "rLine");
    if (!simple()) flat(ctx, 39.2, -26, 0.8, 25, WOOD[3]);
    ctx.save();
    ctx.translate(STONE_AT[0], STONE_AT[1]);
    shape(ctx, BLOCK_PTS, ROCK[1]);
    within(ctx, BLOCK_PTS, () => {
      flat(ctx, -2, -16, 20, 5, ROCK[2]);
      if (!simple()) flat(ctx, 2, -15, 8, 1.4, ROCK[3]);
      flat(ctx, -2, -3, 20, 3, ROCK[0]);
      line(ctx, [[6, -14], [8, -9], [6, -4]], "#1c1c14", 0.7);
      G.grain(ctx, G.polyRegion(ctx, BLOCK_PTS), 844, 0.7);
    });
    path(ctx, BLOCK_PTS);
    stroke(ctx, SLINE);
    mossCap(ctx, 1, -14.6, 9, 845, 1.6);
    ctx.restore();
    flat(ctx, 41.4, -15, 3, 2, "m2", "mLine");
    flat(ctx, WIRE_END[0] - 1, WIRE_END[1], 2, -WIRE_END[1], "m1", "mLine");
    if (cut) {
      curve(ctx, [[44, -14], [52, -8], [56, -1]], "c1", 0.6);
      curve(ctx, [WIRE_END, [86, -3], [82, -0.6]], "c1", 0.6);
    } else {
      line(ctx, [[44, -14], WIRE_END], "c2", 0.6);
      if (!simple()) line(ctx, [[44, -13.6], [WIRE_END[0], WIRE_END[1] + 0.4]], "#00000060", 0.4);
      ctx.save();
      ctx.translate(48, -14);
      shape(ctx, blobPts(0, 4.6, 3.4, 4.6, 841, 8, 0.05), "o1", "kLine");
      if (!simple()) for (let y = 1.4; y < 7.4; y += 2) flat(ctx, -3, y, 6, 0.6, "o0");
      flat(ctx, -1, -0.6, 2, 1.6, "m2");
      ctx.restore();
    }
    grass(ctx, 0, 24, 7, 842);
    grass(ctx, 34, 12, 8, 847);
    grass(ctx, 76, 20, 9, 843);
  },
};

const MINE_DOME: Pt[] = Array.from({ length: 15 }, (_, i) => [cos(PI + (PI * i) / 14) * 8.5, -3.4 + sin(PI + (PI * i) / 14) * 5.6] as Pt);
const MINE_FLANGE: Pt[] = [[-11.5, -0.4], [-10.4, -3.6], [10.4, -3.6], [11.5, -0.4]];
const MINE_SOIL = "#2a2214";
const LAMP_OFF = "#4a0c08";

const mineArmed = (ctx: Ctx, t: number): void => {
  shape(ctx, blobPts(0, -0.2, 13, 2.2, 865, 10, 0.2), MINE_SOIL);
  shape(ctx, MINE_FLANGE, "o0", "kLine");
  within(ctx, MINE_FLANGE, () => {
    flat(ctx, -12, -3.6, 24, 1, "o2");
    flat(ctx, -12, -1.4, 24, 1, "#2c2410");
    for (let x = -9; x <= 9; x += 4.5) disc(ctx, x, -2.2, 0.55, "m3", "mLine");
    G.grain(ctx, G.polyRegion(ctx, MINE_FLANGE), 866, 0.8);
    G.rustPatch(ctx, 6, -1.8, 2.4, 0.9, 867);
  });
  shape(ctx, MINE_DOME, "o1", "kLine");
  within(ctx, MINE_DOME, () => {
    flat(ctx, -9, -9.2, 18, 2.4, "o2");
    flat(ctx, -4, -9.2, 4, 1.4, "o3");
    hazard(ctx, -9, -6.2, 18, 2.2, 1.6, { line: "kLine" });
    flat(ctx, -9, -4, 18, 0.6, "o0");
    G.grain(ctx, G.polyRegion(ctx, MINE_DOME), 868, 0.7);
    G.dirt(ctx, -9, -9, 18, 5.6, 869, 0.5);
  });
  G.chips(ctx, -10.4, -3.6, 20.8, 870, G.DIRT);
  flat(ctx, -1.6, -10.4, 3.2, 1.6, "m1", "mLine");
  flat(ctx, -4, -11.6, 8, 1.4, "m2", "mLine");
  flat(ctx, -4, -11.6, 8, 0.5, "m3");
  const lit = Math.floor(t * 2) % 2 === 0;
  disc(ctx, 0, -12.6, 1.5, lit ? "neon" : LAMP_OFF, "kLine");
  if (lit) {
    glow(ctx, 0, -12.6, 7, "neonGlow", 0.75);
    disc(ctx, -0.4, -13, 0.5, "#ffd0c0");
  }
  grass(ctx, -13, 3.5, 3, 863);
  grass(ctx, 10, 3.5, 3, 864);
};

const mineBlown = (ctx: Ctx): void => {
  shape(ctx, blobPts(0, -0.5, 11, 2.6, 861, 10, 0.3), "#0b0806");
  G.scorch(ctx, [[-10, -1], [10, -1], [8, 0], [-8, 0]], 862);
  for (const [x, y, a] of [[-8, -1.2, -0.5], [7, -1.4, 0.6], [2, -0.8, 0.2]] as [number, number, number][]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    shape(ctx, [[-2.4, 0], [-1.6, -1.6], [1.8, -1.2], [2.6, 0]], "o0", "kLine");
    flat(ctx, -1.6, -1.6, 3.2, 0.5, "o2");
    ctx.restore();
  }
  grass(ctx, -13, 3.5, 3, 863);
  grass(ctx, 10, 3.5, 3, 864);
};

const mine: EnvAsset = {
  id: "mine",
  box: [-14, -20, 14, 1],
  anim: true,
  draw(ctx, state, t) {
    if (state === 1) mineBlown(ctx);
    else mineArmed(ctx, t);
  },
};

const CAN: Pt[] = [[0, 0], [0, -17], [3, -20], [16, -20], [16, 0]];

const canister: EnvAsset = {
  id: "canister",
  box: [-1, -25, 17, 1],
  draw(ctx) {
    poly(ctx, CAN, "brick", 2, { dir: [1, 0] });
    flat(ctx, 3, -24, 4, 4, "m2", "mLine");
    line(ctx, [[8, -20], [13, -23], [15, -20]], "m1", 1.6);
    if (!simple()) {
      line(ctx, [[2, -16], [14, -4]], "b3", 0.8);
      line(ctx, [[14, -16], [2, -4]], "b3", 0.8);
      flat(ctx, 1, -10, 14, 1, "b0");
    }
    G.grain(ctx, G.polyRegion(ctx, CAN), 881);
    G.dirt(ctx, 0, -20, 16, 20, 882, 0.4);
  },
};

const BLADES: readonly [Pt, Pt][] = [[[1, -3], [14, -5]], [[1, -6], [14, -4.4]]];

const cutters: EnvAsset = {
  id: "cutters",
  box: [-1, -9, 25, 1],
  draw(ctx) {
    for (const [a, b] of BLADES) strut(ctx, a, b, 2, RED[2]);
    shape(ctx, [[14, -6], [24, -5.6], [22, -4.6], [14, -3.4]], "c1", "mLine");
    disc(ctx, 14, -4.7, 1.1, "m2", "mLine");
  },
};

const grenade: EnvAsset = {
  id: "grenade",
  box: [-5, -13, 5, 1],
  draw(ctx) {
    shape(ctx, blobPts(0, -4.6, 3.6, 4.6, 901, 10, 0.04), "o1", "kLine");
    if (!simple()) for (let y = -8; y < -1; y += 2) flat(ctx, -3, y, 6, 0.6, "o0");
    flat(ctx, -1.4, -11, 2.8, 2, "m2", "mLine");
    line(ctx, [[1.4, -10], [4, -8], [3.4, -4]], "m1", 0.8);
    disc(ctx, -2.6, -11.4, 1.2, "m3", "mLine");
  },
};

const flamethrower: EnvAsset = {
  id: "flamethrower",
  box: [-1, -15, 43, 1],
  draw(ctx) {
    cylH(ctx, 6, -13, 12, 8, "brick", 2);
    flat(ctx, 16, -8, 22, 3, "m2", "mLine");
    flat(ctx, 36, -9, 6, 5, "m1", "mLine");
    flat(ctx, 10, -5, 4, 5, "m1", "mLine");
    flat(ctx, 0, -9, 7, 3, "m1", "mLine");
    if (!simple()) {
      flat(ctx, 8, -12, 8, 1, "b3");
      disc(ctx, 40, -6.5, 1, "a1");
    }
  },
};

const bonusPickup: EnvAsset = {
  id: "bonusPickup",
  box: [-1, -15, 17, 1],
  draw(ctx, state) {
    if (state === 1) return;
    box(ctx, 0, -12, 16, 12, "steel", 2);
    flat(ctx, 6.5, -10, 3, 8, "acid");
    flat(ctx, 4, -7.5, 8, 3, "acid");
    if (!simple()) glow(ctx, 8, -6, 11, "acid", 0.35);
    G.grain(ctx, G.rectRegion(ctx, 0, -12, 16, 12), 921);
  },
};

const POLE = [50, 20] as const;

const chevronPole = (ctx: Ctx, top: number, bottom: number): void => {
  const [x, w] = POLE;
  column(ctx, x, top, w, bottom - top, TEAL, 2);
  for (let y = bottom - 24; y > top - 24; y -= 24) {
    const py = max(top, y);
    flat(ctx, x, py, w, 1.4, TEAL[0]);
    if (y + 16 < top) continue;
    band(ctx, x, y + 16, w, 7, BRASS, 1);
    const cx = x + w / 2;
    shape(ctx, [[cx, y + 17], [cx + 4.6, y + 21.6], [cx + 2.2, y + 21.6], [cx, y + 19.4], [cx - 2.2, y + 21.6], [cx - 4.6, y + 21.6]], BRASS[3], CLINE);
    if (!simple()) flat(ctx, x + 3, y + 7, w - 6, 1.2, TEAL[1]);
  }
  G.grain(ctx, G.rectRegion(ctx, x, top, w, bottom - top), 943 + round(top), 0.6);
  G.drips(ctx, x, top, w, min((bottom - top) * 0.4, 90), 944, 2);
};

const liftStation = (ctx: Ctx, seed: number): void => {
  for (const x of [2, 18, 34, 86]) column(ctx, x, -24, 3, 18, TEAL, 1);
  for (const y of [-24, -15]) {
    flat(ctx, 0, y, 38, 1.8, BRASS[2], CLINE);
    flat(ctx, 76, y, 20, 1.8, BRASS[2], CLINE);
    if (!simple()) flat(ctx, 0, y, 38, 0.6, BRASS[3]);
  }
  column(ctx, 9, -30, 2.6, 24, SPIKE, 2);
  flat(ctx, 8.2, -31.6, 4.2, 2, SPIKE[3], CLINE);
  for (const x of [40, 76]) column(ctx, x, -46, 4, 40, TEAL, 1);
  hazard(ctx, 40, -50, 40, 4, 3);
  band(ctx, 0, -7, 96, 3, TEAL, 1);
  hazard(ctx, 0, -4, 96, 4, 4);
  band(ctx, 80, -38, 12, 18, TEAL, 2);
  flat(ctx, 82.4, -35.6, 7.2, 5, "hole", CLINE);
  disc(ctx, 86, -33.1, 1.5, "screen");
  if (!simple()) glow(ctx, 86, -33.1, 5, "screen", 0.4);
  for (const [y, up] of [[-28, true], [-24, false]] as const) shape(ctx, up ? [[86, y - 1.6], [88, y + 1], [84, y + 1]] : [[84, y - 1], [88, y - 1], [86, y + 1.6]], BRASS[3], CLINE);
  G.grain(ctx, G.rectsRegion(ctx, [[0, -7, 96, 7], [80, -38, 12, 18], [40, -46, 4, 40], [76, -46, 4, 40]]), seed, 0.6);
  G.drips(ctx, 40, -46, 40, 16, seed + 1, 4);
  G.dirt(ctx, 0, -7, 96, 7, seed + 2, 0.4);
  G.rustPatch(ctx, 78, -10, 3, 1.5, seed + 3);
};

const towerLift: EnvAsset = {
  id: "towerLift",
  box: [-4, -384, 100, 1],
  draw(ctx, state, _t, { h = 384 }) {
    if (state === 1) {
      chevronPole(ctx, -96, -6);
      hazard(ctx, POLE[0] - 1, -100, POLE[1] + 2, 5, 3);
    } else chevronPole(ctx, -h, -6);
    liftStation(ctx, 945 + state);
  },
};

export const junglePropAssets: EnvAsset[] = [
  flamethrowerDoor, waterfall, spikes, boulder, jeep, cannonTurret, distributionCabinet, stonePuzzle, tripwire, mine, canister, cutters, grenade, flamethrower, bonusPickup, towerLift,
];
