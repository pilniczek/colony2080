(() => {
const { define, P, G } = window.ENV;
const { rng, path, color, flat, box, poly, cylH, disc, glow, stroke, shape, line, curve, mesh, hazard } = P;
const { PI, sin, cos, min, max, round, abs } = Math;

const simple = () => window.ENV.simple;

const STONE = ["#2c2a22", "#4c493d", "#716c5a", "#a39c84"];
const MOSS = ["#17220e", "#2a3c18", "#43602a", "#6c8a3c"];
const LEAF = ["#0c1c14", "#183424", "#285034", "#457a48"];
const BUNKER = ["#363c32", "#545448", "#606054", "#7c7c6a"];
const RED = ["#4a0e08", "#86200e", "#b8381a", "#e06a3a"];
const WATER = ["#546060", "#6c6c6c", "#788478", "#a8a8a8"];
const ROCK = ["#303024", "#6c6254", "#84786c", "#a4a08c"];
const TEAL = ["#182424", "#243030", "#3c4848", "#5c6c6c"];
const DOME = ["#0c3024", "#1c4c3c", "#3c6c60", "#8ca8a0"];
const BRASS = ["#3c3018", "#6c6030", "#9c8448", "#e4c048"];
const ARMY = ["#1c3424", "#244830", "#3c6c48", "#5c8c64"];
const CONDUIT = ["#101c1c", "#18483c", "#303c3c", "#3c8478"];
const SPIKE = ["#1c2c28", "#54786c", "#a8b4b4", "#dce4e4"];
const GOLD = ["#5c4c30", "#9c846c", "#c8a860", "#eed890"];
const SLATE = ["#2c2a26", "#5c564c", "#787064", "#9c9484"];
const WOOD = ["#2a1c10", "#483018", "#604824", "#8c6c3c"];
const SLINE = "#12100b";
const CLINE = "#080c08";
const ROOF = ["#2a1c14", "#483024", "#5c3c28", "#7c5438"];

function band(ctx, x, y, w, h, t, tone = 2, edge = CLINE) {
  const e = min(2, h / 4), s = min(3, h / 4);
  flat(ctx, x, y, w, h, t[tone]);
  flat(ctx, x, y, w, e, t[min(3, tone + 1)]);
  flat(ctx, x, y + h - s, w, s, t[max(0, tone - 1)]);
  if (!edge) return;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, edge);
}

function column(ctx, x, y, w, h, t, tone = 2, edge = CLINE) {
  const e = min(3, w / 4), s = min(4, w / 4);
  flat(ctx, x, y, w, h, t[tone]);
  flat(ctx, x, y, e, h, t[min(3, tone + 1)]);
  flat(ctx, x + w - s, y, s, h, t[max(0, tone - 1)]);
  if (!edge) return;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, edge);
}

function oval(ctx, cx, cy, rx, ry, fill, edge = null, rot = 0) {
  ctx.fillStyle = color(fill);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, PI * 2);
  ctx.fill();
  if (edge) stroke(ctx, edge);
}

function within(ctx, pts, draw) {
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  draw();
  ctx.restore();
}

function eggPts(cx, cy, rx, ry, rot, egg, seed, n = 30) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2;
    const k = (1 + egg * cos(a)) * (0.97 + r() * 0.05);
    const x = cos(a) * rx * k, y = sin(a) * ry * k;
    pts.push([cx + x * cos(rot) - y * sin(rot), min(0, cy + x * sin(rot) + y * cos(rot))]);
  }
  return pts;
}

function beads(ctx, x, y, w) {
  flat(ctx, x, y, w, 3, "#6c4824", CLINE);
  if (simple()) return;
  for (let px = x + 2; px < x + w - 1; px += 4) flat(ctx, px, y + 0.8, 1.6, 1.4, px % 8 < 4 ? BRASS[3] : "#c87830");
}

function blobPts(cx, cy, rx, ry, seed, n = 9, jag = 0.18) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2;
    const k = 1 - jag + r() * jag * 2;
    pts.push([cx + cos(a) * rx * k, cy + sin(a) * ry * k]);
  }
  return pts;
}

function stone(ctx, cx, cy, rx, ry, seed, tones = STONE) {
  const pts = blobPts(cx, cy, rx, ry, seed);
  shape(ctx, pts, tones[1]);
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  shape(ctx, blobPts(cx - rx * 0.14, cy - ry * 0.2, rx * 0.78, ry * 0.66, seed + 1), tones[2]);
  if (!simple()) shape(ctx, blobPts(cx - rx * 0.34, cy - ry * 0.46, rx * 0.34, ry * 0.24, seed + 2, 7), tones[3]);
  flat(ctx, cx - rx * 1.2, cy + ry * 0.52, rx * 2.4, ry, tones[0]);
  ctx.restore();
  path(ctx, pts);
  stroke(ctx, SLINE);
}

function mossCap(ctx, x, y, w, seed, depth = 3) {
  const r = rng(seed);
  const pts = [[x, y + 0.6]];
  for (let px = x; px < x + w; px += 2 + r() * 3) pts.push([px, y - r() * 1.4]);
  pts.push([x + w, y]);
  for (let px = x + w; px > x; px -= 2 + r() * 3) pts.push([px, y + 0.8 + r() * depth]);
  shape(ctx, pts, MOSS[2], MOSS[0]);
  if (!simple()) for (let px = x + r() * 4; px < x + w; px += 3 + r() * 5) flat(ctx, px, y - 0.6, 1.2, 1, MOSS[3]);
}

function leafBlob(ctx, cx, cy, rx, ry, seed, tones = LEAF) {
  const r = rng(seed);
  const n = simple() ? 3 : 7;
  for (let i = 0; i < n; i++) {
    const a = r() * PI * 2;
    const d = r() * 0.55;
    shape(ctx, blobPts(cx + cos(a) * rx * d, cy + sin(a) * ry * d, rx * (0.45 + r() * 0.3), ry * (0.45 + r() * 0.3), seed + i * 7, 8, 0.3), tones[i % 2 ? 1 : 2]);
  }
  if (!simple()) for (let i = 0; i < 4; i++) shape(ctx, blobPts(cx - rx * 0.3 + r() * rx * 0.6, cy - ry * 0.4 + r() * ry * 0.3, rx * 0.2, ry * 0.15, seed + 90 + i, 6, 0.3), tones[3]);
}

function frond(ctx, x, y, len, angle, seed, tones = LEAF) {
  const r = rng(seed);
  const tip = [x + cos(angle) * len, y + sin(angle) * len];
  const mid = [x + cos(angle) * len * 0.5, y + sin(angle) * len * 0.5 - len * 0.18];
  curve(ctx, [[x, y], mid, tip], tones[1], 1.1);
  if (simple()) return;
  for (let k = 0.15; k < 0.95; k += 0.12) {
    const px = x + (tip[0] - x) * k;
    const py = y + (tip[1] - y) * k - sin(k * PI) * len * 0.18;
    const l = len * 0.28 * (1 - k * 0.6);
    for (const s of [-1, 1]) line(ctx, [[px, py], [px + cos(angle + s * 1.1) * l, py + sin(angle + s * 1.1) * l + l * 0.2]], tones[r() < 0.5 ? 2 : 3], 0.9);
  }
}

function fern(ctx, x, h, seed, tones = LEAF) {
  const r = rng(seed);
  const n = simple() ? 4 : 7;
  for (let i = 0; i < n; i++) {
    const a = -PI / 2 + (i / (n - 1) - 0.5) * 2.3 + (r() - 0.5) * 0.2;
    frond(ctx, x + (r() - 0.5) * 3, 0, h * (0.7 + r() * 0.4), a, seed + i * 11, tones);
  }
}

function grass(ctx, x, w, h, seed) {
  const r = rng(seed);
  for (let px = x; px < x + w; px += simple() ? 2.4 : 1.2) {
    const l = h * (0.4 + r() * 0.6);
    line(ctx, [[px, 0], [px + (r() - 0.5) * 3, -l]], MOSS[1 + round(r() * 2)], 0.8);
  }
}

function vine(ctx, x, top, len, seed) {
  const r = rng(seed);
  const pts = [];
  for (let k = 0; k <= 6; k++) pts.push([x + sin(k * 1.3 + seed) * 1.6, top + (len * k) / 6]);
  curve(ctx, pts, MOSS[1], 1);
  if (simple()) return;
  for (let k = 1; k < 6; k++) {
    if (r() < 0.35) continue;
    const [px, py] = pts[k];
    shape(ctx, blobPts(px + (r() - 0.5) * 3, py, 1.6, 1.1, seed + k, 6, 0.2), MOSS[2 + (k % 2)]);
  }
}

function slab(ctx, x, y, w, h, seed, moss = true) {
  const r = rng(seed);
  const top = y + r() * 2;
  const pts = [[x, top + 2], [x + w * 0.2, top], [x + w * 0.7, top + r() * 1.5], [x + w, top + 1.5], [x + w - r() * 3, y + h * 0.6], [x + w - 2 - r() * 3, y + h], [x + w * 0.3, y + h - r() * 2], [x + 2, y + h], [x - r() * 2, y + h * 0.5]];
  shape(ctx, pts, STONE[1]);
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  flat(ctx, x - 4, top, w + 8, h * 0.6, STONE[2]);
  if (!simple()) {
    flat(ctx, x - 4, top, w + 8, 1.6, STONE[3]);
    for (let k = 0; k < 3; k++) {
      const cx = x + w * (0.15 + r() * 0.7);
      line(ctx, [[cx, top + h * 0.35], [cx + (r() - 0.5) * 5, top + h * (0.6 + r() * 0.3)]], STONE[0], 0.7);
    }
  }
  flat(ctx, x - 4, y + h * 0.84, w + 8, h * 0.3, STONE[0]);
  ctx.restore();
  path(ctx, pts);
  stroke(ctx, SLINE);
  if (moss) mossCap(ctx, x + 2, top + 0.5, w * (0.4 + r() * 0.5), seed + 3, 2.5);
}

function barredWindow(ctx, x, y, w, h, seed) {
  flat(ctx, x - 2, y - 2, w + 4, h + 4, BUNKER[0], CLINE);
  flat(ctx, x, y, w, h, "#10181c");
  if (!simple()) {
    const r = rng(seed);
    for (let i = 0; i < 3; i++) flat(ctx, x + r() * (w - 4), y + r() * (h - 3), 3, 2, "#2a3c44");
  }
  for (let bx = x + w / 4; bx < x + w - 1; bx += w / 4) flat(ctx, bx - 0.7, y, 1.4, h, "#c8ccc4");
  flat(ctx, x, y + h / 2 - 0.7, w, 1.4, "#c8ccc4");
  flat(ctx, x - 3, y + h + 2, w + 6, 2.5, BUNKER[3], CLINE);
}

function bunkerBody(ctx, w, h, seed) {
  const r = rng(seed);
  flat(ctx, 0, -h, w, h, BUNKER[1], CLINE);
  for (let x = 0; x < w; x += 24) {
    flat(ctx, x, -h, min(24, w - x), h, r() < 0.5 ? BUNKER[2] : BUNKER[1]);
    if (!simple()) flat(ctx, x, -h, 0.8, h, BUNKER[0]);
  }
  for (const x of [0, w - 10]) {
    flat(ctx, x, -h, 10, h, BUNKER[2], CLINE);
    if (!simple()) flat(ctx, x + 1, -h, 2, h, BUNKER[3]);
  }
  flat(ctx, -2, -h - 5, w + 4, 6, ROOF[1], CLINE);
  if (!simple()) {
    flat(ctx, -2, -h - 5, w + 4, 1.4, ROOF[3]);
    for (let x = 0; x < w; x += 3) flat(ctx, x, -h - 3.4, 1, 3.4, ROOF[0]);
  }
  flat(ctx, 0, -5, w, 5, BUNKER[0]);
}

function bunkerGrime(ctx, w, h, seed) {
  const r = rng(seed);
  G.grain(ctx, G.rectRegion(ctx, 0, -h - 5, w, h + 5), seed);
  G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 0.6);
  G.drips(ctx, 0, -h + 1, w, h * 0.55, seed + 2, max(2, round(w / 16)), false);
  G.dirt(ctx, 0, -h, w, h, seed + 3, 0.35);
  G.chips(ctx, -2, -h - 4.6, w + 4, seed + 4, G.DIRT);
  mossCap(ctx, -2, -h - 5, w * (0.3 + r() * 0.4), seed + 5, 3);
  if (!simple()) for (const vx of [6 + r() * 10, w - 10 - r() * 10]) vine(ctx, vx, -h - 2, h * (0.4 + r() * 0.4), seed + round(vx));
}

function bunkerWindows(ctx, w, h, from, to, seed, skip = null) {
  const wh = min(26, h - 34);
  for (let x = from; x + 30 <= to; x += 40) if (!skip || x + 30 < skip[0] || x > skip[1]) barredWindow(ctx, x, -h + 14, 30, wh, seed + x);
}

function door(ctx, x, h, open, w = 28) {
  flat(ctx, x - 3, -h - 3, w + 6, h + 3, TEAL[0], CLINE);
  if (open) {
    flat(ctx, x, -h, w, h, "#060807");
    if (!simple()) {
      flat(ctx, x + 6, -h * 0.55, w - 12, 1.4, "#18201e");
      flat(ctx, x + 8, -h * 0.55 - 5, 5, 5, "#141a18");
    }
    for (const lx of [x, x + w - 5]) column(ctx, lx, -h, 5, h, TEAL, 2);
    oval(ctx, x + w / 2, -h - 1.5, 1.8, 1.8, "screen", CLINE);
    if (!simple()) glow(ctx, x + w / 2, -h - 1.5, 6, "screen", 0.4);
  } else {
    for (const lx of [x, x + w / 2]) {
      column(ctx, lx, -h, w / 2, h, TEAL, 2);
      if (simple()) continue;
      for (const y of [-h + 8, -h * 0.5, -12]) flat(ctx, lx + 2, y, w / 2 - 4, 1, TEAL[1]);
    }
    flat(ctx, x + w / 2 - 0.5, -h, 1, h, TEAL[0]);
    for (const hx of [x + w / 2 - 3.4, x + w / 2 + 1.6]) flat(ctx, hx, -h * 0.48, 1.8, 6, "m3", "mLine");
    const lx = x + 8, ly = -h + 8;
    oval(ctx, lx, ly, 3.4, 3.4, RED[2], CLINE);
    line(ctx, [[lx - 1.8, ly - 1.8], [lx + 1.8, ly + 1.8]], RED[0], 0.9);
    line(ctx, [[lx + 1.8, ly - 1.8], [lx - 1.8, ly + 1.8]], RED[0], 0.9);
    if (!simple()) glow(ctx, lx, ly, 9, RED[3], 0.4);
    if (!simple()) G.rustPatch(ctx, x + w * 0.7, -14, 3, 2, 600 + x);
  }
  hazard(ctx, x, -4, w, 4, 3);
}

function bunkerBlock(ctx, x, w, h, seed) {
  ctx.save();
  ctx.translate(x, 0);
  bunkerBody(ctx, w, h, seed);
  ctx.restore();
}

function blockGrime(ctx, x, w, h, seed) {
  ctx.save();
  ctx.translate(x, 0);
  bunkerGrime(ctx, w, h, seed);
  ctx.restore();
}

function stoneStack(ctx, x, w, h, seed) {
  const r = rng(seed);
  flat(ctx, x, -h + 6, w, h - 6, "#141810");
  const n = 3, sh = (h - 10) / n, cw = w * 0.47;
  for (const cx of [x, x + w - cw]) for (let i = 0; i < n; i++) slab(ctx, cx + (r() - 0.5) * 3, -sh * (i + 1) + 1, cw, sh - 1, seed + i * 5 + round(cx), false);
  beads(ctx, x - 2, -h + 6, w + 4);
  for (const cx of [x + w * 0.25, x + w * 0.75]) stone(ctx, cx, -h + 4, w * 0.22, 4.5, seed + 40 + round(cx));
  mossCap(ctx, x + 2, -h + 1, w * 0.6, seed + 50, 2.5);
  G.grain(ctx, G.rectRegion(ctx, x, -h, w, h), seed + 59, 0.5);
  G.dirt(ctx, x, -h, w, h, seed + 60, 0.3);
}

define({
  id: "flamethrowerDoor",
  box: [-3, -102, 243, 0],
  draw(ctx, state, t, { w = 240, h = 96 } = {}) {
    const seed = 580 + round(w);
    const k = w / 240;
    const low = round(h * 0.75);
    const back = [44 * k, w - 44 * k], wing = 168 * k, front = [0, 100 * k];
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
  }
});

const FALL_FOOT = 24;

function fallFoam(ctx, w, seed) {
  const r = rng(seed);
  flat(ctx, 0, -FALL_FOOT - 3, w, 4, "#b4bcb6");
  for (let x = 0; x < w; x += 4 + r() * 5) oval(ctx, x + 2, -FALL_FOOT - 2 + r() * 2, 3 + r() * 3, 1.6 + r() * 1.4, r() < 0.5 ? "#dce0dc" : WATER[3]);
}

