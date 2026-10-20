import { describe, expect, it } from "vitest";
import { BASE_RATE, buffer, envelope, fill, onePole, osc, quantize8, seeded, sweep } from "./synth";

const rms = (xs: Float32Array) => Math.sqrt(xs.reduce((s, x) => s + x * x, 0) / xs.length);

describe("synth", () => {
  it("seeded is deterministic", () => {
    const a = seeded(7);
    const b = seeded(7);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(-1);
      expect(x).toBeLessThanOrEqual(1);
    }
  });

  it("buffer length", () => {
    expect(buffer(1).length).toBe(BASE_RATE);
  });

  it("envelope interpolates", () => {
    const e = envelope([[0, 0], [0.1, 1], [0.3, 0]]);
    expect(e(0.05)).toBeCloseTo(0.5);
    expect(e(0.2)).toBeCloseTo(0.5);
    expect(e(1)).toBe(0);
  });

  it("sweep interpolates exponentially and holds its ends", () => {
    const s = sweep([[0.1, 100], [0.3, 400], [0.5, 400]]);
    expect(s(0)).toBe(100);
    expect(s(0.2)).toBeCloseTo(200);
    expect(s(0.4)).toBeCloseTo(400);
    expect(s(1)).toBe(400);
  });

  it("osc sine frequency", () => {
    const o = osc("sine", () => 441);
    const out = fill(buffer(1), (t) => o(t));
    let crossings = 0;
    for (let i = 1; i < out.length; i++) if ((out[i - 1] as number) < 0 !== (out[i] as number) < 0) crossings++;
    expect(Math.abs(crossings - 882)).toBeLessThanOrEqual(2);
  });

  it("lowpass attenuates high tone", () => {
    const input = fill(buffer(0.5), (t) => Math.sin(2 * Math.PI * 4000 * t));
    const f = onePole(200, "low");
    const out = fill(buffer(0.5), (_t, i) => f(input[i] as number));
    expect(rms(out)).toBeLessThan(0.1 * rms(input));
  });

  it("quantize8 levels", () => {
    const out = quantize8(fill(buffer(0.1), (t) => Math.sin(t * 900)));
    for (const x of out) {
      const g = x * 127.5;
      expect(Math.abs(g - Math.round(g - 0.5) - 0.5)).toBeLessThan(1e-5);
    }
    expect(quantize8(new Float32Array([2]))[0]).toBeLessThanOrEqual(1);
  });
});
