import { beam, cannon, explosion, gunShot, laser, punch } from "./recipes/combat";
import { click, door, grate, inventory, land, liftStart, liftStop, power, siren, spark, step, teleport, thunder } from "./recipes/world";

export const SOUNDS = { gunShot, cannon, laser, beam, punch, explosion, step, land, click, inventory, power, siren, liftStart, liftStop, door, grate, thunder, teleport, spark } satisfies Record<string, () => Float32Array>;

export type SoundId = keyof typeof SOUNDS;

const rendered = new Map<string, Float32Array>();

export function samplesOf(id: string): Float32Array {
  const cached = rendered.get(id);
  if (cached) return cached;
  if (!(id in SOUNDS)) throw new Error(`Unknown sound ${id}`);
  const samples = SOUNDS[id as SoundId]();
  rendered.set(id, samples);
  return samples;
}
