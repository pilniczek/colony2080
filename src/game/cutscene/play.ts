import type { SandboxWorld } from "../level/sandboxLevel";
import { runUse } from "../level/tasks";
import { filmOf, loadFilm } from "./index";

const END_EPSILON = 1e-9;
const SKIP_ACTIONS = ["menu", "useItem"];

export interface FilmInput {
  clearPresses(): void;
  consume(action: string): boolean;
}

export function stepCutscene(world: SandboxWorld, dt: number, skip: boolean): boolean {
  const film = world.cutscene;
  if (!film) return false;
  const scene = filmOf(film.id);
  if (!scene && !skip) {
    void loadFilm(film.id);
    return true;
  }
  film.t += dt;
  if (!skip && film.t < scene!.duration - END_EPSILON) return true;
  world.cutscene = null;
  world.projectiles.length = 0;
  world.sparks.length = 0;
  world.beam = null;
  if (film.prop) runUse(world, film.prop);
  return false;
}

export function playFilm(world: SandboxWorld, input: FilmInput, dt: number): boolean {
  const skip = SKIP_ACTIONS.some((action) => input.consume(action));
  const playing = stepCutscene(world, dt, skip);
  if (!playing) input.clearPresses();
  return playing;
}
