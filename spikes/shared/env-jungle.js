(() => {
const { define, P, G } = window.ENV;
const { rng, path, color, flat, box, poly, cylH, disc, rivets, glow, stroke, shape, line, curve, mesh, text } = P;
const { PI, sin, cos, min, max, round } = Math;

const simple = () => window.ENV.simple;

const STONE = ["#2c2a22", "#4c493d", "#716c5a", "#a39c84"];
const MOSS = ["#17220e", "#2a3c18", "#43602a", "#6c8a3c"];
const COBBLE = ["#0a0e0a", "#141b13", "#1d2719", "#2a3624"];
const LEAF = ["#0c1c14", "#183424", "#285034", "#457a48"];
const BUNKER = ["#3e3a36", "#5e5852", "#7e7770", "#a39b92"];
const RED = ["#4a0e08", "#86200e", "#b8381a", "#e06a3a"];
const WATER = ["#4c6266", "#7c9498", "#a8bcbe", "#dce8e8"];
const SLINE = "#12100b";
const CLINE = "#080c08";
const COBBLE_UNITS = 96;
const COBBLE_PX = 4;

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

function mossTuft(ctx, x, y, len, seed) {
  const r = rng(seed);
  for (let i = 0; i < 3; i++) {
    const dx = (r() - 0.5) * 5;
    curve(ctx, [[x + dx, y], [x + dx + (r() - 0.5) * 2, y + len * 0.5], [x + dx + (r() - 0.5) * 3, y + len * (0.6 + r() * 0.4)]], MOSS[1 + (i % 2)], 1.1);
  }
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

function cellStones(g, x, y, seed) {
  const r = rng(seed);
  const rows = r() < 0.5 ? [[0, 11], [11, 13]] : [[0, 13], [13, 11]];
  for (const [oy, h] of rows) {
    const cut = 7 + r() * 10;
    for (const [ox, w] of [[0, cut], [cut, 24 - cut]]) {
      const tone = r() < 0.18 ? 3 : r() < 0.5 ? 2 : 1;
      const cx = x + ox + w / 2;
      const cy = y + oy + h / 2;
      shape(g, blobPts(cx, cy, w / 2 - 0.7, h / 2 - 0.7, seed + ox * 3 + oy, 10, 0.08), COBBLE[tone]);
      if (!simple()) {
        shape(g, blobPts(cx - w * 0.12, cy - h * 0.18, w * 0.28, h * 0.2, seed + ox + oy + 40, 7, 0.2), COBBLE[min(3, tone + 1)]);
        if (r() < 0.3) shape(g, blobPts(cx, cy - h * 0.32, w * 0.36, h * 0.14, seed + ox + oy + 80, 7, 0.3), MOSS[1]);
      }
    }
  }
}

const cobbleCanvases = {};

function makeCobble() {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = COBBLE_UNITS * COBBLE_PX;
  const g = c.getContext("2d");
  if (!g) return null;
  g.scale(COBBLE_PX, COBBLE_PX);
  flat(g, 0, 0, COBBLE_UNITS, COBBLE_UNITS, COBBLE[0]);
  for (let j = 0; j < COBBLE_UNITS / 24; j++) for (let i = 0; i < COBBLE_UNITS / 24; i++) cellStones(g, i * 24, j * 24, 300 + j * 7 + i * 3);
  return c;
}

function cobbleFill(ctx, x, y, w, h) {
  const key = simple() ? "lod" : "full";
  if (!(key in cobbleCanvases)) cobbleCanvases[key] = makeCobble();
  const c = cobbleCanvases[key];
  const p = c && ctx.createPattern(c, "repeat");
  if (!p) return flat(ctx, x, y, w, h, COBBLE[1]);
  p.setTransform(new DOMMatrix([1 / COBBLE_PX, 0, 0, 1 / COBBLE_PX, 0, 0]));
  ctx.save();
  ctx.fillStyle = p;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.restore();
}

define({
  id: "jungleRock",
  box: [0, -168, 72, 0],
  draw(ctx, state, t, { w = 72, h = 168 } = {}) {
    cobbleFill(ctx, 0, -h, w, h);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), 400 + round(w * 3 + h), 0.7);
  }
});

define({
  id: "jungleRockTop",
  box: [0, -3, 120, 24],
  draw(ctx, state, t, { w = 120 } = {}) {
    const seed = 440 + round(w) * 5;
    const r = rng(seed);
    cobbleFill(ctx, 0, 0, w, 24);
    G.grain(ctx, G.rectRegion(ctx, 0, 0, w, 24), seed, 0.7);
    mossCap(ctx, 0, 0, w, seed + 1, 3.5);
    if (!simple()) for (let x = 2 + r() * 6; x < w - 4; x += 9 + r() * 16) {
      ctx.save();
      ctx.translate(0, 0.4);
      grass(ctx, x, 3 + r() * 4, 2.5 + r() * 2.5, seed + round(x));
      ctx.restore();
    }
  }
});

function ledgeStones(ctx, w, seed) {
  const r = rng(seed);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, -1, w, 26);
  ctx.clip();
  flat(ctx, 0, 4, w, 16, "#0d100b");
  for (let x = -4 - r() * 4; x < w + 6;) {
    const sw = 12 + r() * 7;
    stone(ctx, x + sw / 2, 10.5, sw / 2 + 0.6, 6.4, seed + round(x) * 3);
    x += sw;
  }
  for (let x = -10 + r() * 6; x < w + 8;) {
    const sw = 13 + r() * 9;
    stone(ctx, x + sw / 2, 18.6, sw / 2 + 0.8, 5.4 + r() * 1.4, seed + 500 + round(x) * 3);
    x += sw;
  }
  ctx.restore();
}

define({
  id: "jungleLedge",
  box: [0, -2, 120, 26],
  draw(ctx, state, t, { w = 120 } = {}) {
    const seed = 420 + round(w) * 7;
    const r = rng(seed);
    ledgeStones(ctx, w, seed);
    G.grain(ctx, G.rectRegion(ctx, 0, 4, w, 21), seed + 1, 0.8);
    box(ctx, 0, -0.5, w, 4.5, "rust", 2);
    if (!simple()) for (let x = 3; x < w - 2; x += 8) flat(ctx, x, 0.5, 3, 1, "y1");
    for (let x = 7; x < w - 9; x += 24) {
      box(ctx, x, 3.5, 10, 4, "rust", 1);
      if (!simple()) line(ctx, [[x + 1.5, 4.2], [x + 8.5, 6.8]], "r0", 0.6);
    }
    G.grain(ctx, G.rectRegion(ctx, 0, -0.5, w, 8), seed + 2, 0.8);
    G.chips(ctx, 0, 0, w, seed + 3);
    G.drips(ctx, 0, 4, w, 9, seed + 4, max(1, round(w / 30)));
    if (!simple()) for (let x = 6 + r() * 20; x < w - 6; x += 22 + r() * 46) mossTuft(ctx, x, 4, 4 + r() * 7, seed + round(x));
  }
});

define({
  id: "jungleSpan",
  box: [0, -26, 120, 2],
  draw(ctx, state, t, size) {
    ctx.translate(0, -24);
    window.ENV.ASSETS.find((a) => a.id === "jungleLedge").draw(ctx, state, t, size);
  }
});

function beamPanel(ctx, x, w, seed) {
  flat(ctx, x + 2, 5, w - 4, 10, "r0", "rLine");
  flat(ctx, x + 3.5, 6.5, w - 7, 7, "r1");
  if (!simple()) {
    flat(ctx, x + 3.5, 6.5, w - 7, 1.2, "#00000040");
    for (const [px, py] of [[x + 5, 8], [x + w - 5, 8], [x + 5, 12], [x + w - 5, 12]]) disc(ctx, px, py, 0.9, "r3");
  }
  if (rng(seed)() < 0.4) G.rustPatch(ctx, x + w * 0.5, 10, 3, 2, seed);
}

function steelDeck(ctx, w, seed) {
  box(ctx, 0, 3, w, 15, "steel", 1);
  for (let x = 0; x < w - 4; x += 24) {
    flat(ctx, x + 2, 6, 20, 8, "m0", "mLine");
    line(ctx, [[x + 4, 13], [x + 12, 7], [x + 20, 13]], "r2", 1.6);
    if (!simple()) disc(ctx, x + 12, 10, 1, "m3");
  }
  box(ctx, 0, -0.5, w, 4, "steel", 2);
  if (!simple()) flat(ctx, 0, 0.2, w, 0.8, "m3");
  box(ctx, 0, 17, w, 4, "rust", 2);
  box(ctx, 0, 10, w, 3, "chrome", 1);
  rivets(ctx, 2, 1.4, w - 4, 8, "m3");
  G.grain(ctx, G.rectRegion(ctx, 0, -0.5, w, 21.5), seed + 1);
  G.drips(ctx, 0, 20, w, 8, seed + 3, max(1, round(w / 30)));
  G.chips(ctx, 0, 0, w, seed + 4);
  G.dirt(ctx, 0, 3, w, 15, seed + 5, 0.3);
}

