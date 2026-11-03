(() => {
const { P, MAT } = window.ENV;
const { PI, sin, cos, max, min, hypot, atan2, acos } = Math;
const simple = () => window.ENV.simple;

const ROCKET_PALETTE = {
  rda0: "#6e5a3c", rda1: "#a8916a", rda2: "#d4c39e", rda3: "#f6eed8", rdaLine: "#2a2014",
  rdm0: "#17170f", rdm1: "#29291b", rdm2: "#40402c", rdm3: "#646446", rdmLine: "#080806",
  rdc0: "#5a4a3c", rdc1: "#8c7a68", rdc2: "#b8a894", rdc3: "#ece0d0",
  rdp0: "#4a1e0c", rdp1: "#8a3a14", rdp2: "#c05a20", rdp3: "#e8945a", rdpLine: "#1c0a04",
  rdHaz: "#e8c21a", rdHazDark: "#141008", rdTip: "#d8301c", rdVisor: "#ff2a1a", rdLens: "#9cff5a",
  rdChar: "#141010", rdEmber: "#ff7a28", rdSmoke: "#8a8478"
};

const CRAWLER_PALETTE = {
  crh0: "#2c3a32", crh1: "#4c5e52", crh2: "#76887a", crh3: "#b4c4b4", crhLine: "#0a100c",
  crl0: "#16201a", crl1: "#25342a", crl2: "#3a4c3e", crl3: "#5e7462", crlLine: "#060a08",
  crg0: "#202426", crg1: "#3a4044", crg2: "#5c6468", crg3: "#949ca0",
  crSlot: "#0c1210", crLight: "#e8b030", crLightHot: "#fff0a0", crEye: "#ff3a1e", crEyeGlow: "#ff7a50",
  crChar: "#0e0c0a", crArc: "#9ae6ff", crArcCore: "#ffffff", crSmoke: "#3a3632"
};

const FIRE = { fire0: "#b04010", fire1: "#e88a28", fire2: "#f8d070", fire3: "#ffffff" };

Object.assign(window.ENV.PALETTE, FIRE, ROCKET_PALETTE, CRAWLER_PALETTE);

Object.assign(MAT, {
  rdArmor: ["rda0", "rda1", "rda2", "rda3", "rdaLine"],
  rdMetal: ["rdm0", "rdm1", "rdm2", "rdm3", "rdmLine"],
  rdPod: ["rdp0", "rdp1", "rdp2", "rdp3", "rdpLine"],
  crHull: ["crh0", "crh1", "crh2", "crh3", "crhLine"],
  crLeg: ["crl0", "crl1", "crl2", "crl3", "crlLine"],
  crGun: ["crg0", "crg1", "crg2", "crg3", "crlLine"]
});

function ellipse(ctx, cx, cy, rx, ry, fill, line = null) {
  ctx.fillStyle = P.color(fill);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
  ctx.fill();
  if (line) P.stroke(ctx, line);
}

function lineScale(ctx) {
  const t = ctx.getTransform();
  return P.lw(ctx) * Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
}

function flame(ctx, x, base, w, h, t, seed = 0) {
  const f = 0.8 + sin(t * 11 + seed * 2.3) * 0.12 + sin(t * 17.3 + seed) * 0.08;
  const tip = h * f, lean = sin(t * 6 + seed) * w * 0.18;
  const pts = (k, s) => [[x - w * s / 2, base], [x - w * s * 0.4, base - tip * k * 0.45], [x + lean * k - w * s * 0.15, base - tip * k * 0.8], [x + lean * k, base - tip * k], [x + lean * k + w * s * 0.2, base - tip * k * 0.65], [x + w * s * 0.42, base - tip * k * 0.35], [x + w * s / 2, base]];
  P.shape(ctx, pts(1, 1), "fire0");
  P.shape(ctx, pts(0.75, 0.7), "fire1");
  P.shape(ctx, pts(0.45, 0.42), "fire2");
}

function smoke(ctx, x, y, t, { n = 4, h = 30, spread = 6, size = 1, color = "rdChar", alpha = 0.32 } = {}) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const k = (t * 0.4 + i / n) % 1;
    ctx.globalAlpha = alpha * (1 - k);
    ellipse(ctx, x + sin(t * 1.3 + i * 2) * 2 + k * spread, y - k * h, (2 + k * 6) * size, (1.6 + k * 4) * size, color);
  }
  ctx.restore();
}

const FIRE_TICKS = 9;
const TICK_HZ = 32;
const fireFrame = t => {
  const k = Math.floor(t * TICK_HZ);
  return k < FIRE_TICKS ? k : -1;
};

