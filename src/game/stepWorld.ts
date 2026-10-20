import type { InputFrame } from "../engine/input";
import { updateFog } from "./fog";
import type { ClipSet, MovementConfig } from "./hero/config";
import { halt, isDead, updateHero, type Hero, type HeroEvent } from "./hero/hero";
import { inSparks, stepConveyors, stepHazards } from "./level/hazards";
import { approachFilms, resetWorld, updateLift, type SandboxWorld } from "./level/sandboxLevel";
import { updateEnemy } from "./level/enemy";
import { cue } from "./sound/cues";
import { siren, spark, thunder } from "./sound/triggers";
import { fireBeam, fireEnemy, fireGuards, fireShots, landPunches, stepShots } from "./shots";

export const SUBTITLE_MS = 3500;

function ageSubtitle(world: SandboxWorld, dt: number): void {
  if (!world.subtitle) return;
  world.subtitle.age += dt * 1000;
  if (world.subtitle.age >= SUBTITLE_MS) world.subtitle = null;
}

function worldSounds(world: SandboxWorld, hero: Hero, events: HeroEvent[], filming: boolean, dt: number): void {
  for (const e of events) if (e.kind === "shield") cue(world, "power", 20000);
  siren(world, hero.energy, !isDead(hero.state), dt);
  spark(world, inSparks(world, hero), dt);
  if (world.mission === "mesto" && !filming) thunder(world, dt);
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
  const filming = world.cutscene !== null;
  ageSubtitle(world, dt);
  if (world.fog) updateFog(world.fog, hero, cfg, dt);
  for (const enemy of world.enemies) fireEnemy(world, cfg, clips, enemy, updateEnemy(enemy, world.grid, world.fog, hero, clips, cfg, dt));
  fireGuards(world, hero, cfg, dt);
  stepShots(world, cfg, dt);
  for (const lift of world.lifts) {
    const moving = lift.target !== null;
    updateLift(lift, cfg.liftSpeed, dt);
    if (moving && lift.target === null) cue(world, "liftStop", 8000);
  }
  const events = updateHero(hero, input, world, cfg, clips, dt, consume);
  stepConveyors(world, hero, cfg, dt);
  stepHazards(world, hero, cfg, dt, events);
  if (!isDead(hero.state) && hero.onGround) approachFilms(world, hero);
  fireShots(world, hero, events, clips, cfg);
  fireBeam(world, hero, events, clips, cfg);
  landPunches(world, hero, events, cfg);
  worldSounds(world, hero, events, filming, dt);
  if (events.some((e) => e.kind === "respawned")) resetWorld(world, cfg);
  if (!filming && world.cutscene) {
    halt(hero);
    consume("menu");
  }
  return events;
}
