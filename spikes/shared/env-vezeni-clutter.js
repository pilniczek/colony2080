(() => {
const { define, P, G } = window.ENV;
const { rng, path, color, flat, disc, glow, stroke, shape, line, curve } = P;
const { PI } = Math;
const simple = () => window.ENV.simple;
const HOUSING = ["#0c0c06", "#18180c", "#2a2a1c", "#3c3c2c"];
const TUBE = ["#fcfcfc", "#e4f0e4", "#a0a8a0", "#909890"];
const DEAD = ["#6c706c", "#4a4e4a", "#2a2c2a"];
const TEAL = ["#202c2c", "#303c3c", "#38484c", "#506468", "#0c1010"];
const FRAME = ["#2c2c22", "#3c4030", "#545448", "#606054", "#0c0c08"];
const WHITE = ["#808888", "#c8cccc", "#e8ecec"];
const MOSS = ["#2a3c22", "#3c5430", "#546c3c"];
const LENS = ["#481800", "#2a0c00", "#c04818", "#f07030", "#ffb070"];
const PLATE = ["#5c3018", "#784830", "#844824", "#9a5a2c", "#3a1c0c"];
const OCHRE = ["#4c3018", "#9c6c18", "#b8862c"];
const BUNK = ["#3c3c30", "#606054", "#78786c", "#9a9a88", "#141410"];
const RUSTY = ["#4a2410", "#784824", "#94582c"];
const MATT = ["#40403a", "#5c5c54", "#74746a", "#a09a80", "#1a1a16"];
const LOCK = ["#202a26", "#303c3c", "#3c483c", "#56624e", "#0c1010"];
const BIN = ["#38382e", "#545448", "#6c6c5e", "#8a8a78", "#101008"];
const SLOP = ["#30240c", "#4a3818", "#62502a", "#1a1206"];
const HOLE = "#080604";
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
const faded = (ctx, alpha, draw) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  draw();
  ctx.restore();
};
const STRIP_W = 48;
const ceilingStrip = {
  id: "ceilingStrip",
  box: [-4, -96, 52, 0],
  draw(ctx, state, _t, { h = 96 } = {}) {
    const y = -h;
    const lit = state === 0;
    if (lit && !simple()) glow(ctx, 24, y + 6, 24, TUBE[1], 0.25);
    flat(ctx, 0, y, STRIP_W, 3.6, HOUSING[1], HOUSING[0]);
    flat(ctx, 0, y + 2.6, STRIP_W, 1, HOUSING[2]);
    for (const x of [1, STRIP_W - 5]) flat(ctx, x, y + 2, 4, 3.4, HOUSING[2], HOUSING[0]);
    G.inside(ctx, G.rectRegion(ctx, 0, y, STRIP_W, 3.6), () => G.grain(ctx, G.rectRegion(ctx, 0, y, STRIP_W, 3.6), 5100, 0.7));
    G.drips(ctx, 2, y + 3.6, STRIP_W - 4, 5, 5101 + state, 2);
    if (lit) {
      flat(ctx, 5, y + 3.6, STRIP_W - 10, 3.2, TUBE[0]);
      flat(ctx, 5, y + 6, STRIP_W - 10, 0.8, TUBE[2]);
      for (const x of [3.6, STRIP_W - 6]) flat(ctx, x, y + 3.4, 2.4, 3.6, TUBE[3], HOUSING[0]);
      glow(ctx, 24, y + 5.2, 9, "#ffffff", 0.5);
      return;
    }
    shape(ctx, [[5, y + 3.6], [23, y + 3.6], [21.6, y + 5.2], [22.6, y + 6.8], [5, y + 6.8]], DEAD[0], DEAD[2]);
    shape(ctx, [[27, y + 3.6], [STRIP_W - 5, y + 3.6], [STRIP_W - 5, y + 6.8], [26.4, y + 6.8], [27.6, y + 5]], DEAD[0], DEAD[2]);
    flat(ctx, 5, y + 6, STRIP_W - 10, 0.8, DEAD[1]);
    if (!simple()) line(ctx, [[30, y + 4], [32, y + 5.4], [31, y + 6.6]], DEAD[2], 0.5);
    for (const x of [3.6, STRIP_W - 6]) flat(ctx, x, y + 3.4, 2.4, 3.6, DEAD[1], HOUSING[0]);
  },
};
const wallGrille = {
  id: "wallGrille",
  box: [-2, -18, 26, 1],
  draw(ctx) {
    const seed = 5200;
    flat(ctx, 0, -16, 24, 16, FRAME[1], FRAME[4]);
    flat(ctx, 0, -16, 24, 1, FRAME[3]);
    flat(ctx, 0, -1, 24, 1, FRAME[0]);
    flat(ctx, 2.5, -13.5, 19, 12, "#1c1a14");
    flat(ctx, 3.6, -12.4, 16.8, 10, "#2a1810");
    for (let k = 0; k < 4; k++) {
      const y = -11.6 + k * 2.5;
      shape(ctx, [[5, y + 1.4], [8, y], [19, y], [19, y + 1.4]], BUNK[0]);
      shape(ctx, [[11, y + 1.4], [12.4, y], [19, y], [19, y + 1.4]], BUNK[2]);
      flat(ctx, 15.5, y, 3.5, 1.4, WHITE[1]);
      if (!simple()) flat(ctx, 8, y + 1.4, 11, 0.5, HOUSING[0]);
    }
    flat(ctx, 18.6, -12.4, 1.2, 10, WHITE[2]);
    G.inside(ctx, G.rectRegion(ctx, 0, -16, 24, 16), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -16, 24, 16), seed, 0.8);
      G.dirt(ctx, 0, -16, 24, 16, seed + 1, 0.3);
    });
    G.drips(ctx, 2, -1.6, 6, 2, seed + 2, 1);
    G.chips(ctx, 0, -15.6, 24, seed + 3);
    G.chips(ctx, 2.5, -13.4, 19, seed + 4, G.DIRT);
  },
};
const wallBeacon = {
  id: "wallBeacon",
  box: [-2, -27, 14, 1],
  draw(ctx, state) {
    const lit = state === 0;
    const seed = 5300 + state;
    flat(ctx, 3, -10, 5, 10, TEAL[1], TEAL[4]);
    flat(ctx, 5.6, -10, 2.4, 10, WHITE[1]);
    flat(ctx, 3, -10, 1, 10, TEAL[0]);
    flat(ctx, 2, -1.4, 7, 1.4, TEAL[0], TEAL[4]);
    flat(ctx, 0, -24, 11, 14, TEAL[2], TEAL[4]);
    flat(ctx, 7, -24, 4, 14, WHITE[0]);
    flat(ctx, 7.6, -24, 2, 14, WHITE[1]);
    flat(ctx, 0, -24, 11, 1, TEAL[3]);
    flat(ctx, 0.6, -25.6, 9.8, 1.8, MOSS[1], TEAL[4]);
    flat(ctx, 0.6, -25.6, 9.8, 0.6, MOSS[2]);
    if (!simple()) for (const y of [-13.6, -12]) flat(ctx, 1.2, y, 4.6, 0.9, MOSS[y < -13 ? 1 : 2]);
    disc(ctx, 3.8, -18.6, 2.8, lit ? LENS[2] : LENS[1], TEAL[4]);
    disc(ctx, 3.8, -18.6, 1.7, lit ? LENS[3] : LENS[0]);
    if (lit) {
      disc(ctx, 3.2, -19.3, 0.7, LENS[4]);
      glow(ctx, 3.8, -18.6, simple() ? 7 : 12, LENS[3], 0.45);
    }
    G.inside(ctx, G.rectRegion(ctx, 0, -24, 11, 24), () => G.grain(ctx, G.rectRegion(ctx, 0, -24, 11, 24), seed, 0.6));
    G.drips(ctx, 0.5, -10, 6, 4, seed + 1, 1);
    G.chips(ctx, 0.6, -25.2, 9.8, seed + 2, G.DIRT);
  },
};
const GLYPHS = {
  S: [[1, 0, 7, 3], [0, 1, 3, 5], [1, 4, 6, 3], [5, 5, 3, 5], [0, 8, 7, 3]],
  U: [[0, 0, 3, 10], [5, 0, 3, 10], [1, 8, 6, 3]],
  B: [[0, 0, 3, 11], [0, 0, 6, 3], [4, 1, 3, 4], [0, 4, 7, 3], [5, 5, 3, 5], [0, 8, 7, 3]],
  1: [[3, 0, 3, 11], [1, 1, 2, 3], [1, 8, 7, 3]],
  2: [[0, 0, 7, 3], [5, 1, 3, 4], [1, 4, 6, 3], [0, 5, 3, 4], [0, 8, 8, 3]],
  3: [[0, 0, 7, 3], [5, 1, 3, 9], [2, 4, 5, 3], [0, 8, 7, 3]],
  4: [[0, 0, 3, 7], [0, 4, 8, 3], [5, 1, 3, 10]],
};
const stencil = (ctx, str, x, y) => {
  const placed = [];
  for (const ch of str) {
    if (ch === " ") { x += 5; continue; }
    for (const [gx, gy, w, h] of GLYPHS[ch]) placed.push([x + gx, y + gy, w, h]);
    x += 10;
  }
  for (const [px, py, w, h] of placed) flat(ctx, px + 1, py + 1, w, h, OCHRE[0]);
  for (const [px, py, w, h] of placed) flat(ctx, px, py, w, h, OCHRE[1]);
  if (!simple()) for (const [px, py, w] of placed) flat(ctx, px, py, w, 0.7, OCHRE[2]);
};
const SUB_W = 72;
const subSign = {
  id: "subSign",
  box: [-1, -25, 73, 1],
  draw(ctx, state) {
    const seed = 5400 + state;
    const r = rng(seed);
    flat(ctx, 0, -24, SUB_W, 24, PLATE[2], PLATE[4]);
    const n = simple() ? 30 : 90;
    for (let k = 0; k < n; k++) flat(ctx, r() * (SUB_W - 2), -24 + r() * 22, 1 + r() * 2, 1 + r() * 1.5, PLATE[k % 3 === 0 ? 3 : k % 3 === 1 ? 1 : 0]);
    flat(ctx, 0, -24, SUB_W, 1, PLATE[3]);
    flat(ctx, 0, -1.2, SUB_W, 1.2, PLATE[0]);
    stencil(ctx, `SUB ${state + 1}`, 15.5, -17.5);
    for (const x of [2.4, SUB_W - 2.4]) for (const y of [-21.6, -2.4]) disc(ctx, x, y, 0.9, PLATE[0], PLATE[4]);
    G.inside(ctx, G.rectRegion(ctx, 0, -24, SUB_W, 24), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -24, SUB_W, 24), seed, 0.35);
      faded(ctx, 0.6, () => G.drips(ctx, 4, -23, SUB_W - 8, 6, seed + 1, 2));
    });
    for (const [x, y, dx, dy] of [[0, -24, 1, 1], [SUB_W, -24, -1, 1], [0, 0, 1, -1], [SUB_W, 0, -1, -1]]) shape(ctx, [[x, y], [x + dx * (2 + r() * 2), y], [x, y + dy * (2 + r() * 2)]], PLATE[4]);
    G.chips(ctx, 4, -23.4, SUB_W - 8, seed + 2, G.DIRT);
  },
};
const tube = (ctx, a, b, w = 3) => {
  line(ctx, [a, b], BUNK[4], w + 1, "butt");
  line(ctx, [a, b], BUNK[1], w, "butt");
  line(ctx, [[a[0], a[1] - w * 0.25], [b[0], b[1] - w * 0.25]], BUNK[3], w * 0.3, "butt");
};
const bunkBed = (ctx, x0, x1, y0, y1, seed) => {
  const r = rng(seed);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const sag = 3;
  const top = [[x0, y0 - 1], [mx, my + sag - 1], [x1, y1 - 1]];
  const mat = [[x0 + 2, y0 - 1], [x0 + 3, y0 - 6], [mx, my + sag - 5], [x1 - 3, y1 - 6], [x1 - 2, y1 - 1], [mx, my + sag]];
  ctx.fillStyle = color(MATT[1]);
  ctx.beginPath();
  ctx.moveTo(x0 + 2, y0 - 1);
  ctx.quadraticCurveTo(x0 + 1, y0 - 6, x0 + 5, y0 - 6.4);
  ctx.quadraticCurveTo(mx, my + sag * 2 - 7, x1 - 5, y1 - 6.4);
  ctx.quadraticCurveTo(x1 - 1, y1 - 6, x1 - 2, y1 - 1);
  ctx.quadraticCurveTo(mx, my + sag * 2, x0 + 2, y0 - 1);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, MATT[4]);
  clipped(ctx, mat, () => {
    curve(ctx, [[x0 + 3, y0 - 5.4], [mx, my + sag * 2 - 6], [x1 - 3, y1 - 5.4]], MATT[2], 1.2);
    if (!simple()) for (let x = x0 + 8; x < x1 - 4; x += 7) line(ctx, [[x, y0 - 6], [x + 1, y0]], MATT[0], 0.5);
    G.grain(ctx, G.polyRegion(ctx, mat), seed, 0.8);
    G.dirt(ctx, x0, y0 - 7, x1 - x0, 7, seed + 1, 0.5);
  });
  const tx = x0 + (x1 - x0) * (0.3 + r() * 0.3);
  const ty = y0 + (y1 - y0) * ((tx - x0) / (x1 - x0)) + sag - 4.6;
  const tear = [[tx - 6, ty + 0.4], [tx - 3, ty - 1.4], [tx, ty - 0.6], [tx + 3, ty - 1.8], [tx + 6, ty + 0.2], [tx + 2, ty + 1.6], [tx - 2, ty + 1.2]];
  shape(ctx, tear, MATT[3], MATT[4]);
  if (!simple()) shape(ctx, [[tx - 3, ty + 0.2], [tx, ty - 0.4], [tx + 3, ty + 0.4], [tx, ty + 1]], MATT[0]);
  curve(ctx, top, BUNK[4], 3);
  curve(ctx, top, BUNK[2], 1.8);
  if (!simple()) for (let k = 1; k < 8; k++) {
    const x = x0 + ((x1 - x0) * k) / 8;
    const f = k / 8;
    const y = y0 + (y1 - y0) * f + sag * 4 * f * (1 - f) - 1;
    line(ctx, [[x, y - 0.6], [x, y + 1.4]], BUNK[0], 0.8);
  }
  G.rustPatch(ctx, x0 + 4, y0, 2.4, 1.2, seed + 2);
  G.drips(ctx, x0 + 6, y0 + 1, 24, 6, seed + 3, 2);
};
const post = (ctx, x, y0, y1, seed) => {
  tube(ctx, [x, y0], [x, y1], 3.4);
  flat(ctx, x - 2.6, y0 - 1.4, 5.2, 1.4, BUNK[0], BUNK[4]);
  G.inside(ctx, G.rectRegion(ctx, x - 2, y1, 4, y0 - y1), () => G.grain(ctx, G.rectRegion(ctx, x - 2, y1, 4, y0 - y1), seed, 0.8));
  G.rustPatch(ctx, x, y0 - 4, 1.4, 2, seed + 1);
};
const cellBunk = {
  id: "cellBunk",
  box: [-4, -62, 100, 2],
  draw(ctx, state) {
    const seed = 5500 + state * 11;
    shadow(ctx, -2, 98);
    if (state === 1) {
      post(ctx, 4, 0, -60, seed);
      post(ctx, 90, 0, -32, seed + 2);
      tube(ctx, [90, -32], [93, -38], 3.4);
      shape(ctx, [[91.4, -39], [95, -40.4], [94.6, -37]], BUNK[3], BUNK[4]);
      bunkBed(ctx, 4, 90, -16, -16, seed + 4);
      tube(ctx, [4, -16], [90, -16]);
      bunkBed(ctx, 4, 88, -44, -22, seed + 8);
      tube(ctx, [4, -44], [88, -22]);
      ctx.save();
      ctx.translate(70, -1);
      ctx.rotate(0.06);
      flat(ctx, 0, -5, 24, 5, MATT[1], MATT[4]);
      flat(ctx, 0, -5, 24, 1.2, MATT[2]);
      G.grain(ctx, G.rectRegion(ctx, 0, -5, 24, 5), seed + 12, 0.8);
      ctx.restore();
      if (!simple()) for (const [x, y] of [[62, -1], [66, -2], [96, -1]]) disc(ctx, x, y, 1, MATT[3]);
      G.chips(ctx, 0, -0.8, 96, seed + 14, G.DUST);
      return;
    }
    post(ctx, 4, 0, -60, seed);
    post(ctx, 92, 0, -60, seed + 2);
    bunkBed(ctx, 4, 92, -16, -16, seed + 4);
    tube(ctx, [4, -16], [92, -16]);
    bunkBed(ctx, 4, 92, -44, -44, seed + 8);
    tube(ctx, [4, -44], [92, -44]);
    for (const y of [-56, -24, -32]) tube(ctx, [92, y], [92, y], 1);
    if (!simple()) for (const y of [-38, -30, -22]) line(ctx, [[89, y], [95, y]], BUNK[1], 1.2);
    flat(ctx, 1, -61.4, 6, 1.6, BUNK[3], BUNK[4]);
    flat(ctx, 89, -61.4, 6, 1.6, BUNK[3], BUNK[4]);
    G.rustPatch(ctx, 92, -44, 2, 1.4, seed + 10);
    G.chips(ctx, 0, -0.8, 96, seed + 14, G.DUST);
  },
};
const LOCK_W = 22, LOCK_H = 38;
const lockerBody = (ctx, seed) => {
  flat(ctx, 0, -LOCK_H, LOCK_W, LOCK_H, LOCK[1], LOCK[4]);
  flat(ctx, 0, -LOCK_H, LOCK_W, 1.4, LOCK[3]);
  flat(ctx, 0, -3, LOCK_W, 3, LOCK[0]);
  flat(ctx, LOCK_W - 2, -LOCK_H + 1.4, 2, LOCK_H - 4.4, LOCK[0]);
};
const lockerDoor = (ctx, seed) => {
  flat(ctx, 2, -LOCK_H + 2.6, LOCK_W - 5, LOCK_H - 6.6, LOCK[2], LOCK[4]);
  flat(ctx, 2, -LOCK_H + 2.6, LOCK_W - 5, 0.8, LOCK[3]);
  for (let k = 0; k < 4; k++) {
    const y = -LOCK_H + 5 + k * 2.2;
    flat(ctx, 5, y, LOCK_W - 11, 1.1, HOLE);
    flat(ctx, 5, y + 1.1, LOCK_W - 11, 0.5, LOCK[3]);
  }
  flat(ctx, LOCK_W - 6, -21, 2.4, 5, BUNK[1], LOCK[4]);
  ctx.strokeStyle = color(BUNK[2]);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(LOCK_W - 4.8, -16, 1.6, 0, PI);
  ctx.stroke();
  flat(ctx, LOCK_W - 6.6, -15.6, 3.6, 3, RUSTY[1], LOCK[4]);
  G.drips(ctx, 5, -LOCK_H + 13, LOCK_W - 11, 10, seed + 1, 2);
};
const lockerGrime = (ctx, seed) => {
  G.inside(ctx, G.rectRegion(ctx, 0, -LOCK_H, LOCK_W, LOCK_H), () => {
    G.grain(ctx, G.rectRegion(ctx, 0, -LOCK_H, LOCK_W, LOCK_H), seed + 2);
    G.dirt(ctx, 0, -LOCK_H, LOCK_W, LOCK_H, seed + 3, 0.3);
  });
  G.rustPatch(ctx, 5, -9, 1.6, 1, seed + 4);
  G.chips(ctx, 0, -LOCK_H + 0.3, LOCK_W, seed + 5, G.DIRT);
};
const cellLocker = {
  id: "cellLocker",
  box: [-2, -42, 34, 2],
  draw(ctx, state) {
    const seed = 5600 + state * 7;
    shadow(ctx, -1, 24);
    lockerBody(ctx, seed);
    if (state === 1) {
      flat(ctx, 2, -LOCK_H + 2.6, LOCK_W - 5, LOCK_H - 6.6, HOLE);
      flat(ctx, 2, -25, LOCK_W - 5, 1.2, LOCK[0]);
      if (!simple()) {
        line(ctx, [[8, -LOCK_H + 4], [8, -LOCK_H + 7]], BUNK[1], 0.6);
        shape(ctx, [[5, -LOCK_H + 7], [11, -LOCK_H + 7], [12, -29], [9, -27], [6, -29.4]], MATT[0]);
        shape(ctx, [[4, -8], [12, -8], [11, -4], [5, -4]], BIN[0]);
      }
      lockerGrime(ctx, seed);
      const door = [[LOCK_W - 2, -LOCK_H + 2.6], [LOCK_W + 6, -LOCK_H + 5], [LOCK_W + 8, -5], [LOCK_W - 0.6, -4.2]];
      shape(ctx, door, LOCK[2], LOCK[4]);
      clipped(ctx, door, () => {
        for (let k = 0; k < 4; k++) line(ctx, [[LOCK_W, -LOCK_H + 6 + k * 2.2], [LOCK_W + 6, -LOCK_H + 8 + k * 2.2]], HOLE, 0.9);
        flat(ctx, LOCK_W + 4.4, -LOCK_H + 2, 2, LOCK_H, LOCK[3]);
        G.grain(ctx, G.polyRegion(ctx, door), seed + 6);
        G.rustPatch(ctx, LOCK_W + 4, -10, 1.6, 1.2, seed + 7);
      });
      for (const y of [-LOCK_H + 4.4]) flat(ctx, LOCK_W - 2.6, y, 2.2, 2.4, BUNK[2], LOCK[4]);
      return;
    }
    lockerDoor(ctx, seed);
    if (state === 2) {
      const dent = [[6, -24], [12, -27], [17, -22], [14, -14], [7, -16]];
      faded(ctx, 0.55, () => shape(ctx, dent, LOCK[0]));
      if (!simple()) curve(ctx, [[7, -16], [14, -15], [17, -22]], LOCK[3], 0.8);
      line(ctx, [[2, -LOCK_H + 2.6], [2, -6]], HOLE, 0.8);
      shape(ctx, [[LOCK_W - 4, -LOCK_H], [LOCK_W + 0.4, -LOCK_H], [LOCK_W + 0.4, -LOCK_H + 5]], HOLE);
      line(ctx, [[LOCK_W - 4, -LOCK_H], [LOCK_W + 1.2, -LOCK_H + 1.6], [LOCK_W + 0.4, -LOCK_H + 5]], LOCK[3], 0.9);
    }
    lockerGrime(ctx, seed);
  },
};
const PAIL = [[1, -18], [17, -18], [15.4, 0], [2.6, 0]];
const pail = (ctx, seed) => {
  shape(ctx, PAIL, BIN[1], BIN[4]);
  clipped(ctx, PAIL, () => {
    flat(ctx, 0, -18, 4, 18, BIN[2]);
    flat(ctx, 13, -18, 5, 18, BIN[0]);
    flat(ctx, 0, -12, 18, 3, RUSTY[1]);
    flat(ctx, 0, -12, 18, 0.7, RUSTY[2]);
    faded(ctx, 0.6, () => shape(ctx, [[8, -8], [12, -9.4], [13, -4], [9, -3]], BIN[0]));
    if (!simple()) curve(ctx, [[9, -3], [12.6, -4.4], [12, -9.4]], BIN[2], 0.6);
    G.grain(ctx, G.polyRegion(ctx, PAIL), seed);
    G.rustPatch(ctx, 5, -10.4, 2, 1.2, seed + 1);
    G.dirt(ctx, 0, -18, 18, 18, seed + 2, 0.35);
  });
  flat(ctx, 0.4, -19.2, 17.2, 1.6, BIN[2], BIN[4]);
  flat(ctx, 2, -18, 3, 4, SLOP[1]);
};
const slopBin = {
  id: "slopBin",
  box: [-4, -26, 44, 2],
  draw(ctx, state) {
    const seed = 5700 + state * 5;
    if (state === 1) {
      shadow(ctx, -2, 40);
      ctx.save();
      ctx.translate(24, -1.6);
      ctx.rotate(0.04);
      flat(ctx, 0, 0, 17, 1.6, BIN[2], BIN[4]);
      flat(ctx, 6, -1.2, 5, 1.2, BIN[1], BIN[4]);
      ctx.restore();
      const spill = [[18, -0.2], [21, -3], [26, -3.4], [31, -2.2], [36, -0.8], [40, 0], [16, 0.4]];
      shape(ctx, spill, SLOP[0], SLOP[3]);
      if (!simple()) {
        for (const [x, y, rr] of [[23, -2.4, 1.2], [29, -2, 0.9], [34, -1, 0.8]]) disc(ctx, x, y, rr, SLOP[2]);
        flat(ctx, 20, -2.4, 10, 0.5, SLOP[1]);
      }
      ctx.save();
      ctx.translate(1, -17.4);
      ctx.rotate(PI / 2 - 0.05);
      pail(ctx, seed);
      ctx.restore();
      shape(ctx, [[19.4, -17.4], [21.6, -15], [21.6, -3], [20, -1]], HOLE);
      shape(ctx, [[20.4, -6], [23, -4], [21, -1]], SLOP[0]);
      G.chips(ctx, 0, -0.6, 40, seed + 3, G.DIRT);
      return;
    }
    shadow(ctx, 0, 18);
    curve(ctx, [[1.4, -18], [9, -25], [16.6, -18]], BIN[4], 1.4);
    curve(ctx, [[1.4, -18], [9, -25], [16.6, -18]], BIN[2], 0.7);
    pail(ctx, seed);
    G.drips(ctx, 3, -17.6, 3, 6, seed + 4, 1, false);
    ctx.save();
    ctx.translate(-1.5, -20);
    ctx.rotate(-0.22);
    flat(ctx, 0, -1.8, 19, 2, BIN[2], BIN[4]);
    flat(ctx, 0, -1.8, 19, 0.6, BIN[3]);
    flat(ctx, 7, -3.2, 5, 1.4, BIN[1], BIN[4]);
    ctx.restore();
    G.chips(ctx, 1, -18.8, 16, seed + 5, G.DIRT);
  },
};
for (const asset of [ceilingStrip, wallGrille, wallBeacon, subSign, cellBunk, cellLocker, slopBin]) define(asset);
})();
