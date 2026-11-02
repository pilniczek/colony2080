(() => {
const { define, P, G, TILE } = window.ENV;
const simple = () => window.ENV.simple;
const { rng, path, color, flat, box, cylV, disc, rivets, glow, stroke, shape, line, curve, mesh, hazard } = P;
const { PI, sin, cos, min, max, abs, round, floor, ceil } = Math;

const ellipse = (ctx, cx, cy, rx, ry, fill, edge = null) => {
  ctx.fillStyle = color(fill);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
  ctx.fill();
  if (edge) stroke(ctx, edge);
};
const shadow = (ctx, cx, w, alpha = 0.4) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ellipse(ctx, cx, -0.4, w / 2, 0.9, "hole");
  ctx.restore();
};
const smoke = (ctx, x, y, t, n = 3, h = 22) => {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const k = (t * 0.35 + i / n) % 1;
    ctx.globalAlpha = 0.22 * (1 - k);
    ellipse(ctx, x + sin(t * 1.3 + i * 2) * 2 + k * 5, y - k * h, 2 + k * 5, 1.6 + k * 3.5, k < 0.3 ? "k1" : "k2");
  }
  ctx.restore();
};
const spark = (ctx, x, y, t, seed = 0) => {
  if (floor(t * 7 + seed) % 4) return;
  const r = rng(floor(t * 7) + seed * 13);
  if (!simple()) glow(ctx, x, y, 5, "y3", 0.8);
  for (let i = 0; i < 4; i++) {
    const a = r() * PI * 2;
    const l = 2 + r() * 3;
    line(ctx, [[x, y], [x + cos(a) * l, y + sin(a) * l]], "y3", 0.5);
  }
};
const flame = (ctx, x, base, w, h, t, seed = 0) => {
  const f = 0.85 + sin(t * 11 + seed * 2.3) * 0.08 + sin(t * 17.3 + seed) * 0.07;
  const tip = h * f;
  const lean = sin(t * 6 + seed) * w * 0.12;
  const pts = (k, s) => [
    [x + w * (0.5 - s / 2), base],
    [x + w * (0.5 - s / 2) + w * 0.05, base - tip * k * 0.45],
    [x + w / 2 + lean * k - w * s * 0.18, base - tip * k * 0.75],
    [x + w / 2 + lean * k, base - tip * k],
    [x + w / 2 + lean * k + w * s * 0.2, base - tip * k * 0.7],
    [x + w * (0.5 + s / 2) - w * 0.04, base - tip * k * 0.4],
    [x + w * (0.5 + s / 2), base],
  ];
  if (!simple()) glow(ctx, x + w / 2, base - tip * 0.4, w * 1.3, "a1", 0.35);
  shape(ctx, pts(1, 1), "fire0");
  shape(ctx, pts(0.75, 0.7), "fire1");
  shape(ctx, pts(0.45, 0.42), "fire2");
};
const viewSpan = (ctx, x0, y0, x1, y1) => {
  const { a, b, c, d, e, f } = ctx.getTransform();
  const det = a * d - b * c;
  const cw = Number(ctx.canvas.width);
  const ch = Number(ctx.canvas.height);
  if (!det || !cw || !ch) return [x0, y0, x0, y0];
  const xs = [];
  const ys = [];
  for (const [X, Y] of [[0, 0], [cw, 0], [0, ch], [cw, ch]]) {
    xs.push((d * (X - e) - c * (Y - f)) / det);
    ys.push((-b * (X - e) + a * (Y - f)) / det);
  }
  return [max(x0, min(...xs)), max(y0, min(...ys)), min(x1, max(...xs)), min(y1, max(...ys))];
};
const cells = (ctx, x, y, w, h) => {
  const [vx0, vy0, vx1, vy1] = viewSpan(ctx, x, y, x + w, y + h);
  return [max(0, floor((vx0 - x) / TILE)), min(ceil(w / TILE), ceil((vx1 - x) / TILE)), max(0, floor((vy0 - y) / TILE)), min(ceil(h / TILE), ceil((vy1 - y) / TILE))];
};
const hash = (a, b) => {
  const s = sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - floor(s);
};
const CRATE = ["#1e261c", "#2c3828", "#3c4a36", "#5a6a50", "#0e120c"];
const CRATE_ALT = ["#222a22", "#30382e", "#424c3e", "#626e58"];
const STRIPE = "#b08a30";
const STRIPE_DARK = "#5a3e14";
const crate = (ctx, x, y, seed) => {
  const k = hash(seed, 3);
  const t = k < 0.3 ? CRATE_ALT : CRATE;
  flat(ctx, x, y, 24, 18, t[1]);
  flat(ctx, x, y, 24, 1.2, t[3]);
  flat(ctx, x, y, 1.2, 18, t[2]);
  flat(ctx, x + 22.8, y, 1.2, 18, t[0]);
  flat(ctx, x + 2.5, y + 2, 3, 14, t[2]);
  flat(ctx, x + 18.5, y + 2, 3, 14, t[0]);
  const flipped = hash(seed, 7) < 0.5;
  const diag = flipped ? [[x + 18.5, y + 2], [x + 21.5, y + 2], [x + 8.5, y + 16], [x + 5.5, y + 16]] : [[x + 5.5, y + 2], [x + 8.5, y + 2], [x + 21.5, y + 16], [x + 18.5, y + 16]];
  shape(ctx, diag, t[2]);
  if (!simple()) {
    line(ctx, [diag[1], diag[2]], t[0], 0.7);
    flat(ctx, x + 11.4, y + 8.4, 1.4, 1.4, t[3]);
    flat(ctx, x + 3.4, y + 3, 1.2, 1.2, t[3]);
  }
  flat(ctx, x, y + 18, 24, 6, CRATE[4]);
  flat(ctx, x, y + 19.6, 24, 1.3, k > 0.85 ? STRIPE_DARK : STRIPE);
  if (!simple()) flat(ctx, x, y + 20.9, 24, 0.7, STRIPE_DARK);
};
const crateWall = {
  id: "crateWall",
  box: [0, -168, 72, 0],
  draw(ctx, _state, _t, { w = 72, h = 168 } = {}) {
    const seed = round(w * 3 + h * 7);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -h, w, h);
    ctx.clip();
    flat(ctx, 0, -h, w, h, CRATE[4]);
    const [c0, c1, r0, r1] = cells(ctx, 0, -h, w, h);
    for (let j = r0; j < r1; j++)
      for (let i = c0; i < c1; i++) crate(ctx, i * TILE, -h + j * TILE, seed + i * 31 + j * 17);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 0.9);
    if (!simple()) {
      for (let j = r0; j < r1; j++) {
        for (let i = c0; i < c1; i++) {
          const s = hash(seed + i, j);
          if (s < 0.22) G.drips(ctx, i * TILE, -h + j * TILE + 20, TILE, 14, seed + i * 7 + j * 13, 1);
          if (s > 0.9) G.rustPatch(ctx, i * TILE + 12, -h + j * TILE + 12, 3, 1.6, seed + i * 5 + j);
        }
      }
    }
    G.dirt(ctx, 0, -h, w, h, seed + 2, min(0.25, 36 / h));
    ctx.restore();
  },
};
const SOIL = ["#2a1e10", "#4a3420", "#6a4c2c", "#8a6a40"];
const GRASS = ["#2e3a14", "#4c5a1e", "#6e7a2a", "#9a9440", "#b8a858"];
const STONE = ["#26262a", "#3e3e3c", "#5a5a54", "#7e7c72", "#121210"];
const tufts = (ctx, x0, x1, y, seed, step = 3.2) => {
  const r = rng(seed);
  for (let x = x0 + r() * step; x < x1; x += step * (0.6 + r() * 0.8)) {
    const h = 2 + r() * 4.5;
    const c = GRASS[1 + floor(r() * 4)];
    const lean = (r() - 0.5) * 2.4;
    line(ctx, [[x, y + 1], [x + lean, y - h]], c, 0.9);
    if (r() < 0.6) line(ctx, [[x + 0.8, y + 1], [x + 0.8 + lean * 1.6, y - h * 0.7]], GRASS[2], 0.7);
  }
};
const walkway = (ctx, w) => {
  const seed = 400 + round(w) * 3;
  const [vx0, , vx1] = viewSpan(ctx, -6, -8, w + 6, 26);
  const x0 = max(0, floor(vx0 / TILE) * TILE);
  const x1 = min(w, ceil(vx1 / TILE) * TILE);
  if (x1 <= x0) return;
  flat(ctx, x0, 6, x1 - x0, 18, STONE[1]);
  for (let x = x0; x < x1; x += TILE) {
    const k = floor(x / TILE);
    const bw = min(TILE, w - x);
    flat(ctx, x + 0.6, 7.2, bw - 1.2, 15.6, hash(k, 2) < 0.35 ? STONE[2] : STONE[1]);
    flat(ctx, x + 0.6, 7.2, bw - 1.2, 1.2, STONE[3]);
    if (bw > 12) {
      const n = hash(k, 5) < 0.5 ? [[x + 4, 21], [x + 4, 9], [x + bw - 4, 21], [x + bw - 4, 9]] : [[x + 4, 9], [x + 4, 21], [x + bw - 4, 9], [x + bw - 4, 21]];
      line(ctx, n, STONE[0], 2.2);
      if (!simple()) line(ctx, n, STONE[3], 0.6);
    }
    flat(ctx, x, 22.6, bw, 1.4, STONE[4]);
  }
  flat(ctx, x0, 0, x1 - x0, 7, SOIL[1]);
  const r = rng(seed + floor(x0 / TILE));
  for (let x = x0; x < x1; x += 5 + r() * 9) flat(ctx, x, 2 + r() * 3, 2 + r() * 5, 1 + r() * 1.5, r() < 0.5 ? SOIL[0] : SOIL[2]);
  flat(ctx, x0, 0, x1 - x0, 1.4, SOIL[3]);
  flat(ctx, x0, 6.4, x1 - x0, 0.8, SOIL[0]);
  G.grain(ctx, G.rectRegion(ctx, x0, 0, x1 - x0, 24), seed + 1);
  if (!simple()) {
    for (let x = x0; x < x1; x += TILE) {
      const k = floor(x / TILE);
      if (hash(k, 9) < 0.4) G.drips(ctx, x, 7, TILE, 10, seed + k, 1);
      if (hash(k, 11) < 0.3) {
        const mx = x + hash(k, 12) * 16;
        shape(ctx, [[mx, 7], [mx + 6, 7], [mx + 4.5, 11], [mx + 1.5, 12]], GRASS[0]);
      }
    }
    tufts(ctx, x0, x1, 0, seed + 3 + floor(x0 / TILE));
  }
  else {
    for (let x = x0; x < x1; x += 6) flat(ctx, x, -1.6, 3, 1.8, GRASS[2]);
  }
};
const grassyWalkway = {
  id: "grassyWalkway",
  box: [0, -6, 120, 25],
  draw(ctx, _state, _t, { w = 120 } = {}) {
    walkway(ctx, w);
  },
};
const walkwayGirder = {
  id: "walkwayGirder",
  box: [0, -30, 120, 1],
  draw(ctx, _state, _t, { w = 120 } = {}) {
    ctx.translate(0, -TILE);
    walkway(ctx, w);
  },
};
const SKY = [[0, "#04070a"], [0.35, "#08100e"], [0.6, "#0e1a14"], [0.8, "#142016"], [1, "#0a0e0a"]];
const STARS = Array.from({ length: 70 }, (_, i) => [hash(i, 1) * 320, -170 + hash(i, 2) * 60, 0.25 + hash(i, 3) * 0.45]);
const ridge = (x0, x1, base, amp, step, seed) => {
  const r = rng(seed);
  const pts = [[x0, 0]];
  for (let x = x0; x <= x1; x += step) pts.push([x, base - r() * amp]);
  pts.push([x1, base - r() * amp], [x1, 0]);
  return pts;
};
const palmTop = (ctx, x, y, s, c, seed) => {
  const r = rng(seed);
  for (let i = 0; i < 7; i++) {
    const a = -PI / 2 + (i - 3) * 0.48 + (r() - 0.5) * 0.25;
    const l = s * (0.8 + r() * 0.4);
    const ex = x + cos(a) * l;
    const ey = y + sin(a) * l * 0.55 + l * 0.35;
    const mx = x + cos(a) * l * 0.5;
    const my = y + sin(a) * l * 0.6;
    shape(ctx, [[x, y], [mx, my - s * 0.12], [ex, ey], [mx, my + s * 0.1]], c);
  }
};
const palm = (ctx, x, base, h, lean, c, seed) => {
  const top = [x + lean, base - h];
  curve(ctx, [[x, base], [x + lean * 0.2, base - h * 0.5], top], c, max(1.2, h * 0.05));
  palmTop(ctx, top[0], top[1], h * 0.42, c, seed);
};
const villageBackdrop = {
  id: "villageBackdrop",
  box: [0, -170, 320, 0],
  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -170, 320, 170);
    ctx.clip();
    const g = ctx.createLinearGradient(0, -170, 0, 0);
    for (const [at, c] of SKY) g.addColorStop(at, c);
    ctx.fillStyle = g;
    ctx.fillRect(0, -170, 320, 170);
    if (!simple())
      for (const [x, y, s] of STARS) flat(ctx, x, y, s, s, "#8a9a90");
    glow(ctx, 244, -152, 22, "#4a5a4a", 0.35);
    disc(ctx, 244, -152, 4.2, "#b8bca0");
    disc(ctx, 245.4, -152.8, 3.6, "#8a8e78");
    shape(ctx, ridge(0, 320, -118, 16, 9, 11), "#0c1612");
    shape(ctx, ridge(0, 320, -100, 12, 6, 12), "#0a130f");
    for (let i = 0; i < 16; i++) palm(ctx, hash(i, 4) * 330 - 5, -92 + hash(i, 5) * 8, 14 + hash(i, 6) * 12, (hash(i, 7) - 0.5) * 8, "#08100c", 30 + i);
    shape(ctx, ridge(0, 320, -84, 8, 5, 13), "#08100c");
    flat(ctx, 0, -84, 320, 84, "#070c09");
    ctx.restore();
  },
};
const JUNGLE = ["#0c1610", "#14221a", "#1e3024", "#2c4232", "#3e5640"];
const blob = (cx, cy, rx, ry, seed, n = 12) => {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * PI * 2;
    const k = 0.75 + r() * 0.35;
    return [cx + cos(a) * rx * k, cy + sin(a) * ry * k];
  });
};
const fern = (ctx, x, fh, c) => {
  for (let k = -2; k <= 2; k++) curve(ctx, [[x, 0], [x + k * fh * 0.25, -fh * 0.6], [x + k * fh * 0.55, -fh * (0.7 - abs(k) * 0.12)]], c, 1);
};
const jungleCanopy = {
  id: "jungleCanopy",
  box: [-30, -150, 270, 0],
  draw(ctx, _state, _t, { w = 240, h = 144 } = {}) {
    const seed = round(w * 5 + h * 3);
    const r = rng(seed);
    for (let x = -10; x < w + 10; x += 22 + r() * 18) shape(ctx, blob(x, -h * (0.55 + r() * 0.2), 26 + r() * 14, 18 + r() * 10, seed + round(x)), JUNGLE[0]);
    flat(ctx, 0, -h * 0.55, w, h * 0.55, JUNGLE[0]);
    for (let x = 8; x < w; x += 30 + r() * 30) palm(ctx, x, 0, h * (0.7 + r() * 0.3), (r() - 0.5) * 30, JUNGLE[1], seed + round(x) * 3);
    for (let x = 0; x < w + 10; x += 16 + r() * 12) shape(ctx, blob(x, -h * (0.18 + r() * 0.12), 14 + r() * 8, 10 + r() * 6, seed + 7 + round(x)), JUNGLE[r() < 0.5 ? 1 : 2]);
    if (!simple())
      for (let x = 4; x < w; x += 9 + r() * 10) fern(ctx, x, 8 + r() * 10, JUNGLE[3]);
    flat(ctx, 0, -6, w, 6, JUNGLE[0]);
  },
};
const RUIN = ["#4a4840", "#6e6a5c", "#8e8a78", "#aca692", "#1c1a16"];
const jagged = (x0, x1, y, amp, step, seed) => {
  const r = rng(seed);
  const pts = [];
  for (let x = x0; x < x1; x += step * (0.5 + r())) pts.push([x, y + r() * amp]);
  pts.push([x1, y + r() * amp]);
  return pts;
};
const ruinWall = {
  id: "ruinWall",
  box: [0, -72, 144, 0],
  draw(ctx, _state, _t, { w = 144, h = 72 } = {}) {
    const seed = round(w * 11 + h);
    const outline = [[0, 0], ...jagged(0, w, -h, h * 0.35, 10, seed), [w, 0]];
    shape(ctx, outline, RUIN[1], RUIN[4]);
    G.grain(ctx, G.polyRegion(ctx, outline), seed + 1);
    const r = rng(seed + 2);
    ctx.save();
    path(ctx, outline);
    ctx.clip();
    for (let y = -h + 10; y < -4; y += 12) flat(ctx, 0, y, w, 1, RUIN[0]);
    for (let x = 6 + r() * 20; x < w - 20; x += 34 + r() * 30) {
      flat(ctx, x, -h * 0.62, 14, h * 0.3, RUIN[4]);
      flat(ctx, x - 1.5, -h * 0.62 - 2, 17, 2, RUIN[2]);
    }
    G.drips(ctx, 0, -h, w, h * 0.6, seed + 3, round(w / 16), false);
    G.dirt(ctx, 0, -h, w, h, seed + 4, 0.35);
    ctx.restore();
    if (!simple())
      for (let x = 4; x < w; x += 7 + r() * 9) fern(ctx, x, 5 + r() * 9, r() < 0.5 ? "#2a3a24" : "#3a4c2e");
  },
};
const BOULDER = ["#2a2620", "#4c463a", "#6e6654", "#968c74", "#b4aa8e"];
const boulder = (ctx, cx, cy, rx, ry, seed) => {
  shape(ctx, blob(cx, cy, rx, ry, seed, 10), BOULDER[1], BOULDER[0]);
  shape(ctx, blob(cx - rx * 0.18, cy - ry * 0.22, rx * 0.72, ry * 0.6, seed + 1, 9), BOULDER[2]);
  if (!simple()) {
    shape(ctx, blob(cx - rx * 0.32, cy - ry * 0.4, rx * 0.36, ry * 0.26, seed + 2, 8), BOULDER[3]);
    flat(ctx, cx - rx * 0.4, cy - ry * 0.55, rx * 0.25, 0.8, BOULDER[4]);
    line(ctx, [[cx - rx * 0.6, cy + ry * 0.5], [cx + rx * 0.5, cy + ry * 0.62]], BOULDER[0], 0.8);
  }
};
const rockCliff = {
  id: "rockCliff",
  box: [-14, -80, 80, 6],
  draw(ctx, _state, _t, { w = 72, h = 72 } = {}) {
    const seed = round(w * 13 + h * 5);
    const r = rng(seed);
    const rows = max(1, round(h / 14));
    const band = min(w, 30);
    for (let j = 0; j < rows; j++) {
      const y = -(j + 0.5) * (h / rows);
      const edge = (w * (j + 0.5)) / rows;
      for (let x = edge - 8 + r() * 6; x < min(w + 4, edge + band); x += 13 + r() * 9) boulder(ctx, x, y + (r() - 0.5) * 4, 8 + r() * 6, 5.5 + r() * 3.5, seed + j * 31 + round(x));
    }
    for (let j = 0; j < rows; j++) {
      const y = -(j + 0.5) * (h / rows);
      boulder(ctx, (w * (j + 0.5)) / rows - 5, y + 2, 9 + r() * 4, 6 + r() * 2, seed + 500 + j);
    }
  },
};
const bronzePipe = {
  id: "bronzePipe",
  box: [-3, -168, 19, 0],
  draw(ctx, _state, _t, { h = 168 } = {}) {
    const seed = 600 + round(h) * 3;
    cylV(ctx, 0, -h, 16, h, "rust", 2);
    if (!simple()) {
      flat(ctx, 4, -h, 2.4, h, "#c89a60");
      flat(ctx, 11, -h, 1.4, h, "r1");
    }
    for (let y = -h + 10; y < -8; y += 48) {
      box(ctx, -2, y, 20, 5, "rust", 3);
      rivets(ctx, -2, y + 2.5, 20, 5, "r0");
    }
    box(ctx, -2, -6, 20, 6, "steel", 1);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, 16, h), seed);
    G.drips(ctx, 0, -h, 16, min(60, h * 0.4), seed + 1, 2);
    G.dirt(ctx, 0, -h, 16, h, seed + 2, min(0.3, 30 / h));
  },
};
const latticeMast = {
  id: "latticeMast",
  box: [-2, -168, 26, 0],
  draw(ctx, _state, _t, { h = 168 } = {}) {
    const seed = 620 + round(h) * 3;
    const n = max(1, round(h / TILE));
    const s = h / n;
    for (let i = 0; i < n; i++) {
      const y = -h + i * s;
      for (const c of [CRATE[0], CRATE[2]]) {
        const wd = c === CRATE[0] ? 3 : 1.8;
        line(ctx, [[3, y + 2], [21, y + s - 2]], c, wd);
        line(ctx, [[21, y + 2], [3, y + s - 2]], c, wd);
      }
      flat(ctx, 0, y, 24, 2.4, CRATE[1]);
      if (!simple()) flat(ctx, 0, y, 24, 0.8, CRATE[3]);
    }
    flat(ctx, 0, -h, 3.4, h, CRATE[2], CRATE[4]);
    flat(ctx, 20.6, -h, 3.4, h, CRATE[1], CRATE[4]);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, 24, h), seed);
    G.drips(ctx, 0, -h, 24, min(40, h * 0.3), seed + 1, 2);
  },
};
const overheadPipeline = {
  id: "overheadPipeline",
  box: [0, -16, 240, 6],
  draw(ctx, _state, _t, { w = 240 } = {}) {
    const seed = 640 + round(w);
    flat(ctx, 0, -9, w, 2.6, "c0", "mLine");
    flat(ctx, 0, -9, w, 0.8, "c1");
    flat(ctx, 0, -4.6, w, 2, "m2", "mLine");
    for (let x = 18; x < w - 12; x += 72) {
      box(ctx, x, -14, 18, 13, "concrete", 2);
      hazard(ctx, x + 2, -11, 14, 3.4, 3, { fill: "a1", dark: "hazardDark", line: "aLine" });
      G.grain(ctx, G.rectRegion(ctx, x, -14, 18, 13), seed + x);
      G.drips(ctx, x, -1, 18, 6, seed + x + 1, 1);
    }
    for (let x = 54; x < w - 12; x += 72) {
      box(ctx, x, -11, 6, 9, "steel", 2);
      if (!simple()) flat(ctx, x + 1, -10, 1, 7, "m3");
    }
  },
};
const PLANK = ["#24160c", "#3e2814", "#5a3c1e", "#7a5430", "#0e0804"];
const planks = (ctx, x, y, w, h, seed, vertical = false) => {
  const r = rng(seed);
  flat(ctx, x, y, w, h, PLANK[1]);
  if (vertical) {
    for (let px = x; px < x + w; px += 6) {
      flat(ctx, px, y, min(5.4, x + w - px), h, r() < 0.3 ? PLANK[2] : PLANK[1]);
      flat(ctx, px + 5.4, y, 0.6, h, PLANK[4]);
    }
  }
  else {
    for (let py = y; py < y + h; py += 5) {
      flat(ctx, x, py, w, min(4.4, y + h - py), r() < 0.3 ? PLANK[2] : PLANK[1]);
      flat(ctx, x, py + 4.4, w, 0.6, PLANK[4]);
    }
  }
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed + 1);
  G.dirt(ctx, x, y, w, h, seed + 2, 0.3);
};
const post = (ctx, x, top, w) => {
  box(ctx, x, top, w, -top, "rust", 1, { vertical: true });
  if (!simple()) flat(ctx, x + 1, top, 1, -top, "r2");
};
const windowRow = (ctx, x, y, n, ww, wh, gap, seed) => {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const wx = x + i * (ww + gap);
    flat(ctx, wx - 1.5, y - 1.5, ww + 3, wh + 3, PLANK[3], PLANK[4]);
    const lit = r() < 0.18;
    flat(ctx, wx, y, ww, wh, lit ? "#5a4418" : "#0e0a06");
    if (lit && !simple()) glow(ctx, wx + ww / 2, y + wh / 2, ww, "#c08a30", 0.25);
    flat(ctx, wx + ww / 2 - 0.5, y, 1, wh, PLANK[1]);
    if (!simple()) flat(ctx, wx, y, ww, 1.4, "#00000066");
  }
};
const stiltBuilding = {
  id: "stiltBuilding",
  box: [-6, -200, 246, 0],
  draw(ctx, state, _t, { w = 240 } = {}) {
    const seed = 700 + round(w) * 3 + state * 101;
    if (state === 1) {
      for (const x of [w * 0.12, w * 0.5, w * 0.84]) post(ctx, x, -72, 10);
      line(ctx, [[w * 0.12 + 10, -66], [w * 0.5, -12]], PLANK[4], 3);
      line(ctx, [[w * 0.12 + 10, -66], [w * 0.5, -12]], PLANK[2], 1.6);
      flat(ctx, 0, -80, w, 8, PLANK[2], PLANK[4]);
      planks(ctx, 6, -136, w - 12, 56, seed);
      windowRow(ctx, 18, -122, max(1, floor((w - 30) / 26)), 16, 20, 10, seed + 1);
      box(ctx, -2, -142, w + 4, 6, "rust", 2);
      const r = rng(seed + 3);
      for (let x = 4; x < w - 4; x += 14 + r() * 10) {
        const lh = 10 + r() * 22;
        const lean = (r() - 0.5) * 8;
        line(ctx, [[x, -142], [x + lean, -142 - lh]], PLANK[4], 2.6);
        line(ctx, [[x, -142], [x + lean, -142 - lh]], PLANK[2], 1.4);
      }
      for (const x of [0, w - 5])
        box(ctx, x, -142, 5, 62, "rust", 1, { vertical: true });
      G.drips(ctx, 6, -80, w - 12, 20, seed + 4, round(w / 20));
      return;
    }
    for (const x of [w * 0.18, w * 0.74]) post(ctx, x, -76, 18);
    if (!simple()) {
      line(ctx, [[w * 0.18 + 18, -70], [w * 0.74, -10]], PLANK[4], 3);
      line(ctx, [[w * 0.18 + 18, -70], [w * 0.74, -10]], PLANK[1], 1.6);
    }
    flat(ctx, 0, -84, w, 8, PLANK[2], PLANK[4]);
    planks(ctx, 4, -186, w - 8, 102, seed);
    for (const y of [-176, -128]) {
      flat(ctx, 4, y - 6, w - 8, 4, PLANK[3], PLANK[4]);
      windowRow(ctx, 16, y, max(1, floor((w - 26) / 24)), 15, 24, 9, seed + y);
    }
    box(ctx, -4, -192, w + 8, 7, "rust", 2);
    for (const x of [0, w - 6])
      box(ctx, x, -192, 6, 108, "rust", 1, { vertical: true });
    G.drips(ctx, 4, -186, w - 8, 50, seed + 5, round(w / 16));
  },
};
const concreteBlock = (ctx, x, y, w, h, seed) => {
  flat(ctx, x, y, w, h, RUIN[2], RUIN[4]);
  flat(ctx, x, y, w, 1.6, RUIN[3]);
  flat(ctx, x + w - 2, y, 2, h, RUIN[1]);
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed);
};
const villageHouse = {
  id: "villageHouse",
  box: [-4, -156, 244, 0],
  draw(ctx, state, _t, { w = 240 } = {}) {
    const seed = 760 + round(w) * 5 + state * 77;
    if (state === 1) {
      const outline = [[0, 0], [0, -144], [w * 0.2, -144], [w * 0.24, -128], [w * 0.36, -136], [w * 0.42, -120], [w * 0.58, -124], [w * 0.64, -144], [w, -144], [w, 0]];
      shape(ctx, outline, RUIN[1], RUIN[4]);
      G.grain(ctx, G.polyRegion(ctx, outline), seed);
      for (const x of [0, w - 36]) concreteBlock(ctx, x, -144, 36, 144, seed + x);
      flat(ctx, 36, -104, w - 72, 10, RUIN[3], RUIN[4]);
      const arches = max(1, round((w - 72) / 60));
      const aw = (w - 72) / arches;
      for (let i = 0; i < arches; i++) {
        const ax = 36 + i * aw + aw * 0.18;
        const pts = [[ax, 0], [ax, -60], [ax + aw * 0.32, -82], [ax + aw * 0.64, -60], [ax + aw * 0.64, 0]];
        shape(ctx, pts, "#0e0c0a");
        G.rim(ctx, pts, seed + i, RUIN[3], RUIN[4]);
      }
      const r = rng(seed + 1);
      for (let i = 0; i < 6; i++) flat(ctx, 40 + r() * (w - 90), -140 + r() * 30, 8 + r() * 10, 5 + r() * 6, r() < 0.5 ? RUIN[0] : "#2a4a2a");
      for (const x of [w * 0.24, w * 0.6]) {
        const hole = [[x, -128], [x + 14, -132], [x + 20, -118], [x + 8, -112]];
        G.scorch(ctx, hole, seed + round(x));
        shape(ctx, hole, "#0e0c0a");
        G.rim(ctx, hole, seed + round(x) + 1, RUIN[3], RUIN[4]);
      }
      G.drips(ctx, 0, -144, w, 70, seed + 2, round(w / 14), false);
      G.dirt(ctx, 0, -144, w, 144, seed + 3, 0.25);
      return;
    }
    concreteBlock(ctx, 0, -96, w, 96, seed);
    flat(ctx, -4, -102, w + 8, 7, RUIN[3], RUIN[4]);
    const r = rng(seed + 4);
    for (let x = 14; x < w - 30; x += 40) {
      const kind = r();
      flat(ctx, x, -80, 26, 30, "#121410", RUIN[4]);
      if (kind < 0.4) {
        for (let k = 1; k < 4; k++) flat(ctx, x + k * 6.5, -80, 1.2, 30, RUIN[1]);
        flat(ctx, x, -66, 26, 1.2, RUIN[1]);
      }
      else if (kind < 0.55) {
        flat(ctx, x + 3, -77, 20, 24, "#2e4e44");
        if (!simple()) flat(ctx, x + 4, -76, 6, 22, "#4e6e60");
      }
      flat(ctx, x - 2, -48, 30, 3, RUIN[3], RUIN[4]);
    }
    for (const x of [0, w - 10]) flat(ctx, x, -96, 10, 96, RUIN[1], RUIN[4]);
    flat(ctx, w * 0.44, -40, 20, 40, "#0c0a08", RUIN[4]);
    G.drips(ctx, 0, -95, w, 40, seed + 5, round(w / 12), false);
    G.dirt(ctx, 0, -96, w, 96, seed + 6, 0.3);
  },
};
const watchtower = {
  id: "watchtower",
  box: [-30, -172, 34, 0],
  draw(ctx) {
    for (const [a, b] of [[[-24, 0], [-10, -120]], [[22, 0], [8, -120]], [[-20, -30], [18, -60]], [[18, -30], [-18, -60]], [[-15, -70], [13, -100]]]) {
      line(ctx, [a, b], PLANK[4], 3.4);
      line(ctx, [a, b], PLANK[2], 2);
    }
    flat(ctx, -22, -62, 42, 3, PLANK[2], PLANK[4]);
    flat(ctx, -16, -96, 30, 3, PLANK[2], PLANK[4]);
    flat(ctx, -20, -124, 40, 5, PLANK[3], PLANK[4]);
    planks(ctx, -18, -156, 36, 32, 811, true);
    flat(ctx, -12, -150, 24, 10, "#0a0806", PLANK[4]);
    shape(ctx, [[-24, -156], [0, -170], [24, -156]], PLANK[2], PLANK[4]);
    G.drips(ctx, -18, -124, 36, 10, 812, 3);
  },
};
const storageTank = {
  id: "storageTank",
  box: [-2, -96, 62, 0],
  draw(ctx) {
    cylV(ctx, 2, -64, 56, 60, "rust", 2);
    ctx.fillStyle = color("r2");
    ctx.beginPath();
    ctx.ellipse(30, -64, 28, 14, 0, PI, 0);
    ctx.fill();
    stroke(ctx, "rust");
    if (!simple()) ellipse(ctx, 22, -70, 10, 4, "r3");
    for (const y of [-52, -34, -16]) {
      flat(ctx, 2, y, 56, 1.4, "r0");
      rivets(ctx, 2, y + 2.4, 56, 5, "r3");
    }
    box(ctx, 24, -82, 12, 6, "steel", 2);
    for (let y = -60; y < -6; y += 6) flat(ctx, 48, y, 6, 1.2, "m3");
    flat(ctx, 48, -62, 1.2, 58, "m2");
    flat(ctx, 53, -62, 1.2, 58, "m2");
    box(ctx, -2, -6, 64, 6, "concrete", 1);
    G.grain(ctx, G.rectRegion(ctx, 2, -64, 56, 60), 820);
    G.rustPatch(ctx, 14, -40, 6, 3, 821);
    G.drips(ctx, 2, -60, 56, 40, 822, 5);
    G.dirt(ctx, 2, -64, 56, 60, 823, 0.3);
  },
};
const horizontalTank = {
  id: "horizontalTank",
  box: [-6, -64, 126, 0],
  draw(ctx) {
    for (const x of [22, 86]) {
      box(ctx, x, -18, 12, 18, "steel", 1);
      shape(ctx, [[x - 6, -16], [x + 18, -16], [x + 14, -22], [x - 2, -22]], "m2", "mLine");
    }
    box(ctx, 14, -54, 92, 34, "rust", 2);
    for (const [cx, dir] of [[14, -1], [106, 1]]) {
      ctx.fillStyle = color("r1");
      ctx.beginPath();
      ctx.ellipse(cx, -37, 10, 17, 0, dir < 0 ? PI / 2 : -PI / 2, dir < 0 ? (PI * 3) / 2 : PI / 2);
      ctx.fill();
      stroke(ctx, "rust");
      flat(ctx, cx - 1.5, -56, 3, 38, "r3", "rLine");
    }
    if (!simple()) flat(ctx, 14, -50, 92, 3, "r3");
    for (const x of [30, 56, 82]) flat(ctx, x, -54, 1.4, 34, "r0");
    rivets(ctx, 14, -52, 92, 6, "r3");
    curve(ctx, [[6, -40], [-2, -40], [-2, -30], [6, -26]], "rLine", 4);
    curve(ctx, [[6, -40], [-2, -40], [-2, -30], [6, -26]], "r2", 2.4);
    box(ctx, 52, -62, 14, 8, "steel", 2);
    G.grain(ctx, G.rectRegion(ctx, 14, -54, 92, 34), 830);
    G.rustPatch(ctx, 40, -30, 7, 3, 831);
    G.drips(ctx, 14, -40, 92, 20, 832, 5);
  },
};
const coil = (ctx, x, y, w, n) => {
  for (let i = 0; i < n; i++) {
    box(ctx, x, y + i * 6, w, 5, "chrome", 1);
    if (!simple()) flat(ctx, x + 2, y + i * 6 + 1, w - 4, 1, "c2");
  }
};
const transformer = {
  id: "transformer",
  box: [-4, -148, 220, 0],
  draw(ctx) {
    box(ctx, 0, -100, 120, 100, "olive", 1);
    for (let x = 6; x < 114; x += 22) {
      box(ctx, x, -92, 16, 60, "steel", 2);
      coil(ctx, x + 2, -88, 12, 8);
    }
    flat(ctx, 6, -26, 108, 18, "#141410", "kLine");
    for (let x = 10; x < 110; x += 8) flat(ctx, x, -24, 4, 14, "m2");
    box(ctx, 120, -64, 92, 64, "olive", 2);
    cylV(ctx, 130, -132, 26, 68, "chrome", 1);
    cylV(ctx, 168, -120, 30, 56, "rust", 2);
    for (const y of [-124, -112, -100, -88]) flat(ctx, 130, y, 26, 2, "c0");
    for (let i = 0; i < 4; i++) {
      disc(ctx, 140 + i * 18, -40, 5, "m1", "mLine");
      if (!simple()) disc(ctx, 140 + i * 18, -40, 2, i === 1 ? "screen" : "k3");
    }
    box(ctx, 196, -60, 10, 60, "steel", 1);
    curve(ctx, [[143, -132], [143, -144], [183, -144], [183, -120]], "mLine", 4.5);
    curve(ctx, [[143, -132], [143, -144], [183, -144], [183, -120]], "m2", 3);
    hazard(ctx, 124, -12, 84, 5, 4);
    G.surface(ctx, 0, -100, 120, 100, 840, { drip: 6 });
    G.surface(ctx, 120, -64, 92, 64, 841, { drip: 4 });
    G.grain(ctx, G.rectRegion(ctx, 130, -132, 26, 68), 842);
    G.grain(ctx, G.rectRegion(ctx, 168, -120, 30, 56), 843);
  },
};
const insulator = (ctx, x, y, n) => {
  for (let i = 0; i < n; i++) ellipse(ctx, x, y - i * 4, 5, 1.8, i % 2 ? "c1" : "c0", "mLine");
};
const powerPlant = {
  id: "powerPlant",
  box: [-2, -270, 290, 0],
  draw(ctx) {
    const pipe = (x, top, bottom) => {
      cylV(ctx, x, top, 14, bottom - top, "steel", 2);
      for (let y = top + 12; y < bottom - 12; y += 24) box(ctx, x - 2, y, 18, 5, "olive", 2);
      G.grain(ctx, G.rectRegion(ctx, x, top, 14, bottom - top), 851 + x, 0.7);
    };
    for (const x of [24, 120, 216]) pipe(x, -264, -132);
    box(ctx, 18, -144, 218, 16, "steel", 1);
    if (!simple()) flat(ctx, 20, -142, 214, 2, "m3");
    G.grain(ctx, G.rectRegion(ctx, 18, -144, 218, 16), 855);
    G.drips(ctx, 18, -128, 218, 14, 852, 5);
    pipe(120, -128, -60);
    box(ctx, 0, -60, 288, 60, "olive", 1);
    for (let x = 4; x < 96; x += 18) {
      box(ctx, x, -96, 14, 40, "chrome", 1);
      coil(ctx, x + 1, -92, 12, 5);
    }
    box(ctx, 140, -96, 46, 40, "olive", 2);
    for (let i = 0; i < 4; i++) disc(ctx, 150 + i * 9, -70, 1.8, i % 2 ? "neon" : "k0", "mLine");
    for (let i = 0; i < 3; i++) {
      const x = 196 + i * 14;
      insulator(ctx, x, -60, 7);
      if (!simple()) glow(ctx, x, -92, 8, "plasma", 0.35);
      disc(ctx, x, -90, 2.2, "plasma");
    }
    cylV(ctx, 244, -120, 40, 60, "chrome", 1);
    ctx.fillStyle = color("c1");
    ctx.beginPath();
    ctx.ellipse(264, -120, 20, 8, 0, PI, 0);
    ctx.fill();
    stroke(ctx, "chrome");
    G.grain(ctx, G.rectRegion(ctx, 244, -120, 40, 60), 856);
    for (let i = 0; i < 5; i++) {
      flat(ctx, 8 + i * 56, -40, 40, 22, "#121410", "kLine");
      for (let k = 0; k < 5; k++) flat(ctx, 12 + i * 56 + k * 7, -38, 3, 18, "m2");
    }
    hazard(ctx, 4, -8, 280, 5, 4);
    G.surface(ctx, 0, -60, 288, 60, 850, { drip: 8 });
  },
};
const villageFence = {
  id: "villageFence",
  box: [-3, -52, 147, 1],
  draw(ctx, _state, _t, { w = 144 } = {}) {
    const seed = 860 + round(w);
    flat(ctx, 0, -46, w, 44, "#00000033");
    mesh(ctx, 0, -46, w, 44, "c0", 3);
    flat(ctx, 0, -47, w, 1.4, "m2", "mLine");
    const n = max(1, round(w / 48));
    for (let i = 0; i <= n; i++)
      box(ctx, (w * i) / n - 1.5, -50, 3, 50, "steel", 2, { vertical: true });
    if (w >= 48) {
      const sx = w * 0.3;
      flat(ctx, sx, -38, 14, 8, "k2", "kLine");
      if (!simple())
        for (const y of [-36, -34]) flat(ctx, sx + 2, y, 10, 0.8, "k0");
    }
    G.drips(ctx, 0, -47, w, 12, seed, round(w / 24));
    G.dirt(ctx, 0, -46, w, 46, seed + 1, 0.3);
  },
};
const woodPile = {
  id: "woodPile",
  box: [-2, -28, 58, 0],
  draw(ctx) {
    for (const [x, y, l] of [[0, -6, 52], [3, -12, 46], [6, -18, 40], [12, -24, 26]]) {
      flat(ctx, x, y, l, 6, PLANK[1], PLANK[4]);
      disc(ctx, x + l, y + 3, 3, PLANK[3], PLANK[4]);
      if (!simple()) disc(ctx, x + l, y + 3, 1.2, PLANK[2]);
    }
    G.grain(ctx, G.rectRegion(ctx, 0, -24, 56, 24), 870);
    G.dirt(ctx, 0, -24, 56, 24, 871, 0.4);
  },
};
const sackPile = {
  id: "sackPile",
  box: [-2, -24, 46, 0],
  draw(ctx) {
    const sack = (cx, cy, rx, seed) => {
      shape(ctx, blob(cx, cy, rx, 5.5, seed, 10), "#4a4232", "#14100a");
      if (!simple()) {
        shape(ctx, blob(cx - 1, cy - 1.5, rx * 0.7, 3, seed + 1, 8), "#5e5440");
        line(ctx, [[cx - rx * 0.6, cy + 1], [cx + rx * 0.6, cy + 1.5]], "#2a2418", 0.7);
      }
    };
    sack(10, -5.5, 10, 880);
    sack(30, -5.5, 11, 881);
    sack(20, -15, 10, 882);
    G.grain(ctx, G.rectRegion(ctx, 0, -22, 44, 22), 883);
  },
};
const massTop = {
  id: "massTop",
  box: [0, -9, 120, 4],
  draw(ctx, _state, _t, { w = 120 } = {}) {
    const [vx0, , vx1] = viewSpan(ctx, -6, -10, w + 6, 4);
    const x0 = max(0, floor(vx0 / TILE) * TILE);
    const x1 = min(w, ceil(vx1 / TILE) * TILE);
    if (x1 <= x0) return;
    const r = rng(1100 + floor(x0 / TILE) * 7 + round(w));
    const crust = [[x0, 3]];
    for (let x = x0; x < x1; x += 3 + r() * 4) crust.push([x, -0.5 - r() * 1.8]);
    crust.push([x1, -0.8], [x1, 3]);
    shape(ctx, crust, SOIL[0]);
    for (let x = x0 + r() * 6; x < x1 - 2; x += 5 + r() * 9) {
      const rx = 1.6 + r() * 2.6;
      boulder(ctx, x, -0.6 - rx * 0.4, rx, rx * 0.7, 1101 + round(x));
    }
    if (!simple()) {
      for (let x = x0; x < x1; x += TILE)
        if (hash(floor(x / TILE), 21) < 0.45) tufts(ctx, x + 4, x + 4 + hash(floor(x / TILE), 22) * 14, 0, 1102 + round(x), 2.6);
      G.chips(ctx, x0, 0.4, x1 - x0, 1103 + round(x0));
    }
  },
};
for (const asset of [
  massTop, crateWall, grassyWalkway, walkwayGirder, villageBackdrop, jungleCanopy, ruinWall, rockCliff, bronzePipe, latticeMast, overheadPipeline,
  stiltBuilding, villageHouse, watchtower, storageTank, horizontalTank, transformer, powerPlant, villageFence, woodPile, sackPile,
]) define(asset);