define({
  id: "jungleBeam",
  box: [0, -1, 96, 21],
  draw(ctx, state, t, { w = 96 } = {}) {
    const seed = 460 + round(w) * 3;
    if (state === 1) return steelDeck(ctx, w, seed);
    box(ctx, 0, 3, w, 14, "rust", 1);
    for (let x = 0; x < w - 4; x += 24) beamPanel(ctx, x, min(24, w - x), seed + x);
    box(ctx, 0, -0.5, w, 4, "rust", 2);
    box(ctx, 0, 16, w, 4, "rust", 2);
    rivets(ctx, 2, 1.4, w - 4, 6, "r3");
    rivets(ctx, 2, 18, w - 4, 6, "r3");
    G.grain(ctx, G.rectRegion(ctx, 0, -0.5, w, 20.5), seed + 1);
    G.drips(ctx, 0, 3.5, w, 12, seed + 2, max(1, round(w / 20)));
    G.drips(ctx, 0, 19.5, w, 6, seed + 3, max(1, round(w / 36)));
    G.chips(ctx, 0, 0, w, seed + 4);
    G.dirt(ctx, 0, 3, w, 14, seed + 5, 0.3);
  }
});

function braceSegment(ctx, x, y, w, h, seed) {
  flat(ctx, x, y, w, h, "r0");
  line(ctx, [[x + 2, y + 2], [x + w - 2, y + h - 2]], "rLine", 3.6, "butt");
  line(ctx, [[x + w - 2, y + 2], [x + 2, y + h - 2]], "rLine", 3.6, "butt");
  line(ctx, [[x + 2, y + 2], [x + w - 2, y + h - 2]], "r2", 2.4, "butt");
  line(ctx, [[x + w - 2, y + 2], [x + 2, y + h - 2]], "r1", 2.4, "butt");
  box(ctx, x - 0.5, y, w + 1, 2.4, "rust", 2);
  if (!simple()) disc(ctx, x + w / 2, y + h / 2, 1.3, "r3", "rLine");
  if (rng(seed)() < 0.3) G.rustPatch(ctx, x + w / 2, y + h * 0.7, 2, 2, seed);
}

define({
  id: "girderColumn",
  box: [2, -96, 22, 0],
  draw(ctx, state, t, { h = 96 } = {}) {
    const seed = 480 + round(h);
    const n = max(1, round(h / 18));
    const s = h / n;
    for (let i = 0; i < n; i++) braceSegment(ctx, 5, -h + i * s, 14, s, seed + i * 5);
    box(ctx, 3, -h, 3, h, "rust", 2, { vertical: true });
    box(ctx, 18, -h, 3, h, "rust", 1, { vertical: true });
    if (!simple()) for (let y = -h + 4; y < -2; y += 9) {
      flat(ctx, 4, y, 1.2, 1.2, "r3");
      flat(ctx, 19, y, 1.2, 1.2, "r3");
    }
    G.grain(ctx, G.rectRegion(ctx, 3, -h, 18, h), seed + 1);
    G.drips(ctx, 4, -h, 16, min(h * 0.4, 40), seed + 2, max(1, round(h / 40)));
    G.dirt(ctx, 3, -h, 18, h, seed + 3, min(0.3, 30 / h));
  }
});

define({
  id: "jungleTower",
  box: [-2, -240, 50, 0],
  draw(ctx, state, t, { w = 48, h = 240 } = {}) {
    const seed = 500 + round(h) + round(w) * 3;
    const n = max(1, round(h / w));
    const s = h / n;
    for (let i = 0; i < n; i++) {
      const y = -h + i * s;
      for (const [ax, ay, bx, by, c] of [[7, y + 3, w - 7, y + s - 3, "r2"], [w - 7, y + 3, 7, y + s - 3, "r1"]]) {
        line(ctx, [[ax, ay], [bx, by]], "rLine", 5.4, "butt");
        line(ctx, [[ax, ay], [bx, by]], c, 4, "butt");
        if (!simple()) line(ctx, [[ax, ay], [bx, by]], "r3", 0.8, "butt");
      }
      box(ctx, 6, y, w - 12, 3.5, "rust", 2);
      if (!simple()) {
        flat(ctx, w / 2 - 3, y + s / 2 - 3, 6, 6, "r1", "rLine");
        disc(ctx, w / 2, y + s / 2, 1.2, "r3");
      }
    }
    for (const x of [0, w - 8]) {
      box(ctx, x, -h, 8, h, "rust", x ? 1 : 2, { vertical: true });
      flat(ctx, x + 3, -h, 2, h, "r0");
      if (!simple()) for (let y = -h + 5; y < -2; y += 10) {
        flat(ctx, x + 1, y, 1.3, 1.3, "r3");
        flat(ctx, x + 5.7, y, 1.3, 1.3, "r3");
      }
      G.grain(ctx, G.rectRegion(ctx, x, -h, 8, h), seed + x);
      G.drips(ctx, x, -h, 8, min(h * 0.3, 60), seed + x + 1, max(1, round(h / 60)));
    }
    box(ctx, -2, -6, w + 4, 6, "rust", 1);
    G.dirt(ctx, 0, -h, w, h, seed + 9, min(0.25, 40 / h));
  }
});

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

function stack(ctx, w, h, seed, slope) {
  const r = rng(seed);
  let y = 0;
  let i = 0;
  while (y > -h) {
    const sh = 18 + r() * 16;
    const k = slope ? 1 - (-y + sh / 2) / h : 0;
    const sw = slope ? w * (0.35 + k * 0.65) : w * (0.5 + r() * 0.5);
    const sx = slope ? 0 : (w - sw) * r();
    slab(ctx, sx, y - sh, sw, sh, seed + i * 13);
    y -= sh * (0.78 + r() * 0.12);
    i++;
  }
  G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 0.7);
  G.dirt(ctx, 0, -h, w, h, seed + 2, min(0.3, 30 / h));
}

define({
  id: "rockLedges",
  box: [-3, -196, 147, 1],
  draw(ctx, state, t, { w = 144, h = 192 } = {}) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-3, -h - 4, w + 6, h + 5);
    ctx.clip();
    stack(ctx, w, h, 520 + round(w) + round(h) * 3, false);
    ctx.restore();
  }
});

define({
  id: "rockSlope",
  box: [-3, -148, 147, 1],
  draw(ctx, state, t, { w = 144, h = 144 } = {}) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-3, -h - 4, w + 6, h + 5);
    ctx.clip();
    stack(ctx, w, h, 540 + round(w) + round(h) * 3, true);
    ctx.restore();
  }
});

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
  flat(ctx, -2, -h - 5, w + 4, 6, BUNKER[2], CLINE);
  if (!simple()) flat(ctx, -2, -h - 5, w + 4, 1.4, BUNKER[3]);
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

function roofUnit(ctx, x, h, seed) {
  box(ctx, x, -h - 17, 22, 12, "steel", 1);
  for (let k = 0; k < 4; k++) flat(ctx, x + 3 + k * 4.5, -h - 14, 2, 7, "m1");
  line(ctx, [[x + 30, -h - 5], [x + 31, -h - 26]], "m2", 1.4);
  for (const y of [-h - 22, -h - 16]) line(ctx, [[x + 26, y], [x + 36, y + 1]], "m2", 1);
  G.grain(ctx, G.rectRegion(ctx, x, -h - 17, 22, 12), seed);
  G.drips(ctx, x, -h - 7, 22, 10, seed + 1, 2);
}

function shellHole(ctx, cx, cy, seed) {
  const pts = blobPts(cx, cy, 20, 15, seed, 11, 0.32);
  G.scorch(ctx, pts, seed + 1);
  shape(ctx, pts, "#060807");
  if (!simple()) {
    const r = rng(seed + 2);
    for (let k = 0; k < 4; k++) {
      const x = cx - 12 + k * 8 + r() * 3;
      curve(ctx, [[x, cy - 14], [x + (r() - 0.5) * 6, cy - 2], [x + (r() - 0.5) * 10, cy + 6]], "r1", 0.9);
    }
  }
  G.rim(ctx, pts, seed + 3, BUNKER[3], CLINE);
}

function rubble(ctx, x, w, seed) {
  const r = rng(seed);
  for (let i = 0; i < 11; i++) stone(ctx, x + r() * w, -3 - r() * 5, 4 + r() * 5, 3 + r() * 3, seed + i * 3, BUNKER);
}

define({
  id: "jungleBuilding",
  box: [-3, -102, 195, 0],
  draw(ctx, state, t, { w = 192, h = 96 } = {}) {
    const seed = 560 + round(w) * 3 + round(h) + state * 17;
    bunkerBody(ctx, w, h, seed);
    if (state === 1) {
      door(ctx, w - 44, min(h - 18, 54), false);
      bunkerWindows(ctx, w, h, 20, w - 52, seed + 7);
    } else if (state === 2) {
      const hx = round(w * 0.58);
      bunkerWindows(ctx, w, h, 20, w - 16, seed + 7, [hx - 24, hx + 24]);
    } else bunkerWindows(ctx, w, h, 20, w - 16, seed + 7);
    bunkerGrime(ctx, w, h, seed + 9);
    if (state === 1) roofUnit(ctx, 18, h, seed + 11);
    if (state === 2) {
      const hx = round(w * 0.58);
      shellHole(ctx, hx, -h * 0.55, seed + 13);
      rubble(ctx, hx - 22, 44, seed + 15);
    }
  }
});