const waterFlow = (ctx, w, h, t) => {
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

const STEPS = [[48, 216], [96, 240]];

function fallStone(ctx, x, y, seed) {
  const r = rng(seed);
  const pts = [[x, y + 3], [x + 5, y], [x + 16, y + 0.6], [x + 24, y + 2.4], [x + 24.6, y + 17], [x + 23, y + 23], [x + 1, y + 23], [x - 0.6, y + 15]];
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
}

define({
  id: "waterfall",
  box: [-10, -441, 154, -18],
  anim: true,
  draw(ctx, state, t, { w = 144, h = 432 } = {}) {
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
    if (state === 1) for (const [x, y] of STEPS) fallStone(ctx, x * w / 144, -h + y, seed + x);
  }
});

function spike(ctx, x, hh, lean) {
  const tip = [x + 1.9 + lean * hh, -hh];
  shape(ctx, [[x, -3], tip, [x + 3.8, -3]], SPIKE[1], "#0a1010");
  shape(ctx, [[x, -3], tip, [x + 1.9, -3]], SPIKE[2]);
  if (!simple()) line(ctx, [[x + 0.9, -4], [tip[0] - 0.2, tip[1] + 2]], SPIKE[3], 0.5);
}

function rubble(ctx, x0, x1, seed) {
  const r = rng(seed);
  const mid = (x0 + x1) / 2;
  const top = [[x0 - 7, 0], [x0 - 5, -10], [x0 - 1, -19], [x0 + 4, -22]];
  for (let x = x0 + 16; x < x1 - 10; x += 14 + r() * 8) top.push([x, -21.4 - r() * 1.6]);
  top.push([x1 - 4, -22], [x1 + 1, -19], [x1 + 5, -10], [x1 + 7, 0]);
  shape(ctx, top, ROCK[0], SLINE);
  for (let i = 0; i < (simple() ? 8 : round((x1 - x0) / 7)); i++) {
    const cx = x0 + 2 + r() * (x1 - x0 - 4);
    stone(ctx, cx, -3 - r() * 13, 4 + r() * 5, 3 + r() * 3, seed + i * 3, ROCK);
  }
  for (let x = x0; x < x1 - 4; x += 24) {
    const w = min(24, x1 - x);
    const deck = [[x + 0.6, -19.4], [x + 3.4, -22.6 - r() * 0.6], [x + w - 4, -23], [x + w - 0.6, -19.2], [x + w * 0.6, -16.8], [x + w * 0.2, -17.2]];
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
}

define({
  id: "spikes",
  box: [0, -24, 192, 1],
  draw(ctx, state, t, { w = 192 } = {}) {
    const seed = 640 + round(w);
    const r = rng(seed);
    const heap = state === 1 ? [24, 168] : null;
    flat(ctx, 0, -6, w, 6, "#0a100e");
    for (let x = 1; x < w - 3; x += 4.6) {
      const hh = 15 + r() * 4;
      const bend = r();
      if (heap && x > heap[0] - 6 && x < heap[1] + 2) continue;
      const near = heap && x > heap[0] - 10 && x < heap[1] + 4 && bend < 0.7;
      spike(ctx, x, hh, near ? (x < (heap[0] + heap[1]) / 2 ? -0.3 : 0.3) * bend : 0);
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
  }
});

const BOULDER = eggPts(52, -44, 50, 36, -0.7, 0.26, 701, 48);
const CHUNKS = [
  [[6, 0], [8, -12], [18, -19], [30, -15], [32, 0]],
  [[26, 0], [30, -17], [44, -25], [58, -22], [62, -8], [60, 0]],
  [[56, 0], [60, -14], [72, -18], [84, -12], [86, 0]],
  [[80, 0], [84, -9], [94, -7], [97, 0]]
];

function boulderRock(ctx, seed) {
  shape(ctx, BOULDER, ROCK[1]);
  within(ctx, BOULDER, () => {
    oval(ctx, 42, -58, 46, 32, ROCK[2], null, -0.7);
    if (!simple()) oval(ctx, 40, -68, 24, 10, ROCK[3], null, -0.7);
    oval(ctx, 78, -4, 54, 22, ROCK[0], null, -0.36);
    G.grain(ctx, G.polyRegion(ctx, BOULDER), seed, 0.5);
    for (const [pts, w] of [[[[4, -40], [24, -44], [40, -38], [58, -46], [78, -52], [96, -62]], 1.2], [[[58, -46], [66, -62], [80, -78], [92, -86]], 1], [[[40, -38], [44, -24], [38, -10]], 0.9]]) {
      curve(ctx, pts, "#1c1c14", w);
      if (!simple()) curve(ctx, pts.map(([x, y]) => [x + 0.8, y + 0.9]), ROCK[3], 0.5);
    }
    G.dirt(ctx, 0, -36, 104, 36, seed + 1, 0.45);
  });
  path(ctx, BOULDER);
  stroke(ctx, SLINE);
}

define({
  id: "boulder",
  box: [-4, -100, 104, 1],
  draw(ctx, state) {
    const seed = 700;
    const r = rng(seed + 9);
    if (state === 1) {
      for (const [i, pts] of CHUNKS.entries()) {
        shape(ctx, pts, ROCK[1]);
        within(ctx, pts, () => {
          shape(ctx, pts.map(([x, y]) => [x - 1, y - 4]), ROCK[2]);
          shape(ctx, pts.map(([x, y]) => [x + 3, y + 8]), ROCK[1]);
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
  }
});

function strut(ctx, a, b, w, c) {
  line(ctx, [a, b], "kLine", w + 1.2, "butt");
  line(ctx, [a, b], c, w, "butt");
}

const DOME_PTS = [[9, -26], [11, -32], [17, -36.6], [24, -38], [31, -36.6], [37, -32], [39, -26]];

function turretFlash(ctx, x, y, t) {
  const heat = 1 - Math.floor((t % 0.36) / 0.06) / 6;
  const len = 9 + 7 * heat;
  if (!simple()) glow(ctx, x + len * 0.4, y, 9 + 6 * heat, "#ffb040", 0.55 * heat + 0.2);
  shape(ctx, [[x, y - 4.4], [x + len * 0.55, y - 5.6], [x + len * 0.5, y - 1.6], [x + len, y], [x + len * 0.5, y + 1.6], [x + len * 0.55, y + 5.6], [x, y + 4.4]], "#e0601c");
  shape(ctx, [[x, y - 2.6], [x + len * 0.7, y], [x, y + 2.6]], "#ffd060");
  oval(ctx, x + 1.6, y, 2 + heat, 1.6 + heat * 0.6, "#fff4c8");
}

define({
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
    band(ctx, 5, -27, 38, 3.4, ["#303c3c", "#485454", "#6c8480", "#a8b4b4"], 2);
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
  }
});

const SIGN_PTS = (cx, cy, r) => Array.from({ length: 8 }, (_, i) => [cx + cos(PI / 8 + (i * PI) / 4) * r, cy + sin(PI / 8 + (i * PI) / 4) * r]);

function eSign(ctx, cx, cy, r, rot = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  shape(ctx, SIGN_PTS(0, 0, r), BRASS[3], CLINE);
  const s = r / 5.5;
  flat(ctx, -2 * s, -3 * s, 1.4 * s, 6 * s, "#101010");
  for (const y of [-3, -0.7, 1.6]) flat(ctx, -2 * s, y * s, 4.4 * s, 1.4 * s, "#101010");
  if (!simple()) G.rustPatch(ctx, r * 0.5, r * 0.5, 1.4, 1, 806);
  ctx.restore();
}

function conduit(ctx, pts) {
  line(ctx, pts, CLINE, 4.2, "butt");
  line(ctx, pts, CONDUIT[1], 3, "butt");
  if (!simple()) line(ctx, pts.map(([x, y]) => [x, y - 0.8]), CONDUIT[3], 0.7, "butt");
}

define({
  id: "distributionCabinet",
  box: [-6, -46, 42, 1],
  draw(ctx, state) {
    const broken = state === 1;
    conduit(ctx, [[-6, -20], [3, -20]]);
    conduit(ctx, [[24, -1], [24, 0], [40, 0]]);
    band(ctx, 2, -32, 30, 32, CONDUIT, 2);
    if (broken) {
      const hole = [[6, -29], [14, -30], [22, -27], [29, -29], [29, -16], [26, -7], [16, -5], [8, -8], [5, -18]];
      G.scorch(ctx, hole, 801);
      shape(ctx, hole, "#060808", CLINE);
      for (const [x, y] of [[12, -20], [20, -14], [15, -10]]) line(ctx, [[x, y], [x + 4, y + 2], [x + 1, y + 6]], RED[2], 0.7);
      line(ctx, [[3, -20], [6, -18], [5, -14]], "y1", 0.6);
      line(ctx, [[3, -21], [7, -23], [8, -20]], "a1", 0.6);
      shape(ctx, [[4, -31], [9, -30.4], [3, -8], [-2, -9.6]], "#6c4c2c", "rLine");
      if (!simple()) flat(ctx, 3.4, -28, 2, 2, "#2a1c10");
      G.rim(ctx, hole, 802, "#5c6c6c", "#060808");
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
  }
});

const PANEL = [[9, -37], [39, -37.6], [39.6, -7], [8.6, -7]];
const FACES = [
  [[12.6, -34], [23, -34], [17, -25], [12.6, -24]],
  [[25.6, -34], [36, -34], [36, -22.4], [24, -22.4], [20, -26.4]],
  [[12.6, -21.6], [16.6, -22.6], [22.4, -10], [12.6, -10]],
  [[25, -20], [36, -20], [36, -10], [27.6, -10]]
];

define({
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
        shape(ctx, pts.map(([x, y]) => [x + 2.4, y + 2.2]), t[1]);
        shape(ctx, pts.map(([x, y]) => [x + 1, y + 1]), t[2]);
        if (!simple()) line(ctx, [[pts[0][0] + 2, pts[0][1] + 3], [pts[0][0] + 5, pts[0][1] + 6]], t[0], 0.5);
        G.grain(ctx, G.polyRegion(ctx, pts), 830 + i, 0.5);
      });
    }
    if (state === 1 && !simple()) glow(ctx, 24, -22, 18, GOLD[3], 0.3);
    G.grain(ctx, G.polyRegion(ctx, PANEL), 826, 0.7);
    G.dirt(ctx, 8, -37, 32, 30, 827, 0.3);
    mossCap(ctx, 10, -37.4, 14, 828, 1.6);
    if (!simple()) for (const x of [6, 42]) line(ctx, [[x, -6], [x + 2, -4], [x, -2]], STONE[0], 0.8);
  }
});

const BLOCK_PTS = [[0, 0], [-0.6, -10], [2, -14.4], [11, -15.2], [15, -12], [15.4, 0]];

const STONE_AT = [26, -27];
const WIRE_END = [94, -6];

define({
  id: "tripwire",
  box: [-2, -50, 98, 1],
  draw(ctx, state) {
    const cut = state === 1;
    const board = [[2, 0], [2.6, -15.4], [21, -16.2], [21.6, 0]];
    shape(ctx, board, WOOD[2], "rLine");
    within(ctx, board, () => {
      flat(ctx, 2, -17, 20, 2, WOOD[3]);
      flat(ctx, 2, -3, 20, 3, WOOD[1]);
      if (!simple()) for (const y of [-11, -6]) line(ctx, [[3, y], [21, y + 0.6]], WOOD[1], 0.5);
      G.grain(ctx, G.polyRegion(ctx, board), 846, 0.6);
    });
    flat(ctx, 5, -13, 1.2, 1.2, "m3");
    flat(ctx, 17.4, -13, 1.2, 1.2, "m3");
    const post = [[38.6, 0], [39, -27.4], [41.4, -27.4], [41.8, 0]];
    shape(ctx, post, WOOD[2], "rLine");
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
      curve(ctx, [[WIRE_END[0], WIRE_END[1]], [86, -3], [82, -0.6]], "c1", 0.6);
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
  }
});

const MINE_DOME = Array.from({ length: 15 }, (_, i) => [cos(PI + PI * i / 14) * 8.5, -3.4 + sin(PI + PI * i / 14) * 5.6]);
const MINE_FLANGE = [[-11.5, -0.4], [-10.4, -3.6], [10.4, -3.6], [11.5, -0.4]];
const MINE_SOIL = "#2a2214";
const LAMP_OFF = "#4a0c08";

function mineArmed(ctx, t) {
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
}

function mineBlown(ctx) {
  shape(ctx, blobPts(0, -0.5, 11, 2.6, 861, 10, 0.3), "#0b0806");
  G.scorch(ctx, [[-10, -1], [10, -1], [8, 0], [-8, 0]], 862);
  for (const [x, y, a] of [[-8, -1.2, -0.5], [7, -1.4, 0.6], [2, -0.8, 0.2]]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    shape(ctx, [[-2.4, 0], [-1.6, -1.6], [1.8, -1.2], [2.6, 0]], "o0", "kLine");
    flat(ctx, -1.6, -1.6, 3.2, 0.5, "o2");
    ctx.restore();
  }
  grass(ctx, -13, 3.5, 3, 863);
  grass(ctx, 10, 3.5, 3, 864);
}

define({
  id: "mine",
  box: [-14, -20, 14, 1],
  anim: true,
  draw(ctx, state, t) {
    if (state === 1) mineBlown(ctx);
    else mineArmed(ctx, t);
  }
});

const CAN = [[0, 0], [0, -17], [3, -20], [16, -20], [16, 0]];

define({
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
  }
});

define({
  id: "cutters",
  box: [-1, -9, 25, 1],
  draw(ctx) {
    for (const [a, b] of [[[1, -3], [14, -5]], [[1, -6], [14, -4.4]]]) strut(ctx, a, b, 2, RED[2]);
    shape(ctx, [[14, -6], [24, -5.6], [22, -4.6], [14, -3.4]], "c1", "mLine");
    disc(ctx, 14, -4.7, 1.1, "m2", "mLine");
  }
});

define({
  id: "grenade",
  box: [-5, -13, 5, 1],
  draw(ctx) {
    shape(ctx, blobPts(0, -4.6, 3.6, 4.6, 901, 10, 0.04), "o1", "kLine");
    if (!simple()) for (let y = -8; y < -1; y += 2) flat(ctx, -3, y, 6, 0.6, "o0");
    flat(ctx, -1.4, -11, 2.8, 2, "m2", "mLine");
    line(ctx, [[1.4, -10], [4, -8], [3.4, -4]], "m1", 0.8);
    disc(ctx, -2.6, -11.4, 1.2, "m3", "mLine");
  }
});

define({
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
  }
});

define({
  id: "bonusPickup",
  box: [-1, -15, 17, 1],
  draw(ctx, state) {
    if (state === 1) return;
    box(ctx, 0, -12, 16, 12, "steel", 2);
    flat(ctx, 6.5, -10, 3, 8, "acid");
    flat(ctx, 4, -7.5, 8, 3, "acid");
    if (!simple()) glow(ctx, 8, -6, 11, "acid", 0.35);
    G.grain(ctx, G.rectRegion(ctx, 0, -12, 16, 12), 921);
  }
});

const POLE = [50, 20];

function chevronPole(ctx, top, bottom) {
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
}

function liftStation(ctx, seed) {
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
  for (const [y, up] of [[-28, true], [-24, false]]) shape(ctx, up ? [[86, y - 1.6], [88, y + 1], [84, y + 1]] : [[84, y - 1], [88, y - 1], [86, y + 1.6]], BRASS[3], CLINE);
  G.grain(ctx, G.rectsRegion(ctx, [[0, -7, 96, 7], [80, -38, 12, 18], [40, -46, 4, 40], [76, -46, 4, 40]]), seed, 0.6);
  G.drips(ctx, 40, -46, 40, 16, seed + 1, 4);
  G.dirt(ctx, 0, -7, 96, 7, seed + 2, 0.4);
  G.rustPatch(ctx, 78, -10, 3, 1.5, seed + 3);
}

define({
  id: "towerLift",
  box: [-4, -384, 100, 1],
  draw(ctx, state, t, { h = 384 } = {}) {
    if (state === 1) {
      chevronPole(ctx, -96, -6);
      hazard(ctx, POLE[0] - 1, -100, POLE[1] + 2, 5, 3);
    } else chevronPole(ctx, -h, -6);
    liftStation(ctx, 945 + state);
  }
});
window.ENV.jungle = { STONE, MOSS, LEAF, BUNKER, RED, WATER, ROCK, TEAL, DOME, BRASS, ARMY, CONDUIT, SPIKE, GOLD, SLATE, WOOD, ROOF, SLINE, CLINE, band, column, oval, within, eggPts, beads, bunkerBlock, blockGrime, stoneStack, eSign, conduit, blobPts, stone, mossCap, leafBlob, frond, fern, grass, vine, slab, barredWindow, bunkerBody, bunkerGrime, bunkerWindows, door };
})();

(() => {
const { define, P, G, TILE } = window.ENV;
const J = window.ENV.jungle;
const { rng, path, flat, disc, stroke, shape, line, curve } = P;
const { PI, sin, cos, min, max, floor, ceil, round, abs, sqrt } = Math;

const simple = () => window.ENV.simple;

const SKY = { light: "#3c6c60", mist: "#306054", air: "#245448", canopy: "#184830", trunk: "#0c3024", band: "#00240c" };
const UNDER = ["#00240c", "#243018", "#304824", "#3c5a2c"];
const FAR = ["#061e14", "#0c3024", "#123c2c", "#184830"];
const RUINF = ["#061a0e", "#0c3018", "#123a20", "#1a4428"];
const COBBLE = [["#2a3024", "#3c483c", "#5a6250"], ["#2c2e24", "#45483a", "#606054"], ["#262e2a", "#3a4440", "#545c54"]];
const GROUT = "#182418";
const XPLATE = ["#182418", "#303024", "#484830", "#606048"];
const BLOCK = ["#3c3c30", "#606054", "#786c60", "#8c8270"];
const BOULD = ["#303024", "#6c6458", "#84786c", "#a09c88"];
const BEAD = ["#241808", "#c86a24", "#e4c048", "#18483c"];
const CAVE = ["#0c180e", "#182418", "#18483c", "#3c8478"];
const WOOD = ["#1c140c", "#302818", "#483c24", "#604824", "#6c3c18", "#8a5a30"];
const BOLT = ["#3c3018", "#9c846c", "#d4c098"];
const BRASS = ["#3c3018", "#6c6030", "#9c8440", "#e4c048"];
const PANEL = ["#101814", "#243030", "#3c483c", "#546060"];
const COLLAR = ["#3c4040", "#909078", "#c0c0a8"];
const FOOT = ["#545448", "#909078", "#b4b49c", "#d8d8c0"];
const BRICK = ["#1c1410", "#483024", "#54483a", "#60543c", "#6c603c"];
const LAMP = "#e8ece0";

const MARGIN = 24;
const shown = (ctx) => {
  const m = ctx.getTransform();
  if (m.b || m.c || !m.a || !m.d) return [-Infinity, -Infinity, Infinity, Infinity];
  const xa = -m.e / m.a;
  const xb = (ctx.canvas.width - m.e) / m.a;
  const ya = -m.f / m.d;
  const yb = (ctx.canvas.height - m.f) / m.d;
  return [min(xa, xb) - MARGIN, min(ya, yb) - MARGIN, max(xa, xb) + MARGIN, max(ya, yb) + MARGIN];
};
const eachCell = (ctx, x, y, w, h, cw, ch, draw, pad = 0) => {
  const [vx0, vy0, vx1, vy1] = shown(ctx).map((v, k) => (k < 2 ? v - pad : v + pad));
  const i0 = max(0, floor((vx0 - x) / cw));
  const i1 = min(ceil(w / cw - 0.001), ceil((vx1 - x) / cw));
  const j0 = max(0, floor((vy0 - y) / ch));
  const j1 = min(ceil(h / ch - 0.001), ceil((vy1 - y) / ch));
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) draw(x + i * cw, y + j * ch, i, j);
};
const cellSeed = (seed, i, j) => seed + i * 131 + j * 977;
const wrap = (i, n) => ((i % n) + n) % n;
const clipRect = (ctx, x, y, w, h, draw) => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  draw();
  ctx.restore();
};
const clipPts = (ctx, pts, draw) => {
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  draw();
  ctx.restore();
};
const jag = (x0, x1, y, amp, step, seed) => {
  const r = rng(seed);
  const pts = [];
  for (let x = x0; x < x1; x += step * (0.5 + r())) pts.push([x, y - r() * amp]);
  pts.push([x1, y - r() * amp]);
  return pts;
};
const rounded = (x, y, w, h, rad) => {
  const k = rad * 0.3;
  return [[x + rad, y], [x + w - rad, y], [x + w - k, y + k], [x + w, y + rad], [x + w, y + h - rad], [x + w - k, y + h - k], [x + w - rad, y + h], [x + rad, y + h], [x + k, y + h - k], [x, y + h - rad], [x, y + rad], [x + k, y + k]];
};
const foliage = (ctx, cx, cy, rx, ry, seed, c, n = 6) => {
  const r = rng(seed);
  const k = simple() ? round(n * 1.5) : n * 3;
  for (let i = 0; i < k; i++) {
    const a = r() * PI * 2;
    const d = sqrt(r()) * 0.85;
    const s = 0.17 + r() * 0.18;
    shape(ctx, J.blobPts(cx + cos(a) * rx * d, cy + sin(a) * ry * d, rx * s, ry * s * 1.3, seed + i * 7, simple() ? 8 : 13, 0.55), c);
  }
};
const trunk = (ctx, x, y0, y1, wd, lean, c, seed) => {
  const r = rng(seed);
  const h = y0 - y1;
  const bend = (r() - 0.5) * wd * 3;
  const pts = [];
  const back = [];
  for (let k = 0; k <= 6; k++) {
    const u = k / 6;
    const cx = x + lean * u + sin(u * PI) * bend;
    const half = (wd / 2) * (1 - u * 0.35) + (k === 0 ? wd * 0.5 : 0);
    pts.push([cx - half, y0 - h * u]);
    back.push([cx + half, y0 - h * u]);
  }
  shape(ctx, [...pts, ...back.reverse()], c);
  return [x + lean, y1];
};

