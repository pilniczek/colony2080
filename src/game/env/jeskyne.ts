import { G } from "./grime";
import { jeskyneClutterAssets } from "./jeskyneClutter";
import { jeskyneExtraAssets } from "./jeskyneExtra";
import { jeskyneStructureAssets } from "./jeskyneStructures";
import { jag, jeskyneTerrainAssets } from "./jeskyneTerrain";
import { P, type EnvAsset } from "./paint";

const { rng, path, flat, box, disc, glow, stroke, shape, line, hazard } = P;
const { PI, sin, cos, round } = Math;

type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

const simple = (): boolean => P.simple();

const ROCK = ["#0e0906", "#1c130d", "#2c1f15", "#46321f"] as const;
const STONE = ["#2e2a24", "#4c463c", "#6e6656", "#968c78"] as const;
const SHARD = ["#404440", "#70706c", "#a4a4a4", "#c0c4b8"] as const;
const LIP = ["#182414", "#203024", "#303824", "#445854"] as const;
const CHROME = ["#303824", "#605c50", "#887870", "#b4b090"] as const;
const MOSS = ["#203024", "#443c20", "#584c30", "#aca884"] as const;
const CRATE = ["#1c140c", "#3c341c", "#444418", "#54541c"] as const;
const MAGMA = ["#100c08", "#401c08", "#582404", "#682c08", "#78200c", "#90280c"] as const;
const RLINE = "#060403";
const DOOR_H = 120;
const STEEL = ["#141c10", "#2c3420", "#444c36", "#646c5c"] as const;
const SEDGE = "#5a6660";
const SLINE = "#080c06";
const LAMP_ON = "#5ac060";
const LAMP_OFF = "#d03818";

const plate = (ctx: Ctx, x: number, y: number, w: number, h: number): void => {
  flat(ctx, x, y, w, h, STEEL[1], SLINE);
  flat(ctx, x + 0.6, y + 0.6, w - 1.2, 0.9, STEEL[3]);
  flat(ctx, x + 0.6, y + 0.6, 0.9, h - 1.2, STEEL[2]);
  flat(ctx, x + 0.6, y + h - 1.6, w - 1.2, 1, STEEL[0]);
  flat(ctx, x + w - 1.6, y + 0.6, 1, h - 1.2, STEEL[0]);
};

const post = (ctx: Ctx, x: number, y: number, w: number, h: number): void => {
  flat(ctx, x, y, w, h, STEEL[1], SLINE);
  flat(ctx, x + w * 0.28, y, w * 0.22, h, SEDGE);
  flat(ctx, x + w * 0.72, y, w * 0.28, h, STEEL[0]);
};

const stud = (ctx: Ctx, x: number, y: number): void => {
  disc(ctx, x, y, 0.95, SLINE);
  flat(ctx, x - 0.55, y - 0.65, 0.6, 0.6, STEEL[3]);
};

const studs = (ctx: Ctx, x: number, y: number, w: number, step: number): void => {
  if (!simple()) for (let i = x + step / 2; i < x + w; i += step) stud(ctx, i, y);
};

const studsV = (ctx: Ctx, x: number, y: number, h: number, step: number): void => {
  if (!simple()) for (let j = y + step / 2; j < y + h; j += step) stud(ctx, x, j);
};

const brace = (ctx: Ctx, x: number, y: number, w: number, h: number): void => {
  line(ctx, [[x + 1, y + h - 1], [x + w - 1, y + 1]], STEEL[0], 1.6);
  line(ctx, [[x + 1.5, y + h - 1], [x + w - 0.5, y + 1]], STEEL[3], 0.6);
  line(ctx, [[x + 1, y + 1], [x + w - 1, y + h - 1]], STEEL[0], 1.2);
};

const worn = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number, drip = 0, rise = 0.3): void => {
  G.surface(ctx, x, y, w, h, seed, { rise, drip, dripLen: h * 0.55 });
  G.chips(ctx, x, y + h - 1.4, w, seed + 7, G.DIRT);
};

const veil = (ctx: Ctx, pts: Pt[], c: string, alpha: number): void => {
  ctx.save();
  ctx.globalAlpha = alpha;
  shape(ctx, pts, c);
  ctx.restore();
};

