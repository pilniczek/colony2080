(() => {
const TILE = 24;

const PALETTE = {
  r0: "#24160c", r1: "#4e3218", r2: "#7c5228", r3: "#b88648", rLine: "#0e0804",
  k0: "#2e2820", k1: "#5a5040", k2: "#867a62", k3: "#bcb092", kLine: "#100e0a",
  b0: "#3a1c12", b1: "#6a3420", b2: "#94502e", b3: "#c27c4e", bLine: "#140a06",
  m0: "#142427", m1: "#25393d", m2: "#3c5458", m3: "#6f878b", mLine: "#070d0e",
  c0: "#5d686c", c1: "#a3adb1", c2: "#d4dbdd", c3: "#ffffff",
  g0: "#1a2a18", g1: "#2e4a2a", g2: "#4c7040", g3: "#86a86a", gLine: "#080e08",
  a0: "#8c3c0c", a1: "#e2701a", a2: "#f5973a", a3: "#ffd2a0", aLine: "#3a1806",
  y0: "#6a5208", y1: "#c8a018", y2: "#e8c21a", y3: "#fff08a", yLine: "#2a2004",
  hazard: "#e8c21a", hazardDark: "#141414", hole: "#0c0806", glass: "#1c2a30",
  neon: "#ff3a2a", neonGlow: "#ff7a50", screen: "#3fa34a", screenOff: "#16301a",
  blood: "#5a0a08", acid: "#7ed43a", acidDark: "#2e6a12", water: "#3a7aa0", plasma: "#7ae0ff", plasmaCore: "#ffffff",
  o0: "#5c4c1e", o1: "#7b6834", o2: "#9a854c", o3: "#c0ab6d",
  den0: "#141a52", den1: "#2433a0", den2: "#3f5ad8", den3: "#7c92f0",
  jac0: "#232a22", jac1: "#414b3c", jac2: "#646f5a", jac3: "#8c967c",
  skin0: "#5a2e16", skin1: "#9a5a32", skin2: "#c98a5a", skin3: "#e8b88a",
  hair0: "#120c08", hair1: "#2a1a10", hair2: "#46301e", hair3: "#5e4630",
  boot0: "#110e0c", boot1: "#262019", boot2: "#3e352a", boot3: "#5a4e3e",
  sky0: "#2a1008", sky1: "#5a2a14", sky2: "#8a4a28", sky3: "#b8744a", skyline: "#0e0a08", skyline2: "#1e1410",
  sh0: "#0c2416", sh1: "#1c3c28", sh2: "#2c5036", sh3: "#46684a", shLine: "#060e0a"
};

const MAT = {
  rust: ["r0", "r1", "r2", "r3", "rLine"],
  concrete: ["k0", "k1", "k2", "k3", "kLine"],
  brick: ["b0", "b1", "b2", "b3", "bLine"],
  steel: ["m0", "m1", "m2", "m3", "mLine"],
  chrome: ["c0", "c1", "c2", "c3", "mLine"],
  green: ["g0", "g1", "g2", "g3", "gLine"],
  armor: ["a0", "a1", "a2", "a3", "aLine"],
  yellow: ["y0", "y1", "y2", "y3", "yLine"],
  olive: ["o0", "o1", "o2", "o3", "kLine"],
  denim: ["den0", "den1", "den2", "den3", "kLine"],
  jacket: ["jac0", "jac1", "jac2", "jac3", "kLine"],
  skin: ["skin0", "skin1", "skin2", "skin3", "kLine"],
  hair: ["hair0", "hair1", "hair2", "hair3", "kLine"],
  boot: ["boot0", "boot1", "boot2", "boot3", "kLine"],
  ship: ["sh0", "sh1", "sh2", "sh3", "shLine"]
};

let pal = PALETTE;
let lineW = 1;
let simple = false;

function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function path(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.closePath();
}

function color(c) {
  return pal[c] || c;
}

const HEX = /^#[0-9a-f]{6}$/i;
const SHADES_KEPT = 64;

function shadeHex(hex, { brightness, saturate: s }) {
  if (!HEX.test(hex)) return hex;
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) * brightness);
  return "#" + [
    (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b,
    (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b,
    (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b
  ].map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
}

const shadedPalettes = new WeakMap();

function shadePalette(base, shade) {
  const key = `${shade.brightness} ${shade.saturate}`;
  let known = shadedPalettes.get(base);
  if (!known || known.size > SHADES_KEPT) shadedPalettes.set(base, known = new Map());
  let shaded = known.get(key);
  if (!shaded) known.set(key, shaded = Object.fromEntries(Object.entries(base).map(([name, c]) => [name, shadeHex(c, shade)])));
  return shaded;
}

function inShade(shade, draw) {
  const base = pal;
  pal = shadePalette(base, shade);
  try {
    draw();
  } finally {
    pal = base;
  }
}

function lw(ctx, k = 1) {
  const t = ctx.getTransform();
  return lineW * k / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
}

function tones(mat) {
  return MAT[mat].map(k => pal[k]);
}

function bands(ctx, mat, tone, x0, y0, x1, y1) {
  const [c0, c1, c2, c3] = tones(mat);
  const t = [c0, c1, c2, c3];
  const top = t[Math.min(3, tone + 1)], mid = t[tone], low = t[Math.max(0, tone - 1)];
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  const stops = simple
    ? [[0, top], [0.25, top], [0.25, mid], [0.75, mid], [0.75, low], [1, low]]
    : [[0, top], [0.22, top], [0.22, mid], [0.72, mid], [0.72, low], [1, low]];
  for (const [at, c] of stops) g.addColorStop(at, c);
  return g;
}

function stroke(ctx, mat, k = 1) {
  if (!lineW) return;
  ctx.strokeStyle = pal[MAT[mat]?.[4]] || pal[mat] || mat;
  ctx.lineJoin = "round";
  ctx.lineWidth = lw(ctx, k);
  ctx.stroke();
}

function box(ctx, x, y, w, h, mat, tone = 2, { vertical = false, line = true } = {}) {
  ctx.fillStyle = vertical ? bands(ctx, mat, tone, x, 0, x + w, 0) : bands(ctx, mat, tone, 0, y, 0, y + h);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  if (line) stroke(ctx, mat);
}

function flat(ctx, x, y, w, h, color, line = null) {
  ctx.fillStyle = pal[color] || color;
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  if (line) stroke(ctx, line);
}

function poly(ctx, pts, mat, tone = 2, { dir = [0, 1], line = true } = {}) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  ctx.fillStyle = MAT[mat]
    ? bands(ctx, mat, tone, dir[0] ? x0 : 0, dir[1] ? y0 : 0, dir[0] ? x1 : 0, dir[1] ? y1 : 0)
    : pal[mat] || mat;
  path(ctx, pts);
  ctx.fill();
  if (line) stroke(ctx, MAT[mat] ? mat : "mLine");
}

function cylV(ctx, x, y, w, h, mat, tone = 2) {
  box(ctx, x, y, w, h, mat, tone, { vertical: true });
}

function cylH(ctx, x, y, w, h, mat, tone = 2) {
  box(ctx, x, y, w, h, mat, tone);
}

function disc(ctx, cx, cy, r, color, line = null) {
  ctx.fillStyle = pal[color] || color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  if (line) stroke(ctx, line);
}

function rivets(ctx, x, y, w, step, color = "r3") {
  if (simple) return;
  for (let i = x + step / 2; i < x + w; i += step) flat(ctx, i - 0.75, y - 0.75, 1.5, 1.5, color);
}

function hazard(ctx, x, y, w, h, step = 6, { fill = "hazard", dark = "hazardDark", line = "yLine" } = {}) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  flat(ctx, x, y, w, h, fill);
  ctx.fillStyle = color(dark);
  for (let i = x - h; i < x + w; i += step * 2) {
    ctx.beginPath();
    ctx.moveTo(i, y + h); ctx.lineTo(i + step, y + h); ctx.lineTo(i + step + h, y); ctx.lineTo(i + h, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, line);
}

function mesh(ctx, x, y, w, h, color = "c1", step = 4) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = pal[color];
  ctx.globalAlpha = simple ? 0.35 : 0.55;
  ctx.lineWidth = simple ? 0.5 : 0.6;
  ctx.beginPath();
  for (let i = -h; i < w + h; i += step) {
    ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h);
    ctx.moveTo(x + i + h, y); ctx.lineTo(x + i, y + h);
  }
  ctx.stroke();
  ctx.restore();
}

