import { describe, expect, it } from "vitest";
import { createHero } from "../hero/hero";
import { momentOf, tween } from "./tween";

const hero = createHero([5.5, 10], "gun", 100, 0, 10, true, null);

describe("tween", () => {
  it("blends position, clip time, climb and hit age between two steps", () => {
    const prev = momentOf({ ...hero, x: 5, time: 0.2, climb: 1, hitAge: 0.1 });
    const shown = tween(prev, { ...hero, x: 5.2, time: 0.22, climb: 1.1, hitAge: 0.12 }, 0.5);
    expect(shown.x).toBeCloseTo(5.1);
    expect(shown.time).toBeCloseTo(0.21);
    expect(shown.climb).toBeCloseTo(1.05);
    expect(shown.hitAge).toBeCloseTo(0.11);
  });

  it("snaps a jump and a state change to the current step", () => {
    const prev = momentOf({ ...hero, x: 5, state: "walk", time: 0.4 });
    const shown = tween(prev, { ...hero, x: 9, state: "run", time: 0 }, 0.5);
    expect(shown.x).toBe(9);
    expect(shown.time).toBe(0);
  });
});
