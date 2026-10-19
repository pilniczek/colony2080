import xbot from "@config/robots/xbot.json";
import { clamp, ease, easeIn, keyed, mix, num, span } from "../../engine/anim/keyed";
import { apply, multiply, type Mat2D } from "../../engine/math/mat2d";
import { jointMatrix, locate, solve, type Pose, type Tint } from "../../engine/rig/pose";
import type { GroupNode, Pt, RigNode } from "../../engine/rig/tree";
import type { holdPoses } from "../robot/gun";
import { buildBack, buildFront, buildSide, ROBOT } from "../robot/xbot";
import { clipFor, holdsGun, type Clip, type ClipSet, type GaitName, type MovementConfig, type View } from "./config";
import { gaitBob, gaitPose, RUN, SPIKE_K, TAU, WALK, type Gait } from "./gait";
import type { Hero } from "./hero";

export type GunLook = "hand" | "slung" | "dropped" | "none";
export type GunModel = "gun" | "blaster";

export interface HitLook {
  star: Pt;
  spark: number;
  flash: number;
  headSnap: number;
}

export interface HeroLook {
  view: View;
  flip: boolean;
  pose: Pose;
  gun: GunLook;
  hand: GunModel;
  back: GunModel | null;
  rot: number;
  tint: number;
  lift: number;
  hit: HitLook | null;
  gunSlide: number;
  dust: number | null;
}

export interface Rigs {
  side: GroupNode;
  front: GroupNode;
  back: GroupNode;
  climber: GroupNode;
}

type Hold = ReturnType<typeof holdPoses>;
type Angles = Record<string, number>;

const FEET = ["heelNear", "toeNear", "heelFar", "toeFar"];
const REACH_STEPS = 10;
const ALPHA_VISIBLE = 40 / 255;
const GAITS: Record<GaitName, Gait> = { walk: WALK, run: RUN };
const LAND = 0.06;
const DROP = { letGo: 0.3, slide: 0.3, dust: 0.4 };
export const RUNG = 22;
const CLIMB = { hands: [152.5, 130.5], feet: [RUNG, 0], reachTop: 110, reachSpan: 150 } as const;
const HIT_HEIGHT = 100;
const LOOK = { head: 14, headSx: 0.8, face: 40, faceSx: 0.6 };
const HIT = { window: 0.6, flash: 0.25, glow: 0.6, spark: 0.3, snap: -16, rate: 22, damping: 7, star: [14, -HIT_HEIGHT] as Pt };

export const heroScale = (cfg: MovementConfig): number =>
  (cfg.heroHeightCells * cfg.cellPx) / (ROBOT.FOOT_Y - xbot.levels.head);

export const createRigs = (lod: boolean, enemy = false): Rigs => ({
  side: buildSide({ lod, enemy, farLimbs: true, propBehindArm: true }),
  front: buildFront({ lod, enemy, rightArmFirst: true, propBehindArm: true }),
  back: buildBack({ lod, enemy }),
  climber: buildBack({ lod, enemy, thumbsBehind: true, forearmsUnder: true }),
});

const step = <T>(track: [number, T][], t: number): T => {
  let value = track[0]![1];
  for (const [at, v] of track) if (at <= t) value = v;
  return value;
};

const footMax = (side: GroupNode, pose: Pose): number => {
  let m = -Infinity;
  for (const hook of FEET) {
    const mat = locate(side, hook, pose);
    if (mat) m = Math.max(m, apply(mat, [0, 0])[1]);
  }
  return m;
};

const lift = (side: GroupNode, pose: Pose): number => ROBOT.FOOT_Y - footMax(side, pose);

const lowest = (node: RigNode, pose: Pose, m: Mat2D): number => {
  if (node.k === "g") {
    let mm = node.m ? multiply(m, node.m) : m;
    const j = node.name != null ? jointMatrix(node, pose[node.name]) : null;
    if (j) mm = multiply(mm, j);
    return node.kids.reduce((y, kid) => Math.max(y, lowest(kid, pose, mm)), -Infinity);
  }
  const maxY = (pts: Pt[]): number => pts.reduce((y, p) => Math.max(y, apply(m, p)[1]), -Infinity);
  if (node.k === "part") return maxY(node.spec.pts);
  if (node.k === "flat") return maxY(node.pts);
  if (node.k === "ellipse") {
    if (node.opacity <= ALPHA_VISIBLE) return -Infinity;
    return m.b * node.cx + m.d * node.cy + m.f + Math.hypot(m.b * node.rx, m.d * node.ry);
  }
  if (node.k === "trefoil") return m.f + node.r * Math.hypot(m.b, m.d);
  return -Infinity;
};

