import { describe, expect, it } from "vitest";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BASE_RATE, onePole, seeded } from "../../src/engine/audio/synth";
import { centroids, envelope, envelopeCorrelation, readSnd, spectralDistance } from "./metrics";

const burst = (length: number, offset: number, total: number): Float32Array => {
  const rand = seeded(7);
  const out = new Float32Array(total);
  for (let i = 0; i < length; i++) out[offset + i] = rand() * 2 - 1;
  return out;
};

const sine = (freq: number, seconds: number): Float32Array =>
  Float32Array.from({ length: Math.round(BASE_RATE * seconds) }, (_, i) => Math.sin((2 * Math.PI * freq * i) / BASE_RATE));

describe("metrics", () => {
  it("identical signals correlate 1", () => {
    const a = burst(2000, 500, 6000);
    expect(envelopeCorrelation(a, a)).toBeCloseTo(1, 6);
  });

  it("envelopeCorrelation of shifted noise burst < 0.5 when shifted by burst length", () => {
    const a = burst(2000, 0, 8000);
    const b = burst(2000, 2000, 8000);
    expect(envelopeCorrelation(a, b)).toBeLessThan(0.5);
  });

  it("spectralDistance identical = 0", () => {
    const a = sine(440, 0.2);
    expect(spectralDistance(a, a)).toBe(0);
  });

  it("spectralDistance 440 vs 880 sine > 10", () => {
    expect(spectralDistance(sine(440, 0.2), sine(880, 0.2))).toBeGreaterThan(10);
  });

  it("same-shape noise with different seeds < 3", () => {
    const lowpassed = (seed: number) => {
      const rand = seeded(seed);
      const filter = onePole(1500, "low");
      return Float32Array.from({ length: 8000 }, () => filter(rand() * 2 - 1));
    };
    expect(spectralDistance(lowpassed(1), lowpassed(2))).toBeLessThan(3);
  });

  it("unequal lengths compare overlap only", () => {
    const a = sine(440, 0.2);
    const padded = new Float32Array(Math.round(a.length * 1.2));
    padded.set(a);
    expect(spectralDistance(a, padded)).toBeLessThan(0.5);
  });

  it("envelope gives RMS per window with a true partial window", () => {
    const out = envelope(new Float32Array(150).fill(0.5), 10);
    expect(out.length).toBe(2);
    expect(out[0]).toBeCloseTo(0.5, 6);
    expect(out[1]).toBeCloseTo(0.5, 6);
  });

  it("centroids rise with frequency", () => {
    const low = centroids(sine(440, 0.1));
    const high = centroids(sine(2000, 0.1));
    expect(high[0]!).toBeGreaterThan(low[0]!);
  });

  it("readSnd maps 128 to 0 and 255 to ~1", () => {
    const path = join(mkdtempSync(join(tmpdir(), "snd-")), "t.snd");
    writeFileSync(path, Uint8Array.from([128, 255, 0]));
    const out = readSnd(path);
    expect(out[0]).toBe(0);
    expect(out[1]).toBeCloseTo(1, 1);
    expect(out[2]).toBeCloseTo(-1, 1);
  });
});