const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const edge = (ctx, x, y, w, h, c) => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, c);
};

const COBBLE_TILE = 16;
const COBBLE_SEED = 7100;
const stoneTone = (ctx, pts, t, lit) => {
  shape(ctx, pts, t[1]);
  clipPts(ctx, pts, () => lit());
  path(ctx, pts);
  stroke(ctx, J.CLINE, 0.6);
};
const cobble = (ctx, x, y, s, mossy) => {
  const r = rng(s);
  const t = COBBLE[floor(r() * 3)];
  const u = COBBLE[floor(r() * 3)];
  const v = COBBLE[floor(r() * 3)];
  const jx = (r() - 0.5) * 1.2;
  const wide = rounded(x + 1.4 + jx, y + 0.8, 21.6 - r() * 1.2, 10.4, 4.4);
  stoneTone(ctx, wide, t, () => {
    flat(ctx, x, y + 7.4, 24, 4, t[0]);
    flat(ctx, x + 4 + jx, y + 1.6, 16, 2, t[2]);
  });
  const cx = x + 19.6 + (r() - 0.5);
  const cy = y + 17.4;
  const rad = 6.1 + r() * 0.5;
  const ball = J.blobPts(cx, cy, rad * 0.95, rad, s + 5, simple() ? 10 : 16, 0.06);
  stoneTone(ctx, ball, u, () => {
    disc(ctx, cx + rad * 0.35, cy + rad * 0.4, rad * 0.9, u[0]);
    disc(ctx, cx - rad * 0.25, cy - rad * 0.3, rad * 0.75, u[1]);
    if (!simple()) disc(ctx, cx - rad * 0.4, cy - rad * 0.55, rad * 0.35, u[2]);
  });
  const sq = rounded(x + 4.6 + r() * 0.6, y + 12.4 + r() * 0.5, 8 + r() * 0.6, 8.6, 1.8);
  stoneTone(ctx, sq, v, () => {
    flat(ctx, x + 4, y + 18.4, 10, 3, v[0]);
    flat(ctx, x + 5.6, y + 13.2, 6, 1.4, v[2]);
  });
  if (mossy && r() < 0.45) {
    const mw = 6 + r() * 10;
    shape(ctx, J.blobPts(x + 12 + jx, y + 1.4, mw / 2, 1.8 + r(), s + 3, 8, 0.35), J.MOSS[r() < 0.5 ? 1 : 2]);
    if (!simple() && r() < 0.5) line(ctx, [[x + 12, y + 2], [x + 12 + (r() - 0.5) * 2, y + 5 + r() * 6]], J.MOSS[1], 0.8);
  }
};
const worldCells = (ctx, x, y, w, h, c, draw, pad = 0) => {
  const [vx0, vy0, vx1, vy1] = shown(ctx);
  for (let j = floor((max(y, vy0) - pad) / c); j < ceil((min(y + h, vy1) + pad) / c); j++)
    for (let i = floor((max(x, vx0) - pad) / c); i < ceil((min(x + w, vx1) + pad) / c); i++) draw(i * c, j * c, i, j);
};
const cobbleField = (ctx, x, y, w, h, mossy, seed) => {
  flat(ctx, x, y, w, h, GROUT);
  worldCells(ctx, x, y, w, h, TILE, (cx, cy, i, j) => cobble(ctx, cx, cy, cellSeed(seed, wrap(i, COBBLE_TILE), wrap(j, COBBLE_TILE)), mossy), TILE);
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed + 1, 0.6);
  worldCells(ctx, x, y, w, h, 96, (cx, cy, i, j) => {
    const r = rng(cellSeed(seed + 5, wrap(i, 4), wrap(j, 4)));
    if (r() < 0.5) G.drips(ctx, cx + r() * 60, cy + 10 + r() * 50, 30, 18, seed + 6 + wrap(i, 4) + wrap(j, 4) * 7, 1, false);
    if (mossy && r() < 0.6) J.vine(ctx, cx + 10 + r() * 70, cy + r() * 30, 14 + r() * 20, seed + 9 + wrap(i, 4) * 3 + wrap(j, 4));
  }, 48);
};

define({
  id: "jungleSky",
  box: [0, -170, 320, 0],
  draw(ctx) {
    const layers = [
      (dx, r) => {
        for (let i = 0; i < 9; i++) shape(ctx, J.blobPts(dx + 20 + i * 36 + r() * 16, -150 + r() * 70, 26 + r() * 22, 12 + r() * 10, 9110 + i, 10, 0.35), SKY.mist);
        for (let i = 0; i < 5; i++) shape(ctx, J.blobPts(dx + 30 + i * 64 + r() * 20, -120 + r() * 40, 14 + r() * 10, 6 + r() * 5, 9130 + i, 9, 0.35), SKY.light);
      },
      (dx, r) => {
        for (let i = 0; i < 11; i++) {
          const x = dx + 6 + i * 29 + r() * 14;
          const top = trunk(ctx, x, -68, -170, 1.6 + r() * 1.6, (r() - 0.5) * 18, SKY.canopy, 9150 + i);
          if (r() < 0.6) line(ctx, [[x + (top[0] - x) * 0.6, -130], [x + (top[0] - x) * 0.6 + (r() - 0.5) * 30, -150 - r() * 12]], SKY.canopy, 1.2);
        }
        for (let i = 0; i < 12; i++) foliage(ctx, dx + i * 28 + r() * 14, -150 + r() * 30, 20 + r() * 12, 9 + r() * 6, 9180 + i, SKY.canopy, 7);
        for (let i = 0; i < 6; i++) foliage(ctx, dx + 10 + i * 54 + r() * 20, -108 + r() * 26, 14 + r() * 10, 6 + r() * 4, 9200 + i, SKY.canopy, 5);
      },
      (dx, r) => {
        for (let i = 0; i < 5; i++) {
          const x = dx + 18 + i * 66 + r() * 22;
          const lean = (r() - 0.5) * 34;
          const top = trunk(ctx, x, -66, -172, 3.2 + r() * 3, lean, SKY.trunk, 9220 + i);
          const fork = [x + lean * 0.55, -124];
          for (const s of [-1, 1]) curve(ctx, [fork, [fork[0] + s * (8 + r() * 10), -140], [fork[0] + s * (18 + r() * 18), -152 - r() * 14]], SKY.trunk, 1.6 + r());
          foliage(ctx, top[0], -164, 24 + r() * 12, 10 + r() * 6, 9240 + i, SKY.trunk, 6);
        }
        foliage(ctx, dx + 6, -166, 40, 14, 9260, SKY.trunk, 7);
      },
      (dx, r) => {
        for (let i = 0; i < 8; i++) shape(ctx, J.blobPts(dx + 20 + i * 42 + r() * 10, -72, 30 + r() * 14, 4 + r() * 2, 9265 + i, 10, 0.3), SKY.mist);
        const ground = [[dx, 0], [dx, -66], ...jag(dx + 8, dx + 312, -66, 3, 10, 9270), [dx + 320, -66], [dx + 320, 0]];
        shape(ctx, ground, SKY.band);
      },
      (dx, r) => {
        for (let i = 0; i < 4; i++) {
          const cx = dx + 40 + i * 80 + r() * 30;
          foliage(ctx, cx, -22, 22 + r() * 12, 16 + r() * 6, 9280 + i, UNDER[1], 8);
          foliage(ctx, cx - 4, -28, 14 + r() * 6, 9 + r() * 4, 9290 + i, UNDER[2], 5);
        }
      },
      (dx, r) => {
        for (let i = 0; i < 9; i++) {
          ctx.save();
          ctx.translate(dx + 8 + i * 36 + r() * 18, 0);
          J.fern(ctx, 0, 26 + r() * 22, 9300 + i, UNDER);
          ctx.restore();
        }
      },
      (dx, r) => {
        for (let i = 0; i < 6; i++) {
          const x = dx + 20 + i * 56 + r() * 20;
          const s = r() < 0.5 ? -1 : 1;
          const len = 30 + r() * 20;
          const tip = [x + s * len * 0.8, -len * 0.9];
          shape(ctx, [[x, 0], [x + s * len * 0.3, -len * 0.62], tip, [x + s * len * 0.42, -len * 0.5], [x + s * 4, 0]], UNDER[2]);
          line(ctx, [[x + s, 0], [x + s * len * 0.34, -len * 0.56], tip], UNDER[1], 0.6);
        }
        flat(ctx, dx, -4, 320, 4, UNDER[0]);
      },
    ];
    clipRect(ctx, 0, -170, 320, 170, () => {
      flat(ctx, 0, -170, 320, 170, SKY.air);
      layers.forEach((layer, k) => {
        for (const dx of [-320, 0, 320]) layer(dx, rng(9100 + k * 97));
      });
    });
  },
});

define({
  id: "farTrees",
  box: [0, -240, 96, 0],
  draw(ctx, state, _t, { w = 96, h = 240 } = {}) {
    const seed = 9400 + round(w * 7 + h * 3) + state * 11;
    const r = rng(seed);
    const n = max(1, round(w / 34));
    const trunks = [];
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) * w) / n + (r() - 0.5) * 10;
      const wd = 5 + r() * 5;
      const lean = (r() - 0.5) * 16;
      trunk(ctx, x, 0, -h, wd, lean, i % 2 ? FAR[0] : FAR[1], seed + i);
      trunks.push([x, wd, lean]);
      const fy = -h * (0.55 + r() * 0.2);
      for (const s of [-1, 1]) if (r() < 0.7) curve(ctx, [[x + lean * 0.6, fy], [x + lean * 0.6 + s * 8, fy - 14], [x + lean * 0.6 + s * (14 + r() * 8), fy - 30]], FAR[1], 2 + r());
    }
    G.inside(ctx, () => {
      ctx.beginPath();
      for (const [x, wd, lean] of trunks) ctx.rect(x - wd, -h, wd * 2 + abs(lean) + 4, h);
    }, () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 20, 0.5);
      G.drips(ctx, 0, -h * 0.6, w, h * 0.3, seed + 21, max(2, round(w / 20)), false);
    });
    for (let y = -h; y < -h * 0.4; y += 34) for (let x = 0; x < w + 10; x += 30 + r() * 10) if (r() < 0.75) foliage(ctx, x + (r() - 0.5) * 10, y + r() * 16, 18 + r() * 8, 10 + r() * 5, seed + round(x * 3 - y), r() < 0.6 ? FAR[3] : FAR[2], 6);
    if (state === 1) {
      for (let x = 4; x < w - 2; x += 8 + r() * 10) {
        const top = -h * (0.5 + r() * 0.4);
        const len = h * (0.25 + r() * 0.35);
        const pts = [];
        for (let k = 0; k <= 5; k++) pts.push([x + sin(k * 1.4 + x) * 2, top + (len * k) / 5]);
        curve(ctx, pts, FAR[0], 1.1);
        if (!simple()) for (let k = 1; k <= 5; k++) if (r() < 0.6) shape(ctx, J.blobPts(pts[k][0] + (r() - 0.5) * 3, pts[k][1], 2.4, 1.6, seed + round(x) + k, 6, 0.3), FAR[2]);
      }
    }
    const base = [rectPts(0, -3, w, 3)];
    for (let x = -4; x < w + 4; x += 12 + r() * 10) {
      const bw = 18 + r() * 14;
      const pts = [[x - bw / 2, 0], ...jag(x - bw / 2, x + bw / 2, -8 - r() * 8, 6, 4, seed + round(x) + 40), [x + bw / 2, 0]];
      shape(ctx, pts, FAR[1]);
      base.push(pts);
    }
    G.inside(ctx, G.polysRegion(ctx, base), () => G.dirt(ctx, 0, -20, w, 20, seed + 50, 0.6));
    flat(ctx, 0, -3, w, 3, FAR[0]);
  },
});
const ruinVines = (ctx, x0, x1, top, len, seed) => {
  const r = rng(seed);
  for (let x = x0 + 2; x < x1; x += 7 + r() * 12) {
    const l = len * (0.3 + r() * 0.7);
    const pts = [];
    for (let k = 0; k <= 5; k++) pts.push([x + sin(k * 1.3 + x) * 1.6, top + (l * k) / 5]);
    curve(ctx, pts, RUINF[3], 1);
    if (!simple()) for (let k = 1; k <= 5; k++) if (r() < 0.5) shape(ctx, J.blobPts(pts[k][0], pts[k][1], 2.2, 1.5, seed + round(x) + k, 6, 0.3), RUINF[3]);
  }
};
define({
  id: "farTowerRuin",
  box: [0, -288, 72, 0],
  draw(ctx, state, _t, { w = 72, h = 288 } = {}) {
    const seed = 9600 + round(w * 5 + h * 7) + state * 13;
    const r = rng(seed);
    if (state === 0) {
      const top = h * 0.82;
      const a = w * 0.14;
      const b = w * 0.36;
      const legs = [[a, 0, b, -top], [w - a, 0, w - b, -top]];
      for (const [x0, y0, x1, y1] of legs) line(ctx, [[x0, y0], [x1, y1]], RUINF[2], 3.2, "butt");
      const n = max(3, round(top / 36));
      for (let k = 0; k < n; k++) {
        const u0 = k / n;
        const u1 = (k + 1) / n;
        const lx0 = a + (b - a) * u0;
        const lx1 = a + (b - a) * u1;
        const rx0 = w - lx0;
        const rx1 = w - lx1;
        const y0 = -top * u0;
        const y1 = -top * u1;
        if (k === 2 && r() < 0.8) {
          line(ctx, [[lx0, y0], [lx0 + (rx1 - lx0) * 0.45, y0 + (y1 - y0) * 0.3]], RUINF[1], 1.4);
        } else {
          line(ctx, [[lx0, y0], [rx1, y1]], RUINF[1], 1.4);
          line(ctx, [[rx0, y0], [lx1, y1]], RUINF[1], 1.4);
        }
        line(ctx, [[lx1, y1], [rx1, y1]], RUINF[2], 1.8);
      }
      const cab = [[b - 6, -top], [b - 6, -top - 22], [w * 0.5, -top - 30], ...jag(w * 0.5, w - b + 6, -top - 26, 8, 4, seed + 1), [w - b + 6, -top]];
      shape(ctx, cab, RUINF[2]);
      G.grain(ctx, G.polyRegion(ctx, cab), seed + 2, 0.5);
      flat(ctx, b - 2, -top - 16, 8, 7, RUINF[0]);
      flat(ctx, w - b - 8, -top - 15, 6, 6, RUINF[0]);
      line(ctx, [[w * 0.5 - 2, -top - 30], [w * 0.5 + 6, -h + 4]], RUINF[2], 1.4);
      G.drips(ctx, b - 6, -top - 20, w - 2 * b + 12, 30, seed + 3, 3, false);
      G.dirt(ctx, 0, -top, w, top, seed + 4, 0.2);
      ruinVines(ctx, b - 6, w - b + 6, -top, top * 0.45, seed + 5);
      for (const [x0, , x1, y1] of legs) {
        const pts = [];
        for (let k = 0; k <= 6; k++) pts.push([x1 + (x0 - x1) * (k / 6) + sin(k * 2.1) * 2.5, y1 + (-y1 * k) / 6]);
        curve(ctx, pts, RUINF[3], 1.2);
      }
    } else {
      const bh = h * 0.42;
      const roof = [[0, -bh * 0.78], ...jag(0, w * 0.45, -bh, 10, 5, seed + 6), [w * 0.55, -bh * 0.7], ...jag(w * 0.55, w, -bh * 0.55, 8, 5, seed + 7)];
      const out = [[0, 0], ...roof, [w, 0]];
      shape(ctx, out, RUINF[2]);
      const windows = [];
      clipPts(ctx, out, () => {
        flat(ctx, 0, -bh, 5, bh, RUINF[3]);
        flat(ctx, w - 6, -bh, 6, bh, RUINF[1]);
        flat(ctx, 0, -bh * 0.5, w, 2, RUINF[3]);
        for (let x = 8; x < w - 12; x += 20) {
          flat(ctx, x, -bh * 0.42, 12, 10, RUINF[0]);
          windows.push(rectPts(x, -bh * 0.42, 12, 10));
          if (!simple()) for (let bx = x + 3; bx < x + 12; bx += 3) flat(ctx, bx, -bh * 0.42, 0.8, 10, RUINF[2]);
        }
        G.inside(ctx, null, () => {
          G.grain(ctx, G.polyRegion(ctx, out), seed + 8, 0.5);
          G.drips(ctx, 0, -bh * 0.7, w, bh * 0.4, seed + 9, round(w / 12), false);
          G.dirt(ctx, 0, -bh, w, bh, seed + 10, 0.35);
        }, windows);
      });
      const hole = J.blobPts(w * 0.62, -bh * 0.3, 9, 8, seed + 11, 10, 0.3);
      clipPts(ctx, out, () => G.inside(ctx, null, () => G.scorch(ctx, hole, seed + 12), windows));
      shape(ctx, hole, RUINF[0]);
      G.rim(ctx, hole, seed + 13, RUINF[3], RUINF[0]);
      const tx = w * 0.3;
      const ty = -bh * 0.9;
      const crown = ty - min(70, h * 0.25);
      trunk(ctx, tx, ty + 4, crown, 4, 8, RUINF[1], seed + 14);
      curve(ctx, [[tx + 3, crown + 24], [tx - 8, crown + 10], [tx - 16, crown + 4]], RUINF[1], 2);
      foliage(ctx, tx + 6, crown, w * 0.42, 22, seed + 15, RUINF[2], 9);
      foliage(ctx, tx + 2, crown - 6, w * 0.25, 12, seed + 16, RUINF[3], 5);
      ruinVines(ctx, 0, w, -bh * 0.75, bh * 0.6, seed + 17);
    }
    for (let x = 0; x < w; x += 14 + r() * 10) {
      const bw = 16 + r() * 10;
      shape(ctx, [[x - bw / 2, 0], ...jag(x - bw / 2, x + bw / 2, -6 - r() * 8, 5, 4, seed + 40 + round(x)), [x + bw / 2, 0]], RUINF[1]);
    }
  },
});

