import { G } from "./grime";
import { CLINE, LEAF, SLINE, blobPts, fern, grass, leafBlob, mossCap, simple, vine, type Ctx, type Pt } from "./jungle";
import { P, type EnvAsset } from "./paint";

const { rng, path, flat, shape, line, curve, disc, stroke } = P;
const { PI, sin, min, max, round, floor, hypot, atan2, abs } = Math;

type Rect = [number, number, number, number];
type Shade = readonly string[];

const CONC = ["#2a3228", "#3c483c", "#545448", "#606054", "#76766a"] as const;
const ROOF = ["#1e140c", "#36241a", "#483024", "#64442e"] as const;
const GLASS = "#000c0c";
const BARS = "#c8ccc4";
const STEEL = ["#1c2424", "#303c3c", "#546060", "#748080", "#a8b4b4"] as const;
const IRON = ["#241c0e", "#483c24", "#604824", "#6c6030", "#8c7c48"] as const;
const BRACE = ["#341c0c", "#6c3c18", "#8c5428"] as const;
const TEAL = ["#0a241e", "#18483c", "#2a6458", "#3c8478"] as const;
const BRASS = ["#3a2610", "#6c4c28", "#9c6c3c", "#e4c048"] as const;
const POST = ["#141c1a", "#243030", "#3c483c", "#546060"] as const;
const ROCK = ["#303024", "#5a5246", "#786c60", "#84786c", "#9c9884"] as const;
const CAVE = ["#121a10", "#1e2a1c", "#30402c", "#435440", "#566a50"] as const;
const GAP = "#242424";
const WOOD = ["#18180c", "#483018", "#604824", "#7c6034"] as const;
const CUT = ["#5c4a30", "#9c846c", "#b8a47c"] as const;
const BEAD = ["#241a0c", "#a8641c", "#e8b040"] as const;
const PLATE = ["#2a2010", "#3c3018", "#54442a"] as const;

const rectPts = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

const barPts = ([ax, ay]: Pt, [bx, by]: Pt, w: number): Pt[] => {
  const l = hypot(bx - ax, by - ay) || 1;
  const nx = ((-(by - ay) / l) * w) / 2;
  const ny = (((bx - ax) / l) * w) / 2;
  return [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]];
};

const bar = (ctx: Ctx, a: Pt, b: Pt, w: number, T: Shade): void => {
  line(ctx, [a, b], CLINE, w + 1, "butt");
  line(ctx, [a, b], T[1] as string, w, "butt");
  if (!simple()) line(ctx, [[a[0], a[1] - w * 0.2], [b[0], b[1] - w * 0.2]], T[2] as string, w * 0.35, "butt");
};

const rail = (ctx: Ctx, pts: Pt[], w: number, T: Shade): void => {
  line(ctx, pts, T[0] as string, w + 1, "butt");
  line(ctx, pts, T[2] as string, w, "butt");
  if (!simple()) line(ctx, pts.map(([x, y]) => [x, y - w * 0.25] as Pt), T[3] as string, w * 0.3, "butt");
};

const rock = (ctx: Ctx, cx: number, cy: number, rx: number, ry: number, seed: number, T: Shade = ROCK): Pt[] => {
  const pts = blobPts(cx, cy, rx, ry, seed, 10, 0.14);
  shape(ctx, pts, T[1] as string);
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  shape(ctx, blobPts(cx - rx * 0.1, cy - ry * 0.14, rx * 0.86, ry * 0.74, seed + 1, 9, 0.16), T[2] as string);
  shape(ctx, blobPts(cx - rx * 0.28, cy - ry * 0.38, rx * 0.52, ry * 0.36, seed + 2, 8, 0.2), T[3] as string);
  if (!simple()) shape(ctx, blobPts(cx - rx * 0.4, cy - ry * 0.56, rx * 0.24, ry * 0.14, seed + 3, 6, 0.2), T[4] as string);
  flat(ctx, cx - rx * 1.2, cy + ry * 0.58, rx * 2.4, ry, T[0] as string);
  ctx.restore();
  path(ctx, pts);
  stroke(ctx, SLINE);
  return pts;
};

const flatStone = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number, T: Shade = ROCK): Pt[] => {
  const r = rng(seed);
  const c = min(8, h * 0.3, w * 0.2);
  const pts: Pt[] = [[x + c, y + r()], [x + w * 0.5, y], [x + w - c - r() * 2, y + r()], [x + w, y + c + r() * 2], [x + w - r(), y + h - c], [x + w - c, y + h], [x + c + r() * 2, y + h - r()], [x, y + h - c], [x + r(), y + c]];
  shape(ctx, pts, T[2] as string);
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  flat(ctx, x - 2, y - 2, w + 4, h * 0.38, T[3] as string);
  if (!simple()) {
    flat(ctx, x - 2, y - 2, w * 0.45, 3.4, T[4] as string);
    const cx = x + w * (0.25 + r() * 0.5);
    line(ctx, [[cx, y + h * 0.3], [cx + (r() - 0.5) * 5, y + h * 0.65], [cx + (r() - 0.5) * 6, y + h]], T[0] as string, 0.7);
  }
  flat(ctx, x - 2, y + h * 0.66, w + 4, h * 0.4, T[1] as string);
  flat(ctx, x - 2, y + h * 0.88, w + 4, h * 0.2, T[0] as string);
  ctx.restore();
  path(ctx, pts);
  stroke(ctx, SLINE);
  return pts;
};

const beads = (ctx: Ctx, x: number, y: number, w: number): void => {
  flat(ctx, x, y, w, 2.6, BEAD[0]);
  for (let bx = x + 1.5; bx < x + w - 0.8; bx += 3) {
    flat(ctx, bx - 0.9, y + 0.4, 1.8, 1.8, BEAD[1]);
    if (!simple()) flat(ctx, bx - 0.9, y + 0.4, 0.9, 0.9, BEAD[2]);
  }
};

