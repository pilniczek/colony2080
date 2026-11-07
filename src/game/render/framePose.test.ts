import { describe, expect, it } from "vitest";
import { clips } from "../hero/testWorld";
import { ENEMY_POSE_HZ } from "./frame";

describe("enemy pose rate", () => {
  it("fits a whole number of enemy pose steps in the walk cycle, so walk poses repeat and hit the sprite cache", () => {
    const steps = clips.walk!.duration * ENEMY_POSE_HZ;
    expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-6);
  });
});
