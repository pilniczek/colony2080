const { buildSide, buildFront, buildBack, render, locate, shade, SIDE_AX, AX, FOOT_Y, PALETTE: P } = window.XBOT;
const side = buildSide({ farLimbs: true, propBehindArm: true, lod: true });
const front = buildFront({ lod: true, rightArmFirst: true, propBehindArm: true });
const back = buildBack({ lod: true });
const climber = buildBack({ lod: true, thumbsBehind: true, forearmsUnder: true });
const ROOTS = { side, front, back, climber };
let WEAPON = "fists";
try { WEAPON = localStorage.getItem("xbotWeapon") || "fists"; } catch {}
const armed = () => WEAPON === "gun";
const W = 360, H = 250, FLOOR = 228, K = 0.2;
const D = Math.PI / 180;
let LINE = 1;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = k => k * k * (3 - 2 * k);
const easeIn = k => k * k;
const easeOut = k => 1 - (1 - k) * (1 - k);
const span = (t, a, b) => clamp((t - a) / (b - a));

function keyed(keys, t, fn = ease) {
  if (t <= keys[0][0]) return { ...keys[0][1] };
  for (let i = 1; i < keys.length; i++) {
    const [t1, p1] = keys[i];
    if (t > t1) continue;
    const [t0, p0] = keys[i - 1];
    const k = fn((t - t0) / (t1 - t0));
    const out = {};
    for (const n of new Set([...Object.keys(p0), ...Object.keys(p1)])) out[n] = (p0[n] || 0) + ((p1[n] || 0) - (p0[n] || 0)) * k;
    return out;
  }
  return { ...keys[keys.length - 1][1] };
}
const num = (keys, t, fn) => keyed(keys.map(([a, v]) => [a, { v }]), t, fn).v;
const mix = (a, b, k) => {
  const out = {};
  for (const n of new Set([...Object.keys(a), ...Object.keys(b)])) out[n] = (a[n] || 0) + ((b[n] || 0) - (a[n] || 0)) * k;
  return out;
};

function legs(body, near, far) {
  const leg = ([hip, knee, ankle], s) => ({ ["hip" + s]: hip - body, ["knee" + s]: knee, ["ankle" + s]: ankle ?? -(hip + knee) * 0.7 });
  return { body, ...leg(near, "Near"), ...leg(far, "Far") };
}

const STAND = legs(0, [0, 2], [0, 2]);
const GUARD = { arm: -38, fore: -92, armFar: -30, foreFar: -96 };
const CROUCH = { ...legs(18, [-62, 112, -50], [-48, 120, -72]), arm: -10, fore: -40, armFar: -4, foreFar: -40 };

const TAU = Math.PI * 2;
const LEG = { hipY: 344, farX: -24, thigh: 178, shin: 178, ankleY: 700, heel: 80 };
const RUN = {
  cycle: 0.66, speed: 300, stance: 0.34, reach: 0.36, heelStrike: -6, flat: [0.15, 0.55], toeOff: 44,
  drop: 4, bob: 2.4, lean: 12, leanPulse: 1.5, arm: 34, armPhase: 0.8, fore: -78,
  swing: [
    [0.5, { hip: 24, knee: 78, foot: 80 }],
    [0.62, { hip: -6, knee: 112, foot: 94 }],
    [0.76, { hip: -48, knee: 98, foot: 38 }],
    [0.9, { hip: -36, knee: 42, foot: -4 }]
  ]
};
const WALK = {
  cycle: 1.1, speed: 110, stance: 0.6, reach: 0.5, heelStrike: -14, flat: [0.18, 0.6], toeOff: 30,
  drop: 3, bob: -2.6, lean: 0, leanPulse: 0, arm: 16, armPhase: 0.97, fore: -6,
  swing: [
    [0.7, { hip: 0, knee: 58, foot: 22 }],
    [0.82, { hip: -24, knee: 46, foot: -6 }]
  ],
  landing: { lead: 0.1, rise: 20 }
};

const cycle = p => ((p / TAU) % 1 + 1) % 1;
const stepPhase = u => (u * 2) % 1;
const lowPhase = g => (2 * g.stance * g.reach) % 1;
const gaitBob = (g, p) => g.drop + g.bob * Math.cos(TAU * (stepPhase(cycle(p)) - lowPhase(g)));
const gaitLean = (g, u) => g.lean + g.leanPulse * Math.cos(TAU * (stepPhase(u) - g.stance * 2));

function stanceFoot(g, s) {
  const [flat0, flat1] = g.flat;
  if (s < flat0) return g.heelStrike * (1 - s / flat0) ** 2;
  if (s < flat1) return 0;
  return g.toeOff * ((s - flat1) / (1 - flat1)) ** 2;
}

function legIK(dx, dy) {
  const { thigh: a, shin: b } = LEG;
  const d = Math.min(Math.hypot(dx, dy), a + b);
  const knee = Math.acos(clamp((d * d - a * a - b * b) / (2 * a * b), -1, 1));
  const hip = Math.atan2(-dx, dy) - Math.atan2(b * Math.sin(knee), a + b * Math.cos(knee));
  return { hip: hip / D, knee: knee / D };
}