const ledge = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number, T: Shade = ROCK): Pt[] => {
  const r = rng(seed);
  const pts: Pt[] = [[x + 1, y], [x + w - 2, y + r() * 0.6], [x + w, y + 2.4], [x + w - 2 - r() * 3, y + h * 0.7], [x + w - 7 - r() * 4, y + h], [x + w * 0.55, y + h - 1 - r() * 2], [x + w * 0.3, y + h], [x + 4 + r() * 3, y + h - r() * 2], [x, y + h * 0.45], [x - 0.6, y + 2]];
  shape(ctx, pts, T[2] as string);
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  flat(ctx, x - 2, y, w + 4, h * 0.3, T[3] as string);
  if (!simple()) {
    flat(ctx, x - 2, y + 3, w + 4, 1.1, T[4] as string);
    for (let k = 0; k < max(1, round(w / 24)); k++) {
      const cx = x + w * (0.1 + r() * 0.8);
      line(ctx, [[cx, y + h * 0.35], [cx + (r() - 0.5) * 5, y + h * (0.65 + r() * 0.3)]], T[0] as string, 0.7);
    }
  }
  flat(ctx, x - 2, y + h * 0.6, w + 4, h * 0.42, T[1] as string);
  flat(ctx, x - 2, y + h * 0.84, w + 4, h * 0.3, T[0] as string);
  ctx.restore();
  path(ctx, pts);
  stroke(ctx, SLINE);
  beads(ctx, x + 1, y - 0.4, w - 3);
  return pts;
};

const log = (ctx: Ctx, x: number, y: number, len: number, rad: number, angle: number, seed: number, cutEnd = true): void => {
  const r = rng(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const end: Pt[] = [];
  for (let k = 0; k <= 6; k++) end.push([len + (k % 2 ? -2 - r() * 3 : r() * 1.5), -rad + (k / 6) * rad * 2]);
  const body: Pt[] = [[0, -rad], ...end, [0, rad]];
  shape(ctx, body, WOOD[2]);
  ctx.save();
  path(ctx, body);
  ctx.clip();
  flat(ctx, -1, -rad, len + 4, rad * 0.55, WOOD[3]);
  flat(ctx, -1, rad * 0.25, len + 4, rad, WOOD[1]);
  flat(ctx, -1, rad * 0.7, len + 4, rad, WOOD[0]);
  if (!simple()) {
    for (let k = -0.6; k <= 0.6; k += 0.4) {
      const pts: Pt[] = [];
      for (let px = 2; px < len; px += 4 + r() * 3) pts.push([px, rad * k + (r() - 0.5) * 0.8]);
      if (pts.length > 1) line(ctx, pts, WOOD[0], 0.5);
    }
  }
  ctx.restore();
  path(ctx, body);
  stroke(ctx, SLINE);
  if (!simple()) line(ctx, end.slice(1, -1).map(([px, py]) => [px - 0.6, py] as Pt), CUT[1], 0.7);
  if (cutEnd) {
    ctx.save();
    ctx.scale(0.42, 1);
    disc(ctx, 0, 0, rad, CUT[1], SLINE);
    if (!simple()) {
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = CUT[0];
      for (const k of [0.65, 0.35]) {
        ctx.beginPath();
        ctx.arc(0, 0, rad * k, 0, PI * 2);
        ctx.stroke();
      }
      disc(ctx, -rad * 0.3, -rad * 0.3, rad * 0.25, CUT[2]);
    }
    ctx.restore();
  }
  ctx.restore();
};

const roofEdge = (ctx: Ctx, x: number, y: number, w: number, seed: number): void => {
  flat(ctx, x - 2, y - 6, w + 4, 6, ROOF[2], CLINE);
  if (!simple()) for (let px = x - 1; px < x + w + 1; px += 2) flat(ctx, px, y - 4.8, 0.7, 4.2, ROOF[1]);
  flat(ctx, x - 2, y - 6, w + 4, 1.2, ROOF[3]);
  flat(ctx, x, y, w, 1.6, CONC[0]);
  G.grain(ctx, G.rectRegion(ctx, x - 2, y - 6, w + 4, 6), seed, 0.7);
  G.chips(ctx, x - 2, y - 5.6, w + 4, seed + 1, G.DIRT);
};

const barredPane = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number): Pt[] => {
  const r = rng(seed);
  flat(ctx, x - 3, y - 3, w + 6, h + 6, STEEL[1], CLINE);
  flat(ctx, x - 1.6, y - 1.6, w + 3.2, h + 3.2, STEEL[3]);
  flat(ctx, x, y, w, h, GLASS);
  if (!simple()) {
    shape(ctx, [[x, y + h * 0.7], [x + w * 0.55, y], [x + w * 0.8, y], [x, y + h]], "#0c2424");
    for (let i = 0; i < 3; i++) flat(ctx, x + r() * (w - 4), y + r() * (h - 3), 3, 1.6, "#1e3c3c");
  }
  for (let k = 1; k < 4; k++) {
    const bx = x + (w * k) / 4;
    flat(ctx, bx - 0.6, y, 1.2, h, BARS);
    if (!simple()) flat(ctx, bx + 0.6, y, 0.6, h, "#5c6460");
  }
  for (let k = 1; k < 3; k++) flat(ctx, x, y + (h * k) / 3 - 0.6, w, 1.2, BARS);
  flat(ctx, x - 4, y + h + 3, w + 8, 2.2, CONC[4], CLINE);
  for (const [ly, lw] of [[y + 1, 12], [y + h * 0.55, 16]] as Pt[]) {
    flat(ctx, x + w + 3, ly, lw, 1.4, STEEL[4]);
    flat(ctx, x + w + 3, ly + 1.4, lw, 1, CONC[0]);
  }
  return rectPts(x - 3, y - 3, w + 6, h + 6);
};

