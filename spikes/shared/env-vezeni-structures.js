(() => {
const { define, P, G } = window.ENV;
const { rng, flat, shape, line, color, stroke } = P;
const { PI, min, max, floor, ceil, round, abs } = Math;
const simple = () => window.ENV.simple;
const BRICK = ["#1c140c", "#301c10", "#342810", "#443428", "#100c08"];
const QUOIN = ["#342810", "#443c20", "#4c442c", "#60543c", "#1c140c"];
const CONC = ["#443c20", "#60543c", "#685c40", "#988070", "#b0a86c", "#4c5034"];
const SPIKE = ["#302c20", "#443c20", "#545048", "#887870", "#c0b89c", "#18140c"];
const CHROME = ["#282420", "#404440", "#887870", "#c0c4b4", "#100c08"];
const HALL = ["#302c20", "#3c341c", "#443428", "#5c4c38", "#100c08"];
const HOOD = ["#1c2828", "#3c4848", "#5ca4a0", "#a8e0d8"];
const COPPER = ["#4c2c14", "#784824", "#906c30", "#a87830", "#d0a058", "#24140a"];
const RISER = ["#30200c", "#604824", "#7c5c38", "#c8987c"];
const BRASS = ["#2a2414", "#483c24", "#60543c", "#6c603c", "#c0b89c", "#14100a"];
const VALVE = ["#301408", "#603018", "#844824", "#a86c40", "#140804"];
const MACH = ["#203024", "#283030", "#2c3838", "#304040", "#3c4848", "#100c08"];
const OLIVE = ["#2a2a1a", "#484830", "#6c6c44"];
const MESH = ["#243024", "#243030", "#3c483c", "#5c6c60"];
const FENCE = ["#000000", "#546060", "#78786c", "#a8aca0", "#2c2c28"];
const STAIN = ["#3c0c04", "#6c1c0c", "#8c3418"];
const DARK = "#100c08";
const MARGIN = 24;
const shown = (ctx) => {
  const m = ctx.getTransform();
  if (m.b || m.c || !m.a || !m.d) return [-Infinity, -Infinity, Infinity, Infinity];
  const xa = -m.e / m.a, xb = (ctx.canvas.width - m.e) / m.a;
  const ya = -m.f / m.d, yb = (ctx.canvas.height - m.f) / m.d;
  return [min(xa, xb) - MARGIN, min(ya, yb) - MARGIN, max(xa, xb) + MARGIN, max(ya, yb) + MARGIN];
};
const rows = (ctx, y0, y1, step) => {
  const [, vy0, , vy1] = shown(ctx);
  const a = max(0, floor((vy0 - y0) / step)), b = min(ceil((y1 - y0) / step), ceil((vy1 - y0) / step));
  const out = [];
  for (let j = a; j < b; j++) out.push([y0 + j * step, j]);
  return out;
};
const within = (ctx, rects, draw) => {
  ctx.save();
  ctx.beginPath();
  for (const [x, y, w, h] of rects) ctx.rect(x, y, w, h);
  ctx.clip();
  draw();
  ctx.restore();
};
const veil = (ctx, alpha, draw) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  draw();
  ctx.restore();
};
const ellipse = (ctx, cx, cy, rx, ry, fill, edge = null) => {
  ctx.fillStyle = color(fill);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
  ctx.fill();
  if (edge) stroke(ctx, edge);
};

const brickFace = (ctx, x, w, y0, y1, seed, quoin) => {
  flat(ctx, x, y0, w, y1 - y0, BRICK[0]);
  for (const [y, j] of rows(ctx, y0, y1, 4)) {
    const r = rng(seed + j * 17);
    const off = j % 2 ? -4 : 0;
    for (let bx = x + off; bx < x + w; bx += 8) {
      const a = max(x, bx + 0.5), b = min(x + w, bx + 7.5);
      if (b <= a) continue;
      const k = r();
      flat(ctx, a, y + 0.5, b - a, 3, k < 0.6 ? BRICK[1] : k < 0.85 ? BRICK[2] : BRICK[3]);
      if (!simple() && k > 0.7) flat(ctx, a, y + 0.5, b - a, 0.8, BRICK[3]);
    }
  }
  if (quoin) for (const [y] of rows(ctx, y0 + 2, y1 - 10, 24)) {
    flat(ctx, quoin[0], y, quoin[1], 10, QUOIN[1], QUOIN[4]);
    flat(ctx, quoin[0], y, quoin[1], 1.6, QUOIN[3]);
    flat(ctx, quoin[0], y + 8.5, quoin[1], 1.5, QUOIN[0]);
    flat(ctx, quoin[0] + quoin[1] - 2, y + 1.6, 2, 7, QUOIN[2]);
  }
  G.grain(ctx, G.rectRegion(ctx, x, y0, w, y1 - y0), seed + 1);
};

const pierStripes = (ctx, x, w, y0, y1) => {
  const h = y1 - y0;
  flat(ctx, x, y0, w, h, CONC[1]);
  for (let sx = x; sx < x + w - 1; sx += 24) {
    const cw = min(24, x + w - sx);
    flat(ctx, sx, y0, min(6, cw), h, CONC[5]);
    flat(ctx, sx + 1.5, y0, min(3, cw), h, CONC[0]);
    if (cw > 8) flat(ctx, sx + 5, y0, min(6, cw - 5), h, CONC[2]);
    if (cw > 20) {
      flat(ctx, sx + 20, y0, 1.4, h, CONC[4]);
      flat(ctx, sx + 21.4, y0, 2.6, h, CONC[0]);
    }
  }
  flat(ctx, x, y0, 1, h, CONC[0]);
  flat(ctx, x + w - 1.6, y0, 1.6, h, CONC[3]);
};
const concreteGrime = (ctx, x, w, y0, y1, seed) => {
  const h = y1 - y0;
  G.inside(ctx, G.rectRegion(ctx, x, y0, w, h), () => {
    G.grain(ctx, G.rectRegion(ctx, x, y0, w, h), seed);
    for (const [y, j] of rows(ctx, y0, y1, 48)) {
      const s = seed + j * 31;
      G.drips(ctx, x, y + 2, w, 30, s, max(1, round(w / 24)), j % 2 === 0);
      if (rng(s + 1)() < 0.3) G.rustPatch(ctx, x + 4 + rng(s + 2)() * (w - 8), y + 20, 2.2, 1.4, s + 3);
    }
    G.dirt(ctx, x, y1 - min(h, 40), w, min(h, 40), seed + 5, 0.6);
  });
};

const tooth = (ctx, x, y, broken, r) => {
  const tip = broken ? 5 + r() * 3 : 14;
  const ty = y + 12 + (broken ? (r() - 0.5) * 3 : 0);
  shape(ctx, [[x, y + 1], [x + tip, ty - (broken ? 3 : 0)], [x, ty]], SPIKE[3]);
  shape(ctx, [[x, ty], [x + tip, ty - (broken ? 3 : 0)], ...(broken ? [[x + tip, ty + 2]] : []), [x, y + 23]], SPIKE[1]);
  line(ctx, [[x, y + 1], [x + tip, ty - (broken ? 3 : 0)], [x, y + 23]], SPIKE[5], 0.6);
  if (!simple()) line(ctx, [[x + 1, y + 3], [x + tip - 2, ty - (broken ? 3 : 1)]], SPIKE[4], 0.6);
  if (broken) {
    flat(ctx, x + tip - 1, ty - 4, 1.4, 6, VALVE[2]);
    G.rustPatch(ctx, x + tip * 0.5, ty, 1.6, 1.2, round(y) + 77);
  }
};

define({
  id: "prisonTower",
  box: [0, -480, 120, 0],
  draw(ctx, state, _t, size = {}) {
    const h = size.h ?? 480;
    const top = -h;
    const seed = 7100 + state * 13;
    brickFace(ctx, 0, 42, top + 6, 0, seed, [24, 18]);
    flat(ctx, 40, top + 6, 2, h - 6, BRICK[4]);
    pierStripes(ctx, 42, 48, top + 4, 0);
    concreteGrime(ctx, 42, 48, top + 4, 0, seed + 2);
    flat(ctx, 90, top + 4, 18, h - 4, SPIKE[0]);
    for (const [y, j] of rows(ctx, top + 6, -2, 24)) tooth(ctx, 90, y, state === 1 && j % 2 === 1, rng(seed + j * 5));
    within(ctx, [[90, top + 4, 18, h - 4]], () => {
      for (const [y, j] of rows(ctx, top + 6, -2, 48)) G.drips(ctx, 90, y + 22, 6, 10, seed + 4 + j, 1, j % 2 === 0);
    });
    flat(ctx, 108, top + 2, 8, h - 2, CHROME[1], CHROME[4]);
    flat(ctx, 109.5, top + 2, 2.4, h - 2, CHROME[3]);
    flat(ctx, 112, top + 2, 1.2, h - 2, CHROME[2]);
    flat(ctx, 114.5, top + 2, 1.5, h - 2, CHROME[0]);
    flat(ctx, 116, top + 2, 4, h - 2, "#0c0a06");
    for (const [y] of rows(ctx, top + 30, -10, 72)) {
      flat(ctx, 106.5, y, 11, 3, CHROME[2], CHROME[4]);
      if (!simple()) flat(ctx, 106.5, y, 11, 0.8, CHROME[3]);
    }
    within(ctx, [[108, top, 8, h]], () => {
      for (const [y, j] of rows(ctx, top + 30, -10, 72)) G.drips(ctx, 109, y + 3, 6, 14, seed + 6 + j, 1);
    });
    shape(ctx, [[-2, top + 6], [92, top + 6], [92, top], [-2, top + 2]], CONC[2], CONC[0]);
    flat(ctx, -2, top + 0.5, 94, 1.4, CONC[4]);
    G.grain(ctx, G.rectRegion(ctx, -2, top, 94, 6), seed + 7);
    G.chips(ctx, -2, top + 0.6, 94, seed + 8, G.DIRT);
    within(ctx, [[0, top + 6, 42, h - 6]], () => {
      G.drips(ctx, 0, top + 6, 42, 40, seed + 9, 3);
      G.dirt(ctx, 0, -48, 42, 48, seed + 10, 0.7);
    });
  }
});

const louvers = (ctx, x, w, y0, y1) => {
  flat(ctx, x, y0, w, y1 - y0, HALL[2], HALL[4]);
  for (let y = y0 + 2; y < y1 - 3; y += 8) {
    flat(ctx, x + 1, y, w - 2, 3, HALL[4]);
    flat(ctx, x + 1, y + 3, w - 2, 1.2, HALL[0]);
    if (!simple() && round(y) % 16 < 8) flat(ctx, x + 2, y + 2.2, w * 0.4, 0.8, "#d8d4c8");
    flat(ctx, x + 1, y - 0.6, w - 2, 0.6, HALL[3]);
  }
  flat(ctx, x, y0, 2, y1 - y0, HALL[1]);
};
const lampColumn = (ctx, x, y0, y1, lit) => {
  flat(ctx, x, y0, 24, y1 - y0, HALL[2], HALL[4]);
  const gap = (y1 - y0 - 10) / 2;
  for (let k = 0; k < 2; k++) flat(ctx, x + 1, y0 + 6 + k * (gap + 4), 22, gap - 4, "#000000");
  const tx = x + 9, tw = 6;
  if (lit) {
    if (!simple()) veil(ctx, 0.18, () => flat(ctx, tx - 4, y0 + 4, tw + 8, y1 - y0 - 4, "#e4ece0"));
    flat(ctx, tx, y0 + 4, tw, y1 - y0 - 4, "#a8a498");
    flat(ctx, tx + 1, y0 + 4, tw - 2, y1 - y0 - 4, "#e4ece0");
    flat(ctx, tx + 2, y0 + 4, tw - 4, y1 - y0 - 4, "#fcfcfc");
  } else {
    flat(ctx, tx, y0 + 4, tw, y1 - y0 - 4, "#3c3c34");
    flat(ctx, tx + 1.5, y0 + 4, 1.5, y1 - y0 - 4, "#545448");
    line(ctx, [[tx + 1, y0 + 20], [tx + 4, y0 + 24], [tx + 2, y0 + 28]], "#18140c", 0.6);
  }
  for (let k = 1; k < 2; k++) {
    const by = y0 + 6 + k * (gap + 4) - 4;
    flat(ctx, x, by, 24, 4, HALL[2]);
    flat(ctx, x, by, 24, 0.8, HALL[3]);
  }
  shape(ctx, [[tx - 3, y0 + 4.5], [tx + tw + 3, y0 + 4.5], [tx + tw + 1, y0 + 1], [tx - 1, y0 + 1]], HOOD[1], HOOD[0]);
  flat(ctx, tx - 2, y0 + 3.6, tw + 4, 1, lit ? HOOD[2] : HOOD[0]);
  if (lit && !simple()) flat(ctx, tx - 1, y0 + 3.8, tw + 2, 0.5, HOOD[3]);
};
const postUnit = (ctx, x, y0, lit, seed) => {
  const c = y0 + 12, b = c + 6;
  louvers(ctx, x, 24, b, -12);
  lampColumn(ctx, x + 24, b, -12, lit);
  flat(ctx, x + 48, c, 24, -c, HALL[2], HALL[4]);
  flat(ctx, x + 48, c, 2.5, -c, HALL[1]);
  flat(ctx, x + 69, c, 3, -c, HALL[3]);
  for (const k of [0.33, 0.66]) if (!simple()) flat(ctx, x + 70, c + -c * k, 2, 4, "#706450");
  shape(ctx, [[x, b], [x, c + 2], [x + 2, c], [x + 68, c], [x + 72, c + 4], [x + 72, b]], HALL[2], HALL[4]);
  flat(ctx, x + 2, c, 66, 1, HALL[3]);
  flat(ctx, x + 1, -12, 22, 12, QUOIN[3], HALL[4]);
  flat(ctx, x + 1, -12, 22, 1.2, CONC[3]);
  flat(ctx, x + 1, -2, 22, 2, QUOIN[1]);
  G.inside(ctx, G.rectsRegion(ctx, [[x, c, 24, -c], [x + 48, c, 24, -c], [x + 24, c, 24, 6]]), () => {
    G.grain(ctx, G.rectRegion(ctx, x, c, 72, -c), seed);
    G.drips(ctx, x + 48, b, 24, 30, seed + 1, 2);
    G.dirt(ctx, x, -30, 72, 30, seed + 2, 0.7);
  });
  G.chips(ctx, x + 2, c + 0.3, 66, seed + 3, G.DIRT);
  G.chips(ctx, x + 1, -11.6, 22, seed + 4);
};

define({
  id: "pillarHall",
  box: [0, -96, 192, 0],
  draw(ctx, state, _t, { w = 192, h = 96 } = {}) {
    const top = -h;
    const seed = 7200 + state * 7 + round(w);
    flat(ctx, 0, top, w, h, DARK);
    flat(ctx, 0, top + 22, w, 4, OLIVE[0]);
    flat(ctx, 0, top + 22, w, 1, OLIVE[1]);
    flat(ctx, 0, -12, w, 10, HALL[2], HALL[4]);
    flat(ctx, 0, -12, w, 1.4, HALL[3]);
    if (!simple()) flat(ctx, 0, -8, w, 0.8, "#706450");
    flat(ctx, 0, -4.5, w, 1.6, "#5c4428");
    flat(ctx, 0, -2, w, 2, HALL[0]);
    const n = w < 168 ? max(1, floor(w / 72)) : max(2, round((w - 72) / 168) + 1);
    const xs = n === 1 ? [(w - 72) / 2] : Array.from({ length: n }, (_, i) => round((i * (w - 72)) / (n - 1)));
    xs.forEach((x, i) => postUnit(ctx, x, top, state === 0, seed + i * 11));
    flat(ctx, 0, top, w, 8, HALL[2], HALL[4]);
    flat(ctx, 0, top, w, 1.4, HALL[3]);
    flat(ctx, 0, top + 6.5, w, 1.5, HALL[0]);
    for (let x = 30; x < w - 4; x += 48) flat(ctx, x, top, 2, 8, HALL[3]);
    G.inside(ctx, G.rectsRegion(ctx, [[0, top, w, 8], [0, -12, w, 10]]), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, top, w, h), seed + 50);
      G.drips(ctx, 0, top + 2, w, 6, seed + 51, round(w / 20));
      G.drips(ctx, 0, -11, w, 9, seed + 52, round(w / 30));
    });
    G.chips(ctx, 0, top + 0.5, w, seed + 53, G.DIRT);
  }
});

