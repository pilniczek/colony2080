(() => {
const { define, P, G } = window.ENV;
const { rng, path, color, flat, box, cylV, cylH, disc, rivets, mesh, truss, glow, text, stroke, tones, shape, line, curve, beam, slab } = P;
const { PI, sin, cos, round, min, max } = Math;
const TRAIN = window.C28_CONFIG.cutscenes.crowbarDoor.palette;

const simple = () => window.ENV.simple;

function pillar(ctx, x, y, w, h, mat = "concrete", tone = 2, flutes = 0) {
  const t = tones(mat);
  flat(ctx, x, y, w, h, t[tone]);
  flat(ctx, x, y, w * 0.22, h, t[min(3, tone + 1)]);
  flat(ctx, x + w * 0.72, y, w * 0.28, h, t[max(0, tone - 1)]);
  for (let i = 1; i <= flutes; i++) flat(ctx, x + i * w / (flutes + 1) - 0.4, y + 2, 0.8, h - 4, t[max(0, tone - 1)]);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, mat);
}

function jagged(x0, x1, y, amp, step, seed) {
  const r = rng(seed), pts = [];
  for (let x = x0; x < x1; x += step * (0.5 + r())) pts.push([x, y - r() * amp]);
  pts.push([x1, y - r() * amp]);
  return pts;
}

function blob(cx, cy, rx, ry, seed, n = 14) {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = i / n * 2 * PI, k = 0.6 + r() * 0.55;
    return [cx + cos(a) * rx * k, cy + sin(a) * ry * k];
  });
}

function breach(cx, w, h, seed) {
  const r = rng(seed), pts = [[cx - w / 2, 0]];
  for (let i = 1; i < 12; i++) {
    const a = PI - i / 12 * PI;
    pts.push([cx + cos(a) * w / 2 * (0.75 + r() * 0.4), -sin(a) * h * (0.7 + r() * 0.4)]);
  }
  pts.push([cx + w / 2, 0]);
  return pts;
}

function hole(ctx, pts, sky = true) {
  const big = pts.map(([x, y]) => [x, y]);
  shape(ctx, big, "k0", "kLine");
  ctx.save();
  ctx.translate(1, 1);
  shape(ctx, pts, sky ? "sky1" : "hole");
  ctx.restore();
  if (sky) {
    ctx.save();
    path(ctx, pts);
    ctx.clip();
    const ys = pts.map(p => p[1]), y1 = max(...ys);
    flat(ctx, -500, y1 - 8, 1000, 9, "skyline");
    ctx.restore();
  }
}

function rebar(ctx, pts, seed) {
  if (simple()) return;
  const r = rng(seed);
  pts.forEach(([x, y], i) => {
    if (i % 3) return;
    line(ctx, [[x, y], [x + (r() - 0.5) * 6, y - 2 - r() * 4]], "r2", 0.6);
  });
}

function grid(ctx, x, y, cols, rows, w, h, gx, gy, fill, frame = null) {
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    flat(ctx, x + i * (w + gx), y + j * (h + gy), w, h, fill, frame);
  }
}

function bricks(ctx, x, y, w, h, seed, bw = 12, bh = 5) {
  const r = rng(seed);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  flat(ctx, x, y, w, h, "r0");
  for (let j = 0, yy = y + h - bh; yy > y - bh; j++, yy -= bh) {
    for (let xx = x - (j % 2 ? bw / 2 : 0); xx < x + w; xx += bw) {
      const k = simple() ? 1 : r() < 0.15 ? 2 : r() < 0.2 ? 0 : 1;
      flat(ctx, xx + 0.5, yy + 0.5, bw - 1, bh - 1, ["#3a2414", "#4a3020", "#5c3e26"][k]);
      if (!simple()) flat(ctx, xx + 0.5, yy + 0.5, bw - 1, 0.7, k === 2 ? "#7a5634" : "#5c3e26");
    }
  }
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed + 60, 0.8);
  G.dirt(ctx, x, y, w, h, seed + 61, min(0.3, 40 / h));
  ctx.restore();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, "brick");
}

function pane(ctx, x, y, w, h, cols, rows, seed, shot = null) {
  flat(ctx, x - 2, y - 2, w + 4, h + 4, "k1", "kLine");
  flat(ctx, x, y, w, h, "k0");
  const r = rng(seed), cw = w / cols, ch = h / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const px = x + i * cw + 0.6, py = y + j * ch + 0.6;
    flat(ctx, px, py, cw - 1.2, ch - 1.2, r() < 0.35 ? "m1" : "c0");
    if (!simple()) shape(ctx, [[px, py + ch - 1.2], [px + (cw - 1.2) * 0.35, py], [px + (cw - 1.2) * 0.6, py], [px + (cw - 1.2) * 0.2, py + ch - 1.2]], "c1");
  }
  flat(ctx, x, y, w, 4, "#00000066");
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed + 20, 0.6);
  G.dirt(ctx, x, y, w, h, seed + 21, 0.3);
  if (!simple()) for (let i = 1; i < cols; i++) for (let j = 1; j < rows; j++) {
    if (r() < 0.4) line(ctx, [[x + i * cw - 1.5, y + j * ch], [x + i * cw + 1.5, y + j * ch]], "c3", 0.6);
  }
  if (shot) {
    const pts = blob(shot[0], shot[1], shot[2], shot[3], seed + 7, 18);
    shape(ctx, pts, "hole");
    if (!simple()) for (const [px, py] of pts.filter((_, i) => i % 2)) {
      shape(ctx, [[px, py], [px + (shot[0] - px) * 0.25 + 1, py + (shot[1] - py) * 0.25], [px + (shot[0] - px) * 0.25 - 1, py + (shot[1] - py) * 0.25]], "c2");
    }
  }
  flat(ctx, x - 2, y + h + 1, w + 4, 2, "k3", "kLine");
}