const shard = (ctx: Ctx, x: number, top: number, w: number, len: number, lean: number): void => {
  const tip: Pt = [x + w / 2 + lean, top + len];
  const mid: Pt = [x + w * 0.55 + lean * 0.4, top + len * 0.35];
  shape(ctx, [[x, top], [x + w, top], tip], SHARD[1]);
  shape(ctx, [[x, top], mid, tip], SHARD[3]);
  shape(ctx, [[x + w * 0.5, top], [x + w, top], mid], SHARD[2]);
  shape(ctx, [mid, [x + w, top], tip], SHARD[1]);
  line(ctx, [[x + w * 0.2, top + 2], [x + w * 0.45 + lean * 0.7, top + len * 0.7]], "#fcfcfc", 0.8);
  line(ctx, [mid, tip], SHARD[0], 0.6);
  path(ctx, [[x, top], [x + w, top], tip]);
  stroke(ctx, "#141814", 0.9);
};

const SHARDS: readonly (readonly [number, number, number, number, number])[] = [[0, 14, 15, 34, -5], [34, 14, 14, 32, 5], [7, 16, 15, 46, -2], [25, 16, 15, 42, 3], [16, 17, 15, 55, 1]];

const lipPts: Pt[] = [[-4, -2], [52, -2], [52, 14], ...jag(-4, 52, 19, 2.4, 5, 931).reverse(), [-4, 14]];

const stalactiteLip = (ctx: Ctx, broken: boolean): void => {
  shape(ctx, lipPts, LIP[1]);
  ctx.save();
  path(ctx, lipPts);
  ctx.clip();
  shape(ctx, [[-4, -2], [20, -2], [14, 10], [-4, 12]], LIP[2]);
  shape(ctx, [[30, 4], [52, -2], [52, 22], [40, 22]], "#301c10");
  shape(ctx, [[42, 2], [52, 0], [52, 22], [46, 22]], "#8c5030");
  line(ctx, [[49, 4], [50, 20]], "#a86034", 1);
  for (const y of [5, 11]) line(ctx, jag(-4, 40, y, 1, 6, 932 + y), LIP[0], 0.8);
  line(ctx, [[2, 4], [12, 3], [18, 8]], LIP[3], 0.8);
  G.grain(ctx, G.polyRegion(ctx, lipPts), 933, 0.55);
  if (broken) for (const [x, w] of [[9, 13], [17, 13], [27, 12]] as const) shape(ctx, [[x + 1, 15], [x + w - 1, 15], [x + w * 0.6, 22], [x + w * 0.3, 21]], "#8a8a80");
  ctx.restore();
  path(ctx, lipPts);
  stroke(ctx, RLINE, 1.1);
  G.chips(ctx, 0, 15, 48, 934, G.DUST);
  G.drips(ctx, 4, 17, 40, 10, 935, 3, false);
};

const stalactite: EnvAsset = {
  id: "stalactite",
  box: [-6, -2, 54, 92],
  draw(ctx, state) {
    if (state !== 1) for (const s of state === 2 ? [] : SHARDS) shard(ctx, ...s);
    if (state === 1) {
      ctx.save();
      ctx.translate(24, 30);
      ctx.rotate(0.1);
      ctx.translate(-24, -12);
      for (const s of SHARDS) shard(ctx, ...s);
      ctx.restore();
      for (let i = 0; i < 6; i++) shape(ctx, [[6 + i * 7, 22 + (i % 3) * 5], [9 + i * 7, 21 + (i % 3) * 5], [8 + i * 7, 26 + (i % 3) * 5]], SHARD[(2 + (i % 2)) as 2 | 3], "#141814");
    }
    stalactiteLip(ctx, state !== 0);
  },
};

const crystalPrism = (ctx: Ctx, x: number, w: number, h: number, lean: number): void => {
  const top: Pt = [x + w / 2 + lean, -h];
  const pts: Pt[] = [[x, 0], [x + lean * 0.7, -h + w * 0.5], top, [x + w + lean * 0.7, -h + w * 0.5], [x + w, 0]];
  shape(ctx, pts, SHARD[1]);
  shape(ctx, [[x, 0], [x + lean * 0.7, -h + w * 0.5], top, [x + w * 0.45 + lean * 0.3, -h * 0.4], [x + w * 0.4, 0]], SHARD[3]);
  shape(ctx, [[x + w * 0.45 + lean * 0.3, -h * 0.4], top, [x + w + lean * 0.7, -h + w * 0.5]], SHARD[2]);
  line(ctx, [[x + w * 0.18, -2], [x + w * 0.3 + lean * 0.6, -h + w * 0.7]], "#fcfcfc", 0.9);
  line(ctx, [[x + w * 0.45 + lean * 0.3, -h * 0.4], [x + w * 0.4, 0]], SHARD[0], 0.6);
  path(ctx, pts);
  stroke(ctx, "#141814", 0.9);
};

