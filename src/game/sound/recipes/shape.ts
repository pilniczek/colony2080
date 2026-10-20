import { BASE_RATE, buffer, fill, quantize8, seeded } from "../../../engine/audio/synth";

export const render = (seconds: number, sample: (t: number, i: number) => number): Float32Array => quantize8(fill(buffer(seconds), sample));

export const clip = (x: number, drive: number): number => Math.tanh(x * drive) / Math.tanh(drive);

export const grain = (level: number, until: number): ((t: number) => number) => {
  const noise = seeded(99);
  return (t) => (t < until ? level * noise() : 0);
};

export function steady(seconds: number, source: (t: number) => number, windowSeconds = 0.005): Float32Array {
  const raw = fill(buffer(seconds), (t) => source(t));
  const half = Math.max(1, Math.round((windowSeconds * BASE_RATE) / 2));
  const energy = new Float64Array(raw.length + 1);
  raw.forEach((x, i) => (energy[i + 1] = energy[i]! + x * x));
  return raw.map((x, i) => {
    const from = Math.max(0, i - half);
    const to = Math.min(raw.length, i + half);
    const power = (energy[to]! - energy[from]!) / (to - from);
    return power > 0 ? x / Math.sqrt(power) : 0;
  });
}

export const steps = (width: number, levels: number[]): ((t: number) => number) => (t) => levels[Math.floor(t / width)] ?? 0;