function cloud(x, y, w, h, seed) {
  const r = rng(seed), top = [], bot = [];
  const n = max(4, round(w / 9));
  for (let i = 0; i <= n; i++) {
    const u = i / n, s = sin(u * PI) ** 0.6;
    top.push([x + u * w + (r() - 0.5) * 4, y - s * h * (0.5 + r() * 0.7)]);
    bot.push([x + u * w + (r() - 0.5) * 4, y + s * h * 0.25 * (0.4 + r())]);
  }
  return [...top, ...bot.reverse()];
}

const SKY_N = ["sky0", "sky1", "sky2", "sky3"];
const SKY_F = ["sky2", "sky3", "#d9a95c", "#f4dc9c"];
const CLOUDS = (() => {
  const r = rng(11), list = [];
  for (let i = 0; i < 44; i++) {
    const y = -166 + r() * 112, tone = [0, 2, 0, 3, 2, 0, 2, 3][i % 8];
    list.push({ x: -60 + r() * 360, y, w: 50 + r() * 150 - (y + 170) * 0.3, h: 5 + r() * 14 - (y + 170) * 0.04, tone, seed: i + 3 });
  }
  list.push({ x: -40, y: -50, w: 400, h: 18, tone: 0, seed: 99 });
  return list.sort((a, b) => (a.tone === 3) - (b.tone === 3));
})();
const FAR = (() => {
  const r = rng(5), list = [];
  for (let x = -4; x < 320; x += 8 + r() * 18) list.push([x, 10 + r() * 16, 18 + r() * 40]);
  return list;
})();
const TOWERS = [
  [0, 14, 62], [68, 26, 124, "ant"], [92, 12, 84], [144, 34, 114, "lattice"], [178, 10, 92],
  [232, 12, 66], [288, 22, 100, "ant"], [310, 10, 74]
];
const RUINS = [[0, 60], [30, 52], [100, 48], [130, 58], [196, 54], [244, 46], [300, 56], [320, 50]];
const LIT = [[62, 28, 46], [282, 26, 50], [206, 20, 30], [16, 18, 24]];
const BOLTS = (() => {
  const r = rng(29), bolts = [];
  const walk = (x, y, len, depth) => {
    const pts = [[x, y]];
    for (let i = 0; i < len; i++) { x += (r() - 0.3) * 16 * (depth ? 1.4 : 1); y += 4 + r() * 6; pts.push([x, y]); if (depth < 2 && r() < 0.3) walk(x, y, round(len * 0.5), depth + 1); }
    bolts.push({ pts, w: depth ? 0.7 : 1.3 });
  };
  walk(120, -170, 14, 0);
  walk(190, -170, 9, 1);
  return bolts;
})();

function skyline(ctx, flash) {
  for (const [x, w, h] of FAR) flat(ctx, x, -12 - h, w, h, "skyline2");
  const ground = [[-2, 0]];
  RUINS.forEach(([x, h], i) => ground.push(...jagged(x, RUINS[i + 1]?.[0] ?? 322, -h, 6, 4, i + 40)));
  shape(ctx, [...ground, [322, 0]], "skyline2");
  for (const [x, w, h, kind] of TOWERS) {
    const top = jagged(x, x + w, -h, 5, 5, x + 1);
    shape(ctx, [[x, 0], ...top, [x + w, 0]], "skyline");
    if (kind === "ant") {
      line(ctx, [[x + w * 0.3, -h], [x + w * 0.3, -h - 16]], "skyline", 1.2);
      line(ctx, [[x + w * 0.7, -h], [x + w * 0.7, -h - 9]], "skyline", 1);
      flat(ctx, x + w * 0.2, -h - 12, w * 0.3, 1, "skyline");
    }
    if (kind === "lattice") {
      for (const dx of [6, w - 10]) {
        flat(ctx, x + dx, -h - 14, 4, 14, "skyline");
        line(ctx, [[x + dx - 2, -h - 14], [x + dx + 6, -h - 14]], "skyline", 1);
      }
      for (let k = 0; k < 3; k++) line(ctx, [[x + 8, -h - k * 4], [x + w - 8, -h - 4 - k * 4]], "skyline", 0.5);
    }
  }
  for (const [x, w, h] of LIT) {
    flat(ctx, x, -10 - h, w, h, flash ? "k1" : "#3a3024");
    flat(ctx, x, -10 - h, w, 1.5, flash ? "k3" : "k1");
    grid(ctx, x + 3, -6 - h, round((w - 4) / 5), round((h - 6) / 6), 3, 3.5, 2, 2.5, flash ? "k2" : "#140f0a");
  }
  shape(ctx, [[-2, 0], ...jagged(-2, 322, -12, 5, 6, 77), [322, 0]], "skyline");
}

define({
  id: "skyBackground",
  box: [0, -170, 320, 0],
  anim: true,
  draw(ctx, state, t) {
    const ph = t % 3.2;
    const flash = state === 1 && ph < 0.55 && !(ph > 0.12 && ph < 0.22);
    const tone = flash ? SKY_F : SKY_N;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -170, 320, 170);
    ctx.clip();
    flat(ctx, 0, -170, 320, 170, tone[1]);
    for (const c of CLOUDS) if (!simple() || c.w > 50) shape(ctx, cloud(c.x, c.y, c.w, c.h, c.seed), tone[c.tone]);
    if (flash) for (const b of BOLTS) {
      if (!simple()) for (const [x, y] of b.pts.filter((_, i) => i % 4 === 0)) glow(ctx, x, y, 14, "#ffffff", 0.18);
      line(ctx, b.pts, "#fff7d8", b.w + 1);
      line(ctx, b.pts, "#ffffff", b.w * 0.6);
    }
    skyline(ctx, flash);
    ctx.restore();
  }
});