function door(ctx, x, h, open) {
  flat(ctx, x - 4, -h, 36, h, BUNKER[0], CLINE);
  if (open) {
    flat(ctx, x, -h + 4, 28, h - 4, "#060807");
    shape(ctx, [[x, -h + 4], [x + 9, -h + 8], [x + 9, -2], [x, 0]], "m1", "mLine");
    return;
  }
  flat(ctx, x, -h + 4, 28, h - 4, "m2", "mLine");
  for (const y of [-h + 10, -h * 0.5, -10]) flat(ctx, x + 2, y, 24, 2, "m1");
  flat(ctx, x + 21, -h * 0.45, 4, 3, "c1", "mLine");
  if (!simple()) {
    flat(ctx, x + 1, -h + 5, 1.2, h - 6, "m3");
    G.rustPatch(ctx, x + 8, -12, 4, 3, 600 + x);
  }
}

define({
  id: "flamethrowerDoor",
  box: [-3, -102, 243, 0],
  draw(ctx, state, t, { w = 240, h = 96 } = {}) {
    const seed = 580 + round(w);
    const dh = min(h - 18, 54);
    bunkerBody(ctx, w, h, seed);
    door(ctx, 28, dh, state === 1);
    disc(ctx, 42, -dh - 9, 3, RED[2], CLINE);
    if (!simple()) {
      disc(ctx, 41, -dh - 10, 1, RED[3]);
      glow(ctx, 42, -dh - 9, 10, RED[3], 0.4);
    }
    bunkerWindows(ctx, w, h, 80, w - 16, seed + 7);
    bunkerGrime(ctx, w, h, seed + 9);
  }
});

const waterFlow = (ctx, w, h, t) => {
  const r = rng(630 + round(w));
  ctx.save();
  ctx.globalAlpha *= 0.55;
  for (let x = 1; x < w - 1; x += 4 + r() * 5) {
    const speed = 150 + r() * 90;
    const gap = 48 + r() * 50;
    const len = 10 + r() * 18;
    const width = 1 + r() * 1.6;
    const shift = (r() * gap + t * speed) % gap;
    for (let y = -h - gap + shift; y < -len; y += gap) if (y > -h) flat(ctx, x, y, width, len, WATER[3]);
    if (simple()) x += 6;
  }
  ctx.restore();
};

define({
  id: "waterfall",
  box: [-10, -441, 154, 10],
  anim: true,
  draw(ctx, state, t, { w = 144, h = 432 } = {}) {
    if (state === 1) return waterFlow(ctx, w, h, t);
    const seed = 620 + round(w);
    const r = rng(seed);
    flat(ctx, 0, -h, w, h, WATER[1]);
    for (let x = 0; x < w; x += 3 + r() * 4) flat(ctx, x, -h, 1 + r() * 3, h, WATER[r() < 0.5 ? 0 : 2]);
    if (!simple()) for (let x = 2; x < w; x += 6 + r() * 6) for (let y = -h + r() * 30; y < -8; y += 24 + r() * 40) flat(ctx, x, y, 1.4, 6 + r() * 14, WATER[3]);
    for (const x of [0, w]) shape(ctx, blobPts(x, -h + 6, 10, 9, seed + x, 9, 0.3), STONE[1], SLINE);
    flat(ctx, -2, -h, w + 4, 4, WATER[3]);
    ctx.save();
    ctx.globalAlpha = 0.85;
    for (let x = -4; x < w + 4; x += 7 + r() * 5) shape(ctx, blobPts(x, -2, 6 + r() * 4, 4 + r() * 3, seed + round(x) * 5, 8, 0.35), WATER[3]);
    ctx.restore();
    if (!simple()) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      for (let x = 0; x < w; x += 14) shape(ctx, blobPts(x + 7, -12, 11, 8, seed + x + 77, 8, 0.4), WATER[3]);
      ctx.restore();
    }
  }
});

define({
  id: "spikes",
  box: [0, -21, 192, 1],
  draw(ctx, state, t, { w = 192 } = {}) {
    const r = rng(640 + round(w));
    flat(ctx, 0, -3, w, 3, "r0", "rLine");
    for (let x = 1; x < w - 3; x += 4.6) {
      const hh = 14 + r() * 5;
      shape(ctx, [[x, -2], [x + 1.9, -hh], [x + 3.8, -2]], "c1", "mLine");
      if (!simple()) {
        line(ctx, [[x + 1.9, -hh + 1], [x + 1.2, -3]], "c3", 0.5);
        if (r() < 0.3) shape(ctx, [[x + 1.2, -hh + 4], [x + 1.9, -hh], [x + 2.6, -hh + 4]], "blood");
      }
    }
    G.grain(ctx, G.rectRegion(ctx, 0, -21, w, 21), 641 + round(w), 0.6);
    G.dirt(ctx, 0, -8, w, 8, 642, 0.5);
  }
});

define({
  id: "caveChasm",
  box: [0, -240, 96, 0],
  draw(ctx, state, t, { w = 96, h = 240 } = {}) {
    const bands = ["#0b0f0c", "#080b09", "#050706", "#030404", "#020202"];
    const step = h / bands.length;
    bands.forEach((c, i) => flat(ctx, 0, -h + i * step, w, step + 0.5, c));
    if (simple()) return;
    const r = rng(660 + round(w));
    ctx.save();
    ctx.globalAlpha = 0.18;
    for (let y = -h + 6; y < -h + 60; y += 9) shape(ctx, blobPts(w * r(), y, w * 0.4, 4, 661 + round(y), 8, 0.4), "#5c7468");
    ctx.restore();
    for (let i = 0; i < 4; i++) flat(ctx, w * (0.1 + r() * 0.8), -h, 0.8, 10 + r() * 30, "#24302a");
  }
});

const CAPSULE = [[4, -24], [10, -36], [38, -36], [44, -24], [38, -8], [10, -8]];

define({
  id: "caveCapsule",
  box: [-2, -38, 50, 1],
  draw(ctx) {
    for (const x of [8, 36]) {
      line(ctx, [[x, -8], [x - 4, 0]], "mLine", 2.6);
      line(ctx, [[x, -8], [x - 4, 0]], "m2", 1.6);
    }
    shape(ctx, CAPSULE, "m2", "mLine");
    ctx.save();
    path(ctx, CAPSULE);
    ctx.clip();
    flat(ctx, 0, -36, 48, 8, "m3");
    flat(ctx, 0, -16, 48, 8, "m1");
    ctx.restore();
    flat(ctx, 14, -29, 20, 6, "glass", "mLine");
    if (!simple()) {
      flat(ctx, 15, -28, 6, 1.4, "c1");
      for (const x of [8, 40]) disc(ctx, x, -22, 1, "c2");
    }
    G.grain(ctx, G.polyRegion(ctx, CAPSULE), 671);
    G.drips(ctx, 8, -30, 32, 18, 672, 4);
    mossCap(ctx, 12, -36, 18, 673, 2);
  }
});

const HELI = [[6, -8], [0, -20], [4, -34], [16, -48], [34, -56], [60, -58], [80, -54], [94, -42], [98, -26], [90, -10], [60, -4], [24, -3]];

function heliBody(ctx, seed) {
  poly(ctx, HELI, "rust", 2, { dir: [0, 1] });
  ctx.save();
  path(ctx, HELI);
  ctx.clip();
  flat(ctx, 0, -60, 100, 12, "r3");
  flat(ctx, 0, -16, 100, 16, "r1");
  if (!simple()) for (let x = 28; x < 92; x += 14) flat(ctx, x, -52, 0.8, 46, "#00000044");
  ctx.restore();
  path(ctx, HELI);
  stroke(ctx, "kLine");
  shape(ctx, [[3, -22], [8, -36], [20, -48], [32, -53], [34, -30], [18, -12]], "#13201c", "kLine");
  if (!simple()) {
    shape(ctx, [[10, -34], [14, -42], [22, -46], [16, -38]], "#4a6a64");
    line(ctx, [[18, -44], [24, -32], [16, -24]], "#9ab4ac", 0.6);
  }
  flat(ctx, 44, -40, 26, 18, "#0b0d0a", "kLine");
  if (!simple()) {
    line(ctx, [[44, -40], [52, -30], [48, -22]], "r3", 0.6);
    line(ctx, [[70, -40], [62, -32], [68, -22]], "r3", 0.6);
  }
  G.grain(ctx, G.polyRegion(ctx, HELI), seed);
  G.grain(ctx, G.polyRegion(ctx, HELI), seed + 1, 0.7);
  G.rustPatch(ctx, 60, -14, 9, 4, seed + 2);
  G.rustPatch(ctx, 84, -38, 5, 6, seed + 3);
  G.drips(ctx, 30, -52, 60, 26, seed + 4, 6);
  G.scorch(ctx, [[46, -38], [68, -38], [68, -24], [46, -24]], seed + 5);
}

