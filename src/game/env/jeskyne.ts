import { G } from "./grime";
import { P, type EnvAsset } from "./paint";

const { rng, path, flat, box, cylV, disc, rivets, glow, stroke, shape, line, hazard } = P;
const { PI, sin, cos, round } = Math;

type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];
type Tones = readonly [string, string, string, string];

const simple = (): boolean => P.simple();

const ROCK: Tones = ["#0e0906", "#1c130d", "#2c1f15", "#46321f"];
const CART: Tones = ["#2e2e0e", "#5c5e1c", "#8e8e30", "#c2c05a"];
const LAVA: Tones = ["#4a0c02", "#a82806", "#ee6612", "#ffd25a"];
const ICE: Tones = ["#14324e", "#2e6c9c", "#6ab4e0", "#dcf4ff"];
const STONE: Tones = ["#2e2a24", "#4c463c", "#6e6656", "#968c78"];
const RLINE = "#060403";
const DOOR_H = 120;

const jag = (x0: number, x1: number, y: number, amp: number, step: number, seed: number): Pt[] => {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let x = x0; x < x1; x += step * (0.6 + r() * 0.8)) pts.push([x, y + (r() - 0.5) * 2 * amp]);
  pts.push([x1, y + (r() - 0.5) * 2 * amp]);
  return pts;
};

const veil = (ctx: Ctx, pts: Pt[], c: string, alpha: number): void => {
  ctx.save();
  ctx.globalAlpha = alpha;
  shape(ctx, pts, c);
  ctx.restore();
};

const stalactiteBody: Pt[] = [[-6, -2], [54, -2], [48, 30], [40, 64], [32, 100], [26, 140], [22, 140], [14, 98], [6, 60], [0, 26]];

const stalactite: EnvAsset = {
  id: "stalactite",
  box: [-8, -2, 56, 146],
  draw(ctx, state) {
    if (state === 2) {
      shape(ctx, [[-6, -2], [54, -2], [44, 14], [30, 22], [14, 20], [0, 12]], ROCK[2], RLINE);
      shape(ctx, [[14, 20], [30, 22], [34, 17], [18, 15]], "#a07040");
      return;
    }
    ctx.save();
    if (state === 1) {
      ctx.translate(24, 60);
      ctx.rotate(0.12);
      ctx.translate(-24, -50);
    }
    shape(ctx, stalactiteBody, ROCK[2]);
    ctx.save();
    path(ctx, stalactiteBody);
    ctx.clip();
    shape(ctx, [[-6, -2], [16, -2], [18, 40], [22, 120], [12, 80], [2, 30]], ROCK[3]);
    shape(ctx, [[36, -2], [54, -2], [46, 40], [30, 110]], ROCK[1]);
    for (let y = 8; y < 130; y += 11) line(ctx, jag(-6, 54, y, 1.2, 6, 940 + y), ROCK[0], 0.8);
    G.grain(ctx, G.rectRegion(ctx, -8, -2, 64, 146), 945);
    ctx.restore();
    path(ctx, stalactiteBody);
    stroke(ctx, RLINE, 1.2);
    const crack: Pt[] = [[28, 30], [24, 46], [29, 58], [25, 70]];
    line(ctx, crack, "#d09048", 1.1);
    line(ctx, crack, RLINE, 0.5);
    if (!simple()) for (const [x, y] of [[24, 142], [30, 108], [12, 90]] as Pt[]) disc(ctx, x, y, 0.9, "#9ac0d0");
    ctx.restore();
    if (state === 1) for (let i = 0; i < 6; i++) shape(ctx, [[8 + i * 7, 20 + i * 9], [12 + i * 7, 18 + i * 9], [11 + i * 7, 24 + i * 9]], ROCK[3]);
  },
};