function hut(ctx, x, w, h, cols, rows, seed) {
  const outline = [[x, 0], ...jagged(x, x + w, -h, 4, 6, seed), [x + w, 0]];
  shape(ctx, outline, "r1", "rLine");
  G.grain(ctx, G.polyRegion(ctx, outline), seed + 200);
  flat(ctx, x, -h + 1, w, 2, "r2");
  G.chips(ctx, x, -h + 1, w, seed + 201, G.DIRT);
  const gw = (w - 4) / cols;
  grid(ctx, x + 3, -h + 6, cols, rows, gw - 3, (h - 10) / rows - 3, 3, 3, "hole", "rLine");
  G.drips(ctx, x, -h + 3, w, h * 0.6, seed + 202, round(w / 12));
  G.dirt(ctx, x, -h, w, h, seed + 203, 0.3);
  flat(ctx, x, -3, w, 3, "r0");
}

define({
  id: "midgroundRuins",
  box: [0, -64, 150, 0],
  draw(ctx) {
    hut(ctx, 0, 40, 60, 3, 5, 1);
    for (const [x, h] of [[48, 40], [58, 28], [72, 34]]) {
      pillar(ctx, x, -h, 4, h, "rust", 1);
      G.surface(ctx, x, -h, 4, h, x + 204, { rise: 0.35, drip: 1, dripLen: h * 0.5, edge: false });
      shape(ctx, [[x, -h], [x + 2, -h - 3], [x + 4, -h + 1]], "r1", "rLine");
    }
    beam(ctx, [48, -24], [76, -30], 2, "rust");
    G.drips(ctx, 50, -27, 24, 10, 205, 2);
    hut(ctx, 86, 44, 42, 4, 3, 2);
    const stub = [[132, 0], [132, -24], [146, -16], [150, -18], [150, 0]];
    shape(ctx, stub, "r1", "rLine");
    G.grain(ctx, G.polyRegion(ctx, stub), 206);
    grid(ctx, 135, -16, 2, 2, 4, 5, 3, 2, "hole", "rLine");
    G.dirt(ctx, 132, -24, 18, 24, 207, 0.4);
  }
});

define({
  id: "windowBuilding",
  box: [0, -102, 232, 0],
  draw(ctx) {
    const top = [[0, -66], [4, -72], [10, -70], [14, -80], [22, -84], [26, -92], [36, -95]];
    const wall = [[0, 0], ...top, [190, -95], [190, 0]];
    shape(ctx, wall, "k2", "kLine");
    G.grain(ctx, G.polyRegion(ctx, wall), 210);
    G.drips(ctx, 36, -94, 136, 36, 211, 7);
    G.dirt(ctx, 0, -95, 190, 95, 212, 0.3);
    G.rustPatch(ctx, 14, -44, 5, 3, 213);
    G.rustPatch(ctx, 116, -84, 6, 3, 214);
    flat(ctx, 36, -98, 154, 4, "k3", "kLine");
    G.chips(ctx, 36, -98, 154, 215, G.DIRT);
    flat(ctx, 30, -94, 160, 2, "k1");
    rebar(ctx, top, 4);
    pillar(ctx, 172, -94, 14, 94, "concrete", 2);
    G.surface(ctx, 172, -94, 14, 94, 216, { rise: 0.3, drip: 2, dripLen: 40 });
    flat(ctx, 0, -6, 190, 6, "k1", "kLine");
    G.chips(ctx, 0, -6, 190, 217);
    pane(ctx, 25, -70, 41, 41, 4, 4, 1);
    pane(ctx, 73, -70, 41, 41, 4, 4, 2, [92, -56, 15, 13]);
    pane(ctx, 120, -70, 41, 41, 4, 4, 3);
    for (const [x, seed] of [[23, 218], [71, 219], [118, 220]]) G.drips(ctx, x, -26, 45, 18, seed, 3);
    slab(ctx, 190, -24, 40, 24, "concrete", 2);
    G.surface(ctx, 190, -24, 40, 24, 221, { rise: 0.35, drip: 2, dripLen: 14 });
    flat(ctx, 190, -24, 40, 3, "k3", "kLine");
    for (let x = 200; x < 230; x += 10) flat(ctx, x, -20, 1, 20, "k1");
  }
});

