import type { SandboxWorld } from "../level/sandboxLevel";
import { runUse } from "../level/tasks";
import { CUTSCENES } from "./index";

const END_EPSILON = 1e-9;

export function stepCutscene(world: SandboxWorld, dt: number, skip: boolean): boolean {
  const film = world.cutscene;
  if (!film) return false;
  film.t += dt;
  if (!skip && film.t < CUTSCENES[film.id].duration - END_EPSILON) return true;
  world.cutscene = null;
  runUse(world, film.prop);
  return false;
}
