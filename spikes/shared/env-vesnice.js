(() => {
const { define, G } = window.ENV;
const P = { ...window.ENV.P, simple: () => window.ENV.simple };
const { rng, color, flat, glow, stroke, shape, line, curve, disc, rivets, hazard, text, path } = P;
const { PI, sin, cos, min, max, floor, ceil, round, abs } = Math;
const simple = () => P.simple();
const ellipse = (ctx, cx, cy, rx, ry, fill, edge = null) => {
  ctx.fillStyle = color(fill);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
  ctx.fill();
  if (edge)
    stroke(ctx, edge);
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
  if (floor(t * 7 + seed) % 4)
    return;
  const r = rng(floor(t * 7) + seed * 13);
  if (!simple())
    glow(ctx, x, y, 5, "y3", 0.8);
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
  if (!simple())
    glow(ctx, x + w / 2, base - tip * 0.4, w * 1.3, "a1", 0.35);
  shape(ctx, pts(1, 1), "fire0");
  shape(ctx, pts(0.75, 0.7), "fire1");
  shape(ctx, pts(0.45, 0.42), "fire2");
};
const blob = (cx, cy, rx, ry, seed, n = 12) => {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * PI * 2;
    const k = 0.75 + r() * 0.35;
    return [cx + cos(a) * rx * k, cy + sin(a) * ry * k];
  });
};
const RUIN = ["#4a4840", "#6e6a5c", "#8e8a78", "#aca692", "#1c1a16"];
const BOULDER = ["#2a2620", "#4c463a", "#6e6654", "#968c74", "#b4aa8e"];
const boulder = (ctx, cx, cy, rx, ry, seed) => {
  shape(ctx, blob(cx, cy, rx, ry, seed, 10), BOULDER[1], BOULDER[0]);
  shape(ctx, blob(cx - rx * 0.18, cy - ry * 0.22, rx * 0.72, ry * 0.6, seed + 1, 9), BOULDER[2]);
  shape(ctx, blob(cx - rx * 0.32, cy - ry * 0.4, rx * 0.36, ry * 0.26, seed + 2, 8), BOULDER[3]);
  flat(ctx, cx - rx * 0.4, cy - ry * 0.55, rx * 0.25, 0.8, BOULDER[4]);
  line(ctx, [[cx - rx * 0.6, cy + ry * 0.5], [cx + rx * 0.5, cy + ry * 0.62]], BOULDER[0], 0.8);
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
const concreteBlock = (ctx, x, y, w, h, seed) => {
  flat(ctx, x, y, w, h, RUIN[2], RUIN[4]);
  flat(ctx, x, y, w, 1.6, RUIN[3]);
  flat(ctx, x + w - 2, y, 2, h, RUIN[1]);
  G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed);
};
const CRATE = ["#161a12", "#262c20", "#384030", "#525c46", "#0a0c08"];
const SEAM = ["#4a3810", "#a07e28", "#c8a040", "#e8cc78", "#0c0a04"];
const STONE = ["#2e2e28", "#4c4c44", "#6c6a60", "#908c7e", "#121210"];
const GRASS = ["#2a2810", "#4a4420", "#6e6230", "#9a8644", "#141206"];
const LEAF = ["#1a2410", "#2a3a18", "#40542a", "#5e7238", "#0a0e06"];
const CONC = ["#4e4a3e", "#706a58", "#948c76", "#b4ac92", "#1a1812"];
const BRONZE = ["#2e1e0c", "#5a3e1e", "#8a6436", "#b88c54", "#120a04"];
const PLATE = ["#20262a", "#343c40", "#4c565a", "#6e787a", "#0a0e10"];
const TUBE = ["#3c4442", "#68706c", "#9aa29c", "#c8ceca", "#141816"];
const OLIVE = ["#24281a", "#3a4028", "#545c3a", "#727a50", "#0c0e08"];
const TRANS = ["#1e2a24", "#2e3e34", "#46584a", "#64786a", "#0a0e0c"];
const BURNT = ["#141210", "#262220", "#3a3430", "#56504a", "#080706"];
const SACK = ["#2c281a", "#4a4430", "#686046", "#867c5c", "#121008"];
const NIGHT = ["#0a1210", "#0f1b18", "#152520", "#1c3029", "#253c33"];
const SIL = ["#0a100d", "#101a15", "#16231c", "#1e2e24", "#283a2e"];
const AMBER = ["#5a2a08", "#c86a14", "#f0a030", "#ffe0a0"];
const FIRE = ["#8a2a08", "#e0601a", "#f8b040", "#fff0b0"];
const PORCELAIN = ["#5a5448", "#8a8474", "#bab4a2", "#e0dccc"];
const SPARK = ["#3a6ad8", "#7ab4ff", "#e8f4ff"];
const HOLE = "#0a0c0a";
const RUSTY = "#7a3a14";
const FLOOR_GAP = 192;
const MARGIN = 24;
const shown = (ctx) => {
  const m = ctx.getTransform();
  if (m.b || m.c || !m.a || !m.d)
    return [-Infinity, -Infinity, Infinity, Infinity];
  const xa = -m.e / m.a;
  const xb = (ctx.canvas.width - m.e) / m.a;
  const ya = -m.f / m.d;
  const yb = (ctx.canvas.height - m.f) / m.d;
  return [min(xa, xb) - MARGIN, min(ya, yb) - MARGIN, max(xa, xb) + MARGIN, max(ya, yb) + MARGIN];
};
const eachCell = (ctx, x, y, w, h, cw, ch, draw) => {
  const [vx0, vy0, vx1, vy1] = shown(ctx);
  const i0 = max(0, floor((vx0 - x) / cw));
  const i1 = min(ceil(w / cw - 0.001), ceil((vx1 - x) / cw));
  const j0 = max(0, floor((vy0 - y) / ch));
  const j1 = min(ceil(h / ch - 0.001), ceil((vy1 - y) / ch));
  for (let j = j0; j < j1; j++)
    for (let i = i0; i < i1; i++)
      draw(x + i * cw, y + j * ch, i, j);
};
const cellSeed = (seed, i, j) => seed + i * 131 + j * 977;
const outline = (ctx, x, y, w, h, c) => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, c);
};
const band = (ctx, x, y, w, h, t, edge = true) => {
  const e = min(2, h / 4);
  const s = min(3, h / 4);
  flat(ctx, x, y, w, h, t[2]);
  flat(ctx, x, y, w, e, t[3]);
  flat(ctx, x, y + h - s, w, s, t[1]);
  if (edge)
    outline(ctx, x, y, w, h, t[4]);
};
const pier = (ctx, x, y, w, h, t, edge = true) => {
  flat(ctx, x, y, w, h, t[2]);
  flat(ctx, x, y, w * 0.25, h, t[3]);
  flat(ctx, x + w * 0.7, y, w * 0.3, h, t[1]);
  if (edge)
    outline(ctx, x, y, w, h, t[4]);
};
const tube = (ctx, x, y, w, h, t) => {
  flat(ctx, x, y, w, h, t[1]);
  flat(ctx, x, y + h * 0.15, w, h * 0.3, t[2]);
  flat(ctx, x, y + h * 0.2, w, h * 0.12, t[3]);
  flat(ctx, x, y + h * 0.75, w, h * 0.25, t[0]);
  outline(ctx, x, y, w, h, t[4]);
};
const strut = (ctx, ax, ay, bx, by, w, t) => {
  line(ctx, [[ax, ay], [bx, by]], t[4], w + 1, "butt");
  line(ctx, [[ax, ay], [bx, by]], t[1], w, "butt");
  line(ctx, [[ax, ay], [bx, by]], t[2], w * 0.4, "butt");
};
const jag = (x0, x1, y, amp, step, seed) => {
  const r = rng(seed);
  const pts = [];
  for (let x = x0; x < x1; x += step * (0.5 + r()))
    pts.push([x, y - r() * amp]);
  pts.push([x1, y - r() * amp]);
  return pts;
};
const breach = (ctx, pts, seed, light, dark, fill = HOLE) => {
  G.scorch(ctx, pts, seed);
  shape(ctx, pts, fill);
  G.rim(ctx, pts, seed + 1, light, dark);
  if (simple())
    return;
  const r = rng(seed + 2);
  pts.forEach(([x, y], i) => {
    if (i % 3)
      return;
    line(ctx, [[x, y], [x + (r() - 0.5) * 6, y - 2 - r() * 4]], RUSTY, 0.6);
  });
};
const bulletHoles = (ctx, x, y, w, h, n, seed, light) => {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const cx = x + r() * w;
    const cy = y + r() * h;
    const pts = blob(cx, cy, 1.4 + r(), 1.2 + r(), seed + i, 7);
    shape(ctx, pts, HOLE);
    G.rim(ctx, pts, seed + 10 + i, light, HOLE);
  }
};
const soot = (ctx, x, y, w, h) => {
  ctx.save();
  ctx.globalAlpha = 0.35;
  shape(ctx, [[x, y], [x + w, y], [x + w * 0.8, y - h], [x + w * 0.2, y - h]], G.DIRT);
  ctx.restore();
};
const frozenFire = (ctx, x, base, w, h, seed) => {
  const r = rng(seed);
  const tongue = (k, s, c) => {
    const pts = [[x + w * (0.5 - s / 2), base]];
    for (let i = 1; i < 6; i++) {
      const u = i / 6;
      pts.push([x + w * (0.5 - s / 2) + w * s * u, base - h * k * (0.45 + 0.55 * sin(u * PI)) * (0.7 + r() * 0.5)]);
    }
    pts.push([x + w * (0.5 + s / 2), base]);
    shape(ctx, pts, c);
  };
  if (!simple())
    glow(ctx, x + w / 2, base - h * 0.4, w * 1.4, FIRE[1], 0.3);
  tongue(1, 1, FIRE[0]);
  tongue(0.75, 0.75, FIRE[1]);
  tongue(0.5, 0.5, FIRE[2]);
  tongue(0.25, 0.25, FIRE[3]);
};
const net = (ctx, x, y, w, h, c, step) => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = c;
  ctx.globalAlpha = simple() ? 0.35 : 0.6;
  ctx.lineWidth = simple() ? 0.5 : 0.55;
  ctx.beginPath();
  for (let i = -h; i < w + h; i += step) {
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + h, y + h);
    ctx.moveTo(x + i + h, y);
    ctx.lineTo(x + i, y + h);
  }
  ctx.stroke();
  ctx.restore();
};
const tufts = (ctx, x, w, y, seed, density, tall = 5) => {
  eachCell(ctx, x, y - tall, w, tall + 1, 4, tall + 1, (cx, _cy, i) => {
    const r = rng(seed + i * 37);
    if (r() > density)
      return;
    const n = 2 + floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const bx = cx + r() * 4;
      const len = tall * (0.4 + r() * 0.6);
      const c = r() < 0.4 ? LEAF[2] : r() < 0.5 ? GRASS[3] : GRASS[2];
      line(ctx, [[bx, y + 0.5], [bx + (r() - 0.5) * 3, y - len]], c, 0.8);
    }
  });
};
const palm = (ctx, x, h, lean, size, tone, seed) => {
  const r = rng(seed);
  const top = [x + lean, -h];
  curve(ctx, [[x, 0], [x + lean * 0.2, -h * 0.5], top], tone, max(2, size * 0.12));
  const n = 8;
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const len = size * (0.6 + r() * 0.5);
    const lift = size * (0.1 + r() * 0.25);
    const droop = size * (0.35 + r() * 0.45) * (i < 2 ? 0.4 : 1);
    const upper = [];
    const lower = [];
    const k = 8;
    for (let j = 0; j <= k; j++) {
      const u = j / k;
      const x = top[0] + side * len * u * (0.6 + 0.4 * ((i + 1) / n));
      const y = top[1] - lift * sin(u * PI * 0.8) + droop * u * u;
      const wd = size * 0.08 * (1 - u) + 0.5;
      upper.push([x, y - wd]);
      lower.push([x + side * (j % 2 ? 1.5 : 0), y + wd * (j % 2 ? 3.2 : 1)]);
    }
    shape(ctx, [...upper, ...lower.reverse()], tone);
  }
  disc(ctx, top[0], top[1], size * 0.08, tone);
};
const bush = (ctx, cx, w, h, tone, seed) => {
  shape(ctx, [[cx - w / 2, 0], ...jag(cx - w / 2, cx + w / 2, -h * 0.6, h * 0.5, 5, seed), [cx + w / 2, 0]], tone);
};
const villageBackdrop = {
  id: "villageBackdrop",
  box: [0, -170, 320, 0],
  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -170, 320, 170);
    ctx.clip();
    for (const [y, h, c] of [[-170, 50, NIGHT[0]], [-120, 32, NIGHT[1]], [-88, 28, NIGHT[2]], [-60, 26, NIGHT[3]], [-34, 34, NIGHT[4]]])
      flat(ctx, 0, y, 320, h, c);
    const r = rng(41);
    for (let i = 0; i < 9; i++)
      palm(ctx, 8 + i * 36 + r() * 14, 120 + r() * 40, (r() - 0.5) * 30, 34 + r() * 14, SIL[2], 50 + i);
    for (let i = 0; i < 7; i++)
      palm(ctx, 20 + i * 48 + r() * 16, 80 + r() * 30, (r() - 0.5) * 24, 26 + r() * 10, SIL[1], 70 + i);
    const ruins = [[0, 34, 30], [64, 44, 22], [150, 38, 34], [236, 46, 26], [300, 30, 20]];
    for (const [x, w, h] of ruins) {
      const top = jag(x, x + w, -h, 7, 4, x + 3);
      const wall = [[x, 0], ...top, [x + w, 0]];
      shape(ctx, wall, SIL[4]);
      G.grain(ctx, G.polyRegion(ctx, wall), x + 5, 0.5);
      flat(ctx, x, -h + 3, w, 1.2, NIGHT[4]);
      for (let k = x + 5; k < x + w - 6; k += 11)
        flat(ctx, k, -h * 0.6, 5, 7, SIL[0]);
    }
    for (let x = -6; x < 330; x += 18 + r() * 16)
      bush(ctx, x, 26 + r() * 20, 12 + r() * 12, r() < 0.5 ? SIL[1] : SIL[0], round(x) + 90);
    flat(ctx, 0, -4, 320, 4, SIL[0]);
    ctx.restore();
  },
};
const farPalms = {
  id: "farPalms",
  box: [0, -192, 96, 0],
  draw(ctx, state, _t, { w = 96, h = 192 } = {}) {
    const seed = round(w * 7 + h * 3) + state * 11;
    const r = rng(seed);
    const n = max(1, round(w / 44));
    for (let i = 0; i < n; i++)
      palm(ctx, ((i + 0.5) * w) / n + (r() - 0.5) * 10, h * (0.6 + r() * 0.3), (r() - 0.5) * 20, 26 + r() * 10, i % 2 ? SIL[2] : SIL[3], seed + i);
    if (state === 1) {
      const wh = min(h * 0.4, 72);
      const wall = [[0, 0], ...jag(0, w, -wh, 10, 5, seed + 20), [w, 0]];
      shape(ctx, wall, SIL[3]);
      G.grain(ctx, G.polyRegion(ctx, wall), seed + 21, 0.5);
      G.drips(ctx, 0, -wh, w, wh * 0.5, seed + 22, round(w / 16), false);
      for (let x = 6; x < w - 10; x += 16)
        flat(ctx, x, -wh * 0.6, 7, 10, SIL[0]);
      const hole = blob(w * 0.55, -wh * 0.35, 9, 7, seed + 23, 10);
      G.scorch(ctx, hole, seed + 24);
      shape(ctx, hole, SIL[0]);
      G.rim(ctx, hole, seed + 25, SIL[4], SIL[0]);
    }
    for (let x = 4; x < w; x += 14 + r() * 10)
      bush(ctx, x, 18 + r() * 14, 10 + r() * 10, SIL[1], seed + round(x));
    G.dirt(ctx, 0, -24, w, 24, seed + 30, 0.6);
    flat(ctx, 0, -3, w, 3, SIL[0]);
  },
};
const farRuins = {
  id: "farRuins",
  box: [0, -192, 96, 0],
  draw(ctx, state, _t, { w = 96, h = 192 } = {}) {
    const seed = round(w * 5 + h * 7) + state * 13;
    const r = rng(seed);
    if (state === 1) {
      const top = h * 0.9;
      const legs = top * 0.55;
      for (const [a, b] of [[w * 0.2, w * 0.3], [w * 0.8, w * 0.7]])
        line(ctx, [[a, 0], [b, -legs]], SIL[3], 3);
      for (let k = 1; k < 4; k++) {
        const y = (-legs * k) / 4;
        const dx = (w * 0.1 * k) / 4;
        line(ctx, [[w * 0.2 + dx, y], [w * 0.8 - dx, y - legs / 4]], SIL[2], 1.4);
        line(ctx, [[w * 0.8 - dx, y], [w * 0.2 + dx, y - legs / 4]], SIL[2], 1.4);
      }
      const tank = [[w * 0.18, -legs], [w * 0.18, -top * 0.88], [w * 0.5, -top], [w * 0.82, -top * 0.88], [w * 0.82, -legs]];
      shape(ctx, tank, SIL[3]);
      G.grain(ctx, G.polyRegion(ctx, tank), seed + 1, 0.5);
      G.drips(ctx, w * 0.18, -top * 0.86, w * 0.64, top * 0.3, seed + 2, 4, false);
      for (let k = 0; k < 3; k++)
        flat(ctx, w * 0.18, -legs - 8 - k * 12, w * 0.64, 1.2, SIL[4]);
      const hole = blob(w * 0.62, -legs - 18, 6, 5, seed + 3, 9);
      shape(ctx, hole, SIL[0]);
      G.rim(ctx, hole, seed + 4, SIL[4], SIL[0]);
    }
    else {
      const body = h * (0.55 + r() * 0.25);
      const roof = [[0, -body * 0.8], ...jag(0, w * 0.4, -body, 10, 5, seed + 5), [w * 0.5, -body * 0.86], ...jag(w * 0.5, w, -body * 0.7, 8, 5, seed + 6)];
      const out = [[0, 0], ...roof, [w, 0]];
      shape(ctx, out, SIL[3]);
      ctx.save();
      path(ctx, out);
      ctx.clip();
      flat(ctx, 0, -body, 4, body, SIL[4]);
      flat(ctx, w - 5, -body, 5, body, SIL[1]);
      for (let y = -24; y > -body + 14; y -= 30) {
        flat(ctx, 0, y, w, 2, SIL[4]);
        for (let x = 8; x < w - 10; x += 16)
          if (r() > 0.15)
            flat(ctx, x, y - 18, 8, 12, r() < 0.08 ? "#3a3420" : SIL[0]);
      }
      G.grain(ctx, G.polyRegion(ctx, out), seed + 7, 0.5);
      G.drips(ctx, 0, -body * 0.8, w, body * 0.3, seed + 8, round(w / 14), false);
      G.dirt(ctx, 0, -body, w, body, seed + 9, min(0.3, 40 / body));
      ctx.restore();
      const hole = blob(w * (0.3 + r() * 0.4), -body * 0.55, w * 0.14, 10, seed + 10, 11);
      G.scorch(ctx, hole, seed + 11);
      shape(ctx, hole, SIL[0]);
      G.rim(ctx, hole, seed + 12, SIL[4], SIL[0]);
    }
    for (let x = 0; x < w; x += 16 + r() * 12)
      bush(ctx, x, 16 + r() * 12, 8 + r() * 8, SIL[1], seed + 40 + round(x));
  },
};
const crateCell = (ctx, x, y, s) => {
  const r = rng(s);
  const t = CRATE;
  flat(ctx, x, y, 24, 24, t[1]);
  flat(ctx, x + 1.2, y + 1.2, 21.6, 17.6, r() < 0.2 ? t[0] : t[1]);
  flat(ctx, x, y, 24, 1.2, t[3]);
  flat(ctx, x, y, 1.2, 19, t[2]);
  flat(ctx, x + 22.8, y, 1.2, 19, t[0]);
  shape(ctx, [[x + 2, y + 15], [x + 17, y + 2], [x + 22, y + 2], [x + 22, y + 5], [x + 7, y + 18], [x + 2, y + 18]], t[2], t[4]);
  if (!simple())
    line(ctx, [[x + 3, y + 15], [x + 17.5, y + 2.6]], t[3], 0.6);
  flat(ctx, x + 15.5, y + 1.2, 2.6, 17.6, t[2]);
  flat(ctx, x + 15.5, y + 1.2, 0.8, 17.6, t[3]);
  if (!simple())
    for (const [px, py] of [[3, 3], [21, 3], [3, 17], [21, 17]])
      flat(ctx, x + px - 0.7, y + py - 0.7, 1.4, 1.4, t[3]);
  flat(ctx, x, y + 19, 24, 5, t[4]);
  flat(ctx, x + 0.6, y + 20.4, 22.8, 1.6, r() < 0.15 ? SEAM[0] : SEAM[1]);
  if (!simple())
    flat(ctx, x + 0.6, y + 20.4, 22.8, 0.5, SEAM[3]);
  if (r() < 0.3)
    G.rustPatch(ctx, x + 4 + r() * 14, y + 6 + r() * 8, 2 + r() * 2, 1.2 + r(), s + 1);
  if (r() < 0.5)
    G.drips(ctx, x + 2, y + 22, 20, 10, s + 2, 1);
  if (r() < 0.12) {
    const dent = blob(x + 8 + r() * 8, y + 8 + r() * 6, 3 + r() * 2, 2.4, s + 3, 8);
    shape(ctx, dent, t[0]);
    G.rim(ctx, dent, s + 4, t[3], t[4]);
  }
};
const crateWall = {
  id: "crateWall",
  box: [0, -96, 96, 0],
  draw(ctx, _state, _t, { w = 96, h = 96 } = {}) {
    const seed = 3100;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -h, w, h);
    ctx.clip();
    eachCell(ctx, 0, -h, w, h, 24, 24, (x, y, i, j) => crateCell(ctx, x, y, cellSeed(seed, i, j)));
    G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 0.8);
    G.dirt(ctx, 0, -h, w, h, seed + 2, min(0.3, 48 / h));
    ctx.restore();
  },
};
const plateCell = (ctx, x, y, s) => {
  const r = rng(s);
  const t = PLATE;
  flat(ctx, x, y, 24, 24, t[1]);
  flat(ctx, x + 1, y + 1, 22, 22, r() < 0.25 ? t[1] : t[2]);
  flat(ctx, x + 1, y + 1, 22, 1, t[3]);
  flat(ctx, x + 1, y + 1, 1, 22, t[3]);
  flat(ctx, x + 22, y + 1, 1, 22, t[0]);
  flat(ctx, x + 1, y + 22, 22, 1, t[0]);
  outline(ctx, x, y, 24, 24, t[4]);
  rivets(ctx, x + 1, y + 3, 22, 4, t[3]);
  rivets(ctx, x + 1, y + 21, 22, 4, t[3]);
  G.drips(ctx, x + 1, y + 4, 22, 14, s + 1, r() < 0.5 ? 2 : 1);
  if (r() < 0.35)
    G.rustPatch(ctx, x + 4 + r() * 16, y + 8 + r() * 10, 2 + r() * 3, 1.4 + r(), s + 2);
  if (r() < 0.2)
    bulletHoles(ctx, x + 3, y + 5, 18, 14, 1 + floor(r() * 3), s + 3, t[3]);
};
const rivetWall = {
  id: "rivetWall",
  box: [0, -192, 72, 0],
  draw(ctx, state, _t, { w = 72, h = 192 } = {}) {
    const seed = 3200 + state;
    const post = state === 0 ? 10 : 0;
    const pw = w - post;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -h, pw, h);
    ctx.clip();
    eachCell(ctx, 0, -h, pw, h, 24, 24, (x, y, i, j) => {
      const off = j % 2 ? -12 : 0;
      plateCell(ctx, x + off, y, cellSeed(seed, i, j));
      if (off && x + 24 >= pw - 0.001)
        plateCell(ctx, x + 12, y, cellSeed(seed, i + 1, j));
    });
    G.grain(ctx, G.rectRegion(ctx, 0, -h, pw, h), seed + 1);
    G.dirt(ctx, 0, -h, pw, h, seed + 2, min(0.3, 40 / h));
    ctx.restore();
    if (state !== 0)
      return;
    pier(ctx, pw, -h, post, h, PLATE);
    flat(ctx, pw + 1, -h, 1.6, h, PLATE[3]);
    flat(ctx, pw + post - 2.6, -h, 1.6, h, PLATE[0]);
    for (let y = -h + 12; y < 0; y += 24) {
      flat(ctx, pw - 1, y, post + 2, 3, PLATE[3], PLATE[4]);
      G.drips(ctx, pw, y + 3, post, 10, seed + 10 - y, 1);
    }
    G.surface(ctx, pw, -h, post, h, seed + 3, { rise: min(0.3, 40 / h), drip: 1, dripLen: 30, edge: false });
  },
};
const plankWall = {
  id: "plankWall",
  box: [0, -192, 72, 0],
  draw(ctx, state, _t, { w = 72, h = 192 } = {}) {
    const seed = 3300 + state;
    const r = rng(seed);
    planks(ctx, 0, -h, w, h, seed, true);
    eachCell(ctx, 0, -h, w, h, 6, 24, (x, y, i, j) => {
      const k = rng(cellSeed(seed, i, j))();
      if (k < 0.06)
        flat(ctx, x + 0.4, y, 5, 24, HOLE);
      else if (k < 0.12)
        flat(ctx, x + 0.4, y, 5, 24, PLANK[0]);
    });
    for (const x of [0, w - 8]) {
      pier(ctx, x, -h, 8, h, PLANK);
      G.surface(ctx, x, -h, 8, h, seed + x + 1, { rise: 0.2, edge: false });
    }
    for (let y = -h + 30; y < -10; y += 60) {
      band(ctx, 0, y, w, 6, PLANK);
      if (!simple())
        for (let x = 4; x < w; x += 6)
          flat(ctx, x, y + 2.5, 1, 1, "#9a948a");
      G.drips(ctx, 0, y + 6, w, 12, seed + 5 - y, round(w / 18));
    }
    G.chips(ctx, 0, -h, w, seed + 6, G.DIRT);
    if (state === 1) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      shape(ctx, [[0, 0], ...jag(0, w, -h * 0.45, h * 0.15, 6, seed + 7), [w, 0]], BURNT[0]);
      ctx.restore();
      for (let k = 0; k < 2; k++) {
        const hole = blob(w * (0.3 + k * 0.4), -h * (0.3 + r() * 0.3), 8 + r() * 4, 10 + r() * 6, seed + 8 + k, 11);
        breach(ctx, hole, seed + 10 + k * 3, "#c87a3a", BURNT[0]);
      }
      G.chips(ctx, 0, -h * 0.45, w, seed + 20, "#d0702a");
    }
    tufts(ctx, 0, w, 0, seed + 30, 0.6, 4);
  },
};
const DEPOT_BAY = 36;
const ammoDepot = {
  id: "ammoDepot",
  box: [-4, -96, 112, 0],
  draw(ctx, _state, _t, { w = 108 } = {}) {
    const seed = 3400;
    const bays = max(1, round((w - 14) / DEPOT_BAY));
    const step = (w - 14) / bays;
    for (let b = 0; b < bays; b++) {
      const x = b * step + 14;
      const sw = step - 14;
      flat(ctx, x, -48, sw, 8, BRONZE[1], BRONZE[4]);
      flat(ctx, x + 2, -46.5, sw - 4, 5, "#3a3a32");
      text(ctx, "AMMO", x + sw / 2 + 2, -44, 4.6, "#b8b098");
      G.grain(ctx, G.rectRegion(ctx, x, -48, sw, 8), seed + b * 5);
      G.drips(ctx, x, -40, sw, 10, seed + b * 5 + 1, 2);
      for (let k = 0; k < 3; k++) {
        const sx = x + 2 + k * (sw / 3);
        const sy = k === 1 ? -11 : -5.5;
        tube(ctx, sx, sy, sw / 3 - 3, 5.5, OLIVE);
        shape(ctx, [[sx + sw / 3 - 3, sy], [sx + sw / 3 + 1, sy + 2.75], [sx + sw / 3 - 3, sy + 5.5]], SEAM[2], SEAM[4]);
        flat(ctx, sx + 2, sy, 1.2, 5.5, SEAM[1]);
      }
    }
    for (let b = 0; b <= bays; b++) {
      const x = b * step;
      pier(ctx, x, -60, 14, 60, CONC);
      G.surface(ctx, x, -60, 14, 60, seed + 40 + b, { rise: 0.35, drip: 2, dripLen: 24 });
      band(ctx, x - 2, -64, 18, 4, CONC);
      soot(ctx, x + 1, -64, 12, 12);
      flat(ctx, x - 1, -72, 16, 8, "#1a1410", "#0a0806");
      for (let k = 0; k < 4; k++)
        line(ctx, [[x + k * 4, -72], [x + 2 + k * 4, -64]], "#3a2a1a", 0.8);
      G.rustPatch(ctx, x + 7, -68, 4, 2, seed + 60 + b);
      frozenFire(ctx, x, -72, 14, 18, seed + 70 + b);
    }
    tufts(ctx, 0, w, 0, seed + 90, 0.5);
  },
};
const FENCE_POST = 72;
const villageFence = {
  id: "villageFence",
  box: [-2, -60, 122, 0],
  draw(ctx, state, _t, { w = 120 } = {}) {
    const seed = 3500 + state;
    const r = rng(seed);
    const tear = blob(w * 0.42, -24, 13, 15, seed + 1, 13);
    ctx.save();
    if (state === 1) {
      path(ctx, tear);
      ctx.rect(0, -52, w, 52);
      ctx.clip("evenodd");
    }
    flat(ctx, 0, -50, w, 48, "#00000022");
    net(ctx, 0, -50, w, 48, "#8a9488", 4);
    ctx.restore();
    if (state === 1) {
      G.rim(ctx, tear, seed + 2, "#b0b8ae", RUSTY);
      if (!simple())
        tear.forEach(([x, y], i) => {
          if (i % 2 === 0)
            line(ctx, [[x, y], [x + (r() - 0.5) * 5, y + (r() - 0.3) * 5]], "#8a9488", 0.5);
        });
      G.rustPatch(ctx, w * 0.42 + 10, -14, 5, 3, seed + 3);
    }
    tube(ctx, 0, -52, w, 2.6, TUBE);
    tube(ctx, 0, -3, w, 2, TUBE);
    G.drips(ctx, 0, -49.4, w, 18, seed + 4, round(w / 14));
    for (let x = 0; x < w; x += FENCE_POST) {
      const px = min(x, w - 3);
      pier(ctx, px, -56, 3, 56, TUBE);
      flat(ctx, px - 0.6, -57, 4.2, 1.6, TUBE[1], TUBE[4]);
      G.drips(ctx, px, -54, 3, 30, seed + 10 + x, 1);
      if (state === 0 && (x / FENCE_POST) % 2 === 0 && x + 30 < w) {
        flat(ctx, px + 12, -44, 16, 9, "#9a9a92", "#1e1e1a");
        flat(ctx, px + 14, -41.5, 12, 1.4, "#a8281c");
        flat(ctx, px + 14, -38.5, 8, 1.4, "#a8281c");
        G.chips(ctx, px + 12, -44, 16, seed + 20 + x, G.DIRT);
        G.drips(ctx, px + 12, -35, 16, 8, seed + 21 + x, 2);
      }
    }
    if (w > 6)
      G.grain(ctx, G.rectRegion(ctx, 0, -12, w, 12), seed + 5, 0.6);
    G.dirt(ctx, 0, -16, w, 16, seed + 6, 0.6);
    tufts(ctx, 0, w, 0, seed + 7, 0.7, 7);
  },
};
const curb = (ctx, x, w, seed, trampled) => {
  flat(ctx, x, 0, w, 24, STONE[0]);
  flat(ctx, x, 0, w, 6, trampled ? "#3a3220" : GRASS[1]);
  flat(ctx, x, 0, w, 1.6, trampled ? "#5a4a2a" : GRASS[2]);
  eachCell(ctx, x, 5, w, 15, 12, 15, (cx, _cy, i) => {
    const r = rng(seed + i * 53);
    const sx = cx + 0.6 + r();
    const sw = 10.4 - r() * 1.6;
    const sy = 6.5 + r() * 1.2;
    const sh = 11.5 - r() * 1.2;
    const stone = [[sx + 1.5, sy], [sx + sw - 1.5, sy], [sx + sw, sy + 2], [sx + sw, sy + sh - 1.5], [sx + sw - 2, sy + sh], [sx + 2, sy + sh], [sx, sy + sh - 2], [sx, sy + 1.5]];
    shape(ctx, stone, r() < 0.3 ? STONE[1] : STONE[2], STONE[4]);
    if (!simple()) {
      flat(ctx, sx + 1.5, sy + 0.6, sw - 3, 1.2, STONE[3]);
      if (r() < 0.4)
        line(ctx, [[sx + 2 + r() * 4, sy + 2], [sx + 3 + r() * 5, sy + sh - 2]], STONE[4], 0.5);
    }
    if (r() < 0.35)
      G.drips(ctx, sx + 1, sy + sh - 1, sw - 2, 6, seed + i * 7 + 1, 1, false);
    if (!trampled && r() < 0.3)
      flat(ctx, sx, sy, sw * (0.3 + r() * 0.4), 1.6, LEAF[1]);
  });
  flat(ctx, x, 19.5, w, 4.5, STONE[4]);
  G.grain(ctx, G.rectRegion(ctx, x, 0, w, 24), seed + 1);
  G.chips(ctx, x, 0.4, w, seed + 2, G.DIRT);
  G.dirt(ctx, x, 12, w, 12, seed + 3, 0.6);
  tufts(ctx, x, w, 1, seed + 4, trampled ? 0.25 : 0.85, trampled ? 3 : 6);
};
const grassyWalkway = {
  id: "grassyWalkway",
  box: [0, -6, 120, 25],
  draw(ctx, state, _t, { w = 120 } = {}) {
    curb(ctx, 0, w, 3600 + state * 7, state === 1);
  },
};
const steelDeckPlate = {
  id: "steelDeckPlate",
  box: [0, -6, 72, 25],
  draw(ctx, _state, _t, { w = 72 } = {}) {
    const seed = 3700;
    eachCell(ctx, 0, 0, w, 24, 24, 24, (x, _y, i) => {
      const r = rng(seed + i * 31);
      band(ctx, x, 0, 24, 19, PLATE);
      if (!simple())
        for (let k = 0; k < 4; k++)
          line(ctx, [[x + 3 + k * 5, 6], [x + 5 + k * 5, 4]], PLATE[3], 0.7);
      rivets(ctx, x, 2.5, 24, 6, PLATE[3]);
      rivets(ctx, x, 16, 24, 6, PLATE[3]);
      G.drips(ctx, x + 1, 3, 22, 14, seed + i * 31 + 1, 2);
      if (r() < 0.5)
        G.rustPatch(ctx, x + 4 + r() * 16, 10, 2.5 + r() * 2, 1.4, seed + i * 31 + 2);
      if (r() < 0.25)
        bulletHoles(ctx, x + 3, 6, 18, 8, 1, seed + i * 31 + 3, PLATE[3]);
    });
    flat(ctx, 0, 19, w, 5, PLATE[4]);
    flat(ctx, 0, 20.5, w, 1, SEAM[1]);
    G.grain(ctx, G.rectRegion(ctx, 0, 0, w, 24), seed + 4);
    G.chips(ctx, 0, 0.4, w, seed + 5);
    tufts(ctx, 0, w, 1, seed + 6, 0.3, 4);
  },
};
const trussWalkway = {
  id: "trussWalkway",
  box: [0, -30, 144, 1],
  draw(ctx, _state, _t, { w = 144 } = {}) {
    const seed = 3800 + round(w);
    eachCell(ctx, 14, -17, w - 28, 13, 24, 13, (x) => {
      strut(ctx, x + 1, -16, x + 23, -4, 2.6, BRONZE);
      strut(ctx, x + 1, -4, x + 23, -16, 2.6, BRONZE);
    });
    band(ctx, 0, -5, w, 5, BRONZE);
    rivets(ctx, 0, -2.5, w, 8, BRONZE[3]);
    flat(ctx, 0, -24, w, 8, STONE[1], STONE[4]);
    flat(ctx, 0, -24, w, 3, GRASS[1]);
    flat(ctx, 0, -24, w, 1, GRASS[2]);
    eachCell(ctx, 0, -21, w, 5, 12, 5, (x, _y, i) => {
      flat(ctx, x + 11, -21, 1, 5, STONE[4]);
      if (rng(seed + i)() < 0.4)
        flat(ctx, x + 1, -20.4, 9, 1, STONE[3]);
    });
    flat(ctx, 0, -16.5, w, 1.4, STONE[4]);
    G.grain(ctx, G.rectRegion(ctx, 0, -24, w, 24), seed + 1);
    eachCell(ctx, 0, -24, w, 24, 96, 24, (x, _y, i) => {
      const cw = min(96, w - x);
      const r = rng(seed + 10 + i);
      G.drips(ctx, x, -16, cw, 12, seed + 11 + i * 3, 3, false);
      G.drips(ctx, x, -5, cw, 6, seed + 12 + i * 3, 2);
      if (r() < 0.6)
        G.rustPatch(ctx, x + r() * cw, -3, 3, 1.2, seed + 13 + i * 3);
      G.chips(ctx, x, -23.6, cw, seed + 14 + i * 3, G.DIRT);
    });
    for (const x of [0, w - 14]) {
      pier(ctx, x, -24, 14, 24, STONE);
      if (!simple())
        for (let y = -20; y < 0; y += 6)
          flat(ctx, x + 1, y, 12, 0.8, STONE[4]);
      G.surface(ctx, x, -24, 14, 24, seed + 20 + x, { rise: 0.4, drip: 1, dripLen: 10 });
    }
    tufts(ctx, 0, w, -23, seed + 30, 0.8, 5);
  },
};
const STOREY = 72;
const windowPane = (ctx, x, y, w, h, seed) => {
  const r = rng(seed);
  flat(ctx, x - 2, y - 2, w + 4, h + 4, CONC[1], CONC[4]);
  flat(ctx, x, y, w, h, HOLE);
  const kind = r();
  if (kind < 0.3) {
    for (let k = 0; k < 3; k++) {
      ctx.save();
      ctx.translate(x + w / 2, y + 3 + (k * (h - 6)) / 2);
      ctx.rotate((r() - 0.5) * 0.3);
      flat(ctx, -w / 2 - 1, -1.8, w + 2, 3.6, k % 2 ? PLANK[2] : PLANK[1], PLANK[4]);
      ctx.restore();
    }
  }
  else if (!simple()) {
    flat(ctx, x + w / 2 - 0.6, y, 1.2, h, CONC[0]);
    flat(ctx, x, y + h / 2 - 0.6, w, 1.2, CONC[0]);
    if (kind > 0.6)
      shape(ctx, [[x, y + h], [x + w * 0.3, y + h * 0.4], [x + w * 0.45, y + h]], "#1c2a2c");
  }
  band(ctx, x - 3, y + h + 1, w + 6, 2.6, CONC);
  G.drips(ctx, x - 2, y + h + 3.6, w + 4, 14, seed + 1, 2);
  if (r() < 0.35)
    soot(ctx, x, y, w, 10);
};
const villageHouse = {
  id: "villageHouse",
  box: [-4, -160, 196, 2],
  draw(ctx, state, _t, { w = 192, h = 144 } = {}) {
    const seed = 3900 + state * 17 + round(w);
    const r = rng(seed);
    const storeys = max(1, round(h / STOREY));
    const sh = h / storeys;
    const ruined = state === 1;
    const roof = ruined ? [[0, -h * 0.72], ...jag(0, w * 0.35, -h, 10, 6, seed + 1), [w * 0.45, -h * 0.8], ...jag(w * 0.5, w, -h * 0.9, 12, 6, seed + 2), [w, -h * 0.7]] : [[0, -h], [w, -h]];
    const body = [[0, 0], ...roof, [w, 0]];
    shape(ctx, body, CONC[2], CONC[4]);
    G.grain(ctx, G.polyRegion(ctx, body), seed + 3);
    G.dirt(ctx, 0, -h, w, h, seed + 4, min(0.3, 48 / h));
    ctx.save();
    path(ctx, body);
    ctx.clip();
    const bays = max(1, round((w - 28) / 44));
    const bw = (w - 28) / bays;
    for (let s = 0; s < storeys; s++) {
      const y0 = -(s + 1) * sh;
      for (let b = 0; b < bays; b++) {
        const x = 14 + b * bw;
        if (s === 0 && b === floor(bays / 2)) {
          if (ruined) {
            const arch = [[x + 4, 0], [x + 4, -sh * 0.55], ...Array.from({ length: 9 }, (_, k) => [x + bw / 2 - cos((k / 8) * PI) * (bw / 2 - 4), -sh * 0.55 - sin((k / 8) * PI) * (bw / 2 - 4) * 0.7]), [x + bw - 4, -sh * 0.55], [x + bw - 4, 0]];
            shape(ctx, arch, HOLE, CONC[4]);
            G.rim(ctx, arch, seed + 5, CONC[3], CONC[4]);
          }
          else {
            flat(ctx, x + bw / 2 - 9, -sh * 0.7, 18, sh * 0.7, HOLE, CONC[4]);
            shape(ctx, [[x + bw / 2 - 9, 0], [x + bw / 2 - 9, -sh * 0.7], [x + bw / 2 - 2, -sh * 0.66], [x + bw / 2 - 2, -2]], PLANK[2], PLANK[4]);
            band(ctx, x + bw / 2 - 12, -sh * 0.7 - 4, 24, 4, CONC);
          }
          continue;
        }
        windowPane(ctx, x + 6, y0 + sh * 0.22, bw - 12, sh * 0.42, seed + 10 + s * 31 + b);
      }
      if (s > 0) {
        band(ctx, -2, y0 + sh - 5, w + 4, 5, CONC);
        G.chips(ctx, -2, y0 + sh - 5, w + 4, seed + 40 + s, G.DIRT);
        G.drips(ctx, 0, y0 + sh, w, sh * 0.4, seed + 41 + s, round(w / 24));
      }
      G.rustPatch(ctx, 20 + r() * (w - 40), y0 + sh * 0.8, 4 + r() * 3, 2, seed + 50 + s);
    }
    for (let b = 0; b <= bays; b++) {
      const x = b === 0 ? 0 : b === bays ? w - 14 : 14 + b * bw - 3;
      const pw = b === 0 || b === bays ? 14 : 6;
      pier(ctx, x, -h, pw, h, CONC, false);
      G.surface(ctx, x, -h, pw, h, seed + 60 + b, { rise: min(0.3, 40 / h), drip: 1, dripLen: 30, edge: false });
    }
    ctx.restore();
    if (ruined) {
      const hole = blob(w * 0.7, -h * 0.55, w * 0.12, sh * 0.32, seed + 70, 14);
      breach(ctx, hole, seed + 71, CONC[3], CONC[4], "#0c1412");
      line(ctx, roof, CONC[4], 1);
      for (const [x, cw, ch] of [[w * 0.2, 10, 6], [w * 0.62, 14, 8], [w * 0.85, 8, 5]])
        shape(ctx, [[x, 0], [x + cw * 0.3, -ch], [x + cw * 0.8, -ch * 0.7], [x + cw, 0]], CONC[1], CONC[4]);
    }
    else {
      band(ctx, -3, -h - 6, w + 6, 6, CONC);
      G.chips(ctx, -3, -h - 6, w + 6, seed + 72, G.DIRT);
      G.drips(ctx, -3, -h, w + 6, 24, seed + 73, round(w / 20));
      if (!simple())
        for (let x = 6; x < w; x += 30 + r() * 20)
          line(ctx, [[x, -h - 6], [x + 1, -h - 10]], RUSTY, 0.7);
    }
    flat(ctx, 0, -4, w, 4, CONC[1], CONC[4]);
  },
};
const stiltBuilding = {
  id: "stiltBuilding",
  box: [-8, -204, 248, 2],
  draw(ctx, state, _t, { w = 240, h = 192 } = {}) {
    const seed = 4000 + state * 19 + round(w);
    const r = rng(seed);
    const burnt = state === 1;
    const stilt = max(24, round((h * 0.38) / 24) * 24);
    const top = -h + 10;
    const legs = [10, w / 2 - 8, w - 26];
    for (const x of legs) {
      pier(ctx, x, -stilt, 16, stilt, CONC);
      G.surface(ctx, x, -stilt, 16, stilt, seed + round(x), { rise: 0.4, drip: 2, dripLen: 24, edge: false });
      flat(ctx, x - 3, -6, 22, 6, CONC[1], CONC[4]);
    }
    strut(ctx, legs[0] + 16, -stilt + 8, legs[1], -12, 2.4, BRONZE);
    strut(ctx, legs[2], -stilt + 8, legs[1] + 16, -12, 2.4, BRONZE);
    const bodyH = -stilt - top;
    planks(ctx, 0, top, w, bodyH, seed + 1);
    band(ctx, -4, -stilt - 8, w + 8, 8, PLANK);
    G.drips(ctx, -4, -stilt, w + 8, 18, seed + 2, round(w / 20));
    const rows = max(1, round(bodyH / 60));
    const rh = bodyH / rows;
    const cols = max(1, round((w - 24) / 26));
    const cw = (w - 24) / cols;
    for (let k = 0; k < rows; k++) {
      const y = top + k * rh + rh * 0.2;
      for (let c = 0; c < cols; c++) {
        const x = 12 + c * cw + 3;
        flat(ctx, x - 1.5, y - 1.5, cw - 3, rh * 0.55 + 3, PLANK[3], PLANK[4]);
        flat(ctx, x, y, cw - 6, rh * 0.55, HOLE);
        if (!simple() && r() < 0.4)
          flat(ctx, x, y, cw - 6, rh * 0.2, "#24302c");
        if (r() < 0.25) {
          ctx.save();
          ctx.translate(x + (cw - 6) / 2, y + rh * 0.3);
          ctx.rotate((r() - 0.5) * 0.5);
          flat(ctx, -cw / 2, -2, cw, 4, PLANK[2], PLANK[4]);
          ctx.restore();
        }
      }
      if (k > 0)
        band(ctx, 0, top + k * rh - 3, w, 4, PLANK);
    }
    for (const x of [0, w / 2 - 5, w - 10]) {
      pier(ctx, x, top, 10, bodyH, PLANK);
      G.surface(ctx, x, top, 10, bodyH, seed + 30 + round(x), { rise: 0.2, edge: false });
    }
    const eave = burnt
      ? [[-8, top], [-6, top - 6], ...jag(0, w * 0.4, top - 10, 6, 6, seed + 40), [w * 0.5, top - 2], ...jag(w * 0.6, w, top - 8, 6, 6, seed + 41), [w + 6, top - 4], [w + 8, top]]
      : [[-8, top], [-4, top - 10], [w + 4, top - 10], [w + 8, top]];
    shape(ctx, eave, BRONZE[1], BRONZE[4]);
    if (!simple())
      for (let x = -4; x < w + 4; x += 5)
        line(ctx, [[x, top - 9.5], [x + 1, top - 0.5]], BRONZE[0], 0.6);
    G.drips(ctx, -8, top, w + 16, 16, seed + 42, round(w / 16));
    G.rustPatch(ctx, w * 0.3, top - 5, 6, 2, seed + 43);
    if (burnt) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      shape(ctx, [[0, -stilt - 8], ...jag(0, w, top + bodyH * 0.35, bodyH * 0.3, 8, seed + 50), [w, -stilt - 8]], BURNT[0]);
      ctx.restore();
      for (let k = 0; k < 3; k++) {
        const hole = blob(w * (0.2 + k * 0.3), top + bodyH * (0.35 + r() * 0.3), 12 + r() * 6, 10 + r() * 6, seed + 51 + k, 12);
        breach(ctx, hole, seed + 55 + k * 3, "#c87a3a", BURNT[0]);
      }
      for (let k = 0; k < 4; k++) {
        const x = w * (0.15 + k * 0.22);
        shape(ctx, [[x, top - 6], [x + 2, top - 24 - r() * 12], [x + 5, top - 6]], BURNT[2], BURNT[4]);
      }
    }
    G.dirt(ctx, 0, top, w, bodyH, seed + 60, 0.25);
  },
};
const insulator = (ctx, x, y, n) => {
  flat(ctx, x - 0.8, y - n * 3, 1.6, n * 3, PORCELAIN[0]);
  for (let k = 0; k < n; k++) {
    flat(ctx, x - 3, y - k * 3 - 2.4, 6, 2, PORCELAIN[2], PORCELAIN[0]);
    if (!simple())
      flat(ctx, x - 3, y - k * 3 - 2.4, 6, 0.6, PORCELAIN[3]);
  }
};
const arc = (ctx, ax, ay, bx, by, seed) => {
  const r = rng(seed);
  const n = 6;
  const pts = [];
  for (let i = 0; i <= n; i++)
    pts.push([ax + ((bx - ax) * i) / n + (i % n ? (r() - 0.5) * 5 : 0), ay + ((by - ay) * i) / n + (i % n ? (r() - 0.5) * 5 : 0)]);
  if (!simple())
    glow(ctx, (ax + bx) / 2, (ay + by) / 2, 12, SPARK[1], 0.35);
  line(ctx, pts, SPARK[0], 2);
  line(ctx, pts, SPARK[2], 0.7);
};
const boltSign = (ctx, cx, cy, s) => {
  shape(ctx, [[cx + 0.1 * s, cy - 0.5 * s], [cx - 0.3 * s, cy + 0.05 * s], [cx, cy + 0.05 * s], [cx - 0.15 * s, cy + 0.5 * s], [cx + 0.3 * s, cy - 0.1 * s], [cx, cy - 0.1 * s], [cx + 0.2 * s, cy - 0.5 * s]], SEAM[2], SEAM[4]);
};
const hvPanel = (ctx, x, y, w, h, seed) => {
  flat(ctx, x, y, w, h, "#16402e", "#06120c");
  flat(ctx, x + 2, y + 2, w - 4, h - 4, "#1e5a3e");
  flat(ctx, x + 2, y + 2, w - 4, 1, "#3a8a62");
  boltSign(ctx, x + w / 2, y + h / 2, min(w, h) * 0.7);
  G.drips(ctx, x, y + h, w, 10, seed, 2);
  G.chips(ctx, x, y + 1, w, seed + 1, G.DIRT);
};
const grille = (ctx, x, y, w, h, seed) => {
  flat(ctx, x - 1.5, y - 1.5, w + 3, h + 3, CONC[1], CONC[4]);
  flat(ctx, x, y, w, h, HOLE);
  for (let k = x + 2; k < x + w - 1; k += 4)
    pier(ctx, k, y, 2.4, h, TUBE, false);
  G.drips(ctx, x, y + h + 1.5, w, 16, seed, 2);
};
const powerHouse = {
  id: "powerHouse",
  box: [-4, -150, 172, 2],
  draw(ctx, state, _t, { w = 168, h = 120 } = {}) {
    const seed = 4100 + state * 23 + round(w);
    const r = rng(seed);
    const broken = state === 1;
    const roof = broken ? [[0, -h], ...jag(4, w * 0.45, -h, 4, 5, seed + 1), [w * 0.5, -h + 14], [w * 0.62, -h + 10], ...jag(w * 0.66, w, -h, 4, 5, seed + 2)] : [[0, -h], [w, -h]];
    const body = [[0, 0], ...roof, [w, 0]];
    shape(ctx, body, CONC[2], CONC[4]);
    G.grain(ctx, G.polyRegion(ctx, body), seed + 3);
    G.drips(ctx, 0, -h, w, h * 0.5, seed + 4, round(w / 14));
    G.dirt(ctx, 0, -h, w, h, seed + 5, 0.3);
    band(ctx, 0, -h * 0.55, w, 4, CONC);
    G.chips(ctx, 0, -h * 0.55, w, seed + 6, G.DIRT);
    const bays = max(2, round(w / 40));
    const bw = w / bays;
    for (let b = 0; b < bays; b++) {
      const x = b * bw;
      if (b === floor(bays / 2)) {
        flat(ctx, x + bw / 2 - 10, -h * 0.5, 20, h * 0.5, "#3a4440", PLATE[4]);
        flat(ctx, x + bw / 2 - 8, -h * 0.48, 16, h * 0.46, "#4c5852");
        hvPanel(ctx, x + bw / 2 - 7, -h * 0.85, 14, 16, seed + 7);
        G.rustPatch(ctx, x + bw / 2, -h * 0.2, 4, 2, seed + 8);
        continue;
      }
      grille(ctx, x + 8, -h * 0.9, bw - 16, h * 0.28, seed + 10 + b);
      grille(ctx, x + 8, -h * 0.45, bw - 16, h * 0.2, seed + 20 + b);
    }
    line(ctx, [[4, -h * 0.6], [w - 4, -h * 0.6]], "#20201c", 1.6);
    for (let x = 10; x < w; x += 24)
      flat(ctx, x, -h * 0.6 - 1.5, 2, 3, TUBE[2]);
    for (const x of [0, w - 12]) {
      pier(ctx, x, -h, 12, h, CONC, false);
      G.surface(ctx, x, -h, 12, h, seed + 30 + round(x), { rise: 0.3, drip: 1, dripLen: 30, edge: false });
    }
    if (broken) {
      for (let k = 0; k < 3; k++) {
        const x = w * (0.48 + k * 0.08);
        line(ctx, [[x, -h + 12], [x + (r() - 0.5) * 10, -h - 6 - r() * 8]], RUSTY, 1);
      }
      arc(ctx, w * 0.5, -h + 8, w * 0.6, -h - 10, seed + 40);
      const hole = blob(w * 0.25, -h * 0.75, 9, 7, seed + 41, 10);
      breach(ctx, hole, seed + 42, CONC[3], CONC[4]);
    }
    else {
      band(ctx, -2, -h - 4, w + 4, 4, CONC);
      for (let x = 16; x < w - 10; x += 28)
        insulator(ctx, x, -h - 4, 3);
      if (!simple())
        curve(ctx, [[16, -h - 13], [w / 2, -h - 8], [w - 12, -h - 13]], "#141410", 0.7);
    }
    flat(ctx, 0, -4, w, 4, CONC[1], CONC[4]);
  },
};
const lampBox = (ctx, x, y, lit, seed) => {
  flat(ctx, x, y, 22, 20, "#2a1e14", "#0a0604");
  flat(ctx, x + 1, y + 1, 20, 1, "#4a3828");
  ctx.fillStyle = color(lit ? AMBER[1] : "#2a2018");
  ctx.beginPath();
  ctx.arc(x + 11, y + 9, 6, PI, 0);
  ctx.fill();
  stroke(ctx, "#0a0604");
  if (lit) {
    if (!simple())
      glow(ctx, x + 11, y + 6, 16, AMBER[2], 0.4);
    flat(ctx, x + 8, y + 5, 3, 1.6, AMBER[3]);
  }
  else
    line(ctx, [[x + 7, y + 4], [x + 11, y + 8], [x + 14, y + 5]], "#5a4a3a", 0.5);
  if (!simple())
    for (let k = 0; k < 3; k++)
      line(ctx, [[x + 6 + k * 5, y + 3], [x + 6 + k * 5, y + 9]], "#140c06", 0.6);
  flat(ctx, x + 4, y + 12, 9, 1.2, AMBER[1]);
  flat(ctx, x + 4, y + 15, 14, 0.9, "#6a5a40");
  flat(ctx, x + 4, y + 17, 11, 0.9, "#6a5a40");
  G.drips(ctx, x + 1, y + 20, 20, 10, seed, 2);
  G.chips(ctx, x, y + 0.4, 22, seed + 1, G.DIRT);
};
const latticeMast = {
  id: "latticeMast",
  box: [-6, -216, 30, 0],
  draw(ctx, state, _t, { h = 216 } = {}) {
    const seed = 4200 + state;
    eachCell(ctx, 0, -h, 24, h, 24, 24, (x, y, _i, j) => {
      flat(ctx, x + 3, y, 18, 24, CRATE[0]);
      strut(ctx, x + 4, y + 1, x + 20, y + 23, 2.6, CRATE);
      strut(ctx, x + 20, y + 1, x + 4, y + 23, 2.6, CRATE);
      flat(ctx, x + 2, y + 22, 20, 2, CRATE[2], CRATE[4]);
      const r = rng(seed + j * 17);
      if (r() < 0.4)
        G.rustPatch(ctx, x + 12, y + 12, 2.5, 2, seed + j * 17 + 1);
    });
    for (const x of [0, 20]) {
      pier(ctx, x, -h, 4, h, CRATE);
      rivets(ctx, x, -h, 4, 4, CRATE[3]);
      G.grain(ctx, G.rectRegion(ctx, x, -h, 4, h), seed + x);
      G.drips(ctx, x, -h, 4, h * 0.6, seed + x + 1, max(1, round(h / 60)), false);
      G.rustPatch(ctx, x + 2, -h * 0.4, 1.6, 3, seed + x + 2);
    }
    if (state === 0)
      for (let y = -48; y > -h + 24; y -= 72)
        lampBox(ctx, 1, y - 20, true, seed + y);
    band(ctx, -4, -6, 32, 6, CRATE);
    G.dirt(ctx, -4, -24, 32, 24, seed + 9, 0.6);
  },
};
const warningLamp = {
  id: "warningLamp",
  box: [-2, -82, 26, -38],
  draw(ctx, state) {
    lampBox(ctx, 1, -62, state === 0, 4300 + state);
    if (state === 1 && !simple())
      bulletHoles(ctx, 4, -60, 14, 6, 2, 4301, "#6a5a40");
  },
};
const junctionBox = {
  id: "junctionBox",
  box: [-4, -64, 28, 0],
  draw(ctx, state) {
    const seed = 4400 + state;
    tube(ctx, 9, -30, 4, 30, TUBE);
    flat(ctx, 6, -10, 10, 3, TUBE[1], TUBE[4]);
    if (state === 1) {
      hvPanel(ctx, 2, -58, 20, 28, seed);
      shape(ctx, [[2, -58], [-3, -55], [-3, -31], [2, -30]], "#1e5a3e", "#06120c");
      flat(ctx, 4, -56, 16, 24, HOLE);
      for (const [x, c] of [[7, "#a8281c"], [11, "#e8c21a"], [15, "#3a7aa0"]])
        curve(ctx, [[x, -56], [x + 1, -46], [x - 2, -36]], c, 0.8);
      G.rim(ctx, [[4, -56], [20, -56], [20, -32], [4, -32]], seed + 1, "#3a8a62", HOLE);
    }
    else
      hvPanel(ctx, 2, -58, 20, 28, seed);
    G.rustPatch(ctx, 16, -34, 3, 1.6, seed + 2);
  },
};
const watchtower = {
  id: "watchtower",
  box: [-6, -184, 94, 0],
  draw(ctx) {
    const seed = 4500;
    const base = -112;
    for (const [a, b] of [[4, 18], [80, 66]]) {
      strut(ctx, a, 0, b, base, 4, PLANK);
      G.drips(ctx, min(a, b), base, 14, 40, seed + a, 1, false);
    }
    for (let k = 0; k < 3; k++) {
      const y0 = -k * 37;
      const y1 = y0 - 37;
      const d0 = 14 * (k / 3);
      const d1 = 14 * ((k + 1) / 3);
      strut(ctx, 4 + d0, y0, 80 - d1, y1, 2, PLANK);
      strut(ctx, 80 - d0, y0, 4 + d1, y1, 2, PLANK);
      flat(ctx, 4 + d1, y1 - 1, 76 - d1 * 2, 3, PLANK[2], PLANK[4]);
    }
    for (const x of [36, 48])
      flat(ctx, x, base, 2, -base, PLANK[3], PLANK[4]);
    for (let y = -8; y > base; y -= 7)
      flat(ctx, 36, y, 14, 1.6, PLANK[2], PLANK[4]);
    planks(ctx, 14, base - 38, 58, 38, seed + 1, true);
    flat(ctx, 22, base - 30, 42, 10, HOLE, PLANK[4]);
    if (!simple())
      for (let x = 26; x < 62; x += 8)
        flat(ctx, x, base - 30, 1.4, 10, PLANK[1]);
    band(ctx, 8, base - 2, 70, 6, PLANK);
    for (let x = 8; x <= 76; x += 17)
      flat(ctx, x, base - 18, 2, 16, PLANK[3], PLANK[4]);
    flat(ctx, 8, base - 18, 70, 2, PLANK[3], PLANK[4]);
    const roof = [[4, base - 38], [43, base - 62], [82, base - 38], [78, base - 36], [43, base - 56], [8, base - 36]];
    shape(ctx, roof, BRONZE[1], BRONZE[4]);
    shape(ctx, [[8, base - 36], [43, base - 56], [78, base - 36]], BRONZE[2]);
    if (!simple())
      for (let x = 14; x < 74; x += 6)
        line(ctx, [[x, base - 36 - (20 * (1 - abs(x - 43) / 35))], [x, base - 36]], BRONZE[0], 0.5);
    G.grain(ctx, G.polyRegion(ctx, roof), seed + 2);
    G.drips(ctx, 8, base - 36, 70, 20, seed + 3, 5);
    G.rustPatch(ctx, 60, base - 42, 5, 2, seed + 4);
    G.dirt(ctx, 14, base - 38, 58, 38, seed + 5, 0.35);
    disc(ctx, 70, base - 26, 2.2, AMBER[1], "#0a0604");
    if (!simple())
      glow(ctx, 70, base - 26, 8, AMBER[2], 0.35);
  },
};
const bronzePipe = {
  id: "bronzePipe",
  box: [-6, -216, 30, 0],
  draw(ctx, _state, _t, { h = 216 } = {}) {
    const seed = 4600;
    pier(ctx, 4, -h, 16, h, BRONZE);
    flat(ctx, 7, -h, 2, h, BRONZE[3]);
    G.grain(ctx, G.rectRegion(ctx, 4, -h, 16, h), seed);
    eachCell(ctx, 4, -h, 16, h, 16, 48, (_x, y, _i, j) => {
      const r = rng(seed + j * 13);
      pier(ctx, 1, y + 20, 22, 6, BRONZE);
      if (!simple())
        for (const bx of [3, 11, 19])
          flat(ctx, bx, y + 22, 1.6, 1.6, BRONZE[3]);
      G.drips(ctx, 2, y + 26, 20, 26, seed + j * 13 + 1, 2);
      if (r() < 0.6) {
        const patch = blob(8 + r() * 8, y + 8 + r() * 10, 3 + r() * 2, 4 + r() * 3, seed + j * 13 + 2, 9);
        ctx.save();
        ctx.globalAlpha = 0.6;
        shape(ctx, patch, "#3a6a4a");
        ctx.restore();
      }
      if (r() < 0.4)
        G.rustPatch(ctx, 12, y + 36, 3, 2, seed + j * 13 + 3);
    });
    G.dirt(ctx, 4, -24, 16, 24, seed + 5, 0.6);
  },
};
const overheadPipeline = {
  id: "overheadPipeline",
  box: [0, -196, 144, -144],
  draw(ctx, _state, _t, { w = 144 } = {}) {
    const seed = 4700;
    const top = -FLOOR_GAP;
    tube(ctx, 0, top + 22, w, 3.4, TUBE);
    tube(ctx, 0, top + 28, w, 3.4, TUBE);
    G.drips(ctx, 0, top + 31.4, w, 12, seed, round(w / 16));
    eachCell(ctx, 0, top, w, 48, 24, 48, (x, _y, i) => {
      hazard(ctx, x + 9, top + 20.5, 6, 12, 2, { fill: "#d07a20", dark: "#1a1208", line: "#2a1806" });
      if (i % 3 === 0) {
        band(ctx, x + 4, top, 16, 20, CONC);
        G.surface(ctx, x + 4, top, 16, 20, seed + i * 7, { rise: 0.3, drip: 1, dripLen: 12 });
        ctx.fillStyle = color(AMBER[1]);
        ctx.beginPath();
        ctx.arc(x + 12, top + 20, 4, PI, 0);
        ctx.fill();
        if (!simple())
          glow(ctx, x + 12, top + 18, 10, AMBER[2], 0.3);
      }
      if (rng(seed + i * 5)() < 0.4)
        G.rustPatch(ctx, x + 18, top + 26, 2.5, 1.4, seed + i * 5 + 1);
    });
  },
};
const transformer = {
  id: "transformer",
  box: [-4, -180, 172, 0],
  draw(ctx) {
    const seed = 4800;
    band(ctx, 0, -14, 168, 14, CONC);
    G.surface(ctx, 0, -14, 168, 14, seed, { rise: 0.5 });
    band(ctx, 8, -128, 120, 114, TRANS);
    G.grain(ctx, G.rectRegion(ctx, 8, -128, 120, 114), seed + 1);
    for (let x = 132; x < 164; x += 5)
      pier(ctx, x, -118, 4, 104, TRANS, false);
    flat(ctx, 128, -120, 38, 4, TRANS[1], TRANS[4]);
    flat(ctx, 128, -20, 38, 4, TRANS[1], TRANS[4]);
    for (let k = 0; k < 6; k++) {
      const y = -110 + k * 15;
      tube(ctx, 50, y, 46, 12, TUBE);
      if (!simple())
        flat(ctx, 52, y + 5.5, 42, 1, TUBE[4]);
    }
    pier(ctx, 46, -114, 4, 96, TUBE);
    pier(ctx, 96, -114, 4, 96, TUBE);
    for (const x of [24, 70, 112]) {
      insulator(ctx, x, -128, 5);
      disc(ctx, x, -146, 2.2, PORCELAIN[1], PORCELAIN[0]);
    }
    if (!simple())
      curve(ctx, [[24, -146], [70, -158], [112, -146]], "#141410", 0.9);
    flat(ctx, 14, -60, 24, 30, TRANS[1], TRANS[4]);
    for (let k = 0; k < 3; k++)
      disc(ctx, 26, -52 + k * 9, 2.4, k === 0 ? "#a8281c" : TRANS[3], TRANS[4]);
    shape(ctx, [[104, -92], [116, -72], [92, -72]], SEAM[2], SEAM[4]);
    boltSign(ctx, 104, -78, 12);
    curve(ctx, [[16, -128], [6, -100], [10, -60], [2, -20]], "#141410", 2);
    curve(ctx, [[120, -128], [128, -150], [140, -176]], "#141410", 1.6);
    G.drips(ctx, 8, -128, 120, 60, seed + 2, 9);
    G.rustPatch(ctx, 30, -96, 6, 3, seed + 3);
    G.rustPatch(ctx, 118, -40, 5, 3, seed + 4);
    G.rustPatch(ctx, 150, -70, 4, 6, seed + 5);
    G.dirt(ctx, 8, -128, 120, 114, seed + 6, 0.3);
    G.chips(ctx, 8, -127.6, 120, seed + 7);
    const leak = blob(80, -12, 22, 2, seed + 8, 10);
    ctx.save();
    ctx.globalAlpha = 0.5;
    shape(ctx, leak, "#0a0806");
    ctx.restore();
  },
};
const horizontalTank = {
  id: "horizontalTank",
  box: [-8, -84, 120, 0],
  draw(ctx) {
    const seed = 4900;
    for (const x of [16, 76]) {
      pier(ctx, x, -18, 8, 18, PLATE);
      flat(ctx, x - 3, -4, 14, 4, PLATE[1], PLATE[4]);
    }
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(12, -66);
      ctx.lineTo(88, -66);
      ctx.ellipse(88, -42, 12, 24, 0, -PI / 2, PI / 2);
      ctx.lineTo(12, -18);
      ctx.ellipse(12, -42, 12, 24, 0, PI / 2, PI * 1.5);
      ctx.closePath();
    };
    body();
    ctx.fillStyle = color(BRONZE[2]);
    ctx.fill();
    stroke(ctx, BRONZE[4]);
    ctx.save();
    body();
    ctx.clip();
    flat(ctx, 0, -66, 100, 8, BRONZE[3]);
    flat(ctx, 0, -58, 100, 3, "#d8b07a");
    flat(ctx, 0, -30, 100, 12, BRONZE[1]);
    flat(ctx, 0, -22, 100, 4, BRONZE[0]);
    for (const x of [22, 50, 78])
      flat(ctx, x, -66, 2, 48, BRONZE[1]);
    G.grain(ctx, G.rectRegion(ctx, 0, -66, 100, 48), seed);
    G.drips(ctx, 0, -50, 100, 30, seed + 1, 6);
    G.rustPatch(ctx, 36, -34, 7, 3, seed + 2);
    G.rustPatch(ctx, 70, -56, 4, 2, seed + 3);
    G.dirt(ctx, 0, -66, 100, 48, seed + 4, 0.35);
    ctx.restore();
    for (const [a, b] of [[[0, -42], [-6, -70]], [[100, -42], [106, -14]]]) {
      const mid = [a[0] + (b[0] - a[0]) * 1.4, (a[1] + b[1]) / 2];
      curve(ctx, [a, mid, b], BRONZE[4], 6);
      curve(ctx, [a, mid, b], BRONZE[2], 4);
      curve(ctx, [a, mid, b], BRONZE[3], 1.2);
    }
    flat(ctx, 44, -72, 12, 6, BRONZE[1], BRONZE[4]);
    disc(ctx, 64, -66, 4, TUBE[3], TUBE[4]);
    if (!simple())
      line(ctx, [[64, -66], [66.5, -68]], "#a8281c", 0.7);
  },
};
const storageTank = {
  id: "storageTank",
  box: [-4, -96, 68, 0],
  draw(ctx) {
    const seed = 5000;
    pier(ctx, 4, -66, 48, 62, BRONZE);
    for (let y = -62; y < -4; y += 12) {
      flat(ctx, 4, y, 48, 1.4, BRONZE[4]);
      rivets(ctx, 4, y + 2.2, 48, 5, BRONZE[3]);
    }
    shape(ctx, [[2, -66], [10, -76], [46, -76], [54, -66]], BRONZE[1], BRONZE[4]);
    flat(ctx, 22, -80, 12, 4, BRONZE[2], BRONZE[4]);
    flat(ctx, 0, -6, 56, 6, CONC[1], CONC[4]);
    G.grain(ctx, G.rectRegion(ctx, 4, -76, 48, 72), seed);
    G.drips(ctx, 4, -66, 48, 40, seed + 1, 5);
    G.rustPatch(ctx, 18, -30, 6, 4, seed + 2);
    G.rustPatch(ctx, 40, -54, 4, 2, seed + 3);
    G.dirt(ctx, 4, -66, 48, 62, seed + 4, 0.35);
    tube(ctx, 52, -88, 5, 84, TUBE);
    flat(ctx, 50, -60, 9, 3, TUBE[1], TUBE[4]);
    disc(ctx, 54.5, -92, 2.4, AMBER[1], "#0a0604");
    if (!simple())
      glow(ctx, 54.5, -92, 8, AMBER[2], 0.35);
    G.drips(ctx, 52, -84, 5, 50, seed + 5, 1);
  },
};
const powerPlant = {
  id: "powerPlant",
  box: [-4, -272, 388, 0],
  draw(ctx) {
    const seed = 5100;
    band(ctx, 0, -18, 384, 18, CONC);
    G.surface(ctx, 0, -18, 384, 18, seed, { rise: 0.5, drip: 6, dripLen: 10 });
    const towers = [40, 172, 304];
    for (const x of towers) {
      eachCell(ctx, x, -264, 24, 246, 24, 24, (cx, cy, _i, j) => {
        strut(ctx, cx + 3, cy + 1, cx + 21, cy + 23, 2.2, CRATE);
        strut(ctx, cx + 21, cy + 1, cx + 3, cy + 23, 2.2, CRATE);
        if (rng(seed + x + j)() < 0.3)
          G.rustPatch(ctx, cx + 12, cy + 12, 2.5, 2, seed + x + j);
      });
      for (const px of [x, x + 20]) {
        pier(ctx, px, -264, 4, 246, CRATE);
        G.grain(ctx, G.rectRegion(ctx, px, -264, 4, 246), seed + px);
        G.drips(ctx, px, -264, 4, 60, seed + px, 2, false);
      }
      if (x !== towers[1])
        lampBox(ctx, x + 1, -150, true, seed + x + 3);
    }
    for (const y of [-232, -200]) {
      band(ctx, 30, y, 324, 8, CRATE);
      rivets(ctx, 30, y + 4, 324, 10, CRATE[3]);
      G.drips(ctx, 30, y + 8, 324, 14, seed + 10 - y, 14);
    }
    for (let x = 56; x < 340; x += 36)
      insulator(ctx, x, -232, 4);
    for (let x = 56; x < 340; x += 72)
      arc(ctx, x, -246, x + 36, -246, seed + x);
    for (let x = 60; x < 340; x += 48)
      if (!simple())
        curve(ctx, [[x, -200], [x + 24, -186], [x + 48, -200]], "#141410", 0.8);
    for (let b = 0; b < 2; b++) {
      const x = 78 + b * 40;
      for (let k = 0; k < 6; k++)
        tube(ctx, x, -114 + k * 15, 30, 12, TUBE);
      pier(ctx, x + 12, -130, 6, 112, TUBE);
      insulator(ctx, x + 15, -130, 4);
    }
    arc(ctx, 93, -148, 133, -148, seed + 30);
    pier(ctx, 210, -100, 54, 82, PLATE);
    for (let k = 0; k < 2; k++)
      grille(ctx, 216, -92 + k * 34, 42, 22, seed + 40 + k);
    hvPanel(ctx, 230, -128, 14, 18, seed + 44);
    G.grain(ctx, G.rectRegion(ctx, 210, -100, 54, 82), seed + 45);
    const dome = () => {
      ctx.beginPath();
      ctx.moveTo(322, -18);
      ctx.lineTo(322, -96);
      ctx.ellipse(350, -96, 28, 22, 0, PI, 0);
      ctx.lineTo(378, -18);
      ctx.closePath();
    };
    dome();
    ctx.fillStyle = color(TUBE[1]);
    ctx.fill();
    stroke(ctx, TUBE[4]);
    ctx.save();
    dome();
    ctx.clip();
    flat(ctx, 322, -118, 10, 100, TUBE[2]);
    flat(ctx, 326, -118, 3, 100, TUBE[3]);
    flat(ctx, 366, -118, 12, 100, TUBE[0]);
    for (let y = -90; y < -18; y += 18)
      flat(ctx, 322, y, 56, 1.2, TUBE[4]);
    G.grain(ctx, G.rectRegion(ctx, 322, -118, 56, 100), seed + 50);
    G.drips(ctx, 322, -100, 56, 50, seed + 51, 6);
    G.rustPatch(ctx, 340, -60, 7, 4, seed + 52);
    G.dirt(ctx, 322, -118, 56, 100, seed + 53, 0.3);
    ctx.restore();
    tube(ctx, 140, -146, 200, 7, BRONZE);
    for (const x of [150, 290])
      pier(ctx, x, -139, 6, 121, BRONZE);
    G.drips(ctx, 140, -139, 200, 20, seed + 60, 8);
    G.rustPatch(ctx, 250, -142, 5, 2, seed + 61);
  },
};
const rockCliff = {
  id: "rockCliff",
  box: [0, -200, 144, 0],
  draw(ctx, _state, _t, { w = 144, h = 192 } = {}) {
    const seed = 5200 + round(w + h * 3);
    const slope = [[0, 0], [0, -h], [w * 0.25, -h + 8], [w, -6], [w, 0]];
    eachCell(ctx, 0, -h, w, h, 26, 20, (x, y, i, j) => {
      const r = rng(cellSeed(seed, i, j));
      const cx = x + 13 + (r() - 0.5) * 8;
      const cy = y + 10 + (r() - 0.5) * 6;
      const u = cx / w;
      const edge = u < 0.25 ? -h + 8 * (u / 0.25) : -h + 8 + (h - 14) * ((u - 0.25) / 0.75);
      if (cy < edge - 4)
        return;
      boulder(ctx, cx, cy, 13 + r() * 5, 9 + r() * 4, cellSeed(seed, i, j) + 1);
      if (!simple() && r() < 0.35)
        flat(ctx, cx - 6, cy - 9, 8 + r() * 6, 1.8, LEAF[2]);
      if (r() < 0.3)
        G.drips(ctx, cx - 6, cy + 4, 12, 10, cellSeed(seed, i, j) + 2, 1, false);
    });
    G.grain(ctx, G.polyRegion(ctx, slope), seed + 1, 0.7);
    G.dirt(ctx, 0, -h, w, h, seed + 2, min(0.3, 50 / h));
    tufts(ctx, 0, w, 0, seed + 3, 0.6, 6);
  },
};
const rubbleHeap = {
  id: "rubbleHeap",
  box: [-4, -48, 100, 2],
  draw(ctx, state) {
    const seed = 5300 + state * 11;
    const r = rng(seed);
    const heap = [[-2, 0], [6, -10], [20, -20], [36, -30], [52, -34], [66, -26], [80, -14], [94, 0]];
    G.scorch(ctx, heap, seed + 1);
    shape(ctx, heap, state === 1 ? CONC[1] : STONE[1], STONE[4]);
    G.grain(ctx, G.polyRegion(ctx, heap), seed + 2);
    if (state === 1) {
      for (let k = 0; k < 5; k++) {
        const x = 8 + k * 16 + r() * 4;
        const y = -6 - sin((x / 92) * PI) * 22 * (0.5 + r() * 0.5);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((r() - 0.5) * 1.2);
        band(ctx, -9, -4, 18 + r() * 6, 7, CONC);
        G.chips(ctx, -9, -4, 18, seed + 10 + k, G.DIRT);
        ctx.restore();
      }
      if (!simple())
        for (let k = 0; k < 6; k++) {
          const x = 14 + r() * 66;
          line(ctx, [[x, -10 - r() * 10], [x + (r() - 0.5) * 14, -24 - r() * 14]], RUSTY, 0.8);
        }
    }
    else {
      for (let k = 0; k < 9; k++) {
        const x = 8 + r() * 78;
        const y = -4 - sin((x / 92) * PI) * 26 * r();
        boulder(ctx, x, y, 5 + r() * 6, 4 + r() * 4, seed + 20 + k);
      }
    }
    G.dirt(ctx, -2, -34, 96, 34, seed + 3, 0.5);
    tufts(ctx, 0, 92, 0, seed + 4, 0.4, 4);
  },
};
const clipped = (ctx, pts, draw) => {
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  draw();
  ctx.restore();
};
const tyre = (ctx, cx, cy, rad, flatK) => {
  ctx.fillStyle = color("#141412");
  ctx.beginPath();
  ctx.ellipse(cx, cy + rad * flatK * 0.15, rad, rad * (1 - flatK * 0.15), 0, 0, PI * 2);
  ctx.fill();
  stroke(ctx, "#060604");
  disc(ctx, cx, cy, rad * 0.5, OLIVE[1], OLIVE[4]);
  disc(ctx, cx, cy, rad * 0.18, OLIVE[3]);
};
const glassHole = (ctx, pts, seed) => {
  shape(ctx, pts, "#101818");
  if (!simple())
    shape(ctx, [pts[0], pts[1], [(pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2]], "#2c3c3e");
  G.rim(ctx, pts, seed, "#8aa0a0", "#060808");
};
const armyTruck = (ctx, seed) => {
  const cab = [[96, -8], [96, -50], [116, -50], [126, -34], [134, -32], [134, -8]];
  shape(ctx, cab, OLIVE[2], OLIVE[4]);
  glassHole(ctx, [[104, -46], [115, -46], [122, -35], [104, -35]], seed);
  band(ctx, 0, -18, 98, 10, OLIVE);
  const tarp = [[2, -18], [2, -44], [10, -54], [40, -56], [62, -52], [70, -60], [92, -54], [96, -46], [96, -18]];
  shape(ctx, tarp, "#4a4a2c", OLIVE[4]);
  for (const x of [12, 34, 56, 80])
    line(ctx, [[x, -18], [x, -52]], "#3a3a22", 1);
  const rip = [[44, -50], [62, -48], [68, -34], [50, -28], [40, -38]];
  shape(ctx, rip, HOLE);
  G.rim(ctx, rip, seed + 1, "#7a7a50", HOLE);
  for (const x of [48, 58])
    line(ctx, [[x, -50], [x, -28]], "#5a3a1a", 1.2);
  clipped(ctx, [...cab, ...tarp.slice().reverse()], () => G.wagon(ctx, 0, -56, 134, 48, seed + 2));
  clipped(ctx, [[0, -18], [98, -18], [98, -8], [0, -8]], () => G.wagon(ctx, 0, -18, 98, 10, seed + 4));
  for (const [x, f] of [[22, 0.6], [40, 0.4], [114, 0.2]])
    tyre(ctx, x, -9, 9, f);
  flat(ctx, 130, -16, 6, 4, OLIVE[1], OLIVE[4]);
  G.scorch(ctx, [[100, -40], [130, -38], [132, -12], [98, -14]], seed + 3);
};
const burntJeep = (ctx, seed) => {
  const body = [[10, -8], [10, -26], [24, -28], [30, -36], [58, -36], [66, -28], [86, -26], [88, -8]];
  shape(ctx, body, BURNT[2], BURNT[4]);
  line(ctx, [[30, -36], [34, -50], [40, -50]], BURNT[3], 1.6);
  for (const x of [36, 48])
    line(ctx, [[x, -36], [x + 4, -44]], BURNT[1], 2);
  flat(ctx, 12, -14, 74, 3, BURNT[1]);
  clipped(ctx, body, () => G.wagon(ctx, 10, -36, 78, 28, seed));
  G.scorch(ctx, body, seed + 1);
  for (const x of [24, 72]) {
    disc(ctx, x, -7, 7, BURNT[0], BURNT[4]);
    disc(ctx, x, -7, 3, RUSTY);
  }
  flat(ctx, 16, -4, 8, 4, STONE[1], STONE[4]);
  flat(ctx, 66, -4, 10, 4, STONE[1], STONE[4]);
  G.rustPatch(ctx, 50, -22, 7, 3, seed + 2);
};
const halfTrack = (ctx, seed) => {
  const hull = [[4, -12], [10, -34], [36, -40], [104, -40], [122, -26], [126, -12]];
  shape(ctx, hull, OLIVE[2], OLIVE[4]);
  flat(ctx, 48, -48, 30, 8, OLIVE[1], OLIVE[4]);
  line(ctx, [[78, -45], [104, -52]], "#1a1a14", 2.6);
  line(ctx, [[104, -52], [112, -60]], "#1a1a14", 2.6);
  flat(ctx, 16, -30, 18, 2, OLIVE[3]);
  shape(ctx, [[4, -12], [6, -2], [80, -2], [84, -12]], "#1a1a14", "#060604");
  for (let x = 12; x < 80; x += 12)
    disc(ctx, x, -7, 4, OLIVE[1], OLIVE[4]);
  tyre(ctx, 108, -9, 9, 0.5);
  const hole = [[58, -34], [70, -36], [74, -24], [62, -18], [54, -24]];
  breach(ctx, hole, seed, OLIVE[3], OLIVE[4]);
  clipped(ctx, hull, () => G.wagon(ctx, 4, -40, 122, 28, seed + 3));
};
const militaryWreck = {
  id: "militaryWreck",
  box: [-4, -64, 140, 2],
  draw(ctx, state) {
    const seed = 5400 + state * 9;
    ctx.save();
    ctx.globalAlpha = 0.4;
    flat(ctx, 0, -2, 136, 3, HOLE);
    ctx.restore();
    if (state === 1)
      burntJeep(ctx, seed);
    else if (state === 2)
      halfTrack(ctx, seed);
    else
      armyTruck(ctx, seed);
  },
};
const drum = (ctx, x, y, seed, burst = false) => {
  pier(ctx, x, y, 14, 20, OLIVE);
  for (const k of [4, 10, 16])
    flat(ctx, x, y + k, 14, 1.2, OLIVE[4]);
  flat(ctx, x - 0.6, y - 1, 15.2, 2, OLIVE[3], OLIVE[4]);
  flat(ctx, x + 4, y + 7, 6, 4, SEAM[1]);
  G.grain(ctx, G.rectRegion(ctx, x, y, 14, 20), seed);
  G.drips(ctx, x, y + 1, 14, 14, seed + 1, 2);
  G.rustPatch(ctx, x + 4 + rng(seed)() * 6, y + 15, 3, 1.6, seed + 2);
  if (burst) {
    const tear = [[x + 2, y - 1], [x + 6, y + 5], [x + 9, y + 2], [x + 12, y + 6], [x + 13, y - 1]];
    shape(ctx, tear, HOLE);
    G.rim(ctx, tear, seed + 3, OLIVE[3], HOLE);
    ctx.save();
    ctx.globalAlpha = 0.6;
    shape(ctx, blob(x + 18, y + 19.5, 10, 1.4, seed + 4, 9), "#0a0806");
    ctx.restore();
  }
};
const fuelDrum = {
  id: "fuelDrum",
  box: [-4, -30, 46, 2],
  draw(ctx, state) {
    const seed = 5500 + state * 7;
    if (state === 1) {
      drum(ctx, 0, -20, seed);
      drum(ctx, 15, -20, seed + 10);
      ctx.save();
      ctx.translate(30, -7);
      ctx.rotate(-PI / 2);
      drum(ctx, -7, -6, seed + 20);
      ctx.restore();
    }
    else
      drum(ctx, 6, -20, seed, state === 2);
    G.dirt(ctx, -2, -8, 46, 8, seed + 30, 0.7);
  },
};
const sack = (ctx, x, y, w, seed) => {
  const r = rng(seed);
  const pts = [[x + 2, y], [x + w - 2, y - 0.6], [x + w, y + 3], [x + w - 1, y + 7], [x + 1, y + 7.4], [x, y + 3]];
  shape(ctx, pts, r() < 0.4 ? SACK[1] : SACK[2], SACK[4]);
  if (!simple()) {
    flat(ctx, x + 2, y + 1, w - 4, 1, SACK[3]);
    line(ctx, [[x + w * 0.5, y + 0.5], [x + w * 0.5, y + 7]], SACK[0], 0.5);
  }
  G.grain(ctx, G.polyRegion(ctx, pts), seed + 1);
};
const sandbags = {
  id: "sandbags",
  box: [-4, -28, 60, 2],
  draw(ctx, state) {
    const seed = 5600 + state * 5;
    const rows = state === 1 ? [5, 5] : [3, 2, 1];
    rows.forEach((n, j) => {
      const off = ((rows[0] - n) * 11) / 2;
      for (let i = 0; i < n; i++)
        sack(ctx, off + i * 11, -7.4 - j * 7, 12, seed + j * 10 + i);
    });
    const spill = blob(state === 1 ? 50 : 30, -1, 7, 1.6, seed + 40, 9);
    shape(ctx, spill, SACK[2]);
    G.dirt(ctx, -2, -20, 60, 20, seed + 41, 0.5);
  },
};
const shell = (ctx, x, y, len) => {
  tube(ctx, x, y, len, 4.4, OLIVE);
  shape(ctx, [[x + len, y], [x + len + 4, y + 2.2], [x + len, y + 4.4]], "#8a8a80", "#1a1a16");
  flat(ctx, x, y, 2.4, 4.4, SEAM[1]);
};
const shellCrate = {
  id: "shellCrate",
  box: [-4, -32, 54, 2],
  draw(ctx, state) {
    const seed = 5700 + state * 3;
    const lid = (x, y, w, h, s) => {
      band(ctx, x, y, w, h, CRATE);
      for (const k of [3, w - 5])
        flat(ctx, x + k, y, 2, h, CRATE[4]);
      if (!simple()) {
        flat(ctx, x + w * 0.35, y + h * 0.35, w * 0.3, 1, SEAM[1]);
        flat(ctx, x + w * 0.35, y + h * 0.55, w * 0.2, 1, SEAM[1]);
      }
      G.grain(ctx, G.rectRegion(ctx, x, y, w, h), s);
      G.chips(ctx, x, y + 0.4, w, s + 1, G.DIRT);
    };
    if (state === 1) {
      lid(0, -10, 40, 10, seed);
      flat(ctx, 2, -10, 36, 3, HOLE);
      ctx.save();
      ctx.translate(30, -12);
      ctx.rotate(-0.5);
      lid(0, -2, 20, 3, seed + 5);
      ctx.restore();
      for (let k = 0; k < 3; k++)
        shell(ctx, 4 + k * 13, -15, 8);
      shell(ctx, 40, -4.4, 8);
    }
    else {
      lid(0, -10, 44, 10, seed);
      lid(4, -20, 38, 10, seed + 5);
      shell(ctx, 30, -24.4, 12);
      G.drips(ctx, 0, -10, 44, 8, seed + 9, 3, false);
    }
    G.dirt(ctx, -2, -10, 50, 10, seed + 10, 0.6);
  },
};
const brazier = {
  id: "brazier",
  box: [-14, -78, 30, 0],
  draw(ctx) {
    const seed = 5800;
    strut(ctx, 1, 0, 6, -34, 1.8, PLATE);
    strut(ctx, 13, 0, 8, -34, 1.8, PLATE);
    strut(ctx, 7, 0, 7, -34, 1.8, PLATE);
    shape(ctx, [[-2, -46], [16, -46], [12, -34], [2, -34]], "#1a1410", "#0a0806");
    for (let k = 0; k < 5; k++)
      line(ctx, [[k * 4 - 1, -46], [2 + k * 2.4, -34]], "#3a2a1a", 0.8);
    flat(ctx, -1, -42, 16, 4, FIRE[0]);
    G.rustPatch(ctx, 7, -38, 4, 2, seed);
    G.drips(ctx, 2, -34, 10, 18, seed + 1, 2);
    frozenFire(ctx, -2, -45, 18, 24, seed + 2);
  },
};
const warningSign = {
  id: "warningSign",
  box: [-4, -56, 30, 0],
  draw(ctx, state) {
    const seed = 5900 + state;
    pier(ctx, 10, -34, 3, 34, PLATE);
    G.drips(ctx, 10, -34, 3, 20, seed, 1);
    ctx.save();
    ctx.translate(11.5, -42);
    ctx.rotate(0.06 - state * 0.05);
    flat(ctx, -11, -10, 22, 18, "#a8a496", "#1a1a16");
    flat(ctx, -10, -9, 20, 1, "#c8c4b6");
    if (state === 0) {
      shape(ctx, [[0, -8], [8, 5], [-8, 5]], SEAM[2], "#1a1a16");
      boltSign(ctx, 0, 0.5, 8);
    }
    else if (state === 1) {
      disc(ctx, 0, -2, 5, "#1a1a16");
      flat(ctx, -3, 2, 6, 3, "#1a1a16");
      for (const x of [-2, 2])
        disc(ctx, x, -2.4, 1.3, "#a8a496");
      line(ctx, [[-7, 6], [7, -9]], "#a8281c", 1.6);
    }
    else {
      shape(ctx, [[-7, -3], [2, -3], [2, -7], [8, -1], [2, 5], [2, 1], [-7, 1]], "#a8281c", "#1a1a16");
    }
    G.grain(ctx, G.rectRegion(ctx, -11, -10, 22, 18), seed + 1);
    G.drips(ctx, -11, -9, 22, 14, seed + 2, 3);
    G.rustPatch(ctx, 6, 5, 3, 1.6, seed + 3);
    bulletHoles(ctx, -9, -8, 18, 14, 2, seed + 4, "#c8c4b6");
    ctx.restore();
  },
};
const vesniceSceneryAssets = [
  villageBackdrop, farPalms, farRuins, crateWall, rivetWall, plankWall, ammoDepot, villageFence, grassyWalkway, steelDeckPlate, trussWalkway, villageHouse, stiltBuilding, powerHouse,
  latticeMast, warningLamp, junctionBox, watchtower, bronzePipe, overheadPipeline, transformer, horizontalTank, storageTank, powerPlant, rockCliff, rubbleHeap, militaryWreck, fuelDrum,
  sandbags, shellCrate, brazier, warningSign,
];
const VESNICE_IDS = [
  "villageBackdrop", "farPalms", "farRuins", "crateWall", "rivetWall", "plankWall", "ammoDepot", "villageFence", "grassyWalkway", "steelDeckPlate", "trussWalkway", "villageHouse", "stiltBuilding", "powerHouse", "latticeMast", "warningLamp", "junctionBox", "watchtower", "bronzePipe", "overheadPipeline", "transformer", "horizontalTank", "storageTank", "powerPlant", "rockCliff", "rubbleHeap", "militaryWreck", "fuelDrum", "sandbags", "shellCrate", "brazier", "warningSign",
  "sourceTeleport", "targetTeleport", "teleportPad", "brokenTeleport", "fuseBox", "electricCabinet", "cannon", "fireBarricade", "dynamiteWall", "energyBarrier", "powerBridge",
  "bridgeGuardPost", "smoulderingRemains", "smallKey", "walkieTalkie", "detonator", "projectileCrate", "projectile", "fuse", "dynamite", "navCircuit", "toaster", "energyPickup",
  "ammoPickup", "shieldPickup",
];
for (const asset of vesniceSceneryAssets) define(asset);

const { box, cylV, poly } = P;
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
      G.drips(ctx, x, -64, 12, 30, 932 + x, 2);
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
    G.rustPatch(ctx, 60, -24, 4, 2, 955);
    G.chips(ctx, 0, -99.6, 120, 956, G.DIRT);
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
    G.rustPatch(ctx, 103, -60, 3, 5, 1013);
    G.chips(ctx, 0, -149.6, 110, 1014, G.DIRT);
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
        G.rustPatch(ctx, x + d * 11, 2, 4, 1.4, 1034 + x);
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
    G.grain(ctx, G.rectRegion(ctx, 0, 0, 288, 10), 1030);
    G.drips(ctx, 0, 3.6, 288, 6, 1031, 12);
    G.chips(ctx, 0, 0.2, 288, 1032, G.DIRT);
    for (const x of [0, 280]) G.rustPatch(ctx, x + 4, 3, 2.5, 2, 1033 + x);
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
    G.rustPatch(ctx, -2, -18, 2.5, 4, 1022);
    G.chips(ctx, -4, -146, 30, 1023, G.DIRT);
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
  sourceTeleport, targetTeleport, teleportPad, brokenTeleport, fuseBox, electricCabinet, cannon, fireBarricade, dynamiteWall, energyBarrier, powerBridge, bridgeGuardPost,
  smoulderingRemains, smallKey, walkieTalkie, detonator, projectileCrate, projectile, fuse, dynamite, navCircuit, toaster, energyPickup, ammoPickup, shieldPickup,
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
