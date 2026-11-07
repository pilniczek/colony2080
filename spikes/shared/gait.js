(() => {
const { FOOT_Y } = window.XBOT;
const K = 0.2;
const D = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function legs(body, near, far) {
  const leg = ([hip, knee, ankle], s) => ({ ["hip" + s]: hip - body, ["knee" + s]: knee, ["ankle" + s]: ankle ?? -(hip + knee) * 0.7 });
  return { body, ...leg(near, "Near"), ...leg(far, "Far") };
}

const TAU = Math.PI * 2;
const LEG = { hipY: 344, farX: -24, thigh: 178, shin: 178, ankleY: 700, heel: 80 };
const RUN = {
  cycle: 0.52, speed: 624.8, stance: 0.25, reach: 0.36, heelStrike: -6, flat: [0.15, 0.55], toeOff: 44,
  drop: 10, bob: 2.4, lean: 16, leanPulse: 1.5, arm: 42, armPhase: 0.8, fore: -78,
  swing: [
    [0.5, { hip: 24, knee: 78, foot: 80 }],
    [0.62, { hip: -6, knee: 112, foot: 94 }],
    [0.76, { hip: -48, knee: 98, foot: 38 }],
    [0.9, { hip: -36, knee: 42, foot: -4 }]
  ]
};
const WALK = {
  cycle: 0.7, speed: 195.26, stance: 0.56, reach: 0.45, heelStrike: -14, flat: [0.18, 0.6], toeOff: 30,
  drop: 3, bob: -2, lean: 0, leanPulse: 0, arm: 16, armPhase: 0.97, fore: -6,
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
const walkAt = t => {
  const p = t / WALK.cycle * TAU;
  return { pose: walkPose(p), drop: walkBob(p) / K, x: WALK.speed * t / K };
};

window.GAIT = { K, TAU, LEG, WALK, RUN, legs, cycle, gaitPose, gaitBob, gaitLean, walkPose, walkBob, walkAt, runPose, runBob };
})();
