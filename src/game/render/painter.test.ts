import { describe, expect, it } from "vitest";
import { SLOW_FRAME_MS, SLOW_FRAMES, slowWatch } from "./painter";

describe("slowWatch", () => {
  it("trips only after a run of slow frames", () => {
    const slow = slowWatch();
    for (let i = 1; i < SLOW_FRAMES; i++) expect(slow(SLOW_FRAME_MS)).toBe(false);
    expect(slow(SLOW_FRAME_MS)).toBe(true);
  });

  it("starts over after a fast frame", () => {
    const slow = slowWatch();
    for (let i = 1; i < SLOW_FRAMES; i++) slow(SLOW_FRAME_MS + 10);
    expect(slow(SLOW_FRAME_MS - 1)).toBe(false);
    for (let i = 1; i < SLOW_FRAMES; i++) expect(slow(SLOW_FRAME_MS)).toBe(false);
    expect(slow(SLOW_FRAME_MS)).toBe(true);
  });
});
