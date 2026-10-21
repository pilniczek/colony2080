import { describe, expect, it } from "vitest";
import { ladderRungs, pipeRings } from "./structures";

describe("ladderRungs", () => {
  it("steps up from the floor by rung while above the top", () => {
    expect(ladderRungs(20, 6)).toEqual([-6, -12, -18]);
  });
  it("is empty below one rung", () => {
    expect(ladderRungs(5, 6)).toEqual([]);
  });
});

describe("pipeRings", () => {
  it("keeps the default column rings", () => {
    expect(pipeRings(168)).toEqual([-150, -78]);
  });
  it("spreads rings down a taller column clear of the base", () => {
    expect(pipeRings(312)).toEqual([-294, -222, -150, -78]);
  });
});
