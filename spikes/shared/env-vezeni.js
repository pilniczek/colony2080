(() => {
const { define, P, G } = window.ENV;
const { rng, path, flat, disc, glow, stroke, shape, line, hazard } = P;
const { PI, sin, cos, abs } = Math;
const simple = () => window.ENV.simple;
const LINE = "#080a08";
const PANEL = ["#182414", "#283030", "#3c4840", "#5a6a62"];
const GATE = ["#283030", "#445854", "#586464", "#7c8884"];
const CONC = ["#342810", "#4c3418", "#5c4428", "#805c38"];
const DUCT = ["#2c2614", "#443c20", "#60543c", "#685c40", "#988070", "#b0a86c"];
const HULL = ["#404440", "#686c60", "#888484", "#a4a4a4", "#c8ccc0"];
const TRACK = ["#040c0c", "#2c3838", "#404c4c", "#545854"];
const WRECK = ["#141a14", "#283030", "#404440", "#64605c"];
const KEYS = ["#6c6c66", "#a4a4a4", "#c0c4b8", "#f0f4ec"];
const BAR = ["#2c3838", "#545854", "#888484", "#c0c4b8"];
const HOLE = "#070605";
const RED = "#e0301c";
const GREEN = "#5ac060";

const plate = (ctx, x, y, w, h, T, e = 1) => {
  flat(ctx, x, y, w, h, T[1], LINE);
  flat(ctx, x + 0.5, y + 0.5, w - 1, e, T[3]);
  flat(ctx, x + 0.5, y + 0.5, e * 0.8, h - 1, T[2]);
  flat(ctx, x + 0.5, y + h - e - 0.5, w - 1, e, T[0]);
  flat(ctx, x + w - e - 0.5, y + 0.5, e, h - 1, T[0]);
};
const bolt = (ctx, x, y, c = PANEL) => {
  if (simple()) return;
  disc(ctx, x, y, 0.95, LINE);
  flat(ctx, x - 0.5, y - 0.6, 0.6, 0.6, c[3]);
};
const worn = (ctx, x, y, w, h, seed, drip = 0, rise = 0.3) => {
  G.surface(ctx, x, y, w, h, seed, { rise, drip, dripLen: h * 0.5 });
  G.chips(ctx, x, y + h - 1.2, w, seed + 7, G.DIRT);
};
const rough = (ctx, x, y, w, h, seed) => {
  flat(ctx, x, y, w, h, CONC[2], LINE);
  flat(ctx, x, y, Math.min(3, w * 0.2), h, CONC[3]);
  flat(ctx, x + w - Math.min(4, w * 0.25), y, Math.min(4, w * 0.25), h, CONC[1]);
  const r = rng(seed);
  const n = simple() ? Math.round(w * h / 60) : Math.round(w * h / 14);
  for (let i = 0; i < n; i++) {
    const px = x + r() * (w - 1.6), py = y + r() * (h - 1.2);
    const k = r();
    flat(ctx, px, py, 0.8 + r() * 1.6, 0.6 + r() * 0.9, k < 0.45 ? CONC[0] : k < 0.75 ? CONC[1] : CONC[3]);
  }
  worn(ctx, x, y, w, h, seed + 1, Math.max(1, Math.round(w / 14)), 0.25);
};
const rod = (ctx, x0, y0, x1, y1, w, T) => {
  line(ctx, [[x0, y0], [x1, y1]], LINE, w + 0.9, "butt");
  line(ctx, [[x0, y0], [x1, y1]], T[1], w, "butt");
  line(ctx, [[x0 - w * 0.15, y0], [x1 - w * 0.15, y1]], T[3], w * 0.35, "butt");
};
const bar = (ctx, x, y, w, h) => {
  flat(ctx, x, y, w, h, BAR[1], LINE);
  flat(ctx, x + w * 0.2, y, w * 0.25, h, BAR[3]);
  flat(ctx, x + w * 0.7, y, w * 0.3, h, BAR[0]);
};

const coverPanel = {
  id: "coverPanel",
  box: [-10, -46, 46, -14],
  draw(ctx, state) {
    const seed = 6100;
    flat(ctx, -1, -45, 46, 30, PANEL[0], LINE);
    if (state === 0) {
      plate(ctx, 0, -44, 44, 28, PANEL, 1.2);
      for (const [x, y] of [[3, -41], [41, -41], [3, -19], [41, -19]]) bolt(ctx, x, y);
      for (let i = 0; i < 5; i++) flat(ctx, 27 + i * 2.6, -38, 1.2, 12, PANEL[0]);
      hazard(ctx, 5, -24, 16, 3, 2);
      flat(ctx, 5, -38, 16, 9, PANEL[2], LINE);
      flat(ctx, 7, -35, 12, 1, PANEL[0]);
      flat(ctx, 7, -32.5, 8, 1, PANEL[0]);
      worn(ctx, 0, -44, 44, 28, seed, 3, 0.35);
      G.rustPatch(ctx, 36, -21, 3, 1.4, seed + 9);
      return;
    }
    flat(ctx, 1, -43, 42, 26, HOLE);
    plate(ctx, 3, -41, 20, 12, PANEL);
    flat(ctx, 5, -39, 16, 8, state === 2 ? "#1e4a22" : "#0c1a0e", LINE);
    if (state === 2) {
      glow(ctx, 13, -35, 12, GREEN, 0.35);
      for (const [y, w] of [[-37.6, 12], [-35.4, 9], [-33.2, 13]]) flat(ctx, 6.5, y, w, 0.9, GREEN);
    } else flat(ctx, 6.5, -37.6, 2, 1.2, GREEN);
    for (let i = 0; i < 3; i++) {
      const x = 26 + i * 5.4;
      flat(ctx, x, -41, 4.4, 12, KEYS[1], LINE);
      flat(ctx, x + 0.4, -40.6, 3.6, 3, KEYS[3]);
      flat(ctx, x + 0.4, -31.6, 3.6, 2, KEYS[0]);
    }
    for (let r = 0; r < 2; r++)
      for (let i = 0; i < 9; i++) {
        const x = 3.5 + i * 4.3 + r * 1.4, y = -27 + r * 4.4;
        flat(ctx, x, y, 3.6, 3.4, KEYS[2], LINE);
        flat(ctx, x + 0.3, y + 0.3, 3, 1, KEYS[3]);
      }
    disc(ctx, 40.5, -38, 1.3, state === 2 ? GREEN : RED, LINE);
    if (state === 2) glow(ctx, 40.5, -38, 4, GREEN, 0.5);
    G.grain(ctx, G.rectRegion(ctx, 1, -43, 42, 26), seed + 3, 0.6);
    G.dirt(ctx, 1, -43, 42, 26, seed + 4, 0.25);
    path(ctx, [[0, -44], [-8, -40], [-8, -18], [0, -16]]);
    ctx.fillStyle = PANEL[2];
    ctx.fill();
    stroke(ctx, LINE);
    flat(ctx, -7, -38, 1, 18, PANEL[3]);
    G.grain(ctx, G.polyRegion(ctx, [[0, -44], [-8, -40], [-8, -18], [0, -16]]), seed + 5);
    for (const y of [-40, -20]) flat(ctx, -1, y, 2, 3, BAR[2], LINE);
  },
};

const BARS_H = 96;
const cellBars = {
  id: "cellBars",
  box: [-14, -98, 30, 2],
  draw(ctx, state, _t, size = {}) {
    const seed = 6200;
    const top = size.top !== undefined ? Math.min(size.top, -BARS_H) : -BARS_H;
    if (top < -BARS_H) {
      rough(ctx, -2, top, 28, -BARS_H - top + 2, seed + 20);
    }
    plate(ctx, -2, -BARS_H, 28, 6, BAR);
    G.surface(ctx, -2, -BARS_H, 28, 6, seed, { rise: 0, drip: 3, dripLen: 10, edge: false });
    const xs = [2.5, 8.5, 14.5, 20.5];
    if (state === 0) {
      for (const x of xs) bar(ctx, x - 1.4, -BARS_H + 6, 2.8, BARS_H - 10);
      plate(ctx, -1, -54, 26, 4, BAR);
      for (const x of xs) bolt(ctx, x, -52, BAR);
      plate(ctx, -2, -4, 28, 4, BAR);
      G.inside(ctx, G.rectsRegion(ctx, xs.map(x => [x - 1.4, -BARS_H + 6, 2.8, BARS_H - 10])), () => {
        G.grain(ctx, G.rectRegion(ctx, -2, -BARS_H, 28, BARS_H), seed + 1);
        G.drips(ctx, 0, -50, 24, 26, seed + 2, 4);
        G.dirt(ctx, -2, -40, 28, 40, seed + 3, 0.5);
      });
      G.drips(ctx, -1, -50, 26, 10, seed + 4, 2);
      G.chips(ctx, -2, -BARS_H + 0.3, 28, seed + 5);
      return;
    }
    const stubs = [[2.5, 14, -9], [8.5, 22, -16], [14.5, 9, -6], [20.5, 18, -12]];
    for (const [x, len, bend] of stubs) {
      const y0 = -BARS_H + 6;
      line(ctx, [[x, y0], [x, y0 + len * 0.55], [x + bend, y0 + len]], LINE, 3.6);
      line(ctx, [[x, y0], [x, y0 + len * 0.55], [x + bend, y0 + len]], BAR[1], 2.8);
      line(ctx, [[x - 0.6, y0], [x - 0.6, y0 + len * 0.5]], BAR[3], 0.7);
    }
    for (const [x, len, bend] of [[2.5, 8, -10], [8.5, 5, -4], [14.5, 11, -14], [20.5, 6, -7]]) {
      line(ctx, [[x, -2], [x, -2 - len * 0.4], [x + bend, -2 - len]], LINE, 3.6);
      line(ctx, [[x, -2], [x, -2 - len * 0.4], [x + bend, -2 - len]], BAR[1], 2.8);
    }
    plate(ctx, -2, -4, 28, 4, BAR);
    G.chips(ctx, -2, -3.7, 28, seed + 6, G.DIRT);
    for (const [x, y] of [[2.5, -BARS_H + 6], [8.5, -BARS_H + 6], [14.5, -BARS_H + 6], [20.5, -BARS_H + 6]]) {
      G.scorch(ctx, [[x - 2.5, y], [x + 2.5, y], [x + 2, y + 4], [x - 2, y + 4]], seed + x);
    }
    ctx.save();
    ctx.translate(-6, -3);
    ctx.rotate(-0.12);
    plate(ctx, -8, -2, 24, 3.4, BAR);
    ctx.restore();
    G.drips(ctx, 0, -BARS_H + 6, 24, 14, seed + 7, 3);
    G.chips(ctx, -2, -BARS_H + 0.3, 28, seed + 8);
  },
};

const tracks = (ctx, x0, x1, h) => {
  const r = h / 2;
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const a = PI / 2 + (i / 8) * PI;
    pts.push([x0 + r + cos(a) * r, -r + sin(a) * r]);
  }
  for (let i = 0; i <= 8; i++) {
    const a = -PI / 2 + (i / 8) * PI;
    pts.push([x1 - r + cos(a) * r, -r + sin(a) * r]);
  }
  shape(ctx, pts, TRACK[1], LINE);
  if (!simple())
    for (let x = x0 + r; x < x1 - r; x += 3) {
      flat(ctx, x, -h - 0.2, 1.6, 1.4, TRACK[3]);
      flat(ctx, x, -1.2, 1.6, 1.4, TRACK[3]);
    }
  const wheels = 4, span = x1 - x0 - h;
  for (let i = 0; i < wheels; i++) {
    const cx = x0 + h / 2 + (span * i) / (wheels - 1);
    disc(ctx, cx, -r, r - 1.6, HULL[1], LINE);
    disc(ctx, cx, -r, r - 3.4, HULL[2]);
    disc(ctx, cx - 0.6, -r - 0.6, r - 5.2, HULL[3]);
    disc(ctx, cx, -r, 1.6, HULL[0], LINE);
    if (!simple())
      for (let k = 0; k < 5; k++) {
        const a = k * 2 * PI / 5;
        disc(ctx, cx + cos(a) * (r - 4.4), -r + sin(a) * (r - 4.4), 0.6, HULL[0]);
      }
  }
};

const crushedGuard = (ctx, seed) => {
  ctx.save();
  ctx.globalAlpha = 0.6;
  shape(ctx, [[-94, 0], [-90, -2], [-60, -2.6], [-30, -2], [-2, -1.6], [2, 0]], "#0a0806");
  ctx.restore();
  shape(ctx, [[-88, -1], [-84, -7], [-64, -8.4], [-60, -2]], WRECK[2], LINE);
  shape(ctx, [[-86, -7], [-84, -9], [-66, -10], [-64, -8.4]], WRECK[3], LINE);
  shape(ctx, [[-70, -2], [-66, -6], [-48, -7.4], [-46, -2]], WRECK[1], LINE);
  flat(ctx, -78, -6, 9, 1, WRECK[0]);
  shape(ctx, [[-58, -1], [-54, -14], [-34, -17], [-24, -11], [-20, -2]], WRECK[2], LINE);
  shape(ctx, [[-54, -14], [-50, -18], [-36, -20], [-34, -17]], WRECK[3], LINE);
  shape(ctx, [[-48, -10], [-36, -12], [-32, -6], [-46, -5]], WRECK[0], LINE);
  for (const [x, y] of [[-46, -12], [-40, -13], [-30, -9]]) bolt(ctx, x, y, WRECK);
  shape(ctx, [[-22, -2], [-24, -10], [-14, -13], [-6, -8], [-6, -2]], WRECK[1], LINE);
  shape(ctx, [[-20, -9], [-12, -11.4], [-10, -9], [-18, -7]], "#5a0a08");
  flat(ctx, -18, -9.6, 6, 1.2, RED);
  glow(ctx, -15, -9, 4, RED, 0.35);
  rod(ctx, -36, -16, -30, -30, 3, WRECK);
  rod(ctx, -30, -30, -20, -34, 2.6, WRECK);
  shape(ctx, [[-21, -36], [-16, -37], [-17, -32], [-20, -32]], WRECK[3], LINE);
  rod(ctx, -62, -6, -76, -12, 2.4, WRECK);
  G.inside(ctx, G.polysRegion(ctx, [[[-88, -1], [-86, -9], [-60, -10], [-46, -7], [-46, -2]], [[-58, -1], [-54, -14], [-36, -20], [-24, -11], [-20, -2]]]), () => {
    G.grain(ctx, G.rectRegion(ctx, -90, -22, 72, 22), seed);
    G.dirt(ctx, -90, -22, 72, 22, seed + 1, 0.5);
  });
  G.scorch(ctx, [[-50, -8], [-36, -14], [-28, -6], [-44, -3]], seed + 2);
  G.rim(ctx, [[-48, -10], [-36, -12], [-32, -6], [-46, -5]], seed + 3, BAR[3], LINE);
  if (!simple())
    for (const [x, y, c] of [[-28, -24, "#ffd860"], [-25, -26, "#ff9a30"], [-31, -22, "#ffffff"]]) flat(ctx, x, y, 0.9, 0.9, c);
};

const debris = (ctx, seed) => {
  const r = rng(seed);
  for (let i = 0; i < (simple() ? 6 : 14); i++) {
    const x = -10 + r() * 34, w = 2 + r() * 6, h = 1.5 + r() * 4;
    shape(ctx, [[x, 0], [x + w * 0.2, -h], [x + w * 0.8, -h * (0.6 + r() * 0.4)], [x + w, 0]], r() < 0.6 ? CONC[2] : CONC[3], LINE);
  }
  G.dirt(ctx, -12, -6, 40, 6, seed + 1, 1);
};

const scrapper = {
  id: "scrapper",
  box: [-96, -100, 98, 2],
  draw(ctx, state) {
    if (state !== 1) return;
    const seed = 6300;
    crushedGuard(ctx, seed);
    ctx.save();
    ctx.translate(96, 0);
    ctx.rotate(-0.035);
    ctx.translate(-96, 0);
    tracks(ctx, 16, 96, 18);
    const lower = [[4, -22], [12, -18], [94, -18], [96, -42], [26, -42], [8, -32]];
    shape(ctx, lower, HULL[2], LINE);
    shape(ctx, [[8, -32], [26, -42], [96, -42], [96, -38], [28, -38], [11, -29]], HULL[3]);
    shape(ctx, [[4, -22], [12, -18], [94, -18], [94, -22]], HULL[0]);
    hazard(ctx, 14, -27, 20, 3.4, 2.4);
    plate(ctx, 30, -66, 62, 24, HULL, 1.4);
    flat(ctx, 34, -62, 26, 6, HULL[0], LINE);
    flat(ctx, 35, -61, 24, 1.4, "#1e2424");
    flat(ctx, 64, -60, 24, 14, HULL[2], LINE);
    for (let i = 0; i < 5; i++) flat(ctx, 66 + i * 4.4, -58, 2, 10, HULL[0]);
    plate(ctx, 50, -80, 40, 14, HULL, 1.2);
    flat(ctx, 54, -77, 18, 5, "#1a2024", LINE);
    flat(ctx, 55, -76.4, 7, 1.2, "#6a8a90");
    disc(ctx, 84, -74, 1.6, "#ffb030", LINE);
    for (const [x, y] of [[33, -45], [89, -45], [33, -64], [89, -64], [53, -68], [87, -68]]) bolt(ctx, x, y, HULL);
    G.inside(ctx, G.polysRegion(ctx, [lower, G.rectPts(30, -66, 62, 24), G.rectPts(50, -80, 40, 14)]), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -82, 98, 64), seed + 10);
      G.drips(ctx, 30, -42, 60, 12, seed + 11, 3);
      G.dirt(ctx, 4, -42, 92, 24, seed + 12, 0.6);
      G.drips(ctx, 30, -66, 60, 9, seed + 13, 2);
      G.rustPatch(ctx, 44, -26, 4, 1.6, seed + 14);
      G.rustPatch(ctx, 80, -50, 3, 1.4, seed + 15);
    });
    G.chips(ctx, 30, -65.6, 62, seed + 16, G.DIRT);
    G.scorch(ctx, [[4, -22], [8, -32], [16, -36], [14, -20]], seed + 17);
    rod(ctx, 40, -64, 22, -94, 6, HULL);
    disc(ctx, 40, -64, 3.6, HULL[1], LINE);
    disc(ctx, 40, -64, 1.4, HULL[0]);
    rod(ctx, 22, -94, -8, -66, 5, HULL);
    disc(ctx, 22, -94, 3.4, HULL[2], LINE);
    disc(ctx, 22, -94, 1.2, HULL[0]);
    rod(ctx, 48, -70, 30, -86, 2, TRACK);
    rod(ctx, 30, -86, 26, -90, 3, HULL);
    disc(ctx, -8, -66, 3, HULL[1], LINE);
    shape(ctx, [[-8, -66], [-18, -60], [-26, -46], [-22, -44], [-15, -56], [-6, -62]], HULL[2], LINE);
    shape(ctx, [[-8, -66], [-4, -56], [-10, -42], [-6, -41], [0, -54], [-4, -64]], HULL[1], LINE);
    G.drips(ctx, 18, -92, 10, 12, seed + 18, 2);
    ctx.restore();
    debris(ctx, seed + 20);
  },
};

