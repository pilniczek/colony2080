(() => {
const { define, P, G } = window.ENV;
const { color, flat, disc, line, curve, shape, stroke, lw, glow, mesh, rng } = P;
const { PI, sin, cos } = Math;
const simple = () => window.ENV.simple;

const KHAKI = { edge: "#14100a", dark: "#3a301a", olive: "#545c3c", mid: "#786c54", lit: "#a89a72", hi: "#cfc39a" };
const RUSTY = { edge: "#1c0e06", dark: "#3a1e0c", mid: "#6c401c", lit: "#a0582a", hi: "#c87a3c" };
const TUBE = { edge: "#2a2418", shade: "#8a8268", body: "#bcb498", hi: "#ece6cc" };
const SCRAP = { back: "#2a2014", deep: "#18120a", mesh: "#3c403c", cable: "#7aa8a4", cableHi: "#b8dcd6" };

const scuff = (ctx, x, w) => {
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = color("hole");
  ctx.beginPath();
  ctx.ellipse(x + w / 2, -0.5, w / 2, 0.9, 0, 0, PI * 2);
  ctx.fill();
  ctx.restore();
  if (simple()) return;
  for (const [dx, s] of [[0.15, 1], [0.55, 0.8], [0.8, 1.2]]) flat(ctx, x + w * dx, -1.4 * s, s, s * 0.8, "k2");
};

const shadow = (ctx, cx, w, alpha = 0.4) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color("hole");
  ctx.beginPath();
  ctx.ellipse(cx, -0.3, w / 2, 0.9, 0, 0, PI * 2);
  ctx.fill();
  ctx.restore();
};

const outlined = (ctx, pts, w, c, edge, k = 1.4) => {
  const e = lw(ctx, k);
  if (e) line(ctx, pts, edge, w + e);
  line(ctx, pts, c, w);
};

function tube(ctx, pts) {
  outlined(ctx, pts, 2.6, TUBE.body, TUBE.edge);
  if (simple()) return;
  line(ctx, pts.map(([x, y]) => [x + 0.5, y + 0.6]), TUBE.shade, 0.8);
  line(ctx, pts.map(([x, y]) => [x - 0.4, y - 0.5]), TUBE.hi, 0.6);
}

function limb(ctx, pts, w, olive = false) {
  outlined(ctx, pts, w, olive ? KHAKI.olive : KHAKI.mid, KHAKI.edge, 1.6);
  if (!simple()) line(ctx, pts.map(([x, y]) => [x - w * 0.15, y - w * 0.2]), olive ? KHAKI.mid : KHAKI.lit, w * 0.35);
  for (const [x, y] of pts.slice(1, -1)) {
    disc(ctx, x, y, w * 0.62, KHAKI.dark, "kLine");
    if (!simple()) disc(ctx, x - w * 0.15, y - w * 0.18, w * 0.25, KHAKI.lit);
  }
}

function plate(ctx, pts, olive = false) {
  shape(ctx, pts, olive ? KHAKI.olive : KHAKI.mid, "kLine");
  if (simple()) return;
  ctx.save();
  P.path(ctx, pts);
  ctx.clip();
  const ys = pts.map(p => p[1]), xs = pts.map(p => p[0]);
  const y0 = Math.min(...ys), y1 = Math.max(...ys), x0 = Math.min(...xs), x1 = Math.max(...xs);
  flat(ctx, x0, y0, x1 - x0, (y1 - y0) * 0.28, olive ? KHAKI.mid : KHAKI.lit);
  flat(ctx, x0, y1 - (y1 - y0) * 0.3, x1 - x0, (y1 - y0) * 0.3, KHAKI.dark);
  ctx.restore();
}

function claw(ctx, x, y, angle, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(s, s);
  plate(ctx, [[-2.4, -2], [2.6, -2.4], [3.4, 0], [2.6, 2.4], [-2.4, 2]], true);
  for (const dy of [-1.6, 0, 1.6]) limb(ctx, [[3, dy], [5.6, dy * 1.5], [7.4, dy * 1.2 + 0.8]], 0.9);
  ctx.restore();
}

function head(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  plate(ctx, [[-6, -4.4], [3.6, -5.6], [6.4, -2.6], [6, 3.4], [-5.4, 4]]);
  flat(ctx, -2, -1.4, 7.4, 1.6, SCRAP.deep, "kLine");
  if (!simple()) flat(ctx, 0.4, -1, 2, 0.8, "#5a2a1a");
  ctx.restore();
}

function hole(ctx, pts, seed) {
  G.scorch(ctx, pts, seed);
  shape(ctx, pts, SCRAP.deep);
  if (!simple()) G.rim(ctx, pts, seed + 1, KHAKI.hi, SCRAP.deep);
}

function rustBar(ctx, a, b, w) {
  outlined(ctx, [a, b], w, RUSTY.mid, RUSTY.edge, 1.5);
  if (simple()) return;
  line(ctx, [[a[0], a[1] - w * 0.3], [b[0], b[1] - w * 0.3]], RUSTY.lit, w * 0.3);
  line(ctx, [[a[0], a[1] + w * 0.32], [b[0], b[1] + w * 0.32]], RUSTY.dark, w * 0.25);
}

function cable(ctx, pts) {
  const e = lw(ctx, 1.2);
  if (e) curve(ctx, pts, KHAKI.edge, 0.9 + e);
  curve(ctx, pts, SCRAP.cable, 0.9);
  if (!simple()) curve(ctx, pts.map(([x, y]) => [x - 0.2, y - 0.25]), SCRAP.cableHi, 0.3);
}

const HEAP = [[0, 0], [3, -18], [8, -34], [16, -48], [30, -56], [46, -62], [62, -70], [78, -80], [94, -88], [110, -90], [124, -86], [136, -76], [142, -62], [144, -44], [144, 0]];
const LOW = [[0, 0], [6, -10], [16, -20], [30, -28], [46, -34], [62, -38], [78, -36], [90, -28], [96, -14], [96, 0]];

function mound(ctx, pts, seed, w) {
  shape(ctx, pts, SCRAP.back, "kLine");
  const r = rng(seed);
  const piece = (x, y, s) => {
    const a = r() * PI;
    const q = [0, 1, 2, 3].map(i => {
      const k = a + i * PI / 2 + (r() - 0.5) * 0.6;
      const d = s * (0.6 + r() * 0.5) * (i % 2 ? 0.5 : 1);
      return [x + cos(k) * d, y + sin(k) * d];
    });
    plate(ctx, q, r() < 0.45);
  };
  ctx.save();
  P.path(ctx, pts);
  ctx.clip();
  for (let i = 0; i < (simple() ? 26 : 60); i++) piece(r() * w, -r() * 92, 4 + r() * 6);
  for (let i = 0; i < (simple() ? 6 : 14); i++) {
    const x = r() * w, y = -r() * 80, a = r() * PI * 2, l = 8 + r() * 10;
    limb(ctx, [[x, y], [x + cos(a) * l, y + sin(a) * l]], 2.4 + r() * 1.6, r() < 0.5);
  }
  ctx.restore();
  for (let i = 1; i < pts.length - 2; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    piece((x0 + x1) / 2, (y0 + y1) / 2 + 1, 4 + r() * 3);
  }
}

function grime(ctx, pts, w, h, seed) {
  const region = G.polyRegion(ctx, pts);
  G.inside(ctx, region, () => {
    G.grain(ctx, region, seed, simple() ? 0.6 : 0.9);
    G.dirt(ctx, 0, -h, w, h, seed + 1, 0.4);
    G.rustPatch(ctx, w * 0.38, -h * 0.34, 6, 2.4, seed + 2);
    G.rustPatch(ctx, w * 0.7, -h * 0.6, 4, 2, seed + 3);
  });
  if (!simple()) G.chips(ctx, 4, -1.2, w - 8, seed + 4, G.DIRT);
}

function fullHeap(ctx) {
  G.scorch(ctx, [[-4, 0], [40, -2], [100, -2], [148, 0]], 5100);
  mound(ctx, HEAP, 5101, 144);
  rustBar(ctx, [26, -10], [96, -40], 5);
  rustBar(ctx, [40, -4], [118, -18], 4);
  rustBar(ctx, [92, -34], [126, -76], 4.4);
  rustBar(ctx, [60, -36], [104, -62], 3.6);
  plate(ctx, [[48, -26], [72, -34], [82, -22], [66, -10], [50, -12]]);
  hole(ctx, [[60, -24], [64, -26], [67, -22], [63, -19], [59, -20]], 5110);
  plate(ctx, [[96, -60], [118, -70], [128, -58], [112, -46], [98, -48]], true);
  limb(ctx, [[34, -28], [52, -48], [74, -50]], 4.4);
  claw(ctx, 76, -50, -0.2, 1.1);
  limb(ctx, [[86, -12], [100, -36], [118, -40]], 5, true);
  plate(ctx, [[116, -44], [124, -46], [126, -36], [118, -32]]);
  limb(ctx, [[110, -66], [118, -82], [114, -96]], 3.6);
  claw(ctx, 113, -96, -1.9, 0.9);
  limb(ctx, [[64, -60], [82, -70], [92, -84]], 3.4, true);
  head(ctx, 82, -18, 0.25);
  limb(ctx, [[120, -6], [130, -24], [140, -30]], 4.6);
  plate(ctx, [[126, -30], [143, -36], [144, -18], [132, -12]], true);
  hole(ctx, [[132, -26], [136, -28], [138, -24], [134, -21]], 5120);
  limb(ctx, [[18, -8], [30, -24], [44, -40]], 3.8, true);
  cable(ctx, [[30, -40], [44, -32], [56, -44], [70, -38], [84, -46], [96, -40]]);
  cable(ctx, [[70, -60], [80, -50], [96, -56], [106, -50], [120, -54]]);
  if (!simple()) cable(ctx, [[46, -8], [58, -14], [72, -6], [88, -10]]);
  ctx.save();
  ctx.translate(4, 0);
  ctx.transform(1, 0, -0.08, 1, 0, 0);
  flat(ctx, 3, -50, 20, 22, SCRAP.mesh, "mLine");
  mesh(ctx, 3, -50, 20, 22, "c1", simple() ? 3 : 2);
  tube(ctx, [[1, 0], [1, -56], [26, -56], [26, -2]]);
  tube(ctx, [[1, -26], [26, -26]]);
  tube(ctx, [[1, -50], [26, -50]]);
  ctx.restore();
  grime(ctx, HEAP, 144, 96, 5130);
  for (const [x, w] of [[30, 6], [58, 4], [100, 7], [128, 5]]) plate(ctx, [[x, 0], [x + 1, -2.4], [x + w, -3], [x + w + 1, 0]]);
}

function lowHeap(ctx) {
  G.scorch(ctx, [[-3, 0], [30, -1.6], [70, -1.6], [99, 0]], 5200);
  mound(ctx, LOW, 5201, 96);
  rustBar(ctx, [12, -6], [76, -24], 4.2);
  plate(ctx, [[34, -18], [54, -26], [62, -14], [44, -8]]);
  hole(ctx, [[44, -17], [48, -19], [50, -15], [46, -13]], 5210);
  limb(ctx, [[18, -14], [34, -28], [52, -30]], 3.8, true);
  claw(ctx, 53, -30, 0.1);
  limb(ctx, [[62, -6], [76, -22], [88, -24]], 4.2);
  head(ctx, 74, -8, -0.2);
  cable(ctx, [[22, -22], [38, -16], [52, -24], [66, -18], [82, -22]]);
  grime(ctx, LOW, 96, 40, 5230);
}

define({
  id: "prisonDump",
  box: [-4, -98, 148, 0],
  draw(ctx, state, t, size) {
    const low = state === 2;
    const [w, h] = low ? [96, 40] : [144, 96];
    ctx.save();
    ctx.scale((size?.w ?? w) / w, (size?.h ?? h) / h);
    (low ? lowHeap : fullHeap)(ctx);
    ctx.restore();
  }
});

const KEYS = { edge: "#24221e", front: "#7e7a74", top: "#b4b0ac", hi: "#dcdad6", key: "#9a9792", gap: "#5e5b56" };

define({
  id: "keyboard",
  box: [-2, -8, 22, 0],
  draw(ctx) {
    shadow(ctx, 10, 20);
    const at = (u, v) => [u * 18 + v * 1.8, -1.6 - v * 4.4];
    shape(ctx, [at(0, 0), at(1, 0), [18, 0], [0, 0]], KEYS.front, KEYS.edge);
    shape(ctx, [at(0, 0), at(1, 0), at(1, 1), at(0, 1)], KEYS.top, KEYS.edge);
    shape(ctx, [at(0, 1), at(1, 1), [at(1, 1)[0], at(1, 1)[1] - 0.8], [at(0, 1)[0], at(0, 1)[1] - 0.8]], KEYS.hi, KEYS.edge);
    if (simple()) {
      for (const v of [0.3, 0.62]) line(ctx, [at(0.08, v), at(0.92, v)], KEYS.gap, 0.7);
      return;
    }
    for (let row = 0; row < 4; row++) {
      const v0 = 0.12 + row * 0.2, v1 = v0 + 0.13;
      const keys = row === 0 ? [[0.06, 0.2], [0.24, 0.66], [0.7, 0.8], [0.84, 0.94]] : Array.from({ length: 11 }, (_, i) => [0.06 + i * 0.08, 0.06 + i * 0.08 + 0.065]);
      for (const [u0, u1] of keys) {
        shape(ctx, [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)], KEYS.key);
        line(ctx, [at(u0, v0), at(u1, v0)], KEYS.gap, 0.22);
        line(ctx, [at(u0, v1), at(u1, v1)], KEYS.hi, 0.18);
      }
    }
    flat(ctx, 0.6, -1.1, 16.8, 0.3, KEYS.hi);
  }
});