const crystalPrism = (ctx: Ctx, x: number, base: number, w: number, h: number, lean: number): void => {
  const pts: Pt[] = [[x, base], [x + lean, base - h + w * 0.4], [x + lean + w / 2, base - h], [x + lean + w, base - h + w * 0.4], [x + w, base]];
  shape(ctx, pts, ICE[1]);
  shape(ctx, [[x + w * 0.5, base], [x + lean + w * 0.5, base - h], [x + lean + w, base - h + w * 0.4], [x + w, base]], ICE[2]);
  line(ctx, [[x + w * 0.3, base - 3], [x + lean + w * 0.42, base - h + w * 0.5]], ICE[3], 0.9);
  path(ctx, pts);
  stroke(ctx, "#08121c");
};

const crystal: EnvAsset = {
  id: "crystal",
  box: [-36, -132, 108, 12],
  draw(ctx, state) {
    if (state === 1) {
      const r = rng(961);
      for (let i = 0; i < 9; i++) {
        const x = 4 + r() * 62;
        const s = 4 + r() * 6;
        shape(ctx, [[x, 0], [x + s * 0.4, -s], [x + s, 0]], ICE[(1 + (i % 3)) as 1 | 2 | 3], "#08121c");
      }
      glow(ctx, 36, -4, 30, ICE[2], 0.25);
      return;
    }
    glow(ctx, 36, -60, 70, ICE[2], 0.35);
    shape(ctx, [[2, 0], [10, -10], [62, -10], [70, 0]], ROCK[2], RLINE);
    crystalPrism(ctx, 4, -4, 16, 70, -4);
    crystalPrism(ctx, 48, -4, 18, 82, 5);
    crystalPrism(ctx, 22, -4, 26, 120, 1);
    crystalPrism(ctx, 14, -4, 12, 48, -6);
    crystalPrism(ctx, 40, -4, 13, 56, 6);
    glow(ctx, 36, -70, 26, ICE[3], 0.3);
  },
};

const leverBank: EnvAsset = {
  id: "leverBank",
  box: [-20, -42, 20, 0],
  draw(ctx, state) {
    box(ctx, -7, -24, 14, 24, "steel", 1);
    hazard(ctx, -5, -8, 10, 4, 3);
    flat(ctx, -1.5, -22, 3, 8, "m0", "mLine");
    const a = state === 0 ? 2.5 : state === 1 ? -0.65 : -PI / 2;
    const tip: Pt = [cos(a) * 18, -18 + sin(a) * 18];
    line(ctx, [[0, -18], tip], "mLine", 3.4);
    line(ctx, [[0, -18], tip], "m3", 2);
    disc(ctx, tip[0], tip[1], 2.6, "#b02818", "mLine");
    disc(ctx, 0, -18, 2.2, "m2", "mLine");
    G.grain(ctx, G.rectRegion(ctx, -7, -24, 14, 24), 970);
    G.dirt(ctx, -7, -24, 14, 24, 971, 0.4);
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
};

const slidingDoor = (ctx: Ctx, shut: number, seed: number, lamp: () => void): void => {
  const slabH = 16 + shut * (DOOR_H - 16);
  doorSlab(ctx, -DOOR_H, slabH, seed);
  if (shut < 1) hazard(ctx, 0, -DOOR_H + slabH - 6, 24, 6, 5);
  box(ctx, -5, -DOOR_H - 4, 34, 6, "steel", 1);
  cylV(ctx, -5, -DOOR_H, 5, DOOR_H, "steel", 1);
  cylV(ctx, 24, -DOOR_H, 5, DOOR_H, "steel", 1);
  G.grain(ctx, G.rectRegion(ctx, -5, -DOOR_H - 4, 34, 6), seed + 3);
  for (const x of [-5, 24]) G.grain(ctx, G.rectRegion(ctx, x, -DOOR_H, 5, DOOR_H), seed + 4 + x);
  lamp();
};

const shutOf = (state: number, open: number): number => (state === open ? 0 : state === 0 ? 1 : 0.5);

const leverDoor: EnvAsset = {
  id: "leverDoor",
  box: [-6, -126, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, shutOf(state, 2), 980, () => disc(ctx, 12, -DOOR_H - 1, 1.8, state === 2 ? "#5ac060" : "#d03818", "mLine"));
  },
};

const KEY_COLOURS = ["#e8c21a", "#ee7a1a", "#3a70e0"];

