(() => {
const { define, P, G, TILE } = window.ENV;
const { rng, flat, shape, line, glow, hazard } = P;
const { PI, sin, cos, min, max, floor, ceil, round } = Math;
const simple = () => window.ENV.simple;
const VOID = "#0c0c0c";
const BLOCK = ["#0c0c0c", "#241c10", "#3a301c", "#544830", "#6c603c", "#8a7a52", "#8c5a3c"];
const BRICK = ["#140e06", "#30240c", "#3e301a", "#483c24", "#5c4a2c"];
const OLIVE = ["#2a2212", "#3c3018", "#483c24", "#54442a", "#604824", "#74603a"];
const MOSS = ["#101810", "#182418", "#24301e", "#3c483c"];
const STEEL = ["#141a10", "#182418", "#303024", "#484830", "#60543c", "#84786c", "#a8a08c"];
const SLAT = ["#1a120a", "#2a2218", "#483024", "#5e4c38", "#8a7a62"];
const PLANK = ["#24160a", "#483018", "#603018", "#7a4424", "#a85a2c"];
const TEAL = ["#122626", "#244848", "#3c6464"];
const PALE = ["#3c3424", "#544830", "#6c603c", "#8a7c58", "#b4a07c"];
const PIPE = ["#1c2018", "#3c4434", "#6c7464", "#a8b0a0"];
const FIRE = ["#140c08", "#30180c", "#603018", "#a83c18", "#d86c24", "#f09024", "#f0b430", "#fff0a0", "#c04818", "#e48418"];
const BARRACK = ["#181c12", "#242818", "#303c24", "#3a4a2c", "#4c5a3a"];
const PLANE = ["#2a2414", "#484830", "#6c5c34", "#8c7448", "#a8642c", "#6c3c18"];
const RUNWAY = ["#2e2a22", "#3c3c30", "#545448", "#60543c", "#6c6c60"];
const FAR = ["#0e0a08", "#17110c", "#211810", "#2c2016", "#3a2a1c", "#6c3010"];
const HAZ = { fill: "#9c8430", dark: "#1c1810", line: "#1c1810" };
const MARGIN = 24;
const wrap = (i, n) => ((i % n) + n) % n;
const shown = (ctx) => {
  const m = ctx.getTransform();
  if (m.b || m.c || !m.a || !m.d) return [-Infinity, -Infinity, Infinity, Infinity];
  const xa = -m.e / m.a, xb = (ctx.canvas.width - m.e) / m.a;
  const ya = -m.f / m.d, yb = (ctx.canvas.height - m.f) / m.d;
  return [min(xa, xb) - MARGIN, min(ya, yb) - MARGIN, max(xa, xb) + MARGIN, max(ya, yb) + MARGIN];
};
const eachCell = (ctx, x, y, w, h, cw, ch, draw) => {
  const [vx0, vy0, vx1, vy1] = shown(ctx);
  const i0 = max(0, floor((vx0 - x) / cw)), i1 = min(ceil(w / cw - 0.001), ceil((vx1 - x) / cw));
  const j0 = max(0, floor((vy0 - y) / ch)), j1 = min(ceil(h / ch - 0.001), ceil((vy1 - y) / ch));
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) draw(x + i * cw, y + j * ch, i, j);
};
const clipRect = (ctx, x, y, w, h) => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
};
const veil = (ctx, alpha, draw) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  draw();
  ctx.restore();
};
const blob = (cx, cy, rx, ry, seed, n = 10) => {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * PI * 2;
    const k = 0.7 + r() * 0.4;
    return [cx + cos(a) * rx * k, cy + sin(a) * ry * k];
  });
};

