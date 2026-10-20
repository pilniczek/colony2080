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
  visor: "#ac2c0c", visorGlow: "#ff5a30",
  acid: "#7ed43a", acidDark: "#2e6a12", fume: "#a8c890",
  fire0: "#b04010", fire1: "#e88a28", fire2: "#f8d070", fire3: "#ffffff"
};

const TROOPER_PALETTE = {
  ...GUARD_PALETTE,
  tg0: "#241e0c", tg1: "#3c341c", tg2: "#585020", tg3: "#7c7434",
  trim: "#c89a30", eye: "#d8401c", eyeGlow: "#ff5a30"
};

Object.assign(ENV.PALETTE, TROOPER_PALETTE);

Object.assign(MAT, {
  flyerHull: ["fh0", "fh1", "fh2", "fh3", "fhLine"],
  flyerShell: ["fc0", "fc1", "fc2", "fc3", "fhLine"],
  flyerStripe: ["fs0", "fs1", "fs2", "fs3", "fhLine"],
  flyerHump: ["fk0", "fk1", "fk2", "fk3", "fhLine"],
  guardMetal: ["gm0", "gm1", "gm2", "gm3", "gmLine"],
  guardChrome: ["gc0", "gc1", "gc2", "gc3", "gmLine"],
  trooperGun: ["tg0", "tg1", "tg2", "tg3", "gmLine"]
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

const BLAST = { grow: 0.25, hideBody: 0.45, center: -84, spin: 3.2, pull: [0.75, 1.1], fade: [0.9, 1.2], ring: [0.95, 1.45], ringRadius: 72, ringWidth: 11, swirl: 0.16, size: 1.6, loop: 2 };
const BLAST_PX = (1.9 * ENV.TILE) / 147;
const FIREBALLS = [[6, -96, 0, 22], [-14, -72, 0.08, 26], [22, -60, 0.16, 24], [-4, -116, 0.24, 30], [-26, -100, 0.3, 24], [18, -128, 0.36, 28], [0, -84, 0.4, 36], [-18, -40, 0.46, 22], [24, -36, 0.5, 20]];
const BLAST_COLORS = { core: "#fff3b0", mid: "#ffb030", edge: "#e8641a", out: "rgba(150,40,10,0)", vortex: "#d8301c", scrap: "#5d6668", scrapLight: "#a9b3b5" };
const SCRAP = [[-34, 0], [-26, -8], [-14, -10], [-8, -18], [2, -12], [10, -22], [18, -12], [28, -10], [36, 0]];

const span = (t, [a, b]) => Math.min(1, Math.max(0, (t - a) / (b - a)));

function fireball(ctx, x, y, r, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, BLAST_COLORS.core);
  g.addColorStop(0.45, BLAST_COLORS.mid);
  g.addColorStop(0.8, BLAST_COLORS.edge);
  g.addColorStop(1, BLAST_COLORS.out);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function swirlBall(ctx, x, y, r, angle, alpha) {
  fireball(ctx, x, y, r, alpha);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = BLAST_COLORS.edge;
  ctx.lineWidth = r * BLAST.swirl;
  ctx.lineCap = "round";
  for (const [k, from, sweep] of [[0.62, 0, 1.3], [0.34, Math.PI, 1.1]]) {
    ctx.beginPath();
    ctx.arc(x, y, r * k, angle + from, angle + from + Math.PI * sweep);
    ctx.stroke();
  }
  ctx.restore();
}

function vortexRing(ctx, cy, age) {
  const u = span(age, BLAST.ring);
  if (u <= 0 || u >= 1) return;
  const angle = BLAST.spin * 1.5 * age;
  ctx.save();
  ctx.globalAlpha *= 1 - u;
  ctx.strokeStyle = BLAST_COLORS.vortex;
  ctx.lineWidth = BLAST.ringWidth * (1 - u * 0.8);
  ctx.lineCap = "round";
  const radius = BLAST.ringRadius * (0.7 + 0.5 * u);
  for (let i = 0; i < 3; i++) {
    const from = angle + (i * 2 * Math.PI) / 3;
    ctx.beginPath();
    ctx.arc(0, cy, radius * (1 - 0.08 * i), from, from + Math.PI * (0.55 - 0.25 * u));
    ctx.stroke();
  }
  ctx.restore();
}

function blast(ctx, age, facing = 1) {
  const cy = BLAST.center;
  const angle = facing * BLAST.spin * age;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const pull = 1 - 0.85 * span(age, BLAST.pull);
  const alpha = 1 - span(age, BLAST.fade);
  FIREBALLS.forEach(([dx, dy, start, r], i) => {
    const t = age - start;
    if (t < 0 || alpha <= 0) return;
    const ox = facing * dx * BLAST.size, oy = (dy - BLAST.center) * BLAST.size;
    const grow = Math.min(1, t / BLAST.grow) * (1 + 0.4 * (1 - pull));
    swirlBall(ctx, (ox * cos - oy * sin) * pull, cy + (ox * sin + oy * cos) * pull, r * BLAST.size * (0.3 + 0.7 * grow), angle * 1.6 + i, alpha);
  });
  vortexRing(ctx, cy, age);
}

function scrap(ctx, facing = 1) {
  ctx.fillStyle = BLAST_COLORS.scrap;
  ctx.beginPath();
  for (const [dx, dy] of SCRAP) ctx.lineTo(facing * dx, dy);
  ctx.fill();
  ctx.fillStyle = BLAST_COLORS.scrapLight;
  for (const [dx, dy, w] of [[-12, -9, 6], [8, -18, 4], [20, -10, 5]]) ctx.fillRect(facing * dx, dy, w, 2);
}

function inBlastUnits(ctx, x, y, draw) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(BLAST_PX, BLAST_PX);
  draw();
  ctx.restore();
}

const FLYER = {
  id: "flyer",
  box: { x: -24.5, y: -9, w: 49, h: 18 },
  draw(ctx, state, t) {
    if (state !== 2) return flyerBody(ctx, state, t);
    const age = t % BLAST.loop;
    if (age < BLAST.hideBody) {
      ctx.save();
      flyerBody(ctx, 0, t);
      ctx.restore();
    }
    inBlastUnits(ctx, 0, -BLAST.center * BLAST_PX, () => blast(ctx, age));
  }
};

function flyerBody(ctx, state, t) {
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

const LEG = 1 / 12;
const KNEE_PAD = 0.75;
const FOOT_AHEAD = 2;
const PLATE = { up: 1.2, ahead: 2 };
const FAR_LEG = { dx: 2.5, shade: "brightness(0.6) saturate(0.8)" };
const SIDE_LEG = {
  joint: [300, 486],
  cap: [[300, 448], [340, 452], [362, 478], [362, 510], [344, 534], [318, 532], [310, 500]],
  shin: [[256, 500], [340, 500], [354, 690], [240, 690]],
  foot: [[204, 688], [384, 688], [402, 712], [398, 744], [202, 744]],
  toe: [[300, 688], [384, 688], [396, 706], [300, 706]]
};
const FRONT_LEG = {
  axis: 211,
  shin: [[164, 508], [262, 508], [278, 690], [150, 690]],
  foot: [[146, 688], [282, 688], [290, 714], [286, 744], [142, 744], [136, 714]],
  toe: [[152, 688], [276, 688], [282, 706], [146, 706]]
};

function inRigUnits(ctx, at, sx, sy, origin, draw) {
  ctx.save();
  ctx.translate(...at);
  ctx.scale(sx, sy);
  ctx.translate(-origin[0], -origin[1]);
  draw();
  ctx.restore();
}

function sideLegArmor(ctx, knee, ankle, { forward = false, pad = KNEE_PAD, trim = 0, padAt = knee } = {}) {
  const len = Math.hypot(ankle[0] - knee[0], ankle[1] - knee[1]);
  ctx.save();
  ctx.translate(...knee);
  ctx.rotate(Math.atan2(ankle[1] - knee[1], ankle[0] - knee[0]) - Math.PI / 2);
  inRigUnits(ctx, [0, 0], -LEG, len / 190, [298, 500], () => P.poly(ctx, SIDE_LEG.shin, "guardMetal", 2, { dir: [1, 0] }));
  ctx.restore();
  const half = (SIDE_LEG.shin[2][0] - SIDE_LEG.shin[3][0]) * LEG / 2;
  const side = [half * (ankle[1] - knee[1]) / len, -half * (ankle[0] - knee[0]) / len];
  const front = side[0] <= 0 ? 1 : -1;
  const edge = [ankle[0] + side[0] * front, ankle[1] + side[1] * front];
  const up = [edge[0] - PLATE.up * (ankle[0] - knee[0]) / len, edge[1] - PLATE.up * (ankle[1] - knee[1]) / len];
  const footTop = 53.5 - (744 - SIDE_LEG.foot[0][1]) * LEG;
  const footX = ankle[0] - FOOT_AHEAD;
  P.poly(ctx, [[ankle[0], footTop + 0.5], edge, up, [edge[0] - PLATE.ahead, footTop + 0.5]], "guardMetal", 1);
  inRigUnits(ctx, [footX, 53.5], -LEG, LEG, [300, 744], () => {
    P.poly(ctx, SIDE_LEG.foot, "guardMetal", 1);
    P.poly(ctx, SIDE_LEG.toe, "guardChrome", 2);
  });
  inRigUnits(ctx, padAt, (forward ? -1 : 1) * LEG * pad, LEG * pad, SIDE_LEG.joint, () => {
    P.disc(ctx, 300, 486, 30, "gm1", "gmLine");
    P.poly(ctx, SIDE_LEG.cap, "guardChrome", 1);
    if (trim) P.line(ctx, [[309.5, 488], [362, 488]], "trim", trim / (LEG * pad), "butt");
  });
}

function guardLeg(ctx, dx) {
  const hip = [42.5 + dx, 30], knee = [47.5 + dx, 38.5], ankle = [41.5 + dx, 49.5];
  P.beam(ctx, hip, knee, 4.2, "guardMetal");
  sideLegArmor(ctx, knee, ankle);
}

function farLeg(ctx) {
  ctx.save();
  ctx.filter = FAR_LEG.shade;
  guardLeg(ctx, FAR_LEG.dx);
  ctx.restore();
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

const FRONT_BROW = -32.5;

function frontHead(ctx) {
  squashAbove(ctx, FRONT_BROW, () => frontShell(ctx));
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
  if (!ENV.simple) for (const x of [-7.5, 7.5]) P.line(ctx, [[x, -28.4], [x, -20]], "shell0", 0.4, "butt");
  canopy(ctx, c => {
    c.moveTo(-12, FRONT_BROW);
    c.lineTo(-12, -44);
    c.lineTo(12, -44);
    c.lineTo(12, FRONT_BROW);
    c.quadraticCurveTo(0, FRONT_BROW - 1.5, -12, FRONT_BROW);
  }, -41, FRONT_BROW, [[-7, -37.2], [-2, -39.6], [4, -39.2]]);
  ctx.fillStyle = ENV.pal.groove;
  ctx.fillRect(-8, -32.5, 16, 1.1);
  slit(ctx, -8, 8, -31.4, 1.1, [[0, "visor0"], [0.25, "visor1"], [0.5, "visor3"], [0.75, "visor2"], [1, "visor0"]]);
  ctx.fillStyle = ENV.pal.band;
  ctx.fillRect(-8, -30.3, 16, 1);
  slit(ctx, -11, 11, -29.3, 0.9, [[0, "lip0"], [0.3, "lip1"], [0.45, "glint"], [0.55, "glint"], [0.7, "lip1"], [1, "lip0"]]);
  ctx.fillStyle = ENV.pal.shell0;
  ctx.fillRect(-11, -28.4, 22, 1.2);
  ctx.restore();
  P.line(ctx, [[-11, FRONT_BROW], [11, FRONT_BROW]], "gmLine", 0.5, "butt");
  for (const x of [-8, 8]) P.line(ctx, [[x, -32.5], [x, -29.3]], "gmLine", 0.4, "butt");

}

const GUN_BACK = 2;

function shoulder(ctx) {
  fillPath(ctx, c => {
    c.moveTo(35, 27);
    c.lineTo(40.5, 27);
    c.lineTo(21 + GUN_BACK + 22, 31);
    c.lineTo(36, 31);
    c.quadraticCurveTo(34.6, 29.2, 35, 27);
  }, grad(ctx, 35, 0, 45, 0, [[0, "gm1"], [0.6, "gm2"], [1, "gc1"]]));
}

function guardBody(ctx, fire) {
  farLeg(ctx);
  P.box(ctx, 26, 30, 14, 3, "guardMetal", 0);


  sideHead(ctx);

  guardLeg(ctx, 0);

  const g = GUN_BACK;
  P.box(ctx, 21 + g, 31, 22, 5.5, "guardMetal", 2);
  if (!ENV.simple) {
    for (const x of [26, 31, 36]) P.flat(ctx, x + g, 31, 0.8, 5.5, "gm0");
    P.line(ctx, [[22 + g, 32.2], [42 + g, 32.2]], "gm3", 0.5, "butt");
  }
  P.box(ctx, 20 + g, 31.5, 1.8, 4.5, "guardChrome", 2, { vertical: true });
  if (fire >= 0) flash(ctx, 20 + g, 33.7, -1, fire, 4.2);
  shoulder(ctx);
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

const FRONT_KNEE = 53.5 - 38.5;

function frontLeg(ctx, side) {
  const x = side * 7;
  P.poly(ctx, [[x - 3, -24], [x + 3, -24], [x + 2.6, -FRONT_KNEE + 0.5], [x - 2.6, -FRONT_KNEE + 0.5]], "guardMetal", 1, { dir: [1, 0] });
  inRigUnits(ctx, [x, 0], side * LEG, FRONT_KNEE / (744 - FRONT_LEG.shin[0][1]), [FRONT_LEG.axis, 744], () => {
    P.poly(ctx, FRONT_LEG.shin, "guardMetal", 2, { dir: [1, 0] });
    P.poly(ctx, FRONT_LEG.foot, "guardMetal", 1);
    P.poly(ctx, FRONT_LEG.toe, "guardChrome", 2);
  });
}

function frontGun(ctx, side, fire) {
  const x = side * 14;
  P.box(ctx, x - 3.5, -22.5, 7, 6.5, "guardMetal", 2);
  fillPath(ctx, c => {
    c.moveTo(side * 9.4, -25.4);
    c.lineTo(side * 11.4, -25.4);
    c.lineTo(x + side * 0.5, -22.5);
    c.lineTo(side * 10, -22.5);
    c.quadraticCurveTo(side * 9.2, -23.8, side * 9.4, -25.4);
  }, grad(ctx, side * 9.4, 0, x, 0, [[0, "gm1"], [0.6, "gm2"], [1, "gc1"]]));
  P.disc(ctx, x, -19.2, 2.1, "gm0", "gmLine");
  if (!ENV.simple) P.disc(ctx, x, -19.2, 1, "gc0");
  if (fire >= 0) burst(ctx, x, -19.2, 5, fire);
}

const GUARD_FRONT = {
  id: "guardFront",
  box: { x: -25, y: -50, w: 50, h: 50 },
  draw(ctx, state, t) {
    const fire = state === 1 ? fireFrame(t % 1.4) : -1;
    ctx.scale(GUARD_SIZE, GUARD_SIZE);
    frontLeg(ctx, -1);
    frontLeg(ctx, 1);
    frontHead(ctx);
    frontGun(ctx, -1, fire < 0 ? -1 : Math.max(0, fire - 2));
    frontGun(ctx, 1, fire);
  }
};

const GUARD_LEVELS = [["top", -38.5], ["visor", -32.5], ["hip", -23.5], ["knee", -FRONT_KNEE], ["foot", 0]].map(([name, y]) => [name, y * GUARD_SIZE]);

const TROOPER_ORIGIN = [24, 68];
const TROOPER_FIRE_LOOP = 1.2;
const TROOPER_TRIM = 0.9;

const TROOPER_HIP = [26, 47];
const TROOPER_RAISE = 23.5 * GUARD_SIZE - (68 - TROOPER_HIP[1]);

function trooperTail(ctx) {
  const spine = [[19, 46 - TROOPER_RAISE], [15, 44], [11, 51.5], [5, 57.5], [-3, 61.5]];
  spine.slice(1).forEach((b, i) => P.beam(ctx, spine[i], b, 5.2 - i * 1.1, "guardMetal"));
  P.poly(ctx, [[-2.5, 60.6], [-8, 63], [-2.5, 62.6]], "guardMetal", 2);
  if (!ENV.simple) spine.slice(1, 4).forEach(([x, y], i) => P.line(ctx, [[x - 1.6 + i * 0.3, y - 1.8 + i * 0.3], [x + 1.6 - i * 0.3, y + 1.8 - i * 0.3]], "gm0", 0.6, "butt"));
}

function inGuardLegUnits(ctx, draw) {
  ctx.save();
  ctx.translate(TROOPER_HIP[0], 68);
  ctx.scale(-GUARD_SIZE, GUARD_SIZE);
  ctx.translate(-42.5, -53.5);
  draw();
  ctx.restore();
}

const TROOPER_LEGS = {
  front: [[42.5, 30], [36, 39], [39.5, 49.5]],
  rear: [[45, 30], [52, 40], [59.5, 49.5]]
};

const along = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function across(a, b, t, half) {
  const [x, y] = along(a, b, t);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [nx, ny] = [(a[1] - b[1]) / len * half, (b[0] - a[0]) / len * half];
  return [[x - nx, y - ny], [x + nx, y + ny]];
}

function trooperLeg(ctx, [hip, knee, ankle]) {
  P.beam(ctx, hip, knee, 6.5, "guardMetal");
  const w = TROOPER_TRIM / GUARD_SIZE;
  sideLegArmor(ctx, knee, ankle, { forward: true, pad: 1.15, trim: w, padAt: along(knee, hip, 0.22) });
  P.line(ctx, across(hip, knee, 0.5, 3.25), "trim", w, "butt");
  P.line(ctx, across(knee, ankle, 0.55, (7 + 2.5 * 0.55) / 2), "trim", w, "butt");
}

function trooperLegs(ctx) {
  inGuardLegUnits(ctx, () => {
    ctx.save();
    ctx.filter = FAR_LEG.shade;
    trooperLeg(ctx, TROOPER_LEGS.rear);
    ctx.restore();
  });
  trooperTail(ctx);
  ctx.save();
  ctx.translate(0, -TROOPER_RAISE);
  fillPath(ctx, c => {
    c.moveTo(18, 42);
    c.lineTo(31, 42);
    c.quadraticCurveTo(34.5, 44, 33, 48);
    c.quadraticCurveTo(31, 51.5, 25, 51.5);
    c.quadraticCurveTo(18.5, 51.5, 17, 47.5);
    c.quadraticCurveTo(16, 43.5, 18, 42);
  }, grad(ctx, 16, 0, 34, 0, [[0, "gc0"], [0.4, "gc1"], [0.8, "gc2"], [1, "gc1"]]));
  P.line(ctx, [[16.8, 46], [33.4, 46]], "trim", TROOPER_TRIM, "butt");
  ctx.restore();
  inGuardLegUnits(ctx, () => trooperLeg(ctx, TROOPER_LEGS.front));
}

function trooperTorso(ctx) {
  for (const [x, y, len] of [[18, 24, 5.5], [15, 28, 6], [13, 33, 5]]) P.beam(ctx, [x, y], [x - len * 0.55, y - len * 0.8], 4.2, "guardMetal");
  P.poly(ctx, [[15, 25], [26, 21], [33, 26], [34, 34], [30, 42], [18, 43], [13, 35]], "flyerShell", 1, { dir: [1, 0] });
  P.poly(ctx, [[22, 23], [30, 24.5], [33.5, 30], [24, 31]], "guardMetal", 2);
  P.poly(ctx, [[24, 32], [33.6, 31], [33, 36], [25, 37]], "guardChrome", 1);
  P.poly(ctx, [[19, 38.5], [31.5, 38], [29.5, 42], [19, 42.5]], "guardMetal", 1);
  if (!ENV.simple) P.line(ctx, [[23, 24], [29, 25.2]], "gc2", 0.5);
}

const DOME = { at: [38.5, 20.4], tilt: 0.17, length: 26, r: 4.6 };

function trooperDome(ctx) {
  const { length: l, r } = DOME;
  ctx.save();
  ctx.translate(...DOME.at);
  ctx.rotate(DOME.tilt);
  fillPath(ctx, c => {
    c.moveTo(0, -r);
    c.lineTo(-l, -r);
    c.arc(-l, 0, r, -Math.PI / 2, Math.PI / 2, true);
    c.lineTo(0, r);
  }, grad(ctx, 0, -r, 0, r, [[0, "fc3"], [0.35, "fc2"], [0.75, "fc1"], [1, "fc0"]]), "gmLine");
  P.line(ctx, [[-3, -r + 1], [-l + 1, -r + 1]], "gc1", 0.6, "butt");
  if (!ENV.simple) {
    for (const x of [-9, -14, -19, -24]) P.line(ctx, [[x, -r + 0.4], [x, r * 0.55]], "fc0", 0.5, "butt");
    P.line(ctx, [[-4, 1.8], [-l, 1.8]], "fc0", 0.5, "butt");
    for (const x of [-11.5, -16.5, -21.5]) P.disc(ctx, x, 3, 0.6, "gc1");
  }
  P.line(ctx, [[-6, -r], [-6, r]], "trim", TROOPER_TRIM, "butt");
  ctx.restore();
}

function trooperHead(ctx) {
  P.poly(ctx, [[30, 27], [29, 22], [34, 21], [35, 26]], "guardMetal", 0);
  trooperDome(ctx);
  fillPath(ctx, c => {
    c.moveTo(34, 15.2);
    c.lineTo(40, 15.4);
    c.quadraticCurveTo(42.6, 16.4, 42.4, 17.6);
    c.lineTo(41.8, 19.4);
    c.quadraticCurveTo(43.8, 20.6, 43.2, 21.6);
    c.lineTo(41.8, 22);
    c.lineTo(42, 22.8);
    c.lineTo(35, 23);
    c.quadraticCurveTo(33.4, 19, 34, 15.2);
  }, grad(ctx, 34, 0, 43, 0, [[0, "gc0"], [0.45, "gc1"], [0.85, "gc2"], [1, "gc1"]]));
  fillPath(ctx, c => {
    c.moveTo(34.8, 17.9);
    c.lineTo(42.5, 17.7);
    c.lineTo(42.3, 18.6);
    c.lineTo(35, 18.8);
  }, grad(ctx, 34.8, 0, 42.5, 0, [[0, "visor0"], [0.35, "visor1"], [0.75, "visor2"], [0.92, "visor3"], [1, "visor1"]]), "gmLine");
  fillPath(ctx, c => {
    c.moveTo(33, 21.6);
    c.lineTo(36, 22.6);
    c.lineTo(42.5, 23);
    c.lineTo(44.8, 23.3);
    c.lineTo(44.8, 26.4);
    c.lineTo(42.6, 28.4);
    c.lineTo(36.5, 28.4);
    c.lineTo(33, 26.6);
  }, grad(ctx, 0, 22.6, 0, 28.4, [[0, "gc2"], [0.3, "gc1"], [0.7, "gm3"], [1, "gm1"]]));
  P.line(ctx, [[38, 23.2], [44.2, 23.5]], "gmLine", 0.6, "butt");
  if (!ENV.simple) {
    P.glow(ctx, 41, 18.3, 3.6, "visorGlow", 0.45);
    P.disc(ctx, 35.4, 24, 1.1, "gm1", "gmLine");
    P.line(ctx, [[37, 26.6], [43.2, 26.5]], "gm2", 0.5, "butt");
  }
}

const ARM_PX = GUN_PX * 1.35;
const ARM_SHOULDER = [28, 29];
const ARM_PIVOT = [300, 150];
const ARM_POSE = { arm: 0, fore: -72 };
const RIFLE_MUZZLE = [17.5, -2.1];
const ARM_PALETTE = keys => ({
  ...XBOT.PALETTE,
  a0: keys.gm0, a1: keys.gm2, a2: keys.gm3, a3: keys.gc1, aLine: keys.gmLine,
  m0: keys.gm0, m1: keys.gm1, m2: keys.gm2, m3: keys.gm3, mLine: keys.gmLine,
  c0: keys.gc0, c1: keys.gc1, c2: keys.gc2, c3: keys.gc3
});
const armNodes = {};

function findNode(node, name) {
  if (node.k !== "g") return null;
  if (node.name === name) return node;
  for (const kid of node.kids) {
    const hit = findNode(kid, name);
    if (hit) return hit;
  }
  return null;
}

const armNode = lod => (armNodes[lod] ||= findNode(XBOT.buildSide({ enemy: true, lod }), "arm"));

function rifle(ctx, fire) {
  P.box(ctx, -2, -3.6, 19, 3, "trooperGun", 2);
  P.box(ctx, 4, -5, 6, 1.4, "trooperGun", 1);
  P.box(ctx, -1, -0.6, 2.2, 3.6, "trooperGun", 1, { vertical: true });
  if (!ENV.simple) for (const x of [7, 11]) P.flat(ctx, x, -3.6, 0.6, 3, "tg0");
  if (fire >= 0) flash(ctx, RIFLE_MUZZLE[0], RIFLE_MUZZLE[1], 1, fire, 3.8);
}

function inArmUnits(ctx, draw) {
  ctx.save();
  ctx.translate(ARM_SHOULDER[0], ARM_SHOULDER[1]);
  ctx.scale(ARM_PX, ARM_PX);
  ctx.translate(-ARM_PIVOT[0], -ARM_PIVOT[1]);
  draw();
  ctx.restore();
}

function trooperArm(ctx, fire) {
  const t = ctx.getTransform();
  const lineW = P.lw(ctx) * Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
  const hand = c => {
    c.save();
    c.transform(0, 1, -1, 0, 0, 0);
    c.scale(1 / ARM_PX, 1 / ARM_PX);
    rifle(c, fire);
    c.restore();
  };
  inArmUnits(ctx, () => XBOT.render(ctx, armNode(ENV.simple), { pal: ARM_PALETTE(ENV.pal), pose: ARM_POSE, hooks: { hand }, lineW, simple: ENV.simple }));
  P.line(ctx, [[23.3, 28.6], [32.5, 28.6]], "trim", TROOPER_TRIM, "butt");
}

function trooperMuzzle() {
  const m = XBOT.locate(armNode(false), "hand", ARM_POSE);
  const p = m.transformPoint(new DOMPoint(-RIFLE_MUZZLE[1] / ARM_PX, RIFLE_MUZZLE[0] / ARM_PX));
  return [ARM_SHOULDER[0] + (p.x - ARM_PIVOT[0]) * ARM_PX, ARM_SHOULDER[1] + (p.y - ARM_PIVOT[1]) * ARM_PX - TROOPER_RAISE];
}

function trooperBody(ctx, fire) {
  ctx.translate(-TROOPER_ORIGIN[0], -TROOPER_ORIGIN[1]);
  trooperLegs(ctx);
  ctx.translate(0, -TROOPER_RAISE);
  trooperTorso(ctx);
  trooperHead(ctx);
  trooperArm(ctx, fire);
}

const TROOPER = {
  id: "trooper",
  box: { x: -29, y: -74, w: 72, h: 74 },
  draw(ctx, state, t) {
    if (state !== 2) return trooperBody(ctx, state === 1 ? fireFrame(t % TROOPER_FIRE_LOOP) : -1);
    const age = t % BLAST.loop;
    if (age < BLAST.hideBody) {
      ctx.save();
      trooperBody(ctx, -1);
      ctx.restore();
    }
    inBlastUnits(ctx, 0, 0, () => blast(ctx, age));
  }
};

ENV.define({
  id: "shootGuard",
  box: [-29, -74, 72, 74],
  anim: true,
  draw(ctx, state, t) {
    TROOPER.draw(ctx, state, t);
  }
});

ENV.define({
  id: "acidGuard",
  box: [-56, -56, 54, 56],
  anim: true,
  draw(ctx, state, t) {
    GUARD.draw(ctx, [0, 3, 1][state], t);
  }
});

ENV.define({
  id: "flyer",
  box: [-32, -10, 60, 20],
  anim: true,
  draw(ctx, state, t) {
    flyerBody(ctx, state, t);
  }
});

window.ENEMIES = {
  FLYER, GUARD, GUARD_FRONT, GUARD_LEVELS, TROOPER, FLYER_PALETTE, GUARD_PALETTE, TROOPER_PALETTE,
  BLAST, BLAST_PX, blast, scrap, inBlastUnits,
  FLYER_STATES: ["hover", "firing", "explode"],
  GUARD_STATES: ["idle", "firing", "acid (guess)", "wreck"],
  TROOPER_STATES: ["idle", "firing", "explode"],
  TROOPER_MUZZLE: trooperMuzzle()
};
})();