define({
  id: "concretePillar",
  box: [0, -144, 48, 0],
  draw(ctx, _state, _t, { w = 48, h = 144 } = {}) {
    const seed = 7300 + round(h) + round(w) * 3;
    pierStripes(ctx, 0, w, -h, 0);
    flat(ctx, 0.4, -h, 0.9, h, CONC[4]);
    concreteGrime(ctx, 0, w, -h, 0, seed);
    flat(ctx, -1, -6, w + 2, 6, CONC[2], CONC[0]);
    flat(ctx, -1, -6, w + 2, 1, CONC[3]);
    G.grain(ctx, G.rectRegion(ctx, -1, -6, w + 2, 6), seed + 9);
    G.dirt(ctx, -1, -6, w + 2, 6, seed + 10, 0.8);
    G.chips(ctx, -1, -5.6, w + 2, seed + 11, G.DIRT);
    G.chips(ctx, 0, -h + 0.5, w, seed + 12, G.DIRT);
  }
});

const pipeH = (ctx, x0, x1, y, d, tones, seed) => {
  flat(ctx, x0, y - d / 2, x1 - x0, d, tones[1], tones[5] ?? tones[0]);
  flat(ctx, x0, y - d / 2 + d * 0.12, x1 - x0, d * 0.3, tones[3]);
  if (!simple()) flat(ctx, x0, y - d / 2 + d * 0.2, x1 - x0, d * 0.1, tones[4]);
  flat(ctx, x0, y + d * 0.18, x1 - x0, d * 0.32, tones[0]);
  within(ctx, [[x0, y - d / 2, x1 - x0, d]], () => G.grain(ctx, G.rectRegion(ctx, x0, y - d / 2, x1 - x0, d), seed, 1.2));
};

