export const BASE_RATE = 11025;

type Shape = "sine" | "square" | "saw" | "triangle";

const TAU = Math.PI * 2;

export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return (((z ^ (z >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

export function buffer(seconds: number): Float32Array {
  return new Float32Array(Math.round(seconds * BASE_RATE));
}

export function envelope(points: [number, number][]): (t: number) => number {
  return (t) => {
    if (t < points[0][0]) return 0;
    for (let i = 1; i < points.length; i++) {
      const [t1, v1] = points[i];
      if (t <= t1) {
        const [t0, v0] = points[i - 1];
        return t1 === t0 ? v1 : v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
      }
    }
    return 0;
  };
}

function wave(shape: Shape, phase: number): number {
  switch (shape) {
    case "sine":
      return Math.sin(phase * TAU);
    case "square":
      return phase < 0.5 ? 1 : -1;
    case "saw":
      return phase * 2 - 1;
    case "triangle":
      return 1 - 4 * Math.abs(phase - 0.5);
  }
}

export function osc(shape: Shape, freq: (t: number) => number): (t: number) => number {
  let phase = 0;
  return (t) => {
    const value = wave(shape, phase);
    phase = (phase + freq(t) / BASE_RATE) % 1;
    return value;
  };
}

export function onePole(cutoff: number, kind: "low" | "high"): (x: number) => number {
  const alpha = 1 - Math.exp((-TAU * cutoff) / BASE_RATE);
  let low = 0;
  return (x) => {
    low += alpha * (x - low);
    return kind === "low" ? low : x - low;
  };
}

export function biquad(kind: "low" | "high" | "band", freq: number, q: number): (x: number) => number {
  const w = (TAU * freq) / BASE_RATE;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  const [n0, n1, n2] =
    kind === "low"
      ? [(1 - cos) / 2, 1 - cos, (1 - cos) / 2]
      : kind === "high"
        ? [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2]
        : [alpha, 0, -alpha];
  const b0 = n0 / a0;
  const b1 = n1 / a0;
  const b2 = n2 / a0;
  const a1 = (-2 * cos) / a0;
  const a2 = (1 - alpha) / a0;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (x) => {
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
}

export function fill(out: Float32Array, fn: (t: number, i: number) => number): Float32Array {
  for (let i = 0; i < out.length; i++) out[i] = fn(i / BASE_RATE, i);
  return out;
}

export function quantize8(samples: Float32Array): Float32Array {
  return samples.map((x) => {
    const level = Math.min(127, Math.max(-128, Math.round(x * 127.5 - 0.5)));
    return (level + 0.5) / 127.5;
  });
}
