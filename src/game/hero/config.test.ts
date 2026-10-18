import clipsJson from "@config/hero/clips.json";
import movementJson from "@config/hero/movement.json";
import { describe, expect, it } from "vitest";
import { clipFor, loadClips, loadMovement, type HeroState, type Weapon } from "./config";

const states: HeroState[] = [
  "idle", "turn", "walk", "run", "standJump", "runJump", "fall", "land", "fallDeath", "duck",
  "duckAttack", "kneel", "use", "hide", "attack", "weaponSwitch", "ladder", "hit", "death",
];
const weapons: Weapon[] = ["fists", "gun"];

const withClip = (name: string, patch: object): unknown => ({
  ...clipsJson,
  clips: { ...clipsJson.clips, [name]: { ...clipsJson.clips[name as keyof typeof clipsJson.clips], ...patch } },
});

describe("loadMovement", () => {
  it("reads movement.json", () => {
    const cfg = loadMovement(movementJson);
    expect(cfg.gravity).toBe(30);
    expect(cfg.jump.runSpeed).toBe(6.5);
    expect(cfg.energy.hit).toBe(25);
  });

  it("names a non-numeric field", () => {
    expect(() => loadMovement({ ...movementJson, gravity: "x" })).toThrow(/gravity/);
  });

  it("names a missing nested field", () => {
    expect(() => loadMovement({ ...movementJson, box: { width: 0.7, height: 1.9 } })).toThrow(/box\.duckHeight/);
  });
});

describe("loadClips", () => {
  const clips = loadClips(clipsJson);

  it("has a clip for every state and weapon", () => {
    for (const state of states) for (const weapon of weapons) expect(clips[clipFor(state, weapon)], `${state} ${weapon}`).toBeDefined();
  });

  it("keeps every track sorted and inside the clip", () => {
    for (const [name, clip] of Object.entries(clips)) {
      const tracks: [number, unknown][][] = [clip.pose, clip.view ?? [], clip.rot ?? [], clip.tint ?? [], clip.gun ?? [], clip.events ?? []];
      for (const track of tracks) {
        const times = track.map(([t]) => t);
        expect(times, name).toEqual([...times].sort((a, b) => a - b));
        for (const t of times) {
          expect(t, name).toBeGreaterThanOrEqual(0);
          expect(t, name).toBeLessThanOrEqual(clip.duration);
        }
      }
    }
  });

  it("maps states to weapon clips", () => {
    expect(clipFor("attack", "fists")).toBe("punch");
    expect(clipFor("attack", "gun")).toBe("shoot");
    expect(clipFor("duckAttack", "fists")).toBe("duckPunch");
    expect(clipFor("duckAttack", "gun")).toBe("duckShoot");
    expect(clipFor("use", "gun")).toBe("useGun");
    expect(clipFor("walk", "gun")).toBe("walk");
  });

  it("rejects a zero duration", () => {
    expect(() => loadClips(withClip("walk", { duration: 0 }))).toThrow(/walk\.duration/);
  });

  it("rejects unsorted keys", () => {
    expect(() => loadClips(withClip("land", { pose: [[0.5, {}], [0, {}]] }))).toThrow(/land\.pose/);
  });

  it("rejects a key past the duration", () => {
    expect(() => loadClips(withClip("hit", { rot: [[0, 0], [2, 0]] }))).toThrow(/hit\.rot/);
  });

  it("rejects a non-finite joint value", () => {
    expect(() => loadClips(withClip("idle", { pose: [[0, { body: "x" }]] }))).toThrow(/idle\.pose\[0\]\.body/);
  });

  it("rejects an unknown view", () => {
    expect(() => loadClips(withClip("turn", { view: [[0, "top"]] }))).toThrow(/turn\.view/);
  });
});