function truss(ctx, x, y, w, h, mat = "steel", bar = 2.5) {
  const vertical = h > w;
  const n = Math.max(1, Math.round((vertical ? h / w : w / h)));
  ctx.save();
  ctx.lineCap = "square";
  const [, c1] = tones(mat);
  const diag = (ax, ay, bx, by) => {
    ctx.strokeStyle = pal[MAT[mat][4]];
    ctx.lineWidth = bar + lw(ctx) * 2;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.strokeStyle = c1;
    ctx.lineWidth = bar;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  };
  for (let i = 0; i < n; i++) {
    if (vertical) {
      const s = h / n, yy = y + i * s;
      diag(x, yy, x + w, yy + s);
      diag(x + w, yy, x, yy + s);
    } else {
      const s = w / n, xx = x + i * s;
      diag(xx, y, xx + s, y + h);
      diag(xx, y + h, xx + s, y);
    }
  }
  ctx.restore();
  if (vertical) {
    box(ctx, x - bar / 2, y, bar * 1.4, h, mat, 2, { vertical: true });
    box(ctx, x + w - bar / 2, y, bar * 1.4, h, mat, 2, { vertical: true });
  } else {
    box(ctx, x, y - bar / 2, w, bar * 1.4, mat, 2);
    box(ctx, x, y + h - bar / 2, w, bar * 1.4, mat, 2);
  }
}

