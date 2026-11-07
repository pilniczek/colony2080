import { G } from "./grime";
import { blobPts, fern, frond, grass, leafBlob, LEAF, mossCap, simple, vine, type Ctx, type Pt } from "./jungle";
import { P, type EnvAsset } from "./paint";

const { rng, path, color, flat, disc, glow, stroke, shape, line, curve, trefoil } = P;
const { PI, sin, cos, min, max, round } = Math;

type Five = readonly [string, string, string, string, string];
type Band = readonly [number, number, string];

const CHROME: Five = ["#18242a", "#303c3c", "#3c4848", "#546060", "#0a1010"];
const SHINE = "#b8c8c8";
const DOME = ["#0c1c1c", "#183030", "#2c4848", "#7c9c9c"] as const;
const SADDLE: Five = ["#241c0c", "#3c3018", "#544830", "#6c603c", "#100c06"];
const VALVE = ["#4a2410", "#6c3c18", "#a8602c"] as const;
const EXC: Five = ["#3a1400", "#542400", "#78240c", "#90240c", "#1c0a04"];
const BOOM: Five = ["#2c2c26", "#4e4e44", "#6c6c60", "#9c9c90", "#121210"];
const TRACK = ["#141410", "#22221a", "#3c3c30"] as const;
const BRONZE: Five = ["#2c1c0c", "#483018", "#603018", "#8c5430", "#140c06"];
const OLIVE = "#544830";
const HEDGE = ["#141c0c", "#243018", "#303c18", "#4c6024"] as const;
const CAR: Five = ["#483018", "#784824", "#9c6c18", "#c08a34", "#180e06"];
const BERRY = ["#16240c", "#243c18", "#304818", "#3c6018"] as const;
const WOOD: Five = ["#1c1208", "#3c2814", "#604824", "#7c6034", "#0e0804"];
const CUT = ["#6c5438", "#9c846c", "#b8a084"] as const;
const DRUM: Five = ["#24160a", "#3c2814", "#604824", "#7a5c34", "#0e0804"];
const VENT: Five = ["#1c2626", "#303c3c", "#546060", "#7c8c8c", "#0a1010"];
const SIGN: Five = ["#6c5408", "#b89428", "#e4c048", "#f8e08a", "#241c04"];
const LEAF_DARK = ["#0a1a10", "#183424", "#24482c", "#386a3c"] as const;
const HOLE = "#070606";
const GLASS = "#141e22";

const within = (ctx: Ctx, rects: readonly (readonly [number, number, number, number])[], fn: () => void): void => G.inside(ctx, G.rectsRegion(ctx, rects), fn);
const clipped = (ctx: Ctx, pts: Pt[], fn: () => void): void => G.inside(ctx, G.polyRegion(ctx, pts), fn);

const oval = (ctx: Ctx, cx: number, cy: number, rx: number, ry: number, fill: string, edge: string | null = null, a0 = 0, a1 = PI * 2): void => {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, a0, a1);
  ctx.fillStyle = color(fill);
  ctx.fill();
  if (edge) stroke(ctx, edge);
};

const ovalPts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = PI * 2, n = 16): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + cos(a) * rx, cy + sin(a) * ry] as Pt;
  });

const bands = (ctx: Ctx, x: number, y: number, w: number, h: number, list: readonly Band[]): void => {
  for (const [k0, k1, c] of list) flat(ctx, x, y + h * k0, w, h * (k1 - k0), c);
};

const saddle = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number): void => {
  const r = rng(seed);
  const frame: Pt[] = [[x, y + h], [x, y + 3], [x + 3, y], [x + w - 3, y], [x + w, y + 3], [x + w, y + h]];
  shape(ctx, frame, SADDLE[1], SADDLE[4]);
  flat(ctx, x + 2, y + 3, w - 4, h - 5, SADDLE[0]);
  flat(ctx, x, y, w, 1.6, SADDLE[3]);
  for (const k of [0.3, 0.62]) {
    const vx = x + w * k;
    flat(ctx, vx, y + 3, 3, h - 5, VALVE[1], VALVE[0]);
    if (!simple()) flat(ctx, vx + 0.4, y + 3, 1, h - 5, VALVE[2]);
  }
  if (!simple()) for (let gy = y + 5; gy < y + h - 3; gy += 2.4) flat(ctx, x + w * 0.42, gy, w * 0.14, 1, CHROME[3]);
  G.grain(ctx, G.polyRegion(ctx, frame), seed, 0.9);
  clipped(ctx, frame, () => {
    G.drips(ctx, x, y + 1, w, h * 0.7, seed + 1, 2);
    G.rustPatch(ctx, x + w * (0.2 + r() * 0.6), y + h - 3, 2.4, 1.2, seed + 2);
    G.dirt(ctx, x, y, w, h, seed + 3, 0.5);
  });
  G.chips(ctx, x, y, w, seed + 4, G.DIRT);
};

