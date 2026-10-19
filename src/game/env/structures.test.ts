import { describe, expect, it } from "vitest";
import { ladderRungs } from "./structures";

describe("ladderRungs", () => {
  it("steps up from the floor by rung while above the top", () => {
    expect(ladderRungs(20, 6)).toEqual([-6, -12, -18]);
  });
  it("is empty below one rung", () => {
    expect(ladderRungs(5, 6)).toEqual([]);
  });
});