define({
  id: "corridorPipe",
  box: [-2, -96, 146, 2],
  draw(ctx, state, _t, size = {}) {
    const seed = 7400 + state * 17;
    const vertical = state === 1 || (size.h ?? 0) > (size.w ?? Infinity);
    if (vertical) {
      const h = size.h ?? 96;
      const x = 12;
      flat(ctx, x - 1.5, -h, 3, h, RISER[1], RISER[0]);
      flat(ctx, x - 0.8, -h, 1, h, RISER[3]);
      flat(ctx, x + 0.6, -h, 0.9, h, RISER[0]);
      for (let y = -18; y > -h + 4; y -= 24) {
        flat(ctx, x - 2.8, y, 5.6, 2.4, RISER[2], RISER[0]);
        flat(ctx, x + 2.8, y + 0.4, 3, 1.6, CHROME[1]);
      }
      within(ctx, [[x - 1.5, -h, 3, h]], () => G.drips(ctx, x - 1.5, -h + 6, 3, h * 0.6, seed + 1, 2));
      flat(ctx, x - 3, -2, 6, 2, RISER[2], RISER[0]);
      return;
    }
    const w = size.w ?? 144;
    pipeH(ctx, 0, w, -13, 2.5, COPPER, seed + 2);
    pipeH(ctx, 0, w, -7, 6, COPPER, seed + 3);
    for (let x = 18; x < w - 4; x += 48) {
      flat(ctx, x, -11, 3, 8, COPPER[2], COPPER[5]);
      if (!simple()) flat(ctx, x + 0.4, -10.6, 0.9, 7.2, COPPER[4]);
      flat(ctx, x + 0.5, -15, 2, 4, MACH[2], MACH[5]);
      G.drips(ctx, x - 1, -4, 5, 8, seed + x, 1);
    }
    for (let x = 6; x < w - 2; x += 72) flat(ctx, x, -3.4, 2, 3.4, MACH[1], MACH[5]);
    within(ctx, [[0, -15, w, 12]], () => {
      G.drips(ctx, 0, -10, w, 5, seed + 5, round(w / 24), true);
      for (let x = 30; x < w; x += 96) G.rustPatch(ctx, x, -8, 3, 1.2, seed + 6 + x);
    });
  }
});

