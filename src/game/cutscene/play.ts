import type { SandboxWorld } from "../level/sandboxLevel";
import { runUse } from "../level/tasks";
import { CUTSCENES } from "./index";

const END_EPSILON = 1e-9;
const SKIP_ACTIONS = ["menu", "useItem"];

export interface FilmInput {
  frame(): unknown;
  clearPresses(): void;
  consume(action: string): boolean;
}

export function stepCutscene(world: SandboxWorld, dt: number, skip: boolean): boolean {
  const film = world.cutscene;
  if (!film) return false;
  film.t += dt;
  if (!skip && film.t < CUTSCENES[film.id].duration - END_EPSILON) return true;
  world.cutscene = null;
  runUse(world, film.prop);
  return false;
}

export function playFilm(world: SandboxWorld, input: FilmInput, dt: number, fresh: boolean): boolean {
  input.frame();
  if (fresh) input.clearPresses();
  const skip = !fresh && SKIP_ACTIONS.some((action) => input.consume(action));
  const playing = stepCutscene(world, dt, skip);
  if (!playing) input.clearPresses();
  return playing;
}