define({
  id: "cobbleFill",
  box: [0, -48, 48, 0],
  draw(ctx, state, _t, { w = 48, h = 48, at = [0, 0] } = {}) {
    const [ax, ay] = at;
    clipRect(ctx, 0, -h, w, h, () => {
      ctx.save();
      ctx.translate(-ax, -ay);
      cobbleField(ctx, ax, ay - h, w, h, state === 1, COBBLE_SEED);
      ctx.restore();
    });
  },
});

const xPlate = (ctx, x, y, w, h, s) => {
  const r = rng(s);
  flat(ctx, x, y, w, h, XPLATE[2]);
  clipRect(ctx, x, y, w, h, () => {
    const bar = w * 0.2;
    for (const [ax, ay, bx, by] of [[x, y, x + w, y + h], [x + w, y, x, y + h]]) {
      line(ctx, [[ax, ay], [bx, by]], XPLATE[1], bar, "butt");
      if (!simple()) line(ctx, [[ax, ay - bar * 0.35], [bx, by - bar * 0.35]], XPLATE[3], bar * 0.22, "butt");
    }
    shape(ctx, [[x + w / 2, y + h * 0.34], [x + w * 0.66, y + h / 2], [x + w / 2, y + h * 0.66], [x + w * 0.34, y + h / 2]], XPLATE[0]);
  });
  flat(ctx, x, y, w, 1.2, XPLATE[3]);
  flat(ctx, x, y + h - 1.4, w, 1.4, XPLATE[0]);
  flat(ctx, x + 1, y, 2.4, h, BOLT[0]);
  flat(ctx, x + 1.4, y, 1.2, h, BRASS[2]);
  if (!simple()) for (let by = y + 3; by < y + h - 1; by += 5) flat(ctx, x + 1.4, by, 1.4, 1.4, BOLT[2]);
  edge(ctx, x, y, w, h, J.CLINE);
  if (r() < 0.4) G.rustPatch(ctx, x + w * (0.3 + r() * 0.4), y + h * 0.7, 2.4, 1.2, s + 1);
};
const stoneBlock = (ctx, x, y, w, h, s) => {
  const r = rng(s);
  flat(ctx, x, y, w, h, BLOCK[1]);
  clipRect(ctx, x, y, w, h, () => {
    for (let k = 0; k < (simple() ? 2 : 5); k++) shape(ctx, J.blobPts(x + r() * w, y + r() * h, 3 + r() * 4, 2 + r() * 3, s + k, 8, 0.35), k % 2 ? BLOCK[2] : BLOCK[0]);
    if (!simple()) for (let k = 0; k < 3; k++) shape(ctx, J.blobPts(x + r() * w, y + r() * h * 0.6, 1.5 + r() * 2, 1 + r(), s + 10 + k, 7, 0.3), BLOCK[3]);
  });
  flat(ctx, x, y, w, 1.4, BLOCK[3]);
  flat(ctx, x, y + h - 1.6, w, 1.6, BLOCK[0]);
  edge(ctx, x, y, w, h, J.CLINE);
};
const beads = (ctx, x, y, w) => {
  flat(ctx, x, y, w, 3.2, BEAD[0]);
  if (simple()) {
    flat(ctx, x, y + 0.8, w, 1.6, BEAD[1]);
    return;
  }
  for (let bx = x + 0.4; bx < x + w - 0.6; bx += 2.4) {
    flat(ctx, bx, y + 0.6, 1.6, 2, (round(bx / 2.4) % 4) ? BEAD[1] : BEAD[2]);
    flat(ctx, bx + 0.2, y + 0.6, 1.2, 0.6, BEAD[2]);
  }
  flat(ctx, x, y + 2.6, w, 0.6, BEAD[3]);
};
const hangBoulders = (ctx, w, seed) => {
  eachCell(ctx, 0, 22, w, 24, 24, 24, (x, _y, i) => {
    const r = rng(seed + i * 41);
    const cx = x + 12 + (r() - 0.5) * 3;
    const rx = 13.5 + r() * 2;
    const ry = 7.5 + r() * 2.5;
    J.stone(ctx, cx, 24 + ry * 0.7, rx, ry, seed + i * 41 + 1, BOULD);
    if (!simple() && r() < 0.35) line(ctx, [[cx - 2, 24], [cx + 1, 30], [cx - 1, 34]], BOULD[0], 0.6);
  }, 14);
};
const caveBand = (ctx, w, seed) => {
  flat(ctx, 0, 24, w, 18, CAVE[1]);
  flat(ctx, 0, 24, w, 1.2, CAVE[0]);
  flat(ctx, 0, 27.4, w, 1, CAVE[2]);
  if (!simple()) flat(ctx, 0, 27.4, w, 0.4, CAVE[3]);
  eachCell(ctx, 0, 24, w, 18, 24, 18, (x, _y, i) => {
    const r = rng(seed + i * 29);
    if (i % 2 === 0) {
      flat(ctx, x + 6, 30, 12, 5, BOULD[1], J.CLINE);
      if (!simple()) for (let ly = 31; ly < 35; ly += 1.6) flat(ctx, x + 7, ly, 10, 0.7, BOULD[3]);
    }
    if (r() < 0.4) line(ctx, [[x + 4 + r() * 16, 28], [x + 4 + r() * 16, 36 + r() * 5]], CAVE[2], 0.6);
  });
  G.grain(ctx, G.rectRegion(ctx, 0, 24, w, 18), seed + 1, 0.6);
  G.drips(ctx, 0, 28, w, 10, seed + 2, max(1, round(w / 30)), false);
  ctx.save();
  ctx.globalAlpha = 0.5;
  flat(ctx, 0, 38, w, 4, CAVE[0]);
  ctx.restore();
};
const walkway = (ctx, state, w) => {
  const seed = 9800 + state * 7;
  if (state === 0) hangBoulders(ctx, w, seed + 100);
  if (state === 1) caveBand(ctx, w, seed + 200);
  flat(ctx, 0, 15, w, 9, CAVE[1]);
  eachCell(ctx, 0, 0, w, 24, 24, 24, (x, _y, i) => {
    const s = seed + i * 37;
    if (i % 2 === 0) {
      xPlate(ctx, x, 0, 24, 15, s);
      flat(ctx, x + 4, 18, 14, 6, XPLATE[2], J.CLINE);
      if (!simple()) {
        flat(ctx, x + 4.6, 18.6, 12.8, 1, XPLATE[3]);
        flat(ctx, x + 10, 20, 2, 2, BOLT[1]);
      }
    } else stoneBlock(ctx, x, 0, 24, 15, s);
  });
  beads(ctx, 0, 15, w);
  if (!simple()) eachCell(ctx, 0, 21, w, 3, 12, 3, (x, _y, i) => i % 2 && flat(ctx, x + 2, 21.6, 6, 1, CAVE[2]));
  G.grain(ctx, G.rectRegion(ctx, 0, 0, w, 24), seed + 1);
  G.chips(ctx, 0, 0.4, w, seed + 2, G.DIRT);
  G.drips(ctx, 0, 18, w, 5, seed + 3, max(1, round(w / 30)), false);
  G.dirt(ctx, 0, 4, w, 11, seed + 4, 0.4);
  eachCell(ctx, 0, 0, w, 24, 72, 24, (x, _y, i) => {
    const r = rng(seed + 50 + i);
    const mx = x + r() * 50;
    if (r() < 0.55 && mx < w - 4) J.mossCap(ctx, mx, 0, min(6 + r() * 14, w - mx), seed + 51 + i, 2);
    const gx = x + 20 + r() * 40;
    if (state !== 1 && r() < 0.4 && gx < w - 6) J.grass(ctx, gx, min(4 + r() * 6, w - gx), 4, seed + 52 + i);
  });
};
define({
  id: "jungleWalkway",
  box: [0, -6, 120, 48],
  draw(ctx, state, _t, { w = 120 } = {}) {
    walkway(ctx, state, w);
  },
});

define({
  id: "caveWalkway",
  box: [0, -6, 120, 48],
  draw(ctx, _state, _t, { w = 120 } = {}) {
    walkway(ctx, 1, w);
  },
});

define({
  id: "plankBridge",
  box: [0, -24, 120, 6],
  draw(ctx, _state, _t, { w = 120 } = {}) {
    const seed = 9900 + round(w);
    flat(ctx, 0, -24, w, 3, WOOD[4], J.CLINE);
    if (!simple()) flat(ctx, 0, -24, w, 0.8, WOOD[5]);
    flat(ctx, 0, -21, w, 12, WOOD[2]);
    eachCell(ctx, 0, -21, w, 12, 12, 12, (x, _y, i) => {
      const r = rng(seed + i * 17);
      flat(ctx, x + 1.4, -19.6, 9.2, 9, WOOD[1], J.CLINE);
      flat(ctx, x + 2.2, -18.8, 7.6, 1, WOOD[0]);
      flat(ctx, x + 2.2, -11.6, 7.6, 1, WOOD[3]);
      disc(ctx, x + 6, -15, 1.9, BOLT[1], J.CLINE);
      if (!simple()) disc(ctx, x + 5.5, -15.5, 0.7, BOLT[2]);
      flat(ctx, x, -21, 0.8, 12, WOOD[0]);
      if (r() < 0.3) G.rustPatch(ctx, x + 6, -13, 2.4, 1.3, seed + i * 17 + 1);
    });
    flat(ctx, 0, -9, w, 4, WOOD[3], J.CLINE);
    flat(ctx, 0, -5, w, 3.2, WOOD[4], J.CLINE);
    if (!simple()) {
      flat(ctx, 0, -9, w, 0.7, WOOD[5]);
      eachCell(ctx, 0, -9, w, 7, 30, 7, (x, _y, i) => {
        const r = rng(seed + 300 + i);
        line(ctx, [[x + r() * 6, -7], [x + 12 + r() * 14, -7.2]], WOOD[2], 0.5);
        line(ctx, [[x + 4 + r() * 10, -3.4], [x + 18 + r() * 10, -3.2]], WOOD[1], 0.5);
        flat(ctx, x + 29, -9, 0.8, 7.2, WOOD[0]);
      });
    }
    flat(ctx, 0, -1.8, w, 1.8, WOOD[0]);
    G.grain(ctx, G.rectRegion(ctx, 0, -24, w, 24), seed + 1);
    G.chips(ctx, 0, -23.6, w, seed + 2, G.DIRT);
    G.drips(ctx, 0, -9, w, 12, seed + 3, max(1, round(w / 20)));
    G.dirt(ctx, 0, -21, w, 12, seed + 4, 0.35);
    eachCell(ctx, 0, -24, w, 24, 60, 24, (x, _y, i) => {
      const r = rng(seed + 60 + i);
      const mx = x + r() * 40;
      if (r() < 0.5 && mx < w - 4) J.mossCap(ctx, mx, -24, min(6 + r() * 12, w - mx), seed + 61 + i, 1.6);
      const vx = x + 10 + r() * 40;
      if (!simple() && r() < 0.35 && vx < w - 6) J.vine(ctx, vx, -2, 6 + r() * 6, seed + 62 + i);
    });
    for (const x of [0, w - 5]) {
      flat(ctx, x, -24, 5, 24, PANEL[2], J.CLINE);
      flat(ctx, x + 0.8, -24, 1.4, 24, PANEL[3]);
      flat(ctx, x + 3.6, -24, 1.4, 24, PANEL[1]);
      G.surface(ctx, x, -24, 5, 24, seed + 70 + x, { rise: 0.4, drip: 1, dripLen: 10, edge: false });
    }
  },
});

define({
  id: "brassDeck",
  box: [0, -24, 120, 25],
  draw(ctx, _state, _t, { w = 120 } = {}) {
    const seed = 10000 + round(w);
    flat(ctx, 0, -24, w, 48, PANEL[0]);
    flat(ctx, 0, -24, w, 3, CAVE[1], J.CLINE);
    if (!simple()) flat(ctx, 0, -24, w, 0.8, PANEL[3]);
    const bracket = (x, y, h) => {
      flat(ctx, x + 3.4, y + 3.4, 20.6, h - 3.4, PANEL[1]);
      flat(ctx, x + 3.4, y + 3.4, 20.6, 1.2, PANEL[2]);
      flat(ctx, x, y, 24, 3.4, BRASS[2], J.CLINE);
      flat(ctx, x, y, 3.4, h, BRASS[2], J.CLINE);
      flat(ctx, x, y, 24, 0.9, BRASS[3]);
      flat(ctx, x, y, 0.9, h, BRASS[3]);
      flat(ctx, x, y + 2.6, 24, 0.8, BRASS[0]);
      flat(ctx, x + 2.6, y, 0.8, h, BRASS[0]);
    };
    eachCell(ctx, 0, -21, w, 45, 24, 45, (x, _y, i) => {
      const r = rng(seed + i * 23);
      bracket(x, -21, 13);
      flat(ctx, x, -8, 24, 5, PANEL[2], J.CLINE);
      if (!simple()) flat(ctx, x, -8, 24, 0.8, PANEL[3]);
      if (i % 2 === 1) {
        flat(ctx, x + 7, -7.6, 5, 4.2, PANEL[0]);
        edge(ctx, x + 7, -7.6, 5, 4.2, LAMP);
        flat(ctx, x + 8.2, -6.6, 2.6, 2.2, "#bcc4b0");
      }
      flat(ctx, x, -3, 24, 3, PANEL[0]);
      bracket(x, 0, 14);
      flat(ctx, x + 1, 14, 3, 10, PANEL[0], J.CLINE);
      flat(ctx, x + 14, 14, 3, 10, PANEL[0], J.CLINE);
      flat(ctx, x + 4, 15, 10, 9, PANEL[1]);
      if (!simple()) flat(ctx, x + 4, 15, 10, 0.8, PANEL[2]);
      if (r() < 0.45) G.rustPatch(ctx, x + 4 + r() * 16, -14 + r() * 20, 2.6, 1.4, seed + i * 23 + 1);
      if (r() < 0.4) G.drips(ctx, x + 2, -18, 20, 8, seed + i * 23 + 2, 1);
    });
    G.grain(ctx, G.rectRegion(ctx, 0, -24, w, 48), seed + 1);
    G.chips(ctx, 0, -23.6, w, seed + 2, G.DIRT);
    G.dirt(ctx, 0, 0, w, 24, seed + 3, 0.5);
    G.drips(ctx, 0, -3, w, 10, seed + 4, max(1, round(w / 30)));
    eachCell(ctx, 0, -24, w, 24, 72, 24, (x, _y, i) => {
      const r = rng(seed + 80 + i);
      const mx = x + r() * 50;
      if (r() < 0.4 && mx < w - 4) J.mossCap(ctx, mx, -24, min(6 + r() * 10, w - mx), seed + 81 + i, 1.6);
    });
  },
});

const columnCell = (ctx, x, y, w, s, top) => {
  const r = rng(s);
  flat(ctx, x, y, w, 24, XPLATE[2]);
  clipRect(ctx, x, y + 2, w, 19, () => {
    const bar = w * 0.28;
    for (const [ax, bx] of [[x + 3, x + w - 3], [x + w - 3, x + 3]]) {
      line(ctx, [[ax, y + 2], [(ax + bx) / 2, y + 11.5], [ax, y + 21]], XPLATE[1], bar, "butt");
      if (!simple()) line(ctx, [[ax, y + 1], [(ax + bx) / 2 + (bx > ax ? -0.6 : 0.6), y + 10.5], [ax, y + 20]], XPLATE[3], bar * 0.22, "butt");
    }
  });
  flat(ctx, x, y, w, 2, XPLATE[0]);
  if (top) flat(ctx, x - 1, y, w + 2, 2.4, COLLAR[1], J.CLINE);
  flat(ctx, x, y + 21, w, 3, COLLAR[1], J.CLINE);
  if (!simple()) {
    flat(ctx, x, y + 21, w, 0.8, COLLAR[2]);
    flat(ctx, x, y + 22.6, w, 0.8, COLLAR[0]);
    for (const bx of [x + 1.4, x + w - 2.8]) for (let by = y + 4; by < y + 20; by += 5) flat(ctx, bx, by, 1.4, 1.4, BOLT[1]);
  }
  edge(ctx, x, y, w, 24, J.CLINE);
  if (r() < 0.2) G.rustPatch(ctx, x + w * 0.5, y + 14, 2.2, 1.2, s + 1);
  G.drips(ctx, x + 1, y + 2, w - 2, 12, s + 2, 1, r() < 0.3);
};
const footBlock = (ctx, x, y, w, s) => {
  flat(ctx, x, y, w, 24, FOOT[1]);
  clipRect(ctx, x, y + 6, w, 18, () => {
    line(ctx, [[x, y + 6], [x + w, y + 24]], FOOT[0], 3.4, "butt");
    line(ctx, [[x + w, y + 6], [x, y + 24]], FOOT[0], 3.4, "butt");
    if (!simple()) line(ctx, [[x, y + 5], [x + w, y + 23]], FOOT[3], 0.8, "butt");
  });
  flat(ctx, x, y + 6, w * 0.22, 18, FOOT[2]);
  flat(ctx, x + w * 0.2, y + 0.6, w * 0.6, 5, BRASS[1], J.CLINE);
  if (!simple()) for (let gx = x + w * 0.24; gx < x + w * 0.78; gx += 2) flat(ctx, gx, y + 1.4, 0.9, 3.4, BRASS[3]);
  edge(ctx, x, y, w, 24, J.CLINE);
  G.surface(ctx, x, y, w, 24, s, { rise: 0.6, drip: 1, dripLen: 10, edge: false });
};
define({
  id: "girderColumn",
  box: [0, -96, 24, 0],
  draw(ctx, state, _t, { h = state === 1 ? 24 : 96 } = {}) {
    const seed = 10100 + state * 9;
    const n = max(1, round(h / 24));
    const w = state === 1 ? 18 : 24;
    const x = (24 - w) / 2;
    for (let k = 0; k < n; k++) {
      const y = -h + k * 24;
      const last = k === n - 1;
      if (last && state === 0 && n > 1) footBlock(ctx, x, y, w, seed + k);
      else columnCell(ctx, x, y, w, seed + k * 13, k === 0 && state === 1);
    }
    G.grain(ctx, G.rectRegion(ctx, x, -h, w, h), seed + 1, 0.5);
    G.dirt(ctx, x, -h, w, h, seed + 2, min(0.3, 40 / h));
    if (state === 1) {
      flat(ctx, x - 2, -2, w + 4, 2, XPLATE[0], J.CLINE);
      J.grass(ctx, x - 3, w + 6, 4, seed + 3);
    }
  },
});