const keyDoors: EnvAsset = {
  id: "keyDoors",
  box: [-6, -126, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, shutOf(state, 2), 990, () => {
      KEY_COLOURS.forEach((c, i) => {
        flat(ctx, 4 + i * 6.5, -DOOR_H + 6, 4, 4, "m0", "mLine");
        disc(ctx, 6 + i * 6.5, -DOOR_H + 8, 1.4, state === 2 ? c : "#2a2220");
      });
    });
  },
};

const reader = (ctx: Ctx, x: number, y: number, lit: string): void => {
  box(ctx, x, y, 8, 14, "steel", 1);
  flat(ctx, x + 1.5, y + 2, 5, 3, "#0c1a10", "mLine");
  flat(ctx, x + 2, y + 7, 4, 1.2, "#000000");
  disc(ctx, x + 4, y + 11, 1, lit);
};

const caveCardDoor: EnvAsset = {
  id: "caveCardDoor",
  box: [-16, -126, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, shutOf(state, 2), 1000, () => reader(ctx, -15, -52, state === 2 ? "#5ac060" : "#d03818"));
  },
};

const airlock: EnvAsset = {
  id: "airlock",
  box: [-6, -132, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, state === 0 ? 0 : state === 2 ? 1 : 0.5, 1010, () => {
      box(ctx, 6, -DOOR_H - 10, 12, 6, "steel", 2);
      disc(ctx, 12, -DOOR_H - 7, 2, state === 2 ? "#ff4020" : "#e8c21a");
      if (state !== 2) glow(ctx, 12, -DOOR_H - 7, 9, "#e8c21a", 0.35);
      hazard(ctx, -5, -6, 34, 6, 5);
    });
  },
};

const cog = (ctx: Ctx, cx: number, cy: number, r: number, teeth: number): void => {
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * PI * 2;
    shape(ctx, [[cos(a - 0.12) * r, sin(a - 0.12) * r], [cos(a - 0.08) * r * 1.3, sin(a - 0.08) * r * 1.3], [cos(a + 0.08) * r * 1.3, sin(a + 0.08) * r * 1.3], [cos(a + 0.12) * r, sin(a + 0.12) * r]], "m2", "mLine");
  }
  disc(ctx, 0, 0, r, "m2", "mLine");
  disc(ctx, 0, 0, r * 0.35, "m0", "mLine");
  ctx.restore();
};

const liftLock: EnvAsset = {
  id: "liftLock",
  box: [0, -48, 72, 0],
  draw(ctx, state) {
    box(ctx, 2, -36, 68, 36, "steel", 1);
    flat(ctx, 6, -32, 60, 28, "m0", "mLine");
    cog(ctx, 24, -18, 10, 10);
    const bolt = state === 0 ? 0 : 14;
    box(ctx, 34 + bolt, -21, 26, 7, "rust", 2);
    hazard(ctx, 40 + bolt, -21, 14, 7, 4);
    box(ctx, 50, -44, 16, 10, "steel", 2);
    flat(ctx, 55, -42, 6, 6, "#000000");
    disc(ctx, 10, -40, 2, state === 0 ? "#d03818" : "#5ac060", "mLine");
    rivets(ctx, 4, -34, 64, 8, "m3");
    G.grain(ctx, G.rectRegion(ctx, 2, -44, 68, 44), 1020);
    G.drips(ctx, 2, -36, 68, 18, 1021, 3);
    G.dirt(ctx, 2, -36, 68, 36, 1022, 0.3);
  },
};

