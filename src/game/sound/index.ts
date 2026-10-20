export type SoundId = never;

export const SOUNDS: Record<SoundId, () => Float32Array> = {};

export function samplesOf(id: SoundId): Float32Array {
  const recipes: Record<string, () => Float32Array> = SOUNDS;
  return recipes[id]!();
}