function strut(ctx, a, b, w, c) {
  line(ctx, [a, b], "kLine", w + 1.2, "butt");
  line(ctx, [a, b], c, w, "butt");
}

define({
  id: "helicopterWreck",
  box: [-8, -128, 160, 1],
  draw(ctx) {
    const seed = 700;
    strut(ctx, [84, -40], [148, -102], 8, "r1");
    if (!simple()) line(ctx, [[84, -44], [146, -104]], "r2", 2, "butt");
    shape(ctx, [[140, -96], [150, -124], [154, -100], [146, -92]], "r1", "rLine");
    disc(ctx, 146, -100, 3, "m1", "mLine");
    strut(ctx, [146, -100], [130, -122], 2.2, "m2");
    strut(ctx, [146, -100], [156, -80], 2.2, "m2");
    heliBody(ctx, seed);
    flat(ctx, 46, -60, 10, 6, "m1", "mLine");
    for (const pts of [[[51, -60], [96, -92], [120, -104]], [[51, -60], [14, -84], [-4, -82]]]) {
      curve(ctx, pts, "kLine", 5);
      curve(ctx, pts, "m2", 3.4);
    }
    strut(ctx, [10, -4], [86, -4], 2.2, "m1");
    for (const x of [24, 70]) line(ctx, [[x, -4], [x + 4, -12]], "m1", 1.6);
    if (!simple()) {
      for (const [x, y, l] of [[12, -40, 30], [40, -54, 22], [64, -54, 34], [100, -56, 26], [120, -76, 18]]) vine(ctx, x, y, l, seed + x);
      fern(ctx, 22, 20, seed + 20);
      fern(ctx, 88, 24, seed + 21);
      fern(ctx, 60, 14, seed + 22);
    }
    G.dirt(ctx, 0, -20, 100, 20, seed + 30, 0.6);
  }
});

define({
  id: "excavator",
  box: [-4, -126, 140, 1],
  draw(ctx) {
    const seed = 720;
    shape(ctx, [[60, -42], [70, -118], [84, -122], [78, -46]], RED[1], "rLine");
    shape(ctx, [[74, -118], [118, -96], [122, -84], [110, -86], [80, -108]], RED[2], "rLine");
    shape(ctx, [[112, -88], [134, -84], [132, -64], [116, -60], [108, -74]], "m1", "mLine");
    if (!simple()) for (let x = 116; x < 132; x += 4) line(ctx, [[x, -62], [x + 1, -58]], "m3", 1.2);
    disc(ctx, 72, -116, 3, "m2", "mLine");
    disc(ctx, 116, -90, 2.6, "m2", "mLine");
    flat(ctx, 8, -54, 92, 22, RED[1], "rLine");
    flat(ctx, 8, -54, 92, 6, RED[2]);
    flat(ctx, 14, -92, 36, 40, RED[2], "rLine");
    flat(ctx, 18, -88, 26, 18, "glass", "kLine");
    if (!simple()) {
      line(ctx, [[22, -86], [28, -76]], "#5a7670", 1);
      flat(ctx, 14, -92, 36, 3, RED[3]);
      flat(ctx, 56, -50, 36, 2, "hazard");
      for (let x = 58; x < 90; x += 6) flat(ctx, x, -50, 3, 2, "hazardDark");
    }
    flat(ctx, 0, -32, 106, 28, "m0", "mLine");
    for (let x = 8; x < 104; x += 16) disc(ctx, x, -18, 7, "m1", "mLine");
    if (!simple()) for (let x = 8; x < 104; x += 16) disc(ctx, x, -18, 2.4, "m3");
    flat(ctx, 0, -32, 106, 4, "m2");
    G.grain(ctx, G.rectRegion(ctx, 8, -92, 92, 60), seed);
    G.rustPatch(ctx, 30, -44, 10, 5, seed + 1);
    G.rustPatch(ctx, 78, -70, 4, 8, seed + 2);
    G.drips(ctx, 8, -54, 92, 18, seed + 3, 6);
    G.drips(ctx, 14, -92, 36, 30, seed + 4, 3);
    G.dirt(ctx, 0, -32, 106, 32, seed + 5, 0.7);
    mossCap(ctx, 14, -95, 26, seed + 6, 3);
    if (!simple()) vine(ctx, 46, -92, 30, seed + 7);
  }
});

const JEEP = [[0, -14], [2, -28], [18, -30], [26, -40], [52, -40], [56, -30], [84, -30], [86, -14]];

define({
  id: "jeep",
  box: [-14, -50, 90, 1],
  draw(ctx, state) {
    const seed = 740;
    for (const x of [16, 66]) {
      disc(ctx, x, -9, 9, "#141412", "kLine");
      disc(ctx, x, -9, 4, "m2", "mLine");
    }
    poly(ctx, JEEP, "olive", 1);
    ctx.save();
    path(ctx, JEEP);
    ctx.clip();
    flat(ctx, 0, -32, 90, 4, "o2");
    flat(ctx, 0, -18, 90, 4, "o0");
    ctx.restore();
    path(ctx, JEEP);
    stroke(ctx, "kLine");
    shape(ctx, [[28, -38], [34, -48], [36, -48], [32, -38]], "glass", "kLine");
    line(ctx, [[34, -48], [52, -48]], "m1", 1.6);
    flat(ctx, 58, -36, 24, 6, "o0", "kLine");
    flat(ctx, 36, -30, 0.8, 16, "kLine");
    flat(ctx, -10, -24, 12, 10, "m1", "mLine");
    disc(ctx, -4, -19, 4, "m2", "mLine");
    if (!simple()) {
      for (let a = 0; a < PI * 2; a += PI / 3) flat(ctx, -4 + cos(a) * 2.5 - 0.5, -19 + sin(a) * 2.5 - 0.5, 1, 1, "m3");
      curve(ctx, [[-8, -16], [-12, -6], [-12, 0]], "c0", 0.8);
      disc(ctx, 46, -22, 2.6, "o3");
      flat(ctx, 84, -24, 3, 3, state === 1 ? "y2" : "y0");
    }
    G.grain(ctx, G.polyRegion(ctx, JEEP), seed);
    G.rustPatch(ctx, 70, -20, 6, 3, seed + 1);
    G.drips(ctx, 2, -30, 82, 12, seed + 2, 4);
    G.dirt(ctx, 0, -30, 86, 16, seed + 3, 0.6);
    mossCap(ctx, 58, -30.5, 18, seed + 4, 1.5);
  }
});

const TRUNK = [[-12, -84], [-196, -148], [-202, -132], [-18, -60]];
const ROOT = blobPts(-2, -64, 26, 62, 761, 14, 0.2);

define({
  id: "fallenTree",
  box: [-220, -170, 34, 14],
  draw(ctx) {
    const seed = 760;
    poly(ctx, TRUNK, "rust", 1, { dir: [0, 1] });
    ctx.save();
    path(ctx, TRUNK);
    ctx.clip();
    if (!simple()) for (let k = 0; k < 8; k++) line(ctx, [[-14, -82 + k * 3], [-200, -146 + k * 2]], k % 2 ? "r0" : "r2", 0.7);
    G.grain(ctx, G.polyRegion(ctx, TRUNK), seed + 7);
    ctx.restore();
    path(ctx, TRUNK);
    stroke(ctx, "rLine");
    mossCap(ctx, -150, -140, 60, seed + 8, 2);
    for (const [x, y, a, l] of [[-90, -114, -2.2, 34], [-140, -130, -1.9, 28], [-176, -142, 2.7, 24], [-60, -104, 2.4, 22]]) strut(ctx, [x, y], [x + cos(a) * l, y + sin(a) * l], 3, "r1");
    leafBlob(ctx, -192, -154, 26, 14, seed + 1);
    leafBlob(ctx, -124, -150, 16, 10, seed + 2);
    const r = rng(seed + 3);
    for (let i = 0; i < 7; i++) {
      const x = -22 + i * 7;
      curve(ctx, [[x, -10], [x + (r() - 0.5) * 8, 2], [x + (r() - 0.5) * 12, 8 + r() * 6]], "r1", 1.4 + r());
    }
    shape(ctx, ROOT, "#2a1c10", "rLine");
    ctx.save();
    path(ctx, ROOT);
    ctx.clip();
    for (let i = 0; i < 16; i++) {
      const y = -120 + r() * 110;
      curve(ctx, [[-30, y], [-6 + (r() - 0.5) * 10, y + (r() - 0.5) * 20], [30, y + (r() - 0.5) * 30]], i % 2 ? "r1" : "r2", 1.6 + r() * 2.4);
    }
    for (let i = 0; i < 8; i++) stone(ctx, -20 + r() * 36, -120 + r() * 110, 4 + r() * 4, 3 + r() * 3, seed + 20 + i);
    G.grain(ctx, G.polyRegion(ctx, ROOT), seed + 4);
    G.dirt(ctx, -30, -126, 60, 126, seed + 5, 0.4);
    ctx.restore();
    mossCap(ctx, -22, -124, 36, seed + 6, 4);
    if (!simple()) {
      for (const x of [-20, -6, 10]) vine(ctx, x, -118, 34, seed + 40 + x);
      fern(ctx, 30, 18, seed + 50);
    }
  }
});

