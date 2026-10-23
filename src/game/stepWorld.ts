import type { InputFrame } from "../engine/input";
import { updateFog } from "./fog";
import type { ClipSet, MovementConfig } from "./hero/config";
import { halt, isDead, touchFilms, updateHero, type Hero, type HeroEvent } from "./hero/hero";
import { inSparks, stepConveyors, stepHazards } from "./level/hazards";
import { approachFilms, resetWorld, updateLift, type SandboxWorld } from "./level/sandboxLevel";
import { updateEnemy } from "./level/enemy";
import { cue } from "./sound/cues";
import { explode, siren, spark } from "./sound/triggers";
import { ageSparks, fireBeam, fireEnemy, fireGuards, fireShots, landPunches } from "./shots";

export const SUBTITLE_MS = 8000;
export const SUBTITLE_FADE_MS = 1500;

export const subtitleOpacity = (age: number): number => Math.max(0, Math.min(1, 1 - (age - SUBTITLE_MS) / SUBTITLE_FADE_MS));

function ageSubtitle(world: SandboxWorld, dt: number): void {
  if (!world.subtitle) return;
  world.subtitle.age += dt * 1000;
  if (world.subtitle.age >= SUBTITLE_MS + SUBTITLE_FADE_MS) world.subtitle = null;
}

function worldSounds(world: SandboxWorld, hero: Hero, events: HeroEvent[], dt: number): void {
  for (const e of events) {
    if (e.kind === "shield") cue(world, "power", 20000);
    if (e.kind === "died") explode(world);
  }
  siren(world, hero.energy, !isDead(hero.state) && world.cutscene === null, dt);
  spark(world, inSparks(world, hero), dt);
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
  for (const enemy of world.enemies) fireEnemy(world, enemy, updateEnemy(enemy, world.grid, world.fog, hero, clips, cfg, dt));
  fireGuards(world, hero, cfg, dt);
  ageSparks(world, dt);
  for (const lift of world.lifts) {
    const moving = lift.target !== null;
    updateLift(lift, cfg.liftSpeed, dt);
    if (moving && lift.target === null) cue(world, "liftStop", 8000);
  }
  const events = updateHero(hero, input, world, cfg, clips, dt, consume);
  stepConveyors(world, hero, cfg, dt);
  stepHazards(world, hero, cfg, dt, events);
  if (!isDead(hero.state)) {
    approachFilms(world, hero, cfg.box.height);
    touchFilms(world, hero, cfg);
  }
  fireShots(world, hero, events, clips, cfg);
  fireBeam(world, hero, events, clips, cfg);
  landPunches(world, hero, events, cfg);
  worldSounds(world, hero, events, dt);
  if (events.some((e) => e.kind === "respawned")) resetWorld(world, cfg);
  if (!filming && world.cutscene) {
    if (hero.onGround) halt(hero);
    consume("menu");
  }
  return events;
}