define({
  id: "ruinedBuilding",
  box: [0, -144, 178, 0],
  draw(ctx) {
    slab(ctx, 40, -138, 56, 16, "concrete", 2);
    G.surface(ctx, 40, -138, 56, 16, 31, { rise: 0.4, drip: 2, dripLen: 10 });
    flat(ctx, 36, -142, 64, 4, "k3", "kLine");
    G.chips(ctx, 36, -142, 64, 32, G.DIRT);
    slab(ctx, 18, -122, 100, 30, "concrete", 2);
    G.surface(ctx, 18, -122, 100, 30, 33, { rise: 0.25 });
    flat(ctx, 22, -117, 92, 16, "k0", "kLine");
    for (let x = 22; x <= 110; x += 11) pillar(ctx, x, -117, 4, 16, "concrete", 2);
    G.drips(ctx, 22, -101, 92, 8, 34, 5);
    flat(ctx, 14, -102, 108, 2, "k3", "kLine");
    flat(ctx, 0, -92, 178, 6, "k3", "kLine");
    G.chips(ctx, 0, -92, 178, 35, G.DIRT);
    flat(ctx, 0, -87, 178, 2, "k1");
    const left = [[4, 0], [4, -40], [0, -48], [6, -58], [4, -86]];
    const wall = [...left, [176, -86], [176, 0]];
    shape(ctx, wall, "k2", "kLine");
    G.grain(ctx, G.polyRegion(ctx, wall), 36);
    G.drips(ctx, 4, -86, 172, 40, 37, 9);
    G.dirt(ctx, 4, -86, 172, 86, 38, 0.28);
    G.rustPatch(ctx, 40, -60, 7, 4, 39);
    G.rustPatch(ctx, 160, -78, 5, 3, 40);
    flat(ctx, 4, -70, 172, 3, "k1");
    grid(ctx, 16, -82, 6, 1, 18, 9, 9, 0, "k0", "kLine");
    G.drips(ctx, 16, -73, 160, 14, 41, 6, false);
    pillar(ctx, 66, -67, 10, 67, "concrete", 2);
    pillar(ctx, 108, -67, 10, 67, "concrete", 2);
    for (const [x, seed] of [[66, 42], [108, 43]]) G.surface(ctx, x, -67, 10, 67, seed, { rise: 0.35, drip: 1, dripLen: 30 });
    const small = blob(90, -46, 11, 10, 9);
    const big = breach(146, 46, 46, 3);
    const left2 = blob(24, -24, 12, 14, 12);
    G.scorch(ctx, small, 44);
    G.scorch(ctx, big, 45);
    G.scorch(ctx, left2, 46);
    hole(ctx, small);
    G.rim(ctx, small, 47, "k3", "kLine");
    rebar(ctx, small, 2);
    hole(ctx, big);
    G.rim(ctx, big, 48, "k3", "kLine");
    rebar(ctx, big, 5);
    hole(ctx, left2, false);
    G.rim(ctx, left2, 49, "k3", "kLine");
    for (const [x, w, h] of [[120, 8, 4], [168, 10, 6], [128, 5, 3], [36, 7, 4]]) shape(ctx, [[x, 0], [x + w * 0.3, -h], [x + w, -h * 0.4], [x + w, 0]], "k1", "kLine");
  }
});

const GALLERY = [[0, 16], [35, 11], [65, 11], [94, 11], [124, 11], [154, 11], [184, 16]];

define({
  id: "colonnadeBuilding",
  box: [0, -144, 200, 0],
  draw(ctx) {
    flat(ctx, 0, -140, 200, 32, "hole");
    flat(ctx, 0, -144, 200, 4, "k2", "kLine");
    for (const [x, w] of GALLERY) {
      pillar(ctx, x, -140, w, 32, "concrete", 3);
      G.surface(ctx, x, -140, w, 32, x + 230, { rise: 0.35, edge: false });
    }
    G.chips(ctx, 0, -144, 200, 232, G.DIRT);
    slab(ctx, 0, -110, 200, 36, "concrete", 2);
    G.surface(ctx, 0, -110, 200, 36, 233, { rise: 0.3, drip: 8, dripLen: 26 });
    G.rustPatch(ctx, 38, -88, 6, 3, 234);
    G.rustPatch(ctx, 150, -100, 5, 3, 235);
    flat(ctx, 0, -110, 200, 3, "k3", "kLine");
    G.chips(ctx, 0, -110, 200, 236, G.DIRT);
    flat(ctx, 0, -96, 200, 1.5, "k1");
    flat(ctx, 0, -76, 200, 4, "k0");
    text(ctx, "05", 182, -86, 11, "k1");
    flat(ctx, 0, -72, 200, 72, "hole");
    slab(ctx, 70, -64, 50, 64, "concrete", 1);
    G.surface(ctx, 70, -64, 50, 64, 237, { rise: 0.3, drip: 3, dripLen: 30 });
    if (!simple()) {
      flat(ctx, 80, -12, 20, 7, "m1", "mLine");
      for (let x = 82; x < 100; x += 3) flat(ctx, x, -11, 1.2, 5, "m0");
    }
    shape(ctx, [[0, -72], [200, -72], [200, -66], [0, -60]], "#00000088");
    for (const x of [0, 56, 120, 184]) {
      pillar(ctx, x, -72, 16, 72, "concrete", 2);
      G.surface(ctx, x, -72, 16, 72, x + 238, { rise: 0.35, drip: 1, dripLen: 34, edge: false });
      flat(ctx, x - 2, -72, 20, 4, "k3", "kLine");
      G.chips(ctx, x - 2, -72, 20, x + 239, G.DIRT);
    }
  }
});

define({
  id: "brickWall",
  box: [0, -168, 72, 0],
  draw(ctx, state, t, { w = 72, h = 168 } = {}) {
    const brick = state === 1 ? w : w - 14;
    bricks(ctx, 0, -h, brick, h, 7);
    G.drips(ctx, 0, -h, brick, min(h * 0.5, 60), 250, round(w / 14));
    if (state === 1) return;
    flat(ctx, w - 14, -h, 14, h, "r0", "rust");
    cylV(ctx, w - 11, -h, 7, h, "concrete", 2);
    G.surface(ctx, w - 14, -h, 14, h, 251, { rise: min(0.3, 40 / h), edge: false });
    for (let y = -h + 18; y < 0; y += 36) {
      box(ctx, w - 12.5, y, 10, 3, "concrete", 1);
      G.drips(ctx, w - 12.5, y + 3, 10, min(16, -y - 3), 252 - y, 2);
    }
  }
});

const FACADE = [["pil", 18], ["brick", 22], ["panel", 62], ["pil", 18], ["panel", 62], ["brick", 22], ["pil", 12]];
const STOREY = 72;

function bracePanel(ctx, x, y, w, h) {
  flat(ctx, x, y, w, h, "k0", "kLine");
  flat(ctx, x + 3, y + 3, w - 6, h - 6, "sky1");
  shape(ctx, [[x + 3, y + h - 3], [x + w - 3, y + 3], [x + w - 3, y + h - 3]], "sky0");
  flat(ctx, x + 3, y + 3, w - 6, 3, "#00000055");
  beam(ctx, [x + 4, y + 4], [x + w - 4, y + h - 4], 5, "concrete");
  beam(ctx, [x + 4, y + h * 0.5], [x + w * 0.5, y + h - 4], 3, "concrete");
  shape(ctx, [[x + 3, y + 3], [x + 14, y + 3], [x + 3, y + 14]], "k2", "kLine");
  shape(ctx, [[x + w - 3, y + h - 3], [x + w - 14, y + h - 3], [x + w - 3, y + h - 14]], "k2", "kLine");
  if (!simple()) rivets(ctx, x + 4, y + h - 1.5, w - 8, 6, "k3");
}