const rotationAbout = (deg: number): Mat2D => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const [x, y] = [ROBOT.SIDE_AX, ROBOT.FOOT_Y];
  return { a: c, b: s, c: -s, d: c, e: -(c * x - s * y), f: -(s * x + c * y) };
};

const settle = (side: GroupNode, pose: Pose, rot: number): number => -lowest(side, pose, rotationAbout(rot));

interface Climber {
  reach: Angles[];
  stepUp: number;
}

const climbers = new WeakMap<GroupNode, Climber>();

const legUp = (r: number): [Pose[string], Pose[string]] => [{ sy: 1 - 0.5 * r }, { dy: -85 * r }];

const footY = (climber: GroupNode, pose: Pose): number => {
  const mat = locate(climber, "footL", pose);
  return mat ? apply(mat, [0, 0])[1] : 0;
};

const climberOf = (climber: GroupNode): Climber => {
  let c = climbers.get(climber);
  if (!c) {
    const [thighL, shinL] = legUp(1);
    c = {
      reach: Array.from({ length: REACH_STEPS + 1 }, (_, i) =>
        solve(climber, "handL", {}, ["armL", "foreL"], [[90, 200], [0, 160]], [190, CLIMB.reachTop - (CLIMB.reachSpan * i) / REACH_STEPS]),
      ),
      stepUp: (footY(climber, {}) - footY(climber, { thighL, shinL })) * SPIKE_K,
    };
    climbers.set(climber, c);
  }
  return c;
};

const climbArm = (table: Angles[], rel: number): { arm: number; fore: number } => {
  const f = clamp((CLIMB.reachTop - ROBOT.FOOT_Y + rel / SPIKE_K) / CLIMB.reachSpan) * REACH_STEPS;
  const i = Math.min(REACH_STEPS - 1, Math.floor(f));
  const k = f - i;
  const a = table[i]!;
  const b = table[i + 1]!;
  return { arm: a.armL! + (b.armL! - a.armL!) * k, fore: a.foreL! + (b.foreL! - a.foreL!) * k };
};

const rungHeight = (climb: number, phase: number): number => {
  const c = climb / (2 * RUNG) + phase / 2;
  const n = Math.floor(c);
  const k = c - n;
  return 2 * RUNG * (n + (k < 0.5 ? 0 : ease(2 * k - 1)));
};

const climbPose = (c: Climber, climb: number): Pose => {
  const rel = (phase: number, top: number): number => rungHeight(climb, phase) + top - climb;
  const l = climbArm(c.reach, rel(0, CLIMB.hands[0]));
  const r = climbArm(c.reach, rel(1, CLIMB.hands[1]));
  const [thighR, shinR] = legUp(rel(0, CLIMB.feet[0]) / c.stepUp);
  const [thighL, shinL] = legUp(rel(1, CLIMB.feet[1]) / c.stepUp);
  return { armL: l.arm, foreL: l.fore, armR: -r.arm, foreR: -r.fore, thighL, shinL, thighR, shinR };
};

const carry = (pose: Angles, hold: Hold): Angles => {
  const b = pose.body ?? 0;
  return { ...pose, arm: hold.CARRY.arm - b, fore: hold.CARRY.fore, armFar: hold.CARRY_FAR.armFar - b, foreFar: hold.CARRY_FAR.foreFar };
};

const joints = (pose: Angles): Angles => Object.fromEntries(Object.entries(pose).filter(([k]) => k !== "carry"));

const frontCarry = (pose: Angles, hold: Hold): Angles => ({ ...pose, ...hold.FRONT_CARRY, ...hold.FRONT_CARRY_R });

const withCarryKey = (pose: Angles, hold: Hold, inHand: boolean, view: View): Angles => {
  const rest = joints(pose);
  const target = view === "front" ? frontCarry(rest, hold) : carry(rest, hold);
  return pose.carry !== undefined && inHand ? mix(rest, target, pose.carry) : rest;
};