const BLOCK_SEED = 9100;
const stoneBlock = (ctx, x, y, i, j, lod) => {
  const r = rng(BLOCK_SEED + wrap(i, 8) * 131 + wrap(j, 8) * 977);
  const dark = r() < 0.18;
  const top = y + 8;
  flat(ctx, x, top, 24, 16, BLOCK[dark ? 2 : 3]);
  flat(ctx, x, top, 3, 16, "#120e08");
  flat(ctx, x + 3, top, 3, 16, BLOCK[1]);
  flat(ctx, x + 6, top, 3, 16, BLOCK[2]);
  flat(ctx, x + 12, top + 1, 11, 8, BLOCK[dark ? 3 : 4]);
  flat(ctx, x, top, 24, 1, BLOCK[1]);
  flat(ctx, x, top + 15, 24, 1, BLOCK[1]);
  if (lod) return;
  flat(ctx, x + 6, top + 9, 18, 0.8, BLOCK[5]);
  flat(ctx, x + 14, top + 1, 0.8, 14, BLOCK[5]);
  flat(ctx, x + 14.8, top + 1, 0.7, 14, BLOCK[2]);
  if (r() < 0.5) flat(ctx, x + 18 + r() * 3, top + 2 + r() * 3, 0.9, 0.9, BLOCK[6]);
  if (r() < 0.3) line(ctx, [[x + 8 + r() * 6, top + 10], [x + 10 + r() * 6, top + 13], [x + 9 + r() * 8, top + 15]], BLOCK[1], 0.6);
};
const blockField = (ctx, x, y, w, h) => {
  const lod = simple();
  flat(ctx, x, y, w, h, VOID);
  const x0 = floor(x / TILE) * TILE, y0 = floor(y / TILE) * TILE;
  eachCell(ctx, x0, y0, x + w - x0, y + h - y0, TILE, TILE, (cx, cy) => {
    const i = round(cx / TILE), j = round(cy / TILE);
    stoneBlock(ctx, cx, cy, i, j, lod);
    if (lod) return;
    const r = rng(BLOCK_SEED + 7 + wrap(i, 8) * 53 + wrap(j, 8) * 311);
    if (r() < 0.25) G.drips(ctx, cx + 8, cy + 9, 15, 14, BLOCK_SEED + i * 13 + j * 7, 1, r() < 0.4);
    G.chips(ctx, cx + 6, cy + 8.3, 17, BLOCK_SEED + i * 5 + j * 29, G.DUST);
  });
  const rows = [];
  for (let ry = y0; ry < y + h; ry += TILE) rows.push([x, ry + 8, w, 16]);
  return rows;
};
const deepShade = (ctx, x, y, w, h, region) => {
  const c0 = round(x / TILE), r0 = round(y / TILE);
  const cols = round(w / TILE), rows = round(h / TILE);
  const [vx0, vy0, vx1, vy1] = shown(ctx);
  ctx.save();
  ctx.fillStyle = VOID;
  for (const [k, alpha] of [[0, 0.3], [1, 0.3], [2, 0.4]]) {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (let r = r0; r < r0 + rows; r++) {
      if ((r + 1) * TILE < vy0 || r * TILE > vy1) continue;
      for (let c = c0; c < c0 + cols; c++) {
        if ((c + 1) * TILE < vx0 || c * TILE > vx1 || !region(c, r)) continue;
        const d = k * 8;
        const l = region(c - 1, r) ? 0 : d;
        const t = region(c, r - 1) ? 0 : d;
        const rt = region(c + 1, r) ? 0 : d;
        const b = region(c, r + 1) ? 0 : d;
        ctx.rect(c * TILE + l, r * TILE + t, TILE - l - rt, TILE - t - b);
      }
    }
    ctx.fill();
  }
  ctx.restore();
};
define({
  id: "depotBlockWall",
  box: [0, -96, 144, 0],
  draw(ctx, _state, _t, { w = 144, h = 96, at = [0, 0], region } = {}) {
    const [ax, ay] = at;
    ctx.save();
    ctx.translate(-ax, -ay);
    if (region) deepShade(ctx, ax, ay - h, w, h, region);
    else {
      clipRect(ctx, ax, ay - h, w, h);
      G.grain(ctx, G.rectsRegion(ctx, blockField(ctx, ax, ay - h, w, h)), BLOCK_SEED + 1, 0.5);
    }
    ctx.restore();
  }
});

define({
  id: "brickPier",
  box: [0, -192, 24, 0],
  draw(ctx, _state, _t, { h = 192 } = {}) {
    const lod = simple();
    const seed = 9200 + round(h);
    ctx.save();
    clipRect(ctx, 0, -h, 24, h);
    flat(ctx, 0, -h, 24, h, BRICK[0]);
    eachCell(ctx, 0, -h, 18, h, 18, 6, (x, y, _i, j) => {
      const r = rng(seed + j * 31);
      const off = j % 2 ? 4.5 : 0;
      for (let bx = -9 + off; bx < 18; bx += 9) {
        const x0 = max(0, bx + 0.5), x1 = min(18, bx + 8.5);
        if (x1 - x0 < 1) continue;
        flat(ctx, x0, y + 0.5, x1 - x0, 5, r() < 0.35 ? BRICK[2] : BRICK[1]);
        if (!lod) flat(ctx, x0, y + 0.5, x1 - x0, 1, r() < 0.5 ? BRICK[4] : BRICK[3]);
      }
    });
    flat(ctx, 18, -h, 6, h, "#120c06");
    flat(ctx, 18, -h, 1.5, h, BRICK[2]);
    G.grain(ctx, G.rectRegion(ctx, 0, -h, 24, h), seed + 1, 0.9);
    G.drips(ctx, 0, -h, 18, min(h * 0.3, 30), seed + 2, max(1, round(h / 60)), false);
    G.dirt(ctx, 0, -min(h, 40), 24, min(h, 40), seed + 3, 0.5);
    ctx.restore();
  }
});

