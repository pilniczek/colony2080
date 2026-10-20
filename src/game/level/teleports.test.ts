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
  it("Up on a pad moves the hero to the pad target, keeps facing and stands idle", () => {
    const g = game({ x: 5.5, y: 8 }, level([pad]));
    g.hero.facing = -1;
    tick(g, [], ["up"]);
    expect(g.hero).toMatchObject({ x: 15.5, y: 4, vx: 0, facing: -1, state: "idle" });
    run(g, 0.5);
    expect(g.hero).toMatchObject({ x: 15.5, y: 4, state: "idle" });
  });

  it("a walking hero on a pad takes it too", () => {
    const g = game({ x: 4.5, y: 8 }, level([pad]));
    runUntil(g, (h) => h.state === "walk", ["moveRight"]);
    tick(g, ["moveRight"], ["up"]);
    expect(g.hero).toMatchObject({ x: 15.5, y: 4, vx: 0, state: "idle" });
  });

  it("a pad whose flag is not set does nothing, so Up jumps", () => {
    const g = game({ x: 5.5, y: 8 }, level([{ ...pad, enabledBy: "flag:power" }]));
    tick(g, [], ["up"]);
    expect(g.hero.x).toBe(5.5);
    expect(g.hero.state).toBe("standJump");
  });

  it("a pad whose flag is set takes the hero", () => {
    const g = game({ x: 5.5, y: 8 }, level([{ ...pad, enabledBy: "flag:power" }]));
    g.world.flags.add("flag:power");
    tick(g, [], ["up"]);
    expect(g.hero).toMatchObject({ x: 15.5, y: 4 });
  });

  it("Up off a pad still jumps", () => {
    const g = game({ x: 9.5, y: 8 }, level([pad]));
    tick(g, [], ["up"]);
    expect(g.hero.x).toBe(9.5);
    expect(g.hero.state).toBe("standJump");
  });

  it("jungle hero leaves the spawn box by the tower pad", () => {
    const g = game({ x: 117.5, y: 25 }, missionJson("jungle"));
    tick(g, [], ["up"]);
    run(g, 0.5);
    expect(g.hero).toMatchObject({ x: 141.5, y: 41, state: "idle" });
    expect(isDead(g.hero.state)).toBe(false);
  });
});
