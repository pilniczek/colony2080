import config from "@config/cutscenes/crowbar-door.json";
import { describe, expect, it } from "vitest";
import { crowbarDoor } from "./crowbarDoor";

describe("crowbarDoor", () => {
  it("lasts the configured clip", () => {
    expect(crowbarDoor.duration).toBeCloseTo(config.clip.end - config.clip.start);
  });

  it("films from the metro camera", () => {
    expect(crowbarDoor.camera).toBe("CAM 03 METRO");
  });
});