const pipeRun = (ctx, x, y, w, seed) => {
  flat(ctx, x, y, w, 4, PIPE[1]);
  flat(ctx, x, y + 0.6, w, 1.1, PIPE[2]);
  flat(ctx, x, y + 3, w, 1, PIPE[0]);
  const r = rng(seed);
  for (let cx = x + 6 + r() * 10; cx < x + w - 3; cx += 30 + r() * 24) {
    flat(ctx, cx, y - 1, 3, 6, PIPE[2], PIPE[0]);
    flat(ctx, cx + 0.5, y - 0.5, 1, 5, PIPE[3]);
  }
};
const window4 = (ctx, x, y, seed) => {
  const ww = 46, wh = 44;
  flat(ctx, x - 2, y - 2, ww + 4, wh + 4, OLIVE[0]);
  flat(ctx, x, y, ww, wh, "#606060");
  const cols = 3, rows = 3;
  const pw = (ww - 2 * 2 - (cols - 1) * 2) / cols, ph = (wh - 2 * 2 - (rows - 1) * 2) / rows;
  const holes = [];
  const r = rng(seed);
  const broken = floor(r() * cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const px = x + 2 + i * (pw + 2), py = y + 2 + j * (ph + 2);
    flat(ctx, px, py, pw, ph, "#050505");
    flat(ctx, px, py + ph - 0.8, pw, 0.8, "#a8a884");
    flat(ctx, px + pw - 0.8, py, 0.8, ph, "#7c7c70");
    if (i + j * cols === broken) {
      shape(ctx, [[px, py], [px + pw * 0.7, py], [px + pw * 0.3, py + ph * 0.4], [px, py + ph * 0.6]], "#3c3c38");
      line(ctx, [[px + pw * 0.7, py], [px + pw * 0.3, py + ph * 0.4], [px, py + ph * 0.6]], "#c8c8b4", 0.6);
    }
    holes.push(G.rectPts(px, py, pw, ph));
  }
  flat(ctx, x, y, ww, 0.8, "#a8a884");
  flat(ctx, x - 3, y + wh + 1, ww + 6, 2.5, PALE[2], OLIVE[0]);
  return holes;
};
const hazardBits = (ctx, w, y, seed) => {
  const r = rng(seed);
  for (let x = r() * 30; x < w - 10; x += 50 + r() * 50) {
    const len = min(20 + r() * 26, w - x);
    hazard(ctx, x, y, len, 3.5, 3, HAZ);
  }
};
const oliveWall = (ctx, x0, y0, w, h, seed) => {
  const lod = simple();
  flat(ctx, x0, y0, w, h, OLIVE[2]);
  eachCell(ctx, x0, y0, w, h, 24, 24, (x, y, i, j) => {
    const r = rng(seed + i * 37 + j * 101);
    for (let k = 0; k < (lod ? 2 : 5); k++) {
      const pw = min(4 + r() * 12, x0 + w - x), ph = min(2 + r() * 6, y0 + h - y);
      flat(ctx, x + r() * (min(24, x0 + w - x) - pw), y + r() * (min(24, y0 + h - y) - ph), pw, ph, [OLIVE[1], OLIVE[3], OLIVE[3], OLIVE[1], OLIVE[0], OLIVE[4]][floor(r() * 6)]);
    }
  });
};
define({
  id: "depotInnerWall",
  box: [0, -96, 192, 0],
  draw(ctx, state, _t, { w = 192, h = 96 } = {}) {
    const lod = simple();
    const seed = 9300 + round(w * 3 + h) + state * 17;
    ctx.save();
    clipRect(ctx, 0, -h, w, h);
    oliveWall(ctx, 0, -h, w, h, seed);
    for (let x = 36; x < w - 6; x += 48) {
      flat(ctx, x, -h + 6, 1, h - 10, OLIVE[0]);
      flat(ctx, x + 1, -h + 6, 0.8, h - 10, OLIVE[5]);
    }
    if (state === 2) {
      const r = rng(seed + 5);
      for (let x = r() * 20; x < w; x += 30 + r() * 40) {
        const cy = -h * (0.15 + r() * 0.7);
        shape(ctx, blob(x, cy, 10 + r() * 16, 6 + r() * 12, seed + round(x)), MOSS[1]);
        shape(ctx, blob(x + 2, cy - 1, 6 + r() * 8, 3 + r() * 6, seed + round(x) + 1), MOSS[2]);
        if (!lod) for (let k = 0; k < 6; k++) flat(ctx, x - 8 + r() * 16, cy - 5 + r() * 10, 1.5, 1.2, MOSS[3]);
      }
      shape(ctx, [[0, 0], [0, -h * 0.4], [6, -h * 0.25], [14, -h * 0.12], [20, 0]], MOSS[1]);
    }
    let holes = [];
    if (state === 3) holes = window4(ctx, round(w / 2 - 23), -h + max(10, h - 68), seed + 9);
    G.inside(ctx, G.rectRegion(ctx, 0, -h, w, h), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 1);
      G.drips(ctx, 0, -h + 4, w, min(h * 0.35, 26), seed + 2, max(1, round(w / 64)));
      G.dirt(ctx, 0, -min(h, 36), w, min(h, 36), seed + 3, 0.6);
      if (!lod) for (let x = 20; x < w - 10; x += 70) G.rustPatch(ctx, x + rng(seed + x)() * 30, -h * 0.4, 3, 1.5, seed + x);
    }, holes);
    hazardBits(ctx, w, -h, seed + 6);
    hazardBits(ctx, w, -4, seed + 7);
    if (state === 1) {
      pipeRun(ctx, 0, -h + 8, w, seed + 8);
      pipeRun(ctx, 0, -h + 15, w * 0.6, seed + 10);
      const bx = w * 0.62;
      flat(ctx, bx, -h + 13, 10, 9, PIPE[1], PIPE[0]);
      flat(ctx, bx + 1, -h + 14, 8, 1, PIPE[2]);
      flat(ctx, bx + 4, -h + 22, 2.5, h * 0.4, PIPE[1]);
      flat(ctx, bx + 4.5, -h + 22, 0.8, h * 0.4, PIPE[2]);
      G.drips(ctx, 0, -h + 12, w, 8, seed + 11, round(w / 40));
    }
    flat(ctx, 0, -h, w, 1, OLIVE[0]);
    ctx.restore();
  }
});