function trefoil(ctx, cx, cy, r) {
  disc(ctx, cx, cy, r, "hazard", "yLine");
  ctx.fillStyle = pal.hazardDark;
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + i * Math.PI * 2 / 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r * 0.84, a - Math.PI / 6, a + Math.PI / 6);
    ctx.closePath();
    ctx.fill();
  }
  disc(ctx, cx, cy, r * 0.2, "hazard");
  disc(ctx, cx, cy, r * 0.12, "hazardDark");
}

function slab(ctx, x, y, w, h, mat = "concrete", tone = 2) {
  const t = tones(mat);
  const e = Math.min(2, h / 4), s = Math.min(3, h / 4);
  flat(ctx, x, y, w, h, t[tone]);
  flat(ctx, x, y, w, e, t[Math.min(3, tone + 1)]);
  flat(ctx, x, y + h - s, w, s, t[Math.max(0, tone - 1)]);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, mat);
}

function shape(ctx, pts, fill, line = null) {
  ctx.fillStyle = color(fill);
  path(ctx, pts);
  ctx.fill();
  if (line) stroke(ctx, line);
}

function line(ctx, pts, c, w, cap = "round") {
  ctx.strokeStyle = color(c);
  ctx.lineWidth = w;
  ctx.lineCap = cap;
  ctx.lineJoin = "round";
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.stroke();
}

function curve(ctx, pts, c, w) {
  ctx.strokeStyle = color(c);
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  ctx.lineTo(...pts[pts.length - 1]);
  ctx.stroke();
}

function beam(ctx, a, b, w, mat) {
  const [, c1, c2, , edge] = tones(mat);
  line(ctx, [a, b], edge, w + 1, "butt");
  line(ctx, [a, b], c1, w, "butt");
  line(ctx, [a, b], c2, w * 0.35, "butt");
}

function glow(ctx, cx, cy, r, color, alpha = 0.5) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, pal[color] || color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function text(ctx, str, x, y, size, color, align = "center") {
  ctx.fillStyle = pal[color] || color;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(str, x, y);
}

const ASSETS = [];

function define(asset) {
  ASSETS.push(asset);
  return asset;
}

function draw(ctx, asset, { state, t = 0, palette = PALETTE, lines = 1, lod = false, size } = {}) {
  pal = palette;
  lineW = lines;
  simple = lod;
  ctx.save();
  asset.draw(ctx, state ?? 0, t, size);
  ctx.restore();
}

const GRAIN_PX = 128;
const GRAIN_UNIT = 0.5;
const DIRT = "#140c06";
const DUST = "#c8b48c";
const RUST = ["#3a1a0a", "#6a2c10", "#94461c", "#b8682c"];

let grainCanvas;