const RIG_H = window.XBOT.FOOT_Y - Object.fromEntries(window.XBOT.LEVELS).head;
const RIG_K = (1.9 * window.ENV.TILE) / RIG_H;
const TORSO_TILT = 30;
const DEG = PI / 180;

const RACK = { x0: -96, x1: 34, y0: -250, y1: 90, cells: 3, lid: 26 };
const DESIGNATOR = { muzzle: [104, -40], support: [30, -20] };
const VOLLEY = { settle: 0.2, fire: 0.3, reload: 1.6, count: 3, gap: 0.22, lost: 3.4, loop: 5 };
const ROCKET = { speed: 12, muzzle: [-0.3, 2.2], trail: 0.9, trailStep: 0.08, climb: 45 * DEG, turn: 320 * DEG, steerAt: 0.12, glide: 2.5, level: 1.2, step: 1 / 60, life: 10 };
const CLOSE = { cells: 6, climb: 85 * DEG, tighter: 1 };
const TARGET = { height: 1.9, width: 0.7, chest: 0.5, laser: 0.6 };
const BODY = { length: 0.4, radius: 0.035, nose: 0.1, fin: 0.07 };
const ROCKET_COLORS = { body: "#52683e", line: "#1c2614", nose: "#c4301c", fin: "#33452a", flame: "#ffd060", glow: "rgba(255,150,40,0.45)" };
const PUFF = { start: 0.04, grow: 0.22, rise: 0.15, alpha: 0.5, shade: [176, 170, 160] };
const LASER = { color: "#ff2a1a", width: 1, glow: 4, glowAlpha: 0.3 };
const BOOM_SCALE = 0.45;
const BLAST_UNITS = 147;

const legs = (near, far) => window.GAIT.legs(0, near, far);
const CARRY_ARM = { arm: -20, fore: -62 };
const STAND = legs([0, 2, -1.4], [0, 2, -1.4]);
const BRACE = legs([-34, 30, 4], [26, 0, -26]);
const WRECK = { ...legs([-84, 84, 2], [4, 92, -10]), body: { rot: 16, dy: 158 }, head: 30, arm: 14, fore: -24, armFar: 6, foreFar: -30 };
const FEET = ["heelNear", "toeNear", "heelFar", "toeFar"];
const droidRigs = {};
const farArms = {};
const designatorAt = { point: null };

function droidRig(lod) {
  return (droidRigs[lod] ||= window.XBOT.buildSide({ farLimbs: true, propBehindArm: true, enemy: true, lod }));
}

function farArm(lod) {
  if (farArms[lod]) return farArms[lod];
  const { locate, solve } = window.XBOT;
  const side = droidRig(lod);
  const [x, y] = DESIGNATOR.support;
  const grip = locate(side, "hand", CARRY_ARM).transformPoint(new DOMPoint(-y, x));
  const { armFar, foreFar } = solve(side, "handFar", CARRY_ARM, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], grip);
  return (farArms[lod] = { armFar, foreFar });
}

const carry = (pose, lod) => ({ ...pose, ...CARRY_ARM, ...farArm(lod) });

function lowest(node, pose, m) {
  if (node.k === "g") {
    let mm = node.m ? m.multiply(node.m) : m;
    const rot = node.name != null ? pose[node.name] : 0;
    if (rot) mm = mm.translate(node.pivot[0], node.pivot[1]).rotate(rot).translate(-node.pivot[0], -node.pivot[1]);
    return node.kids.reduce((y, kid) => max(y, lowest(kid, pose, mm)), -Infinity);
  }
  if (node.k === "part") return node.spec.pts.reduce((y, [px, py]) => max(y, m.b * px + m.d * py + m.f), -Infinity);
  if (node.k === "ellipse") return node.opacity <= 0.01 ? -Infinity : m.b * node.cx + m.d * node.cy + m.f + hypot(m.b * node.rx, m.d * node.ry);
  if (node.k === "trefoil") return m.f + node.r * hypot(m.b, m.d);
  return -Infinity;
}

const settleLift = (pose, lod) => window.XBOT.FOOT_Y - lowest(droidRig(lod), pose, new DOMMatrix());

function footLift(pose, lod) {
  const side = droidRig(lod);
  return window.XBOT.FOOT_Y - FEET.reduce((y, hook) => max(y, window.XBOT.locate(side, hook, pose).f), -Infinity);
}

const ease = k => k * k * (3 - 2 * k);

function mix(a, b, k) {
  const out = {};
  for (const n of new Set([...Object.keys(a), ...Object.keys(b)])) out[n] = (a[n] || 0) + ((b[n] || 0) - (a[n] || 0)) * k;
  return out;
}

function standLook() {
  const lod = simple();
  const pose = carry(STAND, lod);
  return { pose, lift: footLift(pose, lod) };
}

