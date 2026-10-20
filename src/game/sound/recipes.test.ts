import { describe, expect, it } from "vitest";
import { BASE_RATE } from "../../engine/audio/synth";
import { SOUNDS, samplesOf, type SoundId } from "./index";

const LENGTHS: Record<SoundId, number> = {
  gunShot: 13090,
  cannon: 19106,
  laser: 17362,
  beam: 3866,
  punch: 3999,
  explosion: 29710,
};

const rms = (xs: Float32Array) => Math.sqrt(xs.reduce((sum, x) => sum + x * x, 0) / xs.length);

describe.each(Object.keys(SOUNDS) as SoundId[])("%s", (id) => {
  const render = SOUNDS[id];

  it("renders deterministic", () => {
    expect(render()).toEqual(render());
  });

  it("peak within 0.3-1", () => {
    const peak = render().reduce((max, x) => Math.max(max, Math.abs(x)), 0);
    expect(peak).toBeGreaterThanOrEqual(0.3);
    expect(peak).toBeLessThanOrEqual(1);
  });

  it("ends silent", () => {
    const samples = render();
    expect(rms(samples.subarray(samples.length - Math.round(BASE_RATE * 0.01)))).toBeLessThan(0.02);
  });

  it("length matches original", () => {
    expect(Math.abs(render().length / LENGTHS[id] - 1)).toBeLessThanOrEqual(0.05);
  });

  it("uses 8-bit levels", () => {
    const offLevel = Array.from(render()).filter((x) => {
      const level = x * 127.5 - 0.5;
      return Math.abs(level - Math.round(level)) > 1e-3;
    });
    expect(offLevel).toEqual([]);
  });
});

describe("samplesOf", () => {
  it("caches renders", () => {
    expect(samplesOf("gunShot")).toBe(samplesOf("gunShot"));
  });

  it("throws on unknown id", () => {
    expect(() => samplesOf("nope")).toThrow();
  });
});