const steelDoor = (ctx: Ctx, x: number, h: number): Pt[] => {
  flat(ctx, x - 3, -h - 3, 32, h + 3, CONC[0], CLINE);
  flat(ctx, x, -h, 26, h, STEEL[2], CLINE);
  flat(ctx, x, -h, 3, h, STEEL[3]);
  flat(ctx, x + 22, -h, 4, h, STEEL[1]);
  flat(ctx, x + 3, -h + 4, 19, h * 0.42, STEEL[1], CLINE);
  flat(ctx, x + 3, -h * 0.5, 19, h * 0.5 - 6, STEEL[1], CLINE);
  flat(ctx, x + 18, -h * 0.52, 5, 2.4, STEEL[4], CLINE);
  P.hazard(ctx, x, -5, 26, 4, 3);
  if (!simple()) {
    G.rustPatch(ctx, x + 8, -14, 4, 2.5, 640 + round(h));
    G.drips(ctx, x, -h, 26, h * 0.5, 641 + round(h), 3);
  }
  return rectPts(x - 3, -h - 3, 32, h + 3);
};

const shellHole = (ctx: Ctx, cx: number, cy: number, rx: number, ry: number, seed: number): Pt[] => {
  const pts = blobPts(cx, cy, rx, ry, seed, 14, 0.3);
  G.scorch(ctx, pts, seed + 1);
  shape(ctx, pts, "#060807");
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  flat(ctx, cx - rx * 1.4, cy + ry * 0.35, rx * 2.8, ry, "#141812");
  if (!simple()) {
    const r = rng(seed + 2);
    for (let k = 0; k < 4; k++) {
      const y = cy - ry * 0.6 + k * ry * 0.4;
      line(ctx, [[cx - rx * 1.1, y + (r() - 0.5) * 3], [cx - rx * (0.1 + r() * 0.5), y + r() * 4]], BRACE[1], 0.9);
      line(ctx, [[cx + rx * 1.1, y + (r() - 0.5) * 3], [cx + rx * (0.2 + r() * 0.5), y + r() * 5]], BRACE[1], 0.9);
    }
  }
  ctx.restore();
  G.rim(ctx, pts, seed + 3, CONC[4], CONC[0]);
  return pts;
};

const block = (ctx: Ctx, x: number, y: number, w: number, h: number, seed: number, { door = false, hole = false, vent = false } = {}): void => {
  const r = rng(seed);
  const holes: Pt[][] = [];
  flat(ctx, x, y, w, h, CONC[2], CLINE);
  if (!simple()) for (let k = 0; k < round(w / 40); k++) flat(ctx, x + 14 + r() * (w - 28), y, 0.7, h, CONC[1]);
  const winH = min(26, h - 32);
  const band = y + 12 + winH + 6;
  flat(ctx, x, band, w, 4, CONC[1]);
  flat(ctx, x, band + 4, w, 1, CONC[0]);
  flat(ctx, x, y + h - 5, w, 5, CONC[1]);
  for (const px of [x, x + w - 12]) {
    flat(ctx, px, y, 12, h, CONC[3], CLINE);
    if (!simple()) {
      flat(ctx, px + 1, y, 1.4, h, CONC[4]);
      flat(ctx, px + 10.6, y, 1.4, h, CONC[1]);
    }
  }
  const avail = w - 24;
  const n = max(1, floor((avail - 8) / 44));
  const gap = (avail - n * 28) / (n + 1);
  const panes: number[] = [];
  for (let i = 0; i < n; i++) panes.push(x + 12 + gap * (i + 1) + i * 28);
  const dh = min(h - 6, 50);
  if (door) holes.push(steelDoor(ctx, (panes.shift() as number) + 1, dh));
  const hit = hole ? (panes.splice(floor(panes.length / 2), 1)[0] ?? x + w / 2 - 14) : null;
  for (const px of panes) holes.push(barredPane(ctx, px, y + 12, 28, winH, seed + round(px)));
  G.inside(
    ctx,
    G.rectRegion(ctx, x, y, w, h),
    () => {
      G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed + 1);
      G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed + 2, 0.5);
      G.drips(ctx, x, y, w, h * 0.4, seed + 3, max(2, round(w / 28)));
      for (const px of panes) G.drips(ctx, px - 2, y + 17 + winH, 32, 18, seed + 4 + round(px), 2);
      G.dirt(ctx, x, y + h * 0.55, w, h * 0.45, seed + 5, 0.35);
      G.rustPatch(ctx, x + 20 + r() * (w - 40), band + 2, 4 + r() * 3, 1.6, seed + 6);
    },
    holes,
  );
  if (hit !== null) {
    const cx = hit + 14;
    const cy = y + h * 0.48;
    holes.push(shellHole(ctx, cx, cy, 19, min(16, h * 0.24), seed + 7));
    for (let k = 0; k < 5; k++) rock(ctx, cx - 18 + k * 9 + r() * 3, -3 - r() * 2, 4 + r() * 3, 3 + r() * 2, seed + 20 + k, CONC);
  }
  roofEdge(ctx, x, y, w, seed + 8);
  if (vent) {
    const vx = x + w * 0.66;
    line(ctx, [[vx + 11, y - 18], [vx + 11, y - 52]], STEEL[1], 1.6);
    for (const k of [0, 1]) line(ctx, [[vx + 6 - k * 2, y - 44 + k * 7], [vx + 16 + k * 2, y - 44 + k * 7]], STEEL[2], 0.9);
    disc(ctx, vx + 11, y - 53, 1.4, "#a8281c", CLINE);
    flat(ctx, vx, y - 18, 22, 12, STEEL[2], CLINE);
    flat(ctx, vx - 2, y - 20, 26, 3, STEEL[3], CLINE);
    for (let ly = y - 15; ly < y - 7; ly += 2.4) flat(ctx, vx + 2, ly, 18, 1.2, STEEL[0]);
    G.inside(ctx, G.rectRegion(ctx, vx, y - 18, 22, 12), () => {
      G.grain(ctx, G.rectRegion(ctx, vx, y - 18, 22, 12), seed + 9);
      G.drips(ctx, vx, y - 18, 22, 10, seed + 10, 2);
    });
  }
  mossCap(ctx, x - 2, y - 6, w * (0.25 + r() * 0.35), seed + 11, 3);
  if (!simple()) for (const vx of [5 + r() * 6, w - 9 - r() * 6]) vine(ctx, x + vx, y - 2, h * (0.3 + r() * 0.35), seed + round(vx));
};