define({
  id: "cannonTurret",
  box: [-4, -46, 58, 1],
  draw(ctx, state) {
    const off = state === 1;
    flat(ctx, 10, -14, 28, 14, "m1", "mLine");
    for (let x = 12; x < 36; x += 6) flat(ctx, x, -6, 3, 3, "hazard");
    flat(ctx, 16, -24, 16, 10, "m2", "mLine");
    strut(ctx, [34, -32], [56, -32], 4.4, off ? "m1" : "m2");
    flat(ctx, 50, -35, 6, 6, "m1", "mLine");
    ctx.beginPath();
    ctx.arc(24, -24, 16, PI, PI * 2);
    ctx.closePath();
    ctx.fillStyle = color("c1");
    ctx.fill();
    stroke(ctx, "mLine");
    if (!simple()) {
      ctx.beginPath();
      ctx.arc(24, -24, 11, PI * 1.1, PI * 1.6);
      stroke(ctx, "c3", 2);
      flat(ctx, 8, -26, 32, 2, "c0");
      flat(ctx, 30, -34, 4, 3, off ? "#300a08" : "neon");
      if (!off) glow(ctx, 32, -32, 7, "neonGlow", 0.5);
    }
    G.grain(ctx, G.rectRegion(ctx, 8, -40, 32, 40), 781);
    G.drips(ctx, 10, -24, 28, 18, 782, 4);
    G.dirt(ctx, 10, -14, 28, 14, 783, 0.6);
    if (off) G.scorch(ctx, [[18, -36], [34, -36], [34, -24], [18, -24]], 784);
  }
});

define({
  id: "distributionCabinet",
  box: [-5, -42, 41, 1],
  draw(ctx, state) {
    const broken = state === 1;
    flat(ctx, 2, -40, 32, 40, "m1", "mLine");
    flat(ctx, 4, -38, 28, 34, broken ? "#0a0c0c" : "m2", "mLine");
    if (broken) {
      shape(ctx, [[4, -38], [-4, -34], [-4, -2], [4, -4]], "m1", "mLine");
      for (const [x, y] of [[12, -30], [22, -24], [16, -14]]) line(ctx, [[x, y], [x + 6, y + 3], [x + 2, y + 8]], "a1", 0.8);
      G.scorch(ctx, [[6, -36], [30, -36], [30, -10], [6, -10]], 801);
    } else {
      shape(ctx, [[18, -30], [22, -36], [14, -33], [20, -26], [12, -20], [20, -24], [16, -30]], "hazard", "yLine");
      flat(ctx, 8, -14, 20, 3, "m0");
      if (!simple()) flat(ctx, 28, -20, 2, 6, "c1");
    }
    curve(ctx, [[30, -2], [36, -1], [40, 0]], "kLine", 2);
    G.grain(ctx, G.rectRegion(ctx, 2, -40, 32, 40), 802);
    G.drips(ctx, 2, -40, 32, 20, 803, 4);
    G.dirt(ctx, 2, -40, 32, 40, 804, 0.4);
  }
});

define({
  id: "stonePuzzle",
  box: [-3, -32, 51, 1],
  draw(ctx, state) {
    slab(ctx, 0, -20, 48, 20, 820, true);
    for (let i = 0; i < 4; i++) {
      const pressed = state === 1;
      const x = 7 + i * 11.3;
      const y = pressed ? -20 : -24;
      stone(ctx, x, y, 4.4, pressed ? 2.2 : 4.4, 821 + i);
      if (!simple()) line(ctx, [[x - 1.5, y], [x + 1.5, y]], "y1", 0.6);
    }
    if (!simple()) for (const x of [10, 22, 34]) line(ctx, [[x, -12], [x + 3, -8], [x, -4]], STONE[0], 0.8);
  }
});

define({
  id: "tripwire",
  box: [-2, -31, 98, 1],
  draw(ctx, state) {
    const cut = state === 1;
    for (const x of [4, 88]) {
      shape(ctx, [[x - 2, 0], [x - 1.4, -20], [x + 1.4, -20], [x + 2, 0]], "r1", "rLine");
      if (!simple()) flat(ctx, x - 1, -18, 2, 1, "r3");
    }
    if (cut) {
      curve(ctx, [[5, -14], [16, -8], [22, -1]], "c1", 0.6);
      curve(ctx, [[87, -14], [76, -8], [70, -1]], "c1", 0.6);
    } else {
      line(ctx, [[5, -14], [87, -14]], "c2", 0.6);
      if (!simple()) line(ctx, [[5, -13.6], [87, -13.6]], "#00000060", 0.4);
    }
    shape(ctx, blobPts(88, -24, 3.4, 4.6, 841, 8, 0.05), "o1", "kLine");
    if (!simple()) {
      for (let y = -27; y < -21; y += 2) flat(ctx, 85, y, 6, 0.6, "o0");
      flat(ctx, 87, -29.5, 2, 1.6, "m2");
    }
    grass(ctx, 0, 14, 8, 842);
    grass(ctx, 78, 18, 9, 843);
  }
});

define({
  id: "mine",
  box: [-10, -8, 10, 1],
  draw(ctx, state) {
    if (state === 1) {
      shape(ctx, blobPts(0, -0.5, 9, 2.4, 861, 10, 0.3), "#0b0806");
      G.scorch(ctx, [[-8, -1], [8, -1], [6, 0], [-6, 0]], 862);
      return;
    }
    ctx.beginPath();
    ctx.ellipse(0, -1, 7, 4.6, 0, PI, PI * 2);
    ctx.closePath();
    ctx.fillStyle = color("o1");
    ctx.fill();
    stroke(ctx, "kLine");
    flat(ctx, -1.6, -6.4, 3.2, 1.6, "m2", "mLine");
    if (!simple()) {
      flat(ctx, -0.5, -6.2, 1, 1, "neon");
      glow(ctx, 0, -5.8, 3, "neonGlow", 0.5);
      flat(ctx, -6, -3, 12, 0.6, "o0");
    }
    grass(ctx, -9, 6, 4, 863);
    grass(ctx, 4, 6, 4, 864);
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

define({
  id: "towerLift",
  box: [-4, -384, 100, 1],
  draw(ctx, state, t, { h = 384 } = {}) {
    if (state === 1) {
      flat(ctx, 0, -6, 96, 6, "m1", "mLine");
      for (const x of [2, 90]) {
        flat(ctx, x, -60, 4, 60, "r1", "rLine");
        if (!simple()) flat(ctx, x + 1, -60, 1, 60, "r3");
      }
      flat(ctx, 2, -62, 92, 5, "r2", "rLine");
      for (let x = 8; x < 90; x += 8) flat(ctx, x, -57, 1.2, 51, "m2");
      G.grain(ctx, G.rectRegion(ctx, 0, -62, 96, 62), 941);
      G.drips(ctx, 2, -62, 92, 24, 942, 6);
      return;
    }
    flat(ctx, 60, -h, 14, h, "m1", "mLine");
    for (let y = -h + 6; y < -60; y += 12) {
      flat(ctx, 61, y, 12, 1.6, "m0");
      if (!simple()) flat(ctx, 62, y + 2, 1, 1, "m3");
    }
    G.grain(ctx, G.rectRegion(ctx, 60, -h, 14, h), 943);
    G.drips(ctx, 60, -h, 14, min(h * 0.4, 90), 944, 2);
    flat(ctx, 0, -64, 96, 6, "r2", "rLine");
    flat(ctx, 0, -6, 96, 6, "m1", "mLine");
    for (const x of [0, 92]) flat(ctx, x, -64, 4, 64, "r1", "rLine");
    mesh(ctx, 4, -58, 88, 52, "r2", 6);
    flat(ctx, 76, -40, 10, 12, "m2", "mLine");
    if (!simple()) {
      flat(ctx, 79, -37, 4, 2, "neon");
      flat(ctx, 79, -33, 4, 2, "screen");
      for (const x of [20, 48]) line(ctx, [[x, -64], [x, -h]], "kLine", 0.8);
    }
    G.grain(ctx, G.rectRegion(ctx, 0, -64, 96, 64), 945);
    G.drips(ctx, 0, -64, 96, 30, 946, 6);
    G.dirt(ctx, 0, -64, 96, 64, 947, 0.4);
  }
});

define({
  id: "jungleFern",
  box: [-26, -36, 26, 1],
  draw(ctx, state) {
    if (state === 1) return grass(ctx, -14, 28, 12, 961);
    if (state === 2) {
      leafBlob(ctx, 0, -12, 20, 12, 962);
      grass(ctx, -16, 32, 8, 963);
      return;
    }
    fern(ctx, 0, 28, 964);
    grass(ctx, -8, 16, 7, 965);
  }
});

define({
  id: "hangingVines",
  box: [-4, -100, 76, 1],
  draw(ctx, state, t, { w = 72, h = 96 } = {}) {
    const r = rng(980 + round(w) + round(h));
    for (let x = 2 + r() * 6; x < w - 1; x += 5 + r() * 10) vine(ctx, x, -h, h * (0.3 + r() * 0.7), 981 + round(x));
    mossCap(ctx, 0, -h, w, 982, 3);
  }
});

const SKY = [["#163029", -170], ["#1d3d34", -160], ["#2b5247", -150], ["#3c685a", -141], ["#4c7b6b", -132], ["#56856f", -124], ["#4c7a66", -116], ["#3d6956", -108], ["#2f5646", -100], ["#234436", -92], ["#18322a", -84], ["#10231d", -76], ["#0a1612", -68], ["#060c0a", -60]];

function trunks(ctx, n, seed, c, w0, w1, top, bottom, branches) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = (i + r() * 0.8) * (320 / n);
    const w = w0 + r() * (w1 - w0);
    const lean = (r() - 0.5) * 8;
    shape(ctx, [[x - w / 2 + lean, top], [x + w / 2 + lean, top], [x + w * 0.7, bottom], [x - w * 0.7, bottom]], c);
    if (branches && !simple()) {
      shape(ctx, [[x - w / 2 + lean, top], [x - w / 5 + lean, top], [x - w * 0.28, bottom], [x - w * 0.7, bottom]], "#2d5245");
      for (let k = 0; k < 2; k++) {
        const y = top + (bottom - top) * (0.15 + r() * 0.35);
        const s = r() < 0.5 ? -1 : 1;
        line(ctx, [[x + lean * 0.5, y], [x + s * (6 + r() * 10), y - 6 - r() * 8]], c, w * 0.35);
      }
    }
  }
}

function canopy(ctx, n, seed, y0, y1, tones, size) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const cx = r() * 330 - 5;
    const cy = y0 + r() * (y1 - y0);
    leafBlob(ctx, cx, cy, size * (0.6 + r() * 0.8), size * (0.35 + r() * 0.4), seed + i * 17, tones);
  }
}