const DOOR_H = 80;
const idLockDoor = {
  id: "idLockDoor",
  box: [-36, -98, 50, 2],
  draw(ctx, state, _t, size = {}) {
    const seed = 6400;
    const top = size.top !== undefined ? Math.min(size.top, -96) : -96;
    flat(ctx, 3, -DOOR_H, 42, DOOR_H, HOLE);
    if (state === 1) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      shape(ctx, [[3, 0], [45, 0], [38, -10], [10, -10]], "#20201a");
      ctx.restore();
      flat(ctx, 39, -DOOR_H, 6, DOOR_H, PANEL[1], LINE);
      flat(ctx, 39.5, -DOOR_H, 1.2, DOOR_H, GATE[3]);
    } else {
      plate(ctx, 3, -DOOR_H, 42, DOOR_H, PANEL, 1.3);
      for (const y of [-62, -40, -18]) {
        flat(ctx, 5, y, 38, 2.2, PANEL[0]);
        flat(ctx, 5, y + 2.2, 38, 0.8, PANEL[3]);
      }
      flat(ctx, 34, -DOOR_H + 2, 4, DOOR_H - 4, GATE[1], LINE);
      flat(ctx, 34.6, -DOOR_H + 2, 1.2, DOOR_H - 4, GATE[3]);
      for (const y of [-70, -50, -28, -8]) bolt(ctx, 36, y, GATE);
      hazard(ctx, 3, -6, 42, 4, 3);
      worn(ctx, 3, -DOOR_H, 42, DOOR_H, seed, 5, 0.3);
      G.rustPatch(ctx, 14, -33, 4, 2, seed + 9);
    }
    rough(ctx, -1, top, 50, -DOOR_H - top, seed + 20);
    flat(ctx, -1, -DOOR_H - 2, 50, 3, GATE[1], LINE);
    G.chips(ctx, -1, -DOOR_H - 1.8, 50, seed + 3);
    for (const x of [0, 45]) {
      flat(ctx, x, -DOOR_H, 3, DOOR_H, GATE[1], LINE);
      flat(ctx, x + 0.5, -DOOR_H, 0.8, DOOR_H, GATE[3]);
    }
    G.grain(ctx, G.rectsRegion(ctx, [[0, -DOOR_H, 3, DOOR_H], [45, -DOOR_H, 3, DOOR_H]]), seed + 4);
    line(ctx, [[-12, -36], [-12, -42], [-2, -42]], LINE, 2.4);
    line(ctx, [[-12, -36], [-12, -42], [-2, -42]], PANEL[2], 1.4);
    plate(ctx, -34, -52, 22, 26, BAR, 1.2);
    flat(ctx, -31, -49, 16, 8, state === 1 ? "#1e4a22" : "#0c1a0e", LINE);
    if (state === 1) for (const [y, w] of [[-47.6, 10], [-45, 7]]) flat(ctx, -29.5, y, w, 0.9, GREEN);
    else for (const [y, w] of [[-47.6, 6], [-45, 11]]) flat(ctx, -29.5, y, w, 0.9, "#2e7a34");
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) flat(ctx, -31 + c * 4, -39 + r * 3.6, 3, 2.6, KEYS[1 + ((r + c) % 2)], LINE);
    flat(ctx, -18, -39, 3, 10, "#1a1a18", LINE);
    flat(ctx, -17.2, -38, 1.4, 8, "#000000");
    disc(ctx, -16.5, -49.5, 1.2, state === 1 ? GREEN : RED, LINE);
    glow(ctx, -16.5, -49.5, 3.6, state === 1 ? GREEN : RED, 0.45);
    worn(ctx, -34, -52, 22, 26, seed + 5, 2, 0.3);
  },
};

