import type { InputFrame } from "../engine/input";
import { updateFog } from "./fog";
import type { ClipSet, MovementConfig } from "./hero/config";
import { isDead, updateHero, type Hero, type HeroEvent } from "./hero/hero";
import { approachFilms, resetWorld, updateLift, type SandboxWorld } from "./level/sandboxLevel";
import { updateEnemy } from "./level/enemy";
import { fireBeam, fireEnemy, fireGuards, fireShots, landPunches, stepShots } from "./shots";

export const SUBTITLE_MS = 3500;

function ageSubtitle(world: SandboxWorld, dt: number): void {
  if (!world.subtitle) return;
  world.subtitle.age += dt * 1000;
  if (world.subtitle.age >= SUBTITLE_MS) world.subtitle = null;
}

export function stepWorld(
  world: SandboxWorld,
  hero: Hero,
  input: InputFrame,
  cfg: MovementConfig,
  clips: ClipSet,
  dt: number,
  consume: (action: string) => boolean,
): HeroEvent[] {
  if (world.complete) return [];
  ageSubtitle(world, dt);
  if (world.fog) updateFog(world.fog, hero, cfg, dt);
  for (const enemy of world.enemies) fireEnemy(world, cfg, clips, enemy, updateEnemy(enemy, world.grid, world.fog, hero, clips, cfg, dt));
  fireGuards(world, hero, cfg, dt);
  stepShots(world, cfg, dt);
  for (const lift of world.lifts) updateLift(lift, cfg.liftSpeed, dt);
  const events = updateHero(hero, input, world, cfg, clips, dt, consume);
  if (!isDead(hero.state) && hero.onGround) approachFilms(world, hero);
  fireShots(world, hero, events, clips, cfg);
  fireBeam(world, hero, events, clips, cfg);
  landPunches(world, hero, events, cfg);
  if (events.some((e) => e.kind === "respawned")) resetWorld(world, cfg);
  return events;
}
