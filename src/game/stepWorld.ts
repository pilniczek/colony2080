import type { InputFrame } from "../engine/input";
import { stepProjectiles } from "../engine/world/projectiles";
import type { ClipSet, MovementConfig } from "./hero/config";
import { updateHero, type Hero, type HeroEvent } from "./hero/hero";
import { updateEmitter, updateLift, type SandboxWorld } from "./level/sandboxLevel";

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
  world.projectiles = stepProjectiles(world.projectiles, world.grid, dt);
  updateLift(world.lift, cfg.liftSpeed, dt);
  return updateHero(hero, input, world, cfg, clips, dt, consume);
}