function volleyLook(t) {
  const lod = simple();
  const { settle, lost } = VOLLEY;
  const k = t < lost ? ease(min(1, t / settle)) : 1 - ease(min(1, (t - lost) / settle));
  const pose = carry(mix(STAND, BRACE, k), lod);
  return { pose, lift: t < lost + settle ? settleLift(pose, lod) : footLift(pose, lod), lase: t < lost };
}

function droidPal(pal) {
  return {
    ...window.XBOT.PALETTE,
    a0: pal.rda0, a1: pal.rda1, a2: pal.rda2, a3: pal.rda3, aLine: pal.rdaLine,
    m0: pal.rdm0, m1: pal.rdm1, m2: pal.rdm2, m3: pal.rdm3, mLine: pal.rdmLine,
    c0: pal.rdc0, c1: pal.rdc1, c2: pal.rdc2, c3: pal.rdc3,
    visor: pal.rdVisor, badge: pal.rdHaz, trefoil: pal.rdmLine
  };
}

function walkPose(t) {
  const { pose, drop } = window.GAIT.walkAt(t);
  return { pose: carry(pose, simple()), drop };
}

function cellX(i) {
  const { x0, x1, cells } = RACK;
  return x0 + ((i + 0.5) * (x1 - x0)) / cells;
}

function rackBody(ctx, open) {
  const { x0, x1, y0, y1, cells, lid } = RACK;
  const w = (x1 - x0) / cells;
  P.poly(ctx, [[x1 - 4, y0 + 70], [x1 + 36, y0 + 90], [x1 + 36, y0 + 150], [x1 - 4, y0 + 170]], "rdMetal", 1);
  P.poly(ctx, [[x1 - 4, y1 - 120], [x1 + 30, y1 - 100], [x1 + 30, y1 - 50], [x1 - 4, y1 - 30]], "rdMetal", 1);
  P.box(ctx, x0, y0, x1 - x0, y1 - y0, "rdPod", 2, { vertical: true });
  P.box(ctx, x0 - 10, y0 + 70, 14, 220, "rdMetal", 1, { vertical: true });
  for (let i = 1; i < cells; i++) P.line(ctx, [[x0 + i * w, y0], [x0 + i * w, y1 - 60]], "rdpLine", 3, "butt");
  P.box(ctx, x0 - 6, y1 - 60, x1 - x0 + 12, 60, "rdMetal", 1);
  ctx.save();
  P.path(ctx, [[x0, y0 + 150], [x1, y0 + 150], [x1, y0 + 190], [x0, y0 + 190]]);
  ctx.clip();
  P.hazard(ctx, x0, y0 + 150, x1 - x0, 40, 26, { fill: "rdHaz", dark: "rdHazDark", line: "rdpLine" });
  ctx.restore();
  for (let i = 0; i < cells; i++) {
    const cx = cellX(i);
    if (open) {
      P.poly(ctx, [[cx - w / 2 + 4, y0], [cx - w / 2 - 6, y0 - lid * 1.6], [cx - w / 2 + 4, y0 - lid * 1.8]], "rdMetal", 2);
      P.flat(ctx, cx - w / 2 + 6, y0 - 6, w - 12, 8, "rdChar");
    } else {
      P.poly(ctx, [[cx - w / 2 + 2, y0], [cx - w / 2 + 8, y0 - lid * 0.5], [cx + w / 2 - 8, y0 - lid * 0.5], [cx + w / 2 - 2, y0]], "rdMetal", 2);
      P.disc(ctx, cx, y0 - lid * 0.25, 6, "rdTip");
    }
  }
  if (!simple()) {
    for (const y of [y0 + 30, y0 + 110, y0 + 230]) P.line(ctx, [[x0 + 8, y], [x1 - 8, y]], "rdp0", 3, "butt");
    P.line(ctx, [[x0 + 10, y0 + 12], [x0 + 10, y1 - 70]], "rdp3", 4, "butt");
    for (const x of [x0 + 16, x1 - 16]) for (const y of [y0 + 16, y1 - 76]) P.disc(ctx, x, y, 5, "rdp0");
    for (let i = 0; i < 4; i++) P.flat(ctx, x0 + 14 + i * 28, y1 - 44, 18, 26, "rdChar");
    P.box(ctx, x1 - 30, y0 - 46, 14, 46, "rdMetal", 2, { vertical: true });
    P.disc(ctx, x1 - 23, y0 - 50, 9, "rdLens", "rdmLine");
    P.glow(ctx, x1 - 23, y0 - 50, 26, "rdLens", 0.35);
  }
}

