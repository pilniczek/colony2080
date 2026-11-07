(() => {
const { define, P, G } = window.ENV;
const { rng, flat, shape, line, curve, stroke, color } = P;
const { PI, sin, cos, min, max, floor, ceil, round, abs } = Math;
const simple = () => window.ENV.simple;
const PEB = ["#1a160e", "#303024", "#3c3018", "#5c4e36", "#0c0a06"];
const TOP = ["#5a4a36", "#6e604a", "#7e6656", "#948a76"];
const TEAL = ["#141c16", "#243024", "#2c3c34", "#3e5248", "#0a0e0a"];
const STEEL = ["#161c12", "#28321e", "#323c2a", "#4a5640", "#080a06"];
const POST = ["#222a28", "#343e3c", "#4e5a5a", "#6e7c78", "#0a0e0e"];
const HULL = ["#2e3a28", "#46543c", "#5e6e50", "#7e8e6a", "#10140c"];
const TUBE = ["#1c2420", "#2e3a34", "#4a5850", "#7a8a80", "#0a0e0c"];
const CABLE = ["#24301e", "#302e22", "#4a4632", "#686248", "#120e08"];
const STRAND = ["#18180c", "#30180c", "#3c180c", "#8a8470"];
const EMBER = ["#7a3008", "#c8641c", "#e48a2a"];
const RAIL = ["#2a160c", "#4e2c16", "#7a4a26", "#a87444", "#0e0804"];
const CHAIN = ["#2c2a24", "#5a5448", "#8a8270"];
const GAP = "#100e0a";
const HOLE = "#070806";
const MARGIN = 24;
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
const within = (ctx, rects, draw) => {
  ctx.save();
  ctx.beginPath();
  for (const [x, y, w, h] of rects) ctx.rect(x, y, w, h);
  ctx.clip();
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
const pebble = (x, y, w, h) => [[x + 1.5, y], [x + w - 1.5, y], [x + w, y + h * 0.4], [x + w - 1, y + h], [x + 1, y + h], [x, y + h * 0.4]];

const pebbleStrip = (ctx, x0, y0, w, seed) => {
  flat(ctx, x0, y0, w, 9, PEB[1]);
  eachCell(ctx, x0, y0, w, 12, 12, 12, (x, _y, i) => {
    const r = rng(seed + i * 37);
    const under = [[x, y0 + 8]];
    for (let k = 0; k <= 4; k++) under.push([min(x0 + w, x + k * 3), y0 + 8.5 + r() * (k % 2 ? 2.5 : 1.2)]);
    if (r() < 0.55) {
      const c = x + 2 + r() * 6, hw = 2.5 + r() * 2.5, d = 3 + r() * 3;
      under.splice(2, 2, [c - hw, y0 + 9.5], [c - hw * 0.4, y0 + 9 + d], [c + hw * 0.5, y0 + 9 + d * 0.8], [c + hw, y0 + 9.5]);
    }
    under.push([min(x0 + w, x + 12), y0 + 8]);
    shape(ctx, under, PEB[0]);
    let px = x;
    while (px < min(x0 + w, x + 12)) {
      const pw = min(3 + r() * 5, x0 + w - px);
      shape(ctx, pebble(px, y0 + 1, pw, 3), r() < 0.35 ? TOP[2] : r() < 0.5 ? TOP[3] : TOP[1]);
      px += pw + 0.3;
    }
    px = x + r() * 2;
    while (px < min(x0 + w, x + 12)) {
      const pw = min(4 + r() * 5, x0 + w - px);
      shape(ctx, pebble(px, y0 + 4.2, pw, 3.8), r() < 0.4 ? PEB[3] : r() < 0.6 ? PEB[2] : "#38382a");
      px += pw + 0.6;
    }
    if (r() < 0.45) {
      const cx = x + 2 + r() * 8, d = r() < 0.5 ? -1 : 1;
      line(ctx, [[cx, y0 + 1.5], [cx + d * 1.5, y0 + 4], [cx + d * 0.5, y0 + 7]], PEB[4], 0.9);
    }
    if (!simple() && r() < 0.3) flat(ctx, x + r() * 10, y0 + 5, 2, 1, "#2e4234");
  });
  flat(ctx, x0, y0, w, 1, TOP[0]);
  G.grain(ctx, G.rectRegion(ctx, x0, y0, w, 12), seed + 1);
  G.chips(ctx, x0, y0 + 0.3, w, seed + 2, G.DIRT);
  within(ctx, [[x0, y0 + 4, w, 9]], () => G.dirt(ctx, x0, y0 + 4, w, 8, seed + 3, 0.7));
};

const stripCap = (ctx, x, y0, seed) => {
  const r = rng(seed);
  const stone = [[x - 2, y0], [x + 4, y0 + 0.5], [x + 7, y0 + 4], [x + 6, y0 + 10], [x + 3, y0 + 15 + r() * 2], [x - 1, y0 + 13], [x - 2, y0 + 9]];
  shape(ctx, stone, PEB[2], PEB[4]);
  shape(ctx, [[x - 1, y0 + 1], [x + 4, y0 + 1.5], [x + 5.5, y0 + 4], [x + 1, y0 + 4.5]], TOP[1]);
  shape(ctx, [[x + 1, y0 + 9], [x + 5, y0 + 9], [x + 3, y0 + 14]], PEB[0]);
  G.grain(ctx, G.polyRegion(ctx, stone), seed + 1);
};

define({
  id: "caveFloor",
  box: [0, -1, 152, 18],
  draw(ctx, state, _t, { w = 144 } = {}) {
    const seed = 6100;
    if (state === 1) {
      pebbleStrip(ctx, 0, 0, w - 6, seed);
      stripCap(ctx, w - 6, 0, seed + 9);
      return;
    }
    pebbleStrip(ctx, 0, 0, w, seed);
  }
});

define({
  id: "rockLedge",
  box: [-2, -34, 76, 22],
  draw(ctx, state, _t, { w = 72 } = {}) {
    const seed = 6200 + round(w);
    const r = rng(seed);
    const y0 = -24;
    const lw = w * 0.55, lx = w * (0.18 + r() * 0.12);
    pebbleStrip(ctx, 0, y0, w, seed + 2);
    const hang = [[2, y0 + 8], [lx - 4, y0 + 9], [lx, y0 + 12], [lx + 3, y0 + 15], [lx + lw * 0.25, y0 + 15.5], [lx + lw * 0.35, y0 + 13], [lx + lw * 0.5, y0 + 14], [lx + lw * 0.6, y0 + 11], [lx + lw * 0.8, y0 + 10], [w - 6, y0 + 8.5], [w - 2, y0 + 8]];
    shape(ctx, hang, PEB[1], PEB[4]);
    shape(ctx, [[lx, y0 + 10], [lx + lw * 0.55, y0 + 10], [lx + lw * 0.45, y0 + 13], [lx + 4, y0 + 13.5]], PEB[2]);
    for (let k = 0; k < 4; k++) {
      const sx = lx + 1 + k * lw * 0.17, sy = y0 + 9.5 + (k % 2) * 2 + r();
      shape(ctx, pebble(sx, sy, lw * 0.15, 3), k % 2 ? PEB[3] : "#4a4430", PEB[4]);
    }
    shape(ctx, [[lx + lw * 0.1, y0 + 12.5], [lx + lw * 0.3, y0 + 13], [lx + lw * 0.25, y0 + 16]], PEB[0]);
    G.grain(ctx, G.polyRegion(ctx, hang), seed + 1, 1.2);
    if (state === 0) {
      const sw = min(23, w * 0.45);
      const slab = [[0, y0], [0, y0 - 7], [1, y0 - 8], [sw - 1, y0 - 8], [sw, y0 - 6.5], [sw, y0]];
      shape(ctx, slab, TEAL[2], TEAL[4]);
      flat(ctx, 1, y0 - 7.5, sw - 2, 1.2, TEAL[3]);
      flat(ctx, 0.5, y0 - 2, sw - 1, 2, TEAL[1]);
      shape(ctx, [[sw - 6, y0], [sw - 5, y0 - 3], [sw - 3, y0 - 2.5], [sw - 2, y0]], TEAL[0]);
      G.grain(ctx, G.polyRegion(ctx, slab), seed + 3, 1.2);
      G.inside(ctx, G.polyRegion(ctx, slab), () => {
        G.drips(ctx, 1, y0 - 7, sw - 2, 6, seed + 4, 2, false);
        G.dirt(ctx, 0, y0 - 8, sw, 8, seed + 5, 0.5);
      });
      G.chips(ctx, 1, y0 - 7.6, sw - 2, seed + 6);
    }
  }
});

const strand = (ctx, cx, y0, y1, seed) => {
  const r = rng(seed);
  let y = y0;
  let k = 0;
  while (y > y1) {
    const sh = min(7 + r() * 8, y - y1);
    const ox = sin((y + seed) * 0.09) * 1.6 + (r() - 0.5);
    const hw = 1.8 + r() * 1.6;
    const lump = [[cx + ox - hw, y], [cx + ox - hw - 0.8, y - sh * 0.4], [cx + ox - hw * 0.6, y - sh], [cx + ox + hw * 0.7, y - sh], [cx + ox + hw + 0.6, y - sh * 0.5], [cx + ox + hw, y]];
    const lit = k % 3 === 1;
    shape(ctx, lump, STRAND[k % 2 ? 1 : 2], STRAND[0]);
    if (lit) {
      flat(ctx, cx + ox - 0.6, y - sh * 0.85, 1.6, sh * 0.7, EMBER[1]);
      if (!simple()) flat(ctx, cx + ox - 0.2, y - sh * 0.7, 0.8, sh * 0.35, EMBER[2]);
    } else {
      flat(ctx, cx + ox - hw * 0.7, y - sh * 0.85, hw * 1.1, sh * 0.7, STRAND[3]);
      flat(ctx, cx + ox - hw * 0.1, y - sh * 0.7, hw * 0.5, sh * 0.4, "#5a5444");
      if (r() < 0.4) flat(ctx, cx + ox + hw * 0.2, y - sh * 0.5, 1, 1.2, EMBER[0]);
    }
    if (r() < 0.22) {
      const d = r() < 0.5 ? -1 : 1;
      line(ctx, [[cx + ox + d * hw, y - sh * 0.5], [cx + ox + d * (hw + 4 + r() * 4), y - sh * 0.5 + 1 + r() * 2]], k % 2 ? EMBER[0] : STRAND[3], 1);
    }
    y -= sh;
    k++;
  }
};

const LOBE = 24;
const cableColumn = (ctx, x, w, y0, y1, seed) => {
  within(ctx, [[x, y1, w, y0 - y1]], () => {
    flat(ctx, x, y1, w, y0 - y1, CABLE[4]);
    const edge = (yb) => Array.from({ length: 7 }, (_, i) => [x + (w * i) / 6, yb - 14 * Math.pow(i / 6, 0.7)]);
    for (let yb = y0 + LOBE; yb > y1 - LOBE; yb -= LOBE) {
      const lo = edge(yb), hi = edge(yb - LOBE);
      shape(ctx, [...hi, ...lo.slice().reverse()], CABLE[2]);
      shape(ctx, [...lo.map(([px, py]) => [px, py - 2.5]).reverse(), ...lo], CABLE[0]);
      shape(ctx, [...lo.slice(0, 3).map(([px, py]) => [px, py - 1.5]), ...lo.slice(0, 3).reverse().map(([px, py]) => [px, py - 8])], CABLE[1]);
      shape(ctx, [...hi.slice(2).map(([px, py]) => [px, py + 1.5]), ...hi.slice(2).reverse().map(([px, py]) => [px - 2, py + 7])], CABLE[3]);
      curve(ctx, hi, CABLE[4], 1.2);
    }
    G.grain(ctx, G.rectRegion(ctx, x, y1, w, y0 - y1), seed, 0.6);
  });
};

define({
  id: "ropeColumn",
  box: [-2, -192, 50, 0],
  draw(ctx, state, _t, size = {}) {
    if (state === 1) {
      const h = size.h ?? 144;
      cableColumn(ctx, 1, 22, 0, -h, 6301);
      cableColumn(ctx, 25, 22, 0, -h, 6302);
      within(ctx, [[0, -h, 48, h]], () => G.dirt(ctx, 0, -40, 48, 40, 6303, 0.6));
      return;
    }
    const h = size.h ?? 192;
    strand(ctx, 12, 0, -h, 6300 + round(h));
  }
});

const pipe = (ctx, x0, x1, y, d, seed) => {
  flat(ctx, x0, y - d / 2, x1 - x0, d, TUBE[1], TUBE[4]);
  flat(ctx, x0, y - d / 2 + d * 0.15, x1 - x0, d * 0.3, TUBE[3]);
  flat(ctx, x0, y + d * 0.2, x1 - x0, d * 0.3, TUBE[0]);
  for (let x = x0 + 12 + (seed % 7); x < x1 - 3; x += 24) {
    flat(ctx, x, y - d / 2 - 1, 2.2, d + 2, TUBE[2], TUBE[4]);
    if (!simple()) flat(ctx, x + 0.3, y - d / 2 - 0.6, 0.7, d + 1.2, TUBE[3]);
  }
  within(ctx, [[x0, y - d / 2, x1 - x0, d]], () => G.grain(ctx, G.rectRegion(ctx, x0, y - d / 2, x1 - x0, d), seed, 1.3));
};
const riser = (ctx, x, y0, y1, d, seed) => {
  flat(ctx, x - d / 2, y1, d, y0 - y1, TUBE[1], TUBE[4]);
  flat(ctx, x - d / 2 + d * 0.15, y1, d * 0.3, y0 - y1, TUBE[3]);
  flat(ctx, x + d * 0.2, y1, d * 0.3, y0 - y1, TUBE[0]);
  for (let y = y0 - 14; y > y1 + 4; y -= 24) {
    flat(ctx, x - d / 2 - 1, y, d + 2, 2.2, TUBE[2], TUBE[4]);
    if (!simple()) flat(ctx, x - d / 2 - 0.6, y + 0.3, d + 1.2, 0.7, TUBE[3]);
  }
  within(ctx, [[x - d / 2, y1, d, y0 - y1]], () => G.grain(ctx, G.rectRegion(ctx, x - d / 2, y1, d, y0 - y1), seed, 1.3));
};
const clamp = (ctx, x, y, d) => {
  flat(ctx, x - 1.5, y - d / 2 - 1.5, 3, d + 3, POST[1], POST[4]);
  ellipse(ctx, x, y - d / 2 - 0.4, 0.7, 0.7, POST[3]);
};

define({
  id: "minePipe",
  box: [-2, -100, 150, 2],
  draw(ctx, state, _t, size = {}) {
    const seed = 6400 + state * 31;
    if (state === 1) {
      const h = size.h ?? 96;
      const d = 3.5;
      riser(ctx, 10, 0, -h + 10, d, seed);
      const elbow = [[10 - d / 2, -h + 10], [10 - d / 2, -h + 8], [10 + 0.5, -h + 4 - d / 2 + 1.5], [14, -h + 6 - d / 2], [14, -h + 6 + d / 2], [10 + d / 2 + 0.5, -h + 9], [10 + d / 2, -h + 10]];
      shape(ctx, elbow, TUBE[2], TUBE[4]);
      pipe(ctx, 14, 24, -h + 6, d, seed + 1);
      flat(ctx, 10 - d / 2 - 1.5, -4, d + 3, 4, TUBE[2], TUBE[4]);
      for (let y = -30; y > -h + 12; y -= 36) clamp(ctx, 10 + d / 2 + 1.2, y, 0);
      within(ctx, [[10 - d / 2, -h, d, h]], () => {
        G.drips(ctx, 10 - d / 2, -h + 12, d, h * 0.5, seed + 2, 2);
        G.dirt(ctx, 10 - d / 2, -30, d, 30, seed + 3, 0.7);
      });
      return;
    }
    const w = size.w ?? 144;
    pipe(ctx, 0, w, -14, 3.5, seed);
    pipe(ctx, 0, w, -8, 2.2, seed + 4);
    for (let x = 18; x < w - 6; x += 48) clamp(ctx, x, -11, 8);
    within(ctx, [[0, -16, w, 10]], () => G.drips(ctx, 0, -12, w, 4, seed + 5, round(w / 20)));
    eachCell(ctx, 0, -16, w, 10, 48, 10, (x, _y, i) => {
      if (rng(seed + i)() < 0.5) within(ctx, [[x, -15.8, 48, 3.6]], () => G.rustPatch(ctx, x + 20, -13, 3, 1, seed + 6 + i));
    });
  }
});

const bayCell = (ctx, x, y, r) => {
  flat(ctx, x + 1, y + 4, 22, 16, STEEL[1], STEEL[4]);
  flat(ctx, x + 1, y + 4, 22, 1.2, STEEL[3]);
  flat(ctx, x + 2, y + 18.5, 20, 1.5, STEEL[0]);
  line(ctx, [[x + 4, y + 17], [x + 11, y + 10]], STEEL[3], 1);
  line(ctx, [[x + 4, y + 17.8], [x + 11, y + 10.8]], STEEL[0], 0.8);
  line(ctx, [[x + 11, y + 10], [x + 11, y + 17]], STEEL[0], 0.8);
  line(ctx, [[x + 11, y + 13.5], [x + 14, y + 17]], STEEL[3], 0.8);
  flat(ctx, x + 15.5, y + 5, 2.2, 14, POST[2]);
  flat(ctx, x + 15.5, y + 5, 0.7, 14, POST[3]);
  flat(ctx, x, y + 20, 24, 3.5, HULL[0], STEEL[4]);
  flat(ctx, x, y + 20, 24, 1, HULL[2]);
  if (r() < 0.35) ellipse(ctx, x + 7, y + 8, 0.9, 0.9, POST[3], STEEL[4]);
};
const postCell = (ctx, x, y, r) => {
  flat(ctx, x + 1, y + 2, 6, 20, STEEL[2], STEEL[4]);
  flat(ctx, x + 17, y + 2, 6, 20, STEEL[2], STEEL[4]);
  flat(ctx, x + 1, y + 2, 6, 1, STEEL[3]);
  flat(ctx, x + 17, y + 2, 6, 1, STEEL[3]);
  if (r() < 0.5) line(ctx, [[x + 18, y + 8], [x + 22, y + 4]], STEEL[3], 0.7);
  flat(ctx, x + 8, y, 8, 24, POST[1], POST[4]);
  flat(ctx, x + 8, y, 1.4, 24, POST[3]);
  flat(ctx, x + 14.6, y, 1.4, 24, POST[0]);
  flat(ctx, x + 10.5, y, 1, 24, POST[2]);
  for (const ry of [4, 12, 20]) {
    ellipse(ctx, x + 12, y + ry, 1.5, 1.5, POST[0], POST[4]);
    ellipse(ctx, x + 11.6, y + ry - 0.5, 0.6, 0.6, POST[3]);
  }
};
const pier = (ctx, x, y, w, h) => {
  flat(ctx, x, y, w, h, POST[1], POST[4]);
  flat(ctx, x, y, w * 0.25, h, POST[2]);
  flat(ctx, x + w * 0.7, y, w * 0.3, h, POST[0]);
  for (let ry = y + 6; ry < y + h - 2; ry += 8) ellipse(ctx, x + w / 2, ry, 1.2, 1.2, POST[0], POST[4]);
};
const hullPlate = (ctx, x, top, bot, seed) => {
  const n = 10;
  const arc = (dx, k) => Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    return [x + dx + k * sin(u * PI) * -1, top + (bot - top) * u];
  });
  const outer = arc(4, 9), inner = arc(20, 3);
  const plate = [...outer, ...inner.slice().reverse()];
  shape(ctx, plate, HULL[0], HULL[4]);
  shape(ctx, [...outer, ...arc(7, 8.5).reverse()], HULL[2]);
  shape(ctx, [...arc(16, 4), ...inner.slice().reverse()], HULL[0]);
  for (let i = 1; i < n; i++) {
    const [px, py] = arc(12, 6)[i];
    ellipse(ctx, px, py, 1, 1, HULL[0], HULL[4]);
    if (!simple()) ellipse(ctx, px - 0.3, py - 0.4, 0.4, 0.4, HULL[3]);
  }
  G.inside(ctx, G.polyRegion(ctx, plate), () => {
    G.grain(ctx, G.polyRegion(ctx, plate), seed, 1.2);
    G.drips(ctx, x, top + 4, 24, (bot - top) * 0.4, seed + 1, 2);
  });
};
const brokenBay = (ctx, x, y, w, h, seed) => {
  const r = rng(seed);
  const hole = [[x + 2, y + 3], [x + w * 0.4, y + 1], [x + w - 3, y + 4], [x + w - 1, y + h * 0.5], [x + w - 4, y + h - 3], [x + w * 0.5, y + h - 1], [x + 3, y + h - 4], [x + 1, y + h * 0.45]];
  G.scorch(ctx, hole, seed);
  shape(ctx, hole, HOLE);
  G.rim(ctx, hole, seed + 1, STEEL[3], G.DIRT);
  const a = [x + 4, y + 2], b = [x + w * 0.45, y + h * 0.5 + r() * 4], c = [x + w * 0.35 + r() * 6, y + h + 2];
  for (const [p, q] of [[a, b], [b, c]]) {
    line(ctx, [p, q], POST[4], 6.5, "butt");
    line(ctx, [p, q], POST[1], 5, "butt");
    line(ctx, [p, q], POST[3], 1.2, "butt");
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    for (let s = 4; s < l - 2; s += 7) {
      const u = s / l;
      ellipse(ctx, p[0] + (q[0] - p[0]) * u + 1, p[1] + (q[1] - p[1]) * u, 1.1, 1.1, POST[0], POST[4]);
    }
  }
  ellipse(ctx, b[0], b[1], 2.2, 2.2, POST[2], POST[4]);
  G.drips(ctx, b[0] - 3, b[1], 6, 10, seed + 2, 1);
  return hole;
};

define({
  id: "metalPillars",
  box: [-2, -126, 196, 2],
  draw(ctx, state, _t, { w = 192, h = 96 } = {}) {
    const seed = 6500 + state * 41 + round(w) + round(h) * 3;
    const top = -h;
    flat(ctx, 0, top, w, h, GAP);
    const holes = [];
    const pw = 8;
    const cols = max(1, floor((w - pw * 2) / 24));
    const x0 = pw + (w - pw * 2 - cols * 24) / 2;
    within(ctx, [[0, top, w, h - 3]], () => eachCell(ctx, x0, top + 4, cols * 24, h - 4, 24, 24, (x, y, i, j) => {
      const r = rng(seed + i * 131 + j * 977);
      (i % 2 ? postCell : bayCell)(ctx, x, y, r);
    }));
    flat(ctx, 0, top, w, 5, STEEL[2], STEEL[4]);
    flat(ctx, 0, top, w, 1.2, STEEL[3]);
    pipe(ctx, 0, w, top + 2.2, 2, seed + 1);
    flat(ctx, 0, -3, w, 3, STEEL[1], STEEL[4]);
    pier(ctx, 0, top, pw, h);
    pier(ctx, w - pw, top, pw, h);
    if (state === 2 && cols >= 3) {
      const bx = x0 + 24 * (cols >= 5 ? 2 : 1);
      holes.push(brokenBay(ctx, bx, top + 6, 40, min(h - 10, 44), seed + 2));
    }
    G.inside(ctx, G.rectRegion(ctx, 0, top, w, h), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, top, w, h), seed + 3);
      eachCell(ctx, x0, top + 4, cols * 24, h - 4, 24, 24, (x, y, i, j) => {
        const s = seed + 10 + i * 13 + j * 71;
        if (rng(s + 4)() < 0.4) G.drips(ctx, x + 1, y + 21, 22, 8, s, 1);
        if (rng(s)() < 0.12) G.rustPatch(ctx, x + 6 + rng(s + 1)() * 12, y + 14, 2.5, 1.4, s + 2);
        G.chips(ctx, x, y + 20.2, 24, s + 3);
      });
      G.dirt(ctx, 0, top, w, h, seed + 4, 0.3);
      G.drips(ctx, 0, top + 4, w, 12, seed + 5, round(w / 40));
    }, holes);
    if (state === 1 && cols >= 2) hullPlate(ctx, x0 + 24 * min(cols - 2, 1) + 2, top + 6, -4, seed + 6);
  }
});

