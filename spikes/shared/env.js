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
  sky0: "#2a1008", sky1: "#5a2a14", sky2: "#8a4a28", sky3: "#b8744a", skyline: "#0e0a08", skyline2: "#1e1410"
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
  boot: ["boot0", "boot1", "boot2", "boot3", "kLine"]
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

window.ENV = {
  TILE, PALETTE, MAT, ASSETS, define, draw,
  P: { rng, path, color, box, flat, poly, cylV, cylH, disc, rivets, hazard, mesh, truss, trefoil, glow, text, stroke, tones, lw, shape, line, curve, beam, slab },
  get pal() { return pal; },
  get simple() { return simple; }
};
})();
