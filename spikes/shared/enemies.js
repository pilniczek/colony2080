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
  ...FLYER_PALETTE,
  gm0: "#182424", gm1: "#2c3838", gm2: "#404c4c", gm3: "#586464", gmLine: "#070d0e",
  gc0: "#445854", gc1: "#6c7c7a", gc2: "#98a8a8", gc3: "#c4cccc",
  top0: "#061204", top1: "#0c2008", top2: "#182414", top3: "#2c3c24",
  stripe0: "#163220", stripe1: "#285038", stripe2: "#305840", stripe3: "#406c48",
  light: "#c89a30", glint: "#4a7068",
  shell0: "#2c3838", shell1: "#404c4c", shell2: "#4c5858", shell3: "#586464", groove: "#202a28", band: "#304040",
  visor0: "#582404", visor1: "#78200c", visor2: "#ac2c0c", visor3: "#d8401c",
  lip0: "#808078", lip1: "#b8b8b8", lip2: "#fcfcfc", stain: "#805c38",
  visor: "#ac2c0c", visorGlow: "#ff5a30", rust: "#8a4a22", rustLight: "#b8703a",
  acid: "#7ed43a", acidDark: "#2e6a12", fume: "#a8c890",
  fire0: "#b04010", fire1: "#e88a28", fire2: "#f8d070", fire3: "#ffffff"
};