const CYAN = { edge: "#16292a", dark: "#3e6466", mid: "#648d90", lit: "#9cb5b5", hi: "#d4e6e4", mark: "#2c4a4c" };
const PLATE = [[1.2, -0.6], [0.4, -5.4], [1.4, -9.6], [4.6, -11.4], [10.8, -11.2], [13.4, -10.2], [12.8, -8.6], [10.6, -7.8], [10, -5.6], [11.8, -3.2], [13.2, -1], [10, 0], [3.2, 0]];

define({
  id: "chestPlate",
  box: [-2, -13, 16, 0],
  draw(ctx, state) {
    if (state === 0) return;
    if (state === 2) return scuff(ctx, 1, 12);
    shadow(ctx, 7, 14);
    shape(ctx, PLATE, CYAN.mid);
    ctx.save();
    P.path(ctx, PLATE);
    ctx.clip();
    flat(ctx, 0, -12, 14, 2.6, CYAN.lit);
    flat(ctx, 0, -3.2, 14, 3.2, CYAN.dark);
    if (!simple()) {
      shape(ctx, [[5, -7.6], [8.4, -7.2], [9.6, -1], [6.2, -0.6], [4.6, -4]], CYAN.lit);
      shape(ctx, [[6.2, -5.4], [7.8, -5], [8.4, -1.6], [6.8, -1.4]], CYAN.hi);
      curve(ctx, [[1, -8.6], [5, -9.4], [10, -9.2], [12.8, -8.8]], CYAN.dark, 0.35);
    }
    ctx.restore();
    P.path(ctx, PLATE);
    stroke(ctx, CYAN.edge);
    for (let i = 0; i < 4; i++) {
      const x = 4 + i * 1.7;
      flat(ctx, x, -10.6, 1.1, 1.6, CYAN.mark);
      if (!simple()) flat(ctx, x, -9.1, 1.1, 0.25, CYAN.hi);
    }
  }
});

