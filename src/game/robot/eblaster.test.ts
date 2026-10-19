import { describe, expect, it } from "vitest";
import { drawEBlaster, EBLASTER_MUZZLE, EBLASTER_PARTS } from "./eblaster";
import { MUZZLE } from "./gun";

const prongEnd = (barrel?: number): number => {
  let end = -Infinity;
  const ctx = {
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    fillRect: (x: number, _y: number, w: number) => {
      end = Math.max(end, x + w);
    },
    strokeRect: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
  } as unknown as CanvasRenderingContext2D;
  drawEBlaster(ctx, barrel === undefined ? {} : { barrel });
  return end;
};

describe("eblaster", () => {
  it("shares the gun muzzle and ends its prongs at the muzzle", () => {
    expect(EBLASTER_MUZZLE).toEqual(MUZZLE);
    expect(prongEnd()).toBe(EBLASTER_MUZZLE[0] - 2);
  });

  it("stretches the prongs to the requested barrel length", () => {
    expect(prongEnd(247)).toBe(prongEnd() + 51);
  });

  it("has four coils", () => {
    expect(EBLASTER_PARTS.filter((p) => p.name.startsWith("coil"))).toHaveLength(4);
  });
});