define({
  id: "facadeTower",
  box: [0, -336, 216, 0],
  draw(ctx, state, t, { w = 216, h = 336 } = {}) {
    const grow = (w - 216) / 2;
    let x = 0;
    for (const [kind, base] of FACADE) {
      const width = kind === "panel" ? base + grow : base;
      if (kind === "pil") {
        pillar(ctx, x, -h, width, h, "concrete", 2);
        G.surface(ctx, x, -h, width, h, x + 260, { rise: min(0.3, 40 / h), edge: false });
      }
      if (kind === "brick") bricks(ctx, x, -h, width, h, x + 1, 11, 5);
      if (kind === "panel") {
        flat(ctx, x, -h, width, h, "k1", "kLine");
        G.grain(ctx, G.rectRegion(ctx, x, -h, width, h), x + 261);
        for (let y = -STOREY; y > -h; y -= STOREY) bracePanel(ctx, x + 4, y + 6, width - 8, STOREY - 10);
        grid(ctx, x + 6, -h + 18, 4, 1, (width - 12) / 4 - 3, 18, 3, 0, "k0", "kLine");
      }
      x += width;
    }
    const r = rng(262);
    for (let y = 0; y > -h; y -= STOREY) {
      slab(ctx, 0, y - 5, w, 5, "concrete", 3);
      G.chips(ctx, 0, y - 5, w, 263 - y, G.DIRT);
      if (y < 0) G.drips(ctx, 0, y, w, STOREY * 0.45, 264 - y, round(w / 36));
      if (y < 0) G.rustPatch(ctx, 8 + r() * (w - 16), y + 4 + r() * 20, 4 + r() * 4, 2 + r() * 2, 265 - y);
    }
    slab(ctx, 0, -h, w, 12, "concrete", 2);
    G.surface(ctx, 0, -h, w, 12, 266, { rise: 0.4, drip: round(w / 30), dripLen: 30 });
    flat(ctx, 0, -h + 10, w, 2, "k0");
    G.dirt(ctx, 0, -h, w, h, 267, min(0.25, 50 / h));
  }
});

const TAGS = (() => {
  const r = rng(23);
  return ["neon", "a1", "neon", "c3", "a2", "neon", "y2", "c3", "a1"].map((c, i) => {
    const x0 = 30 + r() * 90, y0 = -10 - r() * 30, pts = [];
    for (let k = 0, n = 4 + round(r() * 5); k < n; k++) pts.push([x0 + k * (3 + r() * 4), y0 - (k % 2 ? 4 + r() * 10 : r() * 3)]);
    return [c, c === "c3" ? 1 : 1.6 + r() * 1.8, pts];
  });
})();

define({
  id: "graffitiWall",
  box: [0, -74, 168, 0],
  draw(ctx) {
    const top = [[0, -30], [5, -36], [9, -34], [14, -46], [20, -44], [26, -56], [33, -54], [38, -64], [48, -62], [54, -68]];
    const right = [[168, -72], [164, -60], [168, -50], [162, -36], [166, -22], [160, -12], [164, 0]];
    const wall = [[0, 0], ...top, [54, -72], ...right];
    shape(ctx, wall, "k2", "kLine");
    G.grain(ctx, G.polyRegion(ctx, wall), 280);
    G.drips(ctx, 54, -68, 108, 30, 281, 6);
    G.rustPatch(ctx, 120, -30, 5, 3, 282);
    flat(ctx, 54, -72, 112, 4, "k3", "kLine");
    G.chips(ctx, 54, -72, 112, 283, G.DIRT);
    flat(ctx, 0, -4, 164, 4, "k1");
    for (const [cx, cy, rx, ry, sd] of [[30, -24, 10, 6, 1], [140, -50, 12, 8, 2], [96, -58, 14, 5, 3]]) shape(ctx, blob(cx, cy, rx, ry, sd), "#5a504066");
    const pit = blob(16, -10, 4, 4, 4, 8);
    G.scorch(ctx, pit, 284);
    shape(ctx, pit, "hole");
    G.rim(ctx, pit, 285, "k3", "kLine");
    rebar(ctx, top, 8);
    rebar(ctx, right, 9);
    for (const [c, w, pts] of TAGS) {
      if (simple() && w < 2) continue;
      curve(ctx, pts, "#1a0a06", w + 1.2);
      curve(ctx, pts, c, w);
    }
    ctx.save();
    path(ctx, wall);
    ctx.clip();
    G.grain(ctx, G.rectRegion(ctx, 28, -64, 112, 64), 286, 0.5);
    G.dirt(ctx, 0, -72, 168, 72, 287, 0.3);
    ctx.restore();
    if (!simple()) for (const pts of [[[22, -40], [26, -30], [24, -18]], [[146, -66], [142, -52], [148, -40]]]) line(ctx, pts, "k0", 0.6);
  }
});

