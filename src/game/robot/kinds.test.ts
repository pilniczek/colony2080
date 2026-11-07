import { describe, expect, it } from "vitest";
import { ENEMY_KINDS, kindOf } from "./kinds";

describe("enemy kinds", () => {
  it("give every humanoid kind but the walker its own weapon for the dropped look", () => {
    for (const name of ENEMY_KINDS.filter((k) => k !== "walker")) {
      const { weapon } = kindOf(name);
      expect(weapon, name).toBeDefined();
      expect(typeof weapon!.draw, name).toBe("function");
    }
  });
});