const SILVER = { edge: "#1e1c16", dark: "#7a7668", mid: "#c4c0b0", hi: "#eeece2" };

define({
  id: "gateKey",
  box: [-2, -7, 13, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 11);
    shadow(ctx, 5.5, 11, 0.3);
    ctx.save();
    ctx.translate(0, -2.8);
    shape(ctx, [[0.4, -0.7], [6.2, -0.7], [6.2, 0.7], [3.4, 0.7], [3.4, 1.8], [2.4, 1.8], [2.4, 0.7], [1.6, 0.7], [1.6, 1.4], [0.4, 1.4]], SILVER.mid, SILVER.edge);
    ctx.beginPath();
    ctx.arc(8.4, 0, 2.6, 0, PI * 2);
    ctx.arc(9.2, -0.5, 0.7, 0, PI * 2, true);
    ctx.fillStyle = color(SILVER.mid);
    ctx.fill("evenodd");
    stroke(ctx, SILVER.edge);
    if (!simple()) {
      line(ctx, [[0.8, -0.3], [5.8, -0.3]], SILVER.hi, 0.35);
      ctx.beginPath();
      ctx.arc(8.4, 0, 1.9, PI * 0.95, PI * 1.6);
      ctx.strokeStyle = color(SILVER.hi);
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(8.4, 0, 2, PI * 0.1, PI * 0.7);
      ctx.strokeStyle = color(SILVER.dark);
      ctx.stroke();
    }
    ctx.restore();
  }
});

