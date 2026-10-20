import { beam, cannon, explosion, gunShot, laser, punch } from "./recipes/combat";

export const SOUNDS = { gunShot, cannon, laser, beam, punch, explosion } satisfies Record<string, () => Float32Array>;

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