function stanceLeg(g, u, hipX, rise = 0) {
  const s = u / g.stance, foot = stanceFoot(g, s), r = foot * D, b = gaitLean(g, u) * D;
  const ground = FOOT_Y - gaitBob(g, u * TAU) / K - rise, h = FOOT_Y - LEG.ankleY;
  const sweep = g.speed * g.stance * g.cycle / K;
  const flat = sweep * (g.reach - s);
  const lever = foot < 0 ? LEG.heel : -LEG.heel;
  const ox = lever * Math.cos(r) + h * Math.sin(r), oy = lever * Math.sin(r) - h * Math.cos(r);
  return { ...legIK(hipX * (1 - Math.cos(b)) + flat - lever + ox, ground + oy - LEG.hipY - hipX * Math.sin(b)), foot };
}

const swingCache = new Map();
function swingKeys(g, hipX) {
  const id = JSON.stringify([g, hipX]);
  if (!swingCache.has(id)) {
    const e = 1e-4, rate = (u0, u1) => {
      const [p, q] = [stanceLeg(g, u0, hipX), stanceLeg(g, u1, hipX)];
      return Object.fromEntries(Object.keys(p).map(n => [n, (q[n] - p[n]) / (u1 - u0)]));
    };
    const approach = g.landing ? [[1 - g.landing.lead, stanceLeg(g, -g.landing.lead, hipX, g.landing.rise)]] : [];
    const keys = [[g.stance, stanceLeg(g, g.stance, hipX), rate(g.stance - e, g.stance)], ...g.swing.map(([t, v]) => [t, v]), ...approach, [1, stanceLeg(g, 0, hipX), rate(0, e)]];
    for (let i = 1; i < keys.length - 1; i++) {
      const [[t0, v0], [t2, v2]] = [keys[i - 1], keys[i + 1]];
      keys[i][2] = Object.fromEntries(Object.keys(v0).map(n => [n, (v2[n] - v0[n]) / (t2 - t0)]));
    }
    swingCache.set(id, keys);
  }
  return swingCache.get(id);
}

function swingLeg(g, u, hipX) {
  const keys = swingKeys(g, hipX);
  let i = 0;
  while (u > keys[i + 1][0]) i++;
  const [t0, p0, m0] = keys[i], [t1, p1, m1] = keys[i + 1];
  const w = t1 - t0, k = (u - t0) / w, k2 = k * k, k3 = k2 * k;
  const out = {};
  for (const n in p0) out[n] = (2 * k3 - 3 * k2 + 1) * p0[n] + (k3 - 2 * k2 + k) * w * m0[n] + (-2 * k3 + 3 * k2) * p1[n] + (k3 - k2) * w * m1[n];
  return out;
}

function gaitPose(g, p) {
  const u = cycle(p);
  const leg = (v, hipX) => {
    const { hip, knee, foot } = v < g.stance ? stanceLeg(g, v, hipX) : swingLeg(g, v, hipX);
    return [hip, knee, foot - hip - knee];
  };
  const swing = g.arm * Math.cos(TAU * (u - g.armPhase));
  return { ...legs(gaitLean(g, u), leg(u, 0), leg((u + 0.5) % 1, LEG.farX)), arm: swing, armFar: -swing, fore: g.fore, foreFar: g.fore };
}

const walkPose = p => gaitPose(WALK, p);
const walkBob = p => gaitBob(WALK, p);
const runPose = p => gaitPose(RUN, p);
const runBob = p => gaitBob(RUN, p);

function footMax(pose) {
  let m = -Infinity;
  for (const h of ["heelNear", "toeNear", "heelFar", "toeFar"]) m = Math.max(m, locate(side, h, pose).transformPoint(new DOMPoint(0, 0)).y);
  return m;
}
const lift = pose => (FOOT_Y - footMax(pose)) * K;

function handAt(pose, x, y, local = [0, 0], hook = "hand") {
  const pt = locate(side, hook, pose).transformPoint(new DOMPoint(local[0], local[1]));
  return [x + (pt.x - SIDE_AX) * K, y + (pt.y - FOOT_Y) * K];
}

const { CARRY, CARRY_FAR, FRONT_CARRY, FRONT_CARRY_R, FRONT_BARREL } = GUN.holdPoses(side, front);

function carry(pose) {
  const b = pose.body || 0;
  return { ...pose, arm: CARRY.arm - b, fore: CARRY.fore, armFar: CARRY_FAR.armFar - b, foreFar: CARRY_FAR.foreFar };
}

const slungGun = (c, pal) => GUN.slung(c, { pal, lineW: LINE, simple: true });

