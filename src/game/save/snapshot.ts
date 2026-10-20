import { createFog } from "../fog";
import type { MovementConfig } from "../hero/config";
import type { Hero } from "../hero/hero";
import type { Enemy } from "../level/enemy";
import { resetWorld, type Inventory, type Prop, type SandboxWorld } from "../level/sandboxLevel";
import { applyBlocks } from "../level/tasks";

export const SAVE_VERSION = 1;

const PROP_FIELDS = ["taken", "on", "state", "hitsTaken", "fireTime", "pauseLeft", "brokenAge"] as const;

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
}

const counts = (world: SandboxWorld): Snapshot["counts"] => ({ props: world.props.length, lifts: world.lifts.length, enemies: world.enemies.length });

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const propState = (prop: Prop): PropState => Object.fromEntries(PROP_FIELDS.filter((key) => prop[key] !== undefined).map((key) => [key, prop[key]]));

const toBase64 = (bytes: Uint8Array): string => {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
};

const fromBase64 = (text: string): Uint8Array => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

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
    fog: world.fog ? toBase64(world.fog.revealed) : null,
  };
}

export function fits(world: SandboxWorld, snap: Snapshot): boolean {
  const now = counts(world);
  return snap.version === SAVE_VERSION && snap.counts.props === now.props && snap.counts.lifts === now.lifts && snap.counts.enemies === now.enemies;
}

export function applySnapshot(world: SandboxWorld, hero: Hero, snap: Snapshot, cfg: MovementConfig): void {
  resetWorld(world, cfg);
  Object.assign(hero, clone(snap.hero));
  snap.lifts.forEach((saved, i) => Object.assign(world.lifts[i]!, saved, { vy: 0 }));
  snap.props.forEach((saved, i) => {
    const prop = world.props[i]!;
    for (const key of PROP_FIELDS) delete prop[key];
    Object.assign(prop, saved);
  });
  world.enemies = clone(snap.enemies);
  world.flags = new Set(snap.flags);
  world.inventory = clone(snap.inventory);
  applyBlocks(world);
  if (world.fog && snap.fog) {
    const fog = createFog(world.fog.cfg, cfg, hero, world.grid);
    fromBase64(snap.fog).forEach((cell, i) => (fog.revealed[i] ||= cell));
    fog.version++;
    world.fog = fog;
  }
}