define({
  id: "jungleSky",
  box: [0, -170, 320, 0],
  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -170, 320, 170);
    ctx.clip();
    SKY.forEach(([c, y], i) => flat(ctx, 0, y, 320, (i + 1 < SKY.length ? SKY[i + 1][1] : 0) - y + 0.3, c));
    trunks(ctx, 40, 1001, "#3e6a5a", 0.6, 1.3, -170, -64, false);
    canopy(ctx, 40, 1006, -165, -72, ["#3a6656", "#40705e", "#477766", "#528270"], 11);
    canopy(ctx, 26, 1002, -170, -150, ["#24483c", "#2c5446", "#346050", "#43705c"], 12);
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (const [y, h] of [[-138, 6], [-121, 9], [-104, 7]]) flat(ctx, 0, y, 320, h, "#8ab4a2");
    ctx.restore();
    trunks(ctx, 16, 1003, "#22433a", 1.3, 2.6, -170, -60, true);
    canopy(ctx, 28, 1007, -160, -74, ["#1c3a2e", "#22443a", "#2a4e40", "#34584a"], 8);
    canopy(ctx, 18, 1004, -172, -156, ["#10261c", "#183224", "#1f3d2c", "#2c5038"], 16);
    if (!simple()) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      for (let x = 4; x < 320; x += 11) vine(ctx, x + (x % 7), -170, 6 + (x % 13), 1005 + x);
      ctx.restore();
    }
    flat(ctx, 0, -62, 320, 62, "#050806");
    ctx.restore();
  }
});

const BARK = ["#120e0a", "#221c14", "#342a1e", "#4a3e2c"];
const BAG = ["#1e1e12", "#33321e", "#4a482c", "#625e3c"];

function treeCrown(ctx, x, y, state, seed) {
  const r = rng(seed);
  if (state === 1) {
    for (let i = 0; i < 9; i++) frond(ctx, x, y, 44 + r() * 16, -PI + (i / 8) * PI + (r() - 0.5) * 0.3, seed + i * 5);
    for (const s of [-1, 1]) frond(ctx, x, y + 2, 40, PI / 2 + s * 1.1, seed + 60 + s);
    return;
  }
  for (const [dx, dy, rx, ry] of [[-30, 10, 30, 16], [28, 8, 32, 17], [-4, -4, 40, 20], [-44, 22, 18, 10], [46, 20, 20, 11]]) {
    line(ctx, [[x, y + 26], [x + dx * 0.7, y + dy + 6]], BARK[1], 3);
    leafBlob(ctx, x + dx, y + dy, rx, ry, seed + dx + dy * 3);
  }
}

function snagTop(ctx, x, y, seed) {
  const r = rng(seed);
  const pts = [[x - 7, y + 24], [x - 5, y + 6], [x - 1, y + 14], [x + 2, y], [x + 4, y + 10], [x + 7, y + 4], [x + 7, y + 24]];
  shape(ctx, pts, BARK[2], SLINE);
  G.scorch(ctx, pts, seed + 1);
  G.rim(ctx, pts, seed + 2, "r2", "rLine");
  for (const s of [-1, 1]) line(ctx, [[x + s * 4, y + 34 + r() * 10], [x + s * (20 + r() * 10), y + 14 + r() * 8], [x + s * (28 + r() * 8), y + 18]], BARK[2], 2);
}

define({
  id: "jungleTree",
  box: [-72, -240, 72, 2],
  draw(ctx, state, t, { h = 240 } = {}) {
    const seed = 1100 + state * 37 + round(h);
    const r = rng(seed);
    const lean = (r() - 0.5) * 14;
    const top = -h + (state === 1 ? 46 : state === 2 ? 0 : 40);
    const trunk = [[-15, 0], [-11, -34], [lean - 6, top + 24], [lean + 6, top + 24], [11, -34], [15, 0]];
    for (const k of [1, 0]) for (const s of [-1, 1]) {
      const reach = 22 + k * 16 + r() * 8;
      const fin = [[s * 7, -46 - k * 10], [s * (10 + reach * 0.3), -18 - k * 4], [s * reach, 0], [s * (reach - 7), 0], [s * (8 + reach * 0.2), -10], [s * 4, -20]];
      shape(ctx, fin, BARK[k ? 1 : 2], SLINE);
      if (!simple()) line(ctx, [[s * 7, -45 - k * 10], [s * (10 + reach * 0.3), -17 - k * 4], [s * (reach - 1), -0.5]], BARK[3], 0.8);
    }
    shape(ctx, trunk, BARK[1], SLINE);
    ctx.save();
    path(ctx, trunk);
    ctx.clip();
    flat(ctx, -16 + lean * 0.3, top, 7, -top, BARK[2]);
    if (!simple()) {
      flat(ctx, -15 + lean * 0.3, top, 2, -top, BARK[3]);
      for (let k = 0; k < 6; k++) {
        const bx = -9 + k * 3.4 + r() * 2;
        curve(ctx, [[bx * 0.8, 0], [bx * 0.7 + lean * 0.5, top * 0.5], [bx * 0.5 + lean, top + 24]], BARK[0], 0.7);
      }
    }
    G.grain(ctx, G.polyRegion(ctx, trunk), seed + 1);
    G.dirt(ctx, -16, top, 32, -top, seed + 2, 0.2);
    ctx.restore();
    if (state !== 2) {
      const pts = [];
      for (let k = 0; k <= 10; k++) pts.push([lean * (k / 10) + sin(k * 1.4 + seed) * 9, -(k / 10) * (-top - 30)]);
      curve(ctx, pts, MOSS[1], 2.4);
      if (!simple()) curve(ctx, pts.map(([x, y]) => [x + 1, y - 1]), MOSS[2], 0.8);
    }
    for (let y = -30 - r() * 20; y > top + 40; y -= 40 + r() * 40) mossCap(ctx, lean * (y / top) - 9, y, 14 + r() * 6, seed + round(y), 2.5);
    if (state === 2) snagTop(ctx, lean, top, seed + 3);
    else treeCrown(ctx, lean, top, state, seed + 4);
    if (!simple() && state === 0) for (let k = 0; k < 4; k++) vine(ctx, lean - 40 + k * 26 + r() * 8, top + 26, 40 + r() * 60, seed + 10 + k);
    grass(ctx, -34, 68, 7, seed + 5);
    if (!simple()) fern(ctx, 24 * (r() < 0.5 ? -1 : 1), 16, seed + 6);
  }
});

