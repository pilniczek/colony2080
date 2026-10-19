(() => {
const { P, MAT } = window.ENV;

const FLYER_PALETTE = {
  fh0: "#182424", fh1: "#2c3838", fh2: "#404c4c", fh3: "#586464", fhLine: "#070d0e",
  fc0: "#061204", fc1: "#0c2008", fc2: "#182414", fc3: "#2c3c24",
  fs0: "#0c3020", fs1: "#285038", fs2: "#305840", fs3: "#406c48",
  fk0: "#282420", fk1: "#3c3a34", fk2: "#545048", fk3: "#686458",
  fWindow: "#244830", fLight: "#c89a30", fLightHot: "#f0d070", fBelly: "#1c140c", fPatch: "#98a8a8",
  e0: "#202488", e1: "#4c70a0", e2: "#c4cccc", e3: "#f4f4f4", eGlow: "#6084f4",
  fire0: "#b04010", fire1: "#e88a28", fire2: "#f8d070", fire3: "#ffffff"
};

const GUARD_PALETTE = {
  gm0: "#1a2426", gm1: "#2e3c40", gm2: "#4a5a5e", gm3: "#8a9a9c", gmLine: "#060a0b",
  gc0: "#3c4a4e", gc1: "#6e7e82", gc2: "#a8b4b6", gc3: "#e4ecec",
  gj0: "#4a3828", gj1: "#806a50", gj2: "#bca07a", gj3: "#f2e2bc",
  visor: "#d03018", visorGlow: "#ff5a30", rust: "#8a4a22", rustLight: "#b8703a",
  acid: "#7ed43a", acidDark: "#2e6a12", fume: "#a8c890",
  fire0: "#b04010", fire1: "#e88a28", fire2: "#f8d070", fire3: "#ffffff"
};

Object.assign(MAT, {
  flyerHull: ["fh0", "fh1", "fh2", "fh3", "fhLine"],
  flyerShell: ["fc0", "fc1", "fc2", "fc3", "fhLine"],
  flyerStripe: ["fs0", "fs1", "fs2", "fs3", "fhLine"],
  flyerHump: ["fk0", "fk1", "fk2", "fk3", "fhLine"],
  guardMetal: ["gm0", "gm1", "gm2", "gm3", "gmLine"],
  guardChrome: ["gc0", "gc1", "gc2", "gc3", "gmLine"],
  guardJaw: ["gj0", "gj1", "gj2", "gj3", "gmLine"]
});

const FIRE_TICKS = 9;
const TICK_HZ = 32;

const fireFrame = t => {
  const k = Math.floor(t * TICK_HZ);
  return k < FIRE_TICKS ? k : -1;
};

function ellipse(ctx, cx, cy, rx, ry, fill, line) {
  ctx.fillStyle = ENV.pal[fill] || fill;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  if (line) P.stroke(ctx, line);
}

function flash(ctx, x, y, dir, k, size) {
  const heat = k === 0 ? 1 : Math.max(0, 1 - k / 5);
  if (heat <= 0) return;
  const len = size * (1.2 + heat);
  if (!ENV.simple) P.glow(ctx, x + dir * len * 0.4, y, size * 2.2 * heat, "fire1", 0.6 * heat);
  P.shape(ctx, [[x, y - size * 0.7], [x + dir * len, y], [x, y + size * 0.7]], "fire0");
  P.shape(ctx, [[x, y - size * 0.45], [x + dir * len * 0.7, y], [x, y + size * 0.45]], "fire1");
  ellipse(ctx, x + dir * size * 0.35, y, size * 0.45 * heat + 0.3, size * 0.3 * heat + 0.3, heat > 0.5 ? "fire3" : "fire2");
}

const GUN_PX = (1.9 * ENV.TILE) / (XBOT.FOOT_Y - Object.fromEntries(XBOT.LEVELS).head);
const MOUNT_BARREL = 150;
const MOUNT = { x: 16.5, y: 14.6 };
const MOUNT_MUZZLE = (GUN.BARREL.x + MOUNT_BARREL + 2) * GUN_PX;

const mountedGun = GUN.model({
  mat: { m: ["fh0", "fh1", "fh2", "fh3", "fhLine"], c: ["c0", "c1", "c2", "c3", "fhLine"], a: ["fs0", "fs1", "fs2", "fs3", "fhLine"] },
  buildParts: length => [
    { name: "pylon", x: -10, y: -92, w: 40, h: 30, mat: "m", tone: 0 },
    { name: "receiver", x: -40, y: -70, w: 110, h: 60, mat: "m", tone: 2 },
    { name: "stripe", x: -10, y: -70, w: 14, h: 60, mat: "a", tone: 1 },
    { name: "feed", x: -30, y: -12, w: 60, h: 30, mat: "m", tone: 0 },
    { name: "barrelBack", x: GUN.BARREL.x, y: -62, w: length - 6, h: 44, mat: "m", tone: 0 },
    { name: "barrelTop", x: GUN.BARREL.x, y: -62, w: length, h: 12, mat: "c", tone: 1 },
    { name: "barrelMid", x: GUN.BARREL.x, y: -46, w: length, h: 12, mat: "c", tone: 2 },
    { name: "barrelLow", x: GUN.BARREL.x, y: -30, w: length, h: 12, mat: "c", tone: 1 },
    { name: "ringRear", x: GUN.BARREL.x + 14, y: -70, w: 16, h: 60, mat: "m", tone: 0 },
    { name: "ringFront", x: GUN.BARREL.x + length - 30, y: -68, w: 14, h: 56, mat: "m", tone: 0 }
  ]
});

function sideGun(ctx) {
  const t = ctx.getTransform();
  const lineW = P.lw(ctx) * Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
  ctx.save();
  ctx.translate(MOUNT.x, MOUNT.y);
  ctx.scale(GUN_PX, GUN_PX);
  mountedGun.draw(ctx, { pal: ENV.pal, lineW, simple: ENV.simple, barrel: MOUNT_BARREL });
  ctx.restore();
}

const FLYER = {
  id: "flyer",
  box: { x: -24.5, y: -9, w: 49, h: 18 },
  draw(ctx, state, t) {
    const fire = state === 1 ? fireFrame(t % 1.2) : -1;
    const flicker = 0.8 + 0.2 * Math.sin(t * 31) * Math.sin(t * 13);
    ctx.translate(-24.5, -10.5 + Math.sin(t * 2.4) * 0.6);

    ellipse(ctx, 8.5, 17, 3.2, 2, "fBelly", "fhLine");
    if (!ENV.simple) ellipse(ctx, 8.5, 17, 1.6, 0.9, "fh0");

    P.poly(ctx, [[4, 14.2], [38, 14.2], [46.5, 13], [38, 15.8], [26, 17.2], [12, 17.4], [4, 16.6], [3.2, 15]], "flyerHull", 0);
    P.poly(ctx, [[4, 11], [26, 11], [47.5, 11.2], [49, 11.8], [46.5, 13], [38, 14.2], [4, 14.2]], "flyerHull", 2);
    P.poly(ctx, [[4, 8], [19, 8.2], [26, 8.4], [26, 11], [4, 11]], "flyerHull", 2);
    P.poly(ctx, [[26, 8.4], [38, 9.2], [47.5, 11.2], [26, 11]], "flyerStripe", 1, { dir: [1, 0] });
    P.poly(ctx, [[19, 3.6], [26, 3.4], [34, 4.6], [40, 6.4], [44, 8.4], [47.5, 11.2], [38, 9.2], [26, 8.4], [19, 8.2]], "flyerShell", 1);
    P.poly(ctx, [[3.5, 5.2], [10.5, 4.8], [10.5, 8], [4, 8]], "flyerHull", 0);
    P.poly(ctx, [[10.5, 4.8], [11, 2.2], [18.5, 2.2], [19.2, 4], [19, 8.2], [10.5, 8]], "flyerHump", 2);
    P.flat(ctx, 12.5, 5.2, 2.6, 1.8, "fWindow", "fhLine");

    if (!ENV.simple) {
      for (const x of [10.5, 19, 26]) P.line(ctx, [[x, 11.2], [x, 14]], "fh0", 0.4, "butt");
      P.line(ctx, [[5, 9.5], [9, 9.5]], "fh3", 0.4, "butt");
      P.flat(ctx, 26.5, 12, 2.5, 1.6, "fPatch");
      P.line(ctx, [[20, 3.8], [33, 5]], "fc3", 0.4);
    }
    for (const x of [9, 11.5, 14, 16.5, 19, 21.5, 24]) P.flat(ctx, x, 11.1, 1.2, 1, x === 24 && fire >= 0 ? "fLightHot" : "fLight");

    sideGun(ctx);
    if (fire >= 0) flash(ctx, MOUNT.x + MOUNT_MUZZLE, MOUNT.y - 40 * GUN_PX, 1, fire, 3.4);

    ellipse(ctx, 2.6, 10.5, 1.9, 7, "e0", "fhLine");
    ellipse(ctx, 2.9, 10.5, 1.3, 5.6, "e1");
    ctx.save();
    ctx.globalAlpha = flicker;
    ellipse(ctx, 3.2, 10.5, 0.9, 4.6, "e2");
    ellipse(ctx, 3.4, 10.5, 0.5, 3.2, "e3");
    ctx.restore();
    if (!ENV.simple) P.glow(ctx, 1.5, 10.5, 7 * flicker, "eGlow", 0.35);
  }
};

function guardBody(ctx, fire) {
  P.box(ctx, 57, 9, 3, 40, "guardMetal", 2, { vertical: true });
  P.poly(ctx, [[40, 53.5], [52, 45], [60, 47.5], [61, 53.5]], "guardMetal", 1);

  P.box(ctx, 7, 33, 34, 7, "guardMetal", 2);
  if (!ENV.simple) {
    for (const x of [13, 20, 23.5, 33]) P.flat(ctx, x, 33, 0.8, 7, "gm0");
    P.line(ctx, [[8, 34.2], [40, 34.2]], "gm3", 0.5, "butt");
  }
  P.box(ctx, 39.5, 33, 1.8, 7, "guardChrome", 2, { vertical: true });
  if (fire >= 0) flash(ctx, 7, 36.5, -1, fire, 4.5);

  P.poly(ctx, [[39, 10], [47, 4], [47.5, 15], [40, 15]], "guardMetal", 2, { dir: [1, 0] });

  P.poly(ctx, [[53, 23], [64, 23], [66, 25], [66, 31], [64, 32.5], [53, 32.5]], "guardChrome", 1);
  if (!ENV.simple) {
    P.line(ctx, [[54, 27.5], [65, 27.5]], "gc3", 0.6, "butt");
    P.flat(ctx, 59.5, 23, 1, 9.5, "gc0");
  }
  P.poly(ctx, [[61, 22.5], [64, 19.5], [65.5, 20.5], [63, 23.5]], "guardChrome", 2);
  P.disc(ctx, 65.5, 20.8, 0.6, "gc3");

  P.poly(ctx, [[6, 23.5], [9, 19.5], [24, 15.5], [42, 14], [45, 16], [52, 25.5], [53, 29], [38, 30.5], [30, 31], [20, 29.5], [9, 26.5]], "guardMetal", 2);
  P.poly(ctx, [[9, 19.5], [24, 15.5], [42, 14], [43, 16], [24, 17.6], [10, 21]], "guardChrome", 2, { line: false });
  P.poly(ctx, [[42, 14], [45, 16], [52, 25.5], [53, 29], [50, 27.5], [43, 18]], "guardChrome", 1, { line: false });
  P.poly(ctx, [[20, 26], [37, 25.5], [38.5, 27.5], [38, 31], [30, 31.2], [22, 29.5]], "guardJaw", 2);
  if (!ENV.simple) {
    P.line(ctx, [[9, 22.6], [30, 22.6]], "gc2", 0.7, "butt");
    for (const x of [30, 34, 37]) P.line(ctx, [[x, 15.5], [x + 0.6, 20.5]], "rust", 0.8, "butt");
    P.line(ctx, [[37.4, 26], [37.4, 30.5]], "gj3", 0.8, "butt");
    P.glow(ctx, 19, 21.3, 7, "visorGlow", 0.35);
  }
  P.flat(ctx, 11, 20.8, 16, 1.1, "visor");

  P.beam(ctx, [55, 33], [41, 47.5], 2.4, "guardChrome");
  P.poly(ctx, [[16, 53.5], [22, 50], [31, 45], [43, 46], [44, 53.5]], "guardChrome", 1);
}

function acidDrips(ctx, t, p) {
  for (let i = 0; i < 6; i++) {
    const x = 18 + i * 7 + Math.sin(i * 3.1) * 2;
    const fall = ((t * 1.6 + i * 0.37) % 1);
    const top = -6 + fall * 30;
    P.line(ctx, [[x, top], [x + 0.3, top + 6 + p * 8]], "acid", 1.2);
    P.disc(ctx, x + 0.3, top + 7 + p * 8, 0.9, "acid");
  }
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.45 * p;
  for (let i = 0; i < 9; i++) {
    const x = 10 + i * 5, y = 17 + (i % 3) * 8;
    ellipse(ctx, x, y, 2 + p * 3, 1.2 + p * 2, i % 2 ? "acid" : "acidDark");
  }
  ctx.restore();
  if (ENV.simple) return;
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const rise = (t * 0.5 + i * 0.25) % 1;
    ctx.globalAlpha = 0.35 * (1 - rise) * p;
    ellipse(ctx, 20 + i * 10, 22 - rise * 18, 3 + rise * 4, 2 + rise * 3, "fume");
  }
  ctx.restore();
  ellipse(ctx, 34, 53, 22 * (0.3 + p), 1.4, "acid");
}

function guardWreck(ctx) {
  P.poly(ctx, [[4, 72], [8, 57], [14, 53], [22, 54.5], [30, 50.5], [40, 52], [48, 49.5], [58, 52.5], [66, 56], [70, 72]], "guardMetal", 1);
  P.poly(ctx, [[10, 56], [14, 53], [22, 54.5], [30, 50.5], [40, 52], [48, 49.5], [56, 52], [48, 53.5], [36, 54.5], [24, 57], [14, 58]], "guardChrome", 2, { line: false });
  for (const [a, b] of [[[10, 70], [18, 59]], [[20, 72], [28, 60]], [[24, 66], [32, 64]]]) P.beam(ctx, a, b, 1.6, "rust");
  P.poly(ctx, [[36, 58], [44, 52], [44, 58]], "guardMetal", 2);
  P.box(ctx, 47, 60, 22, 12, "guardJaw", 1);
  if (!ENV.simple) {
    P.flat(ctx, 48, 62, 6, 2, "gc2");
    P.flat(ctx, 30, 62, 6, 1, "visor");
    P.line(ctx, [[12, 64], [40, 66]], "gm0", 0.6);
  }
}

const GUARD = {
  id: "guard",
  box: { x: -53, y: -50, w: 61, h: 50 },
  draw(ctx, state, t) {
    if (state === 3) {
      ctx.translate(-59.5, -72);
      return guardWreck(ctx);
    }
    ctx.translate(-58.5, -53.5);
    const fire = state === 1 ? fireFrame(t % 1.4) : -1;
    if (state !== 2) return guardBody(ctx, fire);
    const p = (t % 3) / 3;
    ctx.save();
    ctx.filter = `brightness(${1 - p * 0.45}) saturate(${1 - p * 0.6})`;
    guardBody(ctx, -1);
    ctx.restore();
    acidDrips(ctx, t, p);
  }
};

function burst(ctx, x, y, r, k) {
  const heat = k === 0 ? 1 : Math.max(0, 1 - k / 5);
  if (heat <= 0) return;
  if (!ENV.simple) P.glow(ctx, x, y, r * 2.4 * heat, "fire1", 0.6 * heat);
  const spikes = 7;
  const pts = Array.from({ length: spikes * 2 }, (_, i) => {
    const a = (i / (spikes * 2)) * Math.PI * 2 + k;
    const rr = (i % 2 ? 0.55 : 1) * r * (0.5 + heat * 0.5);
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
  });
  P.shape(ctx, pts, "fire1");
  P.disc(ctx, x, y, r * 0.45 * heat + 0.3, heat > 0.5 ? "fire3" : "fire2");
}

function frontPod(ctx, side, fire) {
  const x = side * 24;
  P.beam(ctx, [side * 11, -41], [x, -42], 2, "guardMetal");
  P.box(ctx, x - 6.5, -47, 13, 9.5, "guardMetal", 1);
  P.flat(ctx, x - 5.5, -46, 11, 2, "gm3");
  for (const dx of [-3.5, 0, 3.5]) P.disc(ctx, x + dx, -42, 1.3, "gm0", "gmLine");
  if (fire >= 0) burst(ctx, x, -42, 6, fire);
}

function frontLeg(ctx, side) {
  const x = side * 9;
  P.box(ctx, x - 1.5, -28, 3, 10, "guardMetal", 1, { vertical: true });
  P.poly(ctx, [[x - 3.5, -19], [x + 3.5, -19], [x + 4.5, -5], [x - 4.5, -5]], "guardMetal", 2, { dir: [1, 0] });
  P.flat(ctx, x - 4, -11, 8, 1.2, "gm0");
  P.poly(ctx, [[x - 6, -5], [x + 6, -5], [x + 8, 0], [x - 8, 0]], "guardMetal", 0);
}

const GUARD_FRONT = {
  id: "guardFront",
  box: { x: -31, y: -50, w: 62, h: 50 },
  draw(ctx, state, t) {
    const fire = state === 1 ? fireFrame(t % 1.4) : -1;
    frontLeg(ctx, -1);
    frontLeg(ctx, 1);
    frontPod(ctx, -1, fire < 0 ? -1 : Math.max(0, fire - 2));
    frontPod(ctx, 1, fire);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -36, 13, 15, 0, 0, Math.PI * 2);
    ctx.clip();
    P.poly(ctx, [[-14, -52], [14, -52], [14, -20], [-14, -20]], "guardMetal", 2, { dir: [1, 0], line: false });
    P.poly(ctx, [[-14, -52], [14, -52], [14, -44], [-14, -40]], "guardChrome", 1, { line: false });
    P.flat(ctx, -14, -30, 28, 10, "gm0");
    if (!ENV.simple) {
      P.glow(ctx, 0, -44, 6, "gc2", 0.35);
      P.line(ctx, [[-12, -34], [12, -34]], "gm0", 0.8, "butt");
    }
    P.flat(ctx, -6, -36.5, 12, 1.2, "visor");
    ctx.restore();
    ellipse(ctx, 0, -36, 13, 15, "rgba(0,0,0,0)", "gmLine");
  }
};

window.ENEMIES = {
  FLYER, GUARD, GUARD_FRONT, FLYER_PALETTE, GUARD_PALETTE,
  FLYER_STATES: ["hover", "firing"],
  GUARD_STATES: ["idle", "firing", "acid (guess)", "wreck"]
};
})();