const keySlots: EnvAsset = {
  id: "keySlots",
  box: [0, -44, 36, 0],
  draw(ctx, state) {
    box(ctx, 2, -42, 32, 42, "steel", 1);
    flat(ctx, 5, -38, 26, 22, "m0", "mLine");
    KEY_COLOURS.forEach((c, i) => {
      const x = 8 + i * 7.5;
      flat(ctx, x, -34, 5, 14, c, "mLine");
      flat(ctx, x + 1.5, -32, 2, 10, "#050403");
      const full = state === 2 || (state === 1 && i === 0);
      if (full) flat(ctx, x + 1, -36, 3, 6, c, "mLine");
      disc(ctx, x + 2.5, -17.5, 1.1, full ? "#5ac060" : "#3a1410");
    });
    box(ctx, 0, -6, 36, 6, "steel", 0);
    G.grain(ctx, G.rectRegion(ctx, 2, -42, 32, 42), 1030);
    G.dirt(ctx, 2, -42, 32, 42, 1031, 0.3);
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
    cylV(ctx, 4, -44, 40, 44, "armor", 1);
    flat(ctx, 2, -48, 44, 5, "#3a1006", "aLine");
    flat(ctx, 2, -4, 44, 4, "#3a1006", "aLine");
    hazard(ctx, 4, -32, 40, 7, 5);
    disc(ctx, 24, -15, 6, "#f4e0a0", "aLine");
    shape(ctx, [[24, -20], [27, -14], [24, -11], [21, -14]], "#c02010");
    G.grain(ctx, G.rectRegion(ctx, 2, -48, 44, 48), 1051);
    G.drips(ctx, 4, -44, 40, 20, 1052, 3);
    G.dirt(ctx, 4, -44, 40, 44, 1053, 0.3);
  },
};

const cart = (ctx: Ctx, x: number, seed: number): void => {
  const r = rng(seed);
  const body: Pt[] = [[x, 0], [x + 44, 0], [x + 40, 17], [x + 4, 17]];
  shape(ctx, [[x + 2, 0], ...jag(x + 2, x + 42, -2.6, 1.4, 3, seed), [x + 42, 0]], ROCK[3]);
  shape(ctx, body, CART[1]);
  shape(ctx, [[x + 1, 0.5], [x + 43, 0.5], [x + 42.5, 3], [x + 1.5, 3]], CART[3]);
  shape(ctx, [[x + 3, 13], [x + 41, 13], [x + 40, 17], [x + 4, 17]], CART[0]);
  for (const cx of [x + 14, x + 26]) line(ctx, [[cx - 3, 6], [cx + 1, 9], [cx - 3, 12]], CART[0], 1.6);
  path(ctx, body);
  stroke(ctx, "#141404");
  for (const wx of [x + 10, x + 34]) {
    disc(ctx, wx, 19.5, 3.6, "m1", "mLine");
    disc(ctx, wx, 19.5, 1.2, "m3");
  }
  if (r() < 0.6) G.rustPatch(ctx, x + 8 + r() * 28, 8 + r() * 5, 3, 2, seed + 2);
};

const mineCarts: EnvAsset = {
  id: "mineCarts",
  box: [0, -6, 192, 26],
  draw(ctx, _state, _t, { w = 192 } = {}) {
    const seed = 1060 + round(w);
    flat(ctx, 0, 22.5, w, 2, "m2", "mLine");
    if (!simple()) for (let x = 3; x < w; x += 8) flat(ctx, x, 24, 4, 1.5, "r1");
    for (let x = 1; x < w - 40; x += 47) cart(ctx, x, seed + x);
    G.grain(ctx, G.rectRegion(ctx, 0, -4, w, 28), seed + 1, 0.8);
    G.dirt(ctx, 0, 0, w, 24, seed + 2, 0.3);
  },
};

const cartCrusher: EnvAsset = {
  id: "cartCrusher",
  box: [-6, -100, 78, 50],
  draw(ctx) {
    box(ctx, -4, -98, 76, 12, "steel", 1);
    cylV(ctx, -4, -86, 8, 134, "steel", 1);
    cylV(ctx, 64, -86, 8, 134, "steel", 1);
    hazard(ctx, -4, -98, 76, 5, 6);
    cog(ctx, 22, -40, 16, 12);
    cog(ctx, 48, 4, 16, 12);
    if (!simple()) for (const [x, y] of [[30, -14], [36, -18], [40, -10], [33, -6], [44, -16]] as Pt[]) line(ctx, [[x, y], [x + 3, y - 2]], "#ffe080", 0.9);
    glow(ctx, 36, -12, 18, "#ffb040", 0.35);
    G.grain(ctx, G.rectRegion(ctx, -4, -98, 76, 12), 1070);
    for (const x of [-4, 64]) G.grain(ctx, G.rectRegion(ctx, x, -86, 8, 134), 1072 + x);
    G.drips(ctx, -4, -86, 76, 30, 1071, 4);
  },
};