const chemCylinder = (ctx: Ctx, x: number, y: number, w: number, d: number, seed: number): void => {
  const r = rng(seed);
  const rx = d * 0.32;
  const ry = d / 2;
  const cy = y + ry;
  for (const ex of [x, x + w]) {
    oval(ctx, ex, cy, rx, ry, DOME[1], CHROME[4]);
    oval(ctx, ex + (ex === x ? 1 : -1), cy - 1, rx * 0.8, ry * 0.82, DOME[2]);
    if (!simple()) {
      ctx.beginPath();
      ctx.ellipse(ex, cy, rx * 0.62, ry * 0.7, 0, PI * 1.08, PI * 1.42);
      ctx.strokeStyle = color(DOME[3]);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    oval(ctx, ex, cy + ry * 0.3, rx * 0.85, ry * 0.5, DOME[0], null, 0, PI);
  }
  const body = G.rectPts(x, y, w, d);
  shape(ctx, body, CHROME[2], CHROME[4]);
  bands(ctx, x, y, w, d, [[0, 0.1, CHROME[1]], [0.1, 0.32, CHROME[3]], [0.16, 0.26, SHINE], [0.32, 0.6, CHROME[2]], [0.6, 0.82, CHROME[1]], [0.82, 1, CHROME[0]]]);
  if (!simple()) {
    flat(ctx, x, y + d * 0.2, w, 0.6, "#e8f0f0");
    for (const sx of [x + 2, x + w - 3]) flat(ctx, sx, y, 1, d, CHROME[0]);
  }
  const plate = [x + w * 0.18, y + d * 0.36, w * 0.16, d * 0.14] as const;
  flat(ctx, ...plate, CHROME[0], CHROME[4]);
  if (!simple()) flat(ctx, plate[0] + 1, plate[1] + 1, plate[2] - 2, 0.8, CHROME[3]);
  G.grain(ctx, G.rectRegion(ctx, x, y, w, d), seed, 0.4);
  within(ctx, [[x, y, w, d]], () => {
    G.drips(ctx, x, y + d * 0.3, w, d * 0.6, seed + 1, round(w / 30));
    G.rustPatch(ctx, x + w * (0.4 + r() * 0.2), y + d * 0.8, 5, 2, seed + 2);
    G.rustPatch(ctx, x + w * 0.9, y + d * 0.55, 2.5, 2, seed + 3);
    G.dirt(ctx, x, y, w, d, seed + 4, 0.3);
  });
  G.chips(ctx, x, y + 0.4, w, seed + 5, G.DUST);
  const tx = x + w * 0.74;
  const tr = d * 0.17;
  trefoil(ctx, tx, cy + 1, tr);
  if (!simple()) G.chips(ctx, tx - tr, cy + 1 - tr * 0.3, tr * 2, seed + 6, G.DIRT);
  G.inside(
    ctx,
    () => {
      ctx.beginPath();
      ctx.arc(tx, cy + 1, tr, 0, PI * 2);
    },
    () => G.rustPatch(ctx, tx + tr * 0.6, cy + tr * 0.8, tr * 0.35, tr * 0.25, seed + 7),
  );
};

const chemTank: EnvAsset = {
  id: "chemTank",
  box: [-2, -98, 146, 0],
  draw(ctx, state) {
    const seed = 7100 + state * 13;
    const d = 34;
    ctx.save();
    ctx.globalAlpha = 0.45;
    flat(ctx, 4, -2, 136, 2, HOLE);
    ctx.restore();
    for (const sx of [24, 98]) saddle(ctx, sx, -14, 22, 14, seed + sx);
    chemCylinder(ctx, 12, -48, 120, d, seed + 40);
    if (state !== 1) return;
    for (const sx of [24, 98]) saddle(ctx, sx, -62, 22, 14, seed + 60 + sx);
    chemCylinder(ctx, 12, -96, 120, d, seed + 80);
  },
};

const road = (ctx: Ctx, cx: number, cy: number, rr: number, seed: number): void => {
  disc(ctx, cx, cy, rr, TRACK[1], "#060604");
  disc(ctx, cx, cy, rr * 0.55, TRACK[2]);
  disc(ctx, cx, cy, rr * 0.2, TRACK[0]);
  if (!simple()) G.rustPatch(ctx, cx + rr * 0.2, cy, rr * 0.25, rr * 0.18, seed);
};

const thick = (ctx: Ctx, pts: Pt[], w: number, tones: Five): void => {
  curve(ctx, pts, tones[4], w + 1.4);
  curve(ctx, pts, tones[1], w);
  if (!simple()) curve(ctx, pts.map(([x, y]) => [x - 0.6, y - w * 0.28] as Pt), tones[3], w * 0.28);
};

const excavator: EnvAsset = {
  id: "excavator",
  box: [-2, -74, 146, 0],
  draw(ctx) {
    const seed = 7200;
    const track: Pt[] = [[50, -15], [134, -15], [142, -8], [135, 0], [49, 0], [42, -8]];
    shape(ctx, track, TRACK[1], "#060604");
    if (!simple())
      for (let x = 50; x < 135; x += 3) {
        line(ctx, [[x, -15], [x, -13.4]], TRACK[2], 0.9);
        line(ctx, [[x + 1.5, 0], [x + 1.5, -1.6]], TRACK[2], 0.9);
      }
    clipped(ctx, track, () => G.dirt(ctx, 40, -15, 104, 15, seed, 0.7));
    road(ctx, 50, -7.5, 6.5, seed + 1);
    road(ctx, 134, -7.5, 6.5, seed + 2);
    for (let k = 0; k < 5; k++) road(ctx, 64 + k * 14, -6.5, 5, seed + 3 + k);
    const base: Pt[] = [[54, -15], [54, -22], [132, -22], [132, -15]];
    shape(ctx, base, TRACK[2], "#060604");
    const body: Pt[] = [[52, -22], [52, -40], [96, -40], [96, -46], [138, -46], [140, -22]];
    shape(ctx, body, EXC[2], EXC[4]);
    flat(ctx, 52, -40, 44, 2, EXC[3]);
    flat(ctx, 96, -46, 42, 2, EXC[3]);
    flat(ctx, 52, -27, 88, 5, EXC[1]);
    if (!simple()) for (let y = -42; y < -30; y += 3) flat(ctx, 108, y, 26, 1.2, EXC[0]);
    const cab: Pt[] = [[70, -40], [72, -64], [96, -64], [98, -40]];
    shape(ctx, cab, EXC[3], EXC[4]);
    flat(ctx, 70, -66, 30, 3, EXC[1], EXC[4]);
    const glass: Pt[] = [[75, -44], [76, -60], [93, -60], [94, -44]];
    shape(ctx, glass, GLASS, EXC[4]);
    const parts = [body, cab];
    G.grain(ctx, G.polysRegion(ctx, parts), seed + 10);
    G.grain(ctx, G.polysRegion(ctx, parts), seed + 11, 0.7);
    G.inside(ctx, G.polysRegion(ctx, parts), () => {
      G.drips(ctx, 52, -46, 88, 22, seed + 12, 6);
      G.drips(ctx, 70, -64, 28, 18, seed + 13, 3);
      G.rustPatch(ctx, 62, -30, 5, 2.5, seed + 14);
      G.rustPatch(ctx, 122, -36, 6, 3, seed + 15);
      G.rustPatch(ctx, 90, -52, 2.6, 2, seed + 16);
      G.dirt(ctx, 52, -46, 88, 24, seed + 17, 0.5);
    });
    G.chips(ctx, 96, -46, 42, seed + 18, G.DIRT);
    G.chips(ctx, 70, -66, 30, seed + 19, G.DIRT);
    clipped(ctx, glass, () => {
      const crack: Pt[] = [[80, -58], [88, -55], [90, -48], [82, -46], [78, -52]];
      G.scorch(ctx, crack, seed + 20);
      shape(ctx, crack, HOLE);
      G.rim(ctx, crack, seed + 21, "#6c7c80", HOLE);
    });
    if (!simple()) {
      for (const x of [100, 108, 116]) line(ctx, [[x, -46], [x, -52]], VALVE[1], 1);
      line(ctx, [[99, -52], [118, -52]], VALVE[2], 1.2);
    }
    thick(ctx, [[64, -36], [52, -60], [30, -70], [16, -62]], 7, BOOM);
    thick(ctx, [[18, -64], [12, -46], [14, -28]], 5, BOOM);
    const rods: [Pt, Pt][] = [[[70, -26], [50, -52]], [[42, -64], [22, -54]]];
    for (const [a, b] of rods) {
      line(ctx, [a, b], BOOM[4], 2.2);
      line(ctx, [a, b], CHROME[3], 1.2);
      if (!simple()) line(ctx, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]], BOOM[0], 1.2);
    }
    for (const [px, py] of [[64, -36], [17, -63], [14, -28]] as Pt[]) disc(ctx, px, py, 2.2, BOOM[0], BOOM[4]);
    const bucket: Pt[] = [[6, -30], [22, -28], [24, -14], [16, -4], [4, -4], [2, -16]];
    shape(ctx, bucket, BOOM[2], BOOM[4]);
    flat(ctx, 6, -30, 16, 2, BOOM[3]);
    for (let tx = 4; tx < 16; tx += 3.4) shape(ctx, [[tx, -4], [tx + 1.6, -1], [tx + 3, -4]], BOOM[1], BOOM[4]);
    const arm = [bucket];
    G.grain(ctx, G.polysRegion(ctx, arm), seed + 30);
    G.inside(ctx, G.polysRegion(ctx, arm), () => {
      G.rustPatch(ctx, 12, -12, 4, 3, seed + 31);
      G.dirt(ctx, 2, -30, 22, 26, seed + 32, 0.6);
    });
    G.rustPatch(ctx, 36, -68, 3, 1.6, seed + 33);
    G.rustPatch(ctx, 13, -44, 1.6, 3, seed + 34);
  },
};

const caveCapsule: EnvAsset = {
  id: "caveCapsule",
  box: [-2, -50, 32, 0],
  draw(ctx) {
    const seed = 7300;
    const dome: Pt[] = [[3, -26], ...ovalPts(15, -26, 12, 20, PI, PI * 2, 14).slice(1)];
    shape(ctx, dome, CHROME[2], CHROME[4]);
    clipped(ctx, dome, () => {
      flat(ctx, 3, -46, 24, 20, CHROME[2]);
      flat(ctx, 3, -46, 6, 20, CHROME[1]);
      flat(ctx, 20, -46, 7, 20, CHROME[0]);
      flat(ctx, 10, -46, 3.4, 20, SHINE);
      const ribs = simple() ? [-42, -36, -30] : [-43, -39.5, -36, -32.5, -29];
      for (const y of ribs) {
        flat(ctx, 0, y, 30, 1.4, CHROME[4]);
        flat(ctx, 0, y + 1.4, 30, 0.8, CHROME[3]);
      }
      G.grain(ctx, G.polyRegion(ctx, dome), seed, 0.6);
    });
    const can = G.rectPts(3, -26, 24, 20);
    shape(ctx, can, CHROME[2], CHROME[4]);
    flat(ctx, 3, -26, 6, 20, CHROME[1]);
    flat(ctx, 21, -26, 6, 20, CHROME[0]);
    flat(ctx, 10, -26, 3.4, 20, SHINE);
    if (!simple()) flat(ctx, 11, -26, 1, 20, "#e8f0f0");
    flat(ctx, 3, -27, 24, 2, CHROME[3], CHROME[4]);
    G.grain(ctx, G.rectRegion(ctx, 3, -26, 24, 20), seed + 1, 0.8);
    within(ctx, [[3, -26, 24, 20]], () => {
      G.drips(ctx, 3, -25, 24, 12, seed + 2, 1);
      G.rustPatch(ctx, 20, -10, 3, 2, seed + 3);
      G.dirt(ctx, 3, -26, 24, 20, seed + 4, 0.45);
    });
    shape(ctx, [[0, 0], [0, -6], [2, -7], [28, -7], [30, -6], [30, 0]], CHROME[1], CHROME[4]);
    flat(ctx, 0, -6, 30, 1.2, CHROME[3]);
    if (!simple()) for (let bx = 2.5; bx < 29; bx += 4.2) disc(ctx, bx, -3.2, 0.7, CHROME[3], CHROME[4]);
    G.grain(ctx, G.rectRegion(ctx, 0, -7, 30, 7), seed + 5);
    G.dirt(ctx, 0, -7, 30, 7, seed + 6, 0.8);
    G.chips(ctx, 2, -7, 26, seed + 7, G.DIRT);
  },
};