function bot(c, { view = "side", x, y, pose = {}, hooks = {}, rot = 0, flip = false, tint = null, hold = true }) {
  let after = null;
  if (armed() && hold) {
    if (view === "side") { pose = carry(pose); hooks = { ...hooks, hand: gun }; }
    else if (view === "front") { pose = { ...pose, ...FRONT_CARRY, ...FRONT_CARRY_R }; hooks = { ...hooks, handL: frontGun }; }
    else after = slungGun;
  }
  c.save();
  c.translate(x, y);
  if (rot) c.rotate(rot * D);
  c.scale(K * (flip ? -1 : 1), K);
  c.translate(view === "side" ? -SIDE_AX : -AX, -FOOT_Y);
  const pal = tint ? shade(P, tint) : P;
  render(c, ROOTS[view], { pal, pose, hooks, lineW: LINE, simple: true });
  if (after) after(c, pal);
  c.restore();
}

const LIE = -89;
const FLAT_BACK = { ...legs(0, [0, 2, 90], [0, 2, 90]), arm: 0, armFar: 0, fore: 0, foreFar: 0 };
const bottoms = new Map();
function bottom(pose, rot, hold = false) {
  const key = JSON.stringify([pose, rot, hold && WEAPON]);
  if (!bottoms.has(key)) {
    const n = 400, cv = document.createElement("canvas");
    cv.width = cv.height = n;
    const c = cv.getContext("2d", { willReadFrequently: true });
    bot(c, { x: n / 2, y: n / 2, pose, rot, hold });
    const d = c.getImageData(0, 0, n, n).data;
    let maxY = n / 2;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 40) maxY = Math.max(maxY, Math.floor(i / 4 / n));
    bottoms.set(key, maxY - n / 2);
  }
  return bottoms.get(key);
}

function backdrop(c, gaps = []) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1b2629");
  g.addColorStop(1, "#0f1517");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.fillStyle = "#162022";
  for (let i = 0; i < 6; i++) c.fillRect(i * 64 + 12, 60 + (i % 3) * 18, 36, FLOOR - 60 - (i % 3) * 18);
  let x0 = 0;
  for (const [a, b] of [...gaps, [W, W]]) {
    slab(c, x0, a, FLOOR);
    x0 = b;
  }
}

function slab(c, a, b, top, depth = H) {
  if (b <= a) return;
  c.fillStyle = "#2d3a3c";
  c.fillRect(a, top, b - a, depth);
  c.fillStyle = "#4a5c5f";
  c.fillRect(a, top, b - a, 3);
  c.fillStyle = "#1f2a2c";
  for (let x = a + 10; x < b; x += 28) c.fillRect(x, top + 8, 2, 2);
}

function shadow(c, x, y, w, a = 0.35) {
  c.fillStyle = `rgba(0,0,0,${a})`;
  c.beginPath();
  c.ellipse(x, y, w, 3.5, 0, 0, Math.PI * 2);
  c.fill();
}

function box(c, x, y, w, h, fill = "#5b4a32", line = "#2a2016") {
  c.fillStyle = fill;
  c.fillRect(x, y - h, w, h);
  c.strokeStyle = line;
  c.lineWidth = 1.5;
  c.strokeRect(x + 0.75, y - h + 0.75, w - 1.5, h - 1.5);
  c.beginPath();
  c.moveTo(x, y - h); c.lineTo(x + w, y);
  c.moveTo(x + w, y - h); c.lineTo(x, y);
  c.stroke();
}

function barrel(c, x, y, w, h) {
  c.fillStyle = "#6b3a1c";
  c.fillRect(x, y - h, w, h);
  c.fillStyle = "#8c4c22";
  c.fillRect(x + w * 0.15, y - h, w * 0.2, h);
  c.fillStyle = "#3a1e0e";
  for (const k of [0.2, 0.8]) c.fillRect(x, y - h * k - 2, w, 4);
}

function spark(c, x, y, r, k) {
  c.save();
  c.globalAlpha = 1 - k;
  c.fillStyle = "#ffd76a";
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5, rr = i % 2 ? r * 0.35 : r * (0.6 + k);
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.fill();
  c.restore();
}

function label(c, text, x = 8, y = 16) {
  c.fillStyle = "rgba(201,209,208,0.75)";
  c.font = "600 11px system-ui";
  c.fillText(text, x, y);
}

const gun = (c, pal) => GUN.hook(c, { pal, lineW: LINE, simple: true });
const frontGun = (c, pal) => GUN.hook(c, { pal, lineW: LINE, simple: true, barrel: FRONT_BARREL });
const MUZZLE = GUN.muzzleInHook;

function droppedGun(c, x) {
  c.save();
  c.translate(x, FLOOR - 9);
  c.scale(K, K);
  GUN.draw(c, { lineW: LINE, simple: true });
  c.restore();
}

function item(c, x, y) {
  c.fillStyle = "#3fa34a";
  c.fillRect(x - 6, y - 8, 12, 8);
  c.fillStyle = "#b8e0b0";
  c.fillRect(x - 6, y - 8, 12, 2);
}

const MOVES = [];
const CATEGORY = document.body.dataset.category;
const move = (category, name, keys, period, draw) => MOVES.push({ category, name, keys, period, draw });

move("movement", "Idle", "-", 3, c => {
  backdrop(c);
  shadow(c, 180, FLOOR, 30);
  bot(c, { x: 180, y: FLOOR, pose: STAND });
});

