import type { InputFrame } from "../engine/input";
import type { ClipSet, MovementConfig } from "./hero/config";
import { updateHero, type Hero, type HeroEvent } from "./hero/hero";
import { updateEmitter, updateLift, type SandboxWorld } from "./level/sandboxLevel";
import { fireShots, stepShots } from "./shots";

export function stepWorld(
  world: SandboxWorld,
  hero: Hero,
  input: InputFrame,
  cfg: MovementConfig,
  clips: ClipSet,
  dt: number,
  consume: (action: string) => boolean,
): HeroEvent[] {
  updateEmitter(world, dt);
  stepShots(world, cfg, dt);
  updateLift(world.lift, cfg.liftSpeed, dt);
  const events = updateHero(hero, input, world, cfg, clips, dt, consume);
  fireShots(world, hero, events, clips, cfg);
  return events;
}
