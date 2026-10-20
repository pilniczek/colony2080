import { readFileSync } from "node:fs";
import { BASE_RATE } from "../../src/engine/audio/synth";

const FRAME = 512;
const HOP = 128;
const BAND_BINS = 16;
const QUANTIZATION_FLOOR_DB = -50;

export function readSnd(path: string): Float32Array {
  const bytes = readFileSync(path);
  return Float32Array.from(bytes, (b) => (b - 128) / 128);
}

export function envelope(samples: Float32Array, windowMs = 10): Float32Array {
  const size = Math.max(1, Math.round((BASE_RATE * windowMs) / 1000));
  const out = new Float32Array(Math.ceil(samples.length / size));
  for (let w = 0; w < out.length; w++) {
    const end = Math.min(samples.length, (w + 1) * size);
    let sum = 0;
    for (let i = w * size; i < end; i++) sum += samples[i]! * samples[i]!;
    out[w] = Math.sqrt(sum / (end - w * size));
  }
  return out;
}

export function envelopeCorrelation(a: Float32Array, b: Float32Array): number {
  const ea = envelope(a);
  const eb = envelope(b);
  const n = Math.max(ea.length, eb.length);
  const at = (e: Float32Array, i: number) => e[i] ?? 0;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += at(ea, i);
    mb += at(eb, i);
  }
  ma /= n;
  mb /= n;
  let cov = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < n; i++) {
    const da = at(ea, i) - ma;
    const db = at(eb, i) - mb;
    cov += da * db;
    va += da * da;
    vb += db * db;
  }
  return va === 0 || vb === 0 ? (va === vb ? 1 : 0) : cov / Math.sqrt(va * vb);
}

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j]!, re[i]!];
      [im[i], im[j]] = [im[j]!, im[i]!];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    for (let start = 0; start < n; start += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(angle * k);
        const wi = Math.sin(angle * k);
        const p = start + k;
        const q = p + len / 2;
        const tr = re[q]! * wr - im[q]! * wi;
        const ti = re[q]! * wi + im[q]! * wr;
        re[q] = re[p]! - tr;
        im[q] = im[p]! - ti;
        re[p] = re[p]! + tr;
        im[p] = im[p]! + ti;
      }
    }
  }
}

export function spectrogram(samples: Float32Array): Float32Array[] {
  const frames: Float32Array[] = [];
  const count = Math.max(1, Math.ceil((samples.length - FRAME) / HOP) + 1);
  for (let f = 0; f < count; f++) {
    const re = new Float64Array(FRAME);
    const im = new Float64Array(FRAME);
    for (let i = 0; i < FRAME; i++) {
      const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FRAME - 1));
      re[i] = (samples[f * HOP + i] ?? 0) * hann;
    }
    fft(re, im);
    const power = new Float32Array(FRAME / 2);
    for (let k = 0; k < power.length; k++) {
      const magnitude = (2 * Math.hypot(re[k]!, im[k]!)) / FRAME;
      power[k] = magnitude * magnitude;
    }
    frames.push(power);
  }
  return frames;
}

const toDb = (power: number) => 10 * Math.log10(Math.max(power, 10 ** (QUANTIZATION_FLOOR_DB / 10)));

function bandDb(power: Float32Array): Float32Array {
  const bands = new Float32Array(power.length / BAND_BINS);
  for (let b = 0; b < bands.length; b++) {
    let sum = 0;
    for (let k = b * BAND_BINS; k < (b + 1) * BAND_BINS; k++) sum += power[k]!;
    bands[b] = toDb(sum / BAND_BINS);
  }
  return bands;
}

export function spectralDistance(a: Float32Array, b: Float32Array): number {
  const sa = spectrogram(a);
  const sb = spectrogram(b);
  const frames = Math.min(sa.length, sb.length);
  let total = 0;
  let counted = 0;
  for (let f = 0; f < frames; f++) {
    const fa = bandDb(sa[f]!);
    const fb = bandDb(sb[f]!);
    for (let k = 0; k < fa.length; k++) {
      if (fa[k] === QUANTIZATION_FLOOR_DB && fb[k] === QUANTIZATION_FLOOR_DB) continue;
      total += Math.abs(fa[k]! - fb[k]!);
      counted++;
    }
  }
  return counted === 0 ? 0 : total / counted;
}

export function rms(samples: Float32Array): number {
  let sum = 0;
  for (const v of samples) sum += v * v;
  return samples.length === 0 ? 0 : Math.sqrt(sum / samples.length);
}

export function centroids(samples: Float32Array): Float32Array {
  return Float32Array.from(spectrogram(samples), (bins) => {
    let weight = 0;
    let moment = 0;
    for (let k = 0; k < bins.length; k++) {
      const power = bins[k]!;
      weight += power;
      moment += power * ((k * BASE_RATE) / FRAME);
    }
    return moment / weight;
  });
}
