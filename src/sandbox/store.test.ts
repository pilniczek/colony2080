import clipsJson from "@config/hero/clips.json";
import movementJson from "@config/hero/movement.json";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { loadClips, loadMovement } from "../game/hero/config";
import { useSandbox } from "./store";

const store = () => useSandbox.getState();

beforeEach(() => store().resetTuning());

describe("movement tuning", () => {
  it("sets a value", () => {
    store().setMovementValue("gravity", 20);
    expect(store().movement.gravity).toBe(20);
  });

  it("keeps the old value for negatives and non-finite numbers", () => {
    for (const bad of [-1, NaN, Infinity]) store().setMovementValue("gravity", bad);
    expect(store().movement.gravity).toBe(30);
  });

  it("rejects zero for divisor fields and accepts it elsewhere", () => {
    const before = store().movement;
    for (const path of ["cellPx", "heroHeightCells", "floorHeightCells", "fireRate", "box.width", "box.height", "box.duckHeight"])
      store().setMovementValue(path, 0);
    expect(store().movement).toEqual(before);
    store().setMovementValue("inputBufferMs", 0);
    expect(store().movement.inputBufferMs).toBe(0);
  });

  it("sets nested values and ignores unknown paths", () => {
    store().setMovementValue("jump.runSpeed", 7);
    store().setMovementValue("jump.nope", 1);
    store().setMovementValue("status", 1);
    expect(store().movement.jump.runSpeed).toBe(7);
    expect(store().movement).not.toHaveProperty("jump.nope");
    expect(store().movement.status).toBe("draft");
  });

  it("exports JSON that loads back as the edited config", () => {
    store().setMovementValue("gravity", 20);
    store().setMovementValue("box.width", 0.8);
    const loaded = loadMovement(JSON.parse(store().exportTuning().movement));
    expect(loaded).toEqual(store().movement);
    expect(loaded.gravity).toBe(20);
    expect(loaded.status).toBe("draft");
    expect(loaded.source).toBe(movementJson.source);
  });

  it("resetTuning restores the file values", () => {
    store().setMovementValue("gravity", 20);
    store().setClipValue("walk", "duration", 2);
    store().resetTuning();
    expect(store().movement).toEqual(loadMovement(movementJson));
    expect(store().clips).toEqual(loadClips(clipsJson));
  });
});

describe("clip tuning", () => {
  it("sets duration and travel", () => {
    store().setClipValue("walk", "duration", 1.4);
    store().setClipValue("walk", "travel", 2.2);
    expect(store().clips.walk).toMatchObject({ duration: 1.4, travel: 2.2 });
  });

  it("rejects non-positive durations, negative travel and unknown clips", () => {
    store().setClipValue("walk", "duration", 0);
    store().setClipValue("walk", "travel", -1);
    store().setClipValue("walk", "duration", NaN);
    store().setClipValue("nope", "duration", 1);
    expect(store().clips.walk).toMatchObject({ duration: 1.1, travel: 1.549 });
    expect(store().clips).not.toHaveProperty("nope");
  });

  it("exports the clips file unchanged when nothing was edited", () => {
    expect(store().exportTuning().clips).toBe(readFileSync("config/hero/clips.json", "utf8"));
  });

  it("exports the wrapped clips file with the edits", () => {
    store().setClipValue("run", "duration", 0.9);
    const json = JSON.parse(store().exportTuning().clips);
    expect(json.status).toBe("draft");
    expect(json.source).toBe(clipsJson.source);
    expect(loadClips(json)).toEqual(store().clips);
    expect(json.clips.run.duration).toBe(0.9);
  });
});
