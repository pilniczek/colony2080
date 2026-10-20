import cameraJson from "@config/camera.json";
import sandbox from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { createFog, loadFog, revealedAt, seenAt, sightRect, updateFog } from "./fog";
import { cfg, clips, game, run, tick, type Game } from "./hero/testWorld";
import { updateEnemy } from "./level/enemy";
import { fireShots } from "./shots";

const fogCfg = loadFog(cameraJson);

const fogged = (g: Game): Game => {
  g.world.fog = createFog(fogCfg, cfg, g.hero, g.world.grid);
  return g;
};

const coverLeftOf = (g: Game, col: number): void => {
  const fog = g.world.fog!;
  for (let row = 0; row < fog.height; row++) fog.seen.fill(0, row * fog.width, row * fog.width + col);
};

const ROOM = [
  "##############",
  "#............#",
  "#............#",
  "#########....#",
  "#.......#....#",
  "#.......#....#",
  "#.......#....#",
  "#.......#....#",
  "##############",
];

describe("sight rect", () => {
  it("spans sightCells each side, rowsAbove above the feet and rowsBelow below", () => {
    expect(sightRect(fogCfg, cfg.sightCells, 10, 14)).toEqual({ left: 10 - cfg.sightCells, right: 10 + cfg.sightCells, top: 14 - fogCfg.rowsAbove, bottom: 14 + fogCfg.rowsBelow });
  });
});

describe("reveal", () => {
  it("uncovers the cells whose centres are in sight", () => {
    const g = fogged(game({ x: 10, y: 14 }));
    const fog = g.world.fog!;
    expect(revealedAt(fog, 10 - cfg.sightCells, 13)).toBe(true);
    expect(revealedAt(fog, 9 + cfg.sightCells, 13)).toBe(true);
    expect(revealedAt(fog, 9 - cfg.sightCells, 13)).toBe(false);
    expect(revealedAt(fog, 10 + cfg.sightCells, 13)).toBe(false);
    expect(revealedAt(fog, 10, 13 - fogCfg.rowsAbove)).toBe(false);
  });

  it("stops at walls and floors but uncovers the blocking cells", () => {
    const g = fogged(game({ x: 4.5, y: 8 }, { ...sandbox, rows: ROOM, lifts: [], enemies: [], props: [] }));
    const fog = g.world.fog!;
    expect(revealedAt(fog, 5, 6)).toBe(true);
    expect(revealedAt(fog, 8, 6)).toBe(true);
    expect(revealedAt(fog, 9, 6)).toBe(false);
    expect(revealedAt(fog, 4, 3)).toBe(true);
    expect(revealedAt(fog, 4, 2)).toBe(false);
  });

  it("stops at prop blockers unless they are see-through", () => {
    const gate = { kind: "gate", id: "gate", x: 6.5, y: 8, solidStates: [0], cells: { col: 6, row: 4, w: 1, h: 4 }, state: 0 };
    const room = (seeThrough: boolean) => fogged(game({ x: 4.5, y: 8 }, { ...sandbox, rows: ROOM, lifts: [], enemies: [], props: [{ ...gate, seeThrough }] }));
    expect(revealedAt(room(false).world.fog!, 7, 6)).toBe(false);
    expect(revealedAt(room(true).world.fog!, 7, 6)).toBe(true);
    expect(room(true).world.grid.solid(6, 6)).toBe(true);
  });

  it("stops at one-way floors like floors", () => {
    const rows = ROOM.map((r, i) => (i === 3 ? "#........====#" : r));
    const g = fogged(game({ x: 10.5, y: 8 }, { ...sandbox, rows, lifts: [], enemies: [], props: [] }));
    const fog = g.world.fog!;
    expect(revealedAt(fog, 10, 3)).toBe(true);
    expect(revealedAt(fog, 10, 2)).toBe(false);
  });

  it("sees from an eye inside a one-way floor and along its row", () => {
    const rows = ROOM.map((r, i) => (i === 6 ? "#.......#====#" : r));
    const g = fogged(game({ x: 10.5, y: 8 }, { ...sandbox, rows, lifts: [], enemies: [], props: [] }));
    const fog = g.world.fog!;
    expect(Math.floor(8 - cfg.box.height * 0.85)).toBe(6);
    expect(revealedAt(fog, 10, 2)).toBe(true);
    expect(revealedAt(fog, 12, 6)).toBe(true);
    expect(revealedAt(fog, 9, 7)).toBe(true);
  });

  it("keeps uncovered cells uncovered after the hero walks away", () => {
    const g = fogged(game({ x: 10.5, y: 14 }));
    run(g, 5, ["moveRight"]);
    expect(g.hero.x).toBeGreaterThan(17);
    expect(revealedAt(g.world.fog!, 5, 13)).toBe(true);
  });

  it("sees only the cells in the current sight", () => {
    const g = fogged(game({ x: 10.5, y: 14 }));
    expect(seenAt(g.world.fog!, 5, 13)).toBe(true);
    run(g, 5, ["moveRight"]);
    expect(seenAt(g.world.fog!, 5, 13)).toBe(false);
    expect(seenAt(g.world.fog!, Math.floor(g.hero.x), 13)).toBe(true);
  });

  it("bumps the version only when the seen cells change", () => {
    const g = fogged(game({ x: 10.5, y: 14 }));
    const fog = g.world.fog!;
    const before = fog.version;
    updateFog(fog, g.hero, cfg, 1 / 60);
    expect(fog.version).toBe(before);
    g.hero.x += 1;
    updateFog(fog, g.hero, cfg, 1 / 60);
    expect(fog.version).toBe(before + 1);
  });
});

