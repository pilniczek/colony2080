import type { InputFrame } from "../engine/input";
import { updateFog } from "./fog";
import type { ClipSet, MovementConfig } from "./hero/config";
import { updateHero, type Hero, type HeroEvent } from "./hero/hero";
import { updateLift, type SandboxWorld } from "./level/sandboxLevel";
import { updateEnemy } from "./level/enemy";
import { fireEnemy, fireShots, stepShots } from "./shots";

export function stepWorld(
  world: SandboxWorld,
  hero: Hero,
  input: InputFrame,
  cfg: MovementConfig,
  clips: ClipSet,
  dt: number,
  consume: (action: string) => boolean,
): HeroEvent[] {
  if (world.fog) updateFog(world.fog, hero, cfg.box.height, dt);
  fireEnemy(world, cfg, clips, updateEnemy(world.enemy, world.grid, hero, clips, dt));
  stepShots(world, cfg, dt);
  updateLift(world.lift, cfg.liftSpeed, dt);
  const events = updateHero(hero, input, world, cfg, clips, dt, consume);
  fireShots(world, hero, events, clips, cfg);
  return events;
}