const GATE_W = 72, GATE_H = 96, LINTEL = 76;
const gateLift = [0, 9, 64];
const gateDoor = {
  id: "gateDoor",
  box: [-2, -98, 74, 2],
  draw(ctx, state, _t, size = {}) {
    const seed = 6500;
    const top = size.top !== undefined ? Math.min(size.top, -GATE_H) : -GATE_H;
    const lift = gateLift[state] ?? 0;
    const ox = 12, ow = 48;
    flat(ctx, ox, -LINTEL, ow, LINTEL, HOLE);
    if (lift) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      shape(ctx, [[ox, 0], [ox + ow, 0], [ox + ow - 8, -12], [ox + 8, -12]], "#2c2418");
      ctx.restore();
      G.grain(ctx, G.rectRegion(ctx, ox, -12, ow, 12), seed + 30, 0.5);
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, -LINTEL, ow, LINTEL);
    ctx.clip();
    ctx.translate(0, -lift);
    if (state === 1) {
      ctx.translate(ox, 0);
      ctx.rotate(-0.03);
      ctx.translate(-ox, 0);
    }
    const dh = LINTEL + 4;
    plate(ctx, ox, -dh, ow, dh, GATE, 1.4);
    for (const [x, y, w] of [[ox + 22, -60, 24], [ox + 2, -44, 44], [ox + 26, -30, 20]]) {
      flat(ctx, x, y, w, 1.6, GATE[0]);
      flat(ctx, x, y + 1.6, w, 0.7, GATE[3]);
    }
    hazard(ctx, ox, -15, ow, 5, 3.4);
    flat(ctx, ox, -5, ow, 5, GATE[0], LINE);
    flat(ctx, ox, -5, ow, 1, GATE[2]);
    worn(ctx, ox, -dh, ow, dh, seed, 6, 0.3);
    G.rustPatch(ctx, ox + 10, -26, 4, 2, seed + 8);
    G.rustPatch(ctx, ox + 38, -52, 3, 1.6, seed + 9);
    if (state === 1) {
      G.scorch(ctx, [[ox + 30, -4], [ox + 40, -4], [ox + 38, 0], [ox + 32, 0]], seed + 10);
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.45;
    flat(ctx, ox, -LINTEL, 4, LINTEL, "#000000");
    flat(ctx, ox, -LINTEL, ow, 4, "#000000");
    ctx.restore();
    rough(ctx, 0, -LINTEL, ox, LINTEL, seed + 20);
    rough(ctx, ox + ow, -LINTEL, GATE_W - ox - ow, LINTEL, seed + 21);
    rough(ctx, -1, top, GATE_W + 2, -LINTEL - top, seed + 22);
    flat(ctx, -1, -LINTEL - 1.5, GATE_W + 2, 1.5, CONC[0]);
    bar(ctx, 2, top + 2, 5, -top - 2);
    flat(ctx, 1, -4, 7, 4, GATE[0], LINE);
    G.grain(ctx, G.rectRegion(ctx, 2, top + 2, 5, -top - 2), seed + 23);
    G.drips(ctx, 2, -60, 5, 30, seed + 24, 2);
    plate(ctx, 1.5, -46, 9, 13, BAR, 0.9);
    disc(ctx, 6, -41, 1.5, "#141414");
    flat(ctx, 5.5, -41, 1, 3, "#141414");
    for (const y of [-44.5, -34.5]) bolt(ctx, 6, y, BAR);
    G.chips(ctx, 1.5, -45.6, 9, seed + 25, G.DIRT);
  },
};