define({
  id: "stoneParapet",
  box: [0, -96, 144, 0],
  draw(ctx, state, _t, { w = state === 1 ? 24 : 144, h = state === 1 ? 96 : 48 } = {}) {
    const seed = 10300 + state * 11;
    const n = max(1, round(h / 24));
    const cw = state === 1 ? w : 24;
    clipRect(ctx, 0, -h, w, h, () => {
      for (let j = 0; j < n; j++) {
        const y = -h + j * 24;
        const off = state === 0 && j % 2 ? 12 : 0;
        eachCell(ctx, -off, y, w + off, 20, cw, 20, (x, _y, i) => stoneBlock(ctx, x, y, cw, 20, cellSeed(seed, i, j)));
        beads(ctx, 0, y + 20, w);
        flat(ctx, 0, y + 23.2, w, 0.8, CAVE[0]);
      }
    });
    edge(ctx, 0, -h, w, h, J.CLINE);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 0.6);
    G.drips(ctx, 0, -h + 20, w, h - 20, seed + 2, max(1, round(w / 20)), false);
    G.dirt(ctx, 0, -h, w, h, seed + 3, 0.35);
    G.chips(ctx, 0, -h + 0.4, w, seed + 4, G.DIRT);
    eachCell(ctx, 0, -h, w, 2, 48, 2, (x, _y, i) => {
      const r = rng(seed + 50 + i);
      const mx = x + r() * 24;
      if (mx < w - 4) J.mossCap(ctx, mx, -h, min(8 + r() * 16, w - mx), seed + 51 + i, 2.4);
    });
    if (state === 0) J.grass(ctx, 1, min(10, w - 2), 4, seed + 5);
  },
});

const BRICK_W = 8;
const BRICK_H = 4;
define({
  id: "brickRuin",
  box: [0, -120, 120, 0],
  draw(ctx, state, _t, { w = 120, h = 120 } = {}) {
    const seed = 10200 + state * 17 + round(w + h * 3);
    const r = rng(seed);
    const cols = ceil(w / (BRICK_W / 2));
    const tops = [];
    for (let c = 0; c <= cols; c++) {
      const u = c / cols;
      const f = state === 0 ? 0.12 + 0.88 * min(1, max(0, (u - 0.15) / 0.7)) ** 1.3 : 0.18 + 0.12 * sin(u * 7 + seed);
      tops.push(-round((h * f) / BRICK_H) * BRICK_H - floor(r() * 2) * BRICK_H);
    }
    const pts = [[0, 0]];
    tops.forEach((y, c) => {
      const x = min(w, c * (BRICK_W / 2));
      pts.push([x, y], [min(w, x + BRICK_W / 2), y]);
    });
    pts.push([w, 0]);
    shape(ctx, pts, BRICK[0]);
    clipPts(ctx, pts, () => {
      const top = min(...tops);
      eachCell(ctx, 0, top, w, -top, BRICK_W, BRICK_H, (x, y, i, j) => {
        const row = round((y - top) / BRICK_H) + round(top / BRICK_H);
        const off = wrap(row, 2) ? BRICK_W / 2 : 0;
        for (const bx of [x - off, x - off + BRICK_W]) {
          const rr = rng(cellSeed(seed, round(bx / 6), row));
          const k = rr();
          const c = k < 0.4 ? BRICK[1] : k < 0.75 ? BRICK[2] : BRICK[3];
          flat(ctx, bx + 0.5, y + 0.5, BRICK_W - 1, BRICK_H - 1, c);
          if (!simple()) {
            flat(ctx, bx + 0.6, y + 0.6, BRICK_W - 1.2, 0.6, k < 0.75 ? BRICK[3] : BRICK[4]);
          }
          if (rr() < 0.07) flat(ctx, bx + 0.6, y + 0.6, BRICK_W - 1.2, BRICK_H - 1.2, "#140c08");
        }
      }, BRICK_W);
      G.grain(ctx, G.polyRegion(ctx, pts), seed + 1);
      G.dirt(ctx, 0, top, w, -top, seed + 2, min(0.45, 60 / -top));
      G.drips(ctx, 0, top, w, -top * 0.5, seed + 3, max(2, round(w / 14)), false);
      const blot = J.blobPts(w * (0.4 + r() * 0.3), -min(-top, h) * 0.45, w * 0.12, h * 0.08, seed + 4, 10, 0.35);
      G.scorch(ctx, blot, seed + 5);
      if (state === 0) {
        const hole = J.blobPts(w * 0.72, -h * 0.55, 7, 5, seed + 6, 9, 0.3);
        G.scorch(ctx, hole, seed + 7);
        shape(ctx, hole, "#0a0806");
        G.rim(ctx, hole, seed + 8, BRICK[4], BRICK[0]);
      }
    });
    path(ctx, pts);
    stroke(ctx, J.CLINE);
    tops.forEach((y, c) => {
      const x = c * (BRICK_W / 2);
      if (x >= w) return;
      G.chips(ctx, x, y + 0.4, min(BRICK_W / 2, w - x), seed + 20 + c, G.DUST);
      if (rng(seed + 30 + c)() < 0.25) J.mossCap(ctx, x, y, BRICK_W / 2, seed + 31 + c, 1.6);
    });
    for (let k = 0; k < round(w / 24); k++) {
      const bx = r() * w * (state === 0 ? 0.5 : 1);
      const by = -1.6 - r() * 3;
      const a = (r() - 0.5) * 0.8;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(a);
      flat(ctx, -5, -2.2, 10, 4.4, r() < 0.5 ? BRICK[2] : BRICK[1], J.CLINE);
      ctx.restore();
    }
    J.grass(ctx, 0, w, 5, seed + 40);
  },
});

define({
  id: "caveChasm",
  box: [0, -240, 96, 0],
  draw(ctx, _state, _t, { w = 96, h = 240 } = {}) {
    clipRect(ctx, 0, -h, w, h, () => {
      const bands = ["#0b0f0c", "#080b09", "#050706", "#030404", "#020202"];
      const step = h / bands.length;
      bands.forEach((c, i) => flat(ctx, 0, -h + i * step, w, step + 0.5, c));
      const seed = 660 + round(w);
      const r = rng(seed);
      if (!simple()) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        for (let y = -h + 6; y < -h + 60; y += 9) shape(ctx, J.blobPts(w * (0.3 + r() * 0.4), y, w * 0.25, 4, 661 + round(y), 8, 0.4), "#5c7468");
        ctx.restore();
        for (let i = 0; i < 4; i++) flat(ctx, w * 0.25 + w * 0.5 * r(), -h, 0.8, 10 + r() * 30, "#24302a");
      }
      for (const side of [0, 1]) {
        const pts = [];
        for (let y = -h; y < 0; y += TILE / 2) {
          const d = 4 + rng(seed + side * 50 + round(y))() * 12;
          const ex = side ? w - d : d;
          pts.push([ex, y], [ex, y + TILE / 2]);
        }
        const lip = side ? [[w, -h], ...pts, [w, 0]] : [[0, -h], ...pts, [0, 0]];
        clipPts(ctx, lip, () => cobbleField(ctx, side ? w - TILE : 0, -h, TILE, h, side === 1, COBBLE_SEED + 40 + side));
        ctx.save();
        ctx.globalAlpha = 0.6;
        for (let k = 0; k < pts.length; k += 2) {
          const [ex, ey] = pts[k];
          flat(ctx, side ? ex - 2.4 : ex, ey, 2.4, TILE / 2, "#020202");
        }
        ctx.restore();
        G.inside(ctx, G.polyRegion(ctx, lip), () => G.dirt(ctx, side ? w - 20 : 0, -h, 20, h, seed + 70 + side, 0.15));
      }
    });
  },
});
})();

(() => {
const { define, P, G } = window.ENV;
const J = window.ENV.jungle;
const { rng, path, flat, shape, line, curve, disc, stroke } = P;
const { PI, sin, cos, min, max, round, floor, hypot, atan2, abs } = Math;
const { SLINE, CLINE, MOSS, LEAF, blobPts, mossCap, leafBlob, fern, grass, vine } = J;

const simple = () => window.ENV.simple;

const CONC = ["#2a3228", "#3c483c", "#545448", "#606054", "#76766a"];
const ROOF = ["#1e140c", "#36241a", "#483024", "#64442e"];
const GLASS = "#000c0c";
const BARS = "#c8ccc4";
const STEEL = ["#1c2424", "#303c3c", "#546060", "#748080", "#a8b4b4"];
const IRON = ["#241c0e", "#483c24", "#604824", "#6c6030", "#8c7c48"];
const BRACE = ["#341c0c", "#6c3c18", "#8c5428"];
const TEAL = ["#0a241e", "#18483c", "#2a6458", "#3c8478"];
const BRASS = ["#3a2610", "#6c4c28", "#9c6c3c", "#e4c048"];
const POST = ["#141c1a", "#243030", "#3c483c", "#546060"];
const ROCK = ["#303024", "#5a5246", "#786c60", "#84786c", "#9c9884"];
const CAVE = ["#121a10", "#1e2a1c", "#30402c", "#435440", "#566a50"];
const GAP = "#242424";
const WOOD = ["#18180c", "#483018", "#604824", "#7c6034"];
const CUT = ["#5c4a30", "#9c846c", "#b8a47c"];
const BEAD = ["#241a0c", "#a8641c", "#e8b040"];
const PLATE = ["#2a2010", "#3c3018", "#54442a"];

const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

function barPts([ax, ay], [bx, by], w) {
  const l = hypot(bx - ax, by - ay) || 1;
  const nx = (-(by - ay) / l) * w / 2, ny = ((bx - ax) / l) * w / 2;
  return [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]];
}

function bar(ctx, a, b, w, T) {
  line(ctx, [a, b], CLINE, w + 1, "butt");
  line(ctx, [a, b], T[1], w, "butt");
  if (!simple()) line(ctx, [[a[0], a[1] - w * 0.2], [b[0], b[1] - w * 0.2]], T[2], w * 0.35, "butt");
}

function rail(ctx, pts, w, T) {
  line(ctx, pts, T[0], w + 1, "butt");
  line(ctx, pts, T[2], w, "butt");
  if (!simple()) line(ctx, pts.map(([x, y]) => [x, y - w * 0.25]), T[3], w * 0.3, "butt");
}

function rock(ctx, cx, cy, rx, ry, seed, T = ROCK) {
  const pts = blobPts(cx, cy, rx, ry, seed, 10, 0.14);
  shape(ctx, pts, T[1]);
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  shape(ctx, blobPts(cx - rx * 0.1, cy - ry * 0.14, rx * 0.86, ry * 0.74, seed + 1, 9, 0.16), T[2]);
  shape(ctx, blobPts(cx - rx * 0.28, cy - ry * 0.38, rx * 0.52, ry * 0.36, seed + 2, 8, 0.2), T[3]);
  if (!simple()) shape(ctx, blobPts(cx - rx * 0.4, cy - ry * 0.56, rx * 0.24, ry * 0.14, seed + 3, 6, 0.2), T[4]);
  flat(ctx, cx - rx * 1.2, cy + ry * 0.58, rx * 2.4, ry, T[0]);
  ctx.restore();
  path(ctx, pts);
  stroke(ctx, SLINE);
  return pts;
}

function flatStone(ctx, x, y, w, h, seed, T = ROCK) {
  const r = rng(seed);
  const c = min(8, h * 0.3, w * 0.2);
  const pts = [[x + c, y + r()], [x + w * 0.5, y], [x + w - c - r() * 2, y + r()], [x + w, y + c + r() * 2], [x + w - r(), y + h - c], [x + w - c, y + h], [x + c + r() * 2, y + h - r()], [x, y + h - c], [x + r(), y + c]];
  shape(ctx, pts, T[2]);
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  flat(ctx, x - 2, y - 2, w + 4, h * 0.38, T[3]);
  if (!simple()) {
    flat(ctx, x - 2, y - 2, w * 0.45, 3.4, T[4]);
    const cx = x + w * (0.25 + r() * 0.5);
    line(ctx, [[cx, y + h * 0.3], [cx + (r() - 0.5) * 5, y + h * 0.65], [cx + (r() - 0.5) * 6, y + h]], T[0], 0.7);
  }
  flat(ctx, x - 2, y + h * 0.66, w + 4, h * 0.4, T[1]);
  flat(ctx, x - 2, y + h * 0.88, w + 4, h * 0.2, T[0]);
  ctx.restore();
  path(ctx, pts);
  stroke(ctx, SLINE);
  return pts;
}

function ledge(ctx, x, y, w, h, seed, T = ROCK) {
  const r = rng(seed);
  const pts = [[x + 1, y], [x + w - 2, y + r() * 0.6], [x + w, y + 2.4], [x + w - 2 - r() * 3, y + h * 0.7], [x + w - 7 - r() * 4, y + h], [x + w * 0.55, y + h - 1 - r() * 2], [x + w * 0.3, y + h], [x + 4 + r() * 3, y + h - r() * 2], [x, y + h * 0.45], [x - 0.6, y + 2]];
  shape(ctx, pts, T[2]);
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  flat(ctx, x - 2, y, w + 4, h * 0.3, T[3]);
  if (!simple()) {
    flat(ctx, x - 2, y + 3, w + 4, 1.1, T[4]);
    for (let k = 0; k < max(1, round(w / 24)); k++) {
      const cx = x + w * (0.1 + r() * 0.8);
      line(ctx, [[cx, y + h * 0.35], [cx + (r() - 0.5) * 5, y + h * (0.65 + r() * 0.3)]], T[0], 0.7);
    }
  }
  flat(ctx, x - 2, y + h * 0.6, w + 4, h * 0.42, T[1]);
  flat(ctx, x - 2, y + h * 0.84, w + 4, h * 0.3, T[0]);
  ctx.restore();
  path(ctx, pts);
  stroke(ctx, SLINE);
  beads(ctx, x + 1, y - 0.4, w - 3);
  return pts;
}

function beads(ctx, x, y, w) {
  flat(ctx, x, y, w, 2.6, BEAD[0]);
  for (let bx = x + 1.5; bx < x + w - 0.8; bx += 3) {
    flat(ctx, bx - 0.9, y + 0.4, 1.8, 1.8, BEAD[1]);
    if (!simple()) flat(ctx, bx - 0.9, y + 0.4, 0.9, 0.9, BEAD[2]);
  }
}

function log(ctx, x, y, len, rad, angle, seed, cutEnd = true) {
  const r = rng(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const end = [];
  for (let k = 0; k <= 6; k++) end.push([len + (k % 2 ? -2 - r() * 3 : r() * 1.5), -rad + (k / 6) * rad * 2]);
  const body = [[0, -rad], ...end, [0, rad]];
  shape(ctx, body, WOOD[2]);
  ctx.save();
  path(ctx, body);
  ctx.clip();
  flat(ctx, -1, -rad, len + 4, rad * 0.55, WOOD[3]);
  flat(ctx, -1, rad * 0.25, len + 4, rad, WOOD[1]);
  flat(ctx, -1, rad * 0.7, len + 4, rad, WOOD[0]);
  if (!simple()) for (let k = -0.6; k <= 0.6; k += 0.4) {
    const pts = [];
    for (let px = 2; px < len; px += 4 + r() * 3) pts.push([px, rad * k + (r() - 0.5) * 0.8]);
    if (pts.length > 1) line(ctx, pts, WOOD[0], 0.5);
  }
  ctx.restore();
  path(ctx, body);
  stroke(ctx, SLINE);
  if (!simple()) line(ctx, end.slice(1, -1).map(([px, py]) => [px - 0.6, py]), CUT[1], 0.7);
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
}

function roofEdge(ctx, x, y, w, seed) {
  flat(ctx, x - 2, y - 6, w + 4, 6, ROOF[2], CLINE);
  if (!simple()) for (let px = x - 1; px < x + w + 1; px += 2) flat(ctx, px, y - 4.8, 0.7, 4.2, ROOF[1]);
  flat(ctx, x - 2, y - 6, w + 4, 1.2, ROOF[3]);
  flat(ctx, x, y, w, 1.6, CONC[0]);
  G.grain(ctx, G.rectRegion(ctx, x - 2, y - 6, w + 4, 6), seed, 0.7);
  G.chips(ctx, x - 2, y - 5.6, w + 4, seed + 1, G.DIRT);
}

function barredPane(ctx, x, y, w, h, seed) {
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
  for (const [ly, lw] of [[y + 1, 12], [y + h * 0.55, 16]]) {
    flat(ctx, x + w + 3, ly, lw, 1.4, STEEL[4]);
    flat(ctx, x + w + 3, ly + 1.4, lw, 1, CONC[0]);
  }
  return rectPts(x - 3, y - 3, w + 6, h + 6);
}

function steelDoor(ctx, x, h) {
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
}

function shellHole(ctx, cx, cy, rx, ry, seed) {
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
}

function block(ctx, x, y, w, h, seed, { door = false, hole = false, vent = false } = {}) {
  const r = rng(seed);
  const holes = [];
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
  const panes = [];
  for (let i = 0; i < n; i++) panes.push(x + 12 + gap * (i + 1) + i * 28);
  const dh = min(h - 6, 50);
  if (door) holes.push(steelDoor(ctx, panes.shift() + 1, dh));
  const hit = hole ? panes.splice(floor(panes.length / 2), 1)[0] ?? x + w / 2 - 14 : null;
  for (const px of panes) holes.push(barredPane(ctx, px, y + 12, 28, winH, seed + round(px)));
  G.inside(ctx, G.rectRegion(ctx, x, y, w, h), () => {
    G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed + 1);
    G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed + 2, 0.5);
    G.drips(ctx, x, y, w, h * 0.4, seed + 3, max(2, round(w / 28)));
    for (const px of panes) G.drips(ctx, px - 2, y + 17 + winH, 32, 18, seed + 4 + round(px), 2);
    G.dirt(ctx, x, y + h * 0.55, w, h * 0.45, seed + 5, 0.35);
    G.rustPatch(ctx, x + 20 + r() * (w - 40), band + 2, 4 + r() * 3, 1.6, seed + 6);
  }, holes);
  if (hit !== null) {
    const cx = hit + 14, cy = y + h * 0.48;
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
}

define({
  id: "jungleBuilding",
  box: [-4, -180, 196, 2],
  draw(ctx, state, t, { w = 192, h = 120 } = {}) {
    const seed = 5100 + state * 13 + round(w) + round(h);
    if (state === 3) {
      const lower = round(h * 0.55);
      const ux = round(w * 0.38);
      block(ctx, ux, -h, w - ux, h - lower, seed + 1);
      block(ctx, 0, -lower, w, lower, seed, { door: true });
      return;
    }
    block(ctx, 0, -h, w, h, seed, { door: state === 1, vent: state === 1, hole: state === 2 });
  }
});

define({
  id: "jungleTower",
  box: [-4, -318, 52, 2],
  draw(ctx, state, t, { h = 312 } = {}) {
    const seed = 5200 + round(h);
    const r = rng(seed);
    const top = -h;
    const n = max(1, round((h - 12) / 36));
    const sh = (h - 12) / n;
    const braces = [];
    for (let i = 0; i < n; i++) {
      const y0 = top + 6 + i * sh, y1 = y0 + sh;
      for (const [a, b] of [[[17, y0 + 2], [43, y1 - 2]], [[43, y0 + 2], [17, y1 - 2]]]) {
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
      if (!simple()) for (const rx of [8, 16]) {
        disc(ctx, rx, y + 7, 0.9, IRON[4]);
        disc(ctx, rx + 0.4, y + 7.5, 0.5, IRON[0]);
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
  }
});

define({
  id: "stoneStack",
  box: [-4, -126, 52, 2],
  draw(ctx, state, t, { h = 120 } = {}) {
    const n = state === 1 ? 5 : 3;
    const seed = 5300 + state * 7 + round(h);
    const r = rng(seed);
    const sh = (h - 4) / n;
    const stones = [];
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
    const topX = stones[stones.length - 1][0][0];
    mossCap(ctx, topX, y + 1, 26 + r() * 8, seed + 3, 3);
    if (!simple()) {
      mossCap(ctx, 6, -sh + 1.5, 12, seed + 4, 2);
      grass(ctx, 2, 10, 6, seed + 5);
      grass(ctx, 38, 9, 5, seed + 6);
    }
  }
});

function tealTube(ctx, x, y, w, h) {
  flat(ctx, x, y, w, h, TEAL[1], CLINE);
  flat(ctx, x, y + h * 0.12, w, h * 0.34, TEAL[2]);
  flat(ctx, x, y + h * 0.2, w, h * 0.14, TEAL[3]);
  flat(ctx, x, y + h * 0.72, w, h * 0.28, TEAL[0]);
}

function silverPipe(ctx, h, seed) {
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
}

function elbowPipe(ctx, w, seed) {
  const pts = [[0, -20], [w - 14, -20], [w - 8, -19], [w - 7, -14], [w - 7, 0]];
  curve(ctx, pts, CLINE, 5.6);
  curve(ctx, pts, TEAL[1], 4.4);
  if (!simple()) curve(ctx, pts.map(([x, y], i) => [x - (i > 2 ? 1 : 0), y - (i < 3 ? 1 : 0)]), TEAL[3], 1);
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
}

define({
  id: "coolantPipe",
  box: [-2, -50, 98, 2],
  draw(ctx, state, t, { w = 96, h = 48 } = {}) {
    const seed = 5400 + state * 11 + round(w) + round(h);
    if (state === 1) return silverPipe(ctx, h, seed);
    if (state === 2) return elbowPipe(ctx, w, seed);
    const r = rng(seed);
    const posts = [];
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
    G.inside(ctx, G.rectsRegion(ctx, [[0, -18, w, 6.4], [0, -9.5, w, 2], [0, -4, w, 4], ...posts.map(x => [x - 1, -24, 2, 24])]), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -24, w, 24), seed + 1, 0.8);
      G.drips(ctx, 0, -18, w, 14, seed + 2, max(2, round(w / 20)));
      G.rustPatch(ctx, posts[floor(r() * posts.length)] ?? w / 2, -14, 2.4, 1.4, seed + 3);
      G.dirt(ctx, 0, -10, w, 10, seed + 4, 0.6);
    });
  }
});

function stair(ctx, x, y, w, h, seed) {
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
}

define({
  id: "rockLedges",
  box: [-6, -342, 246, 2],
  draw(ctx, state, t, { w = 240, h = 336 } = {}) {
    const seed = 5500 + state * 17 + round(w) + round(h);
    const r = rng(seed);
    const T = state === 2 ? CAVE : ROCK;
    const over = state === 1;
    const edge = [];
    for (let y = -h; y <= 0.1; y += 24) {
      const k = (y + h) / h;
      const lx = (r() - 0.5) * 8 + (over ? w * 0.06 * k : 0);
      const rx = w - (r() - 0.5) * 8 - (over ? w * 0.32 * k : 0);
      edge.push([lx, rx, y]);
    }
    const outline = [...edge.map(([lx, , y]) => [lx, y]).reverse(), ...edge.map(([, rx, y]) => [rx, y])];
    shape(ctx, outline, state === 2 ? CAVE[0] : GAP);
    const holes = [];
    ctx.save();
    path(ctx, outline);
    ctx.clip();
    if (state === 0) holes.push(stair(ctx, w * 0.22, -h + 108, 46, 40, seed + 1));
    const inHole = (x, y) => holes.some(pts => x > pts[0][0] - 6 && x < pts[1][0] + 6 && y > pts[0][1] - 6 && y < pts[2][1] + 6);
    const rows = [];
    for (let y = -h + 12; y < 10; y += 22) rows.push(y);
    rows.forEach((y, j) => {
      for (let x = r() * 12 - 6; x < w + 10;) {
        const step = 16 + r() * 22;
        const cx = x + step / 2;
        x += step;
        if (r() < 0.18 || inHole(cx, y)) continue;
        rock(ctx, cx + (r() - 0.5) * 4, y + (r() - 0.5) * 8, step * (0.5 + r() * 0.12), 8 + r() * 6, seed + j * 97 + round(cx), T);
      }
    });
    ctx.restore();
    G.inside(ctx, G.polyRegion(ctx, outline), () => {
      G.grain(ctx, G.polyRegion(ctx, outline), seed + 2, 0.8);
      for (let y = -h + 24; y < 0; y += 48) G.dirt(ctx, 0, y, w, 24, seed + 3 + round(y + h), 0.5);
      G.drips(ctx, 0, -h, w, h * 0.3, seed + 4, round(w / 30), false);
    }, holes);
    const ledges = [];
    for (let i = 0, y = -h + 2; y < -20; i++, y += 48) {
      const row = edge[min(edge.length - 1, round((y + h) / 24))];
      const span = row[1] - row[0];
      const lw = span * (0.4 + r() * 0.35);
      const lx = i % 2 ? row[1] - lw + (over ? 14 : 4) : row[0] - 4;
      ledges.push(ledge(ctx, lx, y, lw, 13 + r() * 4, seed + 60 + i, T));
      mossCap(ctx, lx + 3 + r() * lw * 0.3, y + 0.5, lw * (0.2 + r() * (state === 2 ? 0.5 : 0.3)), seed + 70 + i, state === 2 ? 3.5 : 2.4);
      if (!simple() && r() < 0.6) vine(ctx, lx + lw * (0.2 + r() * 0.6), y + 10, 14 + r() * 20, seed + 80 + i);
    }
    G.inside(ctx, G.polysRegion(ctx, ledges), () => G.grain(ctx, G.rectRegion(ctx, -6, -h, w + 12, h), seed + 5, 0.7));
    if (!simple()) {
      fern(ctx, edge[edge.length - 1][0] + 14, 14, seed + 6, state === 2 ? LEAF : undefined);
      leafBlob(ctx, w * 0.75, -h + 6, 14, 7, seed + 7);
    }
  }
});

define({
  id: "rockSlope",
  box: [-6, -198, 222, 4],
  draw(ctx, state, t) {
    const seed = 5600;
    const r = rng(seed);
    const steps = 7;
    const slabs = Array.from({ length: steps }, (_, i) => {
      const sw = 58 + r() * 16;
      const x = 216 - sw - i * 23 - r() * 4;
      const y = -192 + i * 27 + r() * 2;
      return [max(-2, x), y, sw, 15 + r() * 4];
    });
    const mass = [[216, -192], ...slabs.flatMap(([x, y, , sh]) => [[x + 6, y + 4], [x + 3, y + sh + 8]]), [0, 0], [216, 0]];
    shape(ctx, mass, GAP);
    ctx.save();
    path(ctx, mass);
    ctx.clip();
    for (let y = -184, j = 0; y < 6; y += 19, j++) for (let x = (j % 2) * 8 + 40; x < 226; x += 16 + r() * 6) {
      if (r() < 0.12) continue;
      rock(ctx, x, y + (r() - 0.5) * 4, 9 + r() * 4, 7 + r() * 3, seed + j * 53 + round(x));
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
  }
});

define({
  id: "rockDebris",
  box: [-4, -76, 126, 2],
  draw(ctx, state, t, { w = 120 } = {}) {
    const seed = 5700 + state * 5 + round(w);
    const r = rng(seed);
    const stones = [];
    const peak = (x) => 16 + 34 * sin((PI * min(w, max(0, x))) / w);
    for (let j = 0; j < 4; j++) for (let x = 6 + j * 4; x < w - 4; x += 11 + r() * 8) {
      const top = peak(x);
      const y = -top + j * (top / 4) + 6 + (r() - 0.5) * 4;
      if (y > -4 && j < 3) continue;
      stones.push([x + (r() - 0.5) * 4, min(-5, y), 6 + r() * 5 - j * 0.6, 5 + r() * 3, j]);
    }
    stones.sort((a, b) => a[1] - b[1]);
    const mound = [[2, 0]];
    for (let x = 4; x < w - 2; x += 8) mound.push([x, -peak(x) * 0.78 + 6 + r() * 3]);
    mound.push([w - 2, 0]);
    shape(ctx, mound, "#221e16", SLINE);
    const half = floor(stones.length / 2);
    const drawn = [];
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
  }
});

define({
  id: "deckRailing",
  box: [-3, -28, 99, 1],
  draw(ctx, state, t, { w = 96 } = {}) {
    const seed = 5800 + state * 3 + round(w);
    const r = rng(seed);
    const bent = state === 1;
    const posts = [];
    for (let x = 0; x < w - 8; x += 48) posts.push(x);
    posts.push(w - 4);
    const sag = (x) => bent && x > w * 0.55 && x < w * 0.9 ? sin(((x - w * 0.55) / (w * 0.35)) * PI) * 8 : 0;
    const missing = bent ? round(w * 0.72 / 12) : -1;
    for (let k = 1; k * 12 < w - 4; k++) {
      const x = k * 12;
      if (k === missing || posts.some(p => abs(p - x) < 6)) continue;
      const lean = bent && abs(k - missing) === 1 ? (k - missing) * 3 : 0;
      line(ctx, [[x, -8], [x + lean, -20 + sag(x)]], BRASS[0], 1.6, "butt");
      line(ctx, [[x, -8], [x + lean, -20 + sag(x)]], BRASS[3], 0.8, "butt");
    }
    const top = [];
    for (let x = 0; x <= w; x += 6) top.push([x, -23 + sag(x)]);
    top[top.length - 1][0] = w;
    rail(ctx, top, 2.6, BRASS);
    rail(ctx, top.map(([x, y]) => [x, y + 3.6 - sag(x) * 0.4]), 1.6, BRASS);
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
    G.inside(ctx, G.rectsRegion(ctx, posts.map(x => [x, -26, 4, 26])), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -27, w, 27), seed + 1);
      for (const x of posts) G.drips(ctx, x, -24, 4, 16, seed + 2 + round(x), 1);
      G.dirt(ctx, 0, -12, w, 12, seed + 3, 0.6);
    });
    if (!simple()) {
      G.chips(ctx, 0, -23.8, w, seed + 4, G.DIRT);
      G.rustPatch(ctx, w * (0.2 + r() * 0.6), -22.6, 2.4, 0.8, seed + 5);
      if (bent) G.rustPatch(ctx, w * 0.72, -16, 2, 1, seed + 6);
    }
  }
});