move("movement", "Turn", "opposite arrow", 3.2, (c, t) => {
  backdrop(c);
  const seq = [["R", 1.2], ["F", 0.4], ["L", 1.2], ["F", 0.4]];
  let u = t, i = 0;
  while (u > seq[i][1]) { u -= seq[i][1]; i = (i + 1) % seq.length; }
  const view = seq[i][0];
  shadow(c, 180, FLOOR, 30);
  bot(c, { view: view === "F" ? "front" : "side", flip: view === "L", x: 180, y: FLOOR, pose: STAND });
});

move("movement", "Walk", "Left / Right", (W + 120) / WALK.speed, (c, t) => {
  backdrop(c);
  const p = t / WALK.cycle * TAU;
  const x = -60 + WALK.speed * t;
  shadow(c, x, FLOOR, 30);
  bot(c, { x, y: FLOOR + walkBob(p), pose: walkPose(p) });
});

move("movement", "Run", "Alt + Left / Right", (W + 120) / RUN.speed, (c, t) => {
  backdrop(c);
  const p = t / RUN.cycle * TAU;
  const x = -60 + RUN.speed * t;
  shadow(c, x, FLOOR, 30);
  bot(c, { x, y: FLOOR + runBob(p), pose: runPose(p) });
});

const DUCK = { ...legs(16, [-70, 124, -54], [-52, 128, -76]), ...GUARD };

function verticalJump(c, t, prep, t0) {
  backdrop(c);
  const keys = [
    ...prep,
    [t0, { ...legs(-2, [4, 4, 26], [8, 6, 28]), arm: -150, armFar: -140, fore: -10, foreFar: -14 }],
    [t0 + 0.28, { ...legs(6, [-62, 96, -10], [-54, 100, -16]), arm: -110, armFar: -100, fore: -30, foreFar: -30 }],
    [t0 + 0.52, { ...legs(2, [-14, 16, 10], [-10, 18, 10]), arm: -60, armFar: -50, fore: -30, foreFar: -30 }],
    [t0 + 0.64, { ...legs(14, [-46, 82], [-40, 86]), arm: 20, armFar: 16, fore: -40, foreFar: -40 }],
    [t0 + 1.1, { ...STAND }]
  ];
  const pose = keyed(keys, t);
  const air = span(t, t0 - 0.02, t0 + 0.04) * (1 - span(t, t0 + 0.5, t0 + 0.56));
  const u = (t - t0) / 0.54;
  const h = u > 0 && u < 1 ? 4 * 52 * u * (1 - u) : 0;
  shadow(c, 180, FLOOR, 30 - h * 0.12, 0.35 - h * 0.002);
  bot(c, { x: 180, y: FLOOR + lift(pose) * (1 - air) - h, pose });
}

move("movement", "Standing jump", "Up", 2.4, (c, t) => verticalJump(c, t, [
  [0, { ...STAND }],
  [0.35, { ...legs(14, [-46, 82], [-40, 86]), arm: 34, armFar: 30, fore: -20, foreFar: -20 }]
], 0.5));

move("movement", "Duck jump", "hold Down, then Up", 2.8, (c, t) => verticalJump(c, t, [
  [0, { ...STAND }],
  [0.25, DUCK],
  [0.75, DUCK],
  [0.95, { ...DUCK, arm: 34, armFar: 30, fore: -20, foreFar: -20 }]
], 1.1));

move("movement", "Walking jump", "direction + Up", (W + 120) / WALK.speed, (c, t) => {
  const gap = [134, 192];
  backdrop(c, [gap]);
  const p = t / WALK.cycle * TAU;
  const x = -60 + WALK.speed * t;
  const leap = { ...legs(6, [-62, 66, 14], [10, 58, 18]), arm: -40, armFar: 30, fore: -40, foreFar: -50 };
  const j0 = 1.7, j1 = 2.25;
  const k = span(t, j0 - 0.12, j0) * (1 - span(t, j1, j1 + 0.15));
  const pose = mix(walkPose(p), leap, k);
  const u = clamp((t - j0) / (j1 - j0));
  const h = t > j0 && t < j1 ? 4 * 36 * u * (1 - u) : 0;
  if (h === 0) shadow(c, x, FLOOR, 30);
  bot(c, { x, y: FLOOR + Math.min(walkBob(p) * (1 - k), lift(pose)) - h, pose });
});

const RUN_JUMP = { period: 1.7, j0: 0.48, j1: 0.92 };

function runningJumpAt(t) {
  const { j0, j1 } = RUN_JUMP;
  const p = t / RUN.cycle * TAU;
  const x = -60 + RUN.speed * t;
  const leap = { ...legs(10, [-70, 76, 14], [14, 72, 18]), arm: -60, armFar: 40, fore: -50, foreFar: -60 };
  const k = span(t, j0 - 0.06, j0 + 0.04) * (1 - span(t, j1 - 0.04, j1 + 0.06));
  const pose = mix(runPose(p), leap, k);
  const u = clamp((t - j0) / (j1 - j0));
  const h = t > j0 && t < j1 ? 4 * 34 * u * (1 - u) : 0;
  return { x, y: FLOOR + Math.min(runBob(p) * (1 - k), lift(pose)) - h, pose, airborne: h > 0 };
}