const crystal: EnvAsset = {
  id: "crystal",
  box: [-2, -50, 74, 2],
  draw(ctx, state) {
    const base: Pt[] = [[0, 0], [6, -5], [20, -7], [52, -6], [66, -4], [72, 0]];
    if (state === 1) {
      const r = rng(961);
      for (let i = 0; i < 11; i++) {
        const x = 4 + r() * 62;
        const s = 3 + r() * 6;
        shape(ctx, [[x, 0], [x + s * 0.3, -s], [x + s * 0.7, -s * 0.8], [x + s, 0]], SHARD[(1 + (i % 3)) as 1 | 2 | 3], "#141814");
      }
      return;
    }
    shape(ctx, base, ROCK[2], RLINE);
    G.grain(ctx, G.polyRegion(ctx, base), 962);
    crystalPrism(ctx, 50, 14, 36, 5);
    crystalPrism(ctx, 6, 13, 30, -5);
    crystalPrism(ctx, 32, 15, 44, 3);
    crystalPrism(ctx, 16, 16, 48, -2);
    crystalPrism(ctx, 42, 11, 24, 6);
    crystalPrism(ctx, 2, 9, 16, -4);
  },
};

const leverBank: EnvAsset = {
  id: "leverBank",
  box: [-20, -42, 20, 0],
  draw(ctx, state) {
    plate(ctx, -8, -25, 16, 25);
    flat(ctx, -6, -14, 12, 8, STEEL[0], SLINE);
    brace(ctx, -6, -14, 12, 8);
    hazard(ctx, -6, -5, 12, 3.4, 3);
    plate(ctx, -2.2, -23, 4.4, 9);
    studs(ctx, -8, -22.5, 16, 12);
    worn(ctx, -8, -25, 16, 25, 970, 2, 0.4);
    const a = state === 0 ? 2.5 : state === 1 ? -0.65 : -PI / 2;
    const tip: Pt = [cos(a) * 18, -18 + sin(a) * 18];
    line(ctx, [[0, -18], tip], SLINE, 3.4);
    line(ctx, [[0, -18], tip], STEEL[3], 2);
    disc(ctx, tip[0], tip[1], 2.6, "#b02818", SLINE);
    disc(ctx, 0, -18, 2.2, STEEL[2], SLINE);
  },
};

const doorSlab = (ctx: Ctx, top: number, h: number, seed: number): void => {
  box(ctx, 0, top, 24, h, "rust", 1, { vertical: true });
  for (let y = top + 10; y < top + h - 8; y += 14) {
    flat(ctx, 1, y, 22, 2, "r0");
    flat(ctx, 1, y + 2, 22, 0.8, "r3");
  }
  if (!simple()) {
    for (let y = top + 5; y < top + h - 4; y += 14) {
      disc(ctx, 3, y, 0.8, "r3");
      disc(ctx, 21, y, 0.8, "r3");
    }
  }
  G.grain(ctx, G.rectRegion(ctx, 0, top, 24, h), seed);
  G.drips(ctx, 0, top, 24, h * 0.5, seed + 1, 3);
  G.dirt(ctx, 0, top, 24, h, seed + 2, 0.25);
  for (let y = top + 12; y < top + h - 8; y += 14) G.chips(ctx, 1, y + 2.8, 22, seed + y, G.DUST);
  G.chips(ctx, 0, top + h - 1.5, 24, seed + 3, G.DUST);
};

const slidingDoor = (ctx: Ctx, shut: number, seed: number, lamp: () => void): void => {
  const slabH = 16 + shut * (DOOR_H - 16);
  doorSlab(ctx, -DOOR_H, slabH, seed);
  if (shut < 1) hazard(ctx, 0, -DOOR_H + slabH - 6, 24, 6, 5);
  for (const x of [-5, 24]) {
    post(ctx, x, -DOOR_H, 5, DOOR_H);
    studsV(ctx, x + 2.5, -DOOR_H + 4, DOOR_H - 8, 12);
    G.inside(ctx, G.rectRegion(ctx, x, -DOOR_H, 5, DOOR_H), () => worn(ctx, x, -DOOR_H, 5, DOOR_H, seed + 4 + x, 1, 0.18));
  }
  plate(ctx, -6, -DOOR_H - 5, 36, 7);
  studs(ctx, -6, -DOOR_H - 1.5, 36, 9);
  worn(ctx, -6, -DOOR_H - 5, 36, 7, seed + 3, 3, 0);
  G.inside(ctx, G.rectsRegion(ctx, [[-5, -DOOR_H, 5, DOOR_H], [24, -DOOR_H, 5, DOOR_H], [0, -DOOR_H, 24, slabH]]), () => G.drips(ctx, -5, -DOOR_H + 2, 34, 22, seed + 5, 3));
  lamp();
};