function designator(ctx) {
  P.box(ctx, -10, -64, 112, 40, "rdMetal", 2);
  P.box(ctx, 10, -84, 54, 20, "rdPod", 2);
  P.flat(ctx, 96, -54, 10, 22, "rdVisor", "rdmLine");
}

function launchTimes() {
  const { fire, reload, count, gap, lost } = VOLLEY;
  const times = [];
  for (let i = 0; i < count; i++) for (let at = fire + i * gap; at < lost; at += reload) times.push(at);
  return times.sort((a, b) => a - b);
}

function aim(r, [x, y]) {
  const dx = x - r.x;
  return atan2(ROCKET.level * (y - r.y), Math.sign(dx || 1) * min(1, Math.abs(dx) / ROCKET.glide));
}

function aimLaunch(r, x) {
  r.aimed = true;
  const near = 1 - min(1, Math.abs(x - r.x) / CLOSE.cells);
  const climb = Math.abs(atan2(sin(r.heading), Math.abs(cos(r.heading))));
  const steep = climb + (CLOSE.climb - climb) * near;
  r.heading = x >= r.x ? -steep : PI + steep;
  r.turn *= 1 + CLOSE.tighter * near;
}

function steer(r, mark, dt) {
  if (!r.aimed) aimLaunch(r, mark[0]);
  if (r.age < ROCKET.steerAt && Math.abs(mark[0] - r.x) > CLOSE.cells) return;
  const want = aim(r, mark);
  const diff = atan2(sin(want - r.heading), cos(want - r.heading));
  r.heading += max(-r.turn * dt, min(r.turn * dt, diff));
}

const flights = new Map();

function flight(gap) {
  const known = flights.get(gap);
  if (known) return known;
  const dt = ROCKET.step;
  const mark = [gap, -TARGET.height * TARGET.chest];
  const r = { x: ROCKET.muzzle[0], y: -ROCKET.muzzle[1], heading: -ROCKET.climb, turn: ROCKET.turn, aimed: false, age: 0 };
  const path = [[r.x, r.y, r.heading]];
  const trail = [[r.x, r.y, 0]];
  while (r.age < ROCKET.life) {
    r.age += dt;
    steer(r, mark, dt);
    const [x, y] = [r.x, r.y];
    r.x += cos(r.heading) * ROCKET.speed * dt;
    r.y += sin(r.heading) * ROCKET.speed * dt;
    const last = trail[trail.length - 1];
    if (hypot(r.x - last[0], r.y - last[1]) >= ROCKET.trailStep) trail.push([r.x, r.y, r.age]);
    const hit = Math.abs(r.x - gap) <= TARGET.width / 2 && r.y <= 0 && r.y >= -TARGET.height;
    const wall = !hit && r.y >= 0;
    if (wall) [r.x, r.y] = [x, y];
    path.push([r.x, r.y, r.heading]);
    if (hit || wall) break;
  }
  const done = { path, trail, end: (path.length - 1) * dt };
  flights.set(gap, done);
  return done;
}

function headAt({ path }, age) {
  const i = min(path.length - 1, age / ROCKET.step);
  const a = path[Math.floor(i)], b = path[min(path.length - 1, Math.floor(i) + 1)];
  const k = i - Math.floor(i);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2]];
}

