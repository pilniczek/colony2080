(() => {
const { define, P, G } = window.ENV;
const { rng, path, color, flat, disc, glow, stroke, shape, line, curve } = P;
const { PI, sin, cos, min, max, round } = Math;
const simple = () => window.ENV.simple;
const { within, blob } = window.ENV.VESNICE;
const SCRAP = ["#0c3018", "#30483c", "#486054", "#6c8070", "#06140a"];
const RUSTED = ["#3c180c", "#6c3c18", "#844a24", "#a8642e", "#140806"];
const STEEL = ["#3c3c30", "#606054", "#848478", "#b4b4a8", "#18180c"];
const BEZEL = ["#545450", "#8a8a84", "#b4b4ac", "#e0e0d8", "#141410"];
const CRATE = ["#3c1c0c", "#603018", "#905430", "#b4703c", "#1c0c04"];
const AMMO = ["#2a160a", "#4a2a16", "#6c3c24", "#a85a30", "#120804"];
const BRASS = ["#6c4818", "#a8781c", "#e4c03c", "#fce07a"];
const KHAKI = ["#3c3018", "#544830", "#786c54", "#9c9078", "#14100a"];
const TAN = ["#3c3020", "#6c603c", "#786048", "#9c8460", "#14100a"];
const PAINT = ["#4a3010", "#7a5418", "#9c6c18", "#c08a2c", "#1a0c04"];
const TYRE = ["#0e0e0c", "#1e1e1a", "#34342c", "#4c4c42"];
const SCREEN = { glass: "#0e140e", text: "#6c9c98", hi: "#e8f0ec", dim: "#1c2620" };
const LIGHT = { glare: "#fcf4d8", warm: "#f0d890", off: "#3a3628" };
const HOLE = "#0a0604";
const clipped = (ctx, pts, draw) => {
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  draw();
  ctx.restore();
};
const shadow = (ctx, x, w, a = 0.45) => {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = HOLE;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, -0.4, w / 2, 1, 0, 0, PI * 2);
  ctx.fill();
  ctx.restore();
};
const skin = (ctx, pts, x, y, w, h, seed, rust = true) => {
  clipped(ctx, pts, () => {
    G.grain(ctx, G.polyRegion(ctx, pts), seed, 0.8);
    if (rust) {
      G.rustPatch(ctx, x + w * 0.3, y + h * 0.65, max(1.5, w * 0.07), max(1, h * 0.12), seed + 1);
      G.rustPatch(ctx, x + w * 0.72, y + h * 0.45, max(1.5, w * 0.05), max(1, h * 0.1), seed + 2);
    }
    G.drips(ctx, x, y + h * 0.25, w, h * 0.5, seed + 3, max(1, round(w / 16)));
    G.dirt(ctx, x, y, w, h, seed + 4, 0.4);
  });
};
const breach = (ctx, pts, seed, light, dark) => {
  G.scorch(ctx, pts, seed);
  shape(ctx, pts, HOLE);
  G.rim(ctx, pts, seed + 1, light, dark);
};
const soot = (ctx, pts, alpha = 0.55) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  shape(ctx, pts, "#120a06");
  ctx.restore();
};
const tyre = (ctx, x, r, seed, flatK = 0) => {
  const r2 = rng(seed);
  const cy = -r + flatK * r * 0.25;
  ctx.fillStyle = color(TYRE[1]);
  ctx.beginPath();
  ctx.ellipse(x, cy, r * (1 + flatK * 0.08), r - flatK * r * 0.25, 0, 0, PI * 2);
  ctx.fill();
  stroke(ctx, TYRE[0]);
  if (!simple()) {
    ctx.save();
    ctx.clip();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * PI * 2 + r2();
      line(ctx, [[x + cos(a) * r * 0.78, cy + sin(a) * r * 0.78], [x + cos(a) * r * 1.1, cy + sin(a) * r * 1.1]], TYRE[2], 0.7);
    }
    ctx.restore();
  }
  disc(ctx, x, cy, r * 0.55, RUSTED[1], RUSTED[4]);
  disc(ctx, x, cy, r * 0.38, RUSTED[2]);
  disc(ctx, x, cy, r * 0.16, RUSTED[0]);
  if (!simple())
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * PI * 2;
      disc(ctx, x + cos(a) * r * 0.27, cy + sin(a) * r * 0.27, 0.45, RUSTED[3]);
    }
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, cy, r * 0.55, 0, PI * 2);
  ctx.clip();
  G.grain(ctx, G.rectRegion(ctx, x - r, cy - r, r * 2, r * 2), seed + 1, 0.8);
  ctx.restore();
};
const arch = (ctx, x, y, r) => shape(ctx, [[x - r - 1, y], [x - r, y - r * 0.6], [x - r * 0.5, y - r - 1], [x + r * 0.5, y - r - 1], [x + r, y - r * 0.6], [x + r + 1, y]], HOLE);
const tornPipe = (ctx, x, y, w, h, seed, flip = false) => {
  const r = rng(seed);
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  const body = [[0, -h * 0.5], [w * 0.62, -h * 0.5], [w * 0.7, -h * 0.85], [w * 0.82, -h * 0.55], [w, -h * 0.6], [w * 0.9, -h * 0.2], [w, h * 0.15], [w * 0.8, h * 0.35], [w * 0.72, h * 0.05], [w * 0.62, h * 0.5], [0, h * 0.5]];
  shape(ctx, body, RUSTED[1], RUSTED[4]);
  clipped(ctx, body, () => {
    flat(ctx, 0, -h * 0.5, w, h * 0.25, SCRAP[2]);
    flat(ctx, 0, -h * 0.28, w, h * 0.12, SCRAP[3]);
    flat(ctx, 0, h * 0.2, w, h * 0.3, RUSTED[0]);
    for (let k = 0; k < 4; k++) G.rustPatch(ctx, w * (0.15 + r() * 0.6), -h * 0.2 + r() * h * 0.5, 1.6 + r() * 2, 1 + r(), seed + 3 + k);
    G.grain(ctx, G.polyRegion(ctx, body), seed + 1);
  });
  shape(ctx, [[w * 0.66, -h * 0.3], [w * 0.8, -h * 0.4], [w * 0.86, -h * 0.05], [w * 0.74, h * 0.1]], HOLE);
  ctx.restore();
};
const scrapWedge = (ctx, x, w, h, seed) => {
  const pts = [[x, 0], [x + w * 0.42, -h], [x + w, -h], [x + w, 0]];
  shape(ctx, pts, SCRAP[2], SCRAP[4]);
  clipped(ctx, pts, () => {
    for (let y = -h + 3; y < 0; y += 4) flat(ctx, x, y, w, 1.6, y % 8 ? SCRAP[1] : SCRAP[3]);
    flat(ctx, x, -3.2, w, 1.4, STEEL[3]);
    flat(ctx, x, -1.8, w, 1.8, SCRAP[0]);
    G.grain(ctx, G.polyRegion(ctx, pts), seed);
    const r = rng(seed + 1);
    for (let k = 0; k < 4; k++) G.rustPatch(ctx, x + w * (0.4 + r() * 0.55), -h * (0.2 + r() * 0.6), 1.8 + r() * 1.6, 1 + r() * 0.8, seed + 2 + k);
    G.dirt(ctx, x, -h, w, h, seed + 8, 0.5);
  });
  line(ctx, [[x + 0.6, -0.6], [x + w * 0.42 + 0.4, -h + 0.4], [x + w - 0.4, -h + 0.4]], SCRAP[3], 0.9);
  G.chips(ctx, x + w * 0.42, -h + 0.2, w * 0.58, seed + 9, G.DIRT);
};
const bentBeam = (ctx, pts, wd, t) => {
  line(ctx, pts, t[4], wd + 1.2, "butt");
  line(ctx, pts, t[1], wd, "butt");
  line(ctx, pts, t[3], wd * 0.3, "butt");
};
const elbow = (ctx, x, r, seed) => {
  const pts = [[x, 0], [x, -r], [x + r * 0.55, -r * 0.84], [x + r * 0.88, -r * 0.5], [x + r, 0], [x + r * 0.62, 0], [x + r * 0.55, -r * 0.3], [x + r * 0.3, -r * 0.5], [x + 0.2, -r * 0.55]];
  ctx.fillStyle = color(RUSTED[2]);
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, -r);
  ctx.arc(x, 0, r, -PI / 2, 0);
  ctx.lineTo(x + r * 0.6, 0);
  ctx.arc(x, 0, r * 0.6, 0, -PI / 2, true);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, RUSTED[4]);
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = color(RUSTED[3]);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, 0, r * 0.88, -PI / 2, 0);
  ctx.stroke();
  ctx.strokeStyle = color(RUSTED[0]);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, 0, r * 0.66, -PI / 2, 0);
  ctx.stroke();
  for (const k of [0.25, 0.5]) line(ctx, [[x + r * 0.6 * cos(-PI / 2 + k * PI), r * 0.6 * sin(-PI / 2 + k * PI)], [x + r * cos(-PI / 2 + k * PI), r * sin(-PI / 2 + k * PI)]], SCRAP[1], 1);
  G.grain(ctx, G.polyRegion(ctx, pts), seed, 0.9);
  G.dirt(ctx, x, -r, r, r, seed + 1, 0.4);
  ctx.restore();
};
const bits = (ctx, x, w, seed, n) => {
  const r = rng(seed);
  for (let k = 0; k < n; k++) {
    const bx = x + r() * w;
    const s = 1.4 + r() * 2.4;
    ctx.save();
    ctx.translate(bx, -s * 0.4);
    ctx.rotate((r() - 0.5) * 1.4);
    const t = r() < 0.5 ? SCRAP : RUSTED;
    shape(ctx, [[-s, 0], [-s * 0.3, -s * 0.6], [s, -s * 0.3], [s * 0.6, s * 0.3]], t[r() < 0.5 ? 1 : 2], t[4]);
    ctx.restore();
  }
};
const scrapHeap = {
  id: "scrapHeap",
  box: [-4, -40, 60, 2],
  draw(ctx, state) {
    const seed = 6100 + state * 11;
    shadow(ctx, -2, 58);
    if (state === 1) {
      bentBeam(ctx, [[8, 0], [12, -18], [20, -30], [32, -34]], 3.2, RUSTED);
      bentBeam(ctx, [[40, 0], [42, -14], [38, -24], [46, -32]], 2.6, STEEL);
      elbow(ctx, 30, 20, seed + 1);
      scrapWedge(ctx, 0, 30, 12, seed + 2);
      tornPipe(ctx, 38, -4, 18, 7, seed + 3, true);
      bits(ctx, 0, 56, seed + 4, 9);
    }
    else {
      tornPipe(ctx, -2, -12, 22, 10, seed + 3);
      scrapWedge(ctx, 14, 34, 21, seed);
      elbow(ctx, 46, 9, seed + 1);
      tornPipe(ctx, 0, -4, 16, 7, seed + 5);
      bits(ctx, 0, 56, seed + 4, 7);
    }
    G.chips(ctx, 0, -1.2, 56, seed + 9, G.DUST);
  },
};
const louvredBox = (ctx, seed) => {
  const x = 1, y = -16, w = 22, h = 16;
  flat(ctx, x, y, w, h, STEEL[2], STEEL[4]);
  flat(ctx, x, y, 2, h, STEEL[3]);
  flat(ctx, x + w - 2, y, 2, h, STEEL[1]);
  flat(ctx, x + 2, y + 1.4, w - 4, 3.6, STEEL[1]);
  if (!simple())
    for (let k = 0; k < 7; k++) flat(ctx, x + 3 + k * 2.5, y + 2, 1.4, 2.4, k % 3 === 1 ? STEEL[3] : STEEL[0]);
  else flat(ctx, x + 3, y + 2.4, w - 6, 1.4, STEEL[0]);
  flat(ctx, x + 2, y + 5.6, w - 4, 1, BEZEL[3]);
  flat(ctx, x + 3, y + 8, 6, 6, STEEL[0], STEEL[4]);
  if (!simple())
    for (let k = 0; k < 3; k++) flat(ctx, x + 3.6, y + 9 + k * 1.8, 4.8, 0.8, STEEL[2]);
  flat(ctx, x + 11, y + 8, 9, 7, "#1c2a2a", STEEL[4]);
  flat(ctx, x + 11, y + 8, 9, 1.2, "#3c5454");
  within(ctx, [[x, y, w, h]], () => {
    G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed, 0.7);
    G.drips(ctx, x, y + 5, w, 8, seed + 1, 2, false);
    G.dirt(ctx, x, y, w, h, seed + 2, 0.4);
  });
  G.chips(ctx, x, y + 0.3, w, seed + 3, G.DIRT);
};
const TEXT_ROWS = [[0, 10], [1.8, 13], [3.6, 8], [5.4, 12], [7.2, 6], [9.6, 4]];
const wallTerminal = {
  id: "wallTerminal",
  box: [-2, -28, 26, 2],
  draw(ctx, state) {
    const seed = 6200 + state * 5;
    if (state === 2) {
      shadow(ctx, 0, 24, 0.4);
      louvredBox(ctx, seed);
      return;
    }
    const on = state === 0;
    flat(ctx, 0, -24, 24, 24, BEZEL[1], BEZEL[4]);
    shape(ctx, [[0, -24], [24, -24], [22, -22], [2, -22], [2, -2], [0, 0]], BEZEL[3]);
    shape(ctx, [[24, -24], [24, 0], [0, 0], [2, -2], [22, -2], [22, -22]], BEZEL[0]);
    flat(ctx, 3, -21, 18, 15, BEZEL[2]);
    flat(ctx, 4, -20, 16, 13, on ? SCREEN.glass : SCREEN.dim, BEZEL[4]);
    if (on) {
      if (!simple()) glow(ctx, 12, -13.5, 12, "#3c6c64", 0.35);
      for (const [dy, len] of TEXT_ROWS) flat(ctx, 5.5, -17.6 + dy, len * (simple() ? 1 : 0.95), 1, SCREEN.text);
      if (!simple()) flat(ctx, 5.5 + 5, -17.6 + 9.6, 1, 1, SCREEN.hi);
    }
    else if (!simple()) line(ctx, [[8, -20], [11, -15], [9, -12], [13, -7]], "#3a4640", 0.5);
    ctx.save();
    ctx.globalAlpha = on ? 0.9 : 0.4;
    line(ctx, [[12, -18.8], [18.6, -18.8], [18.6, -12]], SCREEN.hi, 1);
    ctx.restore();
    flat(ctx, 4, -5, 16, 2.4, BEZEL[0]);
    if (!simple()) for (let k = 0; k < 4; k++) flat(ctx, 5 + k * 3.8, -4.6, 2.6, 1.6, BEZEL[4]);
    disc(ctx, 20.4, -3.8, 0.8, on ? "#7ad06a" : "#2a3a24");
    within(ctx, [[0, -24, 24, 24]], () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -24, 24, 24), seed, 0.6);
      G.drips(ctx, 0, -22, 24, 10, seed + 1, 2, false);
      G.dirt(ctx, 0, -24, 24, 24, seed + 2, 0.3);
      G.rustPatch(ctx, 2, -3, 1.4, 1, seed + 3);
    });
    G.chips(ctx, 0, -23.7, 24, seed + 4, G.DIRT);
  },
};
const hoodLamp = {
  id: "hoodLamp",
  box: [-14, -50, 38, -18],
  draw(ctx, state) {
    const lit = state === 0;
    const top = -48;
    if (lit) {
      ctx.save();
      ctx.globalAlpha = simple() ? 0.1 : 0.14;
      shape(ctx, [[6, top + 7], [18, top + 7], [24, top + 30], [0, top + 30]], LIGHT.warm);
      ctx.restore();
      if (!simple()) glow(ctx, 12, top + 8, 18, LIGHT.warm, 0.35);
    }
    flat(ctx, 10.4, top, 3.2, 2, STEEL[1], STEEL[4]);
    line(ctx, [[-5, top + 5.5], [29, top + 5.5]], STEEL[4], 1.6);
    line(ctx, [[-5, top + 5.5], [29, top + 5.5]], STEEL[1], 0.8);
    for (const x of [1, 23]) {
      ctx.save();
      ctx.globalAlpha = lit ? 0.5 : 0.3;
      line(ctx, [[x, top + 6], [x, top + 16]], STEEL[0], 0.7);
      ctx.restore();
    }
    const hood = [[7, top + 2], [17, top + 2], [19, top + 7], [5, top + 7]];
    shape(ctx, hood, KHAKI[2], KHAKI[4]);
    flat(ctx, 7, top + 2, 10, 1, KHAKI[3]);
    flat(ctx, 5, top + 6, 14, 1, KHAKI[1]);
    clipped(ctx, hood, () => {
      G.grain(ctx, G.polyRegion(ctx, hood), 6301 + state, 0.7);
      G.drips(ctx, 5, top + 3, 14, 4, 6302 + state, 2, false);
    });
    flat(ctx, 10, top + 2.2, 4, 1.6, lit ? STEEL[3] : STEEL[1]);
    if (lit) {
      flat(ctx, 6.4, top + 7, 11.2, 1.4, LIGHT.warm);
      if (!simple()) glow(ctx, 12, top + 7.4, 7, LIGHT.glare, 0.9);
      flat(ctx, 9, top + 7, 6, 1, LIGHT.glare);
    }
    else {
      flat(ctx, 6.4, top + 7, 11.2, 1.2, LIGHT.off);
      if (!simple()) line(ctx, [[9, top + 7.4], [10.6, top + 9.6], [10, top + 11]], STEEL[0], 0.5);
    }
  },
};
const yardLamp = {
  id: "yardLamp",
  box: [-4, -78, 78, 2],
  draw(ctx, state) {
    const seed = 6400 + state;
    const lit = state === 0;
    shadow(ctx, -1, 60, 0.4);
    flat(ctx, 0, -42, 24, 42, KHAKI[1], KHAKI[4]);
    flat(ctx, -1.5, -44, 27, 3, STEEL[2], STEEL[4]);
    flat(ctx, -1.5, -44, 27, 1, STEEL[3]);
    flat(ctx, 3, -38, 18, 10, HOLE, KHAKI[4]);
    if (!simple()) for (const x of [7.5, 12, 16.5]) flat(ctx, x, -38, 1, 10, STEEL[1]);
    flat(ctx, 3, -28.4, 18, 1.2, STEEL[2]);
    flat(ctx, 1, -25, 22, 25, STEEL[1], STEEL[4]);
    flat(ctx, 1, -25, 22, 1.4, STEEL[3]);
    flat(ctx, 3.5, -22, 17, 22, STEEL[2], STEEL[4]);
    flat(ctx, 3.5, -22, 1.4, 22, STEEL[3]);
    for (const x of [8.5, 11.5, 14.5]) flat(ctx, x, -19, 1.4, 6, STEEL[4]);
    flat(ctx, 17.6, -12, 1.4, 2.4, STEEL[0]);
    within(ctx, [[-1.5, -44, 27, 44]], () => {
      G.grain(ctx, G.rectRegion(ctx, -1.5, -44, 27, 44), seed, 0.8);
      G.drips(ctx, 0, -41, 24, 16, seed + 1, 3, false);
      G.dirt(ctx, 0, -44, 24, 44, seed + 2, 0.3);
      G.rustPatch(ctx, 5, -4, 2, 1.2, seed + 3);
    });
    G.chips(ctx, -1.5, -43.7, 27, seed + 4, G.DIRT);
    if (lit) {
      ctx.save();
      ctx.globalAlpha = simple() ? 0.08 : 0.11;
      shape(ctx, [[25, -52], [34, -52], [44, 0], [6, 0]], LIGHT.warm);
      ctx.restore();
      if (!simple()) glow(ctx, 29, -51, 20, LIGHT.warm, 0.4);
    }
    flat(ctx, 48, -72, 9, 72, STEEL[2], STEEL[4]);
    flat(ctx, 48, -72, 2.2, 72, STEEL[3]);
    flat(ctx, 54.6, -72, 2.4, 72, STEEL[1]);
    flat(ctx, 46.5, -4, 12, 4, STEEL[1], STEEL[4]);
    const arm = [[24, -53], [24, -56], [33, -64], [72, -64], [72, -53]];
    shape(ctx, arm, STEEL[2], STEEL[4]);
    flat(ctx, 33, -64, 39, 1.4, STEEL[3]);
    flat(ctx, 24, -55, 48, 2, STEEL[1]);
    flat(ctx, 24, -53, 10, 1.6, lit ? LIGHT.glare : LIGHT.off, STEEL[4]);
    if (lit) glow(ctx, 29, -52, simple() ? 5 : 8, LIGHT.glare, 0.85);
    within(ctx, [[48, -72, 9, 72]], () => {
      G.grain(ctx, G.rectRegion(ctx, 48, -72, 9, 72), seed + 5, 0.7);
      G.drips(ctx, 48, -52, 9, 14, seed + 6, 1);
      G.dirt(ctx, 48, -72, 9, 72, seed + 7, 0.2);
    });
    clipped(ctx, arm, () => {
      G.grain(ctx, G.polyRegion(ctx, arm), seed + 8, 0.7);
      G.drips(ctx, 34, -60, 38, 5, seed + 9, 2, false);
    });
    G.chips(ctx, 33, -63.7, 39, seed + 10, G.DIRT);
  },
};
const crateBox = (ctx, x, y, seed, shade = 0) => {
  const w = 24, h = 24;
  flat(ctx, x, y, w, h, CRATE[2], CRATE[4]);
  for (let k = 0; k < 5; k++) {
    const px = x + k * 4.8;
    flat(ctx, px, y, 4.8, h, k === 0 ? CRATE[3] : k === 4 ? CRATE[1] : CRATE[2]);
    flat(ctx, px + 4.2, y, 0.6, h, CRATE[0]);
  }
  flat(ctx, x, y, w, 3.6, CRATE[3]);
  flat(ctx, x, y + 3.6, w, 1, CRATE[0]);
  flat(ctx, x, y + h - 3, w, 3, CRATE[1]);
  flat(ctx, x, y + h - 3.2, w, 0.6, CRATE[0]);
  shape(ctx, [[x + 6.6, y + 9], [x + 17.4, y + 9], [x + 12, y + 16]], BRASS[1], CRATE[4]);
  shape(ctx, [[x + 8.4, y + 10], [x + 15.6, y + 10], [x + 12, y + 14]], "#c09030");
  if (!simple()) for (const cx of [x + 2, x + w - 2]) for (const cy of [y + 1.8, y + h - 1.6]) disc(ctx, cx, cy, 0.6, CRATE[0]);
  within(ctx, [[x, y, w, h]], () => {
    G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed);
    G.drips(ctx, x, y + 4, w, 9, seed + 1, 2, false);
    G.dirt(ctx, x, y, w, h, seed + 2, 0.4);
    if (shade) {
      ctx.save();
      ctx.globalAlpha = shade;
      flat(ctx, x, y, w, h, HOLE);
      ctx.restore();
    }
  });
  G.chips(ctx, x, y + 0.3, w, seed + 3, G.DIRT);
};
const plank = (ctx, x, y, w, h, a, tone, seed) => {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(a);
  flat(ctx, -w / 2, -h / 2, w, h, CRATE[tone], CRATE[4]);
  flat(ctx, -w / 2, -h / 2, w, 0.7, CRATE[3]);
  line(ctx, [[w / 2, -h / 2], [w / 2 - 1.6, 0], [w / 2, h / 2]], CRATE[4], 0.6);
  G.grain(ctx, G.rectRegion(ctx, -w / 2, -h / 2, w, h), seed);
  ctx.restore();
};
const cargoCrate = {
  id: "cargoCrate",
  box: [-6, -52, 40, 2],
  draw(ctx, state) {
    const seed = 6500 + state * 7;
    shadow(ctx, -1, 26);
    if (state === 1) {
      crateBox(ctx, 0, -24, seed + 10, 0.2);
      crateBox(ctx, 0.6, -48, seed);
      return;
    }
    if (state === 2) {
      const body = [[0, 0], [0, -14], [4, -12], [7, -16], [11, -11], [15, -15], [19, -10], [24, -13], [24, 0]];
      shape(ctx, body, CRATE[2], CRATE[4]);
      clipped(ctx, body, () => {
        for (let k = 0; k < 5; k++) {
          flat(ctx, k * 4.8, -16, 4.8, 16, k === 0 ? CRATE[3] : k === 4 ? CRATE[1] : CRATE[2]);
          flat(ctx, k * 4.8 + 4.2, -16, 0.6, 16, CRATE[0]);
        }
        flat(ctx, 0, -3, 24, 3, CRATE[1]);
        shape(ctx, [[6.6, -8], [17.4, -8], [12, -1]], BRASS[1], CRATE[4]);
        G.grain(ctx, G.polyRegion(ctx, body), seed);
        G.dirt(ctx, 0, -16, 24, 16, seed + 1, 0.5);
      });
      shape(ctx, [[3, -12], [7, -15], [11, -10.6], [15, -14], [19, -9.6], [22, -11.5], [22, -6], [3, -6]], HOLE);
      plank(ctx, -4, -3.4, 18, 3.4, 0.08, 2, seed + 2);
      plank(ctx, 18, -3.2, 16, 3.2, -0.12, 1, seed + 3);
      plank(ctx, 10, -22, 4.4, 14, 0.5, 3, seed + 4);
      plank(ctx, 24, -9, 4.4, 12, -0.35, 2, seed + 5);
      bits(ctx, -4, 36, seed + 6, 5);
      return;
    }
    crateBox(ctx, 0, -24, seed);
  },
};
const ammoCrate = {
  id: "ammoCrate",
  box: [-2, -14, 28, 2],
  draw(ctx) {
    const seed = 6600;
    const x = 0, y = -10, w = 24, h = 10;
    shadow(ctx, -1, 26, 0.4);
    flat(ctx, x, y, w, h, AMMO[3], AMMO[4]);
    flat(ctx, x + 1, y + 1, w - 6, h - 2, AMMO[1]);
    flat(ctx, x, y, w, 0.8, "#c87a4a");
    flat(ctx, x, y + h - 1, w, 1, AMMO[2]);
    ctx.save();
    ctx.font = `900 6px "Arial Narrow", "Liberation Sans Narrow", Impact, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const m = ctx.measureText("AMMO").width;
    ctx.translate(x + 1 + (w - 6) / 2, y + h / 2 + 0.3);
    ctx.scale(min(1.6, (w - 8) / m), 1);
    ctx.fillStyle = color("#c4a090");
    ctx.fillText("AMMO", 0, 0);
    ctx.restore();
    flat(ctx, x + w - 5, y, 5, h, BRASS[1], AMMO[4]);
    flat(ctx, x + w - 5, y, 1.4, h, BRASS[2]);
    flat(ctx, x + w - 3.6, y + 3.6, 2.6, 2.8, BRASS[0]);
    if (!simple()) flat(ctx, x + w - 5, y + 4.2, 1.2, 1.6, BRASS[3]);
    within(ctx, [[x, y, w, h]], () => {
      G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed, 0.7);
      G.dirt(ctx, x, y, w, h, seed + 1, 0.4);
      G.rustPatch(ctx, x + w - 3, y + h - 2, 1.4, 0.8, seed + 2);
    });
    G.chips(ctx, x, y + 0.3, w, seed + 3, G.DIRT);
  },
};
const forklift = (ctx, seed) => {
  const r = rng(seed);
  const guard = [[22, -22], [24, -50], [50, -48], [53, -22]];
  for (const [a, b] of [[guard[0], guard[1]], [guard[3], guard[2]]]) bentBeam(ctx, [a, b], 2.4, PAINT);
  bentBeam(ctx, [[23, -49], [36, -46], [51, -49]], 2.4, PAINT);
  if (!simple()) for (let k = 0; k < 3; k++) line(ctx, [[26 + k * 8, -48], [28 + k * 8, -46]], PAINT[4], 1);
  flat(ctx, 30, -32, 12, 3, TYRE[1], TYRE[0]);
  shape(ctx, [[28, -24], [30, -34], [33, -34], [32, -24]], TYRE[2], TYRE[0]);
  curve(ctx, [[40, -30], [42, -36], [45, -36]], STEEL[0], 1.4);
  const body = [[4, -8], [4, -24], [10, -32], [24, -32], [26, -24], [56, -24], [58, -8]];
  shape(ctx, body, PAINT[2], PAINT[4]);
  flat(ctx, 10, -32, 14, 1.6, PAINT[3]);
  flat(ctx, 26, -24, 30, 1.6, PAINT[3]);
  flat(ctx, 4, -12, 54, 4, PAINT[1]);
  skin(ctx, body, 4, -32, 54, 24, seed);
  clipped(ctx, body, () => {
    G.scorch(ctx, [[10, -30], [30, -28], [34, -14], [8, -12]], seed + 1);
    soot(ctx, [[4, -24], [10, -32], [22, -32], [18, -18], [4, -16]], 0.45);
    if (!simple()) for (let y = -28; y < -18; y += 2.6) flat(ctx, 7, y, 9, 1.1, PAINT[0]);
  });
  const mast = [[60, 0], [60, -54], [66, -56], [66, 0]];
  shape(ctx, mast, STEEL[1], STEEL[4]);
  flat(ctx, 60, -54, 2, 54, STEEL[2]);
  flat(ctx, 63, -54, 1, 54, STEEL[0]);
  within(ctx, [[60, -56, 6, 56]], () => {
    G.grain(ctx, G.rectRegion(ctx, 60, -56, 6, 56), seed + 2, 0.8);
    G.drips(ctx, 60, -50, 6, 30, seed + 3, 2);
  });
  flat(ctx, 56, -46, 4, 3, STEEL[0], STEEL[4]);
  flat(ctx, 64, -16, 5, 14, STEEL[2], STEEL[4]);
  bentBeam(ctx, [[66, -3], [80, -2.6], [88, -1], [92, 1.4]], 2, STEEL);
  bentBeam(ctx, [[66, -5], [78, -6], [84, -10], [88, -11]], 1.8, STEEL);
  arch(ctx, 46, -8, 10);
  arch(ctx, 15, -8, 8);
  tyre(ctx, 46, 9, seed + 4, 0.2);
  tyre(ctx, 15, 7, seed + 5, 1);
  G.chips(ctx, 26, -23.7, 30, seed + 6, G.DIRT);
  for (let k = 0; k < 3; k++) G.rustPatch(ctx, 62 + r() * 2, -40 + k * 12, 1.2, 1.6, seed + 8 + k);
};
const bowser = (ctx, seed) => {
  flat(ctx, 8, -14, 104, 4, KHAKI[0], KHAKI[4]);
  bentBeam(ctx, [[110, -12], [128, -6], [134, -3]], 2.4, STEEL);
  disc(ctx, 135, -3, 2, STEEL[1], STEEL[4]);
  flat(ctx, 128, -6, 2, 6, STEEL[0], STEEL[4]);
  const tank = [[14, -14], [8, -20], [6, -30], [8, -40], [14, -44], [104, -44], [110, -40], [112, -30], [110, -20], [104, -14]];
  shape(ctx, tank, TAN[2], TAN[4]);
  clipped(ctx, tank, () => {
    flat(ctx, 0, -44, 120, 6, TAN[3]);
    flat(ctx, 0, -38, 120, 2, "#b09c74");
    flat(ctx, 0, -22, 120, 8, TAN[1]);
    for (const x of [30, 58, 86]) flat(ctx, x, -44, 1.6, 30, TAN[0]);
    G.scorch(ctx, [[62, -40], [92, -42], [98, -18], [70, -16]], seed + 1);
  });
  skin(ctx, tank, 6, -44, 106, 30, seed);
  flat(ctx, 40, -34, 12, 9, "#c4bca0", TAN[4]);
  shape(ctx, [[46, -33], [50.4, -29.5], [46, -26], [41.6, -29.5]], "#b4300c");
  if (!simple()) flat(ctx, 44.6, -30.4, 2.8, 1.6, "#e8d8a8");
  const hole = blob(80, -30, 6, 5, seed + 2);
  breach(ctx, hole, seed + 3, TAN[3], HOLE);
  ctx.save();
  ctx.globalAlpha = 0.6;
  shape(ctx, [[78, -25], [82, -25], [83, -14], [77, -14]], "#140c06");
  shape(ctx, blob(84, -0.6, 14, 1.4, seed + 4), "#0c0806");
  ctx.restore();
  flat(ctx, 30, -48, 14, 4, TAN[1], TAN[4]);
  flat(ctx, 31, -50, 12, 2, TAN[2], TAN[4]);
  for (const x of [22, 54]) line(ctx, [[x, -44], [x, -52]], STEEL[1], 1);
  line(ctx, [[22, -52], [44, -52]], STEEL[1], 1);
  bentBeam(ctx, [[44, -52], [54, -50], [54, -44]], 1, STEEL);
  if (!simple())
    for (let y = -42; y < -14; y += 4) line(ctx, [[3, y], [6, y]], STEEL[1], 0.9);
  line(ctx, [[3, -44], [3, -14]], STEEL[0], 1);
  G.chips(ctx, 14, -43.7, 90, seed + 5, G.DIRT);
  for (const x of [72, 90]) {
    tyre(ctx, x, 8.5, seed + 10 + x, x === 90 ? 1 : 0.2);
  }
  flat(ctx, 16, -10, 6, 10, STEEL[1], STEEL[4]);
};
const tug = (ctx, seed) => {
  const body = [[2, -8], [2, -18], [12, -26], [96, -26], [104, -18], [104, -8]];
  shape(ctx, body, KHAKI[2], KHAKI[4]);
  flat(ctx, 12, -26, 84, 2, KHAKI[3]);
  flat(ctx, 2, -12, 102, 4, KHAKI[1]);
  if (!simple()) for (let x = 14; x < 52; x += 5) flat(ctx, x, -22, 3, 8, KHAKI[1]);
  clipped(ctx, body, () => {
    P.hazard(ctx, 2, -12, 102, 4, 4, { fill: "#9c7a1c", dark: "#1c160a", line: "#1c160a" });
    soot(ctx, [[8, -24], [50, -26], [56, -12], [6, -10]], 0.4);
    G.scorch(ctx, [[14, -24], [46, -25], [50, -14], [16, -12]], seed + 1);
  });
  skin(ctx, body, 2, -26, 102, 18, seed);
  const cab = [[68, -26], [70, -48], [94, -48], [98, -26]];
  ctx.save();
  ctx.lineCap = "butt";
  for (const [a, b] of [[[70, -26], [71, -48]], [[95, -26], [93, -48]], [[82, -26], [82, -47]]]) bentBeam(ctx, [a, b], 2, KHAKI);
  ctx.restore();
  shape(ctx, [[69, -48], [95, -50], [96, -47], [70, -45]], KHAKI[1], KHAKI[4]);
  shape(ctx, [[72, -44], [80, -44], [80, -30], [72, -30]], HOLE);
  shape(ctx, [[84, -44], [92, -44], [93, -30], [84, -30]], HOLE);
  if (!simple()) {
    shape(ctx, [[72, -44], [76, -44], [72, -38]], "#3a4846");
    shape(ctx, [[92, -44], [92, -40], [89, -44]], "#2c3836");
  }
  flat(ctx, 74, -32, 10, 4, TYRE[1], TYRE[0]);
  clipped(ctx, cab, () => G.grain(ctx, G.polyRegion(ctx, cab), seed + 2, 0.4));
  flat(ctx, 104, -14, 8, 4, STEEL[1], STEEL[4]);
  disc(ctx, 113, -12, 2.4, STEEL[2], STEEL[4]);
  disc(ctx, 113, -12, 1, HOLE);
  flat(ctx, -2, -16, 4, 6, STEEL[0], STEEL[4]);
  G.chips(ctx, 12, -25.7, 84, seed + 3, G.DIRT);
  for (const [x, f] of [[22, 0.2], [84, 1]]) {
    arch(ctx, x, -8, 10);
    tyre(ctx, x, 9.5, seed + 10 + x, f);
  }
};
const depotWreck = {
  id: "depotWreck",
  box: [-4, -64, 142, 2],
  draw(ctx, state) {
    const seed = 6700 + state * 9;
    ctx.save();
    ctx.globalAlpha = 0.4;
    flat(ctx, 0, -2, state === 0 ? 92 : 136, 3, HOLE);
    ctx.restore();
    if (state === 1) bowser(ctx, seed);
    else if (state === 2) tug(ctx, seed);
    else forklift(ctx, seed);
  },
};
for (const asset of [scrapHeap, wallTerminal, hoodLamp, yardLamp, cargoCrate, ammoCrate, depotWreck]) define(asset);
})();