Object.assign(MAT, {
  flyerHull: ["fh0", "fh1", "fh2", "fh3", "fhLine"],
  flyerShell: ["fc0", "fc1", "fc2", "fc3", "fhLine"],
  flyerStripe: ["fs0", "fs1", "fs2", "fs3", "fhLine"],
  flyerHump: ["fk0", "fk1", "fk2", "fk3", "fhLine"],
  guardMetal: ["gm0", "gm1", "gm2", "gm3", "gmLine"],
  guardChrome: ["gc0", "gc1", "gc2", "gc3", "gmLine"]
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

function sideGun(ctx, x, y, facing, barrel) {
  const t = ctx.getTransform();
  const lineW = P.lw(ctx) * Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(GUN_PX * facing, GUN_PX);
  mountedGun.draw(ctx, { pal: ENV.pal, lineW, simple: ENV.simple, barrel });
  ctx.restore();
}

function flyerHull(ctx, { hot = false, hump = true, patch = true } = {}) {
  P.poly(ctx, [[4, 14.2], [38, 14.2], [46.5, 13], [38, 15.8], [26, 17.2], [12, 17.4], [4, 16.6], [3.2, 15]], "flyerHull", 0);
  P.poly(ctx, [[4, 11], [26, 11], [47.5, 11.2], [49, 11.8], [46.5, 13], [38, 14.2], [4, 14.2]], "flyerHull", 2);
  P.poly(ctx, [[4, 8], [19, 8.2], [26, 8.4], [26, 11], [4, 11]], "flyerHull", 2);
  P.poly(ctx, [[26, 8.4], [38, 9.2], [47.5, 11.2], [26, 11]], "flyerStripe", 1, { dir: [1, 0] });
  P.poly(ctx, [[19, 3.6], [26, 3.4], [34, 4.6], [40, 6.4], [44, 8.4], [47.5, 11.2], [38, 9.2], [26, 8.4], [19, 8.2]], "flyerShell", 1);
  P.poly(ctx, [[3.5, 5.2], [10.5, 4.8], [10.5, 8], [4, 8]], "flyerHull", 0);
  if (hump) {
    P.poly(ctx, [[10.5, 4.8], [11, 2.2], [18.5, 2.2], [19.2, 4], [19, 8.2], [10.5, 8]], "flyerHump", 2);
    P.flat(ctx, 12.5, 5.2, 2.6, 1.8, "fWindow", "fhLine");
  } else {
    P.poly(ctx, [[3.5, 5.2], [10.5, 4.4], [19.4, 3.5], [19, 8.2], [4, 8]], "flyerHull", 1);
  }

  if (!ENV.simple) {
    for (const x of [10.5, 19, 26]) P.line(ctx, [[x, 11.2], [x, 14]], "fh0", 0.4, "butt");
    P.line(ctx, [[5, 9.5], [9, 9.5]], "fh3", 0.4, "butt");
    if (patch) P.flat(ctx, 26.5, 12, 2.5, 1.6, "fPatch");
    P.line(ctx, [[20, 3.8], [33, 5]], "fc3", 0.4);
  }
  for (const x of [9, 11.5, 14, 16.5, 19, 21.5, 24]) P.flat(ctx, x, 11.1, 1.2, 1, x === 24 && hot ? "fLightHot" : "fLight");
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

    flyerHull(ctx, { hot: fire >= 0 });

    sideGun(ctx, MOUNT.x, MOUNT.y, 1, MOUNT_BARREL);
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

function grad(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [at, c] of stops) g.addColorStop(at, ENV.pal[c] || c);
  return g;
}

function fillPath(ctx, trace, fill, line = "gmLine") {
  ctx.beginPath();
  trace(ctx);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (line) P.stroke(ctx, line);
}

function slit(ctx, x0, x1, y, h, stops) {
  ctx.fillStyle = grad(ctx, x0, 0, x1, 0, stops);
  ctx.fillRect(x0, y, x1 - x0, h);
}

function canopy(ctx, trace, top, bottom, shine) {
  fillPath(ctx, trace, grad(ctx, 0, top, 0, bottom, [[0, "fc3"], [0.2, "fc2"], [1, "fc1"]]), "fc0");
  if (!ENV.simple) ENV.P.curve(ctx, shine, "fc3", 0.5);
}

const HULL = { nose: 21, rear: 54, top: 9, sx: 33 / 45.8, sy: 24 / 15.2 };

const SQUASH = 0.5;

function squashAbove(ctx, y, draw) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(-100, y, 200, 200);
  ctx.clip();
  draw(false);
  ctx.restore();
  ctx.save();
  ctx.translate(0, y);
  ctx.scale(1, SQUASH);
  ctx.translate(0, -y);
  ctx.beginPath();
  ctx.rect(-100, y - 200, 200, 200);
  ctx.clip();
  draw(true);
  ctx.restore();
}

function sideHead(ctx) {
  squashAbove(ctx, 21, top => sideHull(ctx, top ? BROW : 26));
  sideVisor(ctx);
}

const BROW = 22;

function sideHull(ctx, front) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(front, 0);
  ctx.lineTo(60, 0);
  ctx.lineTo(60, 60);
  ctx.lineTo(0, 60);
  ctx.lineTo(0, 24.2);
  ctx.lineTo(front, 24.2);
  ctx.closePath();
  ctx.clip();
  ctx.translate(HULL.rear + 3.2 * HULL.sx, HULL.top - 2.2 * HULL.sy);
  ctx.scale(-HULL.sx, HULL.sy);
  flyerHull(ctx, { hump: false, patch: false });
  ctx.restore();
}

function sideVisor(ctx) {
  P.line(ctx, [[BROW, 21], [26, 21]], "gmLine", 0.5, "butt");
  ctx.fillStyle = ENV.pal.groove;
  ctx.fillRect(26, 21, 16, 1.1);
  slit(ctx, 26, 41, 22.1, 1.1, [[0, "visor0"], [0.3, "visor1"], [0.75, "visor2"], [0.92, "visor3"], [1, "visor1"]]);
  ctx.fillStyle = ENV.pal.band;
  ctx.fillRect(26, 23.2, 16, 1);
  P.line(ctx, [[26, 21], [26, 24.2]], "gmLine", 0.4, "butt");
  slit(ctx, HULL.nose, 42, 24.2, 0.9, [[0, "glint"], [0.14, "glint"], [0.2, "lip0"], [0.5, "lip1"], [0.85, "lip2"], [1, "lip1"]]);

}