function runningJump(c, t, look = {}) {
  backdrop(c, [[104, 214]]);
  const { x, y, pose, airborne } = runningJumpAt(t);
  if (!airborne) shadow(c, x, FLOOR, 30);
  bot(c, { x, y, pose: { ...pose, ...look.pose } });
  return { x, y };
}

function hitLook(t, hitT) {
  const dt = t - hitT;
  if (dt < 0 || dt > 0.6) return {};
  const flash = 1 - span(dt, 0, 0.25);
  const tint = flash > 0 ? { brightness: 1 + flash * 0.6, saturate: 1 + flash } : undefined;
  return { pose: { head: { rot: -16 * Math.sin(22 * dt) * Math.exp(-7 * dt), tint }, chest: { tint } } };
}

function hitFx(c, t, hitT, [hx, hy], [sx, sy]) {
  const k = span(t, hitT - 0.3, hitT);
  if (k > 0 && k < 1) {
    const bx = W - (W - hx) * k;
    c.strokeStyle = "#ff6a3a"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(bx, hy); c.lineTo(bx + 16, hy); c.stroke();
  }
  if (t >= hitT && t < hitT + 0.3) spark(c, sx, sy, 14, span(t, hitT, hitT + 0.3));
}

move("movement", "Running jump", "Alt + direction + Up", RUN_JUMP.period, runningJump);

move("movement", "Fall and land", "walk off edge", 3.2, (c, t) => {
  const top = FLOOR - 86;
  backdrop(c);
  slab(c, 0, 150, top);
  const walkEnd = 1.06, landT = 1.48;
  const xEdge = 20 + walkEnd * WALK.speed;
  let x, y, pose;
  if (t < walkEnd) {
    x = 20 + t * WALK.speed;
    const p = t / WALK.cycle * TAU;
    pose = walkPose(p);
    y = top + walkBob(p);
  } else if (t < landT) {
    const u = (t - walkEnd) / (landT - walkEnd);
    x = xEdge + u * 40;
    pose = mix(walkPose(walkEnd / WALK.cycle * TAU), { ...legs(4, [-30, 40, 0], [10, 30, 10]), arm: -70, armFar: -40, fore: -30, foreFar: -30 }, ease(clamp(u * 2)));
    const start = top + walkBob(walkEnd / WALK.cycle * TAU);
    y = start + (FLOOR - start) * easeIn(u);
  } else {
    x = xEdge + 40;
    pose = keyed([[landT, { ...legs(4, [-30, 40, 0], [10, 30, 10]), arm: -70, armFar: -40, fore: -30, foreFar: -30 }], [landT + 0.12, CROUCH], [landT + 0.5, CROUCH], [landT + 1.0, STAND]], t);
    y = FLOOR + lift(pose);
  }
  shadow(c, x, t < walkEnd ? top : FLOOR, 30);
  bot(c, { x, y, pose });
});

move("movement", "Fall death", "fall too high", 5, (c, t) => {
  backdrop(c);
  const landT = 0.55;
  const x = 170;
  const fallPose = { ...legs(4, [-30, 40, 0], [10, 30, 10]), arm: -120, armFar: -90, fore: -30, foreFar: -30 };
  let y, pose, rot = 0;
  if (t < landT) {
    pose = fallPose;
    y = -40 + (FLOOR + 40) * easeIn(t / landT);
  } else {
    const impact = { ...legs(4, [-80, 140, -60], [-70, 146, -80]), arm: 30, armFar: 40, fore: -10, foreFar: -10 };
    pose = keyed([[landT, fallPose], [landT + 0.1, impact], [landT + 0.35, impact], [landT + 0.75, FLAT_BACK]], t);
    const k = easeIn(span(t, landT + 0.35, landT + 0.75));
    rot = LIE * k;
    y = (FLOOR + lift(pose)) * (1 - k) + (FLOOR - bottom(FLAT_BACK, LIE)) * k;
  }
  const alpha = 1 - span(t, 4.5, 5);
  c.save();
  c.globalAlpha = alpha;
  shadow(c, x, FLOOR, 30 * clamp(t / landT));
  const held = t < landT;
  if (!held && armed()) droppedGun(c, x + 20 + 14 * span(t, landT, landT + 0.25));
  bot(c, { x, y, pose, rot, hold: held });
  if (t > landT && t < landT + 0.4) spark(c, x + 10, FLOOR - 6, 22, span(t, landT, landT + 0.4));
  c.restore();
  if (t > landT + 0.8) label(c, "DEAD", 8, 16);
});

move("movement", "Duck", "hold Down", 2.4, (c, t) => {
  backdrop(c);
  const pose = keyed([[0, STAND], [0.25, DUCK], [1.6, DUCK], [1.9, STAND]], t);
  shadow(c, 180, FLOOR, 30);
  bot(c, { x: 180, y: FLOOR + lift(pose), pose });
});

