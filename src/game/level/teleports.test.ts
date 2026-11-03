import { describe, expect, it } from "vitest";
import { isDead } from "../hero/hero";
import { game, run, runUntil, tick } from "../hero/testWorld";
import { missionJson } from "./missions";

const WIDTH = 20;
const open = `#${".".repeat(WIDTH - 2)}#`;
const solid = "#".repeat(WIDTH);
const shelf = `#${".".repeat(12)}#####..#`;
const pad = { id: "pad", from: [5, 7], col: 4, w: 3, to: [15, 3] };

function level(teleports: object[]) {
  const rows = [...Array<string>(4).fill(open), shelf, open, open, open, solid, solid];
  return { rows, spawn: [3.5, 8], sky: "skyBackground", backdrop: [], dressing: [], lifts: [], enemies: [], props: [], teleports };
}

describe("teleports", () => {
  it("Enter on a pad moves the hero to the pad target, keeps facing and stands idle", () => {
    const g = game({ x: 5.5, y: 8 }, level([pad]));
    g.hero.facing = -1;
    tick(g, [], ["useItem"]);
    expect(g.hero).toMatchObject({ x: 15.5, y: 4, vx: 0, facing: -1, state: "idle" });
    run(g, 0.5);
    expect(g.hero).toMatchObject({ x: 15.5, y: 4, state: "idle" });
  });

  it("a walking hero on a pad takes it too", () => {
    const g = game({ x: 4.5, y: 8 }, level([pad]));
    runUntil(g, (h) => h.state === "walk", ["moveRight"]);
    tick(g, ["moveRight"], ["useItem"]);
    expect(g.hero).toMatchObject({ x: 15.5, y: 4, vx: 0, state: "idle" });
  });

  it("Up on a pad jumps like anywhere else", () => {
    const g = game({ x: 5.5, y: 8 }, level([pad]));
    tick(g, [], ["up"]);
    expect(g.hero.x).toBe(5.5);
    expect(g.hero.state).toBe("standJump");
  });

  it("Enter on a pad whose flag is not set stays, marks the try and says the pad hint", () => {
    const g = game({ x: 5.5, y: 8 }, { ...level([{ ...pad, enabledBy: "flag:power" }]), tasks: { tasks: [], padHints: [{ text: "No power.", until: "flag:power" }] } });
    tick(g, [], ["useItem"]);
    expect(g.hero.x).toBe(5.5);
    expect(g.world.flags.has("flag:tried:pad")).toBe(true);
    expect(g.world.subtitle?.text).toBe("No power.");
  });

  it("a pad whose flag is set takes the hero", () => {
    const g = game({ x: 5.5, y: 8 }, level([{ ...pad, enabledBy: "flag:power" }]));
    g.world.flags.add("flag:power");
    tick(g, [], ["useItem"]);
    expect(g.hero).toMatchObject({ x: 15.5, y: 4 });
  });

  it("jungle hero leaves the spawn box by the tower pad", () => {
    const g = game({ x: 117.5, y: 25 }, missionJson("jungle"));
    tick(g, [], ["useItem"]);
    run(g, 0.5);
    expect(g.hero).toMatchObject({ x: 141.5, y: 41, state: "idle" });
    expect(isDead(g.hero.state)).toBe(false);
  });

  describe("vesnice teleports", () => {
    const at = (x: number, y: number) => {
      const g = game({ x, y }, missionJson("vesnice"));
      g.world.inventory.items.length = 0;
      return g;
    };
    const target = (g: ReturnType<typeof at>) => g.world.props.find((p) => p.id === "targetTeleport")!;

    it("repairs the damaged target teleport by Enter while its repair is open", () => {
      const g = at(65.5, 32);
      g.world.inventory.items.push("navCircuit");
      g.world.inventory.shown = "navCircuit";
      tick(g, [], ["useItem"]);
      run(g, 1);
      expect(g.world.flags.has("flag:teleportRepaired")).toBe(true);
      expect(g.hero.x).toBe(65.5);
      expect(target(g).state).toBe(1);
    });

    it("says no power on a repaired pad while the fuses are smashed", () => {
      const g = at(65.5, 32);
      g.world.flags.add("flag:powerOff");
      g.world.flags.add("flag:teleportRepaired");
      g.world.flags.add("task:repairTeleport");
      tick(g, [], ["useItem"]);
      expect(g.hero.x).toBe(65.5);
      expect(g.world.subtitle?.text).toBe("The teleport has no power.");
    });

    it("says not linked on the source pad before the repair, and rides once linked", () => {
      const g = at(128.5, 23);
      tick(g, [], ["useItem"]);
      expect(g.world.subtitle?.text).toBe("The teleports are not linked.");
      g.world.flags.add("flag:teleportLinked");
      run(g, 0.2);
      tick(g, [], ["useItem"]);
      expect(g.hero).toMatchObject({ x: 65.5, y: 32 });
    });

    it("reminds every locked pad hint with a quest", () => {
      const w = missionJson("vesnice");
      const quests = (w.tasks as { quests: { after: string[]; any?: string[] }[] }).quests;
      const tokens = quests.flatMap((q) => [...q.after, ...(q.any ?? [])]);
      const locked = (w.teleports ?? []).filter((t) => t.enabledBy !== undefined).map((t) => `flag:tried:${t.id}`);
      expect(locked.filter((t) => !tokens.includes(t))).toEqual([]);
    });
  });
});