describe("fog follow", () => {
  it("follows the hero sideways at once and eases to a new floor", () => {
    const g = fogged(game({ x: 3.5, y: 14 }));
    tick(g, [], ["up"]);
    run(g, 2, ["up"]);
    const fog = g.world.fog!;
    expect(fog.anchorY).toBeLessThan(14);
    expect(fog.anchorY - g.hero.y).toBeLessThan(0.5);
  });

  it("holds its height during a jump that stays inside", () => {
    const g = fogged(game({ x: 10.5, y: 14 }));
    tick(g, [], ["up"]);
    run(g, 0.3);
    expect(g.hero.onGround).toBe(false);
    expect(g.world.fog!.anchorY).toBe(14);
  });

  it("moves when the hero leaves it", () => {
    const g = game({ x: 10.5, y: 14 });
    g.world.fog = createFog(fogCfg, cfg, g.hero, g.world.grid);
    Object.assign(g.hero, { y: 4, onGround: false, state: "fall" });
    updateFog(g.world.fog, g.hero, cfg, 1 / 60);
    expect(g.world.fog.anchorY).toBeLessThan(14);
  });
});

describe("fog blocks shots", () => {
  it("ends hero shots at the edge with no impact spark", () => {
    const g = fogged(game({ x: 2.5, y: 14, weapon: "gun" }));
    tick(g, ["shoot"], ["shoot"]);
    run(g, 3, ["shoot"]);
    expect(g.world.sparks).toHaveLength(0);
  });

  it("keeps an enemy in a remembered cell safe from hero shots", () => {
    const g = fogged(game({ x: 9.5, y: 4, weapon: "gun" }));
    g.hero.facing = -1;
    Object.assign(g.world.enemies[0]!.body, { x: 4.5, facing: -1 });
    coverLeftOf(g, 7);
    fireShots(g.world, g.hero, [{ kind: "shot", x: g.hero.x, y: g.hero.y }], clips, cfg);
    expect(g.world.enemies[0]!.body.energy).toBe(sandbox.enemies[0]!.hits);
    expect(g.world.sparks).toHaveLength(0);
  });

  it("keeps an enemy in a remembered cell from seeing the hero", () => {
    const g = fogged(game({ x: 9.5, y: 4 }));
    const [enemy] = g.world.enemies;
    Object.assign(enemy!.body, { x: 5.5, facing: 1 });
    coverLeftOf(g, 8);
    for (let i = 0; i < 20; i++) expect(updateEnemy(enemy!, g.world.grid, g.world.fog, g.hero, clips, cfg, 1 / 60)).toBe(0);
    expect(enemy!.body.state).toBe("walk");
  });
});
