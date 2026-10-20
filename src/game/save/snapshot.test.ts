import cameraJson from "@config/camera.json";
import { describe, expect, it } from "vitest";
import { createFog, loadFog } from "../fog";
import { createHero, type Hero } from "../hero/hero";
import { cfg } from "../hero/testWorld";
import { loadMesto } from "../level/mesto";
import { pickUp, type SandboxWorld } from "../level/sandboxLevel";
import { applySnapshot, fits, SAVE_VERSION, takeSnapshot } from "./snapshot";

const play = (): { world: SandboxWorld; hero: Hero } => {
  const world = loadMesto();
  const hero = createHero(world.spawn, "gun", cfg.energy.max, cfg.energy.shields, cfg.ammo);
  world.fog = createFog(loadFog(cameraJson), cfg, hero, world.grid);
  return { world, hero };
};

const changed = (): { world: SandboxWorld; hero: Hero } => {
  const g = play();
  Object.assign(g.hero, { x: 40.5, y: 75, energy: 37, ammo: 120, facing: -1, state: "ladder", climb: 2.5 });
  pickUp(g.world, "crowbar");
  g.world.flags.add("flag:metroPowered");
  g.world.props.find((p) => p.id === "trainDoor")!.state = 2;
  g.world.props.find((p) => p.kind === "item")!.taken = true;
  g.world.lifts[0]!.y -= 3;
  g.world.lifts[0]!.target = 4;
  g.world.enemies[0]!.hits = 2;
  g.world.fog!.revealed[123] = 1;
  return g;
};

describe("snapshot", () => {
  it("restores the saved mission into a fresh world", () => {
    const saved = changed();
    const snap = JSON.parse(JSON.stringify(takeSnapshot(saved.world, saved.hero)));
    const g = play();
    applySnapshot(g.world, g.hero, snap, cfg);
    expect(g.hero).toEqual(saved.hero);
    expect(g.world.inventory).toEqual(saved.world.inventory);
    expect([...g.world.flags]).toEqual([...saved.world.flags]);
    expect(g.world.props.map((p) => [p.state, p.taken])).toEqual(saved.world.props.map((p) => [p.state, p.taken]));
    expect(g.world.lifts.map((l) => [l.y, l.target])).toEqual(saved.world.lifts.map((l) => [l.y, l.target]));
    expect(g.world.enemies[0]!.hits).toBe(2);
    expect(g.world.fog!.revealed[123]).toBe(1);
  });

  it("fits only its own version and mission counts", () => {
    const g = changed();
    const snap = takeSnapshot(g.world, g.hero);
    expect(fits(g.world, snap)).toBe(true);
    expect(fits(g.world, { ...snap, version: SAVE_VERSION + 1 })).toBe(false);
    expect(fits(g.world, { ...snap, counts: { ...snap.counts, props: snap.counts.props + 1 } })).toBe(false);
  });
});