define({
  id: "gantryBuilding",
  box: [0, -126, 182, 0],
  draw(ctx) {
    truss(ctx, 0, -120, 182, 20, "rust", 2.5);
    for (const x of [34, 150]) {
      box(ctx, x, -124, 20, 28, "steel", 2);
      G.surface(ctx, x, -124, 20, 28, x + 300, { rise: 0.35, drip: 2, dripLen: 16 });
      if (!simple()) for (const y of [-121, -99]) rivets(ctx, x, y, 20, 5, "m3");
    }
    flat(ctx, 0, -72, 182, 4, "m1", "mLine");
    for (let x = 2; x < 182; x += 22) flat(ctx, x, -94, 1.6, 22, "m2", "mLine");
    for (const y of [-94, -84]) flat(ctx, 0, y, 182, 1.6, "m2", "mLine");
    box(ctx, 0, -68, 182, 10, "steel", 1);
    G.surface(ctx, 0, -68, 182, 10, 302, { rise: 0.4 });
    for (let x = 6; x < 176; x += 26) {
      flat(ctx, x, -66, 16, 6, "water", "mLine");
      flat(ctx, x + 1, -65.5, 14, 1.5, "plasma");
      if (!simple()) glow(ctx, x + 8, -63, 10, "plasma", 0.25);
    }
    box(ctx, 0, -58, 182, 8, "rust", 2);
    G.surface(ctx, 0, -58, 182, 8, 303, { rise: 0.4 });
    for (const [x0, x1] of [[15, 85], [107, 153]]) {
      flat(ctx, x0, -50, x1 - x0, 28, "hole");
      for (let x = x0; x < x1; x += 18) {
        flat(ctx, x + 6, -50, 6, 2, "y3");
        if (!simple()) glow(ctx, x + 9, -47, 9, "y2", 0.3);
      }
      for (let x = x0; x < x1 - 1; x += (x1 - x0) / 3) {
        slab(ctx, x, -22, (x1 - x0) / 3, 22, "rust", 1);
        flat(ctx, x + 3, -18, (x1 - x0) / 3 - 6, 12, "r0", "rLine");
      }
      G.surface(ctx, x0, -22, x1 - x0, 22, x0 + 304, { rise: 0.35, drip: 2, dripLen: 12 });
      G.drips(ctx, x0, -50, x1 - x0, 24, x0 + 305, 3);
    }
    for (const [x, w] of [[0, 15], [85, 7], [100, 7], [153, 29]]) {
      pillar(ctx, x, -50, w, 50, "rust", 2);
      G.surface(ctx, x, -50, w, 50, x + 306, { rise: 0.35, drip: 1, dripLen: 24 });
    }
    flat(ctx, 159, -42, 16, 30, "r1", "rLine");
    G.grain(ctx, G.rectRegion(ctx, 159, -42, 16, 30), 307);
    G.rustPatch(ctx, 170, -24, 4, 3, 308);
  }
});

const GLYPHS = {
  B: c => { c.moveTo(0, 20); c.lineTo(0, 0); c.lineTo(9, 0); c.ellipse(9, 5, 6, 5, 0, -PI / 2, PI / 2); c.lineTo(0, 10); c.moveTo(9, 10); c.ellipse(9, 15, 7, 5, 0, -PI / 2, PI / 2); c.lineTo(0, 20); },
  A: c => { c.moveTo(0, 20); c.lineTo(8, 0); c.lineTo(16, 20); c.moveTo(4, 12); c.lineTo(12, 12); },
  R: c => { c.moveTo(0, 20); c.lineTo(0, 0); c.lineTo(9, 0); c.ellipse(9, 5.5, 6, 5.5, 0, -PI / 2, PI / 2); c.lineTo(0, 11); c.moveTo(7, 11); c.lineTo(15, 20); }
};

function glyph(ctx, ch, x, y, lit) {
  ctx.save();
  ctx.translate(x, y);
  if (lit && !simple()) glow(ctx, 8, 10, 18, "neonGlow", 0.35);
  for (const [c, w] of lit ? [["#2a0806", 7.4], ["#c22a1a", 6], ["neon", 4], ["#ffb89a", 1.2]] : [["mLine", 7.4], ["m1", 6], ["m2", 4]]) {
    ctx.beginPath();
    GLYPHS[ch](ctx);
    ctx.strokeStyle = color(c);
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }
  ctx.restore();
}

define({
  id: "barSign",
  box: [0, -106, 96, 0],
  anim: true,
  draw(ctx, state, t) {
    for (const [a, b] of [[[30, -62], [12, 0]], [[66, -62], [84, 0]], [[34, -62], [26, 0]], [[62, -62], [70, 0]]]) beam(ctx, a, b, 2.4, "rust");
    for (const [y0, y1] of [[-52, -36], [-36, -20], [-20, -4]]) {
      const l0 = 30 - (y0 + 62) * 0.29, r0 = 66 + (y0 + 62) * 0.29, l1 = 30 - (y1 + 62) * 0.29, r1 = 66 + (y1 + 62) * 0.29;
      beam(ctx, [l0, y0], [r1, y1], 1.2, "rust");
      beam(ctx, [r0, y0], [l1, y1], 1.2, "rust");
      beam(ctx, [l1, y1], [r1, y1], 1.4, "rust");
    }
    box(ctx, 24, -64, 48, 4, "rust", 2);
    G.surface(ctx, 24, -64, 48, 4, 320, { rise: 0, drip: 2, dripLen: 12 });
    box(ctx, 2, -68, 92, 4, "rust", 1);
    G.surface(ctx, 2, -68, 92, 4, 321, { rise: 0, drip: 3, dripLen: 10 });
    for (const [a, b] of [[[3, -68], [3, -94]], [[93, -68], [93, -94]], [[3, -94], [93, -94]], [[60, -94], [64, -104]]]) beam(ctx, a, b, 1.4, "rust");
    const rOn = state === 0 || (t * 1.7 % 1 < 0.35 && t % 2.3 > 0.4);
    glyph(ctx, "B", 6, -90, true);
    glyph(ctx, "A", 38, -90, true);
    glyph(ctx, "R", 70, -90, rOn);
  }
});

