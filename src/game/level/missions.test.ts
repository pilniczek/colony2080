import jeskyneMap from "@config/levels/jeskyne/map.json";
import jeskyneWorld from "@config/levels/jeskyne/world.json";
import jungleMap from "@config/levels/jungle/map.json";
import jungleWorld from "@config/levels/jungle/world.json";
import vesniceMap from "@config/levels/vesnice/map.json";
import vesniceWorld from "@config/levels/vesnice/world.json";
import { describe, expect, it } from "vitest";
import { createHero } from "../hero/hero";
import { cfg } from "../hero/testWorld";
import { checkSnapshot, takeSnapshot } from "../save/snapshot";
import { mapItemOf, missionFromQuery, MISSIONS } from "./missionIds";
import { enemyKinds, loadMission, missionJson } from "./missions";
import { loadSandbox, type SandboxWorld } from "./sandboxLevel";

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

  it("falls back to mesto for a mission outside the open list", () => {
    expect(missionFromQuery("?mission=jungle", ["mesto"])).toBe("mesto");
  });

  it("opens the map with the holo plan, from the start in vesnice and jeskyne", () => {
    expect(mapItemOf("mesto")).toBe("holoPlan");
    expect(mapItemOf("vesnice")).toBeUndefined();
    expect(mapItemOf("jungle")).toBe("holoPlan");
    expect(mapItemOf("jeskyne")).toBeUndefined();
  });

  it.each(MISSIONS)("%s loads", (id) => {
    const world = loadMission(id);
    expect(world.grid.width).toBe(({ mesto: 143, jungle: 152, jeskyne: 157 } as Partial<Record<string, number>>)[id] ?? 160);
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

  it("draws every later mission from its own world.json", () => {
    for (const [id, world] of [["vesnice", vesniceWorld], ["jungle", jungleWorld], ["jeskyne", jeskyneWorld]] as const) {
      const json = missionJson(id);
      expect([json.sky, json.backdrop, json.dressing, json.props], id).toEqual([world.sky, world.backdrop, world.dressing, "props" in world ? world.props : []]);
    }
  });

  it("hazes the backdrop in the world haze colour, else in the mesto default", () => {
    expect(loadSandbox({ ...missionJson("vesnice"), haze: "rgba(28, 22, 12, 0.4)" }).haze).toBe("rgba(28, 22, 12, 0.4)");
    expect(loadMission("vesnice").haze).toBe(vesniceWorld.haze);
    expect(loadMission("jeskyne").haze).toBe(jeskyneWorld.haze);
    for (const id of MISSIONS.filter((m) => m !== "vesnice" && m !== "jeskyne")) expect(loadMission(id).haze, id).toBe("rgba(26, 12, 8, 0.45)");
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

  it("places every vesnice enemy as its own kind at its original cell and patrol", () => {
    const enemies = missionJson("vesnice").enemies;
    expect(enemies.map((e) => e.kind)).toEqual(vesniceMap.enemies.map((e) => e.kind));
    expect(new Set(enemies.map((e) => e.kind))).toEqual(new Set(["rocketRobot", "greyTrooper"]));
    expect(enemies.map((e) => [e.x, e.y])).toEqual(vesniceMap.enemies.map((e) => [e.cell[0]! + 0.5, e.cell[1]! + 1]));
    expect(enemies.map((e) => e.patrol)).toEqual(vesniceMap.enemies.map((e) => [e.patrol[0]!, e.patrol[1]! + 1]));
    expect(enemies.filter((e) => e.kind === "rocketRobot")).toHaveLength(15);
    expect(enemies.filter((e) => e.kind === "greyTrooper")).toHaveLength(13);
  });

  it("starts every mission enemy facing right, the original walk state 1 of every level setup", () => {
    for (const id of MISSIONS) expect(missionJson(id).enemies.every((e) => e.facing === 1), id).toBe(true);
    expect(loadMission("vesnice").enemies.every((e) => e.body.facing === 1)).toBe(true);
  });

  it("stands every vesnice enemy in open air on a floor, inside its patrol", () => {
    const world = loadMission("vesnice");
    for (const e of world.enemies) {
      const [x, y] = e.spot;
      expect(world.grid.at(Math.floor(x), y - 1), `open at ${x},${y}`).toBe(".");
      expect(["#", "="], `floor under ${x},${y}`).toContain(world.grid.at(Math.floor(x), y));
      expect(x).toBeGreaterThanOrEqual(e.patrol[0]);
      expect(x).toBeLessThanOrEqual(e.patrol[1]);
    }
  });

  it("keeps the jungle and jeskyne enemies on the droid look until their design step", () => {
    expect(missionJson("jungle").enemies.every((e) => e.kind === undefined)).toBe(true);
    expect(missionJson("jeskyne").enemies.every((e) => e.kind === undefined)).toBe(true);
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
