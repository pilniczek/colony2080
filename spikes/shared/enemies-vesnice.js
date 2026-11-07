window.ENEMIES = window.ENEMIES || {};
(() => {
const { P, MAT } = window.ENV;
const { buildSide, render, locate, solve, shade, FOOT_Y, SIDE_AX, GAME_LINE } = window.XBOT;
const { legs, walkAt } = window.GAIT;
const { PI, sin, cos, max, min } = Math;
const simple = () => window.ENV.simple;

const ROCKET_PALETTE = {
  rrA0: "#163049", rrA1: "#2c5c82", rrA2: "#5890b8", rrA3: "#a6d4ec", rrLine: "#060f18",
  rrM0: "#10181f", rrM1: "#1f2b36", rrM2: "#364654", rrM3: "#627688",
  rrC0: "#465560", rrC1: "#8698a4", rrC2: "#b8c8d0", rrC3: "#eef6fa",
  rrT0: "#1c2614", rrT1: "#33452a", rrT2: "#52683e", rrT3: "#869c60",
  rrWarn: "#e8b020", rrWarhead: "#c4301c", rrVisor: "#ffb020", rrVisorGlow: "#ffd870",
  rrSmoke0: "#d6d2c8", rrSmoke1: "#8e8a82", rrChar: "#16120e", rrEmber: "#ff6a1c",
  vFire0: "#b04010", vFire1: "#e88a28", vFire2: "#f8d070", vFire3: "#ffffff"
};

const GREY_PALETTE = {
  gtA0: "#2a2e32", gtA1: "#4c5258", gtA2: "#7a8288", gtA3: "#c2c8cc", gtLine: "#0b0d0e",
  gtM0: "#191b17", gtM1: "#2b2f29", gtM2: "#43483f", gtM3: "#6a7062",
  gtC0: "#585c5e", gtC1: "#989c9e", gtC2: "#c6cacc", gtC3: "#f2f4f4",
  gtG0: "#1c1e20", gtG1: "#323639", gtG2: "#4e5256", gtG3: "#7a7e82",
  gtMark: "#e0701e", gtVisor: "#ff3a20", gtVisorGlow: "#ff8a60", gtBrass: "#d8a840",
  vFire0: "#b04010", vFire1: "#e88a28", vFire2: "#f8d070", vFire3: "#ffffff"
};

Object.assign(ENV.PALETTE, ROCKET_PALETTE, GREY_PALETTE);

Object.assign(MAT, {
  rrArmor: ["rrA0", "rrA1", "rrA2", "rrA3", "rrLine"],
  rrMetal: ["rrM0", "rrM1", "rrM2", "rrM3", "rrLine"],
  rrTube: ["rrT0", "rrT1", "rrT2", "rrT3", "rrLine"],
  gtArmor: ["gtA0", "gtA1", "gtA2", "gtA3", "gtLine"],
  gtSuit: ["gtM0", "gtM1", "gtM2", "gtM3", "gtLine"],
  gtGun: ["gtG0", "gtG1", "gtG2", "gtG3", "gtLine"]
});

const rigPals = new WeakMap();

function rigPalette(pal, p) {
  let byKind = rigPals.get(pal);
  if (!byKind) rigPals.set(pal, byKind = {});
  return byKind[p] ||= {
    ...XBOT.PALETTE,
    a0: pal[p + "A0"], a1: pal[p + "A1"], a2: pal[p + "A2"], a3: pal[p + "A3"], aLine: pal[p + "Line"],
    m0: pal[p + "M0"], m1: pal[p + "M1"], m2: pal[p + "M2"], m3: pal[p + "M3"], mLine: pal[p + "Line"],
    c0: pal[p + "C0"], c1: pal[p + "C1"], c2: pal[p + "C2"], c3: pal[p + "C3"],
    visor: pal[p + "Visor"], badge: pal[p + "A2"], trefoil: pal[p + "Line"]
  };
}

function find(node, name) {
  if (node.name === name) return node;
  for (const kid of node.kids || []) {
    const hit = find(kid, name);
    if (hit) return hit;
  }
  return null;
}

function makeRig(lod) {
  const root = buildSide({ farLimbs: true, propBehindArm: true, enemy: true, lod });
  const add = (node, name) => node.kids.push({ k: "hook", name });
  add(find(root, "head"), "helmet");
  add(find(root, "arm"), "pauldron");
  for (const side of ["Near", "Far"]) add(find(root, "knee" + side), "knee" + side + "At");
  return { root, torsoX: find(root, "chest").m.a };
}

const unit = ctx => {
  const t = ctx.getTransform();
  return Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
};

function fromBack(ctx, sx) {
  ctx.rotate(-PI / 6);
  ctx.scale(sx, 1);
  ctx.translate(-218, -170);
  ctx.translate(SIDE_AX, 0);
  ctx.scale(1 / sx, 1);
  ctx.translate(-SIDE_AX, 0);
}

function grounded(root, pose) {
  const ys = ["Near", "Far"].flatMap(side => ["heel", "toe"].map(h => locate(root, h + side, pose).f));
  for (const h of ["kneeNearAt", "kneeFarAt"]) ys.push(locate(root, h, pose).transformPoint(new DOMPoint(316, 528)).y);
  const b = typeof pose.body === "object" ? pose.body : { rot: pose.body || 0 };
  return { ...pose, body: { ...b, dy: (b.dy || 0) + FOOT_Y - max(...ys) } };
}

const HERO_H = 1.9 * ENV.TILE;
const RIG_PX = HERO_H / (FOOT_Y - 2);

function figure(ctx, { rig, pose, pal, hooks, drop = 0 }) {
  ctx.save();
  ctx.scale(RIG_PX, RIG_PX);
  ctx.translate(-SIDE_AX, drop - FOOT_Y);
  const lineW = P.lw(ctx) * unit(ctx) * (simple() ? GAME_LINE : 1.4);
  render(ctx, rig.root, { pal, pose, hooks, lineW, simple: simple() });
  ctx.restore();
}

const rgba = (c, a) => {
  const n = parseInt(P.color(c).slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

const jitter = i => {
  const v = sin(i * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

function puff(ctx, x, y, r, c, alpha) {
  if (alpha <= 0 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, alpha));
  g.addColorStop(0.4, rgba(c, alpha * 0.75));
  g.addColorStop(0.75, rgba(c, alpha * 0.25));
  g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, PI * 2);
  ctx.fill();
}

function flash(ctx, x, y, dir, k, size) {
  if (k < 0) return;
  const heat = k === 0 ? 1 : max(0, 1 - k / 5);
  if (heat <= 0) return;
  const len = size * (1.4 + heat * 1.2);
  if (!simple()) P.glow(ctx, x + dir * len * 0.4, y, size * 2.4 * heat, "vFire1", 0.6 * heat);
  P.shape(ctx, [[x, y - size * 0.8], [x + dir * len * 0.55, y - size * 0.9], [x + dir * len, y], [x + dir * len * 0.55, y + size * 0.9], [x, y + size * 0.8]], "vFire0");
  P.shape(ctx, [[x, y - size * 0.5], [x + dir * len * 0.75, y], [x, y + size * 0.5]], "vFire1");
  P.shape(ctx, [[x, y - size * 0.3], [x + dir * len * 0.45, y], [x, y + size * 0.3]], heat > 0.5 ? "vFire3" : "vFire2");
}

function flame(ctx, x, base, w, h, t, seed = 0) {
  const f = 0.85 + sin(t * 11 + seed * 2.3) * 0.09 + sin(t * 17.3 + seed) * 0.07;
  const tip = h * f, lean = sin(t * 6 + seed) * w * 0.15;
  const pts = (k, s) => [[x - w * s / 2, base], [x - w * s / 2 + w * 0.06, base - tip * k * 0.45], [x + lean * k - w * s * 0.2, base - tip * k * 0.75], [x + lean * k, base - tip * k], [x + lean * k + w * s * 0.22, base - tip * k * 0.68], [x + w * s / 2 - w * 0.05, base - tip * k * 0.4], [x + w * s / 2, base]];
  P.shape(ctx, pts(1, 1), "vFire0");
  P.shape(ctx, pts(0.75, 0.7), "vFire1");
  P.shape(ctx, pts(0.5, 0.42), "vFire2");
  if (!simple()) P.shape(ctx, pts(0.28, 0.2), "vFire3");
}

function smokeColumn(ctx, x, y, t, n, h, c = "rrSmoke1") {
  for (let i = 0; i < n; i++) {
    const k = (t * 0.35 + i / n) % 1;
    const size = 0.7 + 0.6 * jitter(i + Math.floor(t * 0.35 + i / n) * n);
    puff(ctx, x + sin(t * 1.3 + i * 2) * 2 + k * 8, y - k * h, (4 + k * 10) * size, c, 0.4 * (1 - k) * min(1, k * 6));
  }
}

const BLAST_HIDE = () => ENEMIES.BLAST.hideBody;

function exploding(ctx, t, body, wreck) {
  const age = t % ENEMIES.BLAST.loop;
  if (age < BLAST_HIDE()) body();
  else wreck();
  ENEMIES.inBlastUnits(ctx, 0, 0, () => ENEMIES.blast(ctx, age));
}

const RR = { drop: 48, launch: [566, 62] };
const RR_TUNE = window.C28_CONFIG.enemies.rocketRobot.rocket;
const RR_SHOT = { settle: RR_TUNE.kneelMs / 1000, fire: RR_TUNE.fireMs / 1000, reload: RR_TUNE.reloadMs / 1000, empty: RR_TUNE.emptyMs / 1000, seen: 2.4, loop: 4 };
const RR_STAND = { body: 0, hipNear: 0, kneeNear: 2, ankleNear: -1.4, hipFar: 0, kneeFar: 2, ankleFar: -1.4 };
const RR_KNEEL = { body: 0, hipNear: -76, kneeNear: 84, ankleNear: 0, hipFar: 12, kneeFar: 78, ankleFar: 0 };
const RR_SLUMP = { ...legs(14, [-66, 92, -4], [22, 96, -80]), chest: 16, head: 38, arm: 18, fore: -30, armFar: 6, foreFar: -40 };
const RR_GRIP = { near: [394, 112], far: [478, 106] };
const ROCKET = { length: 0.4, radius: 0.035, nose: 0.1, speed: RR_TUNE.speed, range: RR_TUNE.range, trailStep: 0.08, trailLife: RR_TUNE.trailMs / 1000, boom: 0.45 };
const ROCKET_COLORS = { body: "#52683e", line: "#1c2614", nose: "#c4301c", flame: "#ffd060", glow: "rgba(255,150,40,0.45)" };
const PUFF = { start: 0.04, grow: 0.22, rise: 0.15, alpha: 0.5, shade: [176, 170, 160] };
const rrRigs = {};

const ease = k => k * k * (3 - 2 * k);
const mixPose = (a, b, k) => Object.fromEntries(Object.keys(a).map(j => [j, a[j] + (b[j] - a[j]) * k]));

function backAt(rig, pose, pt) {
  return locate(rig.root, "back", pose).rotate(-30).scale(rig.torsoX, 1).translate(-218, -170).translate(SIDE_AX, 0).scale(1 / rig.torsoX, 1).translate(-SIDE_AX, RR.drop).transformPoint(new DOMPoint(...pt));
}

function rrRig() {
  const lod = simple();
  if (rrRigs[lod]) return rrRigs[lod];
  const rig = makeRig(lod);
  const near = solve(rig.root, "hand", {}, ["arm", "fore"], [[-170, 40], [-160, 30]], backAt(rig, {}, RR_GRIP.near));
  const carry = { arm: near.arm, fore: near.fore };
  const far = solve(rig.root, "handFar", carry, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], backAt(rig, carry, RR_GRIP.far));
  rig.carry = { ...carry, armFar: far.armFar, foreFar: far.foreFar };
  const kneel = grounded(rig.root, { ...RR_KNEEL, ...rig.carry });
  const p = backAt(rig, kneel, RR.launch);
  rig.launch = [(p.x - SIDE_AX) * RIG_PX, (p.y - FOOT_Y) * RIG_PX];
  return (rrRigs[lod] = rig);
}

function launcher(ctx, loaded) {
  P.poly(ctx, [[108, 22], [152, 32], [152, 92], [108, 102]], "rrTube", 1);
  P.box(ctx, 150, 32, 362, 60, "rrTube", 2);
  if (!simple()) P.flat(ctx, 160, 40, 340, 4, "rrT3");
  P.box(ctx, 230, 27, 30, 70, "rrMetal", 1);
  P.box(ctx, 412, 27, 16, 70, "rrMetal", 1);
  P.flat(ctx, 444, 33, 14, 58, "rrWarn");
  P.box(ctx, 500, 24, 34, 76, "rrMetal", 2);
  P.box(ctx, 372, 2, 60, 24, "rrMetal", 2);
  P.flat(ctx, 426, 7, 8, 14, "rrVisor");
  P.box(ctx, 384, 90, 24, 46, "rrMetal", 1);
  P.box(ctx, 470, 90, 18, 34, "rrMetal", 1);
  if (loaded) P.shape(ctx, [[532, 40], [554, 48], [566, 62], [554, 76], [532, 84]], "rrWarhead", "rrLine");
}

const rrLoaded = fire => fire === null || fire < RR_SHOT.fire || (fire - RR_SHOT.fire) % RR_SHOT.reload > RR_SHOT.empty;

function smoke(ctx, trail, age) {
  const cell = ENV.TILE;
  const [red, green, blue] = PUFF.shade;
  for (const [x, y, born] of trail) {
    const k = (age - born) / ROCKET.trailLife;
    if (k >= 1) continue;
    const radius = (PUFF.start + PUFF.grow * k) * cell;
    const cy = y - PUFF.rise * k * cell;
    const g = ctx.createRadialGradient(x, cy, 0, x, cy, radius);
    g.addColorStop(0, `rgba(${red},${green},${blue},${PUFF.alpha * (1 - k)})`);
    g.addColorStop(1, `rgba(${red},${green},${blue},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, cy, radius, 0, PI * 2);
    ctx.fill();
  }
}

function missile(ctx, x, y, age) {
  const { length, radius, nose } = ROCKET;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(ENV.TILE, ENV.TILE);
  ctx.lineWidth = 0.015;
  ctx.strokeStyle = ROCKET_COLORS.line;
  ctx.fillStyle = ROCKET_COLORS.glow;
  ctx.beginPath();
  ctx.arc(-length, 0, radius * 3, 0, PI * 2);
  ctx.fill();
  ctx.fillStyle = ROCKET_COLORS.flame;
  ctx.beginPath();
  ctx.moveTo(-length, -radius * 0.7);
  ctx.lineTo(-length - radius * (4 + sin(age * 60)), 0);
  ctx.lineTo(-length, radius * 0.7);
  ctx.fill();
  ctx.fillStyle = ROCKET_COLORS.body;
  ctx.fillRect(-length, -radius, length - nose, radius * 2);
  ctx.strokeRect(-length, -radius, length - nose, radius * 2);
  ctx.fillStyle = ROCKET_COLORS.nose;
  ctx.beginPath();
  ctx.moveTo(-nose, -radius);
  ctx.lineTo(0, 0);
  ctx.lineTo(-nose, radius);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function rocketFlight(ctx, [x0, y], age, target) {
  const cell = ENV.TILE;
  const speed = ROCKET.speed * cell;
  const end = target == null ? ROCKET.range * cell : max(0, target - x0 - 0.35 * cell);
  const flight = end / speed;
  const flown = min(age, flight) * speed;
  const step = ROCKET.trailStep * cell;
  const trail = [[x0, y, 0]];
  for (let d = step; d <= flown; d += step) trail.push([x0 + d, y, d / speed]);
  smoke(ctx, trail, age);
  if (age < flight) return missile(ctx, x0 + flown, y, age);
  const ended = age - flight;
  if (ended >= ENEMIES.BLAST.fade[1]) return;
  const s = ENEMIES.BLAST_PX * ROCKET.boom;
  ctx.save();
  ctx.translate(x0 + flown, y - ENEMIES.BLAST.center * s);
  ctx.scale(s, s);
  ENEMIES.blast(ctx, ended, 1);
  ctx.restore();
}

function rrHooks({ aim = false, fire = null, char = false } = {}) {
  const rig = rrRig();
  const wrap = draw => c => {
    if (char) P.inShade({ brightness: 0.4, saturate: 0.35 }, () => draw(c));
    else draw(c);
  };
  return {
    back: wrap(c => {
      fromBack(c, rig.torsoX);
      P.box(c, 150, 128, 84, 180, "rrMetal", 1);
      for (const x of [156, 180, 204]) {
        P.box(c, x, 112, 22, 30, "rrTube", 2);
        P.shape(c, [[x, 112], [x + 11, 92], [x + 22, 112]], "rrWarhead", "rrLine");
      }
      P.box(c, 146, 200, 92, 16, "rrMetal", 0);
      if (char) return;
      c.translate(0, RR.drop);
      launcher(c, rrLoaded(fire));
    }),
    helmet: wrap(c => {
      P.poly(c, [[270, 44], [276, 16], [300, 2], [356, 0], [384, 10], [398, 32], [398, 48], [270, 54]], "rrArmor", 2);
      P.poly(c, [[350, 46], [402, 46], [402, 72], [350, 70]], "rrMetal", 1);
      P.flat(c, 362, 53, 40, 9, char ? "rrChar" : "rrVisor");
      if (!simple() && !char) P.glow(c, 396, 57, aim ? 70 : 40, "rrVisorGlow", aim ? 0.6 : 0.35);
      P.disc(c, 316, 70, 18, "rrM2", "rrLine");
      P.disc(c, 316, 70, 8, char ? "rrChar" : "rrA3");
      P.poly(c, [[296, 96], [390, 90], [398, 108], [300, 114]], "rrArmor", 1);
    }),
    pauldron: wrap(c => {
      P.poly(c, [[232, 132], [244, 98], [296, 80], [350, 86], [380, 112], [388, 150], [370, 156], [356, 128], [300, 116], [254, 126], [246, 162], [230, 160]], "rrArmor", 3);
      P.poly(c, [[300, 92], [348, 96], [342, 108], [300, 104]], "rrWarn", 2, { line: false });
    })
  };
}

function rrDraw(ctx, pose, opts = {}) {
  const rig = rrRig();
  const pal = rigPalette(ENV.pal, "rr");
  figure(ctx, { rig, pose: opts.drop == null ? grounded(rig.root, pose) : pose, pal: opts.char ? shade(pal, { brightness: 0.4, saturate: 0.35 }) : pal, hooks: rrHooks(opts), drop: opts.drop || 0 });
}

function rrStand(ctx) {
  rrDraw(ctx, { ...RR_STAND, ...rrRig().carry });
}

function rrWalk(ctx, t) {
  const { pose, drop } = walkAt(t);
  rrDraw(ctx, { ...pose, ...rrRig().carry }, { drop });
}

function rrAttack(ctx, t, target) {
  const u = t % RR_SHOT.loop;
  const seen = u < RR_SHOT.seen;
  const k = seen ? ease(min(1, u / RR_SHOT.settle)) : 1 - ease(min(1, (u - RR_SHOT.seen) / RR_SHOT.settle));
  const rig = rrRig();
  rrDraw(ctx, { ...mixPose(RR_STAND, RR_KNEEL, k), ...rig.carry }, { aim: seen, fire: seen ? u : null });
  for (let s = RR_SHOT.fire; s < RR_SHOT.seen; s += RR_SHOT.reload) if (u >= s) rocketFlight(ctx, rig.launch, u - s, target);
}

function rrLauncherDown(ctx) {
  ctx.save();
  ctx.translate(16, -1.6);
  ctx.scale(0.06, 0.06);
  ctx.rotate(0.08);
  ctx.translate(-330, -96);
  P.inShade({ brightness: 0.5, saturate: 0.4 }, () => launcher(ctx, false));
  ctx.restore();
}

function rrWreck(ctx, t) {
  rrLauncherDown(ctx);
  const rig = rrRig();
  const pose = grounded(rig.root, RR_SLUMP);
  rrDraw(ctx, RR_SLUMP, { char: true });
  const at = (hook, x, y) => {
    const p = locate(rig.root, hook, pose).transformPoint(new DOMPoint(x, y));
    return [(p.x - SIDE_AX) * RIG_PX, (p.y - FOOT_Y) * RIG_PX];
  };
  const [cx, cy] = at("pauldron", 300, 260);
  const [bx, by] = at("back", 0, 0);
  const [hx, hy] = at("helmet", 330, 40);
  if (!simple()) {
    P.glow(ctx, cx, cy, 14, "rrEmber", 0.5);
    for (const [dx, dy] of [[-3, -2], [2, 1], [-1, 3]]) P.flat(ctx, cx + dx, cy + dy, 2.4, 0.8, "rrEmber");
  }
  flame(ctx, bx, by + 3, 6, 12, t, 1);
  flame(ctx, cx, cy + 2, 5, 8, t, 2.6);
  flame(ctx, hx, hy + 2, 4, 6, t, 4.1);
  flame(ctx, 17, -1.5, 3, 4.5, t, 5.3);
  smokeColumn(ctx, bx, by - 12, t, simple() ? 2 : 4, 26);
}

const ROCKET_ROBOT = {
  id: "rocketRobot",
  box: [-30, -54, 70, 54],
  anim: true,
  draw(ctx, state, t, shot) {
    if (state === 0) return rrStand(ctx);
    if (state === 1) return rrWalk(ctx, t);
    if (state === 2) return rrAttack(ctx, t, shot?.target);
    if (state === 3) return exploding(ctx, t, () => rrDraw(ctx, { ...RR_KNEEL, ...rrRig().carry }, { fire: RR_SHOT.fire }), () => rrWreck(ctx, t));
    rrWreck(ctx, t);
  }
};

const GT = { muzzle: [328, -52], support: [150, -24] };
const GT_BURST = { shots: 9, gap: 0.035, frames: 3, flash: 40, casingLife: 0.35, attack: 0.28, pause: 0.4 };
const GT_STAND = RR_STAND;
const GT_CARRY = { arm: 0, fore: -72 };
const gtRigs = {};
let gtRifle = null;

const gtRifleParts = () => [
  { name: "stockPad", x: -124, y: -72, w: 14, h: 46, mat: "m", tone: 0 },
  { name: "stock", x: -112, y: -66, w: 78, h: 34, mat: "m", tone: 1 },
  { name: "grip", x: -14, y: -30, w: 26, h: 56, mat: "m", tone: 0 },
  { name: "receiver", x: -44, y: -80, w: 156, h: 52, mat: "m", tone: 2 },
  { name: "mark", x: 60, y: -80, w: 14, h: 52, mat: "a", tone: 1 },
  { name: "mag", x: 26, y: -32, w: 52, h: 58, mat: "m", tone: 1 },
  { name: "rail", x: -4, y: -98, w: 70, h: 18, mat: "c", tone: 1 },
  { name: "shroud", x: 112, y: -76, w: 124, h: 44, mat: "m", tone: 1 },
  { name: "vent1", x: 132, y: -68, w: 12, h: 28, mat: "c", tone: 0 },
  { name: "vent2", x: 160, y: -68, w: 12, h: 28, mat: "c", tone: 0 },
  { name: "vent3", x: 188, y: -68, w: 12, h: 28, mat: "c", tone: 0 },
  { name: "barrel", x: 236, y: -62, w: 70, h: 18, mat: "c", tone: 1 },
  { name: "brake", x: 300, y: -70, w: 28, h: 34, mat: "m", tone: 0 }
];

function gtRig() {
  const lod = simple();
  if (gtRigs[lod]) return gtRigs[lod];
  gtRifle ||= GUN.model({
    buildParts: gtRifleParts,
    mat: { m: ["gtG0", "gtG1", "gtG2", "gtG3", "gtLine"], c: ["gtC0", "gtC1", "gtC2", "gtC3", "gtLine"], a: ["vFire0", "gtMark", "gtMark", "vFire2", "gtLine"] }
  });
  const rig = makeRig(lod);
  const arms = base => {
    const carry = { ...base, ...GT_CARRY };
    const grip = GUN.toHook(GT.support);
    const far = solve(rig.root, "handFar", carry, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], locate(rig.root, "hand", carry).transformPoint(new DOMPoint(...grip)));
    return { ...GT_CARRY, ...far };
  };
  rig.stand = arms(GT_STAND);
  return (gtRigs[lod] = rig);
}

function casings(ctx, fire) {
  for (let i = 0; i < GT_BURST.shots; i++) {
    const a = fire - i * GT_BURST.gap;
    if (a < 0 || a > GT_BURST.casingLife) continue;
    const x = 40 - a * 500, y = -100 - a * 700 + a * a * 4200;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a * 30);
    P.flat(ctx, -8, -4, 16, 8, "gtBrass");
    ctx.restore();
  }
}

function gtBurst(ctx, fire) {
  casings(ctx, fire);
  const shot = Math.floor(fire / GT_BURST.gap);
  if (shot >= GT_BURST.shots) return;
  flash(ctx, GT.muzzle[0], GT.muzzle[1], 1, Math.floor(((fire - shot * GT_BURST.gap) / GT_BURST.gap) * GT_BURST.frames), GT_BURST.flash);
}

function gtHooks({ fire = null } = {}) {
  const rig = gtRig();
  return {
    back: c => {
      fromBack(c, rig.torsoX);
      P.box(c, 150, 120, 80, 150, "gtGun", 1);
      P.box(c, 138, 150, 24, 96, "gtGun", 2, { vertical: true });
      P.flat(c, 160, 132, 60, 10, "gtMark");
      if (!simple()) for (const y of [180, 204, 228]) P.flat(c, 166, y, 50, 6, "gtG0");
      P.disc(c, 190, 284, 28, "gtG2", "gtLine");
      P.disc(c, 190, 284, 10, "gtG0");
    },
    helmet: c => {
      P.poly(c, [[262, 108], [256, 44], [270, 12], [312, -6], [362, -4], [396, 14], [412, 44], [412, 82], [262, 96]], "gtArmor", 2, { dir: [1, 0] });
      P.poly(c, [[300, -2], [362, 0], [398, 18], [404, 32], [300, 26]], "gtArmor", 3, { line: false });
      P.box(c, 360, 48, 54, 18, "gtSuit", 0);
      P.flat(c, 370, 53, 44, 7, "gtVisor");
      if (!simple()) P.glow(c, 408, 56, 46, "gtVisorGlow", 0.4);
      P.box(c, 372, 76, 42, 38, "gtSuit", 1);
      if (!simple()) for (const y of [84, 94, 104]) P.flat(c, 380, y, 30, 4, "gtM0");
      P.disc(c, 306, 62, 16, "gtA1", "gtLine");
      P.flat(c, 300, 56, 12, 12, "gtMark");
    },
    pauldron: c => {
      P.poly(c, [[222, 196], [220, 130], [244, 100], [298, 86], [352, 92], [386, 120], [394, 176], [376, 184], [300, 174], [244, 190]], "gtArmor", 2);
      P.poly(c, [[236, 112], [298, 98], [350, 104], [378, 126], [300, 120], [240, 132]], "gtArmor", 3, { line: false });
      P.poly(c, [[222, 196], [244, 190], [300, 174], [376, 184], [376, 194], [300, 186], [244, 202], [224, 206]], "gtMark", 2);
    },
    hand: c => {
      c.save();
      c.transform(0, 1, -1, 0, 0, 0);
      const lineW = P.lw(c) * unit(c) * (simple() ? GAME_LINE : 1.4);
      gtRifle.draw(c, { pal: ENV.pal, lineW, simple: simple() });
      if (fire !== null) gtBurst(c, fire);
      c.restore();
    }
  };
}

function gtDraw(ctx, pose, opts) {
  const rig = gtRig();
  figure(ctx, { rig, pose: opts?.drop == null ? grounded(rig.root, pose) : pose, pal: rigPalette(ENV.pal, "gt"), hooks: gtHooks(opts), drop: opts?.drop || 0 });
}

function gtStand(ctx) {
  gtDraw(ctx, { ...GT_STAND, ...gtRig().stand });
}

function gtWalk(ctx, t) {
  const { pose, drop } = walkAt(t);
  gtDraw(ctx, { ...pose, ...gtRig().stand }, { drop });
}

function gtFire(ctx, t) {
  const u = t % (GT_BURST.attack + GT_BURST.pause);
  gtDraw(ctx, { ...GT_STAND, ...gtRig().stand }, { fire: u < GT_BURST.attack ? u : null });
}

function gtScrap(ctx, t) {
  P.shape(ctx, [[-26, 0], [-23, -4], [-16, -6], [-9, -9], [0, -9], [9, -11], [18, -8], [26, -4], [29, 0]], "gtA0", "gtLine");
  P.curve(ctx, [[-8, -8], [-11, -13], [-7, -16]], "gtLine", 1.6);
  P.curve(ctx, [[-8, -8], [-11, -13], [-7, -16]], "gtM2", 0.9);
  P.curve(ctx, [[-4, -9], [-3, -14], [1, -15]], "gtLine", 1.4);
  P.curve(ctx, [[-4, -9], [-3, -14], [1, -15]], "gtMark", 0.7);
  P.poly(ctx, [[-22, 0], [-23, -5], [-18, -10], [-9, -12], [-4, -9], [-6, 0]], "gtArmor", 1, { dir: [1, 0] });
  for (const y of [-6, -3.5]) P.flat(ctx, -20, y, 9, 0.9, "gtA0");
  P.poly(ctx, [[2, -1], [19, -3.5], [20, -8], [3, -6.5]], "gtArmor", 2);
  P.box(ctx, 18, -7.5, 7, 7.5, "gtGun", 1);
  P.poly(ctx, [[-6, -8.5], [3, -12.5], [10, -10.5], [8, -7], [-3, -6]], "gtArmor", 3);
  P.poly(ctx, [[-6, -8.5], [-3, -6], [-2.2, -6.6], [-4.8, -9.1]], "gtMark", 2, { line: false });
  ctx.save();
  ctx.translate(-27, -1.2);
  ctx.rotate(-0.06);
  ctx.scale(0.055, 0.055);
  ctx.translate(124, 26);
  gtRifle?.draw(ctx, { pal: ENV.pal, lineW: P.lw(ctx) * unit(ctx), simple: simple() });
  ctx.restore();
  P.poly(ctx, [[9, -9], [10, -14], [14, -16.5], [19, -15.5], [21, -11], [19, -8]], "gtArmor", 2, { dir: [1, 0] });
  P.flat(ctx, 16.5, -13.5, 4.5, 1.2, "gtM0");
  const blink = sin(t * 9) * sin(t * 2.3) > 0.55;
  if (blink) P.flat(ctx, 17.5, -13.5, 3, 1.2, "gtVisor");
  if (!simple()) {
    P.flat(ctx, -15, -9.5, 4, 0.7, "gtA3");
    P.flat(ctx, 5, -11.5, 3, 0.6, "gtA3");
    if (blink) P.glow(ctx, 20, -13, 4, "gtVisorGlow", 0.5);
    const k = (t * 1.7) % 1;
    if (k < 0.15) for (let i = 0; i < 4; i++) P.line(ctx, [[-7, -16], [-7 + cos(i * 1.7) * (2 + k * 14), -16 + sin(i * 1.7) * (2 + k * 14) - 1]], "vFire2", 0.35);
  }
  smokeColumn(ctx, -12, -12, t, simple() ? 1 : 3, 22, "gtA2");
}

function gtWreck(ctx, t) {
  gtRig();
  gtScrap(ctx, t);
}

const GREY_TROOPER = {
  id: "greyTrooper",
  box: [-30, -54, 64, 54],
  anim: true,
  draw(ctx, state, t) {
    if (state === 0) return gtStand(ctx);
    if (state === 1) return gtWalk(ctx, t);
    if (state === 2) return gtFire(ctx, t);
    if (state === 3) return exploding(ctx, t, () => gtStand(ctx), () => gtWreck(ctx, t));
    gtWreck(ctx, t);
  }
};

Object.assign(window.ENEMIES, {
  ROCKET_ROBOT, GREY_TROOPER, ROCKET_PALETTE, GREY_PALETTE,
  ROCKET_STATES: ["idle", "walk", "firing", "explode", "wreck"],
  GREY_STATES: ["idle", "walk", "firing", "explode", "wreck"]
});
})();
