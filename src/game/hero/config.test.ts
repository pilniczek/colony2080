import clipsJson from "@config/hero/clips.json";
import movementJson from "@config/hero/movement.json";
import xbot from "@config/robots/xbot.json";
import { describe, expect, it } from "vitest";
import { clipFor, loadClips, loadMovement, type HeroState, type Weapon } from "./config";

const states: HeroState[] = [
  "idle", "walk", "run", "standJump", "walkJump", "runJump", "duckJump", "fall", "fallDeath", "duck",
  "duckAttack", "kneel", "use", "hide", "attack", "weaponSwitch", "ladder", "death", "jumpDeath",
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
    expect(cfg.jump.walkHeight).toBe(0.47);
    expect(cfg.energy.hit).toBe(25);
    expect(cfg.deathSlide).toBe(0.45);
  });

  it("names a non-numeric field", () => {
    expect(() => loadMovement({ ...movementJson, gravity: "x" })).toThrow(/gravity/);
  });

  it("names a missing jump field", () => {
    expect(() => loadMovement({ ...movementJson, jump: { ...movementJson.jump, walkHeight: undefined } })).toThrow(/jump\.walkHeight/);
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
      const tracks: [number, unknown][][] = [clip.pose, clip.view ?? [], clip.rot ?? [], clip.tint ?? [], clip.air ?? [], clip.gun ?? [], clip.events ?? []];
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

  it("has no launch events and no wind-up clips", () => {
    for (const [name, clip] of Object.entries(clips)) expect(clip.events?.map(([, e]) => e) ?? [], name).not.toContain("launch");
    for (const name of ["turn", "land", "hit"]) expect(clips).not.toHaveProperty(name);
  });

  it("starts the hide clip front and fully tinted", () => {
    expect(clips.hide!.view).toEqual([[0, "front"]]);
    expect(clips.hide!.tint).toEqual([[0, 1]]);
  });

  it("maps states to weapon clips", () => {
    expect(clipFor("attack", "fists")).toBe("punch");
    expect(clipFor("attack", "gun")).toBe("shoot");
    expect(clipFor("duckAttack", "fists")).toBe("duckPunch");
    expect(clipFor("duckAttack", "gun")).toBe("duckShoot");
    expect(clipFor("use", "gun")).toBe("useGun");
    expect(clipFor("walk", "gun")).toBe("walk");
  });

  it("drives walk and run from the gait engine at the spec speeds", () => {
    const cellsPerPx = movementJson.heroHeightCells / ((xbot.frame.footY - xbot.levels.head) * 0.2);
    for (const [name, pxPerSecond] of [["walk", 110], ["run", 300]] as const) {
      const clip = clips[name]!;
      expect(clip.gait).toBe(name);
      expect(clip.pose).toEqual([]);
      expect(clip.travel! / clip.duration).toBeCloseTo(pxPerSecond * cellsPerPx, 2);
    }
  });

  it("blends the moving jumps from their gait", () => {
    expect(clips.walkJump).toMatchObject({ gait: "walk", blend: 0.08 });
    expect(clips.runJump).toMatchObject({ gait: "run", blend: 0.06 });
    expect(clipFor("walkJump", "fists")).toBe("walkJump");
    expect(clipFor("duckJump", "gun")).toBe("duckJump");
  });

  it("rejects an unknown gait", () => {
    expect(() => loadClips(withClip("walk", { gait: "hop" }))).toThrow(/walk\.gait/);
  });

  it("needs a positive blend with pose keys", () => {
    expect(() => loadClips(withClip("walkJump", { blend: 0 }))).toThrow(/walkJump\.blend/);
    expect(() => loadClips(withClip("walkJump", { pose: undefined }))).toThrow(/walkJump\.pose/);
  });

  it("needs pose keys without a gait", () => {
    expect(() => loadClips(withClip("idle", { pose: undefined }))).toThrow(/idle\.pose/);
  });

  it("rejects a zero duration", () => {
    expect(() => loadClips(withClip("walk", { duration: 0 }))).toThrow(/walk\.duration/);
  });

  it("rejects unsorted keys", () => {
    expect(() => loadClips(withClip("fall", { pose: [[0.4, {}], [0, {}]] }))).toThrow(/fall\.pose/);
  });

  it("rejects a key past the duration", () => {
    expect(() => loadClips(withClip("duck", { rot: [[0, 0], [2, 0]] }))).toThrow(/duck\.rot/);
  });

  it("rejects a non-finite joint value", () => {
    expect(() => loadClips(withClip("idle", { pose: [[0, { body: "x" }]] }))).toThrow(/idle\.pose\[0\]\.body/);
  });

  it("rejects an unknown view", () => {
    expect(() => loadClips(withClip("hide", { view: [[0, "top"]] }))).toThrow(/hide\.view/);
  });
});