const ventControl = {
  id: "ventControl",
  box: [-2, -74, 34, 2],
  draw(ctx, state, _t, size = {}) {
    const seed = 6600;
    const top = size.top !== undefined ? Math.min(size.top, -54) : -72;
    flat(ctx, 23, top, 3, -54 - top, PANEL[1], LINE);
    flat(ctx, 23.5, top, 0.8, -54 - top, PANEL[3]);
    for (let y = top + 6; y < -56; y += 10) flat(ctx, 21.5, y, 6, 1.6, BAR[1], LINE);
    plate(ctx, 9, -24, 12, 24, PANEL);
    hazard(ctx, 9, -8, 12, 4, 2.4);
    flat(ctx, 6, -2, 18, 2, PANEL[0], LINE);
    const head = [[0, -22], [30, -22], [30, -54], [2, -54], [0, -50]];
    shape(ctx, head, PANEL[2], LINE);
    shape(ctx, [[0, -50], [2, -54], [30, -54], [30, -52], [3, -52], [1.6, -49]], PANEL[3]);
    flat(ctx, 0, -26, 30, 4, PANEL[1], LINE);
    flat(ctx, 4, -50, 22, 14, "#0c1410", LINE);
    if (state === 1) {
      flat(ctx, 5, -49, 20, 12, "#1e4a22");
      glow(ctx, 15, -43, 12, GREEN, 0.3);
      ctx.save();
      ctx.translate(11, -43);
      for (let k = 0; k < 3; k++) {
        const a = k * 2 * PI / 3 + 0.4;
        shape(ctx, [[0, 0], [cos(a) * 4.2, sin(a) * 4.2], [cos(a + 0.6) * 3.6, sin(a + 0.6) * 3.6]], GREEN);
      }
      ctx.restore();
      flat(ctx, 17, -45, 6, 1.6, GREEN);
      flat(ctx, 17, -42, 4, 1.6, GREEN);
    } else {
      flat(ctx, 5, -49, 20, 12, "#0c1a0e");
      for (let i = 0; i < 6; i++) flat(ctx, 6.5 + i * 2.8, -41.5, 1.8, 2, GREEN);
      flat(ctx, 6.5, -47, 10, 1, "#2e7a34");
      plate(ctx, 20, -48, 4, 4, ["#3a0806", "#8a1a10", "#b02818", "#e05030"]);
    }
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 4; c++) flat(ctx, 4 + c * 4.4, -34 + r * 3.8, 3.4, 2.8, KEYS[1 + ((r + c) % 2)], LINE);
    flat(ctx, 23, -34, 3, 6.6, "#1a1a18", LINE);
    disc(ctx, 26.5, -50.5, 1.1, state === 1 ? GREEN : RED, LINE);
    glow(ctx, 26.5, -50.5, 3.4, state === 1 ? GREEN : RED, 0.5);
    G.inside(ctx, G.polysRegion(ctx, [head, G.rectPts(9, -24, 12, 24)]), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -56, 32, 56), seed);
      G.drips(ctx, 1, -26, 28, 10, seed + 1, 3);
      G.dirt(ctx, 9, -24, 12, 24, seed + 2, 0.5);
      G.rustPatch(ctx, 4, -30, 2, 1, seed + 3);
    });
    G.chips(ctx, 2, -53.6, 28, seed + 4);
  },
};