const chamfer = (x0, x1, top, c) => [[x0, 0], [x0, top + c], [x0 + c, top], [x1 - c, top], [x1, top + c], [x1, 0]];
define({
  id: "rollerShutter",
  box: [0, -96, 120, 0],
  draw(ctx, state, _t, { w = 120, h = 96 } = {}) {
    const lod = simple();
    const seed = 9400 + round(w * 3 + h);
    const ins = max(12, round(w * 0.17));
    const x0 = ins, x1 = w - ins;
    const top = -h + 22, c = 12;
    ctx.save();
    clipRect(ctx, 0, -h, w, h);
    oliveWall(ctx, 0, -h, w, h, seed);
    const outer = chamfer(x0 - 7, x1 + 7, top - 8, c + 4);
    const inner = chamfer(x0, x1, top, c);
    G.inside(ctx, G.rectRegion(ctx, 0, -h, w, h), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1);
      G.dirt(ctx, 0, -min(h, 30), w, min(h, 30), seed + 2, 0.6);
    }, [outer]);
    shape(ctx, outer, OLIVE[1], STEEL[0]);
    line(ctx, chamfer(x0 - 5.5, x1 + 5.5, top - 6.5, c + 3).slice(1, 5), "#8c7c48", 1);
    line(ctx, chamfer(x0 - 2, x1 + 2, top - 2, c + 1).slice(1, 5), STEEL[1], 1.2);
    shape(ctx, inner, "#0a0806");
    const end = state === 1 ? top + (0 - top) * 0.5 : 0;
    if (state === 1) {
      veil(ctx, 0.6, () => flat(ctx, x0, -8, x1 - x0, 8, SLAT[1]));
      for (let x = x0 + 8; x < x1 - 6; x += 18) flat(ctx, x, end + 6, 1, -end - 14, "#140e08");
    }
    ctx.save();
    shape(ctx, inner, SLAT[0]);
    ctx.clip();
    flat(ctx, x0, top, x1 - x0, end - top, SLAT[1]);
    for (let y = end - 4; y > top - 4; y -= 4.5) {
      flat(ctx, x0, y, x1 - x0, 3.6, SLAT[2]);
      flat(ctx, x0, y + 0.4, x1 - x0, 1, SLAT[3]);
      if (!lod) flat(ctx, x0, y + 1.4, x1 - x0, 0.5, SLAT[4]);
    }
    G.grain(ctx, G.rectRegion(ctx, x0, top, x1 - x0, end - top), seed + 3);
    G.drips(ctx, x0, top + 4, x1 - x0, (end - top) * 0.4, seed + 4, max(1, round(w / 50)), false);
    G.dirt(ctx, x0, top, x1 - x0, end - top, seed + 5, 0.35);
    ctx.restore();
    flat(ctx, x0, end - 4, x1 - x0, 4, SLAT[3], SLAT[0]);
    flat(ctx, x0, end - 4, x1 - x0, 0.8, SLAT[4]);
    if (!lod) flat(ctx, x0 + 3, end - 10, (x1 - x0) * 0.5, 1, "#c8b48c");
    flat(ctx, x0 + 1.5, top + c - 2, 1, -top - c + 2, "#c09030");
    flat(ctx, x1 - 2.5, top + c - 2, 1, -top - c + 2, STEEL[4]);
    if (!lod) for (const [px, py] of [[x0 - 4, top + 2], [x1 + 4, top + 2], [x0 - 4, -6], [x1 + 4, -6], [w / 2, top - 4]]) flat(ctx, px - 0.7, py - 0.7, 1.4, 1.4, STEEL[6]);
    hazardBits(ctx, w, -h, seed + 6);
    G.chips(ctx, x0 - 7, top - 8, x1 - x0 + 14, seed + 7);
    ctx.restore();
  }
});

const pipeStub = (ctx, x, y, len, dir) => {
  const x0 = dir > 0 ? x : x - len;
  flat(ctx, x0, y, len, 7, PIPE[2], PIPE[0]);
  flat(ctx, x0, y + 1, len, 1.4, PIPE[3]);
  flat(ctx, x0, y + 5, len, 1.5, PIPE[1]);
  if (!simple()) for (let k = 2; k < len - 1; k += 3) flat(ctx, x0 + k, y + 0.5, 0.6, 6, PIPE[1]);
  flat(ctx, dir > 0 ? x + len - 2 : x - len, y - 0.5, 2, 8, PIPE[1], PIPE[0]);
};
const concretePost = (ctx, x, y, w, h, seed) => {
  flat(ctx, x, y, w, h, OLIVE[3], OLIVE[0]);
  flat(ctx, x, y, 2, h, OLIVE[5]);
  flat(ctx, x + w - 3, y, 3, h, OLIVE[1]);
  flat(ctx, x - 1, y, w + 2, 4, PALE[2], OLIVE[0]);
  G.surface(ctx, x, y, w, h, seed, { rise: 0.35, drip: 1, dripLen: h * 0.3, edge: true });
};
const lintel = (ctx, x, y, w, seed) => {
  const r = rng(seed);
  flat(ctx, x, y, w, 20, PALE[1], OLIVE[0]);
  for (let bx = x; bx < x + w - 0.5; bx += 24) {
    const bw = min(24, x + w - bx);
    flat(ctx, bx + 0.5, y + 0.5, bw - 1, 10, r() < 0.3 ? PALE[2] : PALE[3]);
    flat(ctx, bx + 0.5, y + 10.5, bw - 1, 9, PALE[2]);
    flat(ctx, bx + 0.5, y + 9, bw - 1, 1.2, PALE[4]);
    flat(ctx, bx + bw - 1, y, 1, 20, PALE[0]);
  }
  G.grain(ctx, G.rectRegion(ctx, x, y, w, 20), seed + 1);
  G.chips(ctx, x, y + 0.3, w, seed + 2, G.DIRT);
  G.inside(ctx, G.rectRegion(ctx, x, y, w, 20), () => G.drips(ctx, x, y + 2, w, 14, seed + 3, max(1, round(w / 40)), false));
};
define({
  id: "loadingBay",
  box: [0, -96, 168, 0],
  draw(ctx, _state, _t, { w = 168, h = 96 } = {}) {
    const seed = 9500 + round(w * 3 + h);
    const post = 20;
    const bays = max(1, round((w - post) / 150));
    const span = (w - post) / bays;
    ctx.save();
    flat(ctx, 0, -h, w, h, "#0a0806");
    const lt = h >= 64 ? -h + 24 : -h;
    if (lt > -h) blockField(ctx, 0, -h, w, 24);
    const gap = lt + 20;
    for (let b = 0; b < bays; b++) {
      const ox = post + b * span, ow = span - post;
      const r = rng(seed + b);
      ctx.save();
      clipRect(ctx, ox, gap, ow, -gap);
      G.grain(ctx, G.rectsRegion(ctx, blockField(ctx, ox, gap - 16, ow, 24)), seed + 3, 0.5);
      flat(ctx, ox, gap + 8, ow, -gap - 8, "#080604");
      veil(ctx, 0.6, () => {
        flat(ctx, ox, -6, ow, 6, "#1c160e");
        for (let k = 0; k < 3; k++) flat(ctx, ox + 6 + r() * (ow - 30), -12 - r() * 10, 12 + r() * 10, 30, "#16120c");
      });
      ctx.restore();
      lintel(ctx, ox, lt, ow, seed + 2 + b);
    }
    for (let b = 0; b <= bays; b++) concretePost(ctx, b * span, lt, post, -lt, seed + 10 + b);
    for (let b = 0; b < bays; b++) {
      pipeStub(ctx, b * span + post, gap + 2, 12, 1);
      if (span - post > 60) pipeStub(ctx, (b + 1) * span, gap + 2, 10, -1);
    }
    ctx.restore();
  }
});