const shutOf = (state: number, open: number): number => (state === open ? 0 : state === 0 ? 1 : 0.5);

const leverDoor: EnvAsset = {
  id: "leverDoor",
  box: [-6, -126, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, shutOf(state, 2), 980, () => disc(ctx, 12, -DOOR_H - 1.5, 1.8, state === 2 ? LAMP_ON : LAMP_OFF, SLINE));
  },
};

const KEY_COLOURS = ["#e8c21a", "#ee7a1a", "#4a8ec0"] as const;

const keyDoors: EnvAsset = {
  id: "keyDoors",
  box: [-6, -126, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, shutOf(state, 2), 990, () => {
      plate(ctx, 2, -DOOR_H + 4, 20, 8);
      KEY_COLOURS.forEach((c, i) => {
        flat(ctx, 4 + i * 6.5, -DOOR_H + 6, 4, 4, STEEL[0], SLINE);
        disc(ctx, 6 + i * 6.5, -DOOR_H + 8, 1.4, state === 2 ? c : "#2a2220");
      });
    });
  },
};

const reader = (ctx: Ctx, x: number, y: number, lit: string, seed: number): void => {
  plate(ctx, x, y, 8, 14);
  flat(ctx, x + 1.5, y + 2, 5, 3, "#0c1a10", SLINE);
  flat(ctx, x + 2, y + 7, 4, 1.2, "#000000");
  disc(ctx, x + 4, y + 11, 1, lit);
  worn(ctx, x, y, 8, 14, seed, 1, 0.3);
};

const caveCardDoor: EnvAsset = {
  id: "caveCardDoor",
  box: [-16, -126, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, shutOf(state, 2), 1000, () => reader(ctx, -15, -52, state === 2 ? LAMP_ON : LAMP_OFF, 1005));
  },
};

const airlock: EnvAsset = {
  id: "airlock",
  box: [-6, -132, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, state === 0 ? 0 : state === 2 ? 1 : 0.5, 1010, () => {
      plate(ctx, 6, -DOOR_H - 11, 12, 6);
      worn(ctx, 6, -DOOR_H - 11, 12, 6, 1015, 0, 0);
      disc(ctx, 12, -DOOR_H - 8, 2, state === 2 ? "#ff4020" : "#e8c21a");
      if (state !== 2) glow(ctx, 12, -DOOR_H - 8, 9, "#e8c21a", 0.35);
      hazard(ctx, -5, -6, 34, 6, 5);
      G.grain(ctx, G.rectRegion(ctx, -5, -6, 34, 6), 1016, 0.8);
      G.chips(ctx, -5, -6, 34, 1017, G.DIRT);
    });
  },
};

const cog = (ctx: Ctx, cx: number, cy: number, r: number, teeth: number): void => {
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * PI * 2;
    shape(ctx, [[cos(a - 0.12) * r, sin(a - 0.12) * r], [cos(a - 0.08) * r * 1.3, sin(a - 0.08) * r * 1.3], [cos(a + 0.08) * r * 1.3, sin(a + 0.08) * r * 1.3], [cos(a + 0.12) * r, sin(a + 0.12) * r]], STEEL[2], SLINE);
  }
  disc(ctx, 0, 0, r, STEEL[2], SLINE);
  disc(ctx, 0, 0, r * 0.82, STEEL[1]);
  disc(ctx, 0, 0, r * 0.35, STEEL[0], SLINE);
  if (!simple()) for (let i = 0; i < 6; i++) stud(ctx, cos((i * PI) / 3) * r * 0.6, sin((i * PI) / 3) * r * 0.6);
  G.grain(ctx, () => {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, PI * 2);
  }, 1040 + teeth + round(r));
  ctx.restore();
};

const liftLock: EnvAsset = {
  id: "liftLock",
  box: [0, -48, 72, 0],
  draw(ctx, state) {
    plate(ctx, 2, -36, 68, 36);
    flat(ctx, 6, -32, 60, 28, STEEL[0], SLINE);
    cog(ctx, 24, -18, 10, 10);
    const bolt = state === 0 ? 0 : 14;
    box(ctx, 34 + bolt, -21, 26, 7, "rust", 2);
    hazard(ctx, 40 + bolt, -21, 14, 7, 4);
    G.chips(ctx, 34 + bolt, -21, 26, 1023, G.DUST);
    plate(ctx, 50, -44, 16, 10);
    flat(ctx, 55, -42, 6, 6, "#000000");
    plate(ctx, 6, -44, 8, 8);
    disc(ctx, 10, -40, 2, state === 0 ? LAMP_OFF : LAMP_ON, SLINE);
    studs(ctx, 2, -34, 68, 8);
    studs(ctx, 2, -2.5, 68, 8);
    G.inside(ctx, G.rectRegion(ctx, 2, -44, 68, 44), () => {
      worn(ctx, 2, -36, 68, 36, 1020, 4, 0.35);
      worn(ctx, 50, -44, 16, 10, 1024, 1, 0);
    }, [G.rectPts(55, -42, 6, 6)]);
  },
};