const MGX_K = 0.075;

define({
  id: "mgx800",
  box: [-2, -11, 30, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 1, 26);
    shadow(ctx, 13, 26);
    const t = ctx.getTransform();
    const lineW = lw(ctx) * Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
    ctx.save();
    ctx.scale(MGX_K, MGX_K);
    ctx.translate(132, -32);
    window.MGX800.draw(ctx, { lineW, simple: simple() });
    ctx.restore();
  }
});

const JACK = { edge: "#1c1a16", dark: "#545048", mid: "#8a8880", lit: "#b4b2aa", hi: "#d6d4cc", red: "#d03a1e" };

define({
  id: "jack",
  box: [-2, -20, 28, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 1, 24);
    shadow(ctx, 12, 24);
    outlined(ctx, [[11, -2.4], [23.6, -1.2]], 1.2, JACK.mid, JACK.edge);
    outlined(ctx, [[22.6, -1.3], [25, -1.1]], 1.8, JACK.dark, JACK.edge);
    flat(ctx, 1.6, -1.4, 13, 1.4, JACK.dark, JACK.edge);
    shape(ctx, [[3, -1.4], [3.4, -6], [5, -7.6], [10.4, -7.6], [12, -6], [12.6, -1.4]], JACK.mid, JACK.edge);
    if (!simple()) {
      flat(ctx, 3.6, -6.8, 8, 1.2, JACK.lit);
      flat(ctx, 3.4, -2.8, 9, 1.2, JACK.dark);
    }
    disc(ctx, 5.4, -4.4, 0.6, JACK.red);
    flat(ctx, 6.4, -16.6, 2.6, 9, JACK.lit, JACK.edge);
    if (!simple()) {
      for (let y = -15.8; y < -8; y += 1.2) flat(ctx, 6.4, y, 2.6, 0.35, JACK.dark);
      flat(ctx, 6.8, -16.6, 0.5, 9, JACK.hi);
    }
    flat(ctx, 2.8, -18.6, 9.8, 2, JACK.mid, JACK.edge);
    if (!simple()) flat(ctx, 3, -18.4, 9.4, 0.6, JACK.hi);
  }
});