const { poly, text } = P;
const lamp = (ctx, x, y, c, lit = true) => {
  if (lit && !simple()) glow(ctx, x, y, 5, c, 0.6);
  disc(ctx, x, y, 1.4, lit ? c : "k0", "mLine");
};
const bolt = (ctx, x, y0, y1, w, t, seed, k = 1) => {
  const r = rng(floor(t * 18) + seed * 101);
  const n = max(4, round((y1 - y0) / 7));
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push([x + (i === 0 || i === n ? 0 : (r() - 0.5) * w), y0 + ((y1 - y0) * i) / n]);
  line(ctx, pts, "plasma", 2.4 * k);
  line(ctx, pts, "plasmaCore", 0.9 * k);
};
const padPlate = (ctx, w, lit, seed) => {
  box(ctx, 2, -8, w - 4, 8, "steel", 1);
  for (let y = -6.5; y < -1; y += 2.2) flat(ctx, 8, y, w - 16, 1, lit ? "#8ab4c0" : "m3");
  if (lit && !simple()) glow(ctx, w / 2, -6, w * 0.4, "plasma", 0.25);
  hazard(ctx, 2, -2, w - 4, 2, 3);
  G.grain(ctx, G.rectRegion(ctx, 2, -8, w - 4, 8), seed);
};
const emitter = (ctx, cx, y, lit, broken) => {
  poly(ctx, [[cx - 14, y], [cx + 14, y], [cx + 8, y + 12], [cx - 8, y + 12]], "chrome", 1);
  flat(ctx, cx - 8, y + 12, 16, 3, broken ? "k0" : lit ? "plasma" : "m1", "mLine");
  if (lit && !simple()) glow(ctx, cx, y + 16, 14, "plasma", 0.45);
  if (broken) {
    shape(ctx, [[cx + 2, y + 2], [cx + 12, y + 1], [cx + 9, y + 8], [cx + 4, y + 7]], "hole");
    G.rim(ctx, [[cx + 2, y + 2], [cx + 12, y + 1], [cx + 9, y + 8], [cx + 4, y + 7]], 901, "c2", "mLine");
  }
};
const teleporter = (ctx, w, mode, t, seed) => {
  const lit = mode === 2;
  const broken = mode === 0;
  box(ctx, 0, -96, 12, 88, "olive", 1, { vertical: true });
  box(ctx, -4, -104, 20, 10, "olive", 2);
  box(ctx, 10, -100, w * 0.5, 9, "steel", 2);
  rivets(ctx, 10, -95.5, w * 0.5, 6, "m3");
  cylV(ctx, w * 0.5 - 4, -94, 8, 12, "steel", 2);
  emitter(ctx, w * 0.5, -82, lit, broken);
  padPlate(ctx, w, lit, seed);
  flat(ctx, 2, -60, 8, 14, "k0", "kLine");
  lamp(ctx, 6, -56, broken ? "neon" : lit ? "screen" : "y1", broken ? floor(t * 3) % 2 === 0 : true);
  if (!simple())
    for (const y of [-52, -49]) flat(ctx, 3, y, 6, 0.8, "m2");
  if (lit) {
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.15 * sin(t * 7);
    shape(ctx, [[w * 0.5 - 8, -66], [w * 0.5 + 8, -66], [w * 0.5 + 18, -8], [w * 0.5 - 18, -8]], "plasma");
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.8 + i / 4) % 1;
      flat(ctx, w * 0.5 - 12 - k * 4, -10 - k * 52, 24 + k * 8, 0.8, "plasmaCore");
    }
  }
  if (broken) spark(ctx, w * 0.5 + 8, -72, t, seed);
  G.grain(ctx, G.rectRegion(ctx, 0, -96, 12, 88), seed + 1);
  G.grain(ctx, G.rectRegion(ctx, 10, -100, w * 0.5, 9), seed + 3);
  G.drips(ctx, 0, -96, 12, 40, seed + 2, 2);
};
const sourceTeleport = {
  id: "sourceTeleport",
  box: [-6, -108, 100, 2],
  anim: true,
  draw(ctx, state, t) {
    teleporter(ctx, 96, state === 2 ? 2 : state === 0 ? 0 : 1, t, 910);
  },
};
const targetTeleport = {
  id: "targetTeleport",
  box: [-6, -108, 124, 2],
  anim: true,
  draw(ctx, state, t) {
    teleporter(ctx, 120, state === 1 ? 2 : 0, t, 920);
  },
};
const teleportPad = {
  id: "teleportPad",
  box: [-6, -80, 126, 2],
  anim: true,
  draw(ctx, _state, t) {
    for (const x of [0, 108]) {
      box(ctx, x, -64, 12, 60, "steel", 1, { vertical: true });
      box(ctx, x - 2, -70, 16, 8, "olive", 2);
      const k = 0.5 + 0.5 * sin(t * 5 + x);
      if (!simple()) glow(ctx, x + 6, -54, 6 + k * 3, "plasma", 0.4);
      disc(ctx, x + 6, -54, 2, "plasma", "mLine");
      G.grain(ctx, G.rectRegion(ctx, x, -64, 12, 60), 930 + x);
    }
    padPlate(ctx, 120, true, 931);
    if (!simple()) {
      ctx.save();
      ctx.globalAlpha = 0.12 + 0.06 * sin(t * 4);
      flat(ctx, 14, -60, 92, 52, "plasma");
      ctx.restore();
    }
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.6 + i / 3) % 1;
      flat(ctx, 16, -10 - k * 46, 88, 0.7, "plasmaCore");
    }
  },
};
const brokenTeleport = {
  id: "brokenTeleport",
  box: [-4, -70, 148, 2],
  anim: true,
  draw(ctx, state, t) {
    box(ctx, 4, -8, 136, 8, "steel", 1);
    for (let y = -6.5; y < -1; y += 2.2) flat(ctx, 12, y, 120, 1, "m1");
    const shell = [[30, -8], [26, -40], [38, -54], [52, -46], [60, -58], [76, -50], [90, -58], [104, -42], [112, -8]];
    shape(ctx, shell, "m1", "mLine");
    shape(ctx, [[40, -8], [38, -34], [52, -40], [70, -36], [92, -42], [100, -8]], "hole");
    G.scorch(ctx, [[40, -12], [38, -34], [52, -40], [70, -36], [92, -42], [100, -12]], 941);
    G.rim(ctx, [[40, -8], [38, -34], [52, -40], [70, -36], [92, -42], [100, -8]], 942, "c2", "mLine");
    for (const [x, y, a] of [[20, -4, 0.4], [118, -3, -0.3], [128, -5, 0.8]]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      flat(ctx, -6, -2, 12, 3, "m2", "mLine");
      ctx.restore();
    }
    if (state === 0) {
      flat(ctx, 58, -24, 22, 14, "#1e5a2a", "gLine");
      if (!simple())
        for (let i = 0; i < 4; i++) flat(ctx, 60 + i * 5, -22, 3, 2, "y2");
      line(ctx, [[60, -14], [66, -18], [76, -16]], "y1", 0.7);
    }
    spark(ctx, 50, -34, t, 4);
    if (!simple()) smoke(ctx, 76, -30, t, 2, 18);
    G.grain(ctx, G.polyRegion(ctx, shell), 943);
  },
};
const fuseBox = {
  id: "fuseBox",
  box: [-4, -100, 124, 0],
  anim: true,
  draw(ctx, state, t) {
    concreteBlock(ctx, 0, -96, 22, 96, 950);
    concreteBlock(ctx, 98, -96, 22, 96, 951);
    concreteBlock(ctx, 0, -100, 120, 14, 952);
    flat(ctx, 22, -86, 76, 86, "#121410", "kLine");
    for (const y of [-70, -40]) {
      flat(ctx, 22, y, 76, 6, RUIN[2], RUIN[4]);
      if (!simple()) flat(ctx, 24, y + 1.5, 72, 1.5, "#6a5a2a");
    }
    box(ctx, 48, -66, 24, 44, "green", 1);
    flat(ctx, 51, -62, 18, 9, state === 1 ? "#141a14" : "#0a140a", "gLine");
    const on = state !== 1;
    if (on) {
      const k = floor(t * 2) % 2;
      for (let i = 0; i < 3; i++) text(ctx, "8", 54 + i * 6, -57.5, 7, k && i === 1 ? "screenOff" : "screen");
    }
    else {
      line(ctx, [[52, -61], [58, -55], [55, -59], [66, -54]], "c2", 0.6);
    }
    flat(ctx, 54, -48, 12, 20, "k0", "kLine");
    if (state === 2) {
      box(ctx, 57, -46, 6, 16, "chrome", 2);
      flat(ctx, 57, -40, 6, 3, "y2");
    }
    else if (state === 1) {
      shape(ctx, [[55, -46], [64, -44], [62, -32], [56, -31]], "hole");
      spark(ctx, 60, -40, t, 2);
    }
    if (!simple())
      for (const x of [26, 86])
        for (let y = -32; y < -8; y += 4) flat(ctx, x, y, 8, 2, "m2");
    G.drips(ctx, 0, -86, 120, 30, 953, 6, false);
    G.dirt(ctx, 0, -100, 120, 100, 954, 0.25);
  },
};
const electricCabinet = {
  id: "electricCabinet",
  box: [-4, -80, 124, 0],
  draw(ctx, state) {
    for (const x of [0, 96]) {
      box(ctx, x, -48, 24, 48, "steel", 1);
      for (let k = 0; k < 4; k++) flat(ctx, x + 3 + k * 5.5, -44, 3, 40, "c0", "mLine");
    }
    box(ctx, 24, -72, 72, 72, "steel", 2);
    flat(ctx, 24, -72, 72, 8, "k2", "kLine");
    if (!simple()) {
      line(ctx, [[30, -70], [34, -66], [38, -70], [42, -65]], "#6ab4e8", 1.2);
      line(ctx, [[80, -70], [84, -65], [88, -69]], "#6ab4e8", 1.2);
    }
    if (state === 1) {
      flat(ctx, 30, -62, 60, 58, "#0a0c0c", "mLine");
      for (const y of [-54, -40, -26]) flat(ctx, 34, y, 52, 2, "m2");
      flat(ctx, 54, -48, 12, 16, "k0", "kLine");
      poly(ctx, [[30, -62], [18, -58], [18, -6], [30, -4]], "steel", 3);
      poly(ctx, [[90, -62], [102, -58], [102, -6], [90, -4]], "steel", 1);
    }
    else {
      flat(ctx, 30, -62, 29, 58, "m2", "mLine");
      flat(ctx, 61, -62, 29, 58, "m2", "mLine");
      flat(ctx, 50, -44, 20, 20, "#1c3a2a", "gLine");
      shape(ctx, [[61, -41], [55, -33], [60, -33], [57, -27], [65, -36], [60, -36], [63, -41]], "y2");
      box(ctx, 57, -22, 6, 8, "chrome", 2);
      ctx.beginPath();
      ctx.arc(60, -22, 2.6, PI, 0);
      stroke(ctx, "c2", 1.6);
    }
    rivets(ctx, 24, -68, 72, 8, "m3");
    G.surface(ctx, 24, -72, 72, 72, 960, { drip: 4 });
    G.rustPatch(ctx, 36, -10, 4, 2, 961);
  },
};
const cannon = {
  id: "cannon",
  box: [-30, -80, 196, 0],
  anim: true,
  draw(ctx, state, t) {
    shadow(ctx, 96, 160, 0.5);
    poly(ctx, [[40, 0], [60, -30], [150, -30], [176, 0]], "steel", 1);
    for (const x of [64, 100, 136]) disc(ctx, x, -10, 9, "m1", "mLine");
    if (!simple())
      for (const x of [64, 100, 136]) disc(ctx, x, -10, 3, "m3");
    box(ctx, 70, -56, 90, 28, "steel", 2);
    poly(ctx, [[86, -56], [96, -72], [146, -72], [160, -56]], "steel", 3);
    box(ctx, 0, -50, 74, 12, "chrome", 1);
    box(ctx, -6, -52, 12, 16, "steel", 1);
    for (const x of [24, 48]) flat(ctx, x, -50, 3, 12, "c0");
    box(ctx, 150, -46, 30, 16, "olive", 1);
    hazard(ctx, 72, -34, 86, 5, 4);
    flat(ctx, 112, -66, 22, 6, "#0c0e0e", "mLine");
    rivets(ctx, 70, -53, 90, 7, "m3");
    if (state === 1) {
      const k = (t * 3) % 1;
      if (k < 0.45) {
        const s = 1 - k / 0.45;
        if (!simple()) glow(ctx, -18, -44, 30 * s + 10, "a2", 0.7);
        poly(ctx, [[-6, -54], [-30 - 20 * s, -62], [-18, -48], [-44 - 26 * s, -44], [-18, -40], [-30 - 20 * s, -26], [-6, -34]], "a1", 2, { line: false });
        poly(ctx, [[-6, -49], [-22 - 16 * s, -44], [-6, -39]], "y3", 2, { line: false });
      }
      smoke(ctx, -10, -50, t, 3, 26);
    }
    G.grain(ctx, G.rectRegion(ctx, 70, -56, 90, 28), 970);
    G.grain(ctx, G.rectRegion(ctx, 0, -50, 74, 12), 973);
    G.grain(ctx, G.polyRegion(ctx, [[40, 0], [60, -30], [150, -30], [176, 0]]), 974);
    G.drips(ctx, 70, -56, 90, 20, 971, 6);
    G.rustPatch(ctx, 120, -40, 6, 3, 972);
  },
};
const ammoDepot = {
  id: "ammoDepot",
  box: [-2, -66, 146, 0],
  anim: true,
  draw(ctx, _state, t, { w = 144 } = {}) {
    const n = max(1, floor(w / 48));
    for (let i = 0; i < n; i++) {
      const x = i * 48;
      flat(ctx, x + 2, -22, 20, 10, "#22261c", "kLine");
      flat(ctx, x + 4, -20, 16, 6, "#141610", "kLine");
      if (!simple()) text(ctx, "AMMO", x + 12, -17, 4, "#6a6a52");
      for (const k of [0, 1]) {
        flat(ctx, x + 3 + k * 9, -10, 8, 10, "#2c3024", "kLine");
        ellipse(ctx, x + 7 + k * 9, -10, 4, 1.4, "#5a4a1e");
      }
      concreteBlock(ctx, x + 24, -44, 22, 44, 980 + i);
      flat(ctx, x + 22, -50, 26, 6, "k1", "kLine");
      for (let k = 0; k < 2; k++) flame(ctx, x + 24 + k * 11, -50, 11, 16, t, i * 3 + k);
      G.drips(ctx, x + 24, -44, 22, 18, 985 + i, 2);
    }
    G.dirt(ctx, 0, -50, w, 50, 989, 0.3);
  },
};
const fireBarricade = {
  id: "fireBarricade",
  box: [-14, -150, 62, 0],
  anim: true,
  draw(ctx, state, t) {
    if (state === 1) {
      const heap = [[-10, 0], [-6, -10], [4, -16], [16, -12], [28, -20], [40, -10], [48, 0]];
      G.scorch(ctx, heap, 991);
      shape(ctx, heap, "k1", "kLine");
      for (let i = 0; i < 5; i++) boulder(ctx, -4 + i * 11, -5 - (i % 2) * 4, 6, 4, 992 + i);
      smoke(ctx, 18, -14, t, 3, 30);
      return;
    }
    const plates = [[0, -120, 24, 120, "steel"], [24, -96, 22, 96, "rust"], [-10, -70, 14, 70, "rust"]];
    for (const [x, y, w, h, m] of plates) {
      box(ctx, x, y, w, h, m, 1, { vertical: true });
      rivets(ctx, x, y + 4, w, 6, m === "rust" ? "r3" : "m3");
    }
    for (let y = -110; y < -6; y += 22) {
      line(ctx, [[0, y], [24, y + 14]], "mLine", 2.6);
      line(ctx, [[0, y], [24, y + 14]], "m3", 1.2);
    }
    for (const [x, y, a] of [[-6, -122, -0.5], [12, -126, 0.1], [30, -100, 0.6]]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      poly(ctx, [[-2, 0], [0, -12], [2, 0]], "steel", 3);
      ctx.restore();
    }
    cylV(ctx, 4, -132, 16, 12, "rust", 1);
    flame(ctx, 2, -132, 20, 20, t, 3);
    hazard(ctx, 0, -60, 24, 6, 4);
    for (const [x, y, w, h] of plates) G.grain(ctx, G.rectRegion(ctx, x, y, w, h), 993 + x);
    G.drips(ctx, -10, -120, 56, 50, 994, 6);
    G.rustPatch(ctx, 34, -40, 5, 3, 995);
  },
};
const dynamiteWall = {
  id: "dynamiteWall",
  box: [-4, -124, 28, 0],
  draw(ctx, state) {
    box(ctx, 0, -120, 24, 120, "steel", 1, { vertical: true });
    flat(ctx, 3, -112, 18, 70, "m1", "mLine");
    for (let y = -40; y < 0; y += 6) flat(ctx, 2, y, 20, 2.4, "m3", "mLine");
    for (const y of [-118, -6]) box(ctx, -2, y, 28, 4, "steel", 2);
    rivets(ctx, 0, -116, 24, 5, "m3");
    hazard(ctx, 3, -46, 18, 4, 3);
    if (state === 1) {
      for (let i = 0; i < 4; i++)
        box(ctx, 5 + i * 3.6, -86, 3.2, 20, "armor", 0, { vertical: true });
      flat(ctx, 4, -80, 16, 2, "k0");
      curve(ctx, [[12, -66], [16, -58], [10, -48], [18, -36]], "y1", 0.8);
      box(ctx, 14, -40, 6, 4, "concrete", 1);
    }
    G.surface(ctx, 0, -120, 24, 120, 1000, { drip: 3 });
  },
};
const energyBarrier = {
  id: "energyBarrier",
  box: [-14, -156, 132, 2],
  anim: true,
  draw(ctx, state, t) {
    box(ctx, 96, -150, 14, 150, "steel", 1, { vertical: true });
    box(ctx, 0, -150, 110, 12, "steel", 2);
    line(ctx, [[60, -138], [96, -100]], "mLine", 4);
    line(ctx, [[60, -138], [96, -100]], "m2", 2.4);
    rivets(ctx, 0, -144, 110, 8, "m3");
    box(ctx, 2, -138, 20, 14, "chrome", 1);
    box(ctx, -2, -6, 28, 6, "steel", 1);
    const on = state === 0;
    for (const y of [-124, -6]) {
      flat(ctx, 6, y, 12, 3, on ? "plasma" : "m1", "mLine");
      if (on && !simple()) glow(ctx, 12, y + 1, 12, "plasma", 0.5);
    }
    if (on)
      for (let k = 0; k < 2; k++) bolt(ctx, 12, -121, -6, 10, t, k, 1 - k * 0.4);
    lamp(ctx, 103, -140, on ? "neon" : "k2", on);
    hazard(ctx, 96, -20, 14, 6, 3);
    G.grain(ctx, G.rectRegion(ctx, 96, -150, 14, 150), 1010, 0.6);
    G.grain(ctx, G.rectRegion(ctx, 0, -150, 110, 12), 1012, 0.6);
    G.drips(ctx, 0, -138, 110, 20, 1011, 5);
  },
};
const powerBridge = {
  id: "powerBridge",
  box: [-4, -12, 292, 14],
  anim: true,
  draw(ctx, state, t) {
    if (state === 1) {
      for (const [x, d] of [[0, 1], [288, -1]]) {
        flat(ctx, min(x, x + d * 22), 0, 22, 4, "c0", "mLine");
        line(ctx, [[x + d * 22, 2], [x + d * 30, 10]], "m2", 1.4);
        spark(ctx, x + d * 22, 2, t, x);
      }
      return;
    }
    flat(ctx, 0, 0, 288, 3.6, "c0", "mLine");
    flat(ctx, 0, 0, 288, 1, "c2");
    for (let x = 6; x < 288; x += 12) line(ctx, [[x, 3.6], [x + 6, 9], [x + 12, 3.6]], "m2", 0.8);
    flat(ctx, 0, 9, 288, 1.4, "m1", "mLine");
    const k = (t * 1.4) % 1;
    if (!simple()) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      flat(ctx, 0, 1.2, 288, 1, "plasma");
      ctx.restore();
      glow(ctx, k * 288, 2, 10, "plasma", 0.6);
    }
    for (const x of [0, 280]) box(ctx, x, -4, 8, 14, "steel", 2);
  },
};
const bridgeGuardPost = {
  id: "bridgeGuardPost",
  box: [-54, -152, 30, 0],
  anim: true,
  draw(ctx, state, t) {
    planks(ctx, -2, -144, 26, 144, 1020, true);
    flat(ctx, 2, -128, 18, 14, "#0a0806", PLANK[4]);
    shape(ctx, [[-6, -144], [11, -152], [28, -144]], PLANK[2], PLANK[4]);
    flat(ctx, -4, -146, 30, 3, PLANK[3], PLANK[4]);
    box(ctx, -6, -40, 8, 40, "steel", 1, { vertical: true });
    const up = state === 1;
    ctx.save();
    ctx.translate(-2, -34);
    ctx.rotate(up ? -PI / 2.2 : 0);
    flat(ctx, -46, -2.5, 46, 5, "k3", "kLine");
    for (let x = -42; x < -2; x += 10) flat(ctx, x, -2.5, 5, 5, "neon");
    ctx.restore();
    lamp(ctx, 11, -136, up ? "screen" : "neon", up || floor(t * 2) % 2 === 0);
    flat(ctx, 2, -100, 18, 10, "y1", "yLine");
    if (!simple()) text(ctx, "STOP", 11, -95, 5, "k0");
    G.drips(ctx, -2, -144, 26, 60, 1021, 3);
  },
};
const smoulderingRemains = {
  id: "smoulderingRemains",
  box: [-4, -40, 52, 0],
  anim: true,
  draw(ctx, state, t) {
    shadow(ctx, 24, 46, 0.5);
    const burnt = ["#1c1a18", "#34302c", "#4e4842", "#6e665c"];
    shape(ctx, [[0, 0], [4, -8], [14, -12], [24, -10], [36, -14], [46, -6], [48, 0]], burnt[1], "kLine");
    shape(ctx, blob(14, -14, 8, 5, 1030, 9), burnt[2], "kLine");
    disc(ctx, 12, -15, 1.6, state === 0 ? "a1" : "k0");
    line(ctx, [[22, -10], [32, -20], [40, -18]], burnt[3], 2);
    for (const x of [6, 18, 30, 40]) flat(ctx, x, -6, 4, 2, burnt[0]);
    if (state === 0) {
      if (!simple()) glow(ctx, 30, -6, 8, "y3", 0.3 + 0.2 * sin(t * 4));
      flat(ctx, 28, -7, 5, 1.6, "y2");
    }
    for (let i = 0; i < 3; i++) {
      const g = 0.5 + 0.5 * sin(t * 6 + i * 2);
      disc(ctx, 8 + i * 13, -3, 1.2, g > 0.5 ? "a1" : "a0");
    }
    smoke(ctx, 20, -12, t, 3, 26);
    G.grain(ctx, G.rectRegion(ctx, 0, -20, 48, 20), 1031);
  },
};
const itemBox = (ctx, w, h, mat) => {
  shadow(ctx, 0, w + 2, 0.4);
  box(ctx, -w / 2, -h, w, h, mat, 2);
};
const item = (id, box0, draw, anim = false) => ({
  id,
  box: box0,
  anim,
  draw(ctx, state, t) {
    if (state === 0) draw(ctx, t);
  },
});
const smallKey = item("smallKey", [-8, -6, 8, 1], (ctx) => {
  shadow(ctx, 0, 12, 0.35);
  ctx.beginPath();
  ctx.arc(-4, -2.6, 2.4, 0, PI * 2);
  stroke(ctx, "y2", 1.6);
  flat(ctx, -1.6, -3.2, 8, 1.4, "y2", "yLine");
  flat(ctx, 3.6, -1.8, 1.2, 1.6, "y2");
  flat(ctx, 5.4, -1.8, 1.2, 1.2, "y2");
});
const walkieTalkie = item("walkieTalkie", [-6, -20, 6, 1], (ctx) => {
  itemBox(ctx, 8, 13, "olive");
  flat(ctx, 2, -19, 1.2, 6, "k0");
  flat(ctx, -2.8, -11.5, 5.6, 3, "screenOff", "gLine");
  for (const y of [-7, -5, -3]) flat(ctx, -2.5, y, 5, 0.8, "o0");
});
const detonator = item("detonator", [-9, -18, 9, 1], (ctx) => {
  itemBox(ctx, 14, 8, "olive");
  flat(ctx, -0.8, -16, 1.6, 8, "c1", "mLine");
  flat(ctx, -4, -17, 8, 2, "neon", "mLine");
  flat(ctx, 3, -6, 2, 2, "neon");
});
const projectileCrate = item("projectileCrate", [-14, -18, 14, 1], (ctx) => {
  itemBox(ctx, 26, 16, "olive");
  flat(ctx, -13, -9, 26, 1.4, "o0");
  hazard(ctx, -10, -14, 8, 3, 2);
  if (!simple()) text(ctx, "AMMO", 5, -12.5, 3.4, "k0");
  G.grain(ctx, G.rectRegion(ctx, -13, -16, 26, 16), 1040);
});
const projectile = item("projectile", [-12, -8, 14, 1], (ctx) => {
  shadow(ctx, 0, 22, 0.35);
  cylV(ctx, -10, -6, 16, 6, "olive", 2);
  poly(ctx, [[6, -6], [12, -3], [6, 0]], "chrome", 2);
  flat(ctx, -10, -6, 3, 6, "y1", "yLine");
});
const fuse = item("fuse", [-6, -6, 6, 1], (ctx) => {
  shadow(ctx, 0, 10, 0.35);
  box(ctx, -3, -4, 6, 4, "concrete", 3);
  for (const x of [-5, 3]) flat(ctx, x, -3.5, 2, 3, "c1", "mLine");
  flat(ctx, -1, -4, 2, 4, "neon");
});
const dynamite = {
  id: "dynamite",
  box: [-10, -12, 10, 1],
  draw(ctx, state) {
    if (state === 1) return;
    shadow(ctx, 0, 16, 0.35);
    for (let i = 0; i < 3; i++)
      box(ctx, -7 + i * 4.6, -9, 4.2, 9, "armor", 0, { vertical: true });
    flat(ctx, -7.5, -6, 14.6, 1.8, "k0");
    curve(ctx, [[0, -9], [2, -12], [5, -11]], "y1", 0.6);
  },
};
const navCircuit = item("navCircuit", [-9, -6, 9, 1], (ctx) => {
  shadow(ctx, 0, 16, 0.35);
  flat(ctx, -8, -4, 16, 4, "#1e5a2a", "gLine");
  if (!simple())
    for (let i = 0; i < 4; i++) flat(ctx, -6 + i * 3.6, -3.2, 2, 1.4, "y2");
  flat(ctx, -8, -1.2, 16, 1.2, "c0");
});
const toaster = item("toaster", [-14, -12, 14, 1], (ctx) => {
  shadow(ctx, 0, 24, 0.4);
  box(ctx, -12, -8, 18, 7, "steel", 2);
  box(ctx, 4, -7, 10, 4, "chrome", 1);
  flat(ctx, -6, -11, 8, 3, "m1", "mLine");
  flat(ctx, -10, -1, 4, 1, "m0");
  for (let x = -10; x < 4; x += 3) flat(ctx, x, -6, 1.4, 3, "a1");
});
const energyPickup = item("energyPickup", [-7, -16, 7, 1], (ctx, t) => {
  shadow(ctx, 0, 12, 0.4);
  box(ctx, -5, -13, 10, 13, "steel", 2);
  flat(ctx, -2, -15, 4, 2, "c1", "mLine");
  const k = 0.5 + 0.5 * sin(t * 4);
  flat(ctx, -3, -11, 6, 9, "screenOff");
  flat(ctx, -3, -2 - 9 * (0.6 + 0.4 * k), 6, 9 * (0.6 + 0.4 * k), "screen");
}, true);
const ammoPickup = item("ammoPickup", [-10, -12, 10, 1], (ctx) => {
  itemBox(ctx, 18, 10, "olive");
  for (let i = 0; i < 4; i++) {
    cylV(ctx, -7 + i * 4, -15, 3, 6, "yellow", 1);
    flat(ctx, -7 + i * 4, -15, 3, 1.4, "a0");
  }
});
const shieldPickup = item("shieldPickup", [-8, -18, 8, 1], (ctx, t) => {
  shadow(ctx, 0, 12, 0.4);
  const pts = [[-6, -16], [6, -16], [6, -8], [0, -1], [-6, -8]];
  if (!simple()) glow(ctx, 0, -9, 10, "plasma", 0.25 + 0.15 * sin(t * 3));
  shape(ctx, pts, "e1", "mLine");
  shape(ctx, [[-3.5, -13.5], [3.5, -13.5], [3.5, -8.5], [0, -4.5], [-3.5, -8.5]], "e2");
}, true);
for (const asset of [
  sourceTeleport, targetTeleport, teleportPad, brokenTeleport, fuseBox, electricCabinet, cannon, ammoDepot, fireBarricade, dynamiteWall, energyBarrier,
  powerBridge, bridgeGuardPost, smoulderingRemains, smallKey, walkieTalkie, detonator, projectileCrate, projectile, fuse, dynamite, navCircuit, toaster,
  energyPickup, ammoPickup, shieldPickup,
]) define(asset);

