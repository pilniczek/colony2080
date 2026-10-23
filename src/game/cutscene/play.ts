import type { Prop, SandboxWorld } from "../level/sandboxLevel";
import { openTask, runUse } from "../level/tasks";
import { cue } from "../sound/cues";
import { FILM_CONFIGS } from "./configs";
import { filmOf, loadFilm, type CutsceneId } from "./index";
import { soundsOf } from "./sounds";

const END_EPSILON = 1e-9;
const SKIP_ACTIONS = ["menu", "useItem"];

export const captionOf = (id: CutsceneId): number | undefined => {
  const at = FILM_CONFIGS.get(id)?.caption;
  return typeof at === "number" ? at : undefined;
};

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
  if (!skip && film.prop) captionBetween(world, film.id, film.prop, from, film.t);
  if (!skip && film.t < scene!.duration - END_EPSILON) return true;
  world.cutscene = null;
  world.heroHits = 0;
  world.sparks.length = 0;
  world.beam = null;
  if (film.prop) runUse(world, film.prop, { filmed: true });
  return false;
}

function captionBetween(world: SandboxWorld, id: CutsceneId, prop: Prop, from: number, to: number): void {
  const at = captionOf(id);
  const text = openTask(world, prop)?.subtitle;
  if (at !== undefined && text && (at > from || (from === 0 && at === 0)) && at <= to) world.subtitle = { text, age: 0, film: true };
}

function cueBetween(world: SandboxWorld, id: CutsceneId, from: number, to: number): void {
  for (const [t, sound, rate, vol] of soundsOf(id)) if ((t > from || (from === 0 && t === 0)) && t <= to) cue(world, sound, rate, vol);
}

export type FilmStep = "playing" | "ended" | "skipped";

export function playFilm(world: SandboxWorld, input: FilmInput, dt: number): FilmStep {
  const skip = SKIP_ACTIONS.some((action) => input.consume(action));
  if (stepCutscene(world, dt, skip)) return "playing";
  input.clearPresses();
  return skip ? "skipped" : "ended";
}