function fluted(ctx, x, y, w, h) {
  pillar(ctx, x, y, w, h, "concrete", 2, 3);
  G.surface(ctx, x, y, w, h, x + 340, { rise: 0.3, drip: 1, dripLen: 24, edge: false });
  flat(ctx, x - 1.5, y - 3, w + 3, 3, "k3", "kLine");
  G.chips(ctx, x - 1.5, y - 3, w + 3, x + 341, G.DIRT);
  flat(ctx, x - 1.5, -3, w + 3, 3, "k1", "kLine");
}

define({
  id: "barDoor",
  box: [0, -100, 144, 0],
  draw(ctx, state) {
    const top = [[0, -78], ...jagged(6, 138, -84, 12, 7, 21), [144, -86]];
    const wall = [[0, 0], ...top, [144, 0]];
    shape(ctx, wall, "k2", "kLine");
    G.grain(ctx, G.polyRegion(ctx, wall), 330);
    G.drips(ctx, 0, -63, 144, 24, 331, 7);
    G.dirt(ctx, 0, -86, 144, 86, 332, 0.25);
    G.rustPatch(ctx, 24, -74, 5, 3, 333);
    rebar(ctx, top, 3);
    flat(ctx, 0, -66, 144, 3, "k1");
    flat(ctx, 0, -5, 144, 5, "k1", "kLine");
    G.chips(ctx, 0, -5, 144, 334);
    flat(ctx, 8, -58, 38, 26, "hole", "kLine");
    flat(ctx, 6, -32, 42, 2, "k3", "kLine");
    G.drips(ctx, 6, -30, 42, 20, 335, 3);
    for (let x = 14; x < 46; x += 7) flat(ctx, x, -58, 1.4, 26 - (x % 3) * 4, "m2");
    flat(ctx, 68, -62, 52, 62, "k0", "kLine");
    flat(ctx, 70, -60, 48, 3, "k1");
    flat(ctx, 72, -74, 14, 9, "c2", "kLine");
    flat(ctx, 72, -71, 14, 3, "neon");
    flat(ctx, 68, -60, 52, 60, "m1", "mLine");
    if (state === 1) {
      flat(ctx, 70, -58, 25, 58, "hole");
      shape(ctx, [[72, 0], [76, -54], [89, -54], [93, 0]], "#c9a85a55");
      disc(ctx, 82.5, -40, 5, "#1a1210");
      shape(ctx, [[73.5, -18], [76.5, -32], [88.5, -32], [91.5, -18]], "#1a1210");
      for (const ex of [80.5, 84.5]) flat(ctx, ex - 0.6, -41, 1.2, 0.8, "a2");
    } else {
      box(ctx, 70, -58, 25, 58, "steel", 3, { vertical: true });
      G.surface(ctx, 70, -58, 25, 58, 337, { rise: 0.35, drip: 2, dripLen: 20 });
      flat(ctx, 76, -46, 9, 12, "c2", "mLine");
      for (const y of [-43, -40, -37]) flat(ctx, 77.5, y, 6, 0.8, "m1");
      flat(ctx, 89, -32, 3, 6, "m1", "mLine");
    }
    box(ctx, 95, -58, 23, 58, "steel", 3, { vertical: true });
    flat(ctx, 95, -58, 23, 58, "#0e2a2a88");
    G.surface(ctx, 95, -58, 23, 58, 338, { rise: 0.35, drip: 2, dripLen: 20 });
    flat(ctx, 95, -58, 2.5, 58, "hole");
    flat(ctx, 98, -32, 3, 6, "m1", "mLine");
    fluted(ctx, 56, -62, 12, 62);
    fluted(ctx, 120, -62, 12, 62);
  }
});

const HULL = [[2, -44], [16, -50], [56, -55], [112, -55], [142, -51], [164, -43], [180, -33], [190, -24], [193, -20], [188, -15], [164, -12], [40, -12], [14, -15], [4, -21], [2, -30]];
const HULL_BANDS = [[-60, 12, "sh3"], [-48, 16, "sh2"], [-32, 10, "m1"], [-22, 10, "m0"]];
const WING_FAR = [[100, -50], [-4, -60], [-12, -60], [40, -50]];
const WING = [[118, -46], [-6, -63], [-16, -63], [-14, -61], [36, -46]];
const COCKPIT = [[136, -51], [156, -46], [174, -37], [182, -31], [160, -35], [138, -42]];
const DOOR = [78, -43, 24, 26];
window.ENV.SHIP = { HULL, WING, COCKPIT, DOOR };
const COVER = [8, -38, 20, 12];

function gear(ctx, x) {
  flat(ctx, x - 5, -14, 14, 2, "sh0");
  beam(ctx, [x, -13], [x, -3], 2.6, "steel");
  beam(ctx, [x + 7, -13], [x, -7], 1.6, "steel");
  box(ctx, x - 9, -3, 20, 3, "steel", 2);
}

function shipDoor(ctx) {
  const [x, y, w, h] = DOOR;
  line(ctx, [[x, y + h], [x, y], [x + w, y], [x + w, y + h]], "shLine", 0.6, "butt");
  flat(ctx, x + 2, y + h + 3, w - 4, 2, "m2", "mLine");
}