const keySlots: EnvAsset = {
  id: "keySlots",
  box: [0, -44, 36, 0],
  draw(ctx, state) {
    plate(ctx, 2, -42, 32, 42);
    flat(ctx, 5, -38, 26, 22, STEEL[0], SLINE);
    brace(ctx, 5, -14, 26, 7);
    studs(ctx, 2, -40, 32, 8);
    plate(ctx, 0, -6, 36, 6);
    worn(ctx, 2, -42, 32, 36, 1030, 3, 0.3);
    worn(ctx, 0, -6, 36, 6, 1032, 0, 0.6);
    KEY_COLOURS.forEach((c, i) => {
      const x = 8 + i * 7.5;
      flat(ctx, x, -34, 5, 14, c, SLINE);
      flat(ctx, x + 1.5, -32, 2, 10, "#050403");
      G.chips(ctx, x, -34, 5, 1033 + i, G.DIRT);
      const full = state === 2 || (state === 1 && i === 0);
      if (full) flat(ctx, x + 1, -36, 3, 6, c, SLINE);
      disc(ctx, x + 2.5, -17.5, 1.1, full ? LAMP_ON : "#3a1410");
    });
  },
};

const stoneBlock = (ctx: Ctx, y: number, seed: number, crack: boolean): void => {
  const r = rng(seed);
  const pts: Pt[] = [[0.5, y + 1], [23.5, y + 0.5], [23, y + 23.5], [1, y + 23.5]];
  shape(ctx, pts, STONE[1]);
  shape(ctx, [[1.5, y + 2], [22.5, y + 1.5], [20, y + 5], [4, y + 5]], STONE[2]);
  shape(ctx, [[3, y + 20], [22.5, y + 18], [23, y + 23.5], [1, y + 23.5]], STONE[0]);
  if (!simple()) for (let i = 0; i < 4; i++) flat(ctx, 3 + r() * 17, y + 6 + r() * 12, 1.2, 1.2, STONE[3]);
  if (crack) line(ctx, [[6, y + 2], [11, y + 9], [9, y + 14], [15, y + 22]], RLINE, 1);
  path(ctx, pts);
  stroke(ctx, RLINE);
};

const outline = (ctx: Ctx, x: number, y: number, w: number, h: number): void => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, RLINE);
};

const stoneBlocks: EnvAsset = {
  id: "stoneBlocks",
  box: [-2, -50, 26, 0],
  draw(ctx, state) {
    if (state === 2) {
      const r = rng(1041);
      for (let i = 0; i < 8; i++) {
        const x = r() * 20;
        const s = 3 + r() * 5;
        shape(ctx, [[x, 0], [x + s * 0.3, -s], [x + s, -s * 0.8], [x + s * 1.1, 0]], STONE[(1 + (i % 3)) as 1 | 2 | 3], RLINE);
      }
      return;
    }
    stoneBlock(ctx, -48, 1042, state === 1);
    stoneBlock(ctx, -24, 1043, state === 1);
    G.grain(ctx, G.rectRegion(ctx, 0, -48, 24, 48), 1044);
    G.dirt(ctx, 0, -48, 24, 48, 1045, 0.3);
    for (const y of [-47, -23]) G.chips(ctx, 1, y, 22, 1046 + y, STONE[3]);
    for (const y of [-26, -2]) G.chips(ctx, 2, y, 20, 1047 + y, RLINE);
    for (const y of [-48, -24]) {
      shape(ctx, [[0.5, y + 1], [4, y + 0.8], [0.8, y + 4]], STONE[0]);
      shape(ctx, [[23.5, y + 9], [21.5, y + 12], [23.2, y + 15]], STONE[0]);
      shape(ctx, [[15, y + 23.5], [18, y + 21.5], [20, y + 23.5]], STONE[0]);
    }
  },
};

