import type { SandboxWorld } from "../level/sandboxLevel";
import { runUse } from "../level/tasks";
import { cue } from "../sound/cues";
import { filmOf, loadFilm, type CutsceneId } from "./index";
import { soundsOf } from "./sounds";

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
  const from = film.t;
  film.t += dt;
  if (!skip) cueBetween(world, film.id, from, film.t);
  if (!skip && film.t < scene!.duration - END_EPSILON) return true;
  world.cutscene = null;
  world.projectiles.length = 0;
  world.sparks.length = 0;
  world.beam = null;
  if (film.prop) runUse(world, film.prop, { filmed: true });
  return false;
}

function cueBetween(world: SandboxWorld, id: CutsceneId, from: number, to: number): void {
  for (const [t, sound, rate, vol] of soundsOf(id)) if ((t > from || (from === 0 && t === 0)) && t <= to) cue(world, sound, rate, vol);
}

export function playFilm(world: SandboxWorld, input: FilmInput, dt: number): boolean {
  const skip = SKIP_ACTIONS.some((action) => input.consume(action));
  const playing = stepCutscene(world, dt, skip);
  if (!playing) input.clearPresses();
  return playing;
}