const flange = (ctx, x, y, d) => {
  flat(ctx, x - 1.6, y - d / 2 - 2, 3.2, d + 4, BRASS[1], BRASS[5]);
  if (!simple()) flat(ctx, x - 1.2, y - d / 2 - 1.6, 0.8, d + 3.2, BRASS[3]);
};
const valveHead = (ctx, cx, y, seed) => {
  const r = rng(seed);
  const body = [[cx - 9, y - 6], [cx - 7, y - 10], [cx - 2, y - 12], [cx + 4, y - 11], [cx + 8, y - 8], [cx + 9, y - 2], [cx + 8, y + 5], [cx + 3, y + 8], [cx - 4, y + 8], [cx - 8, y + 5], [cx - 10, y]];
  for (const fx of [cx - 11, cx + 11]) {
    ellipse(ctx, fx, y, 2.4, 9, VALVE[1], VALVE[4]);
    ellipse(ctx, fx - 0.6, y - 1, 1, 7, VALVE[3]);
  }
  shape(ctx, body, VALVE[2], VALVE[4]);
  shape(ctx, [[cx - 7, y - 8], [cx - 2, y - 10.5], [cx + 4, y - 9.5], [cx + 1, y - 6], [cx - 5, y - 4]], VALVE[3]);
  shape(ctx, [[cx - 8, y + 3], [cx + 8, y + 3], [cx + 3, y + 8], [cx - 4, y + 8]], VALVE[1]);
  flat(ctx, cx - 2, y - 17, 4, 6, VALVE[1], VALVE[4]);
  flat(ctx, cx - 7, y - 19, 14, 2.4, BRASS[2], BRASS[5]);
  if (!simple()) {
    flat(ctx, cx - 6, y - 18.8, 12, 0.7, BRASS[4]);
    ellipse(ctx, cx - 3, y - 7, 2, 1.2, "#d0905c");
  }
  G.inside(ctx, G.polyRegion(ctx, body), () => {
    G.grain(ctx, G.polyRegion(ctx, body), seed + 1, 1.3);
    G.rustPatch(ctx, cx + 2 + r() * 3, y + 1, 3, 2, seed + 2);
  });
  G.drips(ctx, cx - 5, y + 7, 10, 10, seed + 3, 2);
};