const explosiveTank: EnvAsset = {
  id: "explosiveTank",
  box: [-4, -52, 52, 0],
  draw(ctx, state) {
    if (state === 2) {
      const pts: Pt[] = [[4, 0], [6, -12], [14, -8], [20, -18], [28, -10], [38, -16], [42, 0]];
      G.scorch(ctx, pts, 1050);
      shape(ctx, pts, "#1a0c06", RLINE);
      return;
    }
    if (state === 1) {
      glow(ctx, 24, -24, 40, "#ffd25a", 0.8);
      glow(ctx, 24, -24, 24, "#ffffff", 0.7);
      return;
    }
    for (const x of [5, 11, 17]) flat(ctx, x, -34, 2, 12, "#888484", RLINE);
    const block: Pt[] = [[2, 0], [2, -21], [5, -23], [20, -22], [22, -19], [22, 0]];
    shape(ctx, block, MOSS[2]);
    shape(ctx, [[2, -21], [5, -23], [20, -22], [22, -19], [18, -18.5], [4, -19.5]], "#706450");
    shape(ctx, [[2, -8], [22, -6], [22, 0], [2, 0]], MOSS[1]);
    if (!simple()) for (const [x, y] of [[6, -14], [14, -11], [9, -6], [17, -15]] as const) flat(ctx, x, y, 3, 2, MOSS[0]);
    G.grain(ctx, G.polyRegion(ctx, block), 1054, 0.5);
    path(ctx, block);
    stroke(ctx, RLINE);
    G.chips(ctx, 3, -21, 18, 1055, "#e4e0b4");
    const bands = [[24, 2, CHROME[0]], [26, 3, CHROME[1]], [29, 3, CHROME[2]], [32, 3, CHROME[3]], [35, 3, "#fcfcfc"], [38, 3, CHROME[3]], [41, 3, CHROME[2]], [44, 2, CHROME[1]], [46, 2, CHROME[0]]] as const;
    for (const [x, w, c] of bands) flat(ctx, x, -46, w, 46, c);
    flat(ctx, 23.5, -48, 25, 3, CHROME[1], RLINE);
    flat(ctx, 23.5, -3, 25, 3, CHROME[0], RLINE);
    shape(ctx, [[30, -28], [34, -32], [38, -28], [34, -24]], "#e8b018", RLINE);
    line(ctx, [[34, -30.5], [34, -28]], RLINE, 0.9);
    disc(ctx, 34, -26.5, 0.6, RLINE);
    outline(ctx, 24, -46, 24, 46);
    G.chips(ctx, 24, -45, 24, 1056, G.DIRT);
    G.drips(ctx, 25, -3, 22, 2, 1052, 2, false);
    G.dirt(ctx, 24, -46, 24, 46, 1053, 0.2);
  },
};

const crate = (ctx: Ctx, x: number, y: number, w: number, seed: number): void => {
  const r = rng(seed);
  flat(ctx, x, y, w, 24, CRATE[2]);
  flat(ctx, x, y + 1, w, 4, CRATE[3]);
  flat(ctx, x, y + 6, w, 3, "#443c20");
  flat(ctx, x, y + 9, w, 2, CRATE[1]);
  flat(ctx, x, y + 18, w, 2, "#60543c");
  flat(ctx, x, y + 22, w, 2, CRATE[1]);
  flat(ctx, x, y, w, 1.2, "#885c1c");
  for (const k of [0.4, 0.6]) line(ctx, [[x + w * k, y + 6], [x + w * k, y + 14 + r() * 4]], "#5c3a1c", 0.9);
  G.drips(ctx, x + 2, y + 1, w - 4, 12, seed + 1, 1);
  G.chips(ctx, x + 1, y + 1, w - 2, seed + 2, "#c08a40");
};

const crateRow = (ctx: Ctx, x0: number, w: number, y: number, seed: number): void => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y, w, 24);
  ctx.clip();
  for (let x = x0, i = 0; x < w; x += 72, i++) {
    for (const [dx, side, front] of [[0, 16, 32], [53, 0, 19]] as const) {
      flat(ctx, x + dx - 5, y, 5 + side, 24, "#342810");
      flat(ctx, x + dx - 5, y + 9, 5 + side, 3, "#301c10");
      flat(ctx, x + dx - 5, y + 18, 5 + side, 2, "#384030");
      line(ctx, [[x + dx - 5, y], [x + dx - 5, y + 24]], "#2c3838", 1.2);
      crate(ctx, x + dx + side, y, front, seed + i * 7 + dx);
      line(ctx, [[x + dx + side, y], [x + dx + side, y + 24]], "#283030", 1);
    }
  }
  ctx.restore();
};