const BOILER: Five = ["#2a160a", "#483018", "#604824", "#6c3c18", "#120a04"];
const BOILER_TOP = ["#5a2410", "#7a3418", "#a24e28"] as const;

const rustBoiler: EnvAsset = {
  id: "rustBoiler",
  box: [-2, -84, 64, 0],
  draw(ctx) {
    const seed = 7400;
    ctx.save();
    ctx.globalAlpha = 0.45;
    flat(ctx, 2, -2, 56, 2, HOLE);
    ctx.restore();
    for (const [py, ph] of [[-56, 5], [-40, 4]] as const) {
      flat(ctx, 50, py, 12, ph, CHROME[2], CHROME[4]);
      if (!simple()) flat(ctx, 50, py, 12, 1, CHROME[3]);
      flat(ctx, 58, py - 1.5, 3, ph + 3, CHROME[1], CHROME[4]);
    }
    flat(ctx, 4, -68, 48, 54, BOILER[2], BOILER[4]);
    flat(ctx, 4, -68, 6, 54, BOILER[3]);
    flat(ctx, 44, -68, 8, 54, BOILER[1]);
    for (const sx of [16, 28, 40]) {
      flat(ctx, sx, -68, 1.2, 54, BOILER[0]);
      if (!simple()) for (let ry = -65; ry < -15; ry += 5) disc(ctx, sx + 2.6, ry, 0.7, BOILER[3], BOILER[4]);
    }
    flat(ctx, 8, -44, 16, 14, BOILER[0], BOILER[4]);
    flat(ctx, 10, -42, 12, 2, BOILER[1]);
    if (!simple()) for (let gx = 11; gx < 22; gx += 3) flat(ctx, gx, -38, 1.4, 6, "#1a0c04");
    disc(ctx, 36, -54, 4.4, "#b8b09a", BOILER[4]);
    disc(ctx, 36, -54, 3.2, "#d8d0b8");
    line(ctx, [[36, -54], [38.4, -56.4]], "#60140a", 0.8);
    flat(ctx, 2, -75, 52, 7, BOILER_TOP[1], BOILER[4]);
    if (!simple()) flat(ctx, 2, -75, 52, 1.4, BOILER_TOP[2]);
    flat(ctx, 2, -69.4, 52, 1.4, BOILER_TOP[0]);
    flat(ctx, 20, -82, 8, 7, BOILER[1], BOILER[4]);
    flat(ctx, 18, -83, 12, 2, BOILER[3], BOILER[4]);
    G.grain(ctx, G.rectsRegion(ctx, [[4, -68, 48, 54], [2, -75, 52, 7], [20, -82, 8, 7]]), seed, 0.8);
    within(ctx, [[4, -68, 48, 54]], () => {
      G.drips(ctx, 4, -68, 48, 36, seed + 1, 5);
      G.rustPatch(ctx, 30, -30, 6, 4, seed + 2);
      G.rustPatch(ctx, 12, -60, 3, 2, seed + 3);
      G.dirt(ctx, 4, -68, 48, 54, seed + 4, 0.5);
    });
    G.chips(ctx, 2, -75, 52, seed + 5, G.DIRT);
    flat(ctx, 6, -15, 44, 15, CHROME[2], CHROME[4]);
    bands(ctx, 6, -15, 44, 15, [[0, 0.14, CHROME[3]], [0.14, 0.3, SHINE], [0.3, 0.62, CHROME[2]], [0.62, 0.84, CHROME[1]], [0.84, 1, CHROME[0]]]);
    for (const ex of [6, 50]) oval(ctx, ex, -7.5, 2.4, 7.5, CHROME[1], CHROME[4]);
    if (!simple()) for (const bx of [14, 28, 42]) flat(ctx, bx, -15, 1.2, 15, CHROME[0]);
    G.grain(ctx, G.rectRegion(ctx, 6, -15, 44, 15), seed + 6, 0.5);
    within(ctx, [[6, -15, 44, 15]], () => {
      G.rustPatch(ctx, 20, -3, 5, 2, seed + 7);
      G.dirt(ctx, 6, -15, 44, 15, seed + 8, 0.6);
    });
  },
};

const HELI = { x: 68, y: -50, a: -0.52, k: 1.3 };

const heliPoint = (px: number, py: number): Pt => {
  const c = cos(HELI.a) * HELI.k;
  const s = sin(HELI.a) * HELI.k;
  return [HELI.x + px * c - py * s, HELI.y + px * s + py * c];
};

const heliHull = (ctx: Ctx, seed: number): void => {
  const r = rng(seed);
  ctx.save();
  ctx.translate(HELI.x, HELI.y);
  ctx.rotate(HELI.a);
  ctx.scale(HELI.k, HELI.k);
  const boom: Pt[] = [[18, -14], [76, -6], [78, 1], [18, 8]];
  shape(ctx, boom, BRONZE[2], BRONZE[4]);
  flat(ctx, 18, -12, 58, 3, BRONZE[3]);
  flat(ctx, 18, 3, 60, 3, BRONZE[1]);
  const fin: Pt[] = [[66, -6], [74, -28], [82, -28], [82, -4]];
  shape(ctx, fin, BRONZE[3], BRONZE[4]);
  flat(ctx, 74, -28, 8, 2, "#a8683c");
  const hull: Pt[] = [[-46, 6], [-44, -6], [-36, -18], [-22, -26], [-4, -28], [14, -24], [26, -14], [30, 0], [26, 14], [10, 22], [-14, 24], [-34, 20], [-44, 14]];
  shape(ctx, hull, BRONZE[2], BRONZE[4]);
  clipped(ctx, hull, () => {
    flat(ctx, -50, -30, 84, 10, BRONZE[3]);
    flat(ctx, -50, 10, 84, 16, BRONZE[1]);
    flat(ctx, -12, -20, 26, 30, OLIVE);
    if (!simple()) for (const lx of [-12, 1, 14]) line(ctx, [[lx, -26], [lx, 22]], BRONZE[4], 0.6);
  });
  const glass: Pt[] = [[-45, 4], [-42, -7], [-34, -17], [-22, -20], [-22, 2], [-34, 8]];
  shape(ctx, glass, GLASS, BRONZE[4]);
  if (!simple()) line(ctx, [[-40, -6], [-32, -14]], "#4c6066", 0.8);
  const parts = [hull, boom, fin];
  G.grain(ctx, G.polysRegion(ctx, parts), seed + 1);
  G.grain(ctx, G.polysRegion(ctx, parts), seed + 2, 0.7);
  G.inside(ctx, G.polysRegion(ctx, parts), () => {
    G.rustPatch(ctx, 8, 12, 6, 3, seed + 3);
    G.rustPatch(ctx, 50, 0, 4, 2, seed + 4);
    G.drips(ctx, -40, -24, 70, 30, seed + 5, 6);
    G.drips(ctx, 20, -10, 56, 12, seed + 6, 3);
    const tear: Pt[] = [[2, -8], [14, -14], [22, -2], [16, 8], [4, 6]];
    G.scorch(ctx, tear, seed + 7);
    shape(ctx, tear, HOLE);
    G.rim(ctx, tear, seed + 8, BRONZE[3], HOLE);
  });
  G.chips(ctx, -30, -24, 50, seed + 9, G.DIRT);
  for (const [px, py] of [[-12, 22], [14, 20]] as Pt[]) line(ctx, [[px, py], [px - 6 - r() * 4, py + 8]], BOOM[1], 1.4);
  line(ctx, [[-30, 30], [-4, 31], [16, 26]], BOOM[1], 1.6);
  flat(ctx, -6, -33, 12, 6, BRONZE[1], BRONZE[4]);
  flat(ctx, -2, -37, 4, 4, BOOM[1], BOOM[4]);
  ctx.restore();
};

