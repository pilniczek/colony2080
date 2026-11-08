import sandbox from "@config/levels/sandbox.json";
import { beforeAll, describe, expect, it } from "vitest";
import { FIXED_STEP } from "../../engine/loop";
import { game, objectLevel, tick } from "../hero/testWorld";
import { stepApproaches, loadSandbox, startFilm, type Prop } from "../level/sandboxLevel";
import { hitShootable } from "../shots";
import { MISSIONS } from "../level/missionIds";
import { FILM_CONFIGS } from "./configs";
import { CUTSCENE_IDS, filmsOf, INTROS, loadFilms } from "./index";
import { stepCutscene } from "./play";

const withProps = (level: { props: unknown[] }, change: (p: Prop) => Prop): unknown => ({ ...level, props: (level.props as Prop[]).map(change) });

beforeAll(() => loadFilms());

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
    tick(g, [], ["useItem"]);
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
    const w = loadSandbox(withProps(objectLevel, (p) => (p.id === "crane" ? { ...p, shootable: { hits: 2, state: 1, cutscene: { shot: "hullCover" } } } : p)));
    const crane = w.props.find((p) => p.id === "crane")!;
    hitShootable(w, crane);
    expect(w.cutscene).toBeNull();
    hitShootable(w, crane);
    expect(w.cutscene?.id).toBe("hullCover");
  });

  it("play once when the hero comes near on the same floor", () => {
    const w = loadSandbox(withProps(objectLevel, (p) => (p.id === "crane" ? { ...p, y: 8, approach: { cells: 3, cutscene: "rebelShot", gives: "flag:rebelShot" } } : p)));
    stepApproaches(w, { x: 13, y: 8 }, 1.9);
    expect(w.cutscene).toBeNull();
    stepApproaches(w, { x: 14.5, y: 6 }, 1.9);
    expect(w.cutscene).toBeNull();
    stepApproaches(w, { x: 14.5, y: 8 }, 1.9);
    expect(w.cutscene?.id).toBe("rebelShot");
    expect(w.flags.has("flag:rebelShot")).toBe(true);
    w.cutscene = null;
    stepApproaches(w, { x: 15, y: 8 }, 1.9);
    expect(w.cutscene).toBeNull();
  });

  it("play when the hero jumps over the approach spot", () => {
    const w = loadSandbox(withProps(objectLevel, (p) => (p.id === "crane" ? { ...p, y: 8, approach: { cells: 3, cutscene: "rebelShot", gives: "flag:rebelShot" } } : p)));
    stepApproaches(w, { x: 14.5, y: 6.9 }, 1.9);
    expect(w.cutscene?.id).toBe("rebelShot");
  });

  it("reject an unknown film id", () => {
    expect(() => loadSandbox(withProps(objectLevel, (p) => (p.id === "crane" ? { ...p, cutscene: "nope" as never } : p)))).toThrow("unknown cutscene: nope");
  });
});

describe("films by mission", () => {
  it("files every film under one known mission", () => {
    expect(MISSIONS.flatMap(filmsOf).sort()).toEqual([...CUTSCENE_IDS].sort());
  });

  it("files every film so far under mesto, but the vesnice start", () => {
    expect(filmsOf("mesto")).toEqual(CUTSCENE_IDS.filter((id) => id !== "vesniceStart"));
    expect(filmsOf("vesnice")).toEqual(["vesniceStart"]);
  });

  it("starts mesto and vesnice with a film of their own mission", () => {
    expect(INTROS).toEqual({ mesto: "missionStart", vesnice: "vesniceStart" });
    for (const [mission, id] of Object.entries(INTROS)) expect(FILM_CONFIGS.get(id)?.mission).toBe(mission);
  });
});