define({
  id: "ventPipe",
  box: [-2, -34, 146, 2],
  draw(ctx, state, _t, { w = 144 } = {}) {
    const seed = 7500 + state * 19 + round(w);
    const y = -12, d = 10;
    pipeH(ctx, 0, w, y, d, BRASS, seed);
    for (let x = 24; x < w - 4; x += 48) {
      if (state === 1 && abs(x - w / 2) < 20) continue;
      flange(ctx, x, y, d);
      flat(ctx, x + 6, y - d / 2 - 0.4, 3, d + 0.8, OLIVE[1]);
      flat(ctx, x + 6, y - d / 2 - 0.4, 3, 1.2, OLIVE[2]);
    }
    G.inside(ctx, G.rectRegion(ctx, 0, y - d / 2, w, d), () => {
      G.drips(ctx, 0, y - 2, w, 6, seed + 1, round(w / 24));
      G.dirt(ctx, 0, y - d / 2, w, d, seed + 2, 0.4);
    });
    if (state === 1) valveHead(ctx, w / 2, y, seed + 3);
  }
});

const boxFrame = (ctx, x, y, w, h) => {
  flat(ctx, x, y, w, h, MACH[2], MACH[5]);
  flat(ctx, x, y, w, 1.2, MACH[4]);
  flat(ctx, x, y, 1.2, h, MACH[3]);
  flat(ctx, x + w - 1.6, y, 1.6, h, MACH[0]);
  if (w > 10 && h > 10) {
    flat(ctx, x + 3, y + 3, w - 6, h - 6, MACH[1], MACH[0]);
    flat(ctx, x + 3, y + h - 4, w - 6, 1, MACH[3]);
  }
};
const screwRod = (ctx, x, y0, y1) => {
  flat(ctx, x, y0, 3.2, y1 - y0, "#282420");
  for (let y = y0 + 1; y < y1 - 1; y += 2.2) {
    flat(ctx, x, y, 3.2, 0.9, "#606054");
    if (!simple()) flat(ctx, x + 0.4, y, 1.2, 0.5, "#a8a498");
  }
};
const brace = (ctx, x, y, w, h, dir) => {
  const a = dir > 0 ? [x, y + h] : [x + w, y + h], b = dir > 0 ? [x + w, y] : [x, y];
  shape(ctx, [a, b, [b[0], a[1]]], DARK);
  line(ctx, [a, b], MACH[5], 4.4, "butt");
  line(ctx, [a, b], MACH[2], 3.2, "butt");
  line(ctx, [[a[0], a[1] - 1], [b[0], b[1] - 1]], MACH[4], 0.8, "butt");
};
const machModule = (ctx, x, top, seed) => {
  const r = rng(seed);
  boxFrame(ctx, x + 4, top + 22, 20, top < -60 ? -top - 52 : 30);
  boxFrame(ctx, x + 36, top + 22, 14, 26);
  screwRod(ctx, x + 28, top + 28, -22);
  brace(ctx, x + 52, top + 46, 36, -top - 68, r() < 0.5 ? 1 : -1);
  flat(ctx, x + 50, top + 26, 4, -top - 48, MACH[3], MACH[5]);
  flat(ctx, x + 50, top + 26, 1, -top - 48, MACH[4]);
  flat(ctx, x + 66, top + 28, 3, -top - 50, "#6c6c64");
  flat(ctx, x + 66.6, top + 28, 0.8, -top - 50, "#a8a498");
  if (r() < 0.6) boxFrame(ctx, x + 72, top + 30, 18, 14);
  flat(ctx, x + 10, top + 52, 24, 4, MACH[1], MACH[5]);
  flat(ctx, x + 10, top + 52, 24, 1, MACH[4]);
};
const fan = (ctx, cx, cy) => {
  const s = 24;
  flat(ctx, cx - s, cy - s, s * 2, s * 2, "#404440", MACH[5]);
  for (const [qx, qy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) flat(ctx, cx + qx * s + 2, cy + qy * s + 2, s - 4, s - 4, MACH[2]);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, s - 3, 0, PI * 2);
  ctx.clip();
  flat(ctx, cx - s, cy - s, s * 2, s * 2, "#1c140c");
  const a0 = 0.4;
  for (let k = 0; k < 4; k++) {
    const a = a0 + (k * PI) / 2;
    const p = (r, d) => [cx + Math.cos(a + d) * r, cy + Math.sin(a + d) * r];
    shape(ctx, [p(3, -0.5), p(s - 4, -0.25), p(s - 3, 0.35), p(3, 0.5)], k % 2 ? "#3c4840" : "#4c5848", "#100c08");
  }
  ellipse(ctx, cx, cy, 4, 4, "#404440", "#100c08");
  ctx.restore();
  for (let y = cy - s + 3; y < cy + s - 2; y += 4) flat(ctx, cx - s + 2, y, s * 2 - 4, 0.9, "#545448");
  flat(ctx, cx - 1, cy - s, 2, s * 2, "#a8a498");
  flat(ctx, cx - s, cy - 1, s * 2, 2, "#a8a498");
  flat(ctx, cx - 0.4, cy - s, 0.8, s * 2, "#545448");
  flat(ctx, cx - s, cy - 0.4, s * 2, 0.8, "#545448");
};