define({
  id: "plankDoor",
  box: [0, -72, 24, 0],
  draw(ctx, _state, _t, { h = 72 } = {}) {
    const lod = simple();
    const seed = 9600 + round(h);
    flat(ctx, 0, -h, 24, h, OLIVE[0]);
    flat(ctx, 1, -h + 2, 18, h - 2, PLANK[1]);
    const r = rng(seed);
    for (let x = 1; x < 19; x += 4.5) {
      flat(ctx, x, -h + 2, 4, h - 2, r() < 0.4 ? "#54381c" : PLANK[1]);
      flat(ctx, x + 3.8, -h + 2, 0.7, h - 2, PLANK[0]);
      if (!lod) flat(ctx, x + 0.5, -h + 2, 0.6, h - 2, PLANK[2]);
    }
    flat(ctx, 19, -h + 2, 4, h - 2, PLANK[4]);
    flat(ctx, 22, -h + 2, 1, h - 2, PLANK[3]);
    flat(ctx, 1, -h + 2, 22, 2, PLANK[0]);
    const bar = -h * 0.66;
    flat(ctx, 1, bar, 18, 3, PLANK[0]);
    flat(ctx, 1, bar, 18, 0.8, PLANK[3]);
    const band = -h * 0.28;
    flat(ctx, 1, band, 22, 6, TEAL[1], TEAL[0]);
    flat(ctx, 1, band + 0.6, 22, 1.4, TEAL[2]);
    if (!lod) for (const y of [bar + 1.5, band + 3]) flat(ctx, 2.5, y - 0.6, 1.2, 1.2, "#c8b48c");
    G.inside(ctx, G.rectRegion(ctx, 1, -h + 2, 22, h - 2), () => {
      G.grain(ctx, G.rectRegion(ctx, 1, -h, 22, h), seed + 1, 0.6);
      G.drips(ctx, 1, -h + 3, 22, h * 0.3, seed + 2, 2, false);
      G.drips(ctx, 1, band + 6, 22, 10, seed + 3, 2);
      G.dirt(ctx, 1, -h * 0.4, 22, h * 0.4, seed + 4, 0.5);
    });
  }
});

const beamRail = (ctx, w, y, seed, deep) => {
  flat(ctx, 0, y, w, 5, "#16130c");
  flat(ctx, 0, y, w, 4, STEEL[4]);
  flat(ctx, 0, y, w, 1, STEEL[6]);
  flat(ctx, 0, y + 1, w, 1.5, STEEL[5]);
  flat(ctx, 0, y + 3.2, w, 0.8, STEEL[2]);
  flat(ctx, 0, y + 5, w, deep, "#16130c");
  flat(ctx, 0, y + 4, w, 3, "#24241a");
  const r = rng(seed);
  for (let x = 9; x < w - 1; x += 24) {
    flat(ctx, x, y + 5, 2.2, 8, MOSS[2], STEEL[0]);
    flat(ctx, x, y + 5, 0.8, 8, MOSS[3]);
    if (!simple()) flat(ctx, x - 0.4, y + 13, 3.2, 1.2, STEEL[2]);
    if (r() < 0.3) G.drips(ctx, x, y + 13, 2.2, 4, seed + x, 1);
  }
  G.grain(ctx, G.rectRegion(ctx, 0, y, w, 7), seed + 1, 0.6);
  G.chips(ctx, 0, y + 0.3, w, seed + 2);
  G.inside(ctx, G.rectRegion(ctx, 0, y + 1, w, 6), () => {
    G.drips(ctx, 0, y + 2, w, 4, seed + 3, round(w / 30), false);
    if (!simple()) for (let x = 20 + r() * 30; x < w - 10; x += 60 + r() * 50) G.rustPatch(ctx, x, y + 3, 2, 0.7, seed + round(x));
  });
};
define({
  id: "depotFloor",
  box: [0, -1, 144, 25],
  draw(ctx, _state, _t, { w = 144 } = {}) {
    beamRail(ctx, w, 0, 9700 + round(w), 19);
    flat(ctx, 0, 23, w, 1, "#0e0c08");
  }
});

