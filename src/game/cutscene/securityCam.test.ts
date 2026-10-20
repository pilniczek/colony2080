import { describe, expect, it } from "vitest";
import { camClock, filmRect } from "./securityCam";

describe("securityCam", () => {
  it("fills a 16:9 screen with the film", () => {
    expect(filmRect(1920, 1080)).toEqual({ x: 0, y: 0, w: 1920, h: 1080 });
  });

  it("letterboxes other screen shapes", () => {
    expect(filmRect(1000, 1000)).toEqual({ x: 0, y: 218.75, w: 1000, h: 562.5 });
  });

  it("runs the camera clock from its start time", () => {
    expect(camClock(0)).toBe("2080-03-14 23:41:07");
    expect(camClock(61.5)).toBe("2080-03-14 23:42:08");
  });
});