define({
  id: "ventMachinery",
  box: [0, -120, 192, 0],
  draw(ctx, state, _t, { w = 192, h = 120 } = {}) {
    const top = -h;
    const seed = 7600 + round(w);
    flat(ctx, 0, top + 10, w, h - 10, "#243030");
    for (let x = 0; x < w - 8; x += 48) flat(ctx, x + 8, top + 24, 18, -top - 50, DARK);
    for (const y of [top + 38, top + 70]) {
      flat(ctx, 0, y, w, 7, MACH[1], MACH[5]);
      flat(ctx, 0, y, w, 1, MACH[3]);
    }
    for (let x = 0; x < w - 8; x += 96) machModule(ctx, x, top, seed + x);
    flat(ctx, 0, top + 10, w, 12, MACH[2], MACH[5]);
    flat(ctx, 0, top + 10, w, 1.4, MACH[4]);
    flat(ctx, 0, top + 20, w, 2, MACH[0]);
    for (let x = 20; x < w - 30; x += 96) {
      flat(ctx, x, top + 11.5, 28, 3, OLIVE[1]);
      flat(ctx, x, top + 11.5, 28, 0.8, OLIVE[2]);
    }
    for (let x = 0; x < w; x += 24) if (!simple()) flat(ctx, x + 11, top + 15, 1.2, 1.2, MACH[4]);
    flat(ctx, 0, -22, w, 4, MESH[0]);
    P.mesh(ctx, 0, -22, w, 4, MESH[3], 2);
    flat(ctx, 0, -22, w, 0.8, MESH[2]);
    flat(ctx, 0, -14, w, 4, OLIVE[1], OLIVE[0]);
    flat(ctx, 0, -14, w, 1, OLIVE[2]);
    for (let x = 6; x < w; x += 48) {
      flat(ctx, x, -18, 6, 18, MACH[2], MACH[5]);
      flat(ctx, x, -18, 1.2, 18, MACH[4]);
      flat(ctx, x - 2, -3, 10, 3, MACH[1], MACH[5]);
    }
    for (const x of [0, w - 8]) {
      flat(ctx, x, top + 6, 8, h - 6, MACH[3], MACH[5]);
      flat(ctx, x + 1, top + 6, 1.4, h - 6, MACH[4]);
      flat(ctx, x + 5.6, top + 6, 2.4, h - 6, MACH[0]);
    }
    flat(ctx, -1, top + 6, w + 2, 5, MACH[3], MACH[5]);
    flat(ctx, -1, top + 6, w + 2, 1, MACH[4]);
    if (state === 1) fan(ctx, round(w / 2 / 24) * 24, top + 48);
    G.inside(ctx, G.rectRegion(ctx, 0, top + 6, w, h - 6), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, top + 6, w, h - 6), seed + 1, 0.6);
      G.drips(ctx, 0, top + 22, w, 18, seed + 2, round(w / 48));
      G.dirt(ctx, 0, -40, w, 40, seed + 3, 0.6);
      for (let x = 30; x < w; x += 84) G.rustPatch(ctx, x, top + 16, 2.5, 1.2, seed + 4 + x);
    });
    G.chips(ctx, 0, top + 10.5, w, seed + 5);
  }
});

