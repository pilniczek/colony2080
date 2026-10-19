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

function guardLeg(ctx, dx, tone) {
  const hip = [42 + dx, 30], knee = [34 + dx, 40.5], ankle = [43 + dx, 49.5];
  P.beam(ctx, hip, knee, 4.2, "guardMetal");
  P.beam(ctx, knee, ankle, 3.2, "guardMetal");
  P.poly(ctx, [[knee[0] - 3, knee[1] - 3], [knee[0] + 2.5, knee[1] - 3.5], [knee[0] + 3, knee[1] + 2.5], [knee[0] - 2, knee[1] + 3]], "guardChrome", tone);
  P.poly(ctx, [[ankle[0] - 13, 53.5], [ankle[0] - 7, 50], [ankle[0] + 2, 48.5], [ankle[0] + 5, 51], [ankle[0] + 5, 53.5]], "guardChrome", tone);
}

function guardBody(ctx, fire) {
  P.box(ctx, 50, 3, 1.4, 12, "guardMetal", 2, { vertical: true });
  P.disc(ctx, 50.7, 3, 0.9, "visor");
  guardLeg(ctx, 6, 0);
  P.box(ctx, 26, 30, 14, 3, "guardMetal", 0);

  P.box(ctx, 40, 9, 12, 8, "guardMetal", 1);
  if (!ENV.simple) for (const [x, y] of [[42.5, 11], [45.5, 11], [48.5, 11], [42.5, 14], [45.5, 14], [48.5, 14]]) P.disc(ctx, x, y, 0.9, "gm0");
  P.flat(ctx, 40, 9, 2, 8, "gm3");

  P.poly(ctx, [[25, 22.5], [28, 18.5], [36, 15.5], [46, 15], [51, 17.5], [53, 24], [51, 31], [44, 33], [36, 32.5], [30, 29.5], [26, 25.5]], "guardMetal", 2);
  P.poly(ctx, [[28, 18.5], [36, 15.5], [46, 15], [46.5, 17.2], [36, 17.8], [29, 20.5]], "guardChrome", 2, { line: false });
  P.poly(ctx, [[46, 15], [51, 17.5], [53, 24], [51, 31], [49.5, 25], [47.5, 18.5]], "guardChrome", 1, { line: false });
  P.poly(ctx, [[29, 26.5], [38, 26], [40, 28], [39, 32], [34, 32.4], [30, 29.5]], "guardJaw", 2);
  if (!ENV.simple) {
    P.line(ctx, [[27, 23.6], [40, 23.6]], "gc2", 0.6, "butt");
    for (const x of [42, 45]) P.line(ctx, [[x, 17.5], [x + 0.6, 22]], "rust", 0.8, "butt");
    P.line(ctx, [[38.6, 27], [38.6, 31]], "gj3", 0.8, "butt");
    P.glow(ctx, 32, 21.8, 6, "visorGlow", 0.35);
  }
  P.flat(ctx, 28, 21.3, 10, 1.1, "visor");

  guardLeg(ctx, 0, 1);

  P.beam(ctx, [44, 25], [40, 32], 3, "guardChrome");
  P.box(ctx, 21, 31, 22, 5.5, "guardMetal", 2);
  if (!ENV.simple) {
    for (const x of [26, 31, 36]) P.flat(ctx, x, 31, 0.8, 5.5, "gm0");
    P.line(ctx, [[22, 32.2], [42, 32.2]], "gm3", 0.5, "butt");
  }
  P.box(ctx, 20, 31.5, 1.8, 4.5, "guardChrome", 2, { vertical: true });
  if (fire >= 0) flash(ctx, 20, 33.7, -1, fire, 4.2);
}

function acidDrips(ctx, t, p) {
  for (let i = 0; i < 6; i++) {
    const x = 26 + i * 4.5 + Math.sin(i * 3.1) * 1.5;
    const fall = ((t * 1.6 + i * 0.37) % 1);
    const top = -6 + fall * 30;
    P.line(ctx, [[x, top], [x + 0.3, top + 6 + p * 8]], "acid", 1.2);
    P.disc(ctx, x + 0.3, top + 7 + p * 8, 0.9, "acid");
  }
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.45 * p;
  for (let i = 0; i < 9; i++) {
    const x = 26 + i * 3, y = 17 + (i % 3) * 7;
    ellipse(ctx, x, y, 2 + p * 3, 1.2 + p * 2, i % 2 ? "acid" : "acidDark");
  }
  ctx.restore();
  if (ENV.simple) return;
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const rise = (t * 0.5 + i * 0.25) % 1;
    ctx.globalAlpha = 0.35 * (1 - rise) * p;
    ellipse(ctx, 28 + i * 7, 14 - rise * 16, 3 + rise * 4, 2 + rise * 3, "fume");
  }
  ctx.restore();
  ellipse(ctx, 38, 53, 16 * (0.3 + p), 1.4, "acid");
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