function chainPanel(ctx, x, w, seed, torn) {
  const r = rng(seed);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, -44, w, 44);
  let hole = null;
  if (torn) {
    const hx = x + w * (0.3 + r() * 0.3);
    hole = [[hx, -44], [hx + 14, -44], [hx + 11, -34], [hx + 18, -26], [hx + 9, -18], [hx + 12, -8], [hx + 2, -12], [hx - 4, -24], [hx + 2, -32]];
    hole.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  }
  ctx.clip("evenodd");
  mesh(ctx, x, -44, w, 44, "c0", 3);
  G.dirt(ctx, x, -44, w, 44, seed + 1, 0.35);
  G.drips(ctx, x, -44, w, 10, seed + 2, Math.ceil(w / 40));
  ctx.restore();
  if (hole) {
    line(ctx, hole.slice(0, 5), "c0", 0.6);
    for (let k = 1; k < hole.length - 1; k += 2) line(ctx, [hole[k], [hole[k][0] + 3, hole[k][1] + 2]], "c1", 0.5);
  }
  line(ctx, [[x, -44], [x + w * 0.5, -42.5 + (torn ? 3 : 0)], [x + w, -44]], "c0", 0.9);
  line(ctx, [[x, -2], [x + w, -2]], "c0", 0.9);
}

function barbs(ctx, x0, x1, y, seed) {
  const r = rng(seed);
  line(ctx, [[x0, y], [x1, y]], "c0", 0.6);
  if (simple()) return;
  for (let x = x0 + 2; x < x1; x += 4 + r() * 2) {
    ctx.save();
    ctx.globalAlpha *= 0.85;
    ctx.beginPath();
    ctx.ellipse(x, y - 2.5, 2.6, 2.8, 0.3, 0, PI * 2);
    ctx.strokeStyle = color("c0");
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }
}

function mineSign(ctx, x, seed) {
  shape(ctx, [[x, -40], [x + 9, -24], [x - 9, -24]], "#b8a02a", "kLine");
  shape(ctx, [[x, -36.5], [x + 6.2, -25.6], [x - 6.2, -25.6]], "#1a1610");
  disc(ctx, x, -30, 2.6, "#b8a02a");
  flat(ctx, x - 1.6, -28.6, 3.2, 1.6, "#b8a02a");
  for (const dx of [-0.9, 0.9]) flat(ctx, x + dx - 0.5, -30.8, 1, 1, "#1a1610");
  G.grain(ctx, G.polyRegion(ctx, [[x, -40], [x + 9, -24], [x - 9, -24]]), seed);
  G.drips(ctx, x - 6, -25, 12, 8, seed + 1, 2);
  line(ctx, [[x, -40], [x, -44]], "c0", 0.6);
}

function campPost(ctx, x, seed) {
  box(ctx, x - 1.8, -48, 3.6, 48, "rust", 1, { vertical: true });
  line(ctx, [[x, -47], [x - 5, -55]], "r1", 1.8, "butt");
  G.drips(ctx, x - 1.8, -46, 3.6, 22, seed, 1);
  G.rustPatch(ctx, x, -20 - (seed % 7) * 3, 1.6, 2.4, seed + 1);
}

define({
  id: "campFence",
  box: [-8, -60, 98, 1],
  draw(ctx, state, t, { w = 96 } = {}) {
    const seed = 1200 + round(w) * 3 + state * 11;
    const r = rng(seed);
    const posts = [];
    for (let x = 0; x < w - 12; x += 48) posts.push(x);
    posts.push(w);
    posts.slice(0, -1).forEach((x, i) => chainPanel(ctx, x, posts[i + 1] - x, seed + i * 5, state === 2 && i === posts.length - 2));
    barbs(ctx, -5, w - 5, -53, seed + 3);
    line(ctx, [[-4, -50], [w - 4, -50]], "c0", 0.5);
    for (const x of posts) campPost(ctx, x, seed + round(x));
    if (state === 1) mineSign(ctx, round(w * (0.3 + r() * 0.4)), seed + 7);
    grass(ctx, 0, w, 9, seed + 8);
  }
});

function bag(ctx, x, y, w, h) {
  const pts = [[x + 2.5, y], [x + w - 2.5, y + 0.4], [x + w - 0.4, y + 2.2], [x + w, y + h * 0.55], [x + w - 1, y + h - 0.6], [x + w - 3, y + h], [x + 3, y + h], [x + 1, y + h - 0.6], [x, y + h * 0.5], [x + 0.5, y + 2]];
  shape(ctx, pts, BAG[1], "kLine");
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  flat(ctx, x, y, w, h * 0.45, BAG[2]);
  if (!simple()) {
    flat(ctx, x + 2, y + 0.6, w - 4, 1, BAG[3]);
    line(ctx, [[x + w * 0.3, y + 1], [x + w * 0.32, y + h - 1]], BAG[0], 0.6);
  }
  flat(ctx, x, y + h * 0.75, w, h, BAG[0]);
  ctx.restore();
  return pts;
}

define({
  id: "sandbags",
  box: [-2, -28, 74, 1],
  draw(ctx, state, t, { w = 72 } = {}) {
    const seed = 1300 + round(w) + state * 9;
    const r = rng(seed);
    const rows = state === 1 ? 2 : 3;
    const bags = [];
    for (let row = 0; row < rows; row++) {
      const y = -8 - row * 7.5;
      const inset = row * (state === 1 ? 10 : 3);
      const off = row % 2 ? 7 : 0;
      for (let x = inset - off; x < w - inset - 4; x += 14) {
        if (state === 1 && row === 1 && r() < 0.35) continue;
        const x0 = max(inset, x);
        const x1 = min(w - inset, x + 14);
        if (x1 - x0 > 5) bags.push(bag(ctx, x0, y, x1 - x0, 8.5));
      }
    }
    ctx.save();
    ctx.beginPath();
    for (const pts of bags) pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.clip();
    G.grain(ctx, G.rectRegion(ctx, 0, -8 - rows * 7.5, w, rows * 7.5 + 8), seed + 1, 0.8);
    G.dirt(ctx, 0, -8 - rows * 7.5, w, rows * 7.5 + 8, seed + 2, 0.5);
    ctx.restore();
    if (state === 1) {
      const spill = blobPts(w * 0.6, -1.5, 9, 2.5, seed + 3, 9, 0.3);
      shape(ctx, spill, "#3a3422");
    }
    grass(ctx, -2, w + 4, 6, seed + 4);
    mossCap(ctx, w * 0.2, -0.5 - rows * 7.5, w * 0.3, seed + 5, 1.5);
  }
});

function tankTier(ctx, w, y, th, seed) {
  const r = rng(seed);
  const ty = y - th + 4;
  const tw = w - 20;
  const ch = th - 10;
  for (const lx of [6, w / 2 - 2, w - 10]) {
    box(ctx, lx, y - 8, 4, 8, "steel", 1, { vertical: true });
    flat(ctx, lx - 3, y - 9, 10, 2.5, "m2", "mLine");
  }
  box(ctx, 10, ty, tw, ch, "chrome", 1);
  for (const [cx, a0, a1] of [[10, PI / 2, PI * 1.5], [10 + tw, -PI / 2, PI / 2]]) {
    ctx.fillStyle = color("c1");
    ctx.beginPath();
    ctx.ellipse(cx, ty + ch / 2, 7, ch / 2, 0, a0, a1);
    ctx.fill();
    stroke(ctx, "mLine");
  }
  for (let x = 22; x < 10 + tw - 6; x += 26) flat(ctx, x, ty, 1.4, ch, "c0");
  if (!simple()) flat(ctx, 14, ty + 2, tw - 8, 2, "c2");
  const vx = 16 + round(r() * (tw - 36));
  box(ctx, vx, ty + ch * 0.4, 14, ch * 0.45, "steel", 1);
  for (const bx of [vx + 3, vx + 8]) flat(ctx, bx, ty + ch * 0.48, 2.4, ch * 0.3, RED[2], "rLine");
  disc(ctx, vx + 7, ty - 2, 3.4, RED[1], "rLine");
  line(ctx, [[vx + 7, ty - 2], [vx + 7, ty + 1]], "m1", 2);
  G.grain(ctx, G.rectRegion(ctx, 3, ty - 7, tw + 14, ch + 7), seed + 1);
  G.drips(ctx, 10, ty + 2, tw, ch * 0.7, seed + 2, max(2, round(tw / 22)));
  G.rustPatch(ctx, 18 + r() * (tw - 20), ty + ch * 0.7, 5, 3, seed + 3);
  G.dirt(ctx, 10, ty, tw, ch, seed + 4, 0.35);
}

define({
  id: "tankRack",
  box: [-4, -148, 124, 1],
  draw(ctx, state, t, { w = 120, h = 144 } = {}) {
    const seed = 1340 + round(w) * 3 + state * 7;
    const tiers = state === 1 ? 1 : 2;
    const body = min(h, tiers * 48);
    const th = body / tiers;
    for (const x of [2, w - 6]) box(ctx, x, -body, 4, body, "steel", 2, { vertical: true });
    for (let i = 1; i < tiers; i++) box(ctx, 0, -th * i - 3, w, 4, "steel", 2);
    for (let i = 0; i < tiers; i++) tankTier(ctx, w, -th * i, th, seed + i * 19);
    if (h > body) {
      box(ctx, 14, -h, 6, h - body + 6, "chrome", 1, { vertical: true });
      for (let y = -h + 6; y < -body; y += 16) flat(ctx, 12, y, 10, 2.4, "m1", "mLine");
      G.drips(ctx, 14, -h, 6, h - body, seed + 9, 1);
    }
    G.grain(ctx, G.rectRegion(ctx, 0, -body, w, body), seed + 11, 0.5);
  }
});

