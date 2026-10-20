import { SOUNDS, type SoundId } from "../sound/index";
import { FILM_CONFIGS } from "./configs";
import type { CutsceneId } from "./index";

export type FilmSound = [t: number, id: SoundId, rate: number, vol?: number];

const isSoundId = (id: unknown): id is SoundId => typeof id === "string" && id in SOUNDS;

export function filmSounds(film: string, raw: unknown): FilmSound[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new Error(`${film}: sounds must be an array`);
  return raw.map((entry: unknown) => {
    if (!Array.isArray(entry) || typeof entry[0] !== "number" || !isSoundId(entry[1]) || typeof entry[2] !== "number" || (entry[3] !== undefined && typeof entry[3] !== "number")) {
      throw new Error(`${film}: bad sound cue ${JSON.stringify(entry)}`);
    }
    return entry as FilmSound;
  });
}

const SOUNDS_OF = new Map([...FILM_CONFIGS].map(([id, config]) => [id, filmSounds(id, config.sounds)]));

export const soundsOf = (id: CutsceneId): FilmSound[] => SOUNDS_OF.get(id) ?? [];