const letGo = (pose: Angles, hold: Hold, t: number, drop: number, inHand: boolean): Angles => {
  const rest = joints(pose);
  return mix(rest, carry(rest, hold), inHand ? 1 : 1 - ease(span(t, drop, drop + DROP.letGo)));
};

const clipTime = (clip: Clip, time: number): number =>
  clip.loop ? ((time % clip.duration) + clip.duration) % clip.duration : time;

export const spikeUnit = (cfg: MovementConfig): number => heroScale(cfg) / SPIKE_K;

const handModel = (h: Hero): GunModel => (h.weapon === "blaster" ? "blaster" : "gun");

const backModel = (h: Hero): GunModel | null => {
  if (h.weapon === "blaster") return "gun";
  return h.weapon === "gun" && h.blaster !== null ? "blaster" : null;
};

const ladderLook = (h: Hero, rigs: Rigs, cfg: MovementConfig): HeroLook => ({
  view: "back",
  flip: false,
  pose: climbPose(climberOf(rigs.climber), (h.climb * cfg.cellPx) / spikeUnit(cfg)),
  gun: holdsGun(h.weapon) ? "slung" : "none",
  hand: handModel(h),
  back: null,
  rot: 0,
  tint: 0,
  lift: 0,
  hit: null,
  gunSlide: 0,
  dust: null,
});

const armed = (view: View, pose: Angles, hold: Hold): { pose: Angles; gun: GunLook } => {
  if (view === "side") return { pose: carry(pose, hold), gun: "hand" };
  if (view === "front") return { pose: frontCarry(pose, hold), gun: "hand" };
  return { pose, gun: "slung" };
};

const grounding = (h: Hero, clip: Clip, pose: Angles, rot: number, side: GroupNode, t: number): number => {
  if (clip.rot) {
    const settled = settle(side, pose, rot);
    return h.onGround ? settled : Math.min(0, settled);
  }
  if (clip.base && clip.blend !== undefined) return lift(side, pose) * (1 - span(t, 0, clip.blend));
  return h.onGround ? lift(side, pose) : 0;
};

const gaitLook = (h: Hero, clip: Clip, clips: ClipSet, rigs: Rigs): { pose: Angles; lift: number } | null => {
  if (!clip.gait) return null;
  const g = GAITS[clip.gait];
  if (clip.blend === undefined) {
    const phase = (TAU * clipTime(clip, h.time)) / clip.duration;
    return { pose: gaitPose(g, phase), lift: gaitBob(g, phase) / SPIKE_K };
  }
  const phase = (TAU * (h.gaitTime + h.time)) / (clips[clip.gait]?.duration ?? g.cycle);
  const k = span(h.time, 0, clip.blend);
  const pose = mix(gaitPose(g, phase), keyed(clip.pose, h.time), k);
  return { pose, lift: Math.min((gaitBob(g, phase) / SPIKE_K) * (1 - k), lift(rigs.side, pose)) };
};

const fromBase = (clip: Clip, t: number): Angles | null =>
  clip.base && clip.blend !== undefined ? mix(clip.base, keyed(clip.pose, t), span(t, 0, clip.blend)) : null;

const hitLook = (h: Hero, view: View): { hit: HitLook; pose: Pose } | null => {
  const age = h.hitAge;
  if (age === null || age < 0 || age > HIT.window) return null;
  const flash = 1 - span(age, 0, HIT.flash);
  const headSnap = HIT.snap * Math.sin(HIT.rate * age) * Math.exp(-HIT.damping * age);
  const tint: { tint?: Tint } = flash > 0 ? { tint: { brightness: 1 + flash * HIT.glow, saturate: 1 + flash } } : {};
  const anchor = view === "side" ? ROBOT.SIDE_AX : ROBOT.AX;
  const star: Pt = [anchor + HIT.star[0] / SPIKE_K, ROBOT.FOOT_Y + HIT.star[1] / SPIKE_K];
  return { hit: { star, spark: span(age, 0, HIT.spark), flash, headSnap }, pose: { head: { rot: headSnap, ...tint }, chest: tint } };
};