const jungleBuilding: EnvAsset = {
  id: "jungleBuilding",
  box: [-4, -180, 196, 2],
  draw(ctx, state, _t, { w = 192, h = 120 }) {
    const seed = 5100 + state * 13 + round(w) + round(h);
    if (state === 3) {
      const lower = round(h * 0.55);
      const ux = round(w * 0.38);
      block(ctx, ux, -h, w - ux, h - lower, seed + 1);
      block(ctx, 0, -lower, w, lower, seed, { door: true });
      return;
    }
    block(ctx, 0, -h, w, h, seed, { door: state === 1, vent: state === 1, hole: state === 2 });
  },
};

const jungleTower: EnvAsset = {
  id: "jungleTower",
  box: [-4, -318, 52, 2],
  draw(ctx, _state, _t, { h = 312 }) {
    const seed = 5200 + round(h);
    const r = rng(seed);
    const top = -h;
    const n = max(1, round((h - 12) / 36));
    const sh = (h - 12) / n;
    const braces: Pt[][] = [];
    for (let i = 0; i < n; i++) {
      const y0 = top + 6 + i * sh;
      const y1 = y0 + sh;
      for (const [a, b] of [[[17, y0 + 2], [43, y1 - 2]], [[43, y0 + 2], [17, y1 - 2]]] as [Pt, Pt][]) {
        bar(ctx, a, b, 3.4, BRACE);
        braces.push(barPts(a, b, 3.4));
      }
      bar(ctx, [17, y0 + 1], [43, y0 + 1], 2.4, BRACE);
      braces.push(barPts([17, y0 + 1], [43, y0 + 1], 2.4));
      if (i % 2 === 0) {
        bar(ctx, [6, y0 + 10], [0, y0 + 18], 2.6, BRACE);
        braces.push(barPts([6, y0 + 10], [0, y0 + 18], 2.6));
      }
    }
    G.inside(ctx, G.polysRegion(ctx, braces), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, top, 48, h), seed + 1, 0.8);
      for (let y = top + 10; y < -10; y += 30 + r() * 30) G.rustPatch(ctx, 20 + r() * 20, y, 3, 2, seed + round(y));
    });
    flat(ctx, 42, top, 4, h, IRON[2], CLINE);
    if (!simple()) flat(ctx, 42, top, 1.2, h, IRON[4]);
    flat(ctx, 6, top, 12, h, IRON[2], CLINE);
    if (!simple()) {
      flat(ctx, 6, top, 2.4, h, IRON[4]);
      flat(ctx, 15.6, top, 2.4, h, IRON[0]);
    }
    flat(ctx, 10.6, top, 2.8, h, IRON[1]);
    for (let y = top + 4; y < -4; y += 24) {
      flat(ctx, 5, y, 14, 2.4, IRON[3], CLINE);
      if (!simple()) {
        for (const rx of [8, 16]) {
          disc(ctx, rx, y + 7, 0.9, IRON[4]);
          disc(ctx, rx + 0.4, y + 7.5, 0.5, IRON[0]);
        }
      }
    }
    for (let i = 0; i <= n; i++) {
      const y = top + 6 + i * sh;
      flat(ctx, 40, y - 3, 8, 6, IRON[1], CLINE);
      if (!simple()) disc(ctx, 44, y, 0.9, IRON[4]);
    }
    flat(ctx, 2, top - 4, 20, 4, IRON[3], CLINE);
    flat(ctx, 38, top - 3, 10, 3, IRON[3], CLINE);
    flat(ctx, 0, -6, 26, 6, IRON[1], CLINE);
    flat(ctx, 36, -5, 14, 5, IRON[1], CLINE);
    G.inside(ctx, G.rectsRegion(ctx, [[6, top, 12, h], [42, top, 4, h], [0, -6, 26, 6], [36, -5, 14, 5]]), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, top, 48, h), seed + 2);
      for (let y = top + 4; y < -4; y += 24) G.drips(ctx, 5, y + 2, 41, 20, seed + 3 + round(y - top), 3);
      G.rustPatch(ctx, 12, top + h * (0.3 + r() * 0.4), 3, 6, seed + 4);
      G.dirt(ctx, 0, top, 48, h, seed + 5, min(0.3, 40 / h));
    });
    G.chips(ctx, 2, top - 3.6, 20, seed + 6, G.DIRT);
  },
};

const stoneStack: EnvAsset = {
  id: "stoneStack",
  box: [-4, -126, 52, 2],
  draw(ctx, state, _t, { h = 120 }) {
    const n = state === 1 ? 5 : 3;
    const seed = 5300 + state * 7 + round(h);
    const r = rng(seed);
    const sh = (h - 4) / n;
    const stones: Pt[][] = [];
    let y = 0;
    for (let i = 0; i < n; i++) {
      const sw = 44 - (i * 10) / n + (r() - 0.5) * 4;
      const sx = 24 - sw / 2 + (r() - 0.5) * 7;
      const hh = i === n - 1 ? h - 4 + y : sh * (0.92 + r() * 0.16);
      if (n === 5 && i === 2) {
        const half = sw * (0.45 + r() * 0.1);
        stones.push(flatStone(ctx, sx, y - hh, half - 0.6, hh, seed + i * 13));
        stones.push(flatStone(ctx, sx + half + 0.6, y - hh, sw - half - 0.6, hh, seed + i * 13 + 5));
      } else {
        stones.push(flatStone(ctx, sx, y - hh, sw, hh, seed + i * 13));
      }
      if (i === 0) G.dirt(ctx, sx, y - hh, sw, hh, seed + 40, 0.4);
      y -= hh;
    }
    G.inside(ctx, G.polysRegion(ctx, stones), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -h, 48, h), seed + 1);
      G.drips(ctx, 4, -h + 6, 40, h * 0.6, seed + 2, 3, false);
    });
    const topX = ((stones[stones.length - 1] as Pt[])[0] as Pt)[0];
    mossCap(ctx, topX, y + 1, 26 + r() * 8, seed + 3, 3);
    if (!simple()) {
      mossCap(ctx, 6, -sh + 1.5, 12, seed + 4, 2);
      grass(ctx, 2, 10, 6, seed + 5);
      grass(ctx, 38, 9, 5, seed + 6);
    }
  },
};