const KNEEL = { ...legs(34, [-84, 92, -8], [6, 108, -6]), arm: -46, fore: 16, armFar: -20, foreFar: -40 };
const KNEEL_HAND = (() => {
  const y = FLOOR + lift(KNEEL);
  return handAt(KNEEL, 150, y);
})();
move("interaction", "Kneel, pick up", "Down on item", 2.8, (c, t) => {
  backdrop(c);
  const pose = keyed([[0, STAND], [0.45, KNEEL], [1.15, KNEEL], [1.6, STAND]], t);
  const grabbed = t > 0.8 && t < 2.2;
  shadow(c, 150, FLOOR, 30);
  if (!grabbed) item(c, KNEEL_HAND[0], FLOOR);
  bot(c, { x: 150, y: FLOOR + lift(pose), pose, hooks: grabbed ? { hand: hc => { hc.save(); hc.scale(1 / K, 1 / K); item(hc, 0, 6); hc.restore(); } } : {} });
  if (t > 1.6 && t < 2.2) label(c, "+ ITEM");
});

const REACH = { ...STAND, arm: -74, fore: -8 };
const PANEL = handAt(REACH, 140, FLOOR);
move("interaction", "Use", "Enter at target", 2.6, (c, t) => {
  backdrop(c);
  c.fillStyle = "#26363a";
  c.fillRect(PANEL[0] - 4, PANEL[1] - 26, 34, 52);
  c.strokeStyle = "#4a5c5f";
  c.strokeRect(PANEL[0] - 4, PANEL[1] - 26, 34, 52);
  const on = t > 0.7 && t < 2.3;
  c.fillStyle = on ? "#3fa34a" : "#e0281e";
  c.fillRect(PANEL[0] + 16, PANEL[1] - 20, 8, 8);
  const reach = armed() ? { ...STAND, arm: 6, fore: -4, armFar: -76, foreFar: -6 } : REACH;
  const pose = keyed([[0, armed() ? { ...STAND, arm: 6, fore: -4 } : STAND], [0.55, reach], [1.1, reach], [1.6, armed() ? { ...STAND, arm: 6, fore: -4 } : STAND]], t);
  shadow(c, 140, FLOOR, 30);
  bot(c, { x: 140, y: FLOOR + lift(pose), pose, hold: false, hooks: armed() ? { hand: gun } : {} });
});

move("movement", "Hide", "Shift, front view + tint", 4, (c, t) => {
  backdrop(c);
  barrel(c, 214, FLOOR, 40, 62);
  box(c, 96, FLOOR, 44, 44);
  const showFront = t > 0.65 && t < 3.15;
  const dark = span(t, 0.8, 1.1) * (1 - span(t, 2.7, 3.0));
  shadow(c, 180, FLOOR, 30);
  bot(c, { view: showFront ? "front" : "side", x: 180, y: FLOOR, pose: STAND, tint: { brightness: 1 - dark * 0.68, saturate: 1 - dark * 0.7 } });
  if (dark > 0.9) label(c, "HIDDEN");
});

function fire(c, t, pose, x, y, targetX) {
  const shot = Math.floor(t * 12);
  const [mx, my] = handAt(carry(pose), x, y, MUZZLE);
  if (shot % 2 === 0) spark(c, mx + 4, my, 8, 0.2);
  c.strokeStyle = "#ffd76a";
  c.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const bx = mx + ((t * 12 - shot) + i) * 60;
    if (bx < targetX) { c.beginPath(); c.moveTo(bx, my); c.lineTo(bx + 14, my); c.stroke(); }
  }
  if (shot % 3 === 0) spark(c, targetX + 2, my, 7, 0.3);
}

const JAB = { arm: -88, fore: 12 }, CROSS = { armFar: -84, foreFar: 6 };
const punchImpact = u => Math.max(num([[0, 0], [0.12, 1], [0.3, 0], [1, 0]], u), num([[0, 0], [0.5, 0], [0.62, 1], [0.8, 0], [1, 0]], u));

function bag(c, swing) {
  c.save();
  c.translate(258, 40);
  c.rotate(swing * 0.12);
  c.fillStyle = "#4a5c5f"; c.fillRect(-1, -40, 2, 40);
  c.fillStyle = "#6b3a1c"; c.fillRect(-16, 0, 32, 92);
  c.fillStyle = "#3a1e0e"; c.fillRect(-16, 20, 32, 4); c.fillRect(-16, 68, 32, 4);
  c.restore();
}

function punchPose(t, base, jab, cross, period) {
  const u = t % period / period;
  const near = num([[0, 0], [0.12, 1], [0.32, 0], [1, 0]], u);
  const far = num([[0, 0], [0.5, 0], [0.62, 1], [0.82, 0], [1, 0]], u);
  return { ...base, ...mix(GUARD, jab, near), ...(cross ? { armFar: mix(GUARD, cross, far).armFar, foreFar: mix(GUARD, cross, far).foreFar } : {}) };
}