define({
  id: "crashedShip",
  box: [-16, -64, 196, 0],
  draw(ctx, state) {
    gear(ctx, 50);
    gear(ctx, 140);
    shape(ctx, WING_FAR, "sh0", "shLine");
    box(ctx, -3, -43, 7, 24, "steel", 1);
    ctx.save();
    path(ctx, HULL);
    ctx.clip();
    for (const [y, h, c] of HULL_BANDS) flat(ctx, 0, y, 196, h, c);
    ctx.restore();
    path(ctx, HULL);
    stroke(ctx, "ship");
    line(ctx, [[4, -32], [150, -32], [186, -22]], "shLine", 0.6);
    if (!simple()) {
      for (const x of [40, 128]) line(ctx, [[x, -54], [x, -13]], "shLine", 0.4);
      for (const x of [120, 128, 136, 144]) flat(ctx, x, -21, 2, 1.2, "y2");
    }
    shape(ctx, COCKPIT, "glass", "shLine");
    if (!simple()) shape(ctx, [[142, -49], [152, -46.5], [146, -44], [140, -45.5]], "sh3");
    disc(ctx, 191, -20, 1.5, "m3");
    shipDoor(ctx);
    shape(ctx, WING, "sh2", "shLine");
    line(ctx, [[116, -46.6], [-6, -62.4]], "sh3", 1.2);
    line(ctx, [[-14, -61.4], [36, -46.6]], "sh0", 1.2);
    if (!simple()) {
      line(ctx, [[44, -47.6], [-6, -60.6]], "sh1", 0.6);
      disc(ctx, -11, -62.4, 1.2, "screen");
    }
    for (const y of [-40, -29]) {
      cylH(ctx, -8, y, 10, 8, "steel", 2);
      disc(ctx, -8, y + 4, 3, "hole", "mLine");
    }
    const [cx, cy, cw, ch] = COVER;
    if (state === 0) {
      box(ctx, cx, cy, cw, ch, "steel", 2);
      if (!simple()) for (const y of [cy + 2, cy + ch - 2]) rivets(ctx, cx, y, cw, 5, "m3");
      return;
    }
    const torn = blob(cx + cw / 2, cy + ch / 2, cw * 0.62, ch * 0.7, 17, 16);
    G.scorch(ctx, torn, 358);
    shape(ctx, blob(cx + cw / 2, cy + ch / 2, cw * 0.8, ch * 0.9, 18, 16), "sh0");
    shape(ctx, torn, "hole", "shLine");
    G.rim(ctx, torn, 359, "sh3", "shLine");
    if (!simple()) for (let i = 0; i < 5; i++) line(ctx, [[cx + 3 + i * 3.5, cy + ch - 2], [cx + 4 + i * 3.5, cy + 3]], "m1", 0.6);
    if (state === 1) {
      if (!simple()) glow(ctx, cx + cw / 2, cy + ch / 2, 14, "a1", 0.45);
      for (const [px, py] of torn.filter((_, i) => i % 3 === 0)) disc(ctx, px, py, 0.9, "a2");
    }
  }
});

function splat(ctx, x, y, seed, drips = 2) {
  const r = rng(seed);
  shape(ctx, blob(x, y, 3 + r() * 2, 1.6 + r(), seed, 10), "#9c1410");
  for (let i = 0; i < drips; i++) {
    const dx = x + (r() - 0.5) * 5, len = 3 + r() * 9;
    line(ctx, [[dx, y], [dx, y + len]], "#9c1410", 0.9);
    disc(ctx, dx, y + len, 0.7, "#9c1410");
  }
}

define({
  id: "metroTrain",
  box: [0, -62, 140, 0],
  draw(ctx) {
    flat(ctx, 0, -9, 124, 9, "m0", "mLine");
    for (const x of [20, 34, 92, 106]) {
      disc(ctx, x, -4, 3.6, "m1", "mLine");
      disc(ctx, x, -4, 1.2, "m3");
    }
    flat(ctx, 0, -55, 124, 46, TRAIN.wagon, "mLine");
    shape(ctx, [[3, -58], [121, -58], [124, -55], [0, -55]], TRAIN.wagonShade, "mLine");
    flat(ctx, 0, -55, 124, 1.5, "c1");
    flat(ctx, 0, -15, 124, 6, TRAIN.wagonShade);
    flat(ctx, 0, -27, 124, 1, TRAIN.wagonShade);
    flat(ctx, 0, -24, 124, 3.5, TRAIN.stripe);
    flat(ctx, 0, -19, 124, 1, TRAIN.wagonShade);
    G.wagon(ctx, 0, -55, 124, 46, 81);
    for (const [x, w] of [[34, 19], [55, 19], [96, 22]]) {
      flat(ctx, x - 1, -50, w + 2, 20, TRAIN.wagonShade);
      flat(ctx, x, -49, w, 18, TRAIN.window);
      G.dirt(ctx, x, -49, w, 18, x, 0.35);
      ctx.globalAlpha = 0.6;
      shape(ctx, [[x + 2, -49], [x + 6.5, -49], [x + 1, -31], [x, -31]], TRAIN.windowGlint);
      ctx.globalAlpha = 1;
    }
    flat(ctx, 80, -48, 9, 15, "c1", "mLine");
    flat(ctx, 5, -52, 24, 43, TRAIN.doorFrame, "mLine");
    flat(ctx, 7, -50, 20, 41, TRAIN.interior);
    for (const [x, edge] of [[7, 7], [17, 25]]) {
      flat(ctx, x, -50, 10, 41, TRAIN.door);
      flat(ctx, edge, -50, 2, 41, TRAIN.doorShade);
      flat(ctx, x + 2, -46, 6, 13, TRAIN.window);
      ctx.globalAlpha = 0.6;
      shape(ctx, [[x + 3, -46], [x + 4.5, -46], [x + 3, -33], [x + 2, -33]], TRAIN.windowGlint);
      ctx.globalAlpha = 1;
    }
    flat(ctx, 16.6, -50, 0.8, 41, TRAIN.interior);
    G.grain(ctx, G.rectRegion(ctx, 7, -50, 20, 41), 82);
    G.dirt(ctx, 7, -50, 20, 41, 83, 0.4);
    for (const [x, y, seed, drips] of [[44, -51, 3, 3], [100, -51, 4, 2], [62, -29, 5, 2], [116, -33, 6, 1]]) splat(ctx, x, y, seed, simple() ? 1 : drips);
    slab(ctx, 126, -62, 14, 62, "concrete", 1);
  }
});
})();