const blade = (ctx: Ctx, pts: Pt[]): void => {
  curve(ctx, pts, "#100c08", 4.2);
  curve(ctx, pts, BOOM[1], 3);
  if (!simple()) curve(ctx, pts, BOOM[3], 0.8);
};

const helicopterWreck: EnvAsset = {
  id: "helicopterWreck",
  box: [-2, -146, 170, 2],
  draw(ctx) {
    const seed = 7400;
    ctx.save();
    ctx.globalAlpha = 0.5;
    flat(ctx, 0, -2, 168, 2, HOLE);
    ctx.restore();
    const [tx, ty] = heliPoint(80, -16);
    blade(ctx, [[tx - 2, ty + 6], [tx + 4, ty - 12], [tx + 2, ty - 20]]);
    blade(ctx, [[tx - 10, ty - 6], [tx + 12, ty - 10]]);
    heliHull(ctx, seed + 10);
    const hub = heliPoint(0, -37);
    blade(ctx, [hub, [hub[0] - 18, hub[1] - 20], [hub[0] - 40, hub[1] - 14], [hub[0] - 50, hub[1] + 16], [hub[0] - 52, -4]]);
    blade(ctx, [hub, [hub[0] + 30, hub[1] - 18], [hub[0] + 56, hub[1] - 32], [hub[0] + 76, hub[1] - 34]]);
    blade(ctx, [hub, [hub[0] + 12, hub[1] + 8], [hub[0] + 20, hub[1] + 34]]);
    disc(ctx, hub[0], hub[1], 3, BOOM[1], BOOM[4]);
    const r = rng(seed + 50);
    const n = 12;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1);
      const cx = 10 + k * 130 + (r() - 0.5) * 8;
      const cy = -10 - r() * 10 - sin(k * PI) * 22;
      leafBlob(ctx, cx, cy, 13 + r() * 8, 10 + r() * 6, seed + 60 + i * 5, HEDGE);
    }
    if (!simple()) {
      for (const [x, h] of [[24, 26], [60, 38], [96, 34], [134, 22]] as Pt[]) {
        ctx.save();
        ctx.translate(x, 0);
        fern(ctx, 0, h, seed + 90 + x, HEDGE);
        ctx.restore();
      }
      for (const px of [-10, 14]) {
        const [vx, vy] = heliPoint(px, -20);
        vine(ctx, vx, vy, 24, seed + px);
      }
    }
  },
};

const TYRE = ["#0a0806", "#151210", "#221c16", "#3a332c"] as const;
const WELL = "#140c06";
const SEAT = ["#1c1810", "#2e2818", "#443a24"] as const;
const RUST_HOLE = "#5a2a10";
const RUST_LIGHT = "#b8682c";
const MID = "#8a5a1e";

type Rect = [number, number, number, number];
type WheelKind = "tyre" | "flat" | "rim";

interface Wreck {
  top: Pt[];
  base: number;
  belt: number;
  roof: [number, number, number];
  wheels: [number, number, WheelKind][];
  glass: Pt[][];
  doors: number[];
  handles: Pt[];
  holes: Pt[][];
  seams: Pt[][];
  bed?: [number, number, number];
  bars?: Pt[][];
  seat?: Pt[];
  wheelPost?: [Pt, Pt];
  grille?: Rect;
  spare?: [number, number, number];
  tail?: Rect;
  head?: Rect;
  bumpers: Rect[];
  moss: Rect[];
  leaves: Rect[];
  vines: [number, number, number][];
  ferns: Pt[];
  seed: number;
}

const hull = (top: Pt[], base: number, arches: Pt[]): Pt[] => {
  const pts = [...top];
  for (const [cx, rr] of [...arches].sort((a, b) => b[0] - a[0])) pts.push([cx + rr, base], ...ovalPts(cx, base, rr, rr, 0, -PI, 10).slice(1, -1), [cx - rr, base]);
  return pts;
};

const WRECKS: Wreck[] = [
  {
    top: [[0, -8], [0.6, -15], [3, -18], [20, -19.5], [33, -29.5], [37, -31], [59, -31], [63, -29.5], [74, -20.5], [92, -18.5], [95.4, -16], [96, -8]],
    base: -8,
    belt: -20.5,
    roof: [35, 61, -31],
    wheels: [[18, 8, "tyre"], [78, 8, "flat"]],
    glass: [[[36, -21.5], [40, -28.5], [52, -28.5], [52, -21.5]], [[55, -21.5], [55, -28.5], [60, -28.5], [70, -21.5]]],
    doors: [34, 53.5, 72.5],
    handles: [[45, -18.5], [64, -18.5]],
    holes: [[[24, -15], [28, -17], [31, -13], [26, -11]], [[84, -14], [88, -16], [90, -12]]],
    seams: [[[20, -19.5], [21, -12]], [[74, -20.5], [75, -12]]],
    tail: [0.4, -16, 2.6, 3],
    head: [93, -16, 3, 3],
    bumpers: [[-1.5, -12, 5, 2.6], [93, -12, 5, 2.6]],
    moss: [[4, -18.6, 14, 1.6], [76, -20, 16, 1.6]],
    leaves: [[9, -19, 7, 3.4], [86, -20, 6, 3], [48, -31.5, 9, 3.6]],
    vines: [[37, -30, 12], [61, -29, 16], [70, -21, 9]],
    ferns: [[6, 12], [92, 10]],
    seed: 7500,
  },
  {
    top: [[0, -8], [0, -23], [1, -24], [55, -24], [57, -25], [58, -33], [61, -34.5], [73, -34.5], [76, -33], [83, -24.5], [102, -22], [105.4, -19], [106, -8]],
    base: -8,
    belt: -24.5,
    roof: [59, 75, -34.5],
    wheels: [[20, 8.5, "tyre"], [88, 8.5, "tyre"]],
    glass: [[[60, -25.5], [61, -32], [73, -32], [80, -25.5]]],
    doors: [56.5, 81],
    handles: [[61, -22]],
    holes: [[[30, -18], [36, -20], [40, -15], [33, -13]], [[95, -17], [99, -19], [100, -14]]],
    seams: [[[3, -23], [3, -10]], [[83, -24.5], [84, -12]]],
    bed: [1, 55, -24],
    tail: [0.4, -21, 2.4, 4],
    head: [103, -19, 3, 3],
    bumpers: [[-1.5, -12, 5, 2.6], [103, -12, 5, 2.6]],
    moss: [[2, -24.4, 50, 2], [84, -24, 18, 1.6]],
    leaves: [[16, -25, 9, 5], [32, -27, 12, 7], [46, -25, 8, 4.6], [66, -35, 8, 3.2]],
    vines: [[26, -24, 10], [44, -24, 13], [76, -32, 14]],
    ferns: [[40, 14], [56, 10], [104, 10]],
    seed: 7520,
  },
  {
    top: [[0, -10], [0, -30], [2, -31.5], [40, -31.5], [42.5, -25], [55.5, -25], [58, -32.5], [89, -31], [93, -28], [94, -10]],
    base: -10,
    belt: -25,
    roof: [2, 40, -31.5],
    wheels: [[20, 10.5, "tyre"], [76, 10.5, "rim"]],
    glass: [],
    doors: [42.5, 55.5],
    handles: [],
    holes: [[[22, -24], [27, -26], [31, -21], [25, -18]], [[62, -20], [66, -22], [68, -18]]],
    seams: [[[58, -32.5], [60, -18]], [[86, -31], [87, -18]]],
    bars: [
      [[10, -31.5], [11, -51], [14, -55], [34, -55], [37, -51], [38, -31.5]],
      [[14, -54], [36.5, -33]],
      [[58.5, -32.5], [53, -51], [55, -53], [59, -53], [65, -32.5]],
    ],
    seat: [[42, -25], [40, -40], [44.5, -41.5], [47, -25]],
    wheelPost: [[57, -26], [52, -35.5]],
    grille: [89, 93, -28, -15],
    spare: [-1, -21, 8],
    head: [90, -26, 3.4, 3.4],
    bumpers: [[-3, -14, 5, 3], [92, -14, 6, 3]],
    moss: [[12, -55.8, 20, 1.6], [60, -32.8, 26, 1.8], [54, -53.6, 5, 1.2]],
    leaves: [[24, -56, 10, 4], [6, -32, 7, 3.6], [72, -33.5, 9, 3.6], [55, -53.6, 5, 2.6]],
    vines: [[34, -54, 18], [16, -54, 14], [57, -52, 16]],
    ferns: [[4, 12], [46, 16], [60, 12], [94, 10]],
    seed: 7540,
  },
];