define({
  id: "steelCatwalk",
  box: [0, -25, 144, 1],
  draw(ctx, _state, _t, { w = 144 } = {}) {
    const seed = 9800 + round(w);
    beamRail(ctx, w, -24, seed, 4);
    flat(ctx, 0, -15.5, w, 1.2, STEEL[2]);
    if (!simple()) for (let x = 12; x < w - 4; x += 48) {
      line(ctx, [[x, -15], [x + 12, -6], [x + 24, -15]], STEEL[2], 1.2);
      flat(ctx, x + 10, -7, 4, 1.5, STEEL[3]);
    }
  }
});

define({
  id: "latticeGirder",
  box: [0, -25, 192, 1],
  draw(ctx, _state, _t, { w = 192, h = 24 } = {}) {
    const lod = simple();
    const seed = 9900 + round(w);
    const top = -h, panel = max(12, round((h - 8) * 0.75));
    ctx.save();
    clipRect(ctx, 0, top - 1, w, h + 2);
    for (let x = 0; x < w; x += panel) {
      line(ctx, [[x + 1, top + 4], [x + panel - 1, -4]], STEEL[0], 2.6, "butt");
      line(ctx, [[x + panel - 1, top + 4], [x + 1, -4]], STEEL[0], 2.6, "butt");
      line(ctx, [[x + 1, top + 4], [x + panel - 1, -4]], STEEL[3], 1.6, "butt");
      line(ctx, [[x + panel - 1, top + 4], [x + 1, -4]], STEEL[4], 1.6, "butt");
      if (!lod) line(ctx, [[x + panel - 1.4, top + 4.5], [x + 1.4, -4.5]], STEEL[5], 0.5, "butt");
      flat(ctx, x, top + 4, 1.6, h - 8, STEEL[3], STEEL[0]);
    }
    for (const y of [top, -4]) {
      flat(ctx, 0, y, w, 4, STEEL[3], STEEL[0]);
      flat(ctx, 0, y + 0.5, w, 1, STEEL[5]);
      flat(ctx, 0, y + 3, w, 1, STEEL[1]);
    }
    if (!lod) for (let x = 0; x < w; x += panel) for (const y of [top + 2, -2]) flat(ctx, x + 0.2, y - 0.6, 1.2, 1.2, STEEL[6]);
    G.grain(ctx, G.rectsRegion(ctx, [[0, top, w, 4], [0, -4, w, 4]]), seed);
    G.chips(ctx, 0, top + 0.3, w, seed + 1);
    G.drips(ctx, 0, top + 4, w, min(h - 6, 14), seed + 2, round(w / 30), false);
    if (!lod) {
      const r = rng(seed + 3);
      for (let x = 10 + r() * 30; x < w - 10; x += 50 + r() * 40) G.rustPatch(ctx, x, top + 2, 3, 1.2, seed + round(x));
    }
    ctx.restore();
  }
});