const mineCarts: EnvAsset = {
  id: "mineCarts",
  box: [-122, -50, 194, 2],
  draw(ctx, _state, _t, { w = 192 }) {
    const seed = 1060 + round(w);
    flat(ctx, -120, -24, 120, 8, "#1c2c24");
    for (let x = -120; x < 0; x += 24) {
      line(ctx, [[x + 2, -23], [x + 22, -17]], "#c0c4b8", 1.4);
      line(ctx, [[x + 2, -17], [x + 22, -23]], "#a4a4a4", 1.4);
      line(ctx, [[x + 1, -24], [x + 1, -16]], "#e4ece0", 1.2);
    }
    flat(ctx, -120, -24, 120, 1.2, "#e4ece0");
    flat(ctx, -120, -17.2, 120, 1.2, "#888484");
    G.grain(ctx, G.rectRegion(ctx, -120, -24, 120, 8), seed + 5, 0.6);
    crateRow(ctx, 0, w, -48, seed);
    crateRow(ctx, 6 - 72, w, -24, seed + 40);
    outline(ctx, 0, -48, w, 48);
    G.grain(ctx, G.rectRegion(ctx, 0, -48, w, 48), seed + 1, 0.35);
    G.dirt(ctx, 0, -24, w, 24, seed + 2, 0.3);
  },
};

const cartCrusher: EnvAsset = {
  id: "cartCrusher",
  box: [-6, -100, 78, 50],
  draw(ctx) {
    for (const x of [-4, 64]) {
      post(ctx, x, -86, 8, 134);
      studsV(ctx, x + 4, -82, 126, 12);
    }
    plate(ctx, -4, -98, 76, 12);
    hazard(ctx, -4, -98, 76, 5, 6);
    studs(ctx, -4, -89, 76, 10);
    cog(ctx, 22, -40, 16, 12);
    cog(ctx, 48, 4, 16, 12);
    if (!simple()) for (const [x, y] of [[30, -14], [36, -18], [40, -10], [33, -6], [44, -16]] as const) line(ctx, [[x, y], [x + 3, y - 2]], "#ffe080", 0.9);
    glow(ctx, 36, -12, 18, "#ffb040", 0.35);
    worn(ctx, -4, -98, 76, 12, 1070, 5, 0);
    for (const x of [-4, 64]) G.inside(ctx, G.rectRegion(ctx, x, -86, 8, 134), () => worn(ctx, x, -86, 8, 134, 1072 + x, 3, 0.3));
  },
};

const lavaSurface = (ctx: Ctx, w: number, top: number, h: number, seed: number): void => {
  const r = rng(seed);
  const rows = [[0, MAGMA[1]], [0.18, MAGMA[2]], [0.36, MAGMA[3]], [0.52, MAGMA[4]], [0.82, MAGMA[5]]] as const;
  for (const [k, c] of rows) flat(ctx, 0, top + h * k, w, h * (1 - k), c);
  for (let x = r() * 2; x < w; x += 2.5 + r() * 1.5) {
    const bright = r() < 0.55;
    const y = top + h * (0.2 + r() * 0.3);
    line(ctx, [[x, y], [x, top + h]], bright ? "#885c1c" : "#401c08", bright ? 0.9 : 0.7);
    if (bright && !simple()) line(ctx, [[x, top + h * 0.7], [x, top + h]], r() < 0.5 ? "#b8901c" : "#9c681c", 0.7);
  }
  if (!simple()) for (let i = 0; i < w / 8; i++) flat(ctx, r() * w, top + h * (0.6 + r() * 0.3), 1.5, 1.5, "#a84c04");
};

const lavaPit: EnvAsset = {
  id: "lavaPit",
  box: [0, -24, 48, 26],
  draw(ctx, _state, _t, { w = 48 }) {
    veil(ctx, [[0, 0], [w, 0], [w, -6], [0, -6]], "#90280c", 0.08);
    lavaSurface(ctx, w, 0, 24, 1080 + round(w));
  },
};

