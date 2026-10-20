import { describe, expect, it } from "vitest";
import { game, objectLevel, run, runUntil, tick, type Game } from "../hero/testWorld";
import { pickUp } from "../level/sandboxLevel";

const filmedLevel = {
  ...objectLevel,
  tasks: { tasks: objectLevel.tasks.tasks.map((t) => (t.id === "openTrainDoor" ? { ...t, cutscene: "crowbarDoor" } : t)) },
};

const atDoor = (): Game => {
  const g = game({ x: 14, y: 8 }, filmedLevel);
  pickUp(g.world, "crowbar");
  return g;
};
const door = (g: Game) => g.world.props.find((p) => p.id === "trainDoor")!;

describe("cutscene trigger", () => {
  it("starts the cutscene instead of the use clip and holds the task", () => {
    const g = atDoor();
    g.world.flags.add("flag:metroPowered");
    tick(g, [], ["useItem"]);
    expect(g.world.cutscene).toEqual({ id: "crowbarDoor", prop: door(g), t: 0 });
    expect(g.hero.state).not.toBe("use");
    expect(door(g).state ?? 0).toBe(0);
    expect(g.world.flags.has("task:openTrainDoor")).toBe(false);
  });

  it("plays the use clip and the hint when a requirement is missing", () => {
    const g = atDoor();
    tick(g, [], ["useItem"]);
    expect(g.world.cutscene).toBeNull();
    expect(g.hero.state).toBe("use");
    runUntil(g, (h) => h.state === "idle");
    expect(g.world.subtitle?.text).toBe("Something is missing here.");
  });

  it("plays no cutscene once the task is done", () => {
    const g = atDoor();
    g.world.flags.add("flag:metroPowered");
    g.world.flags.add("task:openTrainDoor");
    tick(g, [], ["useItem"]);
    expect(g.world.cutscene).toBeNull();
    run(g, 1);
    expect(g.world.subtitle?.text).toBe("Nothing more to do here.");
  });

  it("stops the hero and drops a skip pressed with the use", () => {
    const g = atDoor();
    g.world.flags.add("flag:metroPowered");
    Object.assign(g.hero, { state: "walk", vx: 3 });
    tick(g, [], ["useItem", "menu"]);
    expect(g.world.cutscene).not.toBeNull();
    expect(g.hero).toMatchObject({ state: "idle", vx: 0 });
    expect(g.buffer.has("menu")).toBe(false);
  });
});
