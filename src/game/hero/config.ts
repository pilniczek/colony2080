import type { Keys } from "../../engine/anim/keyed";

export type HeroState =
  | "idle" | "walk" | "run" | "standJump" | "walkJump" | "runJump" | "duckJump" | "fall" | "fallDeath" | "duck"
  | "duckAttack" | "use" | "hide" | "attack" | "weaponSwitch" | "ladder" | "death" | "jumpDeath";
export type Weapon = "fists" | "gun" | "blaster";
export type View = "side" | "front" | "back";
export type GunTrack = "hand" | "none" | "dropped";
export type GaitName = "walk" | "run";

export interface Clip {
  duration: number;
  loop: boolean;
  travel?: number;
  gait?: GaitName;
  blend?: number;
  base?: Record<string, number>;
  cancelAt?: number;
  pose: Keys;
  view?: [number, View][];
  rot?: [number, number][];
  tint?: [number, number][];
  gun?: [number, GunTrack][];
  events?: [number, string][];
}
export type ClipSet = Record<string, Clip>;

export interface MovementConfig {
  status: string;
  source: string;
  cellPx: number;
  heroHeightCells: number;
  floorHeightCells: number;
  box: { width: number; height: number; duckHeight: number };
  gravity: number;
  maxFallSpeed: number;
  jump: { standHeight: number; runHeight: number; runSpeed: number; walkHeight: number };
  fallDeathCells: number;
  ladderSpeed: number;
  liftSpeed: number;
  inputBufferMs: number;
  fireRate: number;
  sightCells: number;
  pickReach: number;
  hitSlowMs: number;
  shot: { damage: number };
  punch: { damage: number; reach: number };
  energy: { max: number; hit: number; shields: number };
  ammo: number;
  blaster: { tickHz: number; damage: number; ammo: number };
  respawnMs: number;
  deathSlide: number;
}

type Obj = Record<string, unknown>;

const fail = (path: string, what: string): never => {
  throw new Error(`${path} ${what}`);
};

const obj = (v: unknown, path: string): Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Obj) : fail(path, "must be an object");

const list = (v: unknown, path: string): unknown[] => (Array.isArray(v) ? v : fail(path, "must be an array"));

const finite = (v: unknown, path: string): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fail(path, "must be a finite number");

const text = (v: unknown, path: string): string => (typeof v === "string" ? v : fail(path, "must be a string"));

const positive = (v: unknown, path: string): number => {
  const n = finite(v, path);
  return n > 0 ? n : fail(path, "must be above 0");
};

export function loadMovement(json: unknown): MovementConfig {
  const o = obj(json, "movement");
  const n = (key: string, from: Obj = o, path = "movement"): number => finite(from[key], `${path}.${key}`);
  const group = <K extends string>(key: string, keys: K[]): Record<K, number> => {
    const g = obj(o[key], `movement.${key}`);
    return Object.fromEntries(keys.map(k => [k, n(k, g, `movement.${key}`)])) as Record<K, number>;
  };
  return {
    status: text(o.status, "movement.status"),
    source: text(o.source, "movement.source"),
    cellPx: n("cellPx"),
    heroHeightCells: n("heroHeightCells"),
    floorHeightCells: n("floorHeightCells"),
    box: group("box", ["width", "height", "duckHeight"]),
    gravity: n("gravity"),
    maxFallSpeed: n("maxFallSpeed"),
    jump: group("jump", ["standHeight", "runHeight", "runSpeed", "walkHeight"]),
    fallDeathCells: n("fallDeathCells"),
    ladderSpeed: n("ladderSpeed"),
    liftSpeed: n("liftSpeed"),
    inputBufferMs: n("inputBufferMs"),
    fireRate: n("fireRate"),
    sightCells: n("sightCells"),
    pickReach: n("pickReach"),
    hitSlowMs: n("hitSlowMs"),
    shot: group("shot", ["damage"]),
    punch: group("punch", ["damage", "reach"]),
    energy: group("energy", ["max", "hit", "shields"]),
    ammo: n("ammo"),
    blaster: group("blaster", ["tickHz", "damage", "ammo"]),
    respawnMs: n("respawnMs"),
    deathSlide: n("deathSlide"),
  };
}

const oneOf = <T extends string>(values: readonly T[]) => (v: unknown, path: string): T =>
  values.includes(v as T) ? (v as T) : fail(path, `must be one of ${values.join(", ")}`);

const joints = (v: unknown, path: string): Record<string, number> =>
  Object.fromEntries(Object.entries(obj(v, path)).map(([k, x]) => [k, finite(x, `${path}.${k}`)]));

const track = <T>(read: (v: unknown, path: string) => T) => (v: unknown, path: string, duration: number): [number, T][] => {
  const keys = list(v, path).map((entry, i): [number, T] => {
    const [t, value] = list(entry, `${path}[${i}]`);
    return [finite(t, `${path}[${i}]`), read(value, `${path}[${i}]`)];
  });
  if (keys.length === 0) fail(path, "must not be empty");
  keys.forEach(([t], i) => {
    if (t < 0 || t > duration) fail(path, `time ${t} is outside [0, ${duration}]`);
    if (i > 0 && t < keys[i - 1]![0]) fail(path, "times must be sorted");
  });
  return keys;
};

const poseTrack = track(joints);
const viewTrack = track(oneOf(["side", "front", "back"] as const));
const numTrack = track(finite);
const gunTrack = track(oneOf(["hand", "none", "dropped"] as const));
const eventTrack = track(text);

function loadClip(v: unknown, path: string): Clip {
  const o = obj(v, path);
  const duration = positive(o.duration, `${path}.duration`);
  if (typeof o.loop !== "boolean") fail(`${path}.loop`, "must be a boolean");
  const opt = <T>(key: string, read: (v: unknown, path: string, duration: number) => T): T | undefined =>
    o[key] === undefined ? undefined : read(o[key], `${path}.${key}`, duration);
  const gait = o.gait === undefined ? undefined : oneOf(["walk", "run"] as const)(o.gait, `${path}.gait`);
  const keyless = gait !== undefined && o.blend === undefined && o.pose === undefined;
  const pose = keyless ? [] : poseTrack(o.pose, `${path}.pose`, duration);
  const clip: Clip = { duration, loop: o.loop as boolean, pose };
  const fields = {
    travel: opt("travel", finite),
    gait,
    blend: opt("blend", positive),
    base: opt("base", joints),
    cancelAt: opt("cancelAt", finite),
    view: opt("view", viewTrack),
    rot: opt("rot", numTrack),
    tint: opt("tint", numTrack),
    gun: opt("gun", gunTrack),
    events: opt("events", eventTrack),
  };
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) Object.assign(clip, { [key]: value });
  return clip;
}

export function loadClips(json: unknown): ClipSet {
  const clips = obj(obj(json, "clips file").clips, "clips");
  return Object.fromEntries(Object.entries(clips).map(([name, v]) => [name, loadClip(v, name)]));
}

export const holdsGun = (weapon: Weapon): boolean => weapon !== "fists";

const weaponClips: Partial<Record<HeroState, Record<"fists" | "gun", string>>> = {
  attack: { fists: "punch", gun: "shoot" },
  duckAttack: { fists: "duckPunch", gun: "duckShoot" },
  use: { fists: "use", gun: "useGun" },
};

export const clipFor = (state: HeroState, weapon: Weapon): string => weaponClips[state]?.[holdsGun(weapon) ? "gun" : "fists"] ?? state;