function makeGrain() {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = GRAIN_PX;
  const g = c.getContext("2d");
  if (!g) return null;
  const r = rng(71);
  const square = (n, min, max, tone, a0, a1) => {
    g.fillStyle = tone;
    for (let i = 0; i < n; i++) {
      const s = Math.round(min + r() * (max - min));
      const x = Math.floor(r() * GRAIN_PX);
      const y = Math.floor(r() * GRAIN_PX);
      g.globalAlpha = a0 + r() * (a1 - a0);
      for (const [dx, dy] of [[0, 0], [-GRAIN_PX, 0], [0, -GRAIN_PX], [-GRAIN_PX, -GRAIN_PX]]) g.fillRect(x + dx, y + dy, s, s);
    }
  };
  square(60, 10, 26, DIRT, 0.05, 0.14);
  square(30, 8, 18, DUST, 0.03, 0.07);
  square(420, 1, 3, DIRT, 0.15, 0.4);
  square(220, 1, 3, DUST, 0.08, 0.22);
  return c;
}

function grainPattern(ctx, seed) {
  if (grainCanvas === undefined) grainCanvas = makeGrain();
  if (!grainCanvas) return null;
  const p = ctx.createPattern(grainCanvas, "repeat");
  if (!p) return null;
  const r = rng(seed);
  p.setTransform(new DOMMatrix([GRAIN_UNIT, 0, 0, GRAIN_UNIT, r() * GRAIN_PX, r() * GRAIN_PX]));
  return p;
}

function grain(ctx, region, seed, alpha = 1) {
  const p = grainPattern(ctx, seed);
  if (!p) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p;
  region();
  ctx.fill();
  ctx.restore();
}

const rectRegion = (ctx, x, y, w, h) => () => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
};

function veil(ctx, pts, c, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  shape(ctx, pts, c);
  ctx.restore();
}

function ragged(x0, x1, y, amp, step, seed) {
  const r = rng(seed);
  const pts = [];
  for (let x = x0; x < x1; x += step * (0.5 + r())) pts.push([x, y - r() * amp]);
  pts.push([x1, y - r() * amp]);
  return pts;
}

function dirt(ctx, x, y, w, h, seed, rise = 0.3) {
  const top = y + h - h * rise;
  veil(ctx, [[x, y + h], ...ragged(x, x + w, top + h * rise * 0.5, h * rise * 0.5, 6, seed), [x + w, y + h]], DIRT, 0.32);
  veil(ctx, [[x, y + h], ...ragged(x, x + w, y + h - h * rise * 0.25, h * rise * 0.25, 4, seed + 1), [x + w, y + h]], DIRT, 0.3);
}

function streak(ctx, x, y, len, wide, c, alpha) {
  veil(ctx, [[x - wide / 2, y], [x + wide / 2, y], [x + wide * 0.15, y + len], [x - wide * 0.15, y + len]], c, alpha);
}

function drips(ctx, x, y, w, maxLen, seed, n = 4, rusty = true) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const dx = x + r() * w;
    const len = maxLen * (0.35 + r() * 0.65);
    const wide = 1.5 + r() * 3;
    streak(ctx, dx, y, len, wide * 2.2, DIRT, 0.18);
    if (rusty) {
      streak(ctx, dx, y, len * 0.8, wide, RUST[1], 0.55);
      streak(ctx, dx, y, len * 0.45, wide * 0.5, RUST[2], 0.45);
    }
  }
}

function rustPatch(ctx, cx, cy, rx, ry, seed) {
  const r = rng(seed);
  const blob = (k, s) => Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * 2 * Math.PI;
    const f = k * (0.55 + r() * 0.6);
    return [cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f + s];
  });
  veil(ctx, blob(1.25, 0), RUST[0], 0.35);
  veil(ctx, blob(1, 0), RUST[1], 0.7);
  veil(ctx, blob(0.6, -0.5), RUST[2], 0.6);
  veil(ctx, blob(0.25, -0.5), RUST[3], 0.5);
  drips(ctx, cx - rx * 0.5, cy + ry * 0.5, rx, ry * 3, seed + 3, 2);
}

function chips(ctx, x, y, w, seed, c = DUST) {
  const r = rng(seed);
  ctx.save();
  ctx.fillStyle = c;
  for (let cx = x + r() * 6; cx < x + w - 2; cx += 4 + r() * 10) {
    ctx.globalAlpha = 0.25 + r() * 0.35;
    ctx.fillRect(cx, y, 1 + r() * 3, 0.6 + r() * 1.2);
  }
  ctx.restore();
}

