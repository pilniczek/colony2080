import { describe, expect, it } from "vitest";
import { tourStops } from "./tour";

describe("tourStops", () => {
  it("reads movetos separated by spaces", () => {
    expect(tourStops(" moveto(67,37)  moveto(84,44)\nmoveto(12.5,70) ")).toEqual([
      [67, 37],
      [84, 44],
      [12.5, 70],
    ]);
  });

  it("stops at the first unexpected character", () => {
    expect(tourStops("moveto(1,2) moveto(3,4), moveto(5,6)")).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(tourStops("moveto(1,2) x moveto(3,4)")).toEqual([[1, 2]]);
    expect(tourStops("moveto(1,2)moveto(3,4)")).toEqual([[1, 2]]);
  });

  it("reads nothing from text that does not start with a moveto", () => {
    expect(tourStops("go moveto(1,2)")).toEqual([]);
    expect(tourStops("")).toEqual([]);
  });
});