function frontHead(ctx) {
  squashAbove(ctx, -32.9, () => frontShell(ctx));
}

function frontShell(ctx) {
  const shell = c => {
    c.moveTo(-9.6, -34);
    c.quadraticCurveTo(0, -42, 9.6, -34);
    c.quadraticCurveTo(11.2, -29, 9.4, -23.5);
    c.quadraticCurveTo(0, -20, -9.4, -23.5);
    c.quadraticCurveTo(-11.2, -29, -9.6, -34);
  };
  fillPath(ctx, shell, grad(ctx, 0, -39, 0, -21, [[0, "shell2"], [0.35, "shell1"], [0.7, "gm1"], [1, "shell0"]]));
  ctx.save();
  ctx.beginPath();
  shell(ctx);
  ctx.clip();
  if (!ENV.simple) {
    for (const side of [-1, 1]) {
      const x = side * 8.6;
      ctx.fillStyle = grad(ctx, 0, -37, 0, -24, [[0, "shell2"], [1, "shell0"]]);
      ctx.fillRect(x - 1.1, -37, 2.2, 13);
      ctx.fillStyle = grad(ctx, 0, -36, 0, -30, [[0, "stain"], [1, "rgba(0,0,0,0)"]]);
      ctx.fillRect(x - 0.5, -36, 1, 6);
    }
    ctx.fillStyle = grad(ctx, 0, -39, 0, -33, [[0, "lip2"], [1, "rgba(0,0,0,0)"]]);
    ctx.fillRect(3.5, -39, 0.7, 6);
  }
  canopy(ctx, c => {
    c.moveTo(-12, -32.9);
    c.lineTo(-12, -44);
    c.lineTo(12, -44);
    c.lineTo(12, -32.9);
    c.quadraticCurveTo(0, -34.4, -12, -32.9);
  }, -41, -33, [[-7, -37.2], [-2, -39.6], [4, -39.2]]);
  ctx.fillStyle = ENV.pal.groove;
  ctx.fillRect(-11, -32.9, 22, 3.4);
  slit(ctx, -7.5, 7.5, -31.9, 1.2, [[0, "visor0"], [0.25, "visor1"], [0.5, "visor3"], [0.75, "visor2"], [1, "visor0"]]);
  slit(ctx, -11, 11, -29.5, 0.9, [[0, "lip0"], [0.35, "lip1"], [0.6, "lip2"], [1, "lip0"]]);
  ctx.fillStyle = ENV.pal.shell0;
  ctx.fillRect(-11, -28.6, 22, 1.2);
  ctx.restore();
  if (!ENV.simple) P.glow(ctx, 0, -31.3, 5, "visorGlow", 0.25);

}

function guardBody(ctx, fire) {
  guardLeg(ctx, 6, 0);
  P.box(ctx, 26, 30, 14, 3, "guardMetal", 0);


  sideHead(ctx);

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
  P.box(ctx, 47, 60, 22, 12, "guardMetal", 1);
  if (!ENV.simple) {
    P.flat(ctx, 48, 62, 6, 2, "gc2");
    P.flat(ctx, 30, 62, 6, 1, "visor");
    P.line(ctx, [[12, 64], [40, 66]], "gm0", 0.6);
  }
}

const GUARD_SIZE = 1.4;

const GUARD = {
  id: "guard",
  box: { x: -53, y: -50, w: 49, h: 50 },
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
  box: { x: -25, y: -50, w: 50, h: 50 },
  draw(ctx, state, t) {
    const fire = state === 1 ? fireFrame(t % 1.4) : -1;
    ctx.scale(GUARD_SIZE, GUARD_SIZE);
    frontLeg(ctx, -1, 1);
    frontLeg(ctx, 1, 1);
    frontHead(ctx);
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
