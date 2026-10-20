import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { FIXED_STEP } from "../../engine/loop";
import { game, objectLevel, run, tick } from "../hero/testWorld";
import { approachFilms, loadSandbox, startFilm, type Prop } from "../level/sandboxLevel";
import { hitShootable } from "../shots";
import { stepCutscene } from "./play";

const withProps = (level: { props: unknown[] }, change: (p: Prop) => Prop): unknown => ({ ...level, props: (level.props as Prop[]).map(change) });

describe("films without a task", () => {
  it("play to the end and change nothing", () => {
    const w = loadSandbox(objectLevel);
    startFilm(w, "pickCrowbar");
    expect(w.cutscene).toEqual({ id: "pickCrowbar", prop: null, t: 0 });
    while (stepCutscene(w, FIXED_STEP, false));
    expect(w.cutscene).toBeNull();
    expect(w.subtitle).toBeNull();
  });

  it("never replace a running film", () => {
    const w = loadSandbox(objectLevel);
    startFilm(w, "pickCrowbar");
    startFilm(w, "hullCover");
    expect(w.cutscene?.id).toBe("pickCrowbar");
  });

  it("play after picking an item that names one", () => {
    const g = game({ x: 9.5, y: 14 }, withProps(sandbox, (p) => (p.item === "crowbar" ? { ...p, cutscene: "pickCrowbar" } : p)));
    tick(g, ["down"]);
    run(g, 0.4);
    expect(g.world.inventory.items).toContain("crowbar");
    expect(g.world.cutscene?.id).toBe("pickCrowbar");
    expect(g.hero).toMatchObject({ state: "idle", vx: 0 });
  });

  it("stop the walking hero that comes near and drop a pending skip", () => {
    const level = withProps(objectLevel, (p) => (p.id === "crane" ? { ...p, y: 8, approach: { cells: 3, cutscene: "rebelShot", gives: "flag:rebelShot" } } : p));
    const g = game({ x: 13, y: 8 }, level);
    tick(g, ["moveRight"], ["menu"]);
    for (let i = 0; i < 60 && !g.world.cutscene; i++) tick(g, ["moveRight"]);
    expect(g.world.cutscene?.id).toBe("rebelShot");
    expect(g.hero).toMatchObject({ state: "idle", vx: 0 });
    expect(g.buffer.has("menu")).toBe(false);
  });

  it("play when a shootable breaks", () => {
    const w = loadSandbox(withProps(objectLevel, (p) => (p.id === "crane" ? { ...p, shootable: { hits: 2, state: 1, cutscene: "hullCover" } } : p)));
    const crane = w.props.find((p) => p.id === "crane")!;
    hitShootable(w, crane);
    expect(w.cutscene).toBeNull();
    hitShootable(w, crane);
    expect(w.cutscene?.id).toBe("hullCover");
  });

  it("play once when the hero comes near on the same floor", () => {
    const w = loadSandbox(withProps(objectLevel, (p) => (p.id === "crane" ? { ...p, y: 8, approach: { cells: 3, cutscene: "rebelShot", gives: "flag:rebelShot" } } : p)));
    approachFilms(w, { x: 13, y: 8 });
    expect(w.cutscene).toBeNull();
    approachFilms(w, { x: 14.5, y: 5 });
    expect(w.cutscene).toBeNull();
    approachFilms(w, { x: 14.5, y: 8 });
    expect(w.cutscene?.id).toBe("rebelShot");
    expect(w.flags.has("flag:rebelShot")).toBe(true);
    w.cutscene = null;
    approachFilms(w, { x: 15, y: 8 });
    expect(w.cutscene).toBeNull();
  });

  it("reject an unknown film id", () => {
    expect(() => loadSandbox(withProps(objectLevel, (p) => (p.id === "crane" ? { ...p, cutscene: "nope" as never } : p)))).toThrow("unknown cutscene: nope");
  });
});