function overgrownFence(ctx, w) {
  window.ENV.VESNICE.meshFence(ctx, 2, w);
  const seed = 5900 + round(w);
  const r = rng(seed);
  for (let x = 0; x < w; x += 72) {
    const px = min(x, w - 3) + 1.5;
    vine(ctx, px + (r() - 0.5) * 2, -56, 44 + r() * 10, seed + x);
    leafBlob(ctx, px + (r() - 0.5) * 6, -6, 9 + r() * 4, 6, seed + 1 + x);
    if (!simple()) fern(ctx, px + 4, 10 + r() * 6, seed + 2 + x);
  }
  for (let x = 6 + r() * 10; x < w - 6; x += 16 + r() * 22) {
    if (r() < 0.7) vine(ctx, x, -51, 10 + r() * 30, seed + 3 + round(x));
    if (r() < 0.55) leafBlob(ctx, x, -52 + r() * 3, 7 + r() * 5, 4 + r() * 2, seed + 4 + round(x));
  }
  if (!simple()) {
    const pts = [];
    for (let x = 0; x <= w; x += 12) pts.push([x, -30 - sin(x / 20 + seed) * 10 - (x / w) * 8]);
    curve(ctx, pts, MOSS[1], 1);
    pts.forEach(([x, y], i) => {
      if (i % 2) shape(ctx, blobPts(x + 2, y, 2.6, 1.6, seed + 5 + i, 6, 0.2), i % 4 === 1 ? MOSS[2] : MOSS[3]);
    });
    grass(ctx, 0, w, 7, seed + 6);
  }
}

window.ENV.JUNGLE_STRUCTURES = { overgrownFence };

const TRUNK_TOP = [[-12, -84], [-196, -148]];
const TRUNK_BOT = [[-18, -60], [-202, -132]];
const TRUNK = [TRUNK_TOP[0], TRUNK_TOP[1], TRUNK_BOT[1], TRUNK_BOT[0]];
const ROOT = blobPts(-2, -64, 26, 62, 761, 14, 0.2);

function trunkAt(u, v) {
  const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  return lerp(lerp(TRUNK_TOP[0], TRUNK_TOP[1], u), lerp(TRUNK_BOT[0], TRUNK_BOT[1], u), v);
}

function trunkBand(v0, v1) {
  return [trunkAt(0, v0), trunkAt(1, v0), trunkAt(1, v1), trunkAt(0, v1)];
}

define({
  id: "fallenTree",
  box: [-220, -170, 34, 14],
  draw(ctx) {
    const seed = 760;
    const r = rng(seed);
    for (const [u, len, a] of [[0.38, 22, -1.9], [0.62, 16, -2.3], [0.84, 20, -1.6], [0.5, 12, 1.3]]) {
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
          const pts = [];
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
      const x = (r() - 0.5) * 16, y = -96 + r() * 40;
      const s = i % 2 ? 1 : -1;
      curve(ctx, [[x, y], [x + s * (8 + r() * 10), y + 14 + r() * 20], [x + s * (14 + r() * 18), y + 40 + r() * 50]], i % 3 ? WOOD[1] : WOOD[2], 1.4 + r() * 2.6);
    }
    for (let i = 0; i < 8; i++) rock(ctx, -20 + r() * 36, -120 + r() * 110, 4 + r() * 4, 3 + r() * 3, seed + 20 + i);
    G.grain(ctx, G.polyRegion(ctx, ROOT), seed + 4);
    G.dirt(ctx, -30, -126, 60, 126, seed + 5, 0.4);
    ctx.restore();
    mossCap(ctx, -22, -124, 36, seed + 6, 4);
    for (const [x, rx, ry] of [[-34, 9, 7], [-16, 7, 5], [24, 10, 8], [34, 6, 4]]) rock(ctx, x, -ry + 1, rx, ry, seed + 30 + x);
    if (!simple()) {
      for (const x of [-20, -6, 10]) vine(ctx, x, -118, 34, seed + 40 + x);
      fern(ctx, 30, 18, seed + 50);
    }
  }
});
})();

(() => {
const { define, P, G } = window.ENV;
const J = window.ENV.jungle;
const { LEAF } = J;
const { rng, path, color, flat, disc, glow, stroke, shape, line, curve, trefoil } = P;
const { PI, sin, cos, min, max, round } = Math;

const simple = () => window.ENV.simple;

const CHROME = ["#18242a", "#303c3c", "#3c4848", "#546060", "#0a1010"];
const SHINE = "#b8c8c8";
const DOME = ["#0c1c1c", "#183030", "#2c4848", "#7c9c9c"];
const SADDLE = ["#241c0c", "#3c3018", "#544830", "#6c603c", "#100c06"];
const VALVE = ["#4a2410", "#6c3c18", "#a8602c"];
const EXC = ["#3a1400", "#542400", "#78240c", "#90240c", "#1c0a04"];
const BOOM = ["#2c2c26", "#4e4e44", "#6c6c60", "#9c9c90", "#121210"];
const TRACK = ["#141410", "#22221a", "#3c3c30"];
const BRONZE = ["#2c1c0c", "#483018", "#603018", "#8c5430", "#140c06"];
const OLIVE = "#544830";
const HEDGE = ["#141c0c", "#243018", "#303c18", "#4c6024"];
const CAR = ["#483018", "#784824", "#9c6c18", "#c08a34", "#180e06"];
const BERRY = ["#16240c", "#243c18", "#304818", "#3c6018"];
const WOOD = ["#1c1208", "#3c2814", "#604824", "#7c6034", "#0e0804"];
const CUT = ["#6c5438", "#9c846c", "#b8a084"];
const DRUM = ["#24160a", "#3c2814", "#604824", "#7a5c34", "#0e0804"];
const VENT = ["#1c2626", "#303c3c", "#546060", "#7c8c8c", "#0a1010"];
const SIGN = ["#6c5408", "#b89428", "#e4c048", "#f8e08a", "#241c04"];
const LEAF_DARK = ["#0a1a10", "#183424", "#24482c", "#386a3c"];
const HOLE = "#070606";
const GLASS = "#141e22";

const within = (ctx, rects, fn) => G.inside(ctx, G.rectsRegion(ctx, rects), fn);
const clipped = (ctx, pts, fn) => G.inside(ctx, G.polyRegion(ctx, pts), fn);

function oval(ctx, cx, cy, rx, ry, fill, edge = null, a0 = 0, a1 = PI * 2) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, a0, a1);
  ctx.fillStyle = color(fill);
  ctx.fill();
  if (edge) stroke(ctx, edge);
}

function ovalPts(cx, cy, rx, ry, a0 = 0, a1 = PI * 2, n = 16) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + (a1 - a0) * i / n;
    return [cx + cos(a) * rx, cy + sin(a) * ry];
  });
}

function bands(ctx, x, y, w, h, list) {
  for (const [k0, k1, c] of list) flat(ctx, x, y + h * k0, w, h * (k1 - k0), c);
}

function saddle(ctx, x, y, w, h, seed) {
  const r = rng(seed);
  const frame = [[x, y + h], [x, y + 3], [x + 3, y], [x + w - 3, y], [x + w, y + 3], [x + w, y + h]];
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
}

function chemCylinder(ctx, x, y, w, d, seed) {
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
  const plate = [x + w * 0.18, y + d * 0.36, w * 0.16, d * 0.14];
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
  G.inside(ctx, () => { ctx.beginPath(); ctx.arc(tx, cy + 1, tr, 0, PI * 2); }, () => G.rustPatch(ctx, tx + tr * 0.6, cy + tr * 0.8, tr * 0.35, tr * 0.25, seed + 7));
}

define({
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
  }
});

function road(ctx, cx, cy, rr, seed) {
  disc(ctx, cx, cy, rr, TRACK[1], "#060604");
  disc(ctx, cx, cy, rr * 0.55, TRACK[2]);
  disc(ctx, cx, cy, rr * 0.2, TRACK[0]);
  if (!simple()) G.rustPatch(ctx, cx + rr * 0.2, cy, rr * 0.25, rr * 0.18, seed);
}

function thick(ctx, pts, w, tones) {
  curve(ctx, pts, tones[4], w + 1.4);
  curve(ctx, pts, tones[1], w);
  if (!simple()) curve(ctx, pts.map(([x, y]) => [x - 0.6, y - w * 0.28]), tones[3], w * 0.28);
}

