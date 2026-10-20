import jeskyneMap from "@config/levels/jeskyne/map.json";
import jungleMap from "@config/levels/jungle/map.json";
import { describe, expect, it } from "vitest";
import { createHero } from "../hero/hero";
import { cfg } from "../hero/testWorld";
import { checkSnapshot, takeSnapshot } from "../save/snapshot";
import { enemyKinds, loadMission, mapItemOf, missionFromQuery, missionJson, MISSIONS } from "./missions";
import type { SandboxWorld } from "./sandboxLevel";

const footRow = (y: number): number => Math.floor(y - 0.001);

const standsOn = (world: SandboxWorld, col: number, y: number): boolean => {
  const foot = footRow(y);
  return !world.grid.solid(col, foot) && (world.grid.solid(col, foot + 1) || world.grid.oneWay(col, foot + 1));
};

const inDeath = (world: SandboxWorld, col: number, row: number): string | null =>
  world.hazards.find((h) => h.kind === "death" && col >= h.col && col < h.col + h.w && row >= h.row && row < h.row + h.h)?.id ?? null;

describe("missions", () => {
  it("lists the four missions in order", () => {
    expect(MISSIONS).toEqual(["mesto", "vesnice", "jungle", "jeskyne"]);
  });

  it("reads the mission from the query, mesto when missing or unknown", () => {
    expect(missionFromQuery("?mission=jungle")).toBe("jungle");
    expect(missionFromQuery("?mission=jeskyne&slot=B")).toBe("jeskyne");
    expect(missionFromQuery("")).toBe("mesto");
    expect(missionFromQuery("?mission=vezeni")).toBe("mesto");
  });

  it("opens the map with the holo plan, from the start in vesnice", () => {
    expect(mapItemOf("mesto")).toBe("holoPlan");
    expect(mapItemOf("vesnice")).toBeUndefined();
    expect(mapItemOf("jungle")).toBe("holoPlan");
    expect(mapItemOf("jeskyne")).toBe("holoPlan");
  });

  it.each(MISSIONS)("%s loads", (id) => {
    const world = loadMission(id);
    expect(world.grid.width).toBe(160);
    expect(world.grid.height).toBe(80);
  });

  it.each(MISSIONS)("%s spawn stands on a floor", (id) => {
    const world = loadMission(id);
    const [x, y] = world.spawn;
    expect(standsOn(world, Math.floor(x), y)).toBe(true);
  });

  it.each(MISSIONS)("%s enemies stand on floors", (id) => {
    const world = loadMission(id);
    const off = world.source.enemies.filter((e) => !e.flight && !standsOn(world, Math.floor(e.x), e.y));
    expect(off).toEqual([]);
  });

  it.each(MISSIONS)("%s death hazards miss spawn and lift stops", (id) => {
    const world = loadMission(id);
    const [x, y] = world.spawn;
    const hits = [inDeath(world, Math.floor(x), footRow(y))];
    for (const lift of world.lifts)
      for (const stop of lift.stops) for (let col = lift.x; col < lift.x + lift.w; col++) hits.push(inDeath(world, col, footRow(stop)));
    expect(hits.filter((h) => h !== null)).toEqual([]);
  });

  it("mesto json is unchanged", () => {
    expect(missionJson("mesto")).toMatchSnapshot();
  });

  it("draws vesnice with its own sky and scenery, the other missions with none", () => {
    const vesnice = loadMission("vesnice");
    expect(vesnice.sky).toBe("villageBackdrop");
    expect(vesnice.backdrop.length).toBeGreaterThan(0);
    expect(vesnice.dressing.map((s) => s.asset)).toContain("grassyWalkway");
    expect(vesnice.props).toEqual([]);
    for (const id of ["jungle", "jeskyne"] as const) expect(missionJson(id).dressing).toEqual([]);
  });

  it("refuses a vesnice snapshot in mesto", () => {
    const vesnice = loadMission("vesnice");
    const hero = createHero(vesnice.spawn, "gun", cfg.energy.max, cfg.energy.shields, cfg.ammo);
    expect(checkSnapshot(loadMission("mesto"), takeSnapshot(vesnice, hero))).toBe("misfit");
  });

  it("keeps the map fields on the world", () => {
    const world = loadMission("jeskyne");
    expect(world.fallDeathCells).toBeNull();
    expect(world.conveyors).toEqual([{ col: 97, row: 39, w: 34, vx: 7.33 }]);
    expect(world.hazards.map((h) => h.id)).toContain("lava");
    expect(Object.keys(world.variants)).toEqual(["stalactiteShot", "tankShot"]);
    expect(loadMission("mesto").fallDeathCells).toBeUndefined();
    expect(loadMission("jungle").teleports.map((t) => t.id)).toEqual(["towerLiftUp", "towerLiftDown"]);
  });

  it("flies only the mesto flyers", () => {
    expect(enemyKinds("mesto").flyer!.flight).toBeDefined();
    expect(enemyKinds("mesto").chromeDroid!.flight).toBeUndefined();
    expect(enemyKinds("jungle").crawler!.flight).toBeUndefined();
  });

  it("gives each enemy the hits of its own hit points", () => {
    const rockets = missionJson("jungle").enemies.filter((e, i) => jungleMap.enemies[i]!.kind === "rocketDroid");
    expect(new Set(rockets.map((e) => e.hits))).toEqual(new Set([7, 11]));
    expect(missionJson("jeskyne").enemies.map((e) => e.hits)).toEqual(jeskyneMap.enemies.map((e) => Math.round((e.hp / 2) * 7)));
  });

  it("keeps a missing fall death height missing", () => {
    expect("fallDeathCells" in missionJson("mesto")).toBe(false);
    expect(missionJson("vesnice").fallDeathCells).toBeNull();
  });

  it("places every map enemy with its kind tuning", () => {
    const json = missionJson("jeskyne");
    expect(json.enemies).toHaveLength(25);
    expect(json.enemies[0]).toMatchObject({ x: 27.5, y: 28, patrol: [22, 31], hits: 11, respawnMs: null });
  });
});
