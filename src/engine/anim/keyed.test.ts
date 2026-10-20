import { describe, expect, it } from "vitest";
import { clamp, ease, keyed, type Keys, mix, num, sampleTrack, span, type TrackKey } from "./keyed";

it("interpolates named channels with missing names as 0", () => {
  expect(keyed([[0, { a: 0 }], [1, { a: 10, b: 4 }]], 0.5)).toEqual({ a: 5, b: 2 });
});

it("clamps outside the key range", () => {
  const keys: Keys = [[1, { a: 2 }], [2, { a: 6 }]];
  expect(keyed(keys, 0)).toEqual({ a: 2 });
  expect(keyed(keys, 9)).toEqual({ a: 6 });
});

it("interpolates a single number", () => {
  expect(num([[0, 0], [2, 8]], 1, k => k)).toBe(4);
});

it("computes span, clamp, ease and mix", () => {
  expect(span(5, 0, 10)).toBe(0.5);
  expect(clamp(2)).toBe(1);
  expect(ease(0.5)).toBe(0.5);
  expect(mix({ a: 0 }, { a: 10, b: 2 }, 0.5)).toEqual({ a: 5, b: 1 });
});

describe("sampleTrack", () => {
  it("switches string tracks at each key", () => {
    const shot: TrackKey[] = [[1.85, "B"], [2.95, "C"]];
    expect(sampleTrack(shot, 2)).toBe("B");
    expect(sampleTrack(shot, 2.95)).toBe("C");
  });

  it("eases between number keys", () => {
    expect(sampleTrack([[0, 0], [1, 10, "in"]], 0.5)).toBe(2.5);
    expect(sampleTrack([[0, 0], [1, 10]], 0.5)).toBe(5);
  });

  it("jumps at keys with equal times", () => {
    expect(sampleTrack([[0, 0], [1, 0], [1, 5], [2, 5]], 0.99)).toBe(0);
    expect(sampleTrack([[0, 0], [1, 0], [1, 5], [2, 5]], 1)).toBe(5);
  });

  it("holds the first and last values outside the keys", () => {
    expect(sampleTrack([[1, 3], [2, 7]], 0)).toBe(3);
    expect(sampleTrack([[1, 3], [2, 7]], 9)).toBe(7);
  });
});
