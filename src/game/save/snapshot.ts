import { createFog } from "../fog";
import type { MovementConfig } from "../hero/config";
import { createHero, type Hero } from "../hero/hero";
import { ITEMS, type ItemId } from "../items";
import type { Enemy } from "../level/enemy";
import { resetWorld, type Inventory, type Prop, type SandboxWorld } from "../level/sandboxLevel";
import { applyBlocks } from "../level/tasks";

export const SAVE_VERSION = 2;

const PROP_TYPES = { taken: "boolean", on: "boolean", state: "number", hitsTaken: "number", fireTime: "number", pauseLeft: "number", brokenAge: "number" } as const;
const PROP_FIELDS = Object.keys(PROP_TYPES) as (keyof typeof PROP_TYPES)[];
const NULLABLE_PROP = new Set(["fireTime"]);
const HERO_NULLABLE = new Set(["blaster", "fallGait", "landing", "hitAge", "fireTime"]);
const FLAG_PREFIXES = ["flag:", "task:"];

export type PropState = Partial<Pick<Prop, (typeof PROP_FIELDS)[number]>>;

export interface Snapshot {
  version: number;
  counts: { props: number; lifts: number; enemies: number };
  hero: Hero;
  lifts: { y: number; target: number | null }[];
  props: PropState[];
  enemies: Enemy[];
  flags: string[];
  inventory: Inventory;
  fog: string | null;
  complete: boolean;
  subtitle: string | null;
}

export type SaveProblem = "misfit" | "damaged";

const counts = (world: SandboxWorld): Snapshot["counts"] => ({ props: world.props.length, lifts: world.lifts.length, enemies: world.enemies.length });

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const propState = (prop: Prop): PropState => Object.fromEntries(PROP_FIELDS.filter((key) => prop[key] !== undefined).map((key) => [key, prop[key]]));

const packBits = (cells: Uint8Array): string => {
  const bytes = new Uint8Array(Math.ceil(cells.length / 8));
  cells.forEach((cell, i) => {
    if (cell) bytes[i >> 3]! |= 1 << (i & 7);
  });
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
};

const unpackBits = (text: string, length: number): Uint8Array | null => {
  let raw: string;
  try {
    raw = atob(text);
  } catch {
    return null;
  }
  if (raw.length !== Math.ceil(length / 8)) return null;
  return Uint8Array.from({ length }, (_, i) => (raw.charCodeAt(i >> 3) >> (i & 7)) & 1);
};

