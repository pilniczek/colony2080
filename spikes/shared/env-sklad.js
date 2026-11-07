(() => {
const { define, P, G } = window.ENV;
const { rng, path, flat, disc, glow, stroke, shape, line, curve, hazard } = P;
const { PI, sin, cos } = Math;
const simple = () => window.ENV.simple;
const GREY = ["#303024", "#545448", "#6c6c60", "#9c9c90"];
const SHINE = "#c0c0b4";
const CAB = ["#3c3428", "#60543c", "#84786c", "#a8a090"];
const LINE = "#14140c";
const RIM = ["#24180c", "#3c2c18", "#543c24", "#6c5030"];
const OLIVE = ["#242418", "#3c3c28", "#54543c", "#6c6c54"];
const SUIT_HI = "#7c8060";
const SKIN = ["#3c3c34", "#6c6c60", "#9c9c90", "#b4b4a8"];
const AMBER = "#a84800";
const AMBER_LIT = "#e48418";
const AMBER_DIM = "#5a2c10";
const DISPLAY = "#c0a848";
const KEYPAD = "#a89c84";
const CABLE = ["#783c18", "#b44818"];
const LAMP_RED = "#d03818";
const LAMP_GREEN = "#5ac060";
const FLASH = "#e48c24";
const BLOOD = ["#4a200c", "#6c3c18", "#a04418"];
const plate = (ctx, x, y, w, h, tones = GREY) => {
  flat(ctx, x, y, w, h, tones[1], LINE);
  flat(ctx, x + 0.6, y + 0.6, w - 1.2, 0.9, tones[3]);
  flat(ctx, x + 0.6, y + 0.6, 0.9, h - 1.2, tones[2]);
  flat(ctx, x + 0.6, y + h - 1.6, w - 1.2, 1, tones[0]);
  flat(ctx, x + w - 1.6, y + 0.6, 1, h - 1.2, tones[0]);
};
const screw = (ctx, x, y) => {
  disc(ctx, x, y, 0.9, GREY[0]);
  if (!simple())
    line(ctx, [[x - 0.6, y - 0.3], [x + 0.6, y + 0.3]], SHINE, 0.4);
};
const worn = (ctx, x, y, w, h, seed, drip = 0, rise = 0.3) => {
  G.surface(ctx, x, y, w, h, seed, { rise, drip, dripLen: h * 0.5 });
  G.chips(ctx, x, y + h - 1.4, w, seed + 7, G.DIRT);
};
const slits = (ctx, x, y, w, h, step) => {
  for (let j = y + 1.5; j < y + h - 1; j += step) {
    flat(ctx, x, j, w, step * 0.45, "#141410");
    flat(ctx, x, j + step * 0.45, w, 0.5, GREY[3]);
  }
};
const tangle = (ctx, x, y, w, h, seed) => {
  const r = rng(seed);
  for (let i = 0; i < 7; i++) {
    const pts = [];
    for (let k = 0; k < 4; k++)
      pts.push([x + r() * w, y + r() * h]);
    curve(ctx, pts, CABLE[i % 2], 0.7 + r() * 0.6);
  }
};
const keyItem = (ctx, x, y, cap) => {
  flat(ctx, x, y - 1.4, 6, 2.8, GREY[2], LINE);
  flat(ctx, x + 6, y - 0.9, 3.5, 1.8, GREY[1], LINE);
  if (!simple())
    for (const dy of [-0.5, 0.4])
      line(ctx, [[x + 6.3, y + dy], [x + 9.2, y + dy]], GREY[0], 0.3);
  flat(ctx, x + 0.3, y - 1, 5.4, 0.6, SHINE);
  disc(ctx, x, y, 1.6, cap, LINE);
};
const screwdriver = (ctx, x, y) => {
  flat(ctx, x, y - 1.4, 6, 2.8, "#483024", LINE);
  if (!simple())
    for (let i = 1; i < 6; i += 1.4)
      line(ctx, [[x + i, y - 1.2], [x + i, y + 1.2]], "#242418", 0.35);
  flat(ctx, x + 6, y - 0.9, 1.4, 1.8, GREY[2]);
  line(ctx, [[x + 7.4, y], [x + 16, y]], GREY[2], 0.9);
  line(ctx, [[x + 14, y - 0.2], [x + 16.4, y - 0.2]], SHINE, 0.5);
};
const LOCKER_DOOR = [3, -44, 28, 27];
const depotLocker = {
  id: "depotLocker",
  box: [-8, -52, 46, 1],
  draw(ctx, state) {
    for (const x of [3, 37]) {
      flat(ctx, x, -14, 2, 14, CAB[1], LINE);
      flat(ctx, x, -14, 0.7, 14, CAB[3]);
    }
    flat(ctx, -1, -17, 44, 3, "#604830", LINE);
    flat(ctx, -1, -17, 44, 0.8, "#84684a");
    for (const [x0, x1, sag] of [[6, 2, 4], [14, 18, 3], [28, 33, 5]])
      curve(ctx, [[x0, -14], [x0 + (x1 - x0) * 0.5, -6 + sag], [x1, 0]], CABLE[0], 0.9);
    line(ctx, [[22, -1], [30, -1.6], [36, -0.4]], GREY[2], 1.4);
    flat(ctx, 2, -46, 38, 29, CAB[1], LINE);
    flat(ctx, 2.6, -45.4, 36.8, 1, CAB[3]);
    flat(ctx, 31, -45, 8.4, 27.4, CAB[2]);
    slits(ctx, 32, -43, 6.4, 23, 2.6);
    const [dx, dy, dw, dh] = LOCKER_DOOR;
    const open = state !== 0;
    const holes = [];
    if (open) {
      flat(ctx, dx, dy, dw, dh, "#14100a", LINE);
      flat(ctx, dx, dy, dw, 2, "#0a0806");
      for (const sy of [-33, -22]) {
        flat(ctx, dx + 0.5, sy, dw - 1, 1.4, CAB[2]);
        flat(ctx, dx + 0.5, sy + 1.4, dw - 1, 0.6, CAB[0]);
      }
      if (state === 1) {
        keyItem(ctx, dx + 5, -35, "#783024");
        screwdriver(ctx, dx + 7, -24.4);
      }
      holes.push(G.rectPts(dx, dy, dw, dh));
      shape(ctx, [[dx, dy], [dx - 9, dy - 3], [dx - 9, dy + dh + 3], [dx, dy + dh]], CAB[2], LINE);
      shape(ctx, [[dx - 7.5, dy + 4], [dx - 1.5, dy + 6], [dx - 1.5, dy + 16], [dx - 7.5, dy + 15]], "#3c180c", LINE);
      if (!simple())
        tangle(ctx, dx - 7.5, dy + 5, 6, 10, 6101);
      line(ctx, [[dx - 8, dy + 20], [dx - 8, dy + 24]], GREY[0], 1.2);
    } else {
      flat(ctx, dx, dy, dw, dh, CAB[2], LINE);
      flat(ctx, dx + 0.6, dy + 0.6, dw - 1.2, 0.8, CAB[3]);
      flat(ctx, 8, -40, 18, 13, "#3c180c", LINE);
      holes.push(G.rectPts(8, -40, 18, 13));
      if (!simple())
        tangle(ctx, 8.5, -39.5, 17, 12, 6102);
      line(ctx, [[9, -30], [16, -36], [25, -29]], CABLE[1], 1);
      line(ctx, [[28, -36], [28, -30]], GREY[0], 1.4);
      line(ctx, [[27.6, -36], [27.6, -31]], SHINE, 0.5);
    }
    shape(ctx, [[6, -46], [8, -51], [10, -51], [12, -46]], "#d8d8cc", LINE);
    flat(ctx, 7.4, -52, 3.2, 1.2, GREY[2], LINE);
    G.inside(ctx, G.rectRegion(ctx, 2, -46, 38, 29), () => worn(ctx, 2, -46, 38, 29, 6103, 3, 0.35), holes);
    G.grain(ctx, G.rectRegion(ctx, -1, -17, 44, 3), 6104, 0.7);
    G.chips(ctx, 2, -17.5, 38, 6105, G.DIRT);
  },
};
const COVER_W = 48;
const coverFrame = (ctx) => {
  flat(ctx, -2, -1.5, COVER_W + 4, 8, GREY[1], LINE);
  flat(ctx, -2, -1.5, COVER_W + 4, 1, GREY[3]);
};
const shaftCover = {
  id: "shaftCover",
  box: [-4, -22, 54, 10],
  draw(ctx, state) {
    coverFrame(ctx);
    if (state === 0) {
      plate(ctx, 1, -3, COVER_W - 2, 5);
      for (let x = 4; x < COVER_W - 4; x += 3.2)
        flat(ctx, x, -2, 1.6, 3, "#1c1c14");
      for (const x of [2.6, COVER_W - 2.6])
        screw(ctx, x, -0.5);
      plate(ctx, 30, -13, 6, 10);
      flat(ctx, 31.5, -11, 3, 1.4, GREY[0]);
      worn(ctx, -2, -3, COVER_W + 4, 9, 6110, 0, 0.4);
      return;
    }
    if (state === 1) {
      flat(ctx, 2, -1, COVER_W - 4, 7, "#060604");
      flat(ctx, 2, 5, COVER_W - 4, 1.5, "#2a2418");
      G.inside(ctx, G.rectRegion(ctx, -2, -1.5, COVER_W + 4, 8), () => worn(ctx, -2, -1.5, COVER_W + 4, 8, 6111, 0, 0.2), [G.rectPts(2, -1, COVER_W - 4, 7)]);
      ctx.save();
      ctx.translate(COVER_W - 1, -1.5);
      ctx.rotate(-1.2);
      ctx.translate(-(COVER_W - 2), 0);
      plate(ctx, 0, -5, COVER_W - 2, 5);
      for (let x = 3; x < COVER_W - 5; x += 3.2)
        flat(ctx, x, -4, 1.6, 3, "#1c1c14");
      G.grain(ctx, G.rectRegion(ctx, 0, -5, COVER_W - 2, 5), 6112, 0.8);
      ctx.restore();
      for (const x of [6, 10.5])
        disc(ctx, x, -2.4, 0.9, GREY[2], LINE);
      return;
    }
    const hole = [[0, -1], [6, 0.5], [11, -0.5], [19, 1], [27, -0.6], [36, 0.8], [44, -0.4], [48, -1], [47, 6.5], [1, 6.5]];
    G.scorch(ctx, [[-2, -3], [50, -3], [50, 0], [-2, 0]], 6113);
    shape(ctx, hole, "#060604");
    for (const [x, a] of [[2, -0.6], [44, 0.7], [20, -0.3]])
      line(ctx, [[x, -0.5], [x + 4 * cos(a), -0.5 - 5 * sin(Math.abs(a))]], GREY[2], 1.2);
    G.rim(ctx, hole, 6114, "#d8a050", "#140c06");
  },
};
const cone = (ctx) => {
  const pts = [[2, 0], [18, -16], [30, -16], [46, 0]];
  shape(ctx, pts, "#a8a8a0");
  shape(ctx, [[18, -16], [24, -16], [20, 0], [2, 0]], "#d8d8d0");
  shape(ctx, [[24, -16], [30, -16], [46, 0], [34, 0]], "#6c6c60");
  line(ctx, [[22, -15], [12, -1]], "#fcfcfc", 0.8);
  path(ctx, pts);
  stroke(ctx, LINE);
  flat(ctx, 16, -19, 16, 3.4, "#9c9c90", LINE);
  flat(ctx, 16, -19, 16, 1, SHINE);
};
const turretHead = (ctx, fire) => {
  flat(ctx, 20, -30, 8, 12, GREY[1], LINE);
  flat(ctx, 21, -30, 2, 12, SHINE);
  const body = [[6, -32], [8, -42], [16, -48], [32, -48], [40, -42], [42, -32], [34, -28], [12, -28]];
  shape(ctx, body, OLIVE[2]);
  shape(ctx, [[8, -42], [16, -48], [32, -48], [28, -44], [14, -43]], "#b4b4a8");
  shape(ctx, [[12, -28], [34, -28], [42, -32], [40, -34], [10, -33]], OLIVE[0]);
  for (const cx of [10, 38]) {
    disc(ctx, cx, -36, 5, OLIVE[3], LINE);
    disc(ctx, cx - 1.2, -37.4, 2, "#b4b4a8");
  }
  path(ctx, body);
  stroke(ctx, LINE);
  flat(ctx, -14, -37, 22, 4, GREY[1], LINE);
  flat(ctx, -14, -37, 22, 1.2, SHINE);
  flat(ctx, -17, -38, 4, 6, GREY[0], LINE);
  for (const x of [-8, -1])
    flat(ctx, x, -37.5, 1.4, 5, GREY[0]);
  disc(ctx, 24, -39, 2, LAMP_RED, LINE);
  curve(ctx, [[40, -34], [48, -30], [44, -22], [34, -24]], "#242418", 1.6);
  if (fire >= 0) {
    const k = 0.7 + 0.3 * sin(fire * 40);
    glow(ctx, -20, -35, 14 * k, FLASH, 0.7);
    shape(ctx, [[-17, -38], [-17 - 13 * k, -35], [-17, -32], [-23, -35]], "#ffd25a");
    disc(ctx, -19, -35, 2, "#fff3b0");
  }
  G.inside(ctx, G.polyRegion(ctx, body), () => {
    G.grain(ctx, G.polyRegion(ctx, body), 6120, 0.6);
    G.drips(ctx, 10, -30, 28, 4, 6121, 2);
  });
};
const turretWreck = (ctx) => {
  flat(ctx, 20, -28, 8, 10, GREY[1], LINE);
  flat(ctx, 21, -28, 2, 10, SHINE);
  ctx.save();
  ctx.translate(24, -28);
  ctx.rotate(0.1);
  const head = [[-20, -1], [-18, -8], [16, -8], [20, -4], [16, 0], [-16, 0]];
  shape(ctx, head, GREY[2]);
  shape(ctx, [[-18, -8], [16, -8], [15, -6], [-18.6, -5.6]], "#b4b4a8");
  shape(ctx, [[-20, -1], [-16, 0], [16, 0], [18, -2], [-19, -3]], GREY[0]);
  path(ctx, head);
  stroke(ctx, LINE);
  for (const [x, rx] of [[-10, 5], [6, 4]])
    G.rustPatch(ctx, x, -4, rx, 2, 6122 + x);
  shape(ctx, [[-4, -8], [0, -10], [3, -8]], "#141410");
  line(ctx, [[-20, -4], [-26, -1], [-28, 4]], "#2a2820", 3);
  line(ctx, [[-20, -4.6], [-26, -1.6]], GREY[3], 0.8);
  ctx.restore();
  curve(ctx, [[40, -30], [50, -26], [48, -16], [40, -20]], "#242418", 1.6);
  for (const [x, y] of [[6, -1], [38, -1], [42, -3]])
    shape(ctx, [[x, y], [x + 3, y - 2], [x + 5, y]], "#3c3830", LINE);
};
const depotCannon = {
  id: "depotCannon",
  box: [-34, -54, 56, 1],
  anim: true,
  draw(ctx, state, t) {
    shape(ctx, [[14, -16], [34, -16], [34, -2], [14, -2]], "#0a0806");
    if (state === 2) {
      turretWreck(ctx);
      cone(ctx);
      G.rustPatch(ctx, 24, -10, 6, 3, 6123);
      return;
    }
    turretHead(ctx, state === 1 ? (t % 0.25) : -1);
    cone(ctx);
    G.chips(ctx, 3, -1.5, 42, 6124, G.DIRT);
  },
};
const alienHead = (ctx, x, y) => {
  const skull = [[x - 4, y + 4], [x - 4.6, y - 1], [x - 2.6, y - 5.4], [x + 2, y - 6.4], [x + 5.4, y - 4], [x + 5.6, y + 1], [x + 3.6, y + 5], [x - 1, y + 6.2]];
  shape(ctx, skull, SKIN[2], LINE);
  shape(ctx, [[x - 2.6, y - 5.4], [x + 2, y - 6.4], [x + 5.4, y - 4], [x + 2, y - 4.4], [x - 2, y - 3.4]], SKIN[3]);
  shape(ctx, [[x + 3.6, y + 5], [x - 1, y + 6.2], [x - 4, y + 4], [x - 1, y + 4.4]], SKIN[1]);
  shape(ctx, [[x - 4.4, y - 1.4], [x - 1.4, y - 2.2], [x - 0.8, y + 0.6], [x - 3.8, y + 1]], "#141410");
  disc(ctx, x - 2.4, y - 0.8, 0.5, "#d8c890");
  line(ctx, [[x - 3.6, y + 3.4], [x - 1.6, y + 3.2]], "#242418", 0.5);
  if (!simple())
    for (const dy of [-3, -1])
      line(ctx, [[x + 1.4, y + dy], [x + 4.6, y + dy + 0.6]], SKIN[1], 0.4);
};
const leg = (ctx, hip, knee, foot) => {
  line(ctx, [hip, knee], LINE, 5.2);
  line(ctx, [knee, foot], LINE, 4.6);
  line(ctx, [hip, knee], OLIVE[2], 4);
  line(ctx, [knee, foot], OLIVE[2], 3.4);
  line(ctx, [[hip[0] - 0.8, hip[1]], [knee[0] - 0.8, knee[1]]], OLIVE[3], 1.2);
  shape(ctx, [[foot[0] - 4, foot[1] - 2.4], [foot[0] + 2, foot[1] - 2.6], [foot[0] + 2.4, foot[1]], [foot[0] - 4.6, foot[1]]], "#242418", LINE);
};
const rifle = (ctx, x, y) => {
  flat(ctx, x - 17, y - 1.4, 21, 3, "#2a2a22", LINE);
  flat(ctx, x - 17, y - 1.4, 21, 0.7, "#6c6c60");
  flat(ctx, x - 12, y - 3, 6, 1.6, "#3c3c30", LINE);
  flat(ctx, x - 6, y - 2.4, 9, 4.6, "#3c3c30", LINE);
  flat(ctx, x - 2, y + 2.2, 2.2, 3.6, "#2a2a22", LINE);
  flat(ctx, x + 3, y - 1.6, 4.6, 3.4, "#3c3c30", LINE);
};
const alienStanding = (ctx, fire) => {
  leg(ctx, [1, -21], [5, -11], [6, -2]);
  leg(ctx, [-1, -21], [-5, -11.5], [-8, -2]);
  const torso = [[-5, -36], [4, -37], [6, -30], [5, -21], [-4, -20], [-6, -28]];
  shape(ctx, torso, OLIVE[2], LINE);
  shape(ctx, [[-5, -36], [4, -37], [3, -33], [-4, -32]], SUIT_HI);
  shape(ctx, [[5, -30], [6, -30], [5, -21], [1, -21]], OLIVE[1]);
  if (!simple())
    for (const [a, b] of [[[-3, -30], [2, -26]], [[-4, -25], [1, -23]]])
      line(ctx, [a, b], OLIVE[0], 0.6);
  flat(ctx, -5.4, -22.6, 11, 2.2, "#3c3020", LINE);
  flat(ctx, -1, -22.4, 2, 1.8, "#9c9c90");
  line(ctx, [[3, -35], [6, -28], [0, -27]], LINE, 4);
  line(ctx, [[3, -35], [6, -28], [0, -27]], OLIVE[2], 2.8);
  rifle(ctx, -2, -27.4);
  line(ctx, [[-2, -35], [-6, -30], [-11, -28]], LINE, 4);
  line(ctx, [[-2, -35], [-6, -30], [-11, -28]], OLIVE[3], 2.8);
  disc(ctx, -11.4, -27.6, 1.4, SKIN[2], LINE);
  disc(ctx, 0.2, -26.8, 1.4, SKIN[2], LINE);
  flat(ctx, -1.6, -39.4, 3.6, 3, SKIN[1], LINE);
  ctx.save();
  ctx.translate(0, -43);
  ctx.scale(0.82, 0.82);
  alienHead(ctx, 0, 0);
  ctx.restore();
  if (fire >= 0) {
    const k = 0.7 + 0.3 * sin(fire * 40);
    glow(ctx, -20, -27.4, 10 * k, FLASH, 0.7);
    shape(ctx, [[-19, -29], [-19 - 9 * k, -27.4], [-19, -25.8], [-22, -27.4]], "#ffd25a");
  }
};
const alienDead = (ctx) => {
  const r = rng(6130);
  const pool = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * PI * 2;
    pool.push([-2 + cos(a) * (22 + r() * 6), -0.6 + sin(a) * (2.4 + r() * 1.2)]);
  }
  shape(ctx, pool, BLOOD[1]);
  shape(ctx, pool.map(([x, y]) => [x * 0.6 - 4, y * 0.6 - 0.2]), BLOOD[2]);
  leg(ctx, [-8, -4.4], [-17, -5.4], [-26, -2.6]);
  leg(ctx, [-8, -3.4], [-17, -2.6], [-26, -1.4]);
  const torso = [[-9, -8], [8, -8.6], [9, -1], [-9, -1]];
  shape(ctx, torso, OLIVE[2], LINE);
  shape(ctx, [[-9, -8], [8, -8.6], [8, -6.6], [-9, -6.4]], SUIT_HI);
  for (const x of [-3, 3])
    line(ctx, [[x, -8.4], [x + 1, -1]], "#3c3020", 1.1);
  flat(ctx, -9.6, -7, 2.2, 6, "#3c3020", LINE);
  line(ctx, [[6, -7], [12, -11], [16, -10]], LINE, 3.6);
  line(ctx, [[6, -7], [12, -11], [16, -10]], OLIVE[3], 2.4);
  disc(ctx, 16.6, -10, 1.4, SKIN[2], LINE);
  ctx.save();
  ctx.translate(14, -4.6);
  ctx.rotate(PI / 2 + 0.25);
  ctx.scale(0.82, 0.82);
  alienHead(ctx, 0, 0);
  ctx.restore();
  ctx.save();
  ctx.translate(-2, -7);
  ctx.rotate(-0.28);
  flat(ctx, -6, -2.4, 20, 4.8, "#141410", LINE);
  for (const dy of [-1.6, 0, 1.6])
    line(ctx, [[-5, dy], [14, dy]], "#3c3c34", 0.5);
  flat(ctx, -11, -3, 5, 6, "#242420", LINE);
  ctx.restore();
};
const alienOfficer = {
  id: "alienOfficer",
  box: [-30, -48, 30, 3],
  anim: true,
  draw(ctx, state, t) {
    if (state === 2)
      return alienDead(ctx);
    alienStanding(ctx, state === 1 ? t % 0.25 : -1);
  },
};
const crt = (ctx, x, y, w, h, seed, blood) => {
  flat(ctx, x + w * 0.2, y + h, w * 0.6, 2.4, GREY[1], LINE);
  flat(ctx, x, y, w, h, "#c4c4bc", LINE);
  flat(ctx, x + 0.6, y + h - 1.4, w - 1.2, 0.8, "#84847c");
  flat(ctx, x + w - 4, y + 2, 3, h - 4, "#9c9c94");
  flat(ctx, x + 2, y + 2, w - 7, h - 4, "#0c0c0a", LINE);
  const r = rng(seed);
  const sx = x + 2, sy = y + 2, sw = w - 7, sh = h - 4;
  for (let i = 0; i < 5; i++)
    line(ctx, [[sx + r() * sw, sy + r() * sh], [sx + sw * 0.5, sy + sh * 0.5], [sx + r() * sw, sy + r() * sh]], blood ? "#a83c18" : "#d8d8d0", 0.5);
  if (blood)
    shape(ctx, [[sx + sw * 0.3, sy + sh * 0.4], [sx + sw * 0.8, sy + sh * 0.2], [sx + sw * 0.9, sy + sh * 0.6], [sx + sw * 0.5, sy + sh * 0.8]], "#783c18");
  return [G.rectPts(sx, sy, sw, sh)];
};
const alienDesk = {
  id: "alienDesk",
  box: [-2, -46, 124, 1],
  draw(ctx, state) {
    flat(ctx, 50, -24.5, 72, 3.4, "#786048", LINE);
    flat(ctx, 50, -24.5, 72, 1, "#9c7c5c");
    for (const x of [54, 116])
      flat(ctx, x, -21, 2.4, 21, GREY[1], LINE);
    flat(ctx, 96, -21, 10, 10, GREY[2], LINE);
    line(ctx, [[101, -11], [101, -3]], GREY[1], 2.2);
    shape(ctx, [[94, 0], [101, -4], [108, 0]], GREY[2], LINE);
    const holes = [
      ...crt(ctx, 60, -42, 30, 18, 6140, false),
      ...crt(ctx, 93, -42, 26, 18, 6141, true),
    ];
    plate(ctx, 4, -24, 46, 23, ["#54544c", "#a8a8a0", "#c4c4bc", "#e0e0d8"]);
    flat(ctx, 7, -20, 12, 15, "#242418", LINE);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++)
        flat(ctx, 7.6 + i * 2.8, -19.4 + j * 3.6, 2.4, 3, DISPLAY);
    for (const x of [21, 27])
      flat(ctx, x, -20, 4, 13, "#8c8c84", LINE);
    flat(ctx, 33, -21, 14, 6, "#9c9c94", LINE);
    flat(ctx, 34, -19.4, 12, 1.4, "#141410");
    if (state === 0) {
      flat(ctx, 36, -21.6, 8, 2.6, "#303c54", LINE);
      flat(ctx, 38, -21.6, 4, 1.2, "#c0cccc");
    }
    flat(ctx, 33, -12, 14, 6, "#141410", LINE);
    if (!simple())
      for (let i = 0; i < 6; i++)
        for (let j = 0; j < 2; j++)
          flat(ctx, 34 + i * 2.2, -11 + j * 2.4, 1.4, 1.4, "#c4c4bc");
    holes.push(G.rectPts(7, -20, 12, 15), G.rectPts(34, -19.4, 12, 1.4));
    G.inside(ctx, G.rectsRegion(ctx, [[4, -24, 46, 23], [50, -24.5, 72, 3.4], [60, -42, 30, 18], [93, -42, 26, 18]]), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -46, 124, 46), 6142, 0.55);
      G.dirt(ctx, 4, -24, 46, 23, 6143, 0.25);
    }, holes);
  },
};
const liftCallBox = {
  id: "liftCallBox",
  box: [-2, -28, 26, 1],
  draw(ctx, state) {
    plate(ctx, 1, -23, 22, 21, RIM);
    flat(ctx, 3.5, -20.5, 17, 7, "#1a120a", LINE);
    const lit = state === 1;
    shape(ctx, [[8, -19.4], [16, -19.4], [12, -15]], lit ? AMBER_LIT : AMBER_DIM, LINE);
    if (lit)
      glow(ctx, 12, -17.4, 9, AMBER_LIT, 0.45);
    flat(ctx, 3.5, -11, 17, 7, "#0a0806", LINE);
    for (const x of [6, 9, 12, 15])
      flat(ctx, x, -9.4, 1.2, 3.6, GREY[0]);
    if (lit) {
      flat(ctx, 4.5, -10.6, 15, 4.4, "#606054", LINE);
      flat(ctx, 4.5, -10.6, 15, 1, GREY[3]);
      flat(ctx, 16.4, -9.6, 2.4, 1.5, "#843018");
      flat(ctx, 19.5, -10.4, 3, 4, "#c0c0b4", LINE);
    } else if (!simple()) {
      line(ctx, [[8, -4], [7, 1], [9, 3]], CABLE[0], 0.7);
      line(ctx, [[14, -4], [15.5, 0.5]], GREY[2], 0.7);
    }
    G.inside(ctx, G.rectRegion(ctx, 1, -23, 22, 21), () => worn(ctx, 1, -23, 22, 21, 6150, 2, 0.3), [G.rectPts(3.5, -20.5, 17, 7)]);
  },
};
const circuitBox = {
  id: "circuitBox",
  box: [-2, -50, 26, -14],
  anim: true,
  draw(ctx, state, t) {
    plate(ctx, 1, -48, 22, 9, RIM);
    slits(ctx, 3, -47, 18, 7, 2.2);
    plate(ctx, 1, -39, 22, 14, ["#604824", "#9c7c40", "#cca854", "#e4c87a"]);
    flat(ctx, 5, -36.5, 14, 9, "#141410", LINE);
    const fixed = state === 1;
    if (fixed) {
      line(ctx, [[5.4, -31], [9, -31], [9, -34], [14, -34], [14, -30], [18.6, -30]], "#e4d818", 0.9);
      glow(ctx, 12, -32, 9, "#e4d818", 0.25);
    } else if (!simple()) {
      line(ctx, [[5.4, -31], [8, -31], [8, -34]], "#6c6418", 0.7);
      line(ctx, [[14, -34], [15, -30], [18.6, -30]], "#6c6418", 0.7);
    }
    for (let x = 6; x < 18.5; x += 2)
      line(ctx, [[x, -36], [x, -28]], "rgba(132,120,108,0.55)", 0.4);
    disc(ctx, 20.4, -27, 1, fixed ? LAMP_GREEN : LAMP_RED, LINE);
    if (!fixed) {
      curve(ctx, [[7, -25], [5, -21], [8, -17]], CABLE[1], 0.8);
      curve(ctx, [[15, -25], [17, -20], [14, -16]], "#e4c03c", 0.8);
      const k = (t * 3) % 1;
      if (k < 0.35) {
        glow(ctx, 8, -17, 4, "#fff08a", 0.8);
        for (const a of [0.4, 1.6, 2.8])
          line(ctx, [[8, -17], [8 + cos(a + k * 9) * 3, -17 + sin(a + k * 9) * 3]], "#fff08a", 0.5);
      }
    }
    G.inside(ctx, G.rectRegion(ctx, 1, -48, 22, 23), () => worn(ctx, 1, -48, 22, 23, 6160, 2, 0.25), [G.rectPts(5, -36.5, 14, 9)]);
  },
};
const termLines = (ctx, x, y, w, rows, c, seed) => {
  const r = rng(seed);
  rows.forEach((n, i) => {
    let cx = x;
    for (let k = 0; k < n && cx < x + w - 1; k++) {
      const len = 1 + r() * 2.4;
      flat(ctx, cx, y + i * 2, Math.min(len, x + w - cx), 0.9, c);
      cx += len + 0.7;
    }
  });
};
const depotComputer = {
  id: "depotComputer",
  box: [-2, -46, 28, 1],
  anim: true,
  draw(ctx, state, t) {
    plate(ctx, 1, -18, 22, 18, ["#3c3c30", "#545448", "#909084", "#b4b4a8"]);
    for (let y = -15; y < -2; y += 2)
      flat(ctx, 3.5, y, 17, 0.9, "#242418");
    flat(ctx, 2, -19.5, 20, 2, GREY[0], LINE);
    flat(ctx, 0, -42, 24, 22.5, "#788460", LINE);
    flat(ctx, 0.6, -41.4, 22.8, 0.9, "#a0ac84");
    flat(ctx, 0.6, -21.4, 22.8, 1.2, "#3c4830");
    flat(ctx, 3, -39.5, 18, 15.5, "#303c24", LINE);
    const glass = "#6c9054";
    if (state === 0)
      termLines(ctx, 4.2, -38, 15.5, [3, 2, 0, 4], glass, 6170);
    else
      termLines(ctx, 4.2, -38, 15.5, [4, 3, 5, 2, 4, 3], glass, 6171 + state);
    if (state === 2) {
      flat(ctx, 5, -27.6, 14, 3, "#a84828");
      flat(ctx, 6, -26.8, 12 * ((t * 0.5) % 1), 1.4, "#e4c03c");
    } else if ((t * 2) % 1 < 0.5)
      flat(ctx, 4.2 + (state === 0 ? 0 : 6), state === 0 ? -31.6 : -26.6, 1.6, 1, "#b4e090");
    if (state === 1)
      glow(ctx, 12, -32, 12, glass, 0.25);
    flat(ctx, 18.4, -23.4, 1.6, 1, state === 0 ? AMBER : LAMP_GREEN);
    G.inside(ctx, G.rectsRegion(ctx, [[1, -18, 22, 18], [0, -42, 24, 22.5]]), () => {
      worn(ctx, 1, -18, 22, 18, 6175, 2, 0.4);
      G.grain(ctx, G.rectRegion(ctx, 0, -42, 24, 22.5), 6176, 0.6);
      G.drips(ctx, 1, -42, 22, 8, 6177, 2);
    }, [G.rectPts(3, -39.5, 18, 15.5)]);
  },
};
const PADS = [[-4.6, 2.6, 0.4], [-4, -2.2, 0.2], [-1.2, -4.6, 0], [1.8, -4.2, -0.15], [4.6, -1.4, -0.35]];
const sensor = (ctx, cx, cy, on) => {
  disc(ctx, cx, cy, 8, "#484848", LINE);
  disc(ctx, cx, cy, 6.6, "#545454");
  disc(ctx, cx - 1.6, cy - 2, 3, "#606060");
  if (on)
    glow(ctx, cx, cy, 12, "#fcfcfc", 0.35);
  for (const [dx, dy, a] of PADS) {
    ctx.save();
    ctx.translate(cx + dx, cy + dy);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, 1, 1.9, 0, 0, PI * 2);
    ctx.fillStyle = on ? "#fcfcfc" : "#a8a8a8";
    ctx.fill();
    stroke(ctx, LINE, 0.6);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2.6, 2.4, 1.8, 0, 0, PI * 2);
  ctx.fillStyle = on ? "#e0e0e0" : "#8c8c8c";
  ctx.fill();
};
const keySlot = (ctx, x, y, cap, inserted) => {
  disc(ctx, x, y, 3, GREY[2], LINE);
  disc(ctx, x, y, 1.8, "#0a0a08");
  if (inserted) {
    disc(ctx, x, y, 2.2, GREY[3], LINE);
    disc(ctx, x, y, 1.4, cap, LINE);
    disc(ctx, x - 0.4, y - 0.4, 0.5, "#ffffff");
  }
};
const liftController = {
  id: "liftController",
  box: [-2, -50, 52, 1],
  draw(ctx, state) {
    flat(ctx, 0, -10, 48, 8, "#0a0806", LINE);
    flat(ctx, 2, -7, 44, 2.6, GREY[2], LINE);
    flat(ctx, 2, -7, 44, 0.8, SHINE);
    plate(ctx, 0, -46, 48, 34, GREY);
    plate(ctx, 3, -43, 16, 28, ["#6c6454", KEYPAD, "#c0b49c", "#d8ccb4"]);
    flat(ctx, 5, -41, 12, 8, "#242418", LINE);
    const lit = state === 3 ? DISPLAY : "#8c7c38";
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        flat(ctx, 5.6 + i * 3.8, -40.4 + j * 2.5, 3.2, 2, lit);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 4; j++)
        flat(ctx, 5.4 + i * 3.9, -31 + j * 3.6, 3, 2.6, "#d8ccb4", LINE);
    const keys = state >= 1;
    keySlot(ctx, 25, -36, "#783024", keys);
    keySlot(ctx, 25, -24, "#244830", keys);
    flat(ctx, 22.4, -31.4, 5.2, 1.6, "#783024");
    flat(ctx, 22.4, -19.4, 5.2, 1.6, "#244830");
    sensor(ctx, 38.5, -28, state >= 2);
    disc(ctx, 38.5, -42, 1.6, state === 3 ? LAMP_GREEN : state === 0 ? LAMP_RED : AMBER_LIT, LINE);
    if (state === 3)
      glow(ctx, 38.5, -42, 6, LAMP_GREEN, 0.5);
    hazard(ctx, 0, -13.6, 48, 3, 4);
    G.inside(ctx, G.rectRegion(ctx, 0, -46, 48, 34), () => {
      worn(ctx, 0, -46, 48, 34, 6180, 3, 0.25);
    }, [G.rectPts(5, -41, 12, 8), [[30.5, -36], [46.5, -36], [46.5, -20], [30.5, -20]]]);
  },
};
const DOOR_H = 72;
const doorSlab = (ctx, top, h) => {
  flat(ctx, 1, top, 22, h, "#483018", LINE);
  for (let x = 4; x < 21; x += 4) {
    flat(ctx, x, top, 0.9, h, "#2a1a0c");
    flat(ctx, x + 0.9, top, 0.6, h, "#603c20");
  }
  flat(ctx, 20, top, 3, h, "#903c18");
  flat(ctx, 22, top, 1, h, "#5a240c");
  const band = top + h - 16;
  if (band > top) {
    flat(ctx, 1, band, 22, 4.5, "#244848", LINE);
    flat(ctx, 1, band, 22, 1, "#3c6c6c");
  }
  G.inside(ctx, G.rectRegion(ctx, 1, top, 22, h), () => {
    G.grain(ctx, G.rectRegion(ctx, 1, top, 22, h), 6190);
    G.drips(ctx, 1, top, 22, h * 0.4, 6191, 3);
    G.dirt(ctx, 1, top, 22, h, 6192, 0.25);
  });
};
const depotDoor = {
  id: "depotDoor",
  box: [-4, -80, 28, 1],
  draw(ctx, state) {
    const h = state === 0 ? DOOR_H : 12;
    if (state === 1)
      flat(ctx, 1, -DOOR_H, 22, DOOR_H, "#0a0806");
    doorSlab(ctx, -DOOR_H, h);
    for (const x of [-3, 23]) {
      plate(ctx, x, -DOOR_H, 4, DOOR_H, CAB);
      G.inside(ctx, G.rectRegion(ctx, x, -DOOR_H, 4, DOOR_H), () => worn(ctx, x, -DOOR_H, 4, DOOR_H, 6193 + x, 1, 0.2));
    }
    plate(ctx, -4, -DOOR_H - 5, 32, 6, CAB);
    worn(ctx, -4, -DOOR_H - 5, 32, 6, 6195, 2, 0);
    hazard(ctx, 1, -3, 22, 3, 4);
    G.chips(ctx, 1, -3, 22, 6196, G.DIRT);
  },
};
const doorLever = {
  id: "doorLever",
  box: [-4, -46, 22, 1],
  draw(ctx, state) {
    plate(ctx, 2, -36, 12, 22);
    flat(ctx, 6.6, -33, 2.8, 16, "#0a0806", LINE);
    hazard(ctx, 2, -14, 12, 3, 3);
    const a = state === 0 ? -PI / 2 - 0.35 : PI / 2 + 0.35;
    const tip = [8 + cos(a) * 14, -25 + sin(a) * 14];
    line(ctx, [[8, -25], tip], LINE, 3.2);
    line(ctx, [[8, -25], tip], GREY[3], 1.8);
    disc(ctx, tip[0], tip[1], 2.4, "#b02818", LINE);
    disc(ctx, 8, -25, 2.2, GREY[2], LINE);
    disc(ctx, 8, -39.5, 1.4, state === 1 ? LAMP_GREEN : LAMP_RED, LINE);
    G.inside(ctx, G.rectRegion(ctx, 2, -36, 12, 25), () => worn(ctx, 2, -36, 12, 25, 6200, 2, 0.3), [G.rectPts(6.6, -33, 2.8, 16)]);
  },
};
for (const asset of [depotLocker, shaftCover, depotCannon, alienOfficer, alienDesk, liftCallBox, circuitBox, depotComputer, liftController, depotDoor, doorLever])
  define(asset);
})();
