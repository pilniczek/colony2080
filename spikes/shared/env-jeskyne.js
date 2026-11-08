(() => {
const { define, P, G, itemViews } = window.ENV;
const { rng, path, flat, box, cylV, disc, rivets, glow, stroke, shape, line, hazard } = P;
const { PI, sin, cos, round } = Math;
const simple = () => window.ENV.simple;
const ROCK = ["#0e0906", "#1c130d", "#2c1f15", "#46321f"];
const STONE = ["#2e2a24", "#4c463c", "#6e6656", "#968c78"];
const SHARD = ["#404440", "#70706c", "#a4a4a4", "#c0c4b8"];
const LIP = ["#182414", "#203024", "#303824", "#445854"];
const CHROME = ["#303824", "#605c50", "#887870", "#b4b090"];
const MOSS = ["#203024", "#443c20", "#584c30", "#aca884"];
const CRATE = ["#1c140c", "#3c341c", "#444418", "#54541c"];
const MAGMA = ["#100c08", "#401c08", "#582404", "#682c08", "#78200c", "#90280c"];
const RLINE = "#060403";
const DOOR_H = 120;
const STEEL = ["#141c10", "#2c3420", "#444c36", "#646c5c"];
const SEDGE = "#5a6660";
const SLINE = "#080c06";
const LAMP_ON = "#5ac060";
const LAMP_OFF = "#d03818";
const plate = (ctx, x, y, w, h) => {
  flat(ctx, x, y, w, h, STEEL[1], SLINE);
  flat(ctx, x + 0.6, y + 0.6, w - 1.2, 0.9, STEEL[3]);
  flat(ctx, x + 0.6, y + 0.6, 0.9, h - 1.2, STEEL[2]);
  flat(ctx, x + 0.6, y + h - 1.6, w - 1.2, 1, STEEL[0]);
  flat(ctx, x + w - 1.6, y + 0.6, 1, h - 1.2, STEEL[0]);
};
const post = (ctx, x, y, w, h) => {
  flat(ctx, x, y, w, h, STEEL[1], SLINE);
  flat(ctx, x + w * 0.28, y, w * 0.22, h, SEDGE);
  flat(ctx, x + w * 0.72, y, w * 0.28, h, STEEL[0]);
};
const stud = (ctx, x, y) => {
  disc(ctx, x, y, 0.95, SLINE);
  flat(ctx, x - 0.55, y - 0.65, 0.6, 0.6, STEEL[3]);
};
const studs = (ctx, x, y, w, step) => {
  if (!simple())
    for (let i = x + step / 2; i < x + w; i += step)
      stud(ctx, i, y);
};
const studsV = (ctx, x, y, h, step) => {
  if (!simple())
    for (let j = y + step / 2; j < y + h; j += step)
      stud(ctx, x, j);
};
const brace = (ctx, x, y, w, h) => {
  line(ctx, [[x + 1, y + h - 1], [x + w - 1, y + 1]], STEEL[0], 1.6);
  line(ctx, [[x + 1.5, y + h - 1], [x + w - 0.5, y + 1]], STEEL[3], 0.6);
  line(ctx, [[x + 1, y + 1], [x + w - 1, y + h - 1]], STEEL[0], 1.2);
};
const worn = (ctx, x, y, w, h, seed, drip = 0, rise = 0.3) => {
  G.surface(ctx, x, y, w, h, seed, { rise, drip, dripLen: h * 0.55 });
  G.chips(ctx, x, y + h - 1.4, w, seed + 7, G.DIRT);
};
const jag = (x0, x1, y, amp, step, seed) => {
  const r = rng(seed);
  const pts = [];
  for (let x = x0; x < x1; x += step * (0.6 + r() * 0.8))
    pts.push([x, y + (r() - 0.5) * 2 * amp]);
  pts.push([x1, y + (r() - 0.5) * 2 * amp]);
  return pts;
};
const veil = (ctx, pts, c, alpha) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  shape(ctx, pts, c);
  ctx.restore();
};
const shard = (ctx, x, top, w, len, lean) => {
  const tip = [x + w / 2 + lean, top + len];
  const mid = [x + w * 0.55 + lean * 0.4, top + len * 0.35];
  shape(ctx, [[x, top], [x + w, top], tip], SHARD[1]);
  shape(ctx, [[x, top], mid, tip], SHARD[3]);
  shape(ctx, [[x + w * 0.5, top], [x + w, top], mid], SHARD[2]);
  shape(ctx, [mid, [x + w, top], tip], SHARD[1]);
  line(ctx, [[x + w * 0.2, top + 2], [x + w * 0.45 + lean * 0.7, top + len * 0.7]], "#fcfcfc", 0.8);
  line(ctx, [mid, tip], SHARD[0], 0.6);
  path(ctx, [[x, top], [x + w, top], tip]);
  stroke(ctx, "#141814", 0.9);
};
const SHARDS = [[0, 14, 15, 34, -5], [34, 14, 14, 32, 5], [7, 16, 15, 46, -2], [25, 16, 15, 42, 3], [16, 17, 15, 55, 1]];
const lipPts = [[-4, -2], [52, -2], [52, 14], ...jag(-4, 52, 19, 2.4, 5, 931).reverse(), [-4, 14]];
const stalactiteLip = (ctx, broken) => {
  shape(ctx, lipPts, LIP[1]);
  ctx.save();
  path(ctx, lipPts);
  ctx.clip();
  shape(ctx, [[-4, -2], [20, -2], [14, 10], [-4, 12]], LIP[2]);
  shape(ctx, [[30, 4], [52, -2], [52, 22], [40, 22]], "#301c10");
  shape(ctx, [[42, 2], [52, 0], [52, 22], [46, 22]], "#8c5030");
  line(ctx, [[49, 4], [50, 20]], "#a86034", 1);
  for (const y of [5, 11])
    line(ctx, jag(-4, 40, y, 1, 6, 932 + y), LIP[0], 0.8);
  line(ctx, [[2, 4], [12, 3], [18, 8]], LIP[3], 0.8);
  G.grain(ctx, G.polyRegion(ctx, lipPts), 933, 0.55);
  if (broken)
    for (const [x, w] of [[9, 13], [17, 13], [27, 12]])
      shape(ctx, [[x + 1, 15], [x + w - 1, 15], [x + w * 0.6, 22], [x + w * 0.3, 21]], "#8a8a80");
  ctx.restore();
  path(ctx, lipPts);
  stroke(ctx, RLINE, 1.1);
  G.chips(ctx, 0, 15, 48, 934, G.DUST);
  G.drips(ctx, 4, 17, 40, 10, 935, 3, false);
};
const stalactiteStem = (ctx, top) => {
  const pts = [[6, top], [44, top], [40, 2], [10, 2]];
  shape(ctx, pts, ROCK[2]);
  shape(ctx, [[30, top], [44, top], [40, 2], [32, 2]], ROCK[1]);
  for (let y = top + 10; y < -4; y += 14)
    line(ctx, [[10, y], [24, y + 3], [40, y - 1]], ROCK[3], 0.8);
  G.grain(ctx, G.polyRegion(ctx, pts), 937, 0.6);
  path(ctx, pts);
  stroke(ctx, RLINE, 1.1);
};
const stalactite = {
  id: "stalactite",
  box: [-6, -2, 54, 92],
  draw(ctx, state, _t, { top } = {}) {
    if (top !== undefined && top < 0)
      stalactiteStem(ctx, top);
    if (state !== 1)
      for (const s of state === 2 ? [] : SHARDS)
        shard(ctx, ...s);
    if (state === 1) {
      ctx.save();
      ctx.translate(24, 30);
      ctx.rotate(0.1);
      ctx.translate(-24, -12);
      for (const s of SHARDS)
        shard(ctx, ...s);
      ctx.restore();
      for (let i = 0; i < 6; i++)
        shape(ctx, [[6 + i * 7, 22 + (i % 3) * 5], [9 + i * 7, 21 + (i % 3) * 5], [8 + i * 7, 26 + (i % 3) * 5]], SHARD[2 + (i % 2)], "#141814");
    }
    stalactiteLip(ctx, state !== 0);
  },
};
const crystalPrism = (ctx, x, w, h, lean) => {
  const top = [x + w / 2 + lean, -h];
  const pts = [[x, 0], [x + lean * 0.7, -h + w * 0.5], top, [x + w + lean * 0.7, -h + w * 0.5], [x + w, 0]];
  shape(ctx, pts, SHARD[1]);
  shape(ctx, [[x, 0], [x + lean * 0.7, -h + w * 0.5], top, [x + w * 0.45 + lean * 0.3, -h * 0.4], [x + w * 0.4, 0]], SHARD[3]);
  shape(ctx, [[x + w * 0.45 + lean * 0.3, -h * 0.4], top, [x + w + lean * 0.7, -h + w * 0.5]], SHARD[2]);
  line(ctx, [[x + w * 0.18, -2], [x + w * 0.3 + lean * 0.6, -h + w * 0.7]], "#fcfcfc", 0.9);
  line(ctx, [[x + w * 0.45 + lean * 0.3, -h * 0.4], [x + w * 0.4, 0]], SHARD[0], 0.6);
  path(ctx, pts);
  stroke(ctx, "#141814", 0.9);
};
const crystal = {
  id: "crystal",
  box: [-2, -50, 74, 2],
  draw(ctx, state) {
    const base = [[0, 0], [6, -5], [20, -7], [52, -6], [66, -4], [72, 0]];
    if (state === 1) {
      const r = rng(961);
      for (let i = 0; i < 11; i++) {
        const x = 4 + r() * 62;
        const s = 3 + r() * 6;
        shape(ctx, [[x, 0], [x + s * 0.3, -s], [x + s * 0.7, -s * 0.8], [x + s, 0]], SHARD[1 + (i % 3)], "#141814");
      }
      return;
    }
    shape(ctx, base, ROCK[2], RLINE);
    G.grain(ctx, G.polyRegion(ctx, base), 962);
    crystalPrism(ctx, 50, 14, 36, 5);
    crystalPrism(ctx, 6, 13, 30, -5);
    crystalPrism(ctx, 32, 15, 44, 3);
    crystalPrism(ctx, 16, 16, 48, -2);
    crystalPrism(ctx, 42, 11, 24, 6);
    crystalPrism(ctx, 2, 9, 16, -4);
  },
};
const leverBank = {
  id: "leverBank",
  box: [-20, -42, 20, 0],
  draw(ctx, state) {
    plate(ctx, -8, -25, 16, 25);
    flat(ctx, -6, -14, 12, 8, STEEL[0], SLINE);
    brace(ctx, -6, -14, 12, 8);
    hazard(ctx, -6, -5, 12, 3.4, 3);
    plate(ctx, -2.2, -23, 4.4, 9);
    studs(ctx, -8, -22.5, 16, 12);
    line(ctx, [[8, -11], [10.5, -9], [10.5, 0]], SLINE, 2.4);
    line(ctx, [[8, -11], [10.5, -9], [10.5, 0]], "#6c3c18", 1.4);
    flat(ctx, 7.2, -12.4, 2.6, 3, STEEL[1], SLINE);
    flat(ctx, -7, -24.2, 4, 1.6, "#a87c28", SLINE);
    worn(ctx, -8, -25, 16, 25, 970, 2, 0.4);
    const a = state === 0 ? 2.5 : state === 1 ? -0.65 : -PI / 2;
    for (const n of [2.5, -0.65, -PI / 2])
      line(ctx, [[cos(n) * 5.6, -18 + sin(n) * 5.6], [cos(n) * 8, -18 + sin(n) * 8]], STEEL[3], 0.7);
    const at = (r) => [cos(a) * r, -18 + sin(a) * r];
    const tip = at(18);
    line(ctx, [[0, -18], tip], SLINE, 3.4);
    line(ctx, [[0, -18], tip], STEEL[3], 2);
    line(ctx, [at(3), at(15)], "#c0c4b8", 0.5);
    line(ctx, [at(11), at(15.8)], SLINE, 3.8);
    line(ctx, [at(11), at(15.8)], "#242418", 2.6);
    if (!simple())
      for (const r of [12, 13.4, 14.8]) {
        const [x, y] = at(r);
        line(ctx, [[x - sin(a) * 1.3, y + cos(a) * 1.3], [x + sin(a) * 1.3, y - cos(a) * 1.3]], "#4a4a3c", 0.5);
      }
    disc(ctx, tip[0], tip[1], 2.6, "#b02818", SLINE);
    disc(ctx, tip[0] - 0.8, tip[1] - 0.8, 0.9, "#e05a3c");
    disc(ctx, 0, -18, 3, STEEL[1], SLINE);
    disc(ctx, 0, -18, 1.9, STEEL[2], SLINE);
    disc(ctx, 0, -18, 0.7, STEEL[0]);
    disc(ctx, -0.6, -18.6, 0.5, "#c0c4b8");
    const [ux, uy] = [-sin(a) * 1.9, cos(a) * 1.9];
    const end = at(16);
    const handle = () => {
      ctx.beginPath();
      ctx.moveTo(ux, -18 + uy);
      ctx.lineTo(end[0] + ux, end[1] + uy);
      ctx.lineTo(end[0] - ux, end[1] - uy);
      ctx.lineTo(-ux, -18 - uy);
      ctx.closePath();
      ctx.moveTo(tip[0] + 2.6, tip[1]);
      ctx.arc(tip[0], tip[1], 2.6, 0, 2 * PI);
      ctx.moveTo(3, -18);
      ctx.arc(0, -18, 3, 0, 2 * PI);
    };
    G.grain(ctx, handle, 975);
    G.inside(ctx, handle, () => {
      const r = rng(976);
      for (let i = 0; i < 6; i++) {
        const [x, y] = at(2 + r() * 13);
        disc(ctx, x + (r() - 0.5) * 1.6, y + (r() - 0.5) * 1.6, 0.3 + r() * 0.4, i % 2 ? G.RUST[2] : G.RUST[1]);
      }
      for (let i = 0; i < 4; i++) {
        const k = r() * 2 * PI;
        disc(ctx, tip[0] + cos(k) * 2.2, tip[1] + sin(k) * 2.2, 0.4 + r() * 0.4, "#5a1408");
      }
      for (let i = 0; i < 3; i++) {
        const k = r() * 2 * PI;
        disc(ctx, cos(k) * 2.6, -18 + sin(k) * 2.6, 0.3 + r() * 0.3, G.DIRT);
      }
    });
  },
};
const doorSlab = (ctx, top, h, seed) => {
  box(ctx, 0, top, 24, h, "rust", 1, { vertical: true });
  for (let y = top + 10; y < top + h - 8; y += 14) {
    flat(ctx, 1, y, 22, 2, "r0");
    flat(ctx, 1, y + 2, 22, 0.8, "r3");
  }
  if (!simple()) {
    for (let y = top + 5; y < top + h - 4; y += 14) {
      disc(ctx, 3, y, 0.8, "r3");
      disc(ctx, 21, y, 0.8, "r3");
    }
  }
  G.grain(ctx, G.rectRegion(ctx, 0, top, 24, h), seed);
  G.drips(ctx, 0, top, 24, h * 0.5, seed + 1, 3);
  G.dirt(ctx, 0, top, 24, h, seed + 2, 0.25);
  for (let y = top + 12; y < top + h - 8; y += 14)
    G.chips(ctx, 1, y + 2.8, 22, seed + y, G.DUST);
  G.chips(ctx, 0, top + h - 1.5, 24, seed + 3, G.DUST);
};
const slidingDoor = (ctx, shut, seed, lamp) => {
  const slabH = 16 + shut * (DOOR_H - 16);
  doorSlab(ctx, -DOOR_H, slabH, seed);
  if (shut < 1)
    hazard(ctx, 0, -DOOR_H + slabH - 6, 24, 6, 5);
  for (const x of [-5, 24]) {
    post(ctx, x, -DOOR_H, 5, DOOR_H);
    studsV(ctx, x + 2.5, -DOOR_H + 4, DOOR_H - 8, 12);
    G.inside(ctx, G.rectRegion(ctx, x, -DOOR_H, 5, DOOR_H), () => worn(ctx, x, -DOOR_H, 5, DOOR_H, seed + 4 + x, 1, 0.18));
  }
  plate(ctx, -6, -DOOR_H - 5, 36, 7);
  studs(ctx, -6, -DOOR_H - 1.5, 36, 9);
  worn(ctx, -6, -DOOR_H - 5, 36, 7, seed + 3, 3, 0);
  G.inside(ctx, G.rectsRegion(ctx, [[-5, -DOOR_H, 5, DOOR_H], [24, -DOOR_H, 5, DOOR_H], [0, -DOOR_H, 24, slabH]]), () => G.drips(ctx, -5, -DOOR_H + 2, 34, 22, seed + 5, 3));
  lamp();
};
const shutOf = (state, open) => (state === open ? 0 : state === 0 ? 1 : 0.5);
const leverDoor = {
  id: "leverDoor",
  box: [-6, -126, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, shutOf(state, 2), 980, () => disc(ctx, 12, -DOOR_H - 1.5, 1.8, state === 2 ? LAMP_ON : LAMP_OFF, SLINE));
  },
};
const KEY_COLOURS = ["#e8c21a", "#ee7a1a", "#4a8ec0"];
const keyDoors = {
  id: "keyDoors",
  box: [-6, -126, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, shutOf(state, 2), 990, () => {
      plate(ctx, 2, -DOOR_H + 4, 20, 8);
      KEY_COLOURS.forEach((c, i) => {
        flat(ctx, 4 + i * 6.5, -DOOR_H + 6, 4, 4, STEEL[0], SLINE);
        disc(ctx, 6 + i * 6.5, -DOOR_H + 8, 1.4, state === 2 ? c : "#2a2220");
      });
    });
  },
};
const reader = (ctx, x, y, lit, seed) => {
  plate(ctx, x, y, 8, 14);
  flat(ctx, x + 1.5, y + 2, 5, 3, "#0c1a10", SLINE);
  flat(ctx, x + 2, y + 7, 4, 1.2, "#000000");
  disc(ctx, x + 4, y + 11, 1, lit);
  worn(ctx, x, y, 8, 14, seed, 1, 0.3);
};
const caveCardDoor = {
  id: "caveCardDoor",
  box: [-16, -126, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, shutOf(state, 2), 1000, () => reader(ctx, -15, -52, state === 2 ? LAMP_ON : LAMP_OFF, 1005));
  },
};
const airlock = {
  id: "airlock",
  box: [-6, -132, 30, 0],
  draw(ctx, state) {
    slidingDoor(ctx, state === 0 ? 0 : state === 2 ? 1 : 0.5, 1010, () => {
      plate(ctx, 6, -DOOR_H - 11, 12, 6);
      worn(ctx, 6, -DOOR_H - 11, 12, 6, 1015, 0, 0);
      disc(ctx, 12, -DOOR_H - 8, 2, state === 2 ? "#ff4020" : "#e8c21a");
      if (state !== 2)
        glow(ctx, 12, -DOOR_H - 8, 9, "#e8c21a", 0.35);
      hazard(ctx, -5, -6, 34, 6, 5);
      G.grain(ctx, G.rectRegion(ctx, -5, -6, 34, 6), 1016, 0.8);
      G.chips(ctx, -5, -6, 34, 1017, G.DIRT);
    });
  },
};
const cog = (ctx, cx, cy, r, teeth) => {
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * PI * 2;
    shape(ctx, [[cos(a - 0.12) * r, sin(a - 0.12) * r], [cos(a - 0.08) * r * 1.3, sin(a - 0.08) * r * 1.3], [cos(a + 0.08) * r * 1.3, sin(a + 0.08) * r * 1.3], [cos(a + 0.12) * r, sin(a + 0.12) * r]], STEEL[2], SLINE);
  }
  disc(ctx, 0, 0, r, STEEL[2], SLINE);
  disc(ctx, 0, 0, r * 0.82, STEEL[1]);
  disc(ctx, 0, 0, r * 0.35, STEEL[0], SLINE);
  if (!simple())
    for (let i = 0; i < 6; i++)
      stud(ctx, cos(i * PI / 3) * r * 0.6, sin(i * PI / 3) * r * 0.6);
  G.grain(ctx, () => {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, PI * 2);
  }, 1040 + teeth + round(r));
  ctx.restore();
};
const liftLock = {
  id: "liftLock",
  box: [0, -48, 72, 0],
  draw(ctx, state) {
    plate(ctx, 2, -36, 68, 36);
    flat(ctx, 6, -32, 60, 28, STEEL[0], SLINE);
    cog(ctx, 24, -18, 10, 10);
    const bolt = state === 0 ? 0 : 14;
    box(ctx, 34 + bolt, -21, 26, 7, "rust", 2);
    hazard(ctx, 40 + bolt, -21, 14, 7, 4);
    G.chips(ctx, 34 + bolt, -21, 26, 1023, G.DUST);
    plate(ctx, 50, -44, 16, 10);
    flat(ctx, 55, -42, 6, 6, "#000000");
    plate(ctx, 6, -44, 8, 8);
    disc(ctx, 10, -40, 2, state === 0 ? LAMP_OFF : LAMP_ON, SLINE);
    studs(ctx, 2, -34, 68, 8);
    studs(ctx, 2, -2.5, 68, 8);
    G.inside(ctx, G.rectRegion(ctx, 2, -44, 68, 44), () => {
      worn(ctx, 2, -36, 68, 36, 1020, 4, 0.35);
      worn(ctx, 50, -44, 16, 10, 1024, 1, 0);
    }, [G.rectPts(55, -42, 6, 6)]);
  },
};
const keySlots = {
  id: "keySlots",
  box: [0, -44, 36, 0],
  draw(ctx, state) {
    plate(ctx, 2, -42, 32, 42);
    flat(ctx, 5, -38, 26, 22, STEEL[0], SLINE);
    brace(ctx, 5, -14, 26, 7);
    studs(ctx, 2, -40, 32, 8);
    plate(ctx, 0, -6, 36, 6);
    worn(ctx, 2, -42, 32, 36, 1030, 3, 0.3);
    worn(ctx, 0, -6, 36, 6, 1032, 0, 0.6);
    KEY_COLOURS.forEach((c, i) => {
      const x = 8 + i * 7.5;
      flat(ctx, x, -34, 5, 14, c, SLINE);
      flat(ctx, x + 1.5, -32, 2, 10, "#050403");
      G.inside(ctx, G.rectRegion(ctx, x, -34, 5, 14), () => worn(ctx, x, -34, 5, 14, 1033 + i, 1, 0.35), [G.rectPts(x + 1.5, -32, 2, 10)]);
      const full = state === 2 || (state === 1 && i === 0);
      if (full) {
        flat(ctx, x + 1, -36, 3, 6, c, SLINE);
        G.inside(ctx, G.rectRegion(ctx, x + 1, -36, 3, 6), () => worn(ctx, x + 1, -36, 3, 6, 1040 + i, 0, 0.3));
      }
      disc(ctx, x + 2.5, -17.5, 1.1, full ? LAMP_ON : "#3a1410");
    });
  },
};
const stoneBlock = (ctx, y, seed, crack) => {
  const r = rng(seed);
  const pts = [[0.5, y + 1], [23.5, y + 0.5], [23, y + 23.5], [1, y + 23.5]];
  shape(ctx, pts, STONE[1]);
  shape(ctx, [[1.5, y + 2], [22.5, y + 1.5], [20, y + 5], [4, y + 5]], STONE[2]);
  shape(ctx, [[3, y + 20], [22.5, y + 18], [23, y + 23.5], [1, y + 23.5]], STONE[0]);
  if (!simple())
    for (let i = 0; i < 4; i++)
      flat(ctx, 3 + r() * 17, y + 6 + r() * 12, 1.2, 1.2, STONE[3]);
  if (crack)
    line(ctx, [[6, y + 2], [11, y + 9], [9, y + 14], [15, y + 22]], RLINE, 1);
  path(ctx, pts);
  stroke(ctx, RLINE);
};
const outline = (ctx, x, y, w, h) => {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  stroke(ctx, RLINE);
};
const stoneBlocks = {
  id: "stoneBlocks",
  box: [-2, -50, 26, 0],
  draw(ctx, state) {
    if (state === 2) {
      const r = rng(1041);
      for (let i = 0; i < 8; i++) {
        const x = r() * 20;
        const s = 3 + r() * 5;
        shape(ctx, [[x, 0], [x + s * 0.3, -s], [x + s, -s * 0.8], [x + s * 1.1, 0]], STONE[(1 + (i % 3))], RLINE);
      }
      return;
    }
    stoneBlock(ctx, -48, 1042, state === 1);
    stoneBlock(ctx, -24, 1043, state === 1);
    G.grain(ctx, G.rectRegion(ctx, 0, -48, 24, 48), 1044);
    G.dirt(ctx, 0, -48, 24, 48, 1045, 0.3);
    for (const y of [-47, -23])
      G.chips(ctx, 1, y, 22, 1046 + y, STONE[3]);
    for (const y of [-26, -2])
      G.chips(ctx, 2, y, 20, 1047 + y, RLINE);
    for (const y of [-48, -24]) {
      shape(ctx, [[0.5, y + 1], [4, y + 0.8], [0.8, y + 4]], STONE[0]);
      shape(ctx, [[23.5, y + 9], [21.5, y + 12], [23.2, y + 15]], STONE[0]);
      shape(ctx, [[15, y + 23.5], [18, y + 21.5], [20, y + 23.5]], STONE[0]);
    }
  },
};
const explosiveTank = {
  id: "explosiveTank",
  box: [-4, -52, 52, 0],
  draw(ctx, state) {
    if (state === 2) {
      const pts = [[4, 0], [6, -12], [14, -8], [20, -18], [28, -10], [38, -16], [42, 0]];
      G.scorch(ctx, pts, 1050);
      shape(ctx, pts, "#1a0c06", RLINE);
      return;
    }
    if (state === 1) {
      glow(ctx, 24, -24, 40, "#ffd25a", 0.8);
      glow(ctx, 24, -24, 24, "#ffffff", 0.7);
      return;
    }
    for (const x of [5, 11, 17])
      flat(ctx, x, -34, 2, 12, "#888484", RLINE);
    const block = [[2, 0], [2, -21], [5, -23], [20, -22], [22, -19], [22, 0]];
    shape(ctx, block, MOSS[2]);
    shape(ctx, [[2, -21], [5, -23], [20, -22], [22, -19], [18, -18.5], [4, -19.5]], "#706450");
    shape(ctx, [[2, -8], [22, -6], [22, 0], [2, 0]], MOSS[1]);
    if (!simple())
      for (const [x, y] of [[6, -14], [14, -11], [9, -6], [17, -15]])
        flat(ctx, x, y, 3, 2, MOSS[0]);
    G.grain(ctx, G.polyRegion(ctx, block), 1054, 0.5);
    path(ctx, block);
    stroke(ctx, RLINE);
    G.chips(ctx, 3, -21, 18, 1055, "#e4e0b4");
    const bands = [[24, 2, CHROME[0]], [26, 3, CHROME[1]], [29, 3, CHROME[2]], [32, 3, CHROME[3]], [35, 3, "#fcfcfc"], [38, 3, CHROME[3]], [41, 3, CHROME[2]], [44, 2, CHROME[1]], [46, 2, CHROME[0]]];
    for (const [x, w, c] of bands)
      flat(ctx, x, -46, w, 46, c);
    flat(ctx, 23.5, -48, 25, 3, CHROME[1], RLINE);
    flat(ctx, 23.5, -3, 25, 3, CHROME[0], RLINE);
    shape(ctx, [[30, -28], [34, -32], [38, -28], [34, -24]], "#e8b018", RLINE);
    line(ctx, [[34, -30.5], [34, -28]], RLINE, 0.9);
    disc(ctx, 34, -26.5, 0.6, RLINE);
    outline(ctx, 24, -46, 24, 46);
    G.chips(ctx, 24, -45, 24, 1056, G.DIRT);
    G.drips(ctx, 25, -3, 22, 2, 1052, 2, false);
    G.dirt(ctx, 24, -46, 24, 46, 1053, 0.2);
  },
};
const crate = (ctx, x, y, w, seed) => {
  const r = rng(seed);
  flat(ctx, x, y, w, 24, CRATE[2]);
  flat(ctx, x, y + 1, w, 4, CRATE[3]);
  flat(ctx, x, y + 6, w, 3, "#443c20");
  flat(ctx, x, y + 9, w, 2, CRATE[1]);
  flat(ctx, x, y + 18, w, 2, "#60543c");
  flat(ctx, x, y + 22, w, 2, CRATE[1]);
  flat(ctx, x, y, w, 1.2, "#885c1c");
  for (const k of [0.4, 0.6])
    line(ctx, [[x + w * k, y + 6], [x + w * k, y + 14 + r() * 4]], "#5c3a1c", 0.9);
  G.drips(ctx, x + 2, y + 1, w - 4, 12, seed + 1, 1);
  G.chips(ctx, x + 1, y + 1, w - 2, seed + 2, "#c08a40");
};
const crateRow = (ctx, x0, w, y, seed) => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y, w, 24);
  ctx.clip();
  for (let x = x0, i = 0; x < w; x += 72, i++)
    for (const [dx, side, front] of [[0, 16, 32], [53, 0, 19]]) {
      flat(ctx, x + dx - 5, y, 5 + side, 24, "#342810");
      flat(ctx, x + dx - 5, y + 9, 5 + side, 3, "#301c10");
      flat(ctx, x + dx - 5, y + 18, 5 + side, 2, "#384030");
      line(ctx, [[x + dx - 5, y], [x + dx - 5, y + 24]], "#2c3838", 1.2);
      crate(ctx, x + dx + side, y, front, seed + i * 7 + dx);
      line(ctx, [[x + dx + side, y], [x + dx + side, y + 24]], "#283030", 1);
    }
  ctx.restore();
};
const mineCarts = {
  id: "mineCarts",
  box: [-122, -26, 194, 26],
  draw(ctx, _state, _t, { w = 192 } = {}) {
    const seed = 1060 + round(w);
    const stub = [-120, -24, 120, 8];
    flat(ctx, ...stub, "#1c2c24");
    for (let x = -120; x < 0; x += 24) {
      line(ctx, [[x + 2, -23], [x + 22, -17]], "#c0c4b8", 1.4);
      line(ctx, [[x + 2, -17], [x + 22, -23]], "#a4a4a4", 1.4);
      line(ctx, [[x + 1, -24], [x + 1, -16]], "#e4ece0", 1.2);
    }
    flat(ctx, -120, -24, 120, 1.2, "#e4ece0");
    flat(ctx, -120, -17.2, 120, 1.2, "#888484");
    G.grain(ctx, G.rectRegion(ctx, ...stub), seed + 5, 0.6);
    crateRow(ctx, 0, w, -24, seed);
    crateRow(ctx, 6 - 72, w, 0, seed + 40);
    outline(ctx, 0, -24, w, 48);
    G.grain(ctx, G.rectRegion(ctx, 0, -24, w, 48), seed + 1, 0.35);
    G.dirt(ctx, 0, 0, w, 24, seed + 2, 0.3);
  },
};
const cartCrusher = {
  id: "cartCrusher",
  box: [-6, -100, 78, 50],
  draw(ctx) {
    for (const x of [-4, 64]) {
      post(ctx, x, -86, 8, 134);
      studsV(ctx, x + 4, -82, 126, 12);
    }
    plate(ctx, -4, -98, 76, 12);
    hazard(ctx, -4, -98, 76, 5, 6);
    studs(ctx, -4, -89, 76, 10);
    cog(ctx, 22, -40, 16, 12);
    cog(ctx, 48, 4, 16, 12);
    if (!simple())
      for (const [x, y] of [[30, -14], [36, -18], [40, -10], [33, -6], [44, -16]])
        line(ctx, [[x, y], [x + 3, y - 2]], "#ffe080", 0.9);
    glow(ctx, 36, -12, 18, "#ffb040", 0.35);
    worn(ctx, -4, -98, 76, 12, 1070, 5, 0);
    for (const x of [-4, 64])
      G.inside(ctx, G.rectRegion(ctx, x, -86, 8, 134), () => worn(ctx, x, -86, 8, 134, 1072 + x, 3, 0.3));
  },
};
const lavaSurface = (ctx, w, top, h, seed) => {
  const r = rng(seed);
  const rows = [[0, MAGMA[1]], [0.18, MAGMA[2]], [0.36, MAGMA[3]], [0.52, MAGMA[4]], [0.82, MAGMA[5]]];
  for (const [k, c] of rows)
    flat(ctx, 0, top + h * k, w, h * (1 - k), c);
  for (let x = r() * 2; x < w; x += 2.5 + r() * 1.5) {
    const bright = r() < 0.55;
    const y = top + h * (0.2 + r() * 0.3);
    line(ctx, [[x, y], [x, top + h]], bright ? "#885c1c" : "#401c08", bright ? 0.9 : 0.7);
    if (bright && !simple())
      line(ctx, [[x, top + h * 0.7], [x, top + h]], r() < 0.5 ? "#b8901c" : "#9c681c", 0.7);
  }
  if (!simple())
    for (let i = 0; i < w / 8; i++)
      flat(ctx, r() * w, top + h * (0.6 + r() * 0.3), 1.5, 1.5, "#a84c04");
};
const lavaPit = {
  id: "lavaPit",
  box: [0, -24, 48, 26],
  draw(ctx, _state, _t, { w = 48 } = {}) {
    veil(ctx, [[0, 0], [w, 0], [w, -6], [0, -6]], "#90280c", 0.08);
    lavaSurface(ctx, w, 0, 24, 1080 + round(w));
  },
};
const chasm = {
  id: "chasm",
  box: [0, -6, 96, 74],
  draw(ctx, _state, _t, { w = 96 } = {}) {
    const seed = 1100 + round(w);
    const r = rng(seed);
    const g = ctx.createLinearGradient(0, 0, 0, 72);
    g.addColorStop(0, "rgba(40,6,2,0)");
    g.addColorStop(0.35, "rgba(70,14,4,0.28)");
    g.addColorStop(1, "rgba(20,4,2,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, 72);
    for (let i = 0; i < 5; i++) {
      const y = 14 + r() * 50;
      veil(ctx, [...jag(r() * w * 0.3, w - r() * w * 0.3, y, 1.6, 8, seed + i), [w * 0.6, y + 4], [w * 0.3, y + 3]], "#a03a20", 0.12);
    }
    if (!simple())
      for (let i = 0; i < w / 12; i++)
        disc(ctx, r() * w, 20 + r() * 50, 0.5 + r() * 0.5, "#ff8a40");
  },
};
const rodStrokes = (ctx, a, b, c) => {
  line(ctx, [a, b], "#1e1208", 3.2);
  line(ctx, [a, b], "#6e4824", 2);
  if (c) line(ctx, c, "#a87a44", 0.7);
};
const rod = {
  id: "rod",
  box: [-16, -8, 16, 0],
  views: itemViews([-16, -8, 16, 0], 3.2, {
    scale: 0.88,
    top(ctx) {
      rodStrokes(ctx, [-15, 0], [14, 0], [[-13, -0.4], [12, -0.4]]);
      line(ctx, [[-15, 0], [-13.4, 0]], "#3a2410", 2);
    },
    front: (ctx) => rodStrokes(ctx, [0, -2], [0, -5.5]),
  }),
  draw(ctx, state) {
    if (state === 2)
      return;
    line(ctx, [[-15, -2], [14, -5.5]], "#1e1208", 3.2);
    line(ctx, [[-15, -2], [14, -5.5]], "#6e4824", 2);
    line(ctx, [[-13, -2.6], [12, -5.6]], "#a87a44", 0.7);
    line(ctx, [[-15, -2], [-13.4, -2.2]], "#3a2410", 2);
  },
};
const CARD = "#e8ece6";
const CARD_SHADE = "#bcc2bc";
const CARD_LINE = "#1a1c1a";
const CARD_PTS = [[-8, -10], [7, -10], [8, -9], [8, -1], [7, 0], [-8, 0]];
const cardViews = (face, edge) => itemViews([-9, -14, 9, 0], 10, {
  scale: 0.17,
  top(ctx) {
    ctx.save();
    ctx.translate(0, 5);
    face(ctx);
    ctx.restore();
  },
  front: (ctx) => shape(ctx, [[-5, -0.5], [5, -0.5], [5, 0], [-5, 0]], edge, CARD_LINE),
  flat: (ctx) => shape(ctx, [[-8, -0.5], [8, -0.5], [8, 0], [-8, 0]], edge, CARD_LINE),
});
const keyCard = (c, id) => ({
  id,
  box: [-9, -14, 9, 0],
  views: cardViews((ctx) => keyCardFace(ctx, c), CARD),
  draw(ctx, state) {
    if (state === 2)
      return;
    keyCardFace(ctx, c);
  },
});
const keyCardFace = (ctx, c) => {
    shape(ctx, CARD_PTS, CARD);
    flat(ctx, -8, -1.6, 16, 1.6, CARD_SHADE);
    flat(ctx, -8, -10, 2.8, 10, "#c8a040");
    if (!simple())
      for (let y = -9; y < -1; y += 1.6)
        flat(ctx, -8, y, 2.8, 0.5, "#7a5a20");
    flat(ctx, 2.2, -10, 3, 10, c);
    flat(ctx, 2.2, -1.6, 3, 1.6, "rgba(0,0,0,0.18)");
    shape(ctx, [[-4.4, -5], [-1.6, -7.4], [-1.6, -2.6]], "#c0301a");
    flat(ctx, -1.6, -5.6, 1.6, 1.2, "#c0301a");
    flat(ctx, 0.4, -6.2, 0.8, 2.4, "#4a2a1e");
    flat(ctx, 1.3, -6.2, 0.5, 2.4, "#4a2a1e");
    shape(ctx, CARD_PTS, "rgba(0,0,0,0)", CARD_LINE);
};
const entryCardFace = (ctx) => {
    shape(ctx, CARD_PTS, "#a4b2b8");
    if (!simple()) {
      flat(ctx, -6.5, -8.5, 5, 2.4, "#8494a0");
      flat(ctx, -1, -9, 3, 1.6, "#c4ccd0");
      flat(ctx, -6, -5.2, 7, 1, "#7a8a96");
      flat(ctx, -4, -7.6, 1.2, 1.2, "#c8a050");
    }
    flat(ctx, 3, -10, 2.4, 10, "#d8642a");
    flat(ctx, -8, -2.8, 11, 2.8, "#d8642a");
    flat(ctx, -6.5, -2.2, 5, 0.6, "#8a3412");
    flat(ctx, 5.6, -10, 2.4, 10, "#d0d4d0");
    shape(ctx, CARD_PTS, "rgba(0,0,0,0)", CARD_LINE);
};
const entryCard = {
  id: "entryCard",
  box: [-9, -14, 9, 0],
  views: cardViews(entryCardFace, "#a4b2b8"),
  draw(ctx, state) {
    if (state === 2)
      return;
    entryCardFace(ctx);
  },
};
for (const asset of [
  stalactite, crystal, leverBank, leverDoor, keyDoors, caveCardDoor, airlock, liftLock, keySlots, stoneBlocks, explosiveTank, mineCarts, cartCrusher, lavaPit, chasm, rod,
  keyCard(KEY_COLOURS[0], "yellowKey"), keyCard(KEY_COLOURS[1], "orangeKey"), keyCard(KEY_COLOURS[2], "blueKey"), entryCard,
]) define(asset);
})();