const withHit = (h: Hero, look: HeroLook): HeroLook => {
  const hit = hitLook(h, look.view);
  return hit ? { ...look, pose: { ...look.pose, ...hit.pose }, hit: hit.hit } : look;
};

const eventAt = (clip: Clip, name: string): number | null => clip.events?.find(([, e]) => e === name)?.[0] ?? null;

const dustAt = (h: Hero, clip: Clip, t: number): number | null => {
  const at = eventAt(clip, "dust");
  return at !== null && h.onGround && t > at && t < at + DROP.dust ? span(t, at, at + DROP.dust) : null;
};

const dropAt = (clip: Clip): number | undefined => clip.gun?.find(([, g]) => g === "dropped")?.[0];

const gunHeld = (h: Hero, clip: Clip, raw: Angles, view: View, hold: Hold, t: number): { pose: Angles; gun: GunLook } => {
  const track: GunLook | null = !holdsGun(h.weapon) ? "none" : clip.gun ? step(clip.gun, t) : null;
  if (!track) return armed(view, joints(raw), hold);
  const gun = track === "dropped" && !h.onGround ? "hand" : track;
  const drop = dropAt(clip);
  if (drop === undefined || gun === "none") return { pose: withCarryKey(raw, hold, gun === "hand", view), gun };
  return { pose: letGo(raw, hold, t, drop, gun === "hand"), gun };
};

const gunSlide = (clip: Clip, t: number): number => {
  const drop = dropAt(clip);
  return drop === undefined ? 0 : span(t, drop, drop + DROP.slide);
};

const lookToward = (facing: number): Pose => ({
  head: { dx: facing * LOOK.head, sx: LOOK.headSx },
  face: { dx: facing * LOOK.face, sx: LOOK.faceSx },
});

const baseLook = (h: Hero, clips: ClipSet, rigs: Rigs, hold: Hold, cfg: MovementConfig): HeroLook => {
  const name = clipFor(h.state, h.weapon);
  const clip = clips[name];
  if (!clip) throw new Error(`clip ${name} is missing`);
  if (h.state === "ladder") return ladderLook(h, rigs, cfg);
  const t = clipTime(clip, h.time);
  const view = clip.view ? step(clip.view, t) : "side";
  const moving = gaitLook(h, clip, clips, rigs);
  const raw = moving?.pose ?? fromBase(clip, t) ?? keyed(clip.pose, t);
  const held = gunHeld(h, clip, raw, view, hold, t);
  const rot = clip.rot ? num(clip.rot, t, easeIn) : 0;
  return {
    view,
    flip: view === "side" && h.facing < 0,
    pose: h.hidden && view === "front" ? { ...held.pose, ...lookToward(h.facing) } : held.pose,
    gun: held.gun,
    hand: handModel(h),
    back: backModel(h),
    rot,
    tint: h.hidden ? 1 : clip.tint ? num(clip.tint, t, (k) => k) : 0,
    lift: moving?.lift ?? grounding(h, clip, held.pose, rot, rigs.side, t),
    hit: null,
    gunSlide: gunSlide(clip, t),
    dust: dustAt(h, clip, t),
  };
};

const landed = (h: Hero, look: HeroLook, clips: ClipSet, rigs: Rigs, hold: Hold, cfg: MovementConfig): HeroLook => {
  const gait = h.state === "walk" || h.state === "run";
  const landing = h.landing;
  if (!landing || landing.age >= LAND || look.view !== "side" || (!gait && h.state !== "idle")) return look;
  const from = baseLook({ ...h, state: landing.from, time: landing.time, onGround: false, landing: null }, clips, rigs, hold, cfg);
  const k = 1 - span(landing.age, 0, LAND);
  const pose = mix(look.pose as Angles, from.pose as Angles, k);
  const ground = lift(rigs.side, pose);
  return { ...look, pose, lift: gait ? Math.min(look.lift * (1 - k), ground) : ground * (1 - k) };
};

export const heroLook = (h: Hero, clips: ClipSet, rigs: Rigs, hold: Hold, cfg: MovementConfig): HeroLook =>
  withHit(h, landed(h, baseLook(h, clips, rigs, hold, cfg), clips, rigs, hold, cfg));