const fireSky = (ctx, w, top, bot, seed, bright, lod) => {
  const r = rng(seed);
  const hh = bot - top;
  flat(ctx, 0, top, w, hh, FIRE[0]);
  const n = round((lod ? 18 : 34) * (w / 320) * (bright ? 1.3 : 1));
  for (let i = 0; i < n; i++) {
    const u = r();
    const y = top + hh * (0.08 + u * 0.88);
    const x = r() * w;
    const len = (30 + r() * 80) * (bright ? 1.3 : 1);
    const th = (2 + r() * (bright ? 12 : 6)) * (0.6 + u * 0.6);
    const k = min(6, floor(2 + u * (bright ? 4.5 : 3) + r() * 1.5));
    shape(ctx, blob(x, y, len / 2, th, seed + i * 3, 14), FIRE[k]);
    if (!lod && k >= 4) shape(ctx, blob(x + len * 0.05, y + th * 0.2, len * 0.3, th * 0.45, seed + i * 3 + 1, 10), FIRE[min(7, k + 1)]);
  }
  const m = round((lod ? 8 : 14) * (w / 320));
  for (let i = 0; i < m; i++) {
    const x = r() * w;
    const y = top + hh * (0.1 + r() * 0.75);
    const rx = 20 + r() * 50, ry = 4 + r() * (bright ? 12 : 8);
    shape(ctx, blob(x, y, rx, ry, seed + 500 + i, 16), r() < 0.5 ? FIRE[0] : "#1c100a");
    if (!lod) line(ctx, blob(x, y, rx, ry, seed + 500 + i, 16).slice(9, 15), FIRE[bright ? 5 : 4], 0.8);
  }
};
const fireStrip = (ctx, w, y0, hh, t, seed) => {
  flat(ctx, 0, y0, w, hh, FIRE[0]);
  const r = rng(seed);
  const flick = floor(t * 4);
  const tones = [FIRE[8], FIRE[9], FIRE[6], FIRE[7], FIRE[3]];
  for (let y = y0; y < y0 + hh; y += 1.5) {
    const fade = (y - y0) / hh;
    for (let x = -4; x < w; x += 4 + r() * 10 + fade * 12) {
      const c = floor(r() * 4 + flick) % 4;
      if (fade > 0.6 && r() < 0.5) continue;
      flat(ctx, x, y, 3 + r() * 9, 1.1, tones[fade > 0.5 ? c % 2 * 4 : c]);
    }
  }
};
const barredWindow = (ctx, x, y) => {
  flat(ctx, x - 1, y - 1, 24, 22, BARRACK[0]);
  flat(ctx, x, y, 22, 20, "#141410");
  for (let k = 0; k < 5; k++) {
    const bx = x + 2.5 + k * 4;
    flat(ctx, bx, y + 1, 2, 18, "#545a52");
    flat(ctx, bx + 0.5, y + 1, 0.8, 18, "#8c948a");
  }
  flat(ctx, x, y + 19, 22, 1.5, BARRACK[4]);
};
const transportPlane = (ctx, cx, cy, s, tones, lod) => {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  const prop = (x, y, len) => {
    if (!lod) veil(ctx, 0.3, () => { ctx.fillStyle = tones[3]; ctx.beginPath(); ctx.ellipse(x, y, 2.5, len, 0, 0, PI * 2); ctx.fill(); });
    line(ctx, [[x - 1, y - len], [x + 1, y + len]], tones[0], 1.6);
    line(ctx, [[x - len * 0.25, y + 2], [x + len * 0.25, y - 2]], tones[0], 1.4);
  };
  const nacelle = (x, y, l) => {
    shape(ctx, [[x, y - 3], [x + l, y - 4], [x + l, y + 4], [x + 2, y + 5]], tones[1]);
    flat(ctx, x - 1, y - 2, 3, 5, tones[0]);
  };
  shape(ctx, [[30, -12], [190, 0], [190, 3], [30, -6]], tones[1]);
  nacelle(32, -6, 18);
  nacelle(110, -1, 14);
  shape(ctx, [[42, -14], [50, -48], [58, -48], [64, -10]], tones[1]);
  shape(ctx, [[10, -44], [95, -48], [95, -45], [12, -41]], tones[1]);
  line(ctx, [[10, -44], [95, -48]], tones[3], 0.8);
  const body = [[-45, 2], [-44, -8], [-36, -16], [-20, -20], [10, -20], [45, -14], [70, -8], [72, -3], [60, 4], [20, 10], [-20, 12], [-40, 9]];
  shape(ctx, body, tones[2]);
  shape(ctx, [[-44, -8], [-36, -16], [-20, -20], [10, -20], [45, -14], [70, -8], [40, -10], [0, -13], [-30, -11]], tones[3]);
  shape(ctx, [[-40, 9], [-20, 12], [20, 10], [60, 4], [20, 5], [-20, 7]], tones[0]);
  if (!lod) line(ctx, [[-20, -17], [30, -15]], tones[4], 1.2);
  shape(ctx, [[-40, -10], [-33, -16], [-22, -17], [-26, -10]], "#120e08");
  ctx.fillStyle = "#0c0a06";
  ctx.beginPath();
  ctx.ellipse(-39, -1, 4.5, 7, 0, 0, PI * 2);
  ctx.fill();
  shape(ctx, [[-25, -10], [-200, 2], [-200, 6], [-25, -5]], tones[1]);
  line(ctx, [[-25, -10], [-200, 2]], tones[3], 0.8);
  nacelle(-62, -4, 20);
  nacelle(-140, 1, 16);
  prop(-62, -3, 15);
  prop(-140, 2, 13);
  prop(32, -6, 13);
  prop(110, -1, 11);
  for (const gx of [-26, -18, -10, 24, 32]) {
    flat(ctx, gx - 0.5, 9, 1.5, 6, tones[0]);
    ctx.fillStyle = "#0a0806";
    ctx.beginPath();
    ctx.arc(gx, 16, 3.5, 0, PI * 2);
    ctx.fill();
  }
  ctx.restore();
};
define({
  id: "depotBackdrop",
  box: [0, -184, 320, 0],
  draw(ctx, state, t = 0) {
    const lod = simple();
    const w = 320;
    ctx.save();
    clipRect(ctx, 0, -184, w, 184);
    flat(ctx, 0, -184, w, 184, FIRE[0]);
    if (state === 1) {
      fireSky(ctx, w, -184, -44, 8100, true, lod);
      flat(ctx, 0, -44, w, 44, RUNWAY[2]);
      const r = rng(8150);
      for (let y = -44; y < 0; y += 2) {
        const far = 1 - (y + 44) / 44;
        for (let x = r() * 20; x < w; x += 10 + r() * 30 * (1 - far * 0.5)) flat(ctx, x, y, 6 + r() * 30 * (1.4 - far), 1 + (1 - far), RUNWAY[[0, 1, 3, 4, 1][floor(r() * 5)]]);
      }
      flat(ctx, 0, -44, w, 1.5, RUNWAY[0]);
      G.grain(ctx, G.rectRegion(ctx, 0, -44, w, 44), 8151, 0.8);
      veil(ctx, 0.6, () => shape(ctx, [[30, -40], [250, -44], [280, -36], [40, -34]], RUNWAY[0]));
      transportPlane(ctx, 110, -70, 1, PLANE, lod);
      ctx.restore();
      return;
    }
    fireSky(ctx, w, -184, -99, 8000, false, lod);
    const by = -99;
    flat(ctx, 0, by, w, 82, BARRACK[2]);
    flat(ctx, 0, by, w, 2, BARRACK[4]);
    flat(ctx, 0, by + 2, w, 3, BARRACK[1]);
    flat(ctx, 0, by + 46, w, 36, BARRACK[1]);
    veil(ctx, 0.5, () => {
      flat(ctx, 52, by + 38, 76, 30, BARRACK[3]);
      flat(ctx, 190, by + 52, 58, 20, BARRACK[3]);
      flat(ctx, 128, by + 64, 62, 18, "#3a3826");
    });
    flat(ctx, 106, by + 4, 4, 78, BARRACK[1]);
    flat(ctx, 106.5, by + 4, 1, 78, BARRACK[4]);
    for (let k = 0; k < 5; k++) {
      barredWindow(ctx, 7 + k * 64, by + 10);
      barredWindow(ctx, 7 + k * 64, by + 46);
    }
    G.grain(ctx, G.rectRegion(ctx, 0, by, w, 82), 8050, 0.9);
    G.drips(ctx, 0, by + 4, w, 30, 8051, 12, false);
    G.dirt(ctx, 0, by, w, 82, 8052, 0.3);
    fireStrip(ctx, w, -17, 17, t, 8060);
    ctx.restore();
  }
});