const tealTube = (ctx: Ctx, x: number, y: number, w: number, h: number): void => {
  flat(ctx, x, y, w, h, TEAL[1], CLINE);
  flat(ctx, x, y + h * 0.12, w, h * 0.34, TEAL[2]);
  flat(ctx, x, y + h * 0.2, w, h * 0.14, TEAL[3]);
  flat(ctx, x, y + h * 0.72, w, h * 0.28, TEAL[0]);
};

const silverPipe = (ctx: Ctx, h: number, seed: number): void => {
  for (let y = -h + 12; y < -6; y += 24) {
    flat(ctx, 7, y - 1.5, 10, 3, STEEL[1], CLINE);
    flat(ctx, 4, y - 1, 3, 2, STEEL[0]);
  }
  flat(ctx, 10, -h, 4, h, STEEL[2], CLINE);
  flat(ctx, 10.6, -h, 1.2, h, STEEL[4]);
  flat(ctx, 12.8, -h, 1.2, h, STEEL[1]);
  flat(ctx, 7, -h - 1, 10, 3, STEEL[3], CLINE);
  flat(ctx, 7, -3, 10, 3, STEEL[3], CLINE);
  G.inside(ctx, G.rectRegion(ctx, 10, -h, 4, h), () => {
    G.grain(ctx, G.rectRegion(ctx, 10, -h, 4, h), seed, 0.6);
    G.drips(ctx, 10, -h, 4, h * 0.5, seed + 1, max(1, round(h / 30)));
    G.dirt(ctx, 10, -h, 4, h, seed + 2, min(0.4, 20 / h));
  });
};

const elbowPipe = (ctx: Ctx, w: number, seed: number): void => {
  const pts: Pt[] = [[0, -20], [w - 14, -20], [w - 8, -19], [w - 7, -14], [w - 7, 0]];
  curve(ctx, pts, CLINE, 5.6);
  curve(ctx, pts, TEAL[1], 4.4);
  if (!simple()) curve(ctx, pts.map(([x, y], i) => [x - (i > 2 ? 1 : 0), y - (i < 3 ? 1 : 0)] as Pt), TEAL[3], 1);
  for (let x = 12; x < w - 18; x += 24) {
    flat(ctx, x - 1.4, -23, 2.8, 6, STEEL[2], CLINE);
    flat(ctx, x - 0.4, -26, 0.8, 3, STEEL[1]);
  }
  flat(ctx, 0, -23.5, 2.4, 7, STEEL[3], CLINE);
  flat(ctx, w - 11, -3, 8, 3, STEEL[3], CLINE);
  G.inside(ctx, G.polysRegion(ctx, [rectPts(0, -22.2, w - 10, 4.4), rectPts(w - 9.2, -18, 4.4, 18)]), () => {
    G.grain(ctx, G.rectRegion(ctx, 0, -24, w, 24), seed, 0.7);
    G.drips(ctx, 0, -22, w - 8, 10, seed + 1, max(1, round(w / 30)));
    G.rustPatch(ctx, w - 7, -10, 1.8, 3, seed + 2);
  });
};

const coolantPipe: EnvAsset = {
  id: "coolantPipe",
  box: [-2, -50, 98, 2],
  draw(ctx, state, _t, { w = 96, h = 48 }) {
    const seed = 5400 + state * 11 + round(w) + round(h);
    if (state === 1) return silverPipe(ctx, h, seed);
    if (state === 2) return elbowPipe(ctx, w, seed);
    const r = rng(seed);
    const posts: number[] = [];
    for (let x = 12; x < w; x += 24) posts.push(x);
    for (const x of posts) {
      flat(ctx, x - 1, -24, 2, 24, STEEL[2], CLINE);
      if (!simple()) flat(ctx, x - 1, -24, 0.6, 24, STEEL[4]);
    }
    flat(ctx, 0, -4, w, 4, PLATE[1], CLINE);
    flat(ctx, 0, -4, w, 0.9, PLATE[2]);
    if (!simple()) for (const x of posts) flat(ctx, x - 4, -2.6, 1.2, 1.2, PLATE[2]);
    flat(ctx, 0, -9.5, w, 2, TEAL[2], CLINE);
    tealTube(ctx, 0, -18, w, 6.4);
    for (const x of posts) {
      flat(ctx, x - 1.8, -19, 3.6, 8.4, STEEL[1], CLINE);
      if (!simple()) flat(ctx, x - 1.8, -19, 1, 8.4, STEEL[3]);
    }
    for (const x of [0, w - 2.6]) flat(ctx, x, -19.5, 2.6, 9.4, STEEL[3], CLINE);
    G.inside(ctx, G.rectsRegion(ctx, [[0, -18, w, 6.4], [0, -9.5, w, 2], [0, -4, w, 4], ...posts.map((x): Rect => [x - 1, -24, 2, 24])]), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -24, w, 24), seed + 1, 0.8);
      G.drips(ctx, 0, -18, w, 14, seed + 2, max(2, round(w / 20)));
      G.rustPatch(ctx, posts[floor(r() * posts.length)] ?? w / 2, -14, 2.4, 1.4, seed + 3);
      G.dirt(ctx, 0, -10, w, 10, seed + 4, 0.6);
    });
  },
};