function rocketSmoke(ctx, f, age, toCanvas, cell) {
  const [red, green, blue] = PUFF.shade;
  for (const [x, y, born] of f.trail) {
    if (born > age) break;
    const k = (age - born) / ROCKET.trail;
    if (k >= 1) continue;
    const radius = (PUFF.start + PUFF.grow * k) * cell;
    const [cx, cy] = toCanvas(x, y - PUFF.rise * k);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, `rgba(${red},${green},${blue},${PUFF.alpha * (1 - k)})`);
    g.addColorStop(1, `rgba(${red},${green},${blue},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, PI * 2);
    ctx.fill();
  }
}

function rocketFins(ctx) {
  const { length, radius, fin } = BODY;
  ctx.fillStyle = ROCKET_COLORS.fin;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-length + fin, s * radius);
    ctx.lineTo(-length - fin * 0.4, s * (radius + fin));
    ctx.lineTo(-length, s * radius);
    ctx.fill();
    ctx.stroke();
  }
}

function rocketBody(ctx, [x, y], heading, age, cell) {
  const { length, radius, nose } = BODY;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  ctx.scale(cell, cell);
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
  rocketFins(ctx);
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

function laser(ctx, from, to, unit) {
  ctx.save();
  ctx.strokeStyle = LASER.color;
  ctx.lineCap = "round";
  ctx.globalAlpha = LASER.glowAlpha;
  ctx.lineWidth = LASER.glow * unit;
  ctx.beginPath();
  ctx.moveTo(...from);
  ctx.lineTo(...to);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = LASER.width * unit;
  ctx.stroke();
  ctx.restore();
}

function drawDroidVolley(ctx, { x, floor, facing, heroX, cell, t }) {
  const now = t % VOLLEY.loop;
  const unit = (TARGET.height * cell) / BLAST_UNITS;
  const toCanvas = (cx, cy) => [x + facing * cx * cell, floor + cy * cell];
  if (designatorAt.point && now < VOLLEY.lost) {
    const from = ctx.getTransform().inverse().transformPoint(designatorAt.point);
    laser(ctx, [from.x, from.y], [heroX, floor - TARGET.height * TARGET.laser * cell], unit);
  }
  const f = flight(Math.abs(heroX - x) / cell);
  for (const at of launchTimes()) {
    const age = now - at;
    if (age < 0) continue;
    rocketSmoke(ctx, f, age, toCanvas, cell);
    if (age < f.end) {
      const [hx, hy, heading] = headAt(f, age);
      rocketBody(ctx, toCanvas(hx, hy), facing > 0 ? heading : PI - heading, age, cell);
      continue;
    }
    const ended = age - f.end;
    if (ended >= BLAST.fade[1]) continue;
    const [bx, by] = toCanvas(...headAt(f, f.end));
    const u = unit * BOOM_SCALE;
    ctx.save();
    ctx.translate(bx, by - BLAST.center * u);
    ctx.scale(u, u);
    window.ENEMIES.blast(ctx, ended, 1);
    ctx.restore();
  }
}

function drawRocketDroidRig(ctx, { t, pal, lineW = 1, lod = false }) {
  const asset = { draw: c => {
    c.scale(1 / RIG_K, 1 / RIG_K);
    c.translate(window.XBOT.SIDE_AX * RIG_K, window.XBOT.FOOT_Y * RIG_K);
    droidFigure(c, { pose: walkPose(t).pose });
  } };
  window.ENV.draw(ctx, asset, { palette: pal, lines: lineW, lod });
}

function droidFigure(ctx, { pose, lift = 0, lase = false, shadeBy = null, wreck = false }) {
  const lod = simple();
  const root = droidRig(lod);
  const { render, FOOT_Y, SIDE_AX, shade } = window.XBOT;
  let pal = droidPal(window.ENV.pal);
  if (shadeBy) pal = shade(pal, shadeBy);
  ctx.save();
  ctx.scale(RIG_K, RIG_K);
  ctx.translate(-SIDE_AX, -FOOT_Y + lift);
  const lineW = lineScale(ctx) * (lod ? window.XBOT.GAME_LINE : 1.4);
  const back = c => {
    c.save();
    c.rotate(-TORSO_TILT * PI / 180);
    rackBody(c, false);
    c.restore();
  };
  const hand = c => {
    c.save();
    c.transform(0, 1, -1, 0, 0, 0);
    designator(c);
    if (lase) designatorAt.point = c.getTransform().transformPoint(new DOMPoint(...DESIGNATOR.muzzle));
    c.restore();
  };
  const hooks = wreck ? {} : { back, hand };
  if (shadeBy) P.inShade(shadeBy, () => render(ctx, root, { pal, pose, hooks, lineW, simple: lod }));
  else render(ctx, root, { pal, pose, hooks, lineW, simple: lod });
  ctx.restore();
}

function droidWreck(ctx, t) {
  const charred = { brightness: 0.4, saturate: 0.4 };
  P.shape(ctx, [[-20, 0], [-14, -2.4], [-4, -3.4], [8, -2.6], [22, -1.6], [26, 0]], "rdChar");
  ctx.save();
  ctx.translate(-12, -1);
  ctx.rotate(-0.12);
  ctx.scale(RIG_K * 0.9, RIG_K * 0.9);
  ctx.rotate(-PI / 2);
  ctx.translate(-RACK.x0, -RACK.y1 + 60);
  P.inShade(charred, () => rackBody(ctx, true));
  ctx.restore();
  ctx.save();
  ctx.translate(2, 0);
  droidFigure(ctx, { pose: WRECK, shadeBy: charred, wreck: true });
  ctx.restore();
  if (!simple()) {
    for (const [x, y] of [[-2, -24], [4, -16], [-8, -12], [-16, -6]]) P.glow(ctx, x, y, 7, "rdEmber", 0.35 + 0.15 * sin(t * 7 + x));
  }
  flame(ctx, -2, -14, 9, 14, t, 1);
  flame(ctx, 6, -10, 7, 11, t, 2);
  flame(ctx, -16, -5, 7, 10, t, 3);
  flame(ctx, -9, -6, 6, 8, t, 4);
  if (!simple()) smoke(ctx, 0, -26, t, { n: 4, h: 30, spread: 8, size: 1.2 });
}

const BLAST = window.ENEMIES.BLAST;

const ROCKET_DROID = {
  id: "rocketDroid",
  box: { x: -16, y: -50, w: 40, h: 50 },
  draw(ctx, state, t) {
    designatorAt.point = null;
    if (state === 0) return droidFigure(ctx, standLook());
    if (state === 1) {
      const { pose, drop } = walkPose(t);
      ctx.translate(0, drop * RIG_K);
      return droidFigure(ctx, { pose });
    }
    if (state === 2) return droidFigure(ctx, volleyLook(t % VOLLEY.loop));
    if (state === 4) return droidWreck(ctx, t);
    const age = t % BLAST.loop;
    if (age < BLAST.hideBody) droidFigure(ctx, volleyLook(VOLLEY.settle));
    else droidWreck(ctx, t);
    window.ENEMIES.inBlastUnits(ctx, 0, 0, () => window.ENEMIES.blast(ctx, age));
  }
};

const CR = {
  hip: [-3, -15.5], thigh: 9.5, shin: 11, far: { dx: 3.4, shade: { brightness: 0.62, saturate: 0.8 } },
  stride: 4.6, lift: 3.2, period: 0.8, stance: 0.62, bob: 0.7, muzzle: [24.5, -14.6], loop: 1.3
};

function ik(hip, foot, l1, l2) {
  const dx = foot[0] - hip[0], dy = foot[1] - hip[1];
  const d = min(l1 + l2 - 0.01, max(Math.abs(l1 - l2) + 0.01, hypot(dx, dy)));
  const base = atan2(dy, dx);
  const a = acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const ang = base - a;
  return [hip[0] + cos(ang) * l1, hip[1] + sin(ang) * l1];
}

function stepFoot(ph) {
  const { stride: s, lift, stance } = CR;
  if (ph < stance) return [s - (2 * s * ph) / stance, 0];
  const u = (ph - stance) / (1 - stance);
  return [-s + 2 * s * (u * u * (3 - 2 * u)), -lift * sin(PI * u)];
}

function crawlerLeg(ctx, hip, foot) {
  const knee = ik(hip, [foot[0] - 1.6, foot[1] - 3], CR.thigh, CR.shin);
  const ankle = [foot[0] - 1.6, foot[1] - 3];
  P.beam(ctx, hip, knee, 4.4, "crLeg");
  if (!simple()) P.line(ctx, [[hip[0] - 2.6, hip[1] + 1.4], along(knee, ankle, 0.45)], "crg2", 1.1, "butt");
  P.beam(ctx, knee, ankle, 3.2, "crLeg");
  P.poly(ctx, [[ankle[0] - 3.6, foot[1] - 1.6], [ankle[0] - 1.4, ankle[1] - 0.8], [ankle[0] + 2.8, ankle[1] + 0.4], [ankle[0] + 6.4, foot[1] - 0.8], [ankle[0] + 7.2, foot[1]], [ankle[0] - 4.2, foot[1]]], "crLeg", 1);
  P.poly(ctx, [[ankle[0] + 4.6, foot[1] - 1.4], [ankle[0] + 8.6, foot[1] - 0.2], [ankle[0] + 7.2, foot[1]], [ankle[0] + 4.2, foot[1]]], "crGun", 2);
  P.disc(ctx, knee[0], knee[1], 2.6, "crh1", "crhLine");
  if (!simple()) P.disc(ctx, knee[0], knee[1], 1.1, "crg3");
  P.disc(ctx, ankle[0], ankle[1], 1.5, "crg1", "crlLine");
}

const along = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function hullPath(c) {
  c.moveTo(-17, -20);
  c.bezierCurveTo(-17.5, -27, -10, -32.5, 2, -32.6);
  c.bezierCurveTo(13, -32.6, 22, -27, 25.5, -20.4);
  c.quadraticCurveTo(26.4, -18.6, 24.6, -17.8);
  c.bezierCurveTo(16, -15.4, 4, -14.2, -6, -14.6);
  c.quadraticCurveTo(-15.6, -15.2, -17, -20);
}

function hullFill(ctx, hot) {
  const g = ctx.createLinearGradient(0, -33, 0, -14);
  const pal = window.ENV.pal;
  if (simple()) {
    g.addColorStop(0, pal.crh3); g.addColorStop(0.18, pal.crh3); g.addColorStop(0.18, pal.crh2);
    g.addColorStop(0.62, pal.crh2); g.addColorStop(0.62, pal.crh1); g.addColorStop(1, pal.crh1);
  } else {
    g.addColorStop(0, pal.crh3); g.addColorStop(0.2, pal.crh2); g.addColorStop(0.6, pal.crh1); g.addColorStop(1, pal.crh0);
  }
  ctx.fillStyle = hot ? pal.crh3 : g;
}

function crawlerHull(ctx, t, fire) {
  P.poly(ctx, [[-14, -19], [-4, -15.6], [8, -15], [6, -11.6], [-8, -11.6], [-13.4, -14]], "crLeg", 1);
  P.box(ctx, 14, -17.4, 8, 4.2, "crGun", 1);
  for (const y of [-16.6, -14.6]) P.box(ctx, 21.6, y - 0.6, 3.2, 1.2, "crGun", 2);
  ctx.beginPath();
  hullPath(ctx);
  ctx.closePath();
  hullFill(ctx, false);
  ctx.fill();
  P.stroke(ctx, "crHull");
  ctx.save();
  ctx.beginPath();
  hullPath(ctx);
  ctx.clip();
  P.shape(ctx, [[-18, -17.6], [26, -21.6], [26, -10], [-18, -10]], "crh0");
  if (!simple()) {
    P.curve(ctx, [[-9, -29.6], [2, -31.6], [14, -30]], "crh3", 0.8);
    for (const x of [-8.5, 5.8]) P.line(ctx, [[x, -32], [x + 1.6, -15]], "crh0", 0.5, "butt");
    P.line(ctx, [[-17, -21.4], [24, -24]], "crh0", 0.5, "butt");
    for (const x of [-12, -1, 10, 19]) P.disc(ctx, x, -19.4, 0.45, "crh3");
  }
  ctx.restore();
  P.poly(ctx, [[-14, -28.6], [-11, -33.6], [-4, -34.4], [-2.4, -32.2]], "crHull", 1);
  P.poly(ctx, [[-4.6, -30], [10.8, -30.6], [11.4, -27.6], [-4.2, -27]], "crSlot", 0, { line: true });
  P.stroke(ctx, "crhLine");
  const blink = Math.floor(t * 6) % 5;
  for (let i = 0; i < 5; i++) {
    const hot = fire >= 0 || i === blink;
    P.flat(ctx, -3 + i * 2.8, -29.4, 1.6, 1.6, hot ? "crLightHot" : "crLight");
  }
  P.poly(ctx, [[18.6, -24], [23.4, -22.6], [24.2, -21], [19.6, -21.4]], "crSlot", 0);
  P.flat(ctx, 21, -22.6, 2.2, 1, "crEye");
  if (!simple()) P.glow(ctx, 22, -22, 4, "crEyeGlow", 0.5);
  if (fire >= 0) muzzleBurst(ctx, CR.muzzle[0], CR.muzzle[1], fire);
}

function muzzleBurst(ctx, x, y, k) {
  const heat = k === 0 ? 1 : max(0, 1 - (k % 3) / 3) * (k < 8 ? 1 : 0);
  if (heat <= 0) return;
  const s = 3.4;
  if (!simple()) P.glow(ctx, x + s, y, s * 3.2 * heat, "fire1", 0.6 * heat);
  for (const dy of [-1, 1]) {
    const yy = y + dy * 1;
    P.shape(ctx, [[x, yy - s * 0.55], [x + s * (2 + heat * 1.6), yy], [x, yy + s * 0.55]], "fire0");
    P.shape(ctx, [[x, yy - s * 0.32], [x + s * (1.4 + heat), yy], [x, yy + s * 0.32]], "fire2");
  }
  ellipse(ctx, x + 0.8, y, s * 0.5 * heat + 0.3, s * 0.7 * heat + 0.3, "fire3");
}

function crawlerBody(ctx, state, t) {
  const walking = state === 1;
  const fire = state === 2 ? fireFrame(t % CR.loop) : -1;
  const ph = (t / CR.period) % 1;
  const feet = walking ? [stepFoot(ph), stepFoot((ph + 0.5) % 1)] : [[2.2, 0], [-1.8, 0]];
  const bob = walking ? -CR.bob * Math.abs(sin(ph * PI * 2)) : -0.35 * (1 + sin(t * 2.2));
  const recoil = fire >= 0 && fire < 4 ? -0.6 * (1 - fire / 4) : 0;
  const hipNear = [CR.hip[0] + recoil, CR.hip[1] + bob];
  const hipFar = [hipNear[0] + CR.far.dx, hipNear[1]];
  P.inShade(CR.far.shade, () => crawlerLeg(ctx, hipFar, [feet[1][0] + CR.far.dx, feet[1][1]]));
  ctx.save();
  ctx.translate(recoil, bob);
  crawlerHull(ctx, t, fire);
  ctx.restore();
  crawlerLeg(ctx, hipNear, feet[0]);
  P.disc(ctx, hipNear[0], hipNear[1], 3, "crh1", "crhLine");
  if (!simple()) P.disc(ctx, hipNear[0], hipNear[1], 1.2, "crg2");
}

function arc(ctx, x0, y0, x1, y1, t, seed) {
  const r = P.rng(seed + Math.floor(t * 18) * 7);
  const pts = [[x0, y0]];
  for (let i = 1; i < 6; i++) pts.push([x0 + (x1 - x0) * i / 6 + (r() - 0.5) * 3, y0 + (y1 - y0) * i / 6 + (r() - 0.5) * 3]);
  pts.push([x1, y1]);
  P.line(ctx, pts, "crArc", 1.1);
  P.line(ctx, pts, "crArcCore", 0.45);
}

function crawlerWreck(ctx, t) {
  P.inShade({ brightness: 0.55, saturate: 0.6 }, () => {
    const hip = [-3, -13.5];
    P.inShade(CR.far.shade, () => crawlerLeg(ctx, [hip[0] + CR.far.dx, hip[1]], [1.6, 0]));
    ctx.save();
    ctx.translate(0, 2.4);
    ctx.rotate(0.06);
    ctx.beginPath();
    ctx.rect(-30, -21, 60, 20);
    ctx.clip();
    crawlerHull(ctx, 0, -1);
    ctx.restore();
    crawlerLeg(ctx, hip, [3.2, 0]);
  });
  const rim = [[-17, -18.6], [-14, -22.6], [-10, -19.8], [-6, -24.4], [-2, -20.6], [2, -23.2], [6, -19.4], [10, -22.8], [14, -19.6], [18, -21.6], [24, -17.6]];
  P.shape(ctx, [...rim, [24, -15.6], [-17, -16.4]], "crChar");
  if (!simple()) {
    for (const [x, y] of [[-6, -23], [6, -21]]) P.glow(ctx, x, y, 3, "rdEmber", 0.4 + 0.2 * sin(t * 9 + x));
  }
  P.poly(ctx, [[-28, 0], [-26, -3.4], [-19, -4.4], [-15, -1.6], [-16, 0]], "crHull", 1);
  P.poly(ctx, [[26, 0], [27.5, -2.2], [32, -2.6], [33, 0]], "crHull", 0);
  const live = (t % 1.6) < 1.1;
  if (live) {
    arc(ctx, -6, -22, -12, -30, t, 1);
    arc(ctx, 8, -20, 14, -27, t, 2);
    if (!simple()) arc(ctx, 18, -18, 22, -8, t, 3);
  }
  if (!simple()) smoke(ctx, 2, -24, t, { n: 4, h: 24, spread: 6, size: 0.9, color: "crSmoke", alpha: 0.4 });
}

const CRAWLER_BLAST = 0.78;
const CRAWLER_SIZE = 0.8;

const CRAWLER = {
  id: "crawler",
  box: { x: -17, y: -30, w: 40, h: 30 },
  draw(ctx, state, t) {
    ctx.scale(CRAWLER_SIZE, CRAWLER_SIZE);
    if (state <= 2) return crawlerBody(ctx, state, t);
    if (state === 4) return crawlerWreck(ctx, t);
    const age = t % BLAST.loop;
    if (age < BLAST.hideBody) crawlerBody(ctx, 0, t);
    else crawlerWreck(ctx, t);
    ctx.save();
    ctx.translate(3, -10);
    ctx.scale(CRAWLER_BLAST, CRAWLER_BLAST);
    window.ENEMIES.inBlastUnits(ctx, 0, 0, () => window.ENEMIES.blast(ctx, age));
    ctx.restore();
  }
};

window.ENV.define({ id: "rocketDroid", box: [-24, -50, 48, 50], anim: true, draw: (ctx, state, t) => ROCKET_DROID.draw(ctx, state, t) });
window.ENV.define({ id: "crawler", box: [-30, -35, 64, 35], anim: true, draw: (ctx, state, t) => CRAWLER.draw(ctx, state, t) });

Object.assign(window.ENEMIES, {
  ROCKET_DROID, CRAWLER, ROCKET_PALETTE, CRAWLER_PALETTE,
  ROCKET_DROID_STATES: ["idle", "walk", "firing", "explode", "wreck"],
  CRAWLER_STATES: ["idle", "walk", "firing", "explode", "wreck"],
  ROCKET_LOOP: VOLLEY.loop,
  drawRocketDroidRig,
  drawDroidVolley,
  CRAWLER_SPEED: ((2 * CR.stride) / (CR.stance * CR.period)) * CRAWLER_SIZE
});
})();