const SHAFT_W = 72, SHAFT_H = 96, FAN_Y = 30;
const ribs = (ctx, x, y, w, h, T, step) => {
  flat(ctx, x, y, w, h, T[2]);
  for (let i = x; i < x + w; i += step) {
    flat(ctx, i, y, step * 0.25, h, T[4]);
    flat(ctx, i + step * 0.25, y, step * 0.2, h, T[3]);
    flat(ctx, i + step * 0.7, y, step * 0.3, h, T[1]);
  }
};
const propeller = (ctx, cx, cy, r, angle, spinning) => {
  if (spinning) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, 3.4, 0, 0, 2 * PI);
    ctx.fillStyle = HULL[2];
    ctx.fill();
    ctx.restore();
  }
  const blades = [0, 1, 2].map(k => angle + k * 2 * PI / 3).sort((a, b) => sin(a) - sin(b));
  for (const a of blades) {
    const tip = cos(a) * r;
    const lift = sin(a) * 2.6;
    const wide = 2.2 + abs(sin(a)) * 2.4;
    const shade = sin(a) > 0 ? HULL[3] : HULL[1];
    shape(ctx, [[cx, cy - 1.2], [cx + tip * 0.5, cy - wide * 0.5 + lift * 0.5], [cx + tip, cy - wide * 0.3 + lift], [cx + tip, cy + wide * 0.3 + lift], [cx + tip * 0.5, cy + wide * 0.5 + lift * 0.5], [cx, cy + 1.2]], shade, LINE);
  }
  flat(ctx, cx - 4, cy - 2.6, 8, 5.2, HULL[1], LINE);
  flat(ctx, cx - 4, cy - 2.6, 8, 1.4, HULL[3]);
};
const ventShaft = {
  id: "ventShaft",
  box: [-2, -28, 74, 98],
  anim: true,
  draw(ctx, state, t = 0, size = {}) {
    const seed = 6700;
    const depth = size.h || SHAFT_H;
    const wall = 9;
    ribs(ctx, wall, 0, SHAFT_W - wall * 2, depth, ["#1c180c", "#2c2616", "#3c3422", "#463c28", "#5a4e36"], 6);
    ctx.save();
    ctx.globalAlpha = 0.6;
    flat(ctx, wall, 0, SHAFT_W - wall * 2, 10, "#000000");
    ctx.restore();
    flat(ctx, wall, FAN_Y + 4, SHAFT_W - wall * 2, 3, DUCT[0], LINE);
    for (const x of [wall + 4, SHAFT_W / 2 - 1, SHAFT_W - wall - 6]) flat(ctx, x, FAN_Y + 2, 2, 7, DUCT[1], LINE);
    flat(ctx, SHAFT_W / 2 - 0.8, -12, 1.6, FAN_Y + 10, BAR[2], LINE);
    const spinning = state !== 1;
    propeller(ctx, SHAFT_W / 2, FAN_Y, SHAFT_W / 2 - wall - 2, spinning ? t * 14 : 0.5, spinning);
    for (const x of [0, SHAFT_W - wall]) {
      ribs(ctx, x, 0, wall, depth, DUCT, 3);
      ctx.beginPath();
      ctx.rect(x, 0, wall, depth);
      stroke(ctx, LINE);
    }
    G.inside(ctx, G.rectsRegion(ctx, [[0, 0, wall, depth], [SHAFT_W - wall, 0, wall, depth]]), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, 0, SHAFT_W, depth), seed);
      G.drips(ctx, 0, 2, SHAFT_W, depth * 0.5, seed + 1, 6);
    });
    for (const x of [-2, SHAFT_W - wall - 1]) {
      flat(ctx, x, -2, wall + 3, 4, DUCT[4], LINE);
      flat(ctx, x, 1, wall + 3, 1.2, DUCT[1]);
      G.chips(ctx, x, -1.6, wall + 3, seed + 2 + x, G.DIRT);
    }
    plate(ctx, wall - 1, -3, SHAFT_W - wall * 2 + 2, 2.4, BAR, 0.6);
    for (const x of [wall + 6, SHAFT_W - wall - 8]) flat(ctx, x, -0.6, 2, 3, BAR[0], LINE);
    rod(ctx, 9.5, -2, 9.5, -24, 2.2, BAR);
    flat(ctx, 6, -26, 7, 2.4, BAR[2], LINE);
    plate(ctx, 30, -20, 12, 14, PANEL, 1);
    flat(ctx, 33, -6, 6, 4, PANEL[0], LINE);
    for (let i = 0; i < 3; i++) flat(ctx, 31.5, -17 + i * 2.4, 6, 1, PANEL[0]);
    disc(ctx, 39, -16, 1.4, spinning ? RED : "#5a1a10", LINE);
    if (spinning) glow(ctx, 39, -16, 4.6, RED, 0.3 + 0.25 * (0.5 + 0.5 * sin(t * 6)));
    worn(ctx, 30, -20, 12, 14, seed + 3, 2, 0.3);
  },
};

for (const asset of [coverPanel, cellBars, scrapper, idLockDoor, gateDoor, ventControl, ventShaft]) define(asset);
})();
