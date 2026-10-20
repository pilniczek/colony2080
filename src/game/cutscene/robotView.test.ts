import { describe, expect, it } from "vitest";
import { readoutLine } from "./robotView";

describe("robotView", () => {
  it("gives the same readout line for the same index", () => {
    expect(readoutLine(42)).toBe(readoutLine(42));
    expect(new Set(Array.from({ length: 20 }, (_, i) => readoutLine(i))).size).toBeGreaterThan(15);
  });

  it("keeps readout lines short enough for the panel", () => {
    for (let i = 0; i < 200; i++) expect(readoutLine(i).length).toBeLessThanOrEqual(14);
  });
});