const tube = (ctx: Ctx, pts: Pt[], seed: number): void => {
  const r = rng(seed);
  const shift = (d: number): Pt[] => pts.map(([x, y]) => [x - d, y - d] as Pt);
  line(ctx, pts, CAR[4], 3.6);
  line(ctx, pts, CAR[0], 2.8);
  line(ctx, shift(0.45), CAR[1], 1.5);
  line(ctx, shift(0.8), CAR[3], 0.6);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1] as Pt;
    const [bx, by] = pts[i] as Pt;
    const n = max(1, round(Math.hypot(bx - ax, by - ay) / 6));
    for (let k = 0; k < n; k++) {
      const t = (k + r()) / n;
      const px = ax + (bx - ax) * t;
      const py = ay + (by - ay) * t;
      disc(ctx, px, py, 0.5 + r() * 0.4, r() < 0.6 ? RUST_HOLE : CAR[0]);
      if (r() < 0.4) disc(ctx, px - 0.3, py - 0.4, 0.35, RUST_LIGHT);
    }
  }
};

const round2 = (ctx: Ctx, cx: number, cy: number, rr: number) => (): void => {
  ctx.beginPath();
  ctx.arc(cx, cy, rr, 0, PI * 2);
};

const tyre = (ctx: Ctx, x: number, rr: number, kind: WheelKind, seed: number): void => {
  const cy = kind === "rim" ? -rr * 0.62 : -rr;
  if (kind !== "rim") {
    disc(ctx, x, cy, rr, TYRE[1], TYRE[0]);
    for (let k = 0; k < 16; k++) {
      const a = (k * PI) / 8;
      line(ctx, [[x + cos(a) * rr * 0.84, cy + sin(a) * rr * 0.84], [x + cos(a) * rr, cy + sin(a) * rr]], TYRE[0], 0.9);
    }
    line(ctx, ovalPts(x, cy, rr * 0.78, rr * 0.78, PI * 1.05, PI * 1.6, 6), TYRE[3], 1);
    disc(ctx, x, cy, rr * 0.66, TYRE[2]);
  }
  const rim = kind === "rim" ? rr * 0.62 : rr * 0.5;
  disc(ctx, x, cy, rim, CAR[1], CAR[4]);
  G.inside(ctx, round2(ctx, x, cy, rim), () => {
    flat(ctx, x - rim, cy - rim, rim * 2, rim * 0.7, CAR[2]);
    flat(ctx, x - rim, cy + rim * 0.35, rim * 2, rim * 0.65, CAR[0]);
  });
  if (kind === "rim")
    for (let k = 0; k < 4; k++) {
      const a = PI / 4 + (k * PI) / 2;
      disc(ctx, x + cos(a) * rim * 0.62, cy + sin(a) * rim * 0.62, rim * 0.16, HOLE);
    }
  disc(ctx, x, cy, rim * 0.42, CAR[0], CAR[4]);
  for (let k = 0; k < 5; k++) {
    const a = k * PI * 0.4 - PI / 2;
    disc(ctx, x + cos(a) * rim * 0.26, cy + sin(a) * rim * 0.26, 0.45, CAR[3]);
  }
  disc(ctx, x, cy, rim * 0.12, CAR[3]);
  G.rustPatch(ctx, x + rim * 0.3, cy - rim * 0.2, rim * 0.35, rim * 0.22, seed);
  G.inside(ctx, round2(ctx, x, cy, kind === "rim" ? rim : rr), () => G.dirt(ctx, x - rr, cy - rr, rr * 2, rr * 2, seed + 1, 0.55));
  if (kind === "flat") {
    flat(ctx, x - rr - 1, -2.6, rr * 2 + 2, 2.6, TYRE[1], TYRE[0]);
    flat(ctx, x - rr, -2.4, rr * 2, 0.6, TYRE[3]);
  }
};

const well = (ctx: Ctx, cx: number, base: number, rr: number, seed: number): void => {
  const arch = ovalPts(cx, base, rr, rr, PI, PI * 2, 10);
  shape(ctx, arch, WELL);
  clipped(ctx, arch, () => {
    oval(ctx, cx, base, rr * 0.75, rr * 0.7, HOLE);
    G.grain(ctx, G.polyRegion(ctx, arch), seed, 0.8);
    for (let k = 0; k < 4; k++) line(ctx, [[cx - rr * 0.55, base - rr * 0.85 + k * 2], [cx - rr * 0.3, base - rr * 0.85 + k * 2 + 1.2]], CAR[0], 0.9);
    line(ctx, [[cx - rr, base - 1], [cx + rr, base - 1.6]], CAR[0], 1);
  });
};