const centre = pts => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

function scorch(ctx, pts, seed) {
  const [cx, cy] = centre(pts);
  const r = rng(seed);
  const out = k => pts.map(([x, y]) => [cx + (x - cx) * (k + r() * 0.25), Math.min(0, cy + (y - cy) * (k + r() * 0.25))]);
  veil(ctx, out(1.45), DIRT, 0.28);
  veil(ctx, out(1.22), DIRT, 0.4);
  veil(ctx, out(1.1), RUST[0], 0.5);
}

function rim(ctx, pts, seed, light, dark) {
  const r = rng(seed);
  const [cx, cy] = centre(pts);
  pts.forEach(([x, y], i) => {
    const [nx, ny] = pts[(i + 1) % pts.length];
    const lit = y >= cy;
    if (r() < (lit ? 0.5 : 0.65)) {
      const t0 = r() * 0.35;
      const t1 = 0.6 + r() * 0.4;
      const len = Math.hypot(nx - x, ny - y) || 1;
      const px = -(ny - y) / len;
      const py = (nx - x) / len;
      const frag = [t0, (t0 * 2 + t1) / 3, (t0 + t1 * 2) / 3, t1].map((t, k) => {
        const j = k % 3 ? (r() - 0.5) * 1.2 : 0;
        return [x + (nx - x) * t + px * j, y + (ny - y) * t + py * j];
      });
      ctx.save();
      ctx.globalAlpha = lit ? 0.5 : 0.8;
      line(ctx, frag, lit ? light : dark, lit ? 0.55 : 0.9);
      ctx.restore();
    }
    if (r() < 0.3) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const len = 3 + r() * 7;
      line(ctx, [[x, y], [x + (dx / d) * len * 0.5 + (r() - 0.5) * 3, y + (dy / d) * len * 0.5], [x + (dx / d) * len, y + (dy / d) * len + (r() - 0.5) * 2]], DIRT, 0.6);
    }
  });
}

function surface(ctx, x, y, w, h, seed, { rise = 0.3, drip = 0, dripLen = h * 0.4, edge = true } = {}) {
  grain(ctx, rectRegion(ctx, x, y, w, h), seed);
  if (rise) dirt(ctx, x, y, w, h, seed + 1, rise);
  if (drip) drips(ctx, x, y, w, dripLen, seed + 2, drip);
  if (edge) chips(ctx, x, y, w, seed + 3);
}

function wagon(ctx, x, y, w, h, seed) {
  const r = rng(seed);
  grain(ctx, rectRegion(ctx, x, y, w, h), seed, 1);
  grain(ctx, rectRegion(ctx, x, y, w, h), seed + 9, 0.8);
  for (let sx = x + r() * 8; sx < x + w; sx += 5 + r() * 14) streak(ctx, sx, y, h * (0.25 + r() * 0.5), 3 + r() * 6, DIRT, 0.12 + r() * 0.14);
  dirt(ctx, x, y, w, h, seed + 1, 0.42);
  for (let rx = x + 6 + r() * 20; rx < x + w - 6; rx += 26 + r() * 40) rustPatch(ctx, rx, y + h * (0.72 + r() * 0.2), 3 + r() * 5, 1.5 + r() * 2, seed + Math.round(rx));
  drips(ctx, x, y + h * 0.7, w, h * 0.25, seed + 4, Math.round(w / 18));
  chips(ctx, x, y + 1, w, seed + 5, DIRT);
}

const G = {
  wagon, grain, rectRegion, polyRegion: (ctx, pts) => () => path(ctx, pts),
  dirt, drips, streak, rustPatch, chips, scorch, rim, surface, DIRT, DUST, RUST
};

window.ENV = {
  TILE, PALETTE, MAT, ASSETS, define, draw,
  P: { rng, path, color, box, flat, poly, cylV, cylH, disc, rivets, hazard, mesh, truss, trefoil, glow, text, stroke, tones, lw, shape, line, curve, beam, slab, inShade },
  G,
  shadeHex,
  get pal() { return pal; },
  get simple() { return simple; }
};
})();
