import clipsJson from "@config/hero/clips.json";
import movementJson from "@config/hero/movement.json";
import sandbox from "@config/levels/sandbox.json";
import { loadSandbox, type SandboxWorld } from "../level/sandboxLevel";
import { stepWorld } from "../stepWorld";
import { loadClips, loadMovement, type HeroState, type Weapon } from "./config";
import { createHero, type Hero, type HeroEvent } from "./hero";

export const dt = 1 / 60;
export const cfg = loadMovement(movementJson);
export const clips = loadClips(clipsJson);

export interface Game {
  world: SandboxWorld;
  hero: Hero;
  events: HeroEvent[];
  seen: Set<HeroState>;
  frame: number;
  buffer: Map<string, number>;
}

export function game(
  at?: { x: number; y: number; state?: HeroState; weapon?: Weapon },
  level: unknown = sandbox,
): Game {
  const world = loadSandbox(level);
  const hero = createHero(world.spawn, "fists", cfg.energy.max, 0, cfg.ammo);
  if (at) Object.assign(hero, at);
  return { world, hero, events: [], seen: new Set([hero.state]), frame: 0, buffer: new Map() };
}

export const bottomlessPits = { ...sandbox, rows: sandbox.rows.slice(0, 16), lifts: sandbox.lifts.slice(0, 1) };

export const RUNNING = "running";

export function tick(g: Game, held: string[] = [], pressed: string[] = []): void {
  if (held.includes(RUNNING)) g.hero.running = true;
  const dir = held.includes("moveRight") ? 1 : held.includes("moveLeft") ? -1 : 0;
  for (const action of pressed) g.buffer.set(action, g.frame);
  for (const [action, at] of g.buffer) if ((g.frame - at) * dt * 1000 > cfg.inputBufferMs) g.buffer.delete(action);
  const input = { held: new Set(held), pressed: new Set(g.buffer.keys()), dir } as const;
  g.events.push(...stepWorld(g.world, g.hero, input, cfg, clips, dt, (action) => g.buffer.delete(action)));
  g.seen.add(g.hero.state);
  g.frame++;
}

export function run(g: Game, seconds: number, held: string[] = []): void {
  for (let i = 0; i < Math.round(seconds * 60); i++) tick(g, held);
}

export function runUntil(g: Game, done: (h: Hero) => boolean, held: string[] = [], seconds = 10): void {
  for (let i = 0; i < seconds * 60 && !done(g.hero); i++) tick(g, held);
}