const wreckBody = (ctx: Ctx, c: Wreck): Pt[] => {
  const w = max(...c.top.map((p) => p[0]));
  const top = min(...c.top.map((p) => p[1]));
  const arches = c.wheels.map(([x, rr]) => [x, rr + 1.8] as Pt);
  const body = hull(c.top, c.base, arches);
  for (const [x, rr] of arches) well(ctx, x, c.base, rr, c.seed + x);
  if (c.seat && c.wheelPost) {
    const seat = c.seat;
    shape(ctx, seat, SEAT[1], CAR[4]);
    clipped(ctx, seat, () => {
      flat(ctx, 38, -42, 4, 18, SEAT[2]);
      G.grain(ctx, G.polyRegion(ctx, seat), c.seed + 3, 0.9);
      G.rustPatch(ctx, 44, -34, 1.6, 2.4, c.seed + 4);
    });
    line(ctx, c.wheelPost, CAR[4], 1.4);
    line(ctx, ovalPts(c.wheelPost[1][0], c.wheelPost[1][1], 1.4, 4, 0, PI * 2, 12), CAR[4], 1);
  }
  for (const [i, pts] of (c.bars ?? []).entries()) tube(ctx, pts, c.seed + 70 + i);
  flat(ctx, 4, c.base, w - 8, 2.6, CAR[0], CAR[4]);
  flat(ctx, 4, c.base + 1.8, w - 8, 0.8, HOLE);
  shape(ctx, body, CAR[1], CAR[4]);
  clipped(ctx, body, () => {
    flat(ctx, 0, top - 2, w, c.belt - top + 2, MID);
    flat(ctx, 0, c.belt, w, 2.4, CAR[3]);
    flat(ctx, 0, c.belt + 2.4, w, 1, MID);
    flat(ctx, 0, c.base - 5, w, 5, CAR[0]);
    flat(ctx, 0, c.base - 5.4, w, 0.8, CAR[4]);
    flat(ctx, 0, c.belt + 7, w, 0.8, CAR[0]);
    line(ctx, c.top.slice(1, -1).map(([x, y]) => [x, y + 0.9] as Pt), CAR[3], 0.8);
  });
  G.inside(
    ctx,
    G.polyRegion(ctx, body),
    () => {
      G.grain(ctx, G.polyRegion(ctx, body), c.seed);
      G.grain(ctx, G.polyRegion(ctx, body), c.seed + 1, 0.8);
      G.rustPatch(ctx, w * 0.22, c.base - 4, w * 0.06, 2.6, c.seed + 2);
      G.rustPatch(ctx, w * 0.62, c.belt + 4, w * 0.05, 2.4, c.seed + 5);
      G.rustPatch(ctx, w * 0.86, c.base - 6, w * 0.05, 2.2, c.seed + 6);
      ctx.globalAlpha = 0.6;
      for (const h of c.holes) shape(ctx, h, HOLE);
      ctx.globalAlpha = 1;
      G.drips(ctx, 0, c.belt + 1, w, (c.base - c.belt) * 0.7, c.seed + 7, round(w / 10));
      G.dirt(ctx, 0, top, w, c.base - top, c.seed + 8, 0.45);
    },
    c.glass,
  );
  for (const [i, h] of c.holes.entries()) G.inside(ctx, G.polyRegion(ctx, body), () => G.rim(ctx, h, c.seed + 12 + i, CAR[3], CAR[4]));
  for (const pts of c.seams) line(ctx, pts, CAR[4], 0.7);
  for (const x of c.doors) {
    line(ctx, [[x, c.belt + 0.5], [x, c.base - 1]], CAR[4], 0.8);
    line(ctx, [[x + 0.7, c.belt + 0.5], [x + 0.7, c.base - 1]], CAR[3], 0.4);
  }
  for (const [x, y] of c.handles) flat(ctx, x, y, 3.4, 1.1, CAR[3], CAR[4]);
  for (const [x, rr] of arches) {
    const lip = ovalPts(x, c.base, rr + 0.4, rr + 0.4, PI, PI * 2, 12);
    G.inside(ctx, G.polyRegion(ctx, body), () => G.scorch(ctx, ovalPts(x, c.base, rr, rr, PI, PI * 2, 10), c.seed + 30 + x));
    line(ctx, lip, CAR[4], 1.8);
    line(ctx, ovalPts(x, c.base, rr + 1.3, rr + 1.3, PI * 1.1, PI * 1.9, 10), CAR[2], 0.6);
  }
  for (const [i, g] of c.glass.entries())
    clipped(ctx, body, () => {
      G.scorch(ctx, g, c.seed + 10 + i);
      shape(ctx, g, HOLE);
      G.rim(ctx, g, c.seed + 11 + i, CAR[3], CAR[4]);
    });
  if (c.bed) {
    const [b0, b1, by] = c.bed;
    flat(ctx, b0, by - 1, b1 - b0, 2.2, CAR[3], CAR[4]);
    for (let x = b0 + 8; x < b1 - 2; x += 12) flat(ctx, x, by + 1.6, 2, 2.4, HOLE);
  }
  if (c.grille) {
    const [g0, g1, gy0, gy1] = c.grille;
    flat(ctx, g0, gy0, g1 - g0, gy1 - gy0, HOLE);
    for (let x = g0 + 0.8; x < g1; x += 1.6) line(ctx, [[x, gy0], [x, gy1]], CAR[0], 0.8);
  }
  if (c.tail) flat(ctx, ...c.tail, "#5a160c", CAR[4]);
  if (c.head) {
    const [hx, hy, hw, hh] = c.head;
    flat(ctx, hx, hy, hw, hh, "#2c2a22", CAR[4]);
    flat(ctx, hx + 0.5, hy + 0.5, hw * 0.4, hh * 0.4, "#8c8c78");
  }
  for (const [i, [bx, by, bw, bh]] of c.bumpers.entries()) {
    flat(ctx, bx, by, bw, bh, CAR[0], CAR[4]);
    flat(ctx, bx, by, bw, 0.7, CAR[2]);
    G.rustPatch(ctx, bx + bw * 0.5, by + bh * 0.5, bw * 0.3, bh * 0.3, c.seed + 50 + i);
  }
  G.chips(ctx, c.roof[0], c.roof[2], c.roof[1] - c.roof[0], c.seed + 9, G.DIRT);
  G.chips(ctx, 0, c.belt, w, c.seed + 15, G.DIRT);
  for (const [i, [x, rr, kind]] of c.wheels.entries()) tyre(ctx, x, rr, kind, c.seed + 20 + i * 3);
  if (c.spare) {
    ctx.save();
    ctx.translate(0, c.spare[1] + c.spare[2]);
    tyre(ctx, c.spare[0], c.spare[2], "tyre", c.seed + 60);
    ctx.restore();
  }
  return body;
};

const windowSpan = (g: Pt[]): [number, number, number] => {
  const gx = g.map((p) => p[0]);
  return [min(...gx), max(...gx), max(...g.map((p) => p[1]))];
};

const overgrow = (ctx: Ctx, c: Wreck, body: Pt[]): void => {
  const r = rng(c.seed + 40);
  const w = max(...c.top.map((p) => p[0]));
  const [x0, x1, ry] = c.roof;
  for (const [i, g] of c.glass.entries()) {
    const [g0, g1, gb] = windowSpan(g);
    clipped(ctx, g, () => leafBlob(ctx, (g0 + g1) / 2, gb, (g1 - g0) * 0.5, 5, c.seed + 80 + i, LEAF_DARK));
  }
  mossCap(ctx, x0, ry, x1 - x0, c.seed + 41, 2.4);
  for (const [i, [mx, my, mw, md]] of c.moss.entries()) mossCap(ctx, mx, my, mw, c.seed + 42 + i, md);
  clipped(ctx, body, () => {
    for (let x = 2; x < w - 4; x += 8 + r() * 8) mossCap(ctx, x, c.base - 4.6, 4 + r() * 6, c.seed + 90 + round(x), 1.4);
  });
  for (const [i, [vx, vy, len]] of c.vines.entries()) vine(ctx, vx, vy, len, c.seed + 60 + i);
  for (const [i, [lx, ly, rx, rr]] of c.leaves.entries()) leafBlob(ctx, lx, ly, rx, rr, c.seed + 100 + i * 7, i % 2 ? HEDGE : LEAF);
  for (const [i, g] of c.glass.entries()) {
    const [g0, g1, gb] = windowSpan(g);
    frond(ctx, (g0 + g1) / 2, gb - 1, 9, -PI / 2 + (i ? 0.7 : -0.7), c.seed + 110 + i, LEAF);
  }
  for (const [i, [fx, fh]] of c.ferns.entries()) {
    ctx.save();
    ctx.translate(fx, 0);
    fern(ctx, 0, fh, c.seed + 120 + i * 5, i % 2 ? LEAF : HEDGE);
    ctx.restore();
  }
  grass(ctx, -4, w + 8, 4, c.seed + 130);
};

const overgrownWreck: EnvAsset = {
  id: "overgrownWreck",
  box: [-12, -62, 118, 2],
  draw(ctx, state) {
    const c = WRECKS[state] ?? (WRECKS[0] as Wreck);
    const w = max(...c.top.map((p) => p[0]));
    ctx.save();
    ctx.globalAlpha = 0.45;
    flat(ctx, -2, -2, w + 4, 2, HOLE);
    ctx.restore();
    overgrow(ctx, c, wreckBody(ctx, c));
  },
};

const berryBush = (ctx: Ctx, seed: number): void => {
  const r = rng(seed);
  for (const [sx, a] of [[16, -1.9], [24, -1.6], [32, -1.3]] as Pt[]) line(ctx, [[sx + 4, 0], [sx + 4 + cos(a) * 14, sin(a) * 14]], WOOD[1], 1);
  leafBlob(ctx, 24, -14, 18, 12, seed, BERRY);
  leafBlob(ctx, 14, -8, 10, 7, seed + 1, BERRY);
  leafBlob(ctx, 34, -9, 11, 8, seed + 2, BERRY);
  const n = simple() ? 4 : 9;
  for (let i = 0; i < n; i++) {
    const bx = 10 + r() * 28;
    const by = -6 - r() * 16;
    disc(ctx, bx, by, simple() ? 1.4 : 1.1, "#8c1c10", "#2a0804");
    if (!simple()) flat(ctx, bx - 0.5, by - 0.6, 0.6, 0.6, "#d86a4a");
  }
};