const GUARD_PAL = {
  a0: "#3a3418", a1: "#5c5428", a2: "#7e7440", a3: "#b0a468", aLine: "#141008",
  m0: "#1c2018", m1: "#30362a", m2: "#4a5040", m3: "#6e7460", mLine: "#0a0c08",
  c0: "#5a5c50", c1: "#8a8c7c", c2: "#b4b4a2", c3: "#e0e0cc",
  badge: "#7e7440", trefoil: "#141008", visor: "#e0281e", screen: "#3fa34a", hole: "#120e08"
};
const GUARD_H = 60;
const GUARD_WIDE = 1.18;
const GUARD_POSE = { hipNear: -14, kneeNear: 18, ankleNear: -4, hipFar: 12, kneeFar: 6, ankleFar: -16, body: 3 };
const RIFLE_SUPPORT = [40, -14];
const RIFLE_MUZZLE = [262, -44];
const guardRigs = {};
let rifleModel = null;

function rifleParts() {
  return [
    { name: "stock", x: -96, y: -60, w: 70, h: 30, mat: "m", tone: 1 },
    { name: "grip", x: -14, y: -24, w: 22, h: 50, mat: "m", tone: 0 },
    { name: "receiver", x: -40, y: -66, w: 130, h: 40, mat: "m", tone: 2 },
    { name: "mag", x: 30, y: -30, w: 26, h: 54, mat: "m", tone: 0 },
    { name: "scope", x: -10, y: -88, w: 70, h: 18, mat: "c", tone: 1 },
    { name: "barrel", x: 90, y: -56, w: 160, h: 18, mat: "c", tone: 1 },
    { name: "guard", x: 90, y: -62, w: 70, h: 30, mat: "m", tone: 1 },
    { name: "brake", x: 240, y: -60, w: 22, h: 26, mat: "m", tone: 0 }
  ];
}