const PAPER = { edge: "#3a3c3a", sheet: "#e4e6e2", shade: "#b8bab4", ink: "#2a2c30", rule: "#8a8c88" };
const STRIP = [[0.4, -0.8], [1.6, -0.4], [3, -0.9], [5, -0.3], [7.4, -0.7], [9.6, -0.2], [12.2, -0.6], [14.4, -0.4], [15.4, -3.6], [14.6, -4.4], [12.8, -4], [10.4, -4.6], [7.6, -4.1], [5, -4.6], [2.6, -4.2], [1, -4.6], [0.2, -2.6]];

define({
  id: "paperScrap",
  box: [-2, -7, 18, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 1, 14);
    shadow(ctx, 8, 15, 0.3);
    shape(ctx, STRIP, PAPER.sheet, PAPER.edge);
    ctx.save();
    P.path(ctx, STRIP);
    ctx.clip();
    flat(ctx, 0, -1.4, 16, 1.4, PAPER.shade);
    ctx.restore();
    line(ctx, [[1.6, -1.6], [13.8, -1.4]], PAPER.rule, simple() ? 0.3 : 0.25);
    if (simple()) {
      line(ctx, [[3, -3], [12.4, -3]], PAPER.ink, 0.9);
      return;
    }
    ctx.save();
    ctx.translate(7.8, -2.9);
    ctx.transform(1, 0, -0.25, 1, 0, 0);
    ctx.fillStyle = color(PAPER.ink);
    ctx.font = "italic 400 2.6px 'Comic Sans MS', 'Segoe Print', cursive";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("56133", 0, 0);
    ctx.restore();
  }
});
})();