const broadLeaf = (ctx: Ctx, x: number, len: number, a: number, seed: number, tones: readonly string[], slim = 0.3): void => {
  const nx = -sin(a);
  const ny = cos(a);
  const bend = (k: number): number => len * 0.12 * k * k;
  const at = (k: number, s: number): Pt => [
    x + cos(a) * len * k + nx * (len * slim * s * sin(PI * min(1, k * 1.15)) + bend(k)),
    sin(a) * len * k + ny * (len * slim * s * sin(PI * min(1, k * 1.15)) + bend(k)) + bend(k),
  ];
  const n = simple() ? 5 : 9;
  const side = (s: number): Pt[] => Array.from({ length: n + 1 }, (_, i) => at(i / n, s));
  const upper = side(1);
  const pts = [...upper, ...side(-1).reverse()];
  shape(ctx, pts, tones[seed % 2 ? 1 : 2] as string, tones[0] as string);
  if (!simple()) {
    clipped(ctx, pts, () => shape(ctx, [...upper, ...side(0).reverse()], tones[3] as string));
    curve(ctx, side(0), tones[0] as string, 0.6);
  }
};

const fernBush: EnvAsset = {
  id: "fernBush",
  box: [-4, -38, 52, 1],
  draw(ctx, state) {
    const seed = 7600 + state * 17;
    if (state === 1) return berryBush(ctx, seed);
    if (state === 2) {
      const leaves: [number, number, number][] = [[22, 26, -2.2], [26, 30, -1.7], [24, 28, -1.2], [20, 18, -2.7], [28, 20, -0.5]];
      leaves.forEach(([x, len, a], i) => broadLeaf(ctx, x, len, a, seed + i, LEAF_DARK));
      grass(ctx, 12, 24, 5, seed + 9);
      return;
    }
    const r = rng(seed);
    leafBlob(ctx, 22, -4, 16, 4, seed + 1, LEAF);
    if (simple()) for (let i = 0; i < 7; i++) broadLeaf(ctx, 22 + (r() - 0.5) * 6, 22 + r() * 10, -PI / 2 + (i / 6 - 0.5) * 2.4, seed + i, i % 2 ? LEAF : HEDGE, 0.12);
    ctx.save();
    ctx.translate(24, 0);
    fern(ctx, 0, 30, seed);
    ctx.restore();
    ctx.save();
    ctx.translate(10, 0);
    fern(ctx, 0, 16, seed + 3, HEDGE);
    ctx.restore();
    grass(ctx, 4, 40, 6, seed + 5);
  },
};

const log = (ctx: Ctx, x: number, y: number, len: number, rr: number, seed: number, cutLeft = false): void => {
  const r = rng(seed);
  const body = G.rectPts(x, y - rr * 2, len, rr * 2);
  shape(ctx, body, WOOD[2], WOOD[4]);
  bands(ctx, x, y - rr * 2, len, rr * 2, [[0, 0.22, WOOD[3]], [0.62, 0.86, WOOD[1]], [0.86, 1, WOOD[0]]]);
  if (!simple())
    for (let k = 0; k < 4; k++) {
      const ly = y - rr * 2 + rr * 2 * (0.2 + r() * 0.6);
      const lx = x + r() * len * 0.5;
      line(ctx, [[lx, ly], [lx + len * (0.2 + r() * 0.3), ly + (r() - 0.5)]], WOOD[1], 0.6);
    }
  G.grain(ctx, G.rectRegion(ctx, x, y - rr * 2, len, rr * 2), seed + 1, 0.8);
  within(ctx, [[x, y - rr * 2, len, rr * 2]], () => G.dirt(ctx, x, y - rr * 2, len, rr * 2, seed + 2, 0.4));
  if (cutLeft) oval(ctx, x, y - rr, rr * 0.4, rr, WOOD[1], WOOD[4]);
  const ex = x + len;
  oval(ctx, ex, y - rr, rr * 0.45, rr, CUT[0], WOOD[4]);
  oval(ctx, ex + 0.3, y - rr, rr * 0.36, rr * 0.82, CUT[1]);
  if (!simple()) {
    for (const k of [0.6, 0.35]) {
      ctx.beginPath();
      ctx.ellipse(ex + 0.3, y - rr, rr * 0.36 * k, rr * 0.82 * k, 0, 0, PI * 2);
      ctx.strokeStyle = color(CUT[0]);
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    line(ctx, [[ex + 0.3, y - rr], [ex + 0.3 + rr * 0.2, y - rr * 0.3]], CUT[0], 0.5);
  }
  G.inside(
    ctx,
    () => {
      ctx.beginPath();
      ctx.ellipse(ex + 0.3, y - rr, rr * 0.36, rr * 0.82, 0, 0, PI * 2);
    },
    () => G.dirt(ctx, ex - rr, y - rr * 2, rr * 2, rr * 2, seed + 3, 0.4),
  );
};

const logPile: EnvAsset = {
  id: "logPile",
  box: [-2, -32, 62, 1],
  draw(ctx, state) {
    const seed = 7700 + state * 11;
    if (state === 1) {
      log(ctx, 2, 0, 50, 6, seed, true);
      line(ctx, [[20, -11], [16, -17], [12, -19]], WOOD[4], 2.6);
      line(ctx, [[20, -11], [16, -17], [12, -19]], WOOD[2], 1.6);
      mossCap(ctx, 6, -12, 24, seed + 4, 2);
      if (!simple()) {
        ctx.save();
        ctx.translate(40, -11);
        fern(ctx, 0, 9, seed + 6, HEDGE);
        ctx.restore();
      }
      grass(ctx, 0, 56, 4, seed + 7);
      return;
    }
    log(ctx, 2, 0, 46, 5.5, seed, true);
    log(ctx, 6, 0, 46, 5.5, seed + 10);
    log(ctx, 4, -11, 44, 5.5, seed + 20, true);
    log(ctx, 9, -22, 36, 5, seed + 30);
    mossCap(ctx, 10, -32, 22, seed + 40, 2.2);
    mossCap(ctx, 4, -22, 12, seed + 41, 1.6);
    grass(ctx, 0, 60, 4, seed + 42);
  },
};

const drum = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number): void => {
  const r = rng(seed);
  const body = G.rectPts(x, y, w, h);
  shape(ctx, body, DRUM[2], DRUM[4]);
  flat(ctx, x, y, w * 0.25, h, DRUM[3]);
  flat(ctx, x + w * 0.72, y, w * 0.28, h, DRUM[1]);
  for (const k of [0.3, 0.68]) {
    flat(ctx, x - 0.5, y + h * k - 1, w + 1, 2.2, DRUM[1], DRUM[4]);
    if (!simple()) flat(ctx, x - 0.5, y + h * k - 1, w + 1, 0.7, DRUM[3]);
  }
  flat(ctx, x - 0.8, y - 1.6, w + 1.6, 2.4, DRUM[3], DRUM[4]);
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed, 0.9);
  within(ctx, [[x, y, w, h]], () => {
    G.drips(ctx, x, y + 1, w, h * 0.6, seed + 1, 3);
    G.rustPatch(ctx, x + w * (0.3 + r() * 0.4), y + h * 0.82, 3.4, 1.8, seed + 2);
    G.dirt(ctx, x, y, w, h, seed + 3, 0.45);
  });
  G.chips(ctx, x - 0.8, y - 1.6, w + 1.6, seed + 4, G.DIRT);
};

