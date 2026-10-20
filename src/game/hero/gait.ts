import { clamp } from "../../engine/anim/keyed";
import { ROBOT } from "../robot/xbot";

type LegKey = { hip: number; knee: number; foot: number };
type Rates = Record<keyof LegKey, number>;
type SwingKey = [number, LegKey, Rates?];

export interface Gait {
  cycle: number;
  speed: number;
  stance: number;
  reach: number;
  heelStrike: number;
  flat: [number, number];
  toeOff: number;
  drop: number;
  bob: number;
  lean: number;
  leanPulse: number;
  arm: number;
  armPhase: number;
  fore: number;
  swing: [number, LegKey][];
  landing?: { lead: number; rise: number };
}

export const SPIKE_K = 0.2;
export const TAU = Math.PI * 2;
const D = Math.PI / 180;

export const LEG = { hipY: 344, farX: -24, thigh: 178, shin: 178, ankleY: 700, heel: 80 };

export const RUN: Gait = {
  cycle: 0.66, speed: 300, stance: 0.34, reach: 0.36, heelStrike: -6, flat: [0.15, 0.55], toeOff: 44,
  drop: 4, bob: 2.4, lean: 12, leanPulse: 1.5, arm: 34, armPhase: 0.8, fore: -78,
  swing: [
    [0.5, { hip: 24, knee: 78, foot: 80 }],
    [0.62, { hip: -6, knee: 112, foot: 94 }],
    [0.76, { hip: -48, knee: 98, foot: 38 }],
    [0.9, { hip: -36, knee: 42, foot: -4 }],
  ],
};

export const WALK: Gait = {
  cycle: 1.1, speed: 110, stance: 0.6, reach: 0.5, heelStrike: -14, flat: [0.18, 0.6], toeOff: 30,
  drop: 3, bob: -2.6, lean: 0, leanPulse: 0, arm: 16, armPhase: 0.97, fore: -6,
  swing: [
    [0.7, { hip: 0, knee: 58, foot: 22 }],
    [0.82, { hip: -24, knee: 46, foot: -6 }],
  ],
  landing: { lead: 0.1, rise: 20 },
};

export const footContacts = (prev: number, next: number): number => Math.max(0, Math.floor(next * 2) - Math.floor(prev * 2));

const cycle = (p: number): number => (((p / TAU) % 1) + 1) % 1;
const stepPhase = (u: number): number => (u * 2) % 1;
const lowPhase = (g: Gait): number => (2 * g.stance * g.reach) % 1;

export const gaitBob = (g: Gait, p: number): number => g.drop + g.bob * Math.cos(TAU * (stepPhase(cycle(p)) - lowPhase(g)));

export const gaitLean = (g: Gait, u: number): number => g.lean + g.leanPulse * Math.cos(TAU * (stepPhase(u) - g.stance * 2));

function stanceFoot(g: Gait, s: number): number {
  const [flat0, flat1] = g.flat;
  if (s < flat0) return g.heelStrike * (1 - s / flat0) ** 2;
  if (s < flat1) return 0;
  return g.toeOff * ((s - flat1) / (1 - flat1)) ** 2;
}

function legIK(dx: number, dy: number): { hip: number; knee: number } {
  const { thigh: a, shin: b } = LEG;
  const d = Math.min(Math.hypot(dx, dy), a + b);
  const knee = Math.acos(clamp((d * d - a * a - b * b) / (2 * a * b), -1, 1));
  const hip = Math.atan2(-dx, dy) - Math.atan2(b * Math.sin(knee), a + b * Math.cos(knee));
  return { hip: hip / D, knee: knee / D };
}