define({
  id: "excavator",
  box: [-2, -74, 146, 0],
  draw(ctx) {
    const seed = 7200;
    const track = [[50, -15], [134, -15], [142, -8], [135, 0], [49, 0], [42, -8]];
    shape(ctx, track, TRACK[1], "#060604");
    if (!simple()) for (let x = 50; x < 135; x += 3) {
      line(ctx, [[x, -15], [x, -13.4]], TRACK[2], 0.9);
      line(ctx, [[x + 1.5, 0], [x + 1.5, -1.6]], TRACK[2], 0.9);
    }
    clipped(ctx, track, () => G.dirt(ctx, 40, -15, 104, 15, seed, 0.7));
    road(ctx, 50, -7.5, 6.5, seed + 1);
    road(ctx, 134, -7.5, 6.5, seed + 2);
    for (let k = 0; k < 5; k++) road(ctx, 64 + k * 14, -6.5, 5, seed + 3 + k);
    const base = [[54, -15], [54, -22], [132, -22], [132, -15]];
    shape(ctx, base, TRACK[2], "#060604");
    const body = [[52, -22], [52, -40], [96, -40], [96, -46], [138, -46], [140, -22]];
    shape(ctx, body, EXC[2], EXC[4]);
    flat(ctx, 52, -40, 44, 2, EXC[3]);
    flat(ctx, 96, -46, 42, 2, EXC[3]);
    flat(ctx, 52, -27, 88, 5, EXC[1]);
    if (!simple()) for (let y = -42; y < -30; y += 3) flat(ctx, 108, y, 26, 1.2, EXC[0]);
    const cab = [[70, -40], [72, -64], [96, -64], [98, -40]];
    shape(ctx, cab, EXC[3], EXC[4]);
    flat(ctx, 70, -66, 30, 3, EXC[1], EXC[4]);
    const glass = [[75, -44], [76, -60], [93, -60], [94, -44]];
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
      const crack = [[80, -58], [88, -55], [90, -48], [82, -46], [78, -52]];
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
    for (const [a, b] of [[[70, -26], [50, -52]], [[42, -64], [22, -54]]]) {
      line(ctx, [a, b], BOOM[4], 2.2);
      line(ctx, [a, b], CHROME[3], 1.2);
      if (!simple()) line(ctx, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]], BOOM[0], 1.2);
    }
    for (const [px, py] of [[64, -36], [17, -63], [14, -28]]) disc(ctx, px, py, 2.2, BOOM[0], BOOM[4]);
    const bucket = [[6, -30], [22, -28], [24, -14], [16, -4], [4, -4], [2, -16]];
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
  }
});

define({
  id: "caveCapsule",
  box: [-2, -50, 32, 0],
  draw(ctx) {
    const seed = 7300;
    const dome = [[3, -26], ...ovalPts(15, -26, 12, 20, PI, PI * 2, 14).slice(1)];
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
  }
});

const BOILER = ["#2a160a", "#483018", "#604824", "#6c3c18", "#120a04"];
const BOILER_TOP = ["#5a2410", "#7a3418", "#a24e28"];

define({
  id: "rustBoiler",
  box: [-2, -84, 64, 0],
  draw(ctx) {
    const seed = 7400;
    ctx.save();
    ctx.globalAlpha = 0.45;
    flat(ctx, 2, -2, 56, 2, HOLE);
    ctx.restore();
    for (const [py, ph] of [[-56, 5], [-40, 4]]) {
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
  }
});

const HELI = { x: 68, y: -50, a: -0.52, k: 1.3 };

function heliPoint(px, py) {
  const c = cos(HELI.a) * HELI.k, s = sin(HELI.a) * HELI.k;
  return [HELI.x + px * c - py * s, HELI.y + px * s + py * c];
}

function heliHull(ctx, seed) {
  const r = rng(seed);
  ctx.save();
  ctx.translate(HELI.x, HELI.y);
  ctx.rotate(HELI.a);
  ctx.scale(HELI.k, HELI.k);
  const boom = [[18, -14], [76, -6], [78, 1], [18, 8]];
  shape(ctx, boom, BRONZE[2], BRONZE[4]);
  flat(ctx, 18, -12, 58, 3, BRONZE[3]);
  flat(ctx, 18, 3, 60, 3, BRONZE[1]);
  const fin = [[66, -6], [74, -28], [82, -28], [82, -4]];
  shape(ctx, fin, BRONZE[3], BRONZE[4]);
  flat(ctx, 74, -28, 8, 2, "#a8683c");
  const hull = [[-46, 6], [-44, -6], [-36, -18], [-22, -26], [-4, -28], [14, -24], [26, -14], [30, 0], [26, 14], [10, 22], [-14, 24], [-34, 20], [-44, 14]];
  shape(ctx, hull, BRONZE[2], BRONZE[4]);
  clipped(ctx, hull, () => {
    flat(ctx, -50, -30, 84, 10, BRONZE[3]);
    flat(ctx, -50, 10, 84, 16, BRONZE[1]);
    flat(ctx, -12, -20, 26, 30, OLIVE);
    if (!simple()) for (const lx of [-12, 1, 14]) line(ctx, [[lx, -26], [lx, 22]], BRONZE[4], 0.6);
  });
  const glass = [[-45, 4], [-42, -7], [-34, -17], [-22, -20], [-22, 2], [-34, 8]];
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
    const tear = [[2, -8], [14, -14], [22, -2], [16, 8], [4, 6]];
    G.scorch(ctx, tear, seed + 7);
    shape(ctx, tear, HOLE);
    G.rim(ctx, tear, seed + 8, BRONZE[3], HOLE);
  });
  G.chips(ctx, -30, -24, 50, seed + 9, G.DIRT);
  for (const [px, py] of [[-12, 22], [14, 20]]) line(ctx, [[px, py], [px - 6 - r() * 4, py + 8]], BOOM[1], 1.4);
  line(ctx, [[-30, 30], [-4, 31], [16, 26]], BOOM[1], 1.6);
  flat(ctx, -6, -33, 12, 6, BRONZE[1], BRONZE[4]);
  flat(ctx, -2, -37, 4, 4, BOOM[1], BOOM[4]);
  ctx.restore();
}

function blade(ctx, pts) {
  curve(ctx, pts, "#100c08", 4.2);
  curve(ctx, pts, BOOM[1], 3);
  if (!simple()) curve(ctx, pts, BOOM[3], 0.8);
}

define({
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
      J.leafBlob(ctx, cx, cy, 13 + r() * 8, 10 + r() * 6, seed + 60 + i * 5, HEDGE);
    }
    if (!simple()) {
      for (const [x, h] of [[24, 26], [60, 38], [96, 34], [134, 22]]) {
        ctx.save();
        ctx.translate(x, 0);
        J.fern(ctx, 0, h, seed + 90 + x, HEDGE);
        ctx.restore();
      }
      for (const px of [-10, 14]) {
        const [vx, vy] = heliPoint(px, -20);
        J.vine(ctx, vx, vy, 24, seed + px);
      }
    }
  }
});

const TYRE = ["#0a0806", "#151210", "#221c16", "#3a332c"];
const WELL = "#140c06";
const SEAT = ["#1c1810", "#2e2818", "#443a24"];
const RUST_HOLE = "#5a2a10";
const RUST_LIGHT = "#b8682c";
const MID = "#8a5a1e";
const SCREEN = ["#1c3034", "#3c5c5c", "#a8c8c0"];

function hull(top, base, arches) {
  const pts = [...top];
  for (const [cx, rr] of [...arches].sort((a, b) => b[0] - a[0])) pts.push([cx + rr, base], ...ovalPts(cx, base, rr, rr, 0, -PI, 10).slice(1, -1), [cx - rr, base]);
  return pts;
}

const WRECKS = [
  {
    top: [[0, -8], [0.6, -15], [3, -18], [20, -19.5], [33, -29.5], [37, -31], [59, -31], [63, -29.5], [74, -20.5], [92, -18.5], [95.4, -16], [96, -8]],
    base: -8, belt: -20.5, roof: [35, 61, -31],
    wheels: [[18, 8, "tyre"], [78, 8, "flat"]],
    glass: [[[36, -21.5], [40, -28.5], [52, -28.5], [52, -21.5]], [[55, -21.5], [55, -28.5], [60, -28.5], [70, -21.5]]],
    doors: [34, 53.5, 72.5], handles: [[45, -18.5], [64, -18.5]],
    holes: [[[24, -15], [28, -17], [31, -13], [26, -11]], [[84, -14], [88, -16], [90, -12]]],
    seams: [[[20, -19.5], [21, -12]], [[74, -20.5], [75, -12]]],
    tail: [0.4, -16, 2.6, 3], head: [93, -16, 3, 3],
    bumpers: [[-1.5, -12, 5, 2.6], [93, -12, 5, 2.6]],
    moss: [[4, -18.6, 14, 1.6], [76, -20, 16, 1.6]],
    leaves: [[9, -19, 7, 3.4], [86, -20, 6, 3], [48, -31.5, 9, 3.6]],
    vines: [[37, -30, 12], [61, -29, 16], [70, -21, 9]],
    ferns: [[6, 12], [92, 10]],
    seed: 7500
  },
  {
    top: [[0, -8], [0, -23], [1, -24], [55, -24], [57, -25], [58, -33], [61, -34.5], [73, -34.5], [76, -33], [83, -24.5], [102, -22], [105.4, -19], [106, -8]],
    base: -8, belt: -24.5, roof: [59, 75, -34.5],
    wheels: [[20, 8.5, "tyre"], [88, 8.5, "tyre"]],
    glass: [[[60, -25.5], [61, -32], [73, -32], [80, -25.5]]],
    doors: [56.5, 81], handles: [[61, -22]],
    holes: [[[30, -18], [36, -20], [40, -15], [33, -13]], [[95, -17], [99, -19], [100, -14]]],
    seams: [[[3, -23], [3, -10]], [[83, -24.5], [84, -12]]],
    bed: [1, 55, -24],
    tail: [0.4, -21, 2.4, 4], head: [103, -19, 3, 3],
    bumpers: [[-1.5, -12, 5, 2.6], [103, -12, 5, 2.6]],
    moss: [[2, -24.4, 50, 2], [84, -24, 18, 1.6]],
    leaves: [[16, -25, 9, 5], [32, -27, 12, 7], [46, -25, 8, 4.6], [66, -35, 8, 3.2]],
    vines: [[26, -24, 10], [44, -24, 13], [76, -32, 14]],
    ferns: [[40, 14], [56, 10], [104, 10]],
    seed: 7520
  },
  {
    top: [[0, -10], [0, -30], [2, -31.5], [40, -31.5], [42.5, -25], [55.5, -25], [58, -32.5], [89, -31], [93, -28], [94, -10]],
    base: -10, belt: -25, roof: [2, 40, -31.5],
    wheels: [[20, 10.5, "tyre"], [76, 10.5, "rim"]],
    glass: [],
    doors: [42.5, 55.5], handles: [],
    holes: [[[22, -24], [27, -26], [31, -21], [25, -18]], [[62, -20], [66, -22], [68, -18]]],
    seams: [[[58, -32.5], [60, -18]], [[86, -31], [87, -18]]],
    bars: [
      [[10, -31.5], [11, -51], [14, -55], [34, -55], [37, -51], [38, -31.5]],
      [[14, -54], [36.5, -33]],
      [[58.5, -32.5], [53, -51], [55, -53], [59, -53], [65, -32.5]]
    ],
    seats: [{ pts: [[42, -25], [40, -40], [44.5, -41.5], [47, -25]], lit: [38, -42, 4, 18], rust: [44, -34] }],
    wheelPost: [[57, -26], [52, -35.5]],
    grille: [89, 93, -28, -15],
    spare: [0, -21, 7.5],
    head: [90, -26, 3.4, 3.4],
    bumpers: [[-3, -14, 5, 3], [92, -14, 6, 3]],
    moss: [[12, -55.8, 20, 1.6], [60, -32.8, 26, 1.8], [54, -53.6, 5, 1.2]],
    leaves: [[24, -56, 10, 4], [6, -32, 7, 3.6], [72, -33.5, 9, 3.6], [55, -53.6, 5, 2.6]],
    vines: [[34, -54, 18], [16, -54, 14], [57, -52, 16]],
    ferns: [[4, 12], [46, 16], [60, 12], [94, 10]],
    seed: 7540
  }
];

function tube(ctx, pts, seed, T = CAR, rust = 6) {
  const r = rng(seed);
  const shift = (d) => pts.map(([x, y]) => [x - d, y - d]);
  line(ctx, pts, T[4], 3.6);
  line(ctx, pts, T[0], 2.8);
  line(ctx, shift(0.45), T[1], 1.5);
  line(ctx, shift(0.8), T[3], 0.6);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const n = max(1, round(Math.hypot(bx - ax, by - ay) / rust));
    for (let k = 0; k < n; k++) {
      const t = (k + r()) / n;
      const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
      disc(ctx, px, py, 0.5 + r() * 0.4, r() < 0.6 ? RUST_HOLE : T[0]);
      if (r() < 0.4) disc(ctx, px - 0.3, py - 0.4, 0.35, RUST_LIGHT);
    }
  }
}

function round2(ctx, cx, cy, rr) {
  return () => {
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, PI * 2);
  };
}

function tyre(ctx, x, rr, kind, seed, T = CAR) {
  const cy = kind === "rim" ? -rr * 0.62 : -rr;
  if (kind !== "rim") {
    disc(ctx, x, cy, rr, TYRE[1], TYRE[0]);
    for (let k = 0; k < 16; k++) {
      const a = k * PI / 8;
      line(ctx, [[x + cos(a) * rr * 0.84, cy + sin(a) * rr * 0.84], [x + cos(a) * rr, cy + sin(a) * rr]], TYRE[0], 0.9);
    }
    line(ctx, ovalPts(x, cy, rr * 0.78, rr * 0.78, PI * 1.05, PI * 1.6, 6), TYRE[3], 1);
    disc(ctx, x, cy, rr * 0.66, TYRE[2]);
  }
  const rim = kind === "rim" ? rr * 0.62 : rr * 0.5;
  disc(ctx, x, cy, rim, T[1], T[4]);
  G.inside(ctx, round2(ctx, x, cy, rim), () => {
    flat(ctx, x - rim, cy - rim, rim * 2, rim * 0.7, T[2]);
    flat(ctx, x - rim, cy + rim * 0.35, rim * 2, rim * 0.65, T[0]);
  });
  if (kind === "rim") for (let k = 0; k < 4; k++) {
    const a = PI / 4 + k * PI / 2;
    disc(ctx, x + cos(a) * rim * 0.62, cy + sin(a) * rim * 0.62, rim * 0.16, HOLE);
  }
  disc(ctx, x, cy, rim * 0.42, T[0], T[4]);
  for (let k = 0; k < 5; k++) {
    const a = k * PI * 0.4 - PI / 2;
    disc(ctx, x + cos(a) * rim * 0.26, cy + sin(a) * rim * 0.26, 0.45, T[3]);
  }
  disc(ctx, x, cy, rim * 0.12, T[3]);
  G.rustPatch(ctx, x + rim * 0.3, cy - rim * 0.2, rim * 0.35, rim * 0.22, seed);
  G.inside(ctx, round2(ctx, x, cy, kind === "rim" ? rim : rr), () => G.dirt(ctx, x - rr, cy - rr, rr * 2, rr * 2, seed + 1, 0.55));
  if (kind === "flat") {
    flat(ctx, x - rr - 1, -2.6, rr * 2 + 2, 2.6, TYRE[1], TYRE[0]);
    flat(ctx, x - rr, -2.4, rr * 2, 0.6, TYRE[3]);
  }
}

function well(ctx, cx, base, rr, seed, T = CAR) {
  const arch = ovalPts(cx, base, rr, rr, PI, PI * 2, 10);
  shape(ctx, arch, WELL);
  clipped(ctx, arch, () => {
    oval(ctx, cx, base, rr * 0.75, rr * 0.7, HOLE);
    G.grain(ctx, G.polyRegion(ctx, arch), seed, 0.8);
    for (let k = 0; k < 4; k++) line(ctx, [[cx - rr * 0.55, base - rr * 0.85 + k * 2], [cx - rr * 0.3, base - rr * 0.85 + k * 2 + 1.2]], T[0], 0.9);
    line(ctx, [[cx - rr, base - 1], [cx + rr, base - 1.6]], T[0], 1);
  });
}