const stair = (ctx: Ctx, x: number, y: number, w: number, h: number): Pt[] => {
  flat(ctx, x, y, w, h, "#0c0c0a");
  const steps = max(3, round(h / 6));
  for (let k = 0; k < steps; k++) {
    const sx = x + 4 + (k * (w - 14)) / steps;
    const sy = y + h - 3 - (k * (h - 6)) / steps;
    flat(ctx, sx, sy, 10, 2, WOOD[3], SLINE);
  }
  line(ctx, [[x + 3, y + h], [x + w - 8, y + 4]], WOOD[1], 2.2);
  for (let k = 0; k <= 2; k++) {
    const px = x + 6 + (k * (w - 16)) / 2;
    const py = y + h - 4 - (k * (h - 8)) / 2;
    line(ctx, [[px, py], [px, py - 12]], WOOD[2], 1.2);
  }
  line(ctx, [[x + 6, y + h - 16], [x + w - 10, y - 4 + 8]], WOOD[3], 1.1);
  return rectPts(x, y, w, h);
};

const rockLedges: EnvAsset = {
  id: "rockLedges",
  box: [-6, -342, 246, 2],
  draw(ctx, state, _t, { w = 240, h = 336 }) {
    const seed = 5500 + state * 17 + round(w) + round(h);
    const r = rng(seed);
    const T = state === 2 ? CAVE : ROCK;
    const over = state === 1;
    const edge: [number, number, number][] = [];
    for (let y = -h; y <= 0.1; y += 24) {
      const k = (y + h) / h;
      const lx = (r() - 0.5) * 8 + (over ? w * 0.06 * k : 0);
      const rx = w - (r() - 0.5) * 8 - (over ? w * 0.32 * k : 0);
      edge.push([lx, rx, y]);
    }
    const outline: Pt[] = [...edge.map(([lx, , y]): Pt => [lx, y]).reverse(), ...edge.map(([, rx, y]): Pt => [rx, y])];
    shape(ctx, outline, state === 2 ? CAVE[0] : GAP);
    const holes: Pt[][] = [];
    ctx.save();
    path(ctx, outline);
    ctx.clip();
    if (state === 0) holes.push(stair(ctx, w * 0.22, -h + 108, 46, 40));
    const inHole = (x: number, y: number): boolean => holes.some((pts) => x > (pts[0] as Pt)[0] - 6 && x < (pts[1] as Pt)[0] + 6 && y > (pts[0] as Pt)[1] - 6 && y < (pts[2] as Pt)[1] + 6);
    const rows: number[] = [];
    for (let y = -h + 12; y < 10; y += 22) rows.push(y);
    rows.forEach((y, j) => {
      for (let x = r() * 12 - 6; x < w + 10; ) {
        const step = 16 + r() * 22;
        const cx = x + step / 2;
        x += step;
        if (r() < 0.18 || inHole(cx, y)) continue;
        rock(ctx, cx + (r() - 0.5) * 4, y + (r() - 0.5) * 8, step * (0.5 + r() * 0.12), 8 + r() * 6, seed + j * 97 + round(cx), T);
      }
    });
    ctx.restore();
    G.inside(
      ctx,
      G.polyRegion(ctx, outline),
      () => {
        G.grain(ctx, G.polyRegion(ctx, outline), seed + 2, 0.8);
        for (let y = -h + 24; y < 0; y += 48) G.dirt(ctx, 0, y, w, 24, seed + 3 + round(y + h), 0.5);
        G.drips(ctx, 0, -h, w, h * 0.3, seed + 4, round(w / 30), false);
      },
      holes,
    );
    const ledges: Pt[][] = [];
    for (let i = 0, y = -h + 2; y < -20; i++, y += 48) {
      const row = edge[min(edge.length - 1, round((y + h) / 24))] as [number, number, number];
      const span = row[1] - row[0];
      const lw = span * (0.4 + r() * 0.35);
      const lx = i % 2 ? row[1] - lw + (over ? 14 : 4) : row[0] - 4;
      ledges.push(ledge(ctx, lx, y, lw, 13 + r() * 4, seed + 60 + i, T));
      mossCap(ctx, lx + 3 + r() * lw * 0.3, y + 0.5, lw * (0.2 + r() * (state === 2 ? 0.5 : 0.3)), seed + 70 + i, state === 2 ? 3.5 : 2.4);
      if (!simple() && r() < 0.6) vine(ctx, lx + lw * (0.2 + r() * 0.6), y + 10, 14 + r() * 20, seed + 80 + i);
    }
    G.inside(ctx, G.polysRegion(ctx, ledges), () => G.grain(ctx, G.rectRegion(ctx, -6, -h, w + 12, h), seed + 5, 0.7));
    if (!simple()) {
      fern(ctx, (edge[edge.length - 1] as [number, number, number])[0] + 14, 14, seed + 6, state === 2 ? LEAF : undefined);
      leafBlob(ctx, w * 0.75, -h + 6, 14, 7, seed + 7);
    }
  },
};

const rockSlope: EnvAsset = {
  id: "rockSlope",
  box: [-6, -198, 222, 4],
  draw(ctx) {
    const seed = 5600;
    const r = rng(seed);
    const steps = 7;
    const slabs = Array.from({ length: steps }, (_, i): Rect => {
      const sw = 58 + r() * 16;
      const x = 216 - sw - i * 23 - r() * 4;
      const y = -192 + i * 27 + r() * 2;
      return [max(-2, x), y, sw, 15 + r() * 4];
    });
    const mass: Pt[] = [[216, -192], ...slabs.flatMap(([x, y, , sh]): Pt[] => [[x + 6, y + 4], [x + 3, y + sh + 8]]), [0, 0], [216, 0]];
    shape(ctx, mass, GAP);
    ctx.save();
    path(ctx, mass);
    ctx.clip();
    for (let y = -184, j = 0; y < 6; y += 19, j++) {
      for (let x = (j % 2) * 8 + 40; x < 226; x += 16 + r() * 6) {
        if (r() < 0.12) continue;
        rock(ctx, x, y + (r() - 0.5) * 4, 9 + r() * 4, 7 + r() * 3, seed + j * 53 + round(x));
      }
    }
    ctx.restore();
    G.inside(ctx, G.polyRegion(ctx, mass), () => {
      G.grain(ctx, G.polyRegion(ctx, mass), seed + 1, 0.8);
      G.dirt(ctx, 0, -96, 216, 96, seed + 2, 0.5);
    });
    const pts = slabs.map(([x, y, sw, sh], i) => {
      const p = ledge(ctx, x, y, sw, sh, seed + 10 + i);
      if (r() < 0.6) mossCap(ctx, x + 4 + r() * sw * 0.4, y + 0.5, sw * (0.2 + r() * 0.3), seed + 20 + i, 2.4);
      return p;
    });
    G.inside(ctx, G.polysRegion(ctx, pts), () => G.grain(ctx, G.rectRegion(ctx, -6, -198, 222, 198), seed + 3, 0.7));
    if (!simple()) {
      fern(ctx, 18, 12, seed + 4);
      grass(ctx, 30, 22, 5, seed + 5);
    }
  },
};