const chasm: EnvAsset = {
  id: "chasm",
  box: [0, -6, 96, 74],
  draw(ctx, _state, _t, { w = 96 }) {
    const seed = 1100 + round(w);
    const r = rng(seed);
    const g = ctx.createLinearGradient(0, 0, 0, 72);
    g.addColorStop(0, "rgba(40,6,2,0)");
    g.addColorStop(0.35, "rgba(70,14,4,0.28)");
    g.addColorStop(1, "rgba(20,4,2,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, 72);
    for (let i = 0; i < 5; i++) {
      const y = 14 + r() * 50;
      veil(ctx, [...jag(r() * w * 0.3, w - r() * w * 0.3, y, 1.6, 8, seed + i), [w * 0.6, y + 4], [w * 0.3, y + 3]], "#a03a20", 0.12);
    }
    if (!simple()) for (let i = 0; i < w / 12; i++) disc(ctx, r() * w, 20 + r() * 50, 0.5 + r() * 0.5, "#ff8a40");
  },
};

const rod: EnvAsset = {
  id: "rod",
  box: [-16, -8, 16, 0],
  draw(ctx, state) {
    if (state === 2) return;
    line(ctx, [[-15, -2], [14, -5.5]], "#1e1208", 3.2);
    line(ctx, [[-15, -2], [14, -5.5]], "#6e4824", 2);
    line(ctx, [[-13, -2.6], [12, -5.6]], "#a87a44", 0.7);
    line(ctx, [[-15, -2], [-13.4, -2.2]], "#3a2410", 2);
  },
};

const CARD = "#e8ece6";
const CARD_SHADE = "#bcc2bc";
const CARD_LINE = "#1a1c1a";
const CARD_PTS: Pt[] = [[-8, -10], [7, -10], [8, -9], [8, -1], [7, 0], [-8, 0]];

const keyCard = (c: string, id: string): EnvAsset => ({
  id,
  box: [-9, -14, 9, 0],
  draw(ctx, state) {
    if (state === 2) return;
    shape(ctx, CARD_PTS, CARD);
    flat(ctx, -8, -1.6, 16, 1.6, CARD_SHADE);
    flat(ctx, -8, -10, 2.8, 10, "#c8a040");
    if (!simple()) for (let y = -9; y < -1; y += 1.6) flat(ctx, -8, y, 2.8, 0.5, "#7a5a20");
    flat(ctx, 2.2, -10, 3, 10, c);
    flat(ctx, 2.2, -1.6, 3, 1.6, "rgba(0,0,0,0.18)");
    shape(ctx, [[-4.4, -5], [-1.6, -7.4], [-1.6, -2.6]], "#c0301a");
    flat(ctx, -1.6, -5.6, 1.6, 1.2, "#c0301a");
    flat(ctx, 0.4, -6.2, 0.8, 2.4, "#4a2a1e");
    flat(ctx, 1.3, -6.2, 0.5, 2.4, "#4a2a1e");
    shape(ctx, CARD_PTS, "rgba(0,0,0,0)", CARD_LINE);
  },
});

const entryCard: EnvAsset = {
  id: "entryCard",
  box: [-9, -14, 9, 0],
  draw(ctx, state) {
    if (state === 2) return;
    shape(ctx, CARD_PTS, "#a4b2b8");
    if (!simple()) {
      flat(ctx, -6.5, -8.5, 5, 2.4, "#8494a0");
      flat(ctx, -1, -9, 3, 1.6, "#c4ccd0");
      flat(ctx, -6, -5.2, 7, 1, "#7a8a96");
      flat(ctx, -4, -7.6, 1.2, 1.2, "#c8a050");
    }
    flat(ctx, 3, -10, 2.4, 10, "#d8642a");
    flat(ctx, -8, -2.8, 11, 2.8, "#d8642a");
    flat(ctx, -6.5, -2.2, 5, 0.6, "#8a3412");
    flat(ctx, 5.6, -10, 2.4, 10, "#d0d4d0");
    shape(ctx, CARD_PTS, "rgba(0,0,0,0)", CARD_LINE);
  },
};

export const JESKYNE_IDS = [
  "stalactite", "crystal", "leverBank", "leverDoor", "keyDoors", "caveCardDoor", "airlock", "liftLock", "keySlots", "stoneBlocks", "explosiveTank", "mineCarts", "cartCrusher",
  "lavaPit", "chasm", "rod", "yellowKey", "orangeKey", "blueKey", "entryCard",
  "caveBackdrop", "farStalagmites", "caveRock", "rockRibs", "lavaFall",
  "caveFloor", "rockLedge", "ropeColumn", "minePipe", "metalPillars", "safetyRail",
  "pressureTank", "screeHeap", "caveLamp", "explosiveSign", "mineWreck", "powderKeg", "toolCrate", "shaftHead",
] as const;

export const jeskyneAssets: EnvAsset[] = [
  stalactite, crystal, leverBank, leverDoor, keyDoors, caveCardDoor, airlock, liftLock, keySlots, stoneBlocks, explosiveTank, mineCarts, cartCrusher, lavaPit, chasm, rod,
  keyCard(KEY_COLOURS[0], "yellowKey"), keyCard(KEY_COLOURS[1], "orangeKey"), keyCard(KEY_COLOURS[2], "blueKey"), entryCard,
  ...jeskyneTerrainAssets, ...jeskyneStructureAssets, ...jeskyneClutterAssets, ...jeskyneExtraAssets,
];