const oilDrum: EnvAsset = {
  id: "oilDrum",
  box: [-2, -30, 46, 2],
  draw(ctx, state) {
    const seed = 7800 + state * 7;
    if (state === 1) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      shape(ctx, blobPts(32, -0.4, 13, 2.6, seed + 20, 10, 0.3), "#0a0806");
      ctx.restore();
      if (!simple()) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        flat(ctx, 28, -2, 12, 0.7, "#4c4c58");
        ctx.restore();
      }
      const h = 17;
      oval(ctx, 2, -h / 2, 3.8, h / 2, DRUM[1], DRUM[4]);
      const body = G.rectPts(2, -h, 24, h);
      shape(ctx, body, DRUM[2], DRUM[4]);
      bands(ctx, 2, -h, 24, h, [[0, 0.24, DRUM[3]], [0.7, 1, DRUM[1]]]);
      for (const k of [8, 17]) {
        shape(ctx, [[1.5 + k, -h - 0.6], [3 + k, -h - 0.6], [3.6 + k, -h / 2], [3 + k, 0.4], [1.5 + k, 0.4], [2.1 + k, -h / 2]], DRUM[1], DRUM[4]);
        if (!simple()) line(ctx, [[2.3 + k, -h], [2.8 + k, -h / 2]], DRUM[3], 0.5);
      }
      G.grain(ctx, G.rectRegion(ctx, 2, -h, 24, h), seed, 0.9);
      within(ctx, [[2, -h, 24, h]], () => {
        G.rustPatch(ctx, 12, -4, 4, 2, seed + 1);
        G.dirt(ctx, 2, -h, 24, h, seed + 2, 0.5);
      });
      oval(ctx, 26, -h / 2, 3.8, h / 2, DRUM[3], DRUM[4]);
      oval(ctx, 26.4, -h / 2, 2.6, h / 2 - 1.6, DRUM[1]);
      disc(ctx, 26.8, -h / 2 + 3, 1.2, HOLE);
      line(ctx, [[27.4, -h / 2 + 4], [28.6, -1]], "#0a0806", 1.8);
      mossCap(ctx, 4, -h, 14, seed + 3, 2);
      return;
    }
    drum(ctx, 2, -25, 17, 25, seed);
    mossCap(ctx, 2, -26.6, 12, seed + 5, 2.4);
    if (!simple()) vine(ctx, 16, -25, 14, seed + 6);
    grass(ctx, 0, 22, 4, seed + 7);
  },
};

const rockVent: EnvAsset = {
  id: "rockVent",
  box: [-2, -38, 50, 0],
  draw(ctx, state) {
    const seed = 7900 + state * 5;
    const cx = 24;
    const cy = -16;
    const rx = 20;
    const ry = 12;
    shape(ctx, blobPts(cx, cy, rx + 4, ry + 4, seed, 14, 0.12), "#141410");
    oval(ctx, cx, cy, rx, ry, VENT[2], VENT[4]);
    oval(ctx, cx, cy - 0.8, rx - 1.4, ry - 1.6, VENT[3]);
    oval(ctx, cx, cy + 0.4, rx - 2, ry - 2.2, VENT[1]);
    const irx = rx - 3.4;
    const iry = ry - 3.4;
    oval(ctx, cx, cy, irx, iry, HOLE, VENT[4]);
    const inner = (): void => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, irx, iry, 0, 0, PI * 2);
    };
    G.inside(ctx, inner, () => {
      if (state === 1) {
        flat(ctx, cx - irx, cy + iry - 3, irx * 2, 3, "#2a1a0c");
        ctx.save();
        ctx.translate(cx - 6, cy - iry + 4);
        ctx.rotate(0.55);
        flat(ctx, 0, 0, 18, 2.2, VENT[2], VENT[4]);
        flat(ctx, 0, 0, 18, 0.7, VENT[3]);
        ctx.restore();
        flat(ctx, cx - irx, cy - iry + 2, 7, 2.2, VENT[2], VENT[4]);
        return;
      }
      for (let y = cy - iry + 1.6; y < cy + iry; y += 3.2) {
        flat(ctx, cx - irx, y, irx * 2, 2.2, "#3c5454", VENT[4]);
        if (!simple()) flat(ctx, cx - irx, y, irx * 2, 0.6, "#7c9c9c");
      }
      flat(ctx, cx - 1, cy - iry, 2, iry * 2, VENT[1]);
    });
    if (!simple())
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * PI * 2;
        disc(ctx, cx + cos(a) * (rx - 1.6), cy + sin(a) * (ry - 1.4), 0.6, VENT[0]);
      }
    for (const sx of [-1, 1]) flat(ctx, cx + sx * (rx - 1) - 2, cy - 2, 4, 4, VENT[1], VENT[4]);
    const rimRegion = (): void => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
      ctx.ellipse(cx, cy, irx, iry, 0, 0, PI * 2);
    };
    G.inside(
      ctx,
      () => {
        rimRegion();
        ctx.clip("evenodd");
        ctx.beginPath();
        ctx.rect(cx - rx, cy - ry, rx * 2, ry * 2);
      },
      () => {
        G.grain(ctx, G.rectRegion(ctx, cx - rx, cy - ry, rx * 2, ry * 2), seed + 1);
        G.rustPatch(ctx, cx + rx * 0.6, cy + ry * 0.7, 4, 1.6, seed + 2);
        G.rustPatch(ctx, cx - rx * 0.7, cy - ry * 0.5, 2.4, 1.6, seed + 3);
        if (state === 1) G.rustPatch(ctx, cx, cy + ry * 0.85, 6, 1.6, seed + 4);
      },
    );
    G.drips(ctx, cx - rx * 0.6, cy + ry - 1, rx * 1.2, 12, seed + 5, state === 1 ? 4 : 2);
  },
};

const energySign: EnvAsset = {
  id: "energySign",
  box: [-2, -32, 26, 0],
  draw(ctx, state) {
    const seed = 8000 + state * 3;
    const lit = state === 0;
    const cx = 12;
    const cy = -20;
    const rr = 10;
    flat(ctx, 10, -10, 4, 10, VENT[1], VENT[4]);
    flat(ctx, 6, -2, 12, 2, VENT[2], VENT[4]);
    G.drips(ctx, 10, -9, 4, 8, seed, 1);
    const oct = Array.from({ length: 8 }, (_, i) => {
      const a = PI / 8 + (i * PI) / 4;
      return [cx + cos(a) * rr, cy + sin(a) * rr] as Pt;
    });
    if (lit && !simple()) glow(ctx, cx, cy, 16, SIGN[3], 0.3);
    shape(ctx, oct, lit ? SIGN[2] : "#9c8a44", SIGN[4]);
    const inner = oct.map(([x, y]) => [cx + (x - cx) * 0.8, cy + (y - cy) * 0.8] as Pt);
    shape(ctx, inner, lit ? SIGN[1] : "#7c6c34");
    if (!simple()) clipped(ctx, inner, () => flat(ctx, cx - rr, cy - rr, rr * 2, rr * 0.5, lit ? SIGN[3] : "#a8985c"));
    const ink = lit ? "#120e04" : "#2a2410";
    flat(ctx, cx - 4, cy - 5, 2.4, 10, ink);
    for (const [dy, w] of [[-5, 8], [-1.1, 6], [2.6, 8]] as Pt[]) flat(ctx, cx - 4, cy + dy, w, 2.4, ink);
    G.inside(ctx, G.polyRegion(ctx, oct), () => {
      G.grain(ctx, G.polyRegion(ctx, oct), seed + 1, lit ? 0.5 : 1);
      G.rustPatch(ctx, cx + rr * 0.6, cy + rr * 0.6, 2.4, 1.6, seed + 2);
      if (!lit) {
        G.rustPatch(ctx, cx - rr * 0.6, cy - rr * 0.5, 2.6, 2, seed + 3);
        G.dirt(ctx, cx - rr, cy - rr, rr * 2, rr * 2, seed + 4, 0.5);
      }
    });
    path(ctx, oct);
    stroke(ctx, SIGN[4]);
    G.chips(ctx, cx - rr * 0.4, cy - rr * 0.92, rr * 0.8, seed + 5, G.DIRT);
  },
};

export const jungleClutterAssets: EnvAsset[] = [chemTank, excavator, caveCapsule, rustBoiler, helicopterWreck, overgrownWreck, fernBush, logPile, oilDrum, rockVent, energySign];
