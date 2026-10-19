import { describe, expect, it } from "vitest";
import { bolt } from "../arcLook";
import { BEAM_FRAMES, drawBeam } from "./beam";

const record = (length: number, frame: number, seed: number): string[] => {
  const calls: string[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (target, key: string) => (typeof target[key] === "undefined" ? (...args: unknown[]) => calls.push(`${key}(${args.join()})`) : target[key]),
    set: (target, key: string, value) => {
      target[key] = value;
      calls.push(`${key}=${value}`);
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  drawBeam(ctx, length, frame, seed);
  return calls;
};

describe("beam", () => {
  it("loops over six frames", () => {
    expect(BEAM_FRAMES).toBe(6);
  });

  it("draws the same call list for the same length, frame and seed", () => {
    expect(record(216, 3, 1)).toEqual(record(216, 3, 1));
  });

  it("changes the call list with the seed", () => {
    const lists = [1, 2, 3, 4, 5].map((seed) => record(216, 0, seed).join("|"));
    expect(new Set(lists).size).toBeGreaterThan(1);
  });

  it("changes the call list with the frame", () => {
    expect(record(216, 0, 1)).not.toEqual(record(216, 1, 1));
  });

  it("makes 2 or 3 strands that start at the muzzle and end on the axis at the length", () => {
    for (let frame = 0; frame < BEAM_FRAMES; frame++) {
      const strands = bolt(216, frame);
      expect([2, 3]).toContain(strands.length);
      for (const pts of strands) {
        expect(pts[0]).toEqual([0, 0]);
        expect(pts[pts.length - 1]).toEqual([216, 0]);
      }
    }
  });
});