export function takeSnapshot(world: SandboxWorld, hero: Hero): Snapshot {
  return {
    version: SAVE_VERSION,
    counts: counts(world),
    hero: clone(hero),
    lifts: world.lifts.map(({ y, target }) => ({ y, target })),
    props: world.props.map(propState),
    enemies: clone(world.enemies),
    flags: [...world.flags],
    inventory: clone(world.inventory),
    fog: world.fog ? packBits(world.fog.revealed) : null,
    complete: world.complete,
    subtitle: world.subtitle?.text ?? null,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function sameShape(ref: unknown, value: unknown, nullable: ReadonlySet<string> = new Set(), key = ""): boolean {
  if (value === null) return ref === null || nullable.has(key);
  if (ref === null || ref === undefined) return finite(value) || typeof value === "string" || typeof value === "boolean" || isRecord(value);
  if (typeof ref === "number") return finite(value);
  if (Array.isArray(ref)) return Array.isArray(value) && value.every((item) => (ref.length ? sameShape(ref[0], item) : true));
  if (isRecord(ref)) return isRecord(value) && Object.keys(ref).every((k) => k in value && sameShape(ref[k], value[k], nullable, k));
  return typeof value === typeof ref;
}

const inside = (world: SandboxWorld, x: number, y: number): boolean => x >= 0 && x <= world.grid.width && y >= 0 && y <= world.grid.height;

function heroOk(world: SandboxWorld, hero: unknown): boolean {
  const ref = createHero(world.spawn, "gun", 1, 0, 0, false, 0);
  return sameShape(ref, hero, HERO_NULLABLE) && isRecord(hero) && inside(world, hero.x as number, hero.y as number);
}

const propOk = (value: unknown): boolean =>
  isRecord(value) &&
  Object.entries(value).every(([key, v]) => {
    const type = PROP_TYPES[key as keyof typeof PROP_TYPES];
    if (!type) return false;
    if (v === null) return NULLABLE_PROP.has(key);
    return type === "number" ? finite(v) : typeof v === type;
  });

const liftOk = (world: SandboxWorld, value: unknown): boolean =>
  isRecord(value) && finite(value.y) && inside(world, 0, value.y) && (value.target === null || finite(value.target));

const inventoryOk = (value: unknown): boolean => {
  if (!isRecord(value) || !Array.isArray(value.items) || !value.items.every((id) => typeof id === "string" && id in ITEMS)) return false;
  return value.shown === null || (typeof value.shown === "string" && (value.items as ItemId[]).includes(value.shown as ItemId));
};

const listOf = (value: unknown, length: number): value is unknown[] => Array.isArray(value) && value.length === length;

export function checkSnapshot(world: SandboxWorld, snap: unknown): SaveProblem | null {
  if (!isRecord(snap) || snap.version !== SAVE_VERSION || !isRecord(snap.counts)) return "misfit";
  const now = counts(world);
  if (snap.counts.props !== now.props || snap.counts.lifts !== now.lifts || snap.counts.enemies !== now.enemies) return "misfit";
  const fogLength = world.grid.width * world.grid.height;
  const ok =
    heroOk(world, snap.hero) &&
    listOf(snap.lifts, now.lifts) &&
    snap.lifts.every((lift) => liftOk(world, lift)) &&
    listOf(snap.props, now.props) &&
    snap.props.every(propOk) &&
    listOf(snap.enemies, now.enemies) &&
    snap.enemies.every((enemy, i) => sameShape(world.enemies[i], enemy, new Set(["respawnMs", "deadAge", "alertAge", "flight", "fireTime", "blaster", "fallGait", "landing", "hitAge"]))) &&
    Array.isArray(snap.flags) &&
    snap.flags.every((flag) => typeof flag === "string" && FLAG_PREFIXES.some((p) => flag.startsWith(p))) &&
    inventoryOk(snap.inventory) &&
    (snap.fog === null || (typeof snap.fog === "string" && unpackBits(snap.fog, fogLength) !== null)) &&
    typeof snap.complete === "boolean" &&
    (snap.subtitle === null || typeof snap.subtitle === "string");
  return ok ? null : "damaged";
}

function apply(world: SandboxWorld, hero: Hero, snap: Snapshot, cfg: MovementConfig): void {
  resetWorld(world, cfg);
  Object.assign(hero, createHero(world.spawn, "gun", cfg.energy.max), clone(snap.hero));
  snap.lifts.forEach((saved, i) => Object.assign(world.lifts[i]!, saved, { vy: 0 }));
  snap.props.forEach((saved, i) => {
    const prop = world.props[i]!;
    for (const key of PROP_FIELDS) delete prop[key];
    Object.assign(prop, saved);
  });
  world.enemies = clone(snap.enemies);
  world.flags = new Set(snap.flags);
  world.inventory = clone(snap.inventory);
  world.complete = snap.complete;
  world.subtitle = snap.subtitle === null ? null : { text: snap.subtitle, age: 0 };
  applyBlocks(world);
  if (world.fog && snap.fog) {
    const fog = createFog(world.fog.cfg, cfg, hero, world.grid);
    unpackBits(snap.fog, fog.revealed.length)!.forEach((cell, i) => (fog.revealed[i] ||= cell));
    fog.version++;
    world.fog = fog;
  }
}

export function loadSnapshot(world: SandboxWorld, hero: Hero, snap: unknown, cfg: MovementConfig): SaveProblem | null {
  const problem = checkSnapshot(world, snap);
  if (problem) return problem;
  const backup = takeSnapshot(world, hero);
  try {
    apply(world, hero, snap as Snapshot, cfg);
    return null;
  } catch {
    apply(world, hero, backup, cfg);
    return "damaged";
  }
}
