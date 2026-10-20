import { describe, expect, it } from "vitest";
import { lookAt } from "./looks";

describe("lookAt", () => {
  it("films through the security camera unless a shot is the robot's own view", () => {
    expect(lookAt("crowbarDoor", 1)).toBe("camera");
    expect(lookAt("pickCrowbar", 0)).toBe("robot");
    expect(lookAt("takeTapHandle", 3.7)).toBe("camera");
    expect(lookAt("takeTapHandle", 3.714)).toBe("robot");
    expect(lookAt("useAcidTank", 2.5)).toBe("camera");
    expect(lookAt("missionStart", 33)).toBe("robot");
  });
});
