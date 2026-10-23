import cameraJson from "@config/camera.json";
import { describe, expect, it, vi } from "vitest";
import { TileGrid } from "../../engine/world/tiles";
import { createFog, loadFog } from "../fog";
import { createHero, type Hero } from "../hero/hero";
import { cfg } from "../hero/testWorld";
import { loadMesto } from "../level/mesto";
import { pickUp, resetWorld, type SandboxWorld } from "../level/sandboxLevel";
import { checkSnapshot, loadSnapshot, SAVE_VERSION, takeSnapshot, type Snapshot } from "./snapshot";

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
    expect(loadSnapshot(g.world, g.hero, snap, cfg)).toBeNull();
    expect(g.hero).toEqual(saved.hero);
    expect(g.world.inventory).toEqual(saved.world.inventory);
    expect([...g.world.flags]).toEqual([...saved.world.flags]);
    expect(g.world.props.map((p) => [p.state, p.taken])).toEqual(saved.world.props.map((p) => [p.state, p.taken]));
    expect(g.world.lifts.map((l) => [l.y, l.target])).toEqual(saved.world.lifts.map((l) => [l.y, l.target]));
    expect(g.world.enemies[0]!.hits).toBe(2);
    expect(g.world.fog!.revealed[123]).toBe(1);
  });

  it("restores the level end and its subtitle", () => {
    const saved = changed();
    saved.world.complete = true;
    saved.world.subtitle = { text: "Level complete", age: 3 };
    const g = play();
    loadSnapshot(g.world, g.hero, takeSnapshot(saved.world, saved.hero), cfg);
    expect(g.world.complete).toBe(true);
    expect(g.world.subtitle?.text).toBe("Level complete");
  });

  it("restores the difficulty, and an old save without one has no autosave", () => {
    const saved = changed();
    saved.world.autosave = true;
    const snap = takeSnapshot(saved.world, saved.hero);
    const g = play();
    expect(loadSnapshot(g.world, g.hero, snap, cfg)).toBeNull();
    expect(g.world.autosave).toBe(true);
    expect(loadSnapshot(g.world, g.hero, { ...snap, autosave: undefined }, cfg)).toBeNull();
    expect(g.world.autosave).toBe(false);
    expect(checkSnapshot(g.world, { ...snap, autosave: "yes" })).toBe("damaged");
  });

  it("keeps the difficulty over a mission restart", () => {
    const g = play();
    g.world.autosave = true;
    resetWorld(g.world, cfg);
    expect(g.world.autosave).toBe(true);
  });

  it("calls a save of another version or mission shape a misfit", () => {
    const g = changed();
    const snap = takeSnapshot(g.world, g.hero);
    expect(checkSnapshot(g.world, snap)).toBeNull();
    expect(checkSnapshot(g.world, { ...snap, version: SAVE_VERSION + 1 })).toBe("misfit");
    expect(checkSnapshot(g.world, { ...snap, counts: { ...snap.counts, props: snap.counts.props + 1 } })).toBe("misfit");
  });

  const corrupt: [string, (s: Snapshot) => unknown][] = [
    ["not an object", () => "junk"],
    ["no hero", (s) => ({ ...s, hero: undefined })],
    ["hero missing a field", (s) => ({ ...s, hero: { ...s.hero, energy: undefined } })],
    ["hero position not a number", (s) => ({ ...s, hero: { ...s.hero, x: "a" } })],
    ["hero outside the map", (s) => ({ ...s, hero: { ...s.hero, y: 9999 } })],
    ["hero NaN", (s) => ({ ...s, hero: { ...s.hero, energy: Number.NaN } })],
    ["lift list too short", (s) => ({ ...s, lifts: s.lifts.slice(1) })],
    ["lift without y", (s) => ({ ...s, lifts: s.lifts.map(() => ({ target: null })) })],
    ["unknown prop field", (s) => ({ ...s, props: s.props.map((p, i) => (i ? p : { ...p, evil: 1 })) })],
    ["prop state of the wrong type", (s) => ({ ...s, props: s.props.map((p, i) => (i ? p : { ...p, state: "open" })) })],
    ["enemy missing its body", (s) => ({ ...s, enemies: s.enemies.map((e, i) => (i ? e : { ...e, body: null })) })],
    ["enemies not a list", (s) => ({ ...s, enemies: {} })],
    ["flag of an unknown kind", (s) => ({ ...s, flags: ["item:crowbar"] })],
    ["unknown item", (s) => ({ ...s, inventory: { items: ["laser"], shown: "laser" } })],
    ["shown item not held", (s) => ({ ...s, inventory: { items: [], shown: "crowbar" } })],
    ["fog of the wrong size", (s) => ({ ...s, fog: btoa("xx") })],
    ["fog not base64", (s) => ({ ...s, fog: "%%%" })],
    ["complete missing", (s) => ({ ...s, complete: undefined })],
  ];

  it.each(corrupt)("refuses a damaged save (%s) and leaves the world untouched", (_, damage) => {
    const g = changed();
    const before = JSON.stringify(takeSnapshot(g.world, g.hero));
    const snap = damage(takeSnapshot(changed().world, changed().hero));
    expect(loadSnapshot(g.world, g.hero, snap, cfg)).not.toBeNull();
    expect(JSON.stringify(takeSnapshot(g.world, g.hero))).toBe(before);
  });

  it("rolls the world back when a load fails half way", () => {
    const g = changed();
    const before = JSON.stringify(takeSnapshot(g.world, g.hero));
    const other = changed();
    other.hero.x = 20;
    const snap = takeSnapshot(other.world, other.hero);
    const blocks = vi.spyOn(TileGrid.prototype, "clearBlocks").mockImplementationOnce(() => {
      throw new Error("boom");
    });
    expect(loadSnapshot(g.world, g.hero, snap, cfg)).toBe("damaged");
    blocks.mockRestore();
    const after = takeSnapshot(g.world, g.hero);
    const was = JSON.parse(before) as Record<string, unknown>;
    for (const key of Object.keys(was).filter((k) => k !== "fog")) expect([key, (after as unknown as Record<string, unknown>)[key]]).toEqual([key, was[key]]);
    const kept = Uint8Array.from(atob(was.fog as string), (c) => c.charCodeAt(0));
    const now = Uint8Array.from(atob(after.fog!), (c) => c.charCodeAt(0));
    expect(kept.every((byte, i) => (byte & now[i]!) === byte)).toBe(true);
  });
});
