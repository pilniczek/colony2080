import { describe, expect, it } from "vitest";
import { pipeRings } from "./structures";

describe("pipeRings", () => {
  it("keeps the default column rings", () => {
    expect(pipeRings(168)).toEqual([-150, -78]);
  });
  it("spreads rings down a taller column clear of the base", () => {
    expect(pipeRings(312)).toEqual([-294, -222, -150, -78]);
  });
});
