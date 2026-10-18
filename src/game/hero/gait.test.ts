import { describe, expect, it } from "vitest";
import fixture from "./gait.fixture.json";
import { gaitBob, gaitLean, gaitPose, RUN, WALK, type Gait } from "./gait";

const gaits: [string, Gait, typeof fixture.walk][] = [
  ["walk", WALK, fixture.walk],
  ["run", RUN, fixture.run],
];

describe("gait engine", () => {
  for (const [name, g, samples] of gaits) {
    it(`${name} matches the spike at every sample`, () => {
      expect(samples).toHaveLength(24);
      for (const s of samples) {
        const pose = gaitPose(g, s.phase);
        expect(Object.keys(pose)).toEqual(Object.keys(s.pose));
        for (const [k, v] of Object.entries(s.pose)) expect(Math.abs(pose[k]! - v), `${k} at ${s.u}`).toBeLessThan(1e-6);
        expect(Math.abs(gaitBob(g, s.phase) - s.bob)).toBeLessThan(1e-6);
        expect(Math.abs(gaitLean(g, s.u) - s.lean)).toBeLessThan(1e-6);
      }
    });
  }
});