define({
  id: "mossWall",
  box: [0, -96, 96, 0],
  draw(ctx, state, t, { w = 96, h = 96 } = {}) {
    const seed = 1360 + round(w) + round(h) * 3;
    const r = rng(seed);
    cobbleFill(ctx, 0, -h, w, h);
    flat(ctx, 0, -h, w, h, "#00000055");
    G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed, 0.6);
    for (let x = 4 + r() * 10; x < w - 4; x += 14 + r() * 22) {
      const len = h * (0.2 + r() * 0.5);
      shape(ctx, [[x - 4, -h], [x + 4 + r() * 4, -h], [x + 1.5, -h + len], [x - 1, -h + len * 0.8]], MOSS[1]);
      if (!simple()) vine(ctx, x + 1, -h, len * 1.2, seed + round(x));
    }
    G.dirt(ctx, 0, -h, w, h, seed + 1, 0.4);
    grass(ctx, 0, w, 7, seed + 2);
  }
});

define({
  id: "cavePipe",
  box: [-2, -146, 170, 0],
  draw(ctx, state, t, { w = 168 } = {}) {
    const seed = 1380 + round(w);
    for (let x = 6; x < w - 2; x += 24) {
      line(ctx, [[x, -144], [x, -86]], "m1", 1.6);
      line(ctx, [[x, -84], [x, -50], [x + 12, -50]], "mLine", 3.4, "butt");
      line(ctx, [[x, -84], [x, -50], [x + 12, -50]], "m2", 2, "butt");
    }
    box(ctx, 0, -110, w, 10, "steel", 2);
    flat(ctx, 0, -107, w, 2.4, "#58c8b8");
    if (!simple()) {
      glow(ctx, w / 2, -105, w * 0.4, "#58c8b8", 0.12);
      for (let x = 12; x < w; x += 48) flat(ctx, x, -110, 4, 10, "m3", "mLine");
    }
    box(ctx, 0, -98, w, 8, "rust", 1);
    rivets(ctx, 2, -94, w - 4, 6, "r3");
    G.grain(ctx, G.rectRegion(ctx, 0, -110, w, 20), seed + 1);
    G.drips(ctx, 0, -90, w, 28, seed + 2, max(2, round(w / 24)));
  }
});

define({
  id: "rockOverhang",
  box: [-3, -120, 147, 1],
  draw(ctx, state, t, { w = 144, h = 120 } = {}) {
    const seed = 1400 + round(w) + round(h) * 3;
    const r = rng(seed);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-3, -h, w + 6, h + 1);
    ctx.clip();
    let y = -h;
    let i = 0;
    while (y < -10) {
      const k = (y + h) / h;
      const span = w * (1 - k * 0.75);
      const x0 = (w - span) * (0.25 + r() * 0.5);
      for (let x = x0; x < x0 + span;) {
        const rx = 9 + r() * 8;
        stone(ctx, x + rx, y + 9, rx, 8 + r() * 3, seed + i * 7);
        x += rx * 1.6;
        i++;
      }
      y += 13 + r() * 3;
    }
    ctx.restore();
    G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 0.7);
    mossCap(ctx, 0, -h, w, seed + 2, 4);
    if (!simple()) for (let x = 8 + r() * 10; x < w * 0.8; x += 18 + r() * 20) vine(ctx, x, -h + 8, h * (0.4 + r() * 0.5), seed + round(x));
  }
});

function stoneInset(ctx, x, w, h, seed) {
  const r = rng(seed);
  flat(ctx, x, -h, w, h, "#16140f", CLINE);
  for (let y = -h + 2; y < -4;) {
    const sh = 9 + r() * 6;
    stone(ctx, x + w / 2 + (r() - 0.5) * 2, y + sh / 2, w / 2 - 0.5, sh / 2, seed + round(y));
    y += sh;
  }
}

define({
  id: "stonePier",
  box: [-3, -102, 99, 0],
  draw(ctx, state, t, { w = 96, h = 96 } = {}) {
    const seed = 1420 + round(w) * 3 + round(h);
    flat(ctx, 0, -h, w, h, BUNKER[1], CLINE);
    for (let x = 0; x < w; x += 24) if (rng(seed + x)() < 0.5) flat(ctx, x, -h, min(24, w - x), h, BUNKER[2]);
    for (let x = 4; x + 14 <= w - 2; x += 48) stoneInset(ctx, x, 14, h - 4, seed + x);
    flat(ctx, -2, -h - 4, w + 4, 5, BUNKER[2], CLINE);
    if (!simple()) flat(ctx, -2, -h - 4, w + 4, 1.2, BUNKER[3]);
    G.grain(ctx, G.rectRegion(ctx, -2, -h - 4, w + 4, h + 4), seed + 1);
    G.drips(ctx, 0, -h, w, h * 0.5, seed + 2, max(2, round(w / 18)), false);
    G.dirt(ctx, 0, -h, w, h, seed + 3, 0.4);
    G.chips(ctx, -2, -h - 3.6, w + 4, seed + 4, G.DIRT);
    mossCap(ctx, -2, -h - 4, w * 0.5, seed + 5, 3);
    grass(ctx, 0, w, 6, seed + 6);
  }
});

define({
  id: "deckRailing",
  box: [-2, -26, 218, 1],
  draw(ctx, state, t, { w = 216 } = {}) {
    const seed = 1440 + round(w);
    for (const y of [-21, -12]) {
      box(ctx, 0, y, w, 3, "yellow", 1);
      if (!simple()) flat(ctx, 0, y, w, 0.8, "y3");
    }
    for (let x = 0; x <= w - 6; x += 72) {
      box(ctx, x, -24, 6, 24, "steel", 1, { vertical: true });
      flat(ctx, x - 1, -25, 8, 2.4, "m2", "mLine");
    }
    for (let x = 24; x < w - 6; x += 24) if (x % 72) box(ctx, x, -21, 2.4, 21, "yellow", 1, { vertical: true });
    G.grain(ctx, G.rectRegion(ctx, 0, -25, w, 25), seed, 0.8);
    G.drips(ctx, 0, -18, w, 12, seed + 1, max(2, round(w / 30)));
  }
});

define({
  id: "pipeStack",
  box: [-2, -26, 146, 1],
  draw(ctx, state, t, { w = 144 } = {}) {
    const seed = 1460 + round(w);
    const r = rng(seed);
    for (const [y, inset] of [[-8, 0], [-16, 5], [-24, 10]]) {
      box(ctx, inset, y, w - inset * 2, 8, "rust", y === -16 ? 1 : 2);
      for (const ex of [inset + 1, w - inset - 3]) flat(ctx, ex, y, 2, 8, "r0", "rLine");
      if (!simple()) flat(ctx, inset + 4, y + 1.4, w - inset * 2 - 8, 1, "r3");
    }
    for (const x of [6, w - 14]) flat(ctx, x, -3, 8, 3, "k1", "kLine");
    G.grain(ctx, G.rectRegion(ctx, 0, -24, w, 24), seed + 1);
    G.drips(ctx, 0, -20, w, 12, seed + 2, max(2, round(w / 24)));
    G.rustPatch(ctx, w * (0.3 + r() * 0.4), -12, 6, 3, seed + 3);
    mossCap(ctx, 12, -24, w * 0.3, seed + 4, 2);
  }
});

define({
  id: "pumpUnit",
  box: [-4, -98, 76, 1],
  draw(ctx, state, t, { w = 72, h = 96 } = {}) {
    const seed = 1480 + round(w) + round(h);
    for (const x of [10, w - 18]) {
      box(ctx, x, -h, 6, h * 0.5, "steel", 1, { vertical: true });
      flat(ctx, x - 2, -h * 0.55, 10, 3, "m2", "mLine");
    }
    box(ctx, 2, -h * 0.5, w - 4, h * 0.5, "brick", 1);
    for (let x = 8; x < w - 8; x += 7) flat(ctx, x, -h * 0.42, 2.2, h * 0.18, "b0");
    box(ctx, w * 0.35, -h * 0.72, w * 0.3, h * 0.72, "chrome", 1, { vertical: true });
    for (let y = -h * 0.68; y < -4; y += 8) flat(ctx, w * 0.35, y, w * 0.3, 1.4, "c0");
    disc(ctx, w - 12, -h * 0.3, 5, "c2", "mLine");
    line(ctx, [[w - 12, -h * 0.3], [w - 9, -h * 0.34]], RED[2], 1);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed);
    G.drips(ctx, 2, -h * 0.5, w - 4, h * 0.4, seed + 1, 4);
    G.rustPatch(ctx, w * 0.2, -h * 0.2, 6, 4, seed + 2);
    G.dirt(ctx, 0, -h * 0.5, w, h * 0.5, seed + 3, 0.5);
  }
});
})();