const meshPanel = (ctx, x0, x1, y0, y1, step) => {
  flat(ctx, x0, y0, x1 - x0, y1 - y0, "#000000");
  const h = y1 - y0;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, x1 - x0, h);
  ctx.clip();
  ctx.beginPath();
  for (let i = x0 - h; i < x1 + h; i += step) {
    ctx.moveTo(i, y0); ctx.lineTo(i + h, y1);
    ctx.moveTo(i + h, y0); ctx.lineTo(i, y1);
  }
  ctx.strokeStyle = FENCE[1];
  ctx.lineWidth = simple() ? 0.9 : 0.7;
  ctx.stroke();
  if (!simple()) {
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = FENCE[2];
    ctx.lineWidth = 0.35;
    ctx.stroke();
  }
  ctx.restore();
};
const stain = (ctx, cx, cy, seed) => {
  const r = rng(seed);
  for (const [k, c, a] of [[1, STAIN[0], 0.4], [0.7, STAIN[1], 0.35], [0.35, STAIN[2], 0.25]]) {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const ang = (i / 10) * PI * 2;
      const f = k * (0.6 + r() * 0.6);
      return [cx + Math.cos(ang) * 7 * f, cy + Math.sin(ang) * 6 * f + (Math.sin(ang) > 0 ? 4 * f : 0)];
    });
    veil(ctx, a, () => shape(ctx, pts, c));
  }
  veil(ctx, 0.35, () => G.drips(ctx, cx - 3, cy + 4, 6, 12, seed + 1, 2));
};
const fencePost = (ctx, x, seed, bent = 0) => {
  ctx.save();
  ctx.translate(x, 0);
  ctx.rotate(bent);
  flat(ctx, -1.4, -48, 2.8, 48, FENCE[2], FENCE[4]);
  flat(ctx, -0.8, -48, 0.9, 48, FENCE[3]);
  flat(ctx, -1.8, -49, 3.6, 1.6, FENCE[2], FENCE[4]);
  within(ctx, [[-1.4, -48, 2.8, 48]], () => {
    G.grain(ctx, G.rectRegion(ctx, -1.4, -48, 2.8, 48), seed, 1.2);
    G.drips(ctx, -1.4, -44, 2.8, 20, seed + 1, 1);
    G.dirt(ctx, -1.4, -14, 2.8, 14, seed + 2, 0.8);
  });
  ctx.restore();
};
const barbs = (ctx, x0, x1, y) => {
  line(ctx, [[x0, y], [x1, y]], "#303024", 0.6);
  if (simple()) return;
  ctx.strokeStyle = "#606054";
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  for (let x = x0 + 1; x < x1 - 2; x += 3) ctx.ellipse(x + 1.5, y - 1.4, 1.6, 1.6, 0, 0, PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#8a8a7c";
  ctx.beginPath();
  for (let x = x0 + 4; x < x1 - 2; x += 9) {
    ctx.moveTo(x - 1, y - 4); ctx.lineTo(x + 1, y + 0.5);
    ctx.moveTo(x + 1, y - 4); ctx.lineTo(x - 1, y + 0.5);
  }
  ctx.stroke();
};
const plate = (ctx, x, y) => {
  flat(ctx, x, y, 14, 6, "#a8a8a0", "#303024");
  flat(ctx, x, y, 14, 1, "#d8d8d0");
  for (const ly of [y + 2, y + 3.8]) flat(ctx, x + 2, ly, 10, 0.7, "#8c3418");
  G.chips(ctx, x, y + 0.3, 14, 7790, G.DIRT);
};

define({
  id: "prisonFence",
  box: [-4, -54, 124, 2],
  draw(ctx, state, _t, { w = 120 } = {}) {
    const seed = 7700 + round(w);
    const step = simple() ? 3 : 2.2;
    const n = max(1, round(w / 120));
    const xs = Array.from({ length: n + 1 }, (_, i) => (i * w) / n);
    const torn = state === 1;
    const tx = xs[n - 1];
    const tear = [[tx + 2, -46], [w - 1, -46], [w - 1, -4], [w - 14, -1], [w - 10, -12], [w - 22, -18], [w - 16, -28], [w - 30, -36], [w - 24, -46]];
    G.inside(ctx, null, () => meshPanel(ctx, 0, w, -46, -1, step), torn ? [tear] : []);
    if (torn) {
      const edge = tear.slice(3);
      line(ctx, edge, FENCE[1], 1.4);
      if (!simple()) line(ctx, edge, FENCE[3], 0.4);
      const curl = [[w - 24, -46], [w - 18, -40], [w - 13, -42], [w - 12, -36], [w - 18, -33]];
      P.curve(ctx, curl, FENCE[2], 1.6);
      P.curve(ctx, [[w - 14, -1], [w - 8, -6], [w - 5, -3]], FENCE[2], 1.4);
    }
    flat(ctx, 0, -2, w, 2, FENCE[4]);
    G.inside(ctx, G.rectRegion(ctx, 0, -46, w, 46), () => G.dirt(ctx, 0, -14, w, 14, seed + 9, 0.8), torn ? [tear] : []);
    barbs(ctx, 0, torn ? w - 26 : w, -47);
    for (let i = 0; i < n; i++) stain(ctx, xs[i] + 14 + rng(seed + i)() * 26, -38, seed + i * 3);
    if (n > 1 || w >= 96) plate(ctx, xs[0] + (xs[1] - xs[0]) * 0.55, -40);
    xs.forEach((x, i) => fencePost(ctx, x, seed + i * 5, torn && i === n ? -0.35 : 0));
  }
});
})();