const ember = (ctx, pts, lod) => {
  if (lod) return;
  veil(ctx, 0.8, () => line(ctx, pts, FAR[5], 1));
};
define({
  id: "farAirfield",
  box: [0, -96, 192, 0],
  draw(ctx, state, _t, { w = 192, h = 96 } = {}) {
    const lod = simple();
    const seed = 8200 + round(w * 3 + h) + state * 31;
    const r = rng(seed);
    const polys = [];
    const solid = (pts, c) => {
      shape(ctx, pts, c);
      polys.push(pts);
    };
    ctx.save();
    clipRect(ctx, 0, -h, w, h);
    if (state === 0) {
      const hw = min(64, w / 2.6);
      for (let x = r() * 6; x < w - 8; x += hw + 6 + r() * 10) {
        const hh = h * (0.45 + r() * 0.2);
        const wall = hh * 0.4, rise = hh * 0.6;
        const arc = Array.from({ length: 15 }, (_, k) => {
          const a = PI - (k / 14) * PI;
          return [x + hw / 2 + (cos(a) * hw) / 2, -wall - sin(a) * rise];
        });
        solid([[x, 0], ...arc, [x + hw, 0]], FAR[2]);
        shape(ctx, [[x + hw / 2, 0], ...arc.slice(7), [x + hw, 0]], FAR[1]);
        for (let k = 1; k < 7; k++) {
          const [px, py] = arc[k * 2];
          line(ctx, [[px, py + 1], [px, 0]], FAR[1], 0.8);
        }
        ember(ctx, arc.slice(1, 10), lod);
        flat(ctx, x + hw * 0.18, -wall * 1.5, hw * 0.64, wall * 1.5, FAR[0]);
        for (let k = 1; k < 4; k++) flat(ctx, x + hw * 0.18 + (hw * 0.64 * k) / 4, -wall * 1.5, 0.8, wall * 1.5, FAR[2]);
        if (!lod && r() < 0.7) flat(ctx, x + hw * 0.5 - 2, -wall * 1.5 - 4, 4, 2, "#a8642c");
      }
    }
    if (state === 1) {
      const tx = w * 0.5;
      const th = h * 0.92;
      for (let x = 0; x < w; x += 20 + r() * 20) {
        const bh = h * (0.12 + r() * 0.15), bw = 16 + r() * 18;
        solid(G.rectPts(x, -bh, bw, bh), FAR[1]);
        if (!lod && r() < 0.5) flat(ctx, x + 3 + r() * (bw - 8), -bh + 3, 2.5, 1.6, "#6c3c18");
      }
      solid([[tx - 7, 0], [tx - 5, -th * 0.62], [tx + 5, -th * 0.62], [tx + 7, 0]], FAR[2]);
      solid([[tx - 15, -th * 0.62], [tx + 15, -th * 0.62], [tx + 12, -th * 0.77], [tx - 12, -th * 0.77]], FAR[3]);
      flat(ctx, tx - 11, -th * 0.75, 22, th * 0.09, FAR[0]);
      for (let k = 0; k < 5; k++) flat(ctx, tx - 10 + k * 4.2, -th * 0.74, 3, th * 0.06, k === 3 ? FAR[1] : "#a8642c");
      flat(ctx, tx - 14, -th * 0.8, 28, 2.5, FAR[2]);
      line(ctx, [[tx + 2, -th * 0.8], [tx + 2, -th * 0.9]], FAR[3], 1.4);
      solid([[tx - 9, -th * 0.95], [tx + 2, -th * 0.89], [tx + 13, -th * 0.97], [tx + 2, -th * 0.91]], FAR[3]);
      line(ctx, [[tx + 2, -th * 0.9], [tx + 2, -th]], FAR[3], 0.8);
      if (!lod) flat(ctx, tx + 1.2, -th - 1, 1.6, 1.6, "#d86c24");
      ember(ctx, [[tx - 15, -th * 0.62], [tx + 15, -th * 0.62]], lod);
      for (let k = 0; k < 4; k++) if (!lod) flat(ctx, tx - 3, -th * (0.15 + k * 0.12), 2, 2, k % 2 ? FAR[0] : "#6c3c18");
    }
    if (state === 2) {
      const s = min(w / 400, h / 70);
      transportPlane(ctx, w / 2, -20 * s, s, [FAR[1], FAR[3], FAR[3], FAR[4], FAR[5], FAR[2]], lod);
      polys.push(G.rectPts(w / 2 - 45 * s, -50 * s, 120 * s, 62 * s));
      flat(ctx, 0, -1.5, w, 1.5, FAR[1]);
    }
    if (polys.length) G.grain(ctx, G.polysRegion(ctx, polys), seed + 1, 0.4);
    ctx.restore();
  }
});
})();