function guardRig() {
  const key = simple() ? "lod" : "full";
  if (guardRigs[key]) return guardRigs[key];
  const { buildSide, locate, solve } = window.XBOT;
  rifleModel ||= window.GUN.model({ buildParts: rifleParts });
  const root = buildSide({ enemy: true, lod: simple(), farLimbs: true });
  const carry = { ...GUARD_POSE, arm: -8, fore: -76 };
  const grip = window.GUN.toHook(RIFLE_SUPPORT);
  const far = solve(root, "handFar", carry, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], locate(root, "hand", carry).transformPoint(new DOMPoint(...grip)));
  return (guardRigs[key] = { root, pose: { ...carry, ...far } });
}

function muzzleFlash(ctx, x, y, k) {
  if (!simple()) glow(ctx, x + 20, y, 70 * k + 20, "a2", 0.7);
  poly(ctx, [[x, y - 14], [x + 50 * k + 20, y - 26], [x + 30, y - 6], [x + 80 * k + 30, y], [x + 30, y + 6], [x + 50 * k + 20, y + 26], [x, y + 14]], "a1", 2, { line: false });
  poly(ctx, [[x, y - 8], [x + 40 * k + 14, y], [x, y + 8]], "y3", 2, { line: false });
}

function backpack(ctx) {
  ctx.save();
  ctx.transform(0, 1, -1, 0, 0, 0);
  box(ctx, -40, -10, 150, 80, "olive", 1);
  box(ctx, -30, 60, 130, 24, "olive", 0);
  ctx.restore();
}