function stanceLeg(g: Gait, u: number, hipX: number, rise = 0): LegKey {
  const s = u / g.stance;
  const foot = stanceFoot(g, s);
  const r = foot * D;
  const b = gaitLean(g, u) * D;
  const ground = ROBOT.FOOT_Y - gaitBob(g, u * TAU) / SPIKE_K - rise;
  const h = ROBOT.FOOT_Y - LEG.ankleY;
  const sweep = (g.speed * g.stance * g.cycle) / SPIKE_K;
  const flat = sweep * (g.reach - s);
  const lever = foot < 0 ? LEG.heel : -LEG.heel;
  const ox = lever * Math.cos(r) + h * Math.sin(r);
  const oy = lever * Math.sin(r) - h * Math.cos(r);
  return { ...legIK(hipX * (1 - Math.cos(b)) + flat - lever + ox, ground + oy - LEG.hipY - hipX * Math.sin(b)), foot };
}

const LEG_KEYS = ["hip", "knee", "foot"] as const;

const rateBetween = (p: LegKey, q: LegKey, dt: number): Rates =>
  Object.fromEntries(LEG_KEYS.map((n) => [n, (q[n] - p[n]) / dt])) as Rates;

const swingCache = new Map<string, Required<SwingKey>[]>();

function swingKeys(g: Gait, hipX: number): Required<SwingKey>[] {
  const id = JSON.stringify([g, hipX]);
  let keys = swingCache.get(id);
  if (keys) return keys;
  const e = 1e-4;
  const rate = (u0: number, u1: number): Rates => rateBetween(stanceLeg(g, u0, hipX), stanceLeg(g, u1, hipX), u1 - u0);
  const approach: SwingKey[] = g.landing ? [[1 - g.landing.lead, stanceLeg(g, -g.landing.lead, hipX, g.landing.rise)]] : [];
  const raw: SwingKey[] = [
    [g.stance, stanceLeg(g, g.stance, hipX), rate(g.stance - e, g.stance)],
    ...g.swing.map(([t, v]): SwingKey => [t, v]),
    ...approach,
    [1, stanceLeg(g, 0, hipX), rate(0, e)],
  ];
  for (let i = 1; i < raw.length - 1; i++) {
    const [t0, v0] = raw[i - 1]!;
    const [t2, v2] = raw[i + 1]!;
    raw[i]![2] = rateBetween(v0, v2, t2 - t0);
  }
  keys = raw as Required<SwingKey>[];
  swingCache.set(id, keys);
  return keys;
}

function swingLeg(g: Gait, u: number, hipX: number): LegKey {
  const keys = swingKeys(g, hipX);
  let i = 0;
  while (u > keys[i + 1]![0]) i++;
  const [t0, p0, m0] = keys[i]!;
  const [t1, p1, m1] = keys[i + 1]!;
  const w = t1 - t0;
  const k = (u - t0) / w;
  const k2 = k * k;
  const k3 = k2 * k;
  const at = (n: keyof LegKey): number =>
    (2 * k3 - 3 * k2 + 1) * p0[n] + (k3 - 2 * k2 + k) * w * m0[n] + (-2 * k3 + 3 * k2) * p1[n] + (k3 - k2) * w * m1[n];
  return { hip: at("hip"), knee: at("knee"), foot: at("foot") };
}

export function gaitPose(g: Gait, p: number): Record<string, number> {
  const u = cycle(p);
  const body = gaitLean(g, u);
  const leg = (v: number, hipX: number): [number, number, number] => {
    const { hip, knee, foot } = v < g.stance ? stanceLeg(g, v, hipX) : swingLeg(g, v, hipX);
    return [hip, knee, foot - hip - knee];
  };
  const [hipNear, kneeNear, ankleNear] = leg(u, 0);
  const [hipFar, kneeFar, ankleFar] = leg((u + 0.5) % 1, LEG.farX);
  const swing = g.arm * Math.cos(TAU * (u - g.armPhase));
  return {
    body,
    hipNear: hipNear - body,
    kneeNear,
    ankleNear,
    hipFar: hipFar - body,
    kneeFar,
    ankleFar,
    arm: swing,
    armFar: -swing,
    fore: g.fore,
    foreFar: g.fore,
  };
}