const rockDebris: EnvAsset = {
  id: "rockDebris",
  box: [-4, -76, 126, 2],
  draw(ctx, state, _t, { w = 120 }) {
    const seed = 5700 + state * 5 + round(w);
    const r = rng(seed);
    const stones: [number, number, number, number, number][] = [];
    const peak = (x: number): number => 16 + 34 * sin((PI * min(w, max(0, x))) / w);
    for (let j = 0; j < 4; j++) {
      for (let x = 6 + j * 4; x < w - 4; x += 11 + r() * 8) {
        const top = peak(x);
        const y = -top + j * (top / 4) + 6 + (r() - 0.5) * 4;
        if (y > -4 && j < 3) continue;
        stones.push([x + (r() - 0.5) * 4, min(-5, y), 6 + r() * 5 - j * 0.6, 5 + r() * 3, j]);
      }
    }
    stones.sort((a, b) => a[1] - b[1]);
    const mound: Pt[] = [[2, 0]];
    for (let x = 4; x < w - 2; x += 8) mound.push([x, -peak(x) * 0.78 + 6 + r() * 3]);
    mound.push([w - 2, 0]);
    shape(ctx, mound, "#221e16", SLINE);
    const half = floor(stones.length / 2);
    const drawn: Pt[][] = [];
    stones.forEach((s, i) => {
      if (state === 1 && i === half) {
        log(ctx, w * 0.14, -10, w * 0.4, 5, -0.32, seed + 1);
        log(ctx, w * 0.62, -26, w * 0.3, 4, 0.5, seed + 2);
      }
      drawn.push(rock(ctx, s[0], s[1], s[2], s[3], seed + 10 + i));
    });
    if (state === 1) log(ctx, w * 0.5, -5, w * 0.36, 4.4, 0.06, seed + 3);
    G.inside(ctx, G.polysRegion(ctx, drawn), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -76, w, 76), seed + 4, 0.8);
      G.dirt(ctx, 0, -40, w, 40, seed + 5, 0.6);
    });
    mossCap(ctx, w * 0.36, -peak(w * 0.45) + 2, w * 0.2, seed + 6, 2.5);
    if (!simple()) {
      grass(ctx, 0, w * 0.2, 6, seed + 7);
      grass(ctx, w * 0.78, w * 0.2, 5, seed + 8);
    }
  },
};

const deckRailing: EnvAsset = {
  id: "deckRailing",
  box: [-3, -28, 99, 1],
  draw(ctx, state, _t, { w = 96 }) {
    const seed = 5800 + state * 3 + round(w);
    const r = rng(seed);
    const bent = state === 1;
    const posts: number[] = [];
    for (let x = 0; x < w - 8; x += 48) posts.push(x);
    posts.push(w - 4);
    const sag = (x: number): number => (bent && x > w * 0.55 && x < w * 0.9 ? sin(((x - w * 0.55) / (w * 0.35)) * PI) * 8 : 0);
    const missing = bent ? round((w * 0.72) / 12) : -1;
    for (let k = 1; k * 12 < w - 4; k++) {
      const x = k * 12;
      if (k === missing || posts.some((p) => abs(p - x) < 6)) continue;
      const lean = bent && abs(k - missing) === 1 ? (k - missing) * 3 : 0;
      line(ctx, [[x, -8], [x + lean, -20 + sag(x)]], BRASS[0], 1.6, "butt");
      line(ctx, [[x, -8], [x + lean, -20 + sag(x)]], BRASS[3], 0.8, "butt");
    }
    const top: Pt[] = [];
    for (let x = 0; x <= w; x += 6) top.push([x, -23 + sag(x)]);
    (top[top.length - 1] as Pt)[0] = w;
    rail(ctx, top, 2.6, BRASS);
    rail(ctx, top.map(([x, y]) => [x, y + 3.6 - sag(x) * 0.4] as Pt), 1.6, BRASS);
    if (bent) {
      rail(ctx, [[0, -8], [w * 0.66, -8], [w * 0.7, -5]], 1.6, BRASS);
      rail(ctx, [[w * 0.77, -6], [w * 0.8, -8], [w, -8]], 1.6, BRASS);
    } else rail(ctx, [[0, -8], [w, -8]], 1.6, BRASS);
    for (const x of posts) {
      flat(ctx, x, -26, 4, 26, POST[1], CLINE);
      if (!simple()) flat(ctx, x + 0.6, -26, 1, 26, POST[3]);
      flat(ctx, x - 0.6, -27, 5.2, 2, POST[2], CLINE);
      const d = x < w - 8 ? 1 : -1;
      bar(ctx, [x + 2 + d * 2, -4], [x + 2 + d * 9, -14], 1.6, POST);
    }
    G.inside(ctx, G.rectsRegion(ctx, posts.map((x): Rect => [x, -26, 4, 26])), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -27, w, 27), seed + 1);
      for (const x of posts) G.drips(ctx, x, -24, 4, 16, seed + 2 + round(x), 1);
      G.dirt(ctx, 0, -12, w, 12, seed + 3, 0.6);
    });
    if (!simple()) {
      G.chips(ctx, 0, -23.8, w, seed + 4, G.DIRT);
      G.rustPatch(ctx, w * (0.2 + r() * 0.6), -22.6, 2.4, 0.8, seed + 5);
      if (bent) G.rustPatch(ctx, w * 0.72, -16, 2, 1, seed + 6);
    }
  },
};