function wreckBody(ctx, c) {
  const xs = c.top.map(p => p[0]);
  const w = max(...xs);
  const top = min(...c.top.map(p => p[1]));
  const arches = c.wheels.map(([x, rr]) => [x, rr + 1.8]);
  const T = c.tones ?? CAR;
  const mid = c.mid ?? MID;
  const body = hull(c.top, c.base, arches);
  for (const [x, rr] of arches) well(ctx, x, c.base, rr, c.seed + x, T);
  for (const [i, s] of (c.seats ?? []).entries()) {
    shape(ctx, s.pts, SEAT[1], T[4]);
    clipped(ctx, s.pts, () => {
      flat(ctx, ...s.lit, SEAT[2]);
      G.grain(ctx, G.polyRegion(ctx, s.pts), c.seed + 3 + i * 10, 0.9);
      if (s.rust) G.rustPatch(ctx, ...s.rust, 1.6, 2.4, c.seed + 4 + i * 10);
    });
  }
  if (c.screen) {
    shape(ctx, c.screen, SCREEN[0], T[4]);
    clipped(ctx, c.screen, () => {
      shape(ctx, c.screen.map(([x, y]) => [x - 1.6, y]), SCREEN[1]);
      line(ctx, [c.screen[0], c.screen[1]].map(([x, y]) => [x + 1.4, y - 2]), SCREEN[2], 0.6);
      const sx = c.screen.map(p => p[0]), sy = c.screen.map(p => p[1]);
      G.dirt(ctx, min(...sx), min(...sy), max(...sx) - min(...sx), max(...sy) - min(...sy), c.seed + 25, 0.5);
    });
  }
  if (c.wheelPost) {
    line(ctx, c.wheelPost, T[4], 1.4);
    line(ctx, ovalPts(c.wheelPost[1][0], c.wheelPost[1][1], 1.4, 4, 0, PI * 2, 12), T[4], 1);
  }
  for (const [i, pts] of (c.bars ?? []).entries()) tube(ctx, pts, c.seed + 70 + i, T, c.rust);
  flat(ctx, 4, c.base, w - 8, 2.6, T[0], T[4]);
  flat(ctx, 4, c.base + 1.8, w - 8, 0.8, HOLE);
  shape(ctx, body, T[1], T[4]);
  clipped(ctx, body, () => {
    flat(ctx, 0, top - 2, w, c.belt - top + 2, mid);
    for (const [i, [x, y, rx, ry, k]] of (c.camo ?? []).entries()) shape(ctx, J.blobPts(x, y, rx, ry, c.seed + 140 + i, 9, 0.3), k);
    flat(ctx, 0, c.belt, w, 2.4, T[3]);
    flat(ctx, 0, c.belt + 2.4, w, 1, mid);
    flat(ctx, 0, c.base - 5, w, 5, T[0]);
    flat(ctx, 0, c.base - 5.4, w, 0.8, T[4]);
    flat(ctx, 0, c.belt + 7, w, 0.8, T[0]);
    line(ctx, c.top.slice(1, -1).map(([x, y]) => [x, y + 0.9]), T[3], 0.8);
  });
  G.inside(ctx, G.polyRegion(ctx, body), () => {
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
  }, c.glass);
  for (const [i, h] of c.holes.entries()) G.inside(ctx, G.polyRegion(ctx, body), () => G.rim(ctx, h, c.seed + 12 + i, T[3], T[4]));
  for (const pts of c.seams) line(ctx, pts, T[4], 0.7);
  for (const x of c.doors) {
    line(ctx, [[x, c.belt + 0.5], [x, c.base - 1]], T[4], 0.8);
    line(ctx, [[x + 0.7, c.belt + 0.5], [x + 0.7, c.base - 1]], T[3], 0.4);
  }
  for (const [x, y] of c.handles) flat(ctx, x, y, 3.4, 1.1, T[3], T[4]);
  for (const [x, rr] of arches) {
    const lip = ovalPts(x, c.base, rr + 0.4, rr + 0.4, PI, PI * 2, 12);
    G.inside(ctx, G.polyRegion(ctx, body), () => G.scorch(ctx, ovalPts(x, c.base, rr, rr, PI, PI * 2, 10), c.seed + 30 + x));
    line(ctx, lip, T[4], 1.8);
    line(ctx, ovalPts(x, c.base, rr + 1.3, rr + 1.3, PI * 1.1, PI * 1.9, 10), T[2], 0.6);
  }
  for (const [i, g] of c.glass.entries()) clipped(ctx, body, () => {
    G.scorch(ctx, g, c.seed + 10 + i);
    shape(ctx, g, HOLE);
    G.rim(ctx, g, c.seed + 11 + i, T[3], T[4]);
  });
  if (c.bed) {
    const [b0, b1, by] = c.bed;
    flat(ctx, b0, by - 1, b1 - b0, 2.2, T[3], T[4]);
    for (let x = b0 + 8; x < b1 - 2; x += 12) flat(ctx, x, by + 1.6, 2, 2.4, HOLE);
  }
  if (c.grille) {
    const [g0, g1, gy0, gy1] = c.grille;
    flat(ctx, g0, gy0, g1 - g0, gy1 - gy0, HOLE);
    for (let x = g0 + 0.8; x < g1; x += 1.6) line(ctx, [[x, gy0], [x, gy1]], T[0], 0.8);
  }
  if (c.tail) flat(ctx, ...c.tail, "#5a160c", T[4]);
  if (c.head) {
    const [hx, hy, hw, hh] = c.head;
    flat(ctx, hx, hy, hw, hh, "#2c2a22", T[4]);
    flat(ctx, hx + 0.5, hy + 0.5, hw * 0.4, hh * 0.4, "#8c8c78");
  }
  for (const [i, [bx, by, bw, bh]] of c.bumpers.entries()) {
    flat(ctx, bx, by, bw, bh, T[0], T[4]);
    flat(ctx, bx, by, bw, 0.7, T[2]);
    G.rustPatch(ctx, bx + bw * 0.5, by + bh * 0.5, bw * 0.3, bh * 0.3, c.seed + 50 + i);
  }
  G.chips(ctx, c.roof[0], c.roof[2], c.roof[1] - c.roof[0], c.seed + 9, G.DIRT);
  G.chips(ctx, 0, c.belt, w, c.seed + 15, G.DIRT);
  for (const [i, [x, rr, kind]] of c.wheels.entries()) tyre(ctx, x, rr, kind, c.seed + 20 + i * 3, T);
  if (c.spare) {
    ctx.save();
    ctx.translate(0, c.spare[1] + c.spare[2]);
    tyre(ctx, c.spare[0], c.spare[2], "tyre", c.seed + 60);
    ctx.restore();
  }
  return body;
}

function vehicle(ctx, c) {
  const w = max(...c.top.map(p => p[0]));
  ctx.save();
  ctx.globalAlpha = 0.45;
  flat(ctx, -2, -2, w + 4, 2, HOLE);
  ctx.restore();
  return wreckBody(ctx, c);
}

function overgrow(ctx, c, body) {
  const r = rng(c.seed + 40);
  const w = max(...c.top.map(p => p[0]));
  const [x0, x1, ry] = c.roof;
  for (const [i, g] of c.glass.entries()) {
    const gx = g.map(p => p[0]), gy = g.map(p => p[1]);
    clipped(ctx, g, () => J.leafBlob(ctx, (min(...gx) + max(...gx)) / 2, max(...gy), (max(...gx) - min(...gx)) * 0.5, 5, c.seed + 80 + i, LEAF_DARK));
  }
  J.mossCap(ctx, x0, ry, x1 - x0, c.seed + 41, 2.4);
  for (const [i, [mx, my, mw, md]] of c.moss.entries()) J.mossCap(ctx, mx, my, mw, c.seed + 42 + i, md);
  clipped(ctx, body, () => {
    for (let x = 2; x < w - 4; x += 8 + r() * 8) J.mossCap(ctx, x, c.base - 4.6, 4 + r() * 6, c.seed + 90 + round(x), 1.4);
  });
  for (const [i, [vx, vy, len]] of c.vines.entries()) J.vine(ctx, vx, vy, len, c.seed + 60 + i);
  for (const [i, [lx, ly, rx, rr]] of c.leaves.entries()) J.leafBlob(ctx, lx, ly, rx, rr, c.seed + 100 + i * 7, i % 2 ? HEDGE : LEAF);
  for (const [i, g] of c.glass.entries()) {
    const gx = g.map(p => p[0]), gy = g.map(p => p[1]);
    J.frond(ctx, (min(...gx) + max(...gx)) / 2, max(...gy) - 1, 9, -PI / 2 + (i ? 0.7 : -0.7), c.seed + 110 + i, LEAF);
  }
  for (const [i, [fx, fh]] of c.ferns.entries()) {
    ctx.save();
    ctx.translate(fx, 0);
    J.fern(ctx, 0, fh, c.seed + 120 + i * 5, i % 2 ? LEAF : HEDGE);
    ctx.restore();
  }
  J.grass(ctx, -4, w + 8, 4, c.seed + 130);
}

define({
  id: "overgrownWreck",
  box: [-9, -62, 118, 2],
  draw(ctx, state) {
    const c = WRECKS[state] ?? WRECKS[0];
    overgrow(ctx, c, vehicle(ctx, c));
  }
});

const JEEP = {
  top: [[0, -10], [0, -30], [2, -31.5], [40, -31.5], [42.5, -25], [55.5, -25], [58, -32.5], [89, -31], [93, -28], [94, -10]],
  base: -10, belt: -25, roof: [58, 89, -32.5],
  wheels: [[20, 10.5, "tyre"], [76, 10.5, "tyre"]],
  glass: [],
  doors: [42.5, 55.5], handles: [[49, -21.5]],
  holes: [],
  seams: [[[58, -32.5], [59.5, -18]], [[86, -31], [87, -18]]],
  bars: [
    [[3, -30], [-6, -54]],
    [[15, -30], [-6, -54]],
    [[-1, -42], [9, -42]],
    [[58.5, -32.5], [56, -50], [58, -51.5], [62, -51.5], [64.5, -32.5]]
  ],
  screen: [[59.5, -33], [57.4, -49.6], [61.2, -49.6], [63.2, -33]],
  seats: [
    { pts: [[22, -30], [20.5, -41.5], [26, -43], [29, -30]], lit: [18, -44, 4, 16] },
    { pts: [[42, -25], [40, -40], [44.5, -41.5], [47, -25]], lit: [38, -42, 4, 18] }
  ],
  wheelPost: [[57, -26], [52, -35.5]],
  grille: [89, 93, -28, -15],
  tail: [0.4, -29, 2.4, 3.4], head: [90, -26, 3.4, 3.4],
  bumpers: [[-3, -14, 5, 3], [92, -14, 6, 3]],
  tones: ["#14302a", "#24543f", "#34704f", "#68a080", "#08120e"],
  mid: "#2c624a",
  camo: [[12, -24, 8, 3.4, "#122a20"], [33, -19, 7, 3, "#122a20"], [50, -21, 4, 2.4, "#4c6a38"], [68, -27.5, 9, 3, "#122a20"], [83, -19, 6, 2.6, "#4c6a38"], [25, -27.5, 6, 2.2, "#4c6a38"], [72, -17, 6, 2.2, "#122a20"]],
  rust: 14,
  seed: 7560
};

define({
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
    if (!simple()) flat(ctx, 80, -33.2, 3, 2, state === 0 ? "#86200e" : "y2", c.tones[4]);
    J.mossCap(ctx, 66, -32.6, 9, c.seed + 41, 1.2);
    J.mossCap(ctx, 4, -31.8, 6, c.seed + 42, 1);
    J.grass(ctx, 30, 36, 3, c.seed + 130);
  }
});

function berryBush(ctx, seed) {
  const r = rng(seed);
  for (const [sx, a] of [[16, -1.9], [24, -1.6], [32, -1.3]]) line(ctx, [[sx + 4, 0], [sx + 4 + cos(a) * 14, sin(a) * 14]], WOOD[1], 1);
  J.leafBlob(ctx, 24, -14, 18, 12, seed, BERRY);
  J.leafBlob(ctx, 14, -8, 10, 7, seed + 1, BERRY);
  J.leafBlob(ctx, 34, -9, 11, 8, seed + 2, BERRY);
  const n = simple() ? 4 : 9;
  for (let i = 0; i < n; i++) {
    const bx = 10 + r() * 28;
    const by = -6 - r() * 16;
    disc(ctx, bx, by, simple() ? 1.4 : 1.1, "#8c1c10", "#2a0804");
    if (!simple()) flat(ctx, bx - 0.5, by - 0.6, 0.6, 0.6, "#d86a4a");
  }
}

function broadLeaf(ctx, x, len, a, seed, tones, slim = 0.3) {
  const nx = -sin(a), ny = cos(a);
  const bend = (k) => len * 0.12 * k * k;
  const at = (k, s) => [x + cos(a) * len * k + nx * (len * slim * s * sin(PI * min(1, k * 1.15)) + bend(k)), sin(a) * len * k + ny * (len * slim * s * sin(PI * min(1, k * 1.15)) + bend(k)) + bend(k)];
  const n = simple() ? 5 : 9;
  const side = (s) => Array.from({ length: n + 1 }, (_, i) => at(i / n, s));
  const upper = side(1);
  const pts = [...upper, ...side(-1).reverse()];
  shape(ctx, pts, tones[seed % 2 ? 1 : 2], tones[0]);
  if (!simple()) {
    clipped(ctx, pts, () => shape(ctx, [...upper, ...side(0).reverse()], tones[3]));
    curve(ctx, side(0), tones[0], 0.6);
  }
}

define({
  id: "fernBush",
  box: [-4, -38, 52, 1],
  draw(ctx, state) {
    const seed = 7600 + state * 17;
    if (state === 1) return berryBush(ctx, seed);
    if (state === 2) {
      const leaves = [[22, 26, -2.2], [26, 30, -1.7], [24, 28, -1.2], [20, 18, -2.7], [28, 20, -0.5]];
      leaves.forEach(([x, len, a], i) => broadLeaf(ctx, x, len, a, seed + i, LEAF_DARK));
      J.grass(ctx, 12, 24, 5, seed + 9);
      return;
    }
    const r = rng(seed);
    J.leafBlob(ctx, 22, -4, 16, 4, seed + 1, LEAF);
    if (simple()) for (let i = 0; i < 7; i++) broadLeaf(ctx, 22 + (r() - 0.5) * 6, 22 + r() * 10, -PI / 2 + (i / 6 - 0.5) * 2.4, seed + i, i % 2 ? LEAF : HEDGE, 0.12);
    ctx.save();
    ctx.translate(24, 0);
    J.fern(ctx, 0, 30, seed);
    ctx.restore();
    ctx.save();
    ctx.translate(10, 0);
    J.fern(ctx, 0, 16, seed + 3, HEDGE);
    ctx.restore();
    J.grass(ctx, 4, 40, 6, seed + 5);
  }
});

function log(ctx, x, y, len, rr, seed, cutLeft = false) {
  const r = rng(seed);
  const body = G.rectPts(x, y - rr * 2, len, rr * 2);
  shape(ctx, body, WOOD[2], WOOD[4]);
  bands(ctx, x, y - rr * 2, len, rr * 2, [[0, 0.22, WOOD[3]], [0.62, 0.86, WOOD[1]], [0.86, 1, WOOD[0]]]);
  if (!simple()) for (let k = 0; k < 4; k++) {
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
  G.inside(ctx, () => { ctx.beginPath(); ctx.ellipse(ex + 0.3, y - rr, rr * 0.36, rr * 0.82, 0, 0, PI * 2); }, () => G.dirt(ctx, ex - rr, y - rr * 2, rr * 2, rr * 2, seed + 3, 0.4));
}

define({
  id: "logPile",
  box: [-2, -32, 62, 1],
  draw(ctx, state) {
    const seed = 7700 + state * 11;
    if (state === 1) {
      log(ctx, 2, 0, 50, 6, seed, true);
      line(ctx, [[20, -11], [16, -17], [12, -19]], WOOD[4], 2.6);
      line(ctx, [[20, -11], [16, -17], [12, -19]], WOOD[2], 1.6);
      J.mossCap(ctx, 6, -12, 24, seed + 4, 2);
      if (!simple()) {
        ctx.save();
        ctx.translate(40, -11);
        J.fern(ctx, 0, 9, seed + 6, HEDGE);
        ctx.restore();
      }
      J.grass(ctx, 0, 56, 4, seed + 7);
      return;
    }
    log(ctx, 2, 0, 46, 5.5, seed, true);
    log(ctx, 6, 0, 46, 5.5, seed + 10);
    log(ctx, 4, -11, 44, 5.5, seed + 20, true);
    log(ctx, 9, -22, 36, 5, seed + 30);
    J.mossCap(ctx, 10, -32, 22, seed + 40, 2.2);
    J.mossCap(ctx, 4, -22, 12, seed + 41, 1.6);
    J.grass(ctx, 0, 60, 4, seed + 42);
  }
});

function drum(ctx, x, y, w, h, seed) {
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
}

define({
  id: "oilDrum",
  box: [-2, -30, 46, 2],
  draw(ctx, state) {
    const seed = 7800 + state * 7;
    if (state === 1) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      shape(ctx, J.blobPts(32, -0.4, 13, 2.6, seed + 20, 10, 0.3), "#0a0806");
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
      J.mossCap(ctx, 4, -h, 14, seed + 3, 2);
      return;
    }
    drum(ctx, 2, -25, 17, 25, seed);
    J.mossCap(ctx, 2, -26.6, 12, seed + 5, 2.4);
    if (!simple()) J.vine(ctx, 16, -25, 14, seed + 6);
    J.grass(ctx, 0, 22, 4, seed + 7);
  }
});

define({
  id: "rockVent",
  box: [-2, -38, 50, 0],
  draw(ctx, state) {
    const seed = 7900 + state * 5;
    const cx = 24, cy = -16, rx = 20, ry = 12;
    shape(ctx, J.blobPts(cx, cy, rx + 4, ry + 4, seed, 14, 0.12), "#141410");
    oval(ctx, cx, cy, rx, ry, VENT[2], VENT[4]);
    oval(ctx, cx, cy - 0.8, rx - 1.4, ry - 1.6, VENT[3]);
    oval(ctx, cx, cy + 0.4, rx - 2, ry - 2.2, VENT[1]);
    const irx = rx - 3.4, iry = ry - 3.4;
    oval(ctx, cx, cy, irx, iry, HOLE, VENT[4]);
    const inner = () => { ctx.beginPath(); ctx.ellipse(cx, cy, irx, iry, 0, 0, PI * 2); };
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
    if (!simple()) for (let k = 0; k < 10; k++) {
      const a = (k / 10) * PI * 2;
      disc(ctx, cx + cos(a) * (rx - 1.6), cy + sin(a) * (ry - 1.4), 0.6, VENT[0]);
    }
    for (const sx of [-1, 1]) flat(ctx, cx + sx * (rx - 1) - 2, cy - 2, 4, 4, VENT[1], VENT[4]);
    const rimRegion = () => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2); ctx.ellipse(cx, cy, irx, iry, 0, 0, PI * 2); };
    G.inside(ctx, () => { rimRegion(); ctx.clip("evenodd"); ctx.beginPath(); ctx.rect(cx - rx, cy - ry, rx * 2, ry * 2); }, () => {
      G.grain(ctx, G.rectRegion(ctx, cx - rx, cy - ry, rx * 2, ry * 2), seed + 1);
      G.rustPatch(ctx, cx + rx * 0.6, cy + ry * 0.7, 4, 1.6, seed + 2);
      G.rustPatch(ctx, cx - rx * 0.7, cy - ry * 0.5, 2.4, 1.6, seed + 3);
      if (state === 1) G.rustPatch(ctx, cx, cy + ry * 0.85, 6, 1.6, seed + 4);
    });
    G.drips(ctx, cx - rx * 0.6, cy + ry - 1, rx * 1.2, 12, seed + 5, state === 1 ? 4 : 2);
  }
});

define({
  id: "energySign",
  box: [-2, -32, 26, 0],
  draw(ctx, state) {
    const seed = 8000 + state * 3;
    const lit = state === 0;
    const cx = 12, cy = -20, rr = 10;
    flat(ctx, 10, -10, 4, 10, VENT[1], VENT[4]);
    flat(ctx, 6, -2, 12, 2, VENT[2], VENT[4]);
    G.drips(ctx, 10, -9, 4, 8, seed, 1);
    const oct = Array.from({ length: 8 }, (_, i) => {
      const a = PI / 8 + i * PI / 4;
      return [cx + cos(a) * rr, cy + sin(a) * rr];
    });
    if (lit && !simple()) glow(ctx, cx, cy, 16, SIGN[3], 0.3);
    shape(ctx, oct, lit ? SIGN[2] : "#9c8a44", SIGN[4]);
    const inner = oct.map(([x, y]) => [cx + (x - cx) * 0.8, cy + (y - cy) * 0.8]);
    shape(ctx, inner, lit ? SIGN[1] : "#7c6c34");
    if (!simple()) clipped(ctx, inner, () => flat(ctx, cx - rr, cy - rr, rr * 2, rr * 0.5, lit ? SIGN[3] : "#a8985c"));
    const ink = lit ? "#120e04" : "#2a2410";
    flat(ctx, cx - 4, cy - 5, 2.4, 10, ink);
    for (const [dy, w] of [[-5, 8], [-1.1, 6], [2.6, 8]]) flat(ctx, cx - 4, cy + dy, w, 2.4, ink);
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
  }
});
})();