const PUNCH_X = 150, PUNCH_HIT_Y = FLOOR - 92;

function punchOrShoot(c, t, look = {}) {
  backdrop(c);
  const stance = legs(2, [-14, 10], [16, 6]);
  const x = PUNCH_X;
  if (armed()) {
    box(c, 300, FLOOR, 40, 70, "#3c4a4c", "#1a2224");
    const pose = stance;
    const y = FLOOR + lift(pose);
    shadow(c, x, FLOOR, 30);
    bot(c, { x, y, pose: { ...pose, ...look.pose } });
    fire(c, t, pose, x, y, 300);
    return;
  }
  const pose = punchPose(t, stance, JAB, CROSS, 1.2);
  const y = FLOOR + lift(pose);
  bag(c, punchImpact(t / 1.2));
  shadow(c, x, FLOOR, 30);
  bot(c, { x, y, pose: { ...pose, ...look.pose } });
}

move("fight", { fists: "Punch", gun: "Shoot" }, "Ctrl", 1.2, punchOrShoot);

move("fight", { fists: "Hit while punching", gun: "Hit while shooting" }, "taking damage during Ctrl", 1.2, (c, t) => {
  punchOrShoot(c, t, hitLook(t, 0.9));
  const impact = [PUNCH_X + 14, PUNCH_HIT_Y];
  hitFx(c, t, 0.9, impact, impact);
});

move("fight", { fists: "Duck punch", gun: "Duck shoot" }, "Down + Ctrl", 1.0, (c, t) => {
  backdrop(c);
  const duck = legs(16, [-70, 124, -54], [-52, 128, -76]);
  const x = 140;
  if (armed()) {
    box(c, 300, FLOOR, 40, 40, "#3c4a4c", "#1a2224");
    const pose = duck;
    const y = FLOOR + lift(pose);
    shadow(c, x, FLOOR, 30);
    bot(c, { x, y, pose });
    fire(c, t, pose, x, y, 300);
    return;
  }
  const pose = punchPose(t, duck, { arm: -70, fore: 10 }, null, 1.0);
  shadow(c, x, FLOOR, 30);
  bot(c, { x, y: FLOOR + lift(pose), pose });
});

move("fight", "Weapon switch", "1 / 2", 3.4, (c, t) => {
  backdrop(c);
  const rest = { ...STAND, arm: 4, fore: -6 };
  const hip = { ...STAND, arm: 26, fore: -4 };
  const aim = carry(STAND);
  const pose = keyed([[0, rest], [0.35, hip], [0.5, hip], [0.95, aim], [1.6, aim], [2.05, hip], [2.2, hip], [2.55, rest], [3.4, rest]], t);
  const held = t > 0.45 && t < 2.15;
  shadow(c, 160, FLOOR, 30);
  bot(c, { x: 160, y: FLOOR + lift(pose), pose, hold: false, hooks: held ? { hand: gun } : {} });
  label(c, held ? "1  GUN" : "2  FISTS");
});

const CLIMB_REACH = Array.from({ length: 11 }, (_, i) =>
  XBOT.solve(climber, "handL", {}, ["armL", "foreL"], [[90, 200], [0, 160]], new DOMPoint(190, 110 - 150 * i / 10)));

function climbArm(h) {
  const f = h * 10, i = Math.min(9, Math.floor(f)), k = f - i;
  const a = CLIMB_REACH[i], b = CLIMB_REACH[i + 1];
  return { arm: a.armL + (b.armL - a.armL) * k, fore: a.foreL + (b.foreL - a.foreL) * k };
}

function climbPose(hl) {
  const hr = 1 - hl;
  const legUp = r => [{ sy: 1 - 0.5 * r }, { dy: -85 * r }];
  const [thighL, shinL] = legUp(hr), [thighR, shinR] = legUp(hl);
  const l = climbArm(hl), r = climbArm(hr);
  return { armL: l.arm, foreL: l.fore, armR: -r.arm, foreR: -r.fore, thighL, shinL, thighR, shinR };
}

move("movement", "Ladder", "Up / Down at ladder, back view", 4, (c, t) => {
  backdrop(c);
  const lx = 180;
  c.fillStyle = "#4a5c5f";
  c.fillRect(lx - 28, 0, 5, FLOOR);
  c.fillRect(lx + 23, 0, 5, FLOOR);
  const climb = 120 * clamp((t - 0.5) / 3.0);
  for (let y = FLOOR - 16; y > 0; y -= 22) c.fillRect(lx - 28, y, 56, 3);
  const hl = 0.5 + 0.5 * Math.sin(climb / 44 * Math.PI * 2);
  const pose = climbPose(hl);
  c.save();
  c.globalAlpha = span(t, 0, 0.3) * (1 - span(t, 3.6, 4));
  bot(c, { view: "climber", x: lx, y: FLOOR - climb, pose });
  c.restore();
});