const sag = (a, b, s) => Array.from({ length: 13 }, (_, i) => {
  const u = i / 12;
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + s * 4 * u * (1 - u)];
});
const chain = (ctx, pts) => {
  if (simple()) {
    curve(ctx, pts, CHAIN[0], 1.4);
    curve(ctx, pts, CHAIN[1], 0.7);
    return;
  }
  curve(ctx, pts, CHAIN[0], 0.5);
  let k = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const l = Math.hypot(bx - ax, by - ay);
    const ang = Math.atan2(by - ay, bx - ax);
    for (let s = 0; s < l; s += 1.7, k++) {
      const x = ax + (bx - ax) * (s / l), y = ay + (by - ay) * (s / l);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.strokeStyle = color(k % 2 ? CHAIN[1] : CHAIN[2]);
      ctx.lineWidth = k % 2 ? 0.7 : 0.5;
      ctx.beginPath();
      if (k % 2) {
        ctx.moveTo(-0.9, 0);
        ctx.lineTo(0.9, 0);
      } else ctx.ellipse(0, 0, 1.1, 0.6, 0, 0, PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
};
const railPost = (ctx, x, seed, bent = 0) => {
  ctx.save();
  ctx.translate(x, 0);
  ctx.rotate(bent);
  flat(ctx, -1.6, -30, 3.2, 30, RAIL[1], RAIL[4]);
  flat(ctx, -1.6, -30, 1, 30, RAIL[2]);
  flat(ctx, -2.6, -32, 5.2, 2.4, RAIL[2], RAIL[4]);
  flat(ctx, -2.6, -32, 5.2, 0.8, RAIL[3]);
  for (const y of [-28, -16]) flat(ctx, -2.2, y - 0.8, 4.4, 1.6, RAIL[0], RAIL[4]);
  within(ctx, [[-1.6, -30, 3.2, 30]], () => {
    G.grain(ctx, G.rectRegion(ctx, -1.6, -30, 3.2, 30), seed, 1.3);
    G.drips(ctx, -1.6, -28, 3.2, 14, seed + 1, 1);
    G.dirt(ctx, -1.6, -12, 3.2, 12, seed + 2, 0.8);
  });
  ctx.restore();
  flat(ctx, x - 4, -1.6, 8, 1.6, RAIL[0], RAIL[4]);
};
const tag = (ctx, x, y) => {
  line(ctx, [[x, y], [x, y + 1.5]], CHAIN[1], 0.5);
  flat(ctx, x - 2.5, y + 1.5, 5, 5, "#a82418", "#2a0804");
  flat(ctx, x - 2.5, y + 3.3, 5, 1.4, "#e8e0d0");
  G.chips(ctx, x - 2.5, y + 1.8, 5, 6690, G.DIRT);
};

define({
  id: "safetyRail",
  box: [-6, -36, 104, 2],
  draw(ctx, state, _t, { w = 96 } = {}) {
    const seed = 6600 + round(w);
    const n = max(1, round(w / 48));
    const xs = Array.from({ length: n + 1 }, (_, i) => (i * w) / n);
    const broken = state === 1;
    const last = xs.length - 1;
    for (let i = 0; i < last; i++) {
      const a = xs[i], b = xs[i + 1];
      if (broken && i === last - 1) {
        chain(ctx, sag([a, -28], [a + (b - a) * 0.55, -6], 3));
        chain(ctx, sag([a, -16], [b - 6, -0.8], 4));
        continue;
      }
      chain(ctx, sag([a, -28], [b, -28], 5));
      chain(ctx, sag([a, -16], [b, -16], 4));
    }
    tag(ctx, xs[0] + (xs[1] - xs[0]) / 2, -23);
    xs.forEach((x, i) => {
      if (broken && i === last) railPost(ctx, x, seed + i * 7, 1.1);
      else railPost(ctx, x, seed + i * 7);
    });
  }
});
})();