const lavaSurface = (ctx: Ctx, w: number, top: number, h: number, seed: number): void => {
  const r = rng(seed);
  const g = ctx.createLinearGradient(0, top, 0, top + h);
  g.addColorStop(0, LAVA[3]);
  g.addColorStop(0.3, LAVA[2]);
  g.addColorStop(1, LAVA[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, top, w, h);
  for (let x = r() * 6; x < w - 2; x += 5 + r() * 9) {
    const cw = 3 + r() * 6;
    veil(ctx, [[x, top + 3 + r() * 4], [x + cw, top + 2 + r() * 4], [x + cw * 0.8, top + 8 + r() * 6], [x + 0.5, top + 7 + r() * 6]], LAVA[0], 0.55);
  }
  if (!simple()) for (let i = 0; i < w / 10; i++) disc(ctx, r() * w, top + 1 + r() * 3, 0.6 + r(), LAVA[3]);
};

const lavaPit: EnvAsset = {
  id: "lavaPit",
  box: [0, -24, 48, 26],
  draw(ctx, _state, _t, { w = 48 } = {}) {
    const g = ctx.createLinearGradient(0, -24, 0, 6);
    g.addColorStop(0, "rgba(255,90,16,0)");
    g.addColorStop(1, "rgba(255,110,24,0.45)");
    ctx.fillStyle = g;
    ctx.fillRect(0, -24, w, 30);
    lavaSurface(ctx, w, 6, 18, 1080 + round(w));
  },
};

const chasm: EnvAsset = {
  id: "chasm",
  box: [0, -6, 96, 74],
  draw(ctx, _state, _t, { w = 96 } = {}) {
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
    line(ctx, [[-14, -2], [12, -5]], "mLine", 3.2);
    line(ctx, [[-14, -2], [12, -5]], "m3", 1.8);
    box(ctx, 10, -8, 5, 6, "rust", 2);
  },
};

const keyCard = (c: string, id: string): EnvAsset => ({
  id,
  box: [-9, -14, 9, 0],
  draw(ctx, state) {
    if (state === 2) return;
    shape(ctx, [[-8, -2], [6, -2], [8, -4], [8, -12], [-8, -12]], c, "#1a1206");
    flat(ctx, -6, -10, 4, 3, "#f0e8c0", "#1a1206");
    flat(ctx, -1, -6, 7, 1.4, "#1a1206");
  },
});

const entryCard: EnvAsset = {
  id: "entryCard",
  box: [-9, -14, 9, 0],
  draw(ctx, state) {
    if (state === 2) return;
    flat(ctx, -8, -12, 16, 10, "#e8e8e0", "#141414");
    flat(ctx, -8, -9.5, 16, 2.4, "#202020");
    flat(ctx, -6, -6, 5, 3, "#c8a018");
  },
};

export const JESKYNE_IDS = [
  "stalactite", "crystal", "leverBank", "leverDoor", "keyDoors", "caveCardDoor", "airlock", "liftLock", "keySlots", "stoneBlocks", "explosiveTank", "mineCarts", "cartCrusher",
  "lavaPit", "chasm", "rod", "yellowKey", "orangeKey", "blueKey", "entryCard",
] as const;

export const jeskyneAssets: EnvAsset[] = [
  stalactite, crystal, leverBank, leverDoor, keyDoors, caveCardDoor, airlock, liftLock, keySlots, stoneBlocks, explosiveTank, mineCarts, cartCrusher, lavaPit, chasm, rod,
  keyCard("#e8c21a", "yellowKey"), keyCard("#ee7a1a", "orangeKey"), keyCard("#3a70e0", "blueKey"), entryCard,
];