move("movement", "Lift ride", "stand on platform", 5, (c, t) => {
  backdrop(c);
  const shaftL = 110, shaftR = 250;
  c.fillStyle = "#3a2a22";
  c.fillRect(shaftL - 14, 0, 10, H);
  c.fillRect(shaftR + 4, 0, 10, H);
  const py = num([[0, FLOOR], [0.6, FLOOR], [2.2, FLOOR - 66], [3.0, FLOOR - 66], [4.4, FLOOR], [5, FLOOR]], t);
  c.fillStyle = "#4a5c5f";
  c.fillRect(shaftL, py, shaftR - shaftL, 8);
  c.fillStyle = "#e0b020";
  for (let x = shaftL; x < shaftR; x += 16) c.fillRect(x, py + 2, 8, 4);
  c.fillStyle = "#6f878b";
  c.fillRect(shaftL, py - 40, 3, 40);
  c.fillRect(shaftR - 3, py - 40, 3, 40);
  c.fillRect(shaftL, py - 40, shaftR - shaftL, 3);
  shadow(c, 180, py, 30);
  bot(c, { x: 180, y: py, pose: STAND });
});

move("fight", "Hit reaction", "taking damage", 2, (c, t) => {
  backdrop(c);
  const x = 170;
  shadow(c, x, FLOOR, 30);
  const look = hitLook(t, 0.6);
  bot(c, { x, y: FLOOR + lift(STAND), pose: { ...STAND, ...look.pose } });
  const impact = [x + 14, FLOOR - 120];
  hitFx(c, t, 0.6, impact, impact);
});

move("fight", "Hit in running jump", "taking damage mid-air", RUN_JUMP.period, (c, t) => {
  const hitT = (RUN_JUMP.j0 + RUN_JUMP.j1) / 2, at = runningJumpAt(hitT);
  const { x, y } = runningJump(c, t, hitLook(t, hitT));
  hitFx(c, t, hitT, [at.x + 14, at.y - 100], [x + 14, y - 100]);
});

move("fight", "Death", "energy runs out", 5, (c, t) => {
  backdrop(c);
  const hits = [0.3, 0.55, 0.8];
  const stagger = { ...legs(-16, [-20, 20], [26, 24]), arm: 50, armFar: 60, fore: -60, foreFar: -50 };
  const buckle = { ...legs(-24, [-60, 120, -50], [-40, 126, -70]), arm: 60, armFar: 70, fore: -40, foreFar: -40 };
  const pose = keyed([[0, STAND], [0.3, STAND], [0.45, stagger], [0.9, stagger], [1.15, buckle], [1.6, FLAT_BACK]], t);
  const k = easeIn(span(t, 1.15, 1.6));
  const x = 190 - 16 * span(t, 0.3, 1.0);
  c.save();
  c.globalAlpha = 1 - span(t, 4.5, 5);
  shadow(c, x, FLOOR, 30);
  const held = t < 1.0;
  if (!held && armed()) droppedGun(c, x + 24 - 20 * span(t, 1.0, 1.3));
  bot(c, { x, y: (FLOOR + lift(pose)) * (1 - k) + (FLOOR - bottom(FLAT_BACK, LIE, false)) * k, pose, rot: LIE * k, hold: held });
  for (const h of hits) if (t > h && t < h + 0.25) spark(c, x + 12, FLOOR - 110 + (h * 40), 12, span(t, h, h + 0.25));
  c.restore();
  if (t > 1.7) label(c, "DEAD");
});

const grid = document.getElementById("grid");
const cells = MOVES.filter(m => m.category === CATEGORY).map(m => {
  const fig = document.createElement("figure");
  const canvas = document.createElement("canvas");
  const cap = document.createElement("figcaption");
  const b = document.createElement("b");
  const s = document.createElement("span");
  cap.append(b, s);
  fig.append(canvas, cap);
  grid.append(fig);
  return { m, canvas, ctx: canvas.getContext("2d"), b, s, visible: true };
});

const watcher = new IntersectionObserver(entries => {
  for (const e of entries) cells.find(cell => cell.canvas === e.target).visible = e.isIntersecting;
});
for (const { canvas } of cells) watcher.observe(canvas);

const pick = v => typeof v === "string" ? v : v[WEAPON];
function setWeapon(w) {
  WEAPON = w;
  try { localStorage.setItem("xbotWeapon", w); } catch {}
  for (const btn of document.querySelectorAll("[data-weapon]")) btn.setAttribute("aria-pressed", String(btn.dataset.weapon === w));
  for (const { m, b, s } of cells) { b.textContent = pick(m.name); s.textContent = pick(m.keys); }
}
for (const btn of document.querySelectorAll("[data-weapon]")) btn.onclick = () => setWeapon(btn.dataset.weapon);
setWeapon(WEAPON);

function frame(now) {
  const dpr = devicePixelRatio || 1;
  LINE = dpr;
  for (const { m, canvas, ctx, visible } of cells) {
    if (!visible) continue;
    const w = Math.round(canvas.clientWidth * dpr);
    if (canvas.width !== w) { canvas.width = w; canvas.height = Math.round(w * H / W); }
    const s = canvas.width / W;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    m.draw(ctx, (now / 1000) % m.period);
    ctx.restore();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
