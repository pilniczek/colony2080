import { describe, expect, it } from "vitest";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BASE_RATE, seeded } from "../../src/engine/audio/synth";
import { centroids, envelopeCorrelation, readSnd, spectralDistance } from "./metrics";

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