function guardFigure(ctx, fire, tint) {
  const { root, pose } = guardRig();
  const { render, FOOT_Y, SIDE_AX, shade } = window.XBOT;
  const k = GUARD_H / (FOOT_Y - 2);
  const pal = tint ? shade(GUARD_PAL, tint) : GUARD_PAL;
  ctx.save();
  ctx.scale(k * GUARD_WIDE, k);
  ctx.translate(-SIDE_AX, -FOOT_Y);
  const t = ctx.getTransform();
  const lineW = P.lw(ctx) * Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
  const hand = c => {
    c.save();
    c.transform(0, 1, -1, 0, 0, 0);
    rifleModel.draw(c, { pal, lineW, simple: simple() });
    if (fire >= 0) {
      c.translate(RIFLE_MUZZLE[0], RIFLE_MUZZLE[1]);
      c.scale(1.6, 1.6);
      muzzleFlash(c, 0, 0, fire);
    }
    c.restore();
  };
  render(ctx, root, { pal, pose, hooks: { hand, back: backpack }, lineW, simple: simple() });
  ctx.restore();
}

define({
  id: "bridgeGuard",
  box: [-30, -64, 60, 0],
  anim: true,
  draw(ctx, state, t) {
    shadow(ctx, 0, 34, 0.45);
    if (state === 2) {
      ctx.save();
      ctx.translate(30, -9);
      ctx.rotate(-PI / 2);
      guardFigure(ctx, -1, { brightness: 0.55, saturate: 0.5 });
      ctx.restore();
      if (!simple()) {
        smoke(ctx, -4, -10, t, 3, 24);
        spark(ctx, 6, -6, t, 4);
      }
      return;
    }
    const ph = (t * 4) % 1;
    guardFigure(ctx, state === 1 && ph < 0.4 ? 1 - ph / 0.4 : -1);
  }
});
})();
