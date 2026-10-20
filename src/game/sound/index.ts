export type SoundId = never;

export const SOUNDS: Record<SoundId, () => Float32Array> = {};

export function samplesOf(id: SoundId): Float32Array {
  return SOUNDS[id]();
}