const TRUNK_TOP: [Pt, Pt] = [[-12, -84], [-196, -148]];
const TRUNK_BOT: [Pt, Pt] = [[-18, -60], [-202, -132]];
const TRUNK: Pt[] = [TRUNK_TOP[0], TRUNK_TOP[1], TRUNK_BOT[1], TRUNK_BOT[0]];
const ROOT = blobPts(-2, -64, 26, 62, 761, 14, 0.2);

const lerp = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

const trunkAt = (u: number, v: number): Pt => lerp(lerp(TRUNK_TOP[0], TRUNK_TOP[1], u), lerp(TRUNK_BOT[0], TRUNK_BOT[1], u), v);

const trunkBand = (v0: number, v1: number): Pt[] => [trunkAt(0, v0), trunkAt(1, v0), trunkAt(1, v1), trunkAt(0, v1)];

const fallenTree: EnvAsset = {
  id: "fallenTree",
  box: [-220, -170, 34, 14],
  draw(ctx) {
    const seed = 760;
    const r = rng(seed);
    for (const [u, len, a] of [[0.38, 22, -1.9], [0.62, 16, -2.3], [0.84, 20, -1.6], [0.5, 12, 1.3]] as [number, number, number][]) {
      const [x, y] = trunkAt(u, a > 0 ? 0.9 : 0.15);
      log(ctx, x, y, len, 3.2 - len * 0.04, a, seed + round(u * 100));
    }
    shape(ctx, TRUNK, WOOD[2]);
    ctx.save();
    path(ctx, TRUNK);
    ctx.clip();
    shape(ctx, trunkBand(-0.1, 0.3), WOOD[3]);
    shape(ctx, trunkBand(0.62, 0.84), WOOD[1]);
    shape(ctx, trunkBand(0.84, 1.1), WOOD[0]);
    if (!simple()) {
      for (let k = 0; k < 9; k++) {
        const v = 0.08 + k * 0.1;
        let u = r() * 0.08;
        while (u < 1) {
          const u1 = min(1, u + 0.08 + r() * 0.2);
          const pts: Pt[] = [];
          for (let s = u; s <= u1; s += 0.03) {
            const [x, y] = trunkAt(s, v + (r() - 0.5) * 0.04);
            pts.push([x, y]);
          }
          if (pts.length > 1) line(ctx, pts, k < 3 ? WOOD[2] : WOOD[0], 0.6);
          u = u1 + 0.02 + r() * 0.06;
        }
      }
      for (const u of [0.28, 0.55, 0.77]) {
        const [x, y] = trunkAt(u, 0.45 + r() * 0.2);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(atan2(-64, -184));
        ctx.scale(1, 0.55);
        disc(ctx, 0, 0, 3.4, WOOD[0]);
        disc(ctx, -0.6, -0.6, 2, WOOD[1]);
        ctx.restore();
      }
    }
    G.grain(ctx, G.polyRegion(ctx, TRUNK), seed + 7);
    G.dirt(ctx, -210, -150, 200, 90, seed + 9, 0.3);
    ctx.restore();
    path(ctx, TRUNK);
    stroke(ctx, SLINE);
    const [tx, ty] = trunkAt(1, 0.5);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(atan2(-64, -184) + PI);
    ctx.scale(0.4, 1);
    disc(ctx, 0, 0, 8, CUT[1], SLINE);
    ctx.restore();
    mossCap(ctx, -150, -140, 60, seed + 8, 2);
    mossCap(ctx, -80, -114, 30, seed + 10, 1.6);
    leafBlob(ctx, -192, -154, 22, 12, seed + 1);
    leafBlob(ctx, -124, -150, 14, 9, seed + 2);
    for (let i = 0; i < 7; i++) {
      const x = -22 + i * 7;
      curve(ctx, [[x, -10], [x + (r() - 0.5) * 8, 2], [x + (r() - 0.5) * 12, 8 + r() * 6]], WOOD[1], 1.4 + r());
    }
    shape(ctx, ROOT, WOOD[0], SLINE);
    ctx.save();
    path(ctx, ROOT);
    ctx.clip();
    for (let i = 0; i < 16; i++) {
      const x = (r() - 0.5) * 16;
      const y = -96 + r() * 40;
      const s = i % 2 ? 1 : -1;
      curve(ctx, [[x, y], [x + s * (8 + r() * 10), y + 14 + r() * 20], [x + s * (14 + r() * 18), y + 40 + r() * 50]], i % 3 ? WOOD[1] : WOOD[2], 1.4 + r() * 2.6);
    }
    for (let i = 0; i < 8; i++) rock(ctx, -20 + r() * 36, -120 + r() * 110, 4 + r() * 4, 3 + r() * 3, seed + 20 + i);
    G.grain(ctx, G.polyRegion(ctx, ROOT), seed + 4);
    G.dirt(ctx, -30, -126, 60, 126, seed + 5, 0.4);
    ctx.restore();
    mossCap(ctx, -22, -124, 36, seed + 6, 4);
    for (const [x, rx, ry] of [[-34, 9, 7], [-16, 7, 5], [24, 10, 8], [34, 6, 4]] as [number, number, number][]) rock(ctx, x, -ry + 1, rx, ry, seed + 30 + x);
    if (!simple()) {
      for (const x of [-20, -6, 10]) vine(ctx, x, -118, 34, seed + 40 + x);
      fern(ctx, 30, 18, seed + 50);
    }
  },
};

export const jungleSceneryAssets: EnvAsset[] = [jungleBuilding, jungleTower, stoneStack, coolantPipe, rockLedges, rockSlope, rockDebris, deckRailing, fallenTree];