const GUARD_SIZE = 1.4;

const GUARD = {
  id: "guard",
  box: { x: -53, y: -72, w: 49, h: 72 },
  draw(ctx, state, t) {
    ctx.scale(GUARD_SIZE, GUARD_SIZE);
    if (state === 3) {
      ctx.translate(-21, 0);
      ctx.scale(0.6, 0.6);
      ctx.translate(-37, -72);
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

function frontLeg(ctx, side, tone) {
  const x = side * 7;
  P.poly(ctx, [[x - 3, -24], [x + 3, -24], [x + 2.5, -13], [x - 2.5, -13]], "guardMetal", tone, { dir: [1, 0] });
  P.poly(ctx, [[x - 3.5, -15.5], [x + 3.5, -15.5], [x + 3, -10.5], [x - 3, -10.5]], "guardChrome", tone);
  P.box(ctx, x - 1.6, -11, 3.2, 8, "guardMetal", tone, { vertical: true });
  P.poly(ctx, [[x - 5.5, -3.5], [x + 5.5, -3.5], [x + 7, 0], [x - 7, 0]], "guardChrome", tone);
}

function frontGun(ctx, side, fire) {
  const x = side * 14;
  P.beam(ctx, [side * 9, -28], [x, -23], 3, "guardChrome");
  P.box(ctx, x - 3.5, -23, 7, 6.5, "guardMetal", 2);
  P.disc(ctx, x, -19.6, 2.1, "gm0", "gmLine");
  if (!ENV.simple) P.disc(ctx, x, -19.6, 1, "gc0");
  if (fire >= 0) burst(ctx, x, -19.6, 5, fire);
}

const GUARD_FRONT = {
  id: "guardFront",
  box: { x: -25, y: -72, w: 50, h: 72 },
  draw(ctx, state, t) {
    const fire = state === 1 ? fireFrame(t % 1.4) : -1;
    ctx.scale(GUARD_SIZE, GUARD_SIZE);
    frontLeg(ctx, -1, 1);
    frontLeg(ctx, 1, 1);
    P.box(ctx, 3.5, -50.5, 1.4, 12, "guardMetal", 2, { vertical: true });
    P.disc(ctx, 4.2, -50.5, 0.9, "visor");
    P.box(ctx, 2, -44.5, 10, 8, "guardMetal", 1);
    if (!ENV.simple) for (const [x, y] of [[4.5, -42.5], [7, -42.5], [9.5, -42.5], [4.5, -39.5], [7, -39.5], [9.5, -39.5]]) P.disc(ctx, x, y, 0.9, "gm0");
    P.poly(ctx, [[-9, -37], [-5, -39], [5, -39], [9, -37], [11, -29], [9, -21], [-9, -21], [-11, -29]], "guardMetal", 2, { dir: [1, 0] });
    P.poly(ctx, [[-9, -37], [-5, -39], [5, -39], [9, -37], [7, -35.5], [-7, -35.5]], "guardChrome", 2, { line: false });
    P.poly(ctx, [[-5, -27], [5, -27], [6, -24], [4, -21], [-4, -21], [-6, -24]], "guardJaw", 2);
    if (!ENV.simple) {
      P.line(ctx, [[-8, -29.6], [8, -29.6]], "gc2", 0.6, "butt");
      for (const x of [-6, 6]) P.line(ctx, [[x, -36], [x + 0.4, -32]], "rust", 0.8, "butt");
      P.glow(ctx, 0, -31.7, 6, "visorGlow", 0.35);
    }
    P.flat(ctx, -6, -32.3, 12, 1.2, "visor");
    frontGun(ctx, -1, fire < 0 ? -1 : Math.max(0, fire - 2));
    frontGun(ctx, 1, fire);
  }
};

window.ENEMIES = {
  FLYER, GUARD, GUARD_FRONT, FLYER_PALETTE, GUARD_PALETTE,
  FLYER_STATES: ["hover", "firing"],
  GUARD_STATES: ["idle", "firing", "acid (guess)", "wreck"]
};
})();
