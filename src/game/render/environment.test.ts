import sandboxJson from "@config/levels/sandbox.json";
import { describe, expect, it, vi } from "vitest";
import { ITEMS } from "../items";
import { loadMesto } from "../level/mesto";
import { loadSandbox, type Prop } from "../level/sandboxLevel";
import { loadMission } from "../level/missions";
import { above, askTiles, below, bucketByTile, drawnTerrain, paintTilesWith, prop, type Env, type TileJob } from "./environment";
import movementJson from "@config/hero/movement.json";
import { loadMovement } from "../hero/config";
import type { Rect } from "../geometry";

const CELL = 24;

const drawn = vi.hoisted(() => ({ count: 0 }));

vi.mock("../env/paint", async (actual) => {
  const paint = await actual<typeof import("../env/paint")>();
  return { ...paint, drawAsset: (...args: Parameters<typeof paint.drawAsset>) => (drawn.count++, paint.drawAsset(...args)) };
});

const counting = () => {
  let assets = 0;
  const ctx: object = new Proxy(() => undefined, {
    get: (_, key) => {
      if (key === Symbol.toPrimitive) return () => 0;
      if (key === "getTransform") return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
      if (key === "save") return () => void assets++;
      return ctx;
    },
    apply: () => ctx,
    set: () => true,
  });
  return { ctx: ctx as CanvasRenderingContext2D, assets: () => assets };
};

const world = loadSandbox(sandboxJson);
const worldRect = { x: 0, y: 0, w: world.grid.width * CELL, h: world.grid.height * CELL };

const painted = (clip?: Rect): number => {
  const { ctx, assets } = counting();
  const e: Env = { ctx, world, hero: { blaster: null }, cell: CELL, unit: 1, lines: 1, screen: worldRect, clip };
  below(e);
  above(e);
  return assets();
};

describe("static layer culling", () => {
  it("paints no asset for a tile far from all content", () => {
    expect(painted({ x: worldRect.w * 10, y: worldRect.h * 10, w: 200, h: 200 })).toBe(0);
  });

  it("paints fewer assets for one tile than for the whole layer", () => {
    const all = painted();
    const one = painted({ x: worldRect.w / 2, y: worldRect.h / 2, w: 100, h: 100 });
    expect(one).toBeGreaterThan(0);
    expect(one).toBeLessThan(all / 2);
  });

  it("paints every asset for a tile covering the layer", () => {
    expect(painted(worldRect)).toBe(painted());
  });
});

describe("bucketByTile", () => {
  const items = [
    { id: "a", box: { x: 10, y: 10, w: 20, h: 20 } },
    { id: "b", box: { x: 90, y: 10, w: 30, h: 20 } },
    { id: "c", box: { x: 250, y: 150, w: 10, h: 10 } },
  ];
  const lookup = bucketByTile(items, (i) => i.box, 100);
  const ids = (col: number, row: number): string[] => lookup(col, row).map((i) => i.id);

  it("files each item under every tile its box touches, in item order", () => {
    expect(ids(0, 0)).toEqual(["a", "b"]);
    expect(ids(1, 0)).toEqual(["b"]);
    expect(ids(2, 1)).toEqual(["c"]);
  });

  it("returns nothing for an empty tile", () => {
    expect(ids(5, 5)).toEqual([]);
  });
});

describe("mesto static tile", () => {
  const mesto = loadMesto();
  const tile = 256;
  const size = { w: mesto.grid.width * CELL, h: mesto.grid.height * CELL };
  const paint = (clip?: Rect, at?: { col: number; row: number }): number => {
    const { ctx } = counting();
    drawn.count = 0;
    const e: Env = { ctx, world: mesto, hero: { blaster: null }, cell: CELL, unit: 1, lines: 1, screen: { x: 0, y: 0, ...size }, clip, tile: at && { ...at, px: tile } };
    below(e);
    above(e);
    return drawn.count;
  };

  it("paints a tile from its bucket only", () => {
    const all = paint();
    const col = Math.floor(size.w / 2 / tile);
    const row = Math.floor(size.h / 2 / tile);
    const one = paint({ x: col * tile, y: row * tile, w: tile, h: tile }, { col, row });
    expect(one).toBeGreaterThan(0);
    expect(one).toBeLessThan(all / 20);
  });

  it("paints every tile the same with and without the index", () => {
    for (let row = 0; row * tile < size.h; row++) {
      for (let col = 0; col * tile < size.w; col++) {
        const clip = { x: col * tile, y: row * tile, w: tile, h: tile };
        expect(paint(clip, { col, row })).toBe(paint(clip));
      }
    }
  });
});

const painting = (p: Prop, hero: { blaster: number | null } = { blaster: null }): number => {
  const { ctx } = counting();
  let count = 0;
  const spy = new Proxy(ctx, { get: (t, key) => (key === "fill" || key === "stroke" ? () => count++ : Reflect.get(t, key)) });
  prop({ ctx: spy, world, hero, cell: CELL, unit: 1, lines: 1, screen: worldRect }, p);
  return count;
};

describe("object props", () => {
  it("paints an object from its asset in its state", () => {
    expect(painting({ kind: "object", id: "a", x: 3 })).toBe(0);
    expect(painting({ kind: "object", id: "a", asset: "switchboard", x: 3, state: 1 })).toBeGreaterThan(painting({ kind: "object", id: "a", asset: "switchboard", x: 3, state: 0 }));
  });
});

const placedAt = (p: Prop): number[] => {
  const { ctx } = counting();
  let at: number[] = [];
  const spy = new Proxy(ctx, { get: (t, key) => (key === "translate" ? (...args: number[]) => void (at.length || (at = args)) : Reflect.get(t, key)) });
  prop({ ctx: spy, world, hero: { blaster: null }, cell: CELL, unit: 1, lines: 1, screen: worldRect }, p);
  return at;
};

describe("prop art offset", () => {
  it("moves the art by art.dx and art.dy cells and keeps it in place without one", () => {
    const base = placedAt({ kind: "object", id: "a", asset: "switchboard", x: 3, y: 5 });
    expect(placedAt({ kind: "object", id: "a", asset: "switchboard", x: 3, y: 5, art: { dx: 2, dy: -1 } })).toEqual([base[0]! + 2 * CELL, base[1]! - CELL]);
    expect(placedAt({ kind: "object", id: "a", asset: "switchboard", x: 3, y: 5, art: { dx: 0.5 } })).toEqual([base[0]! + 0.5 * CELL, base[1]!]);
  });
});

describe("item props", () => {
  const fills = (item: string, taken: boolean): number => painting({ kind: "item", item, x: 3, taken });

  it.each(Object.keys(ITEMS))("paints %s from its asset", (item) => {
    expect(fills(item, false)).toBeGreaterThan(0);
  });

  it("paints nothing once taken", () => {
    expect(fills("wires", true)).toBe(0);
  });
});

describe("weapon props", () => {
  const blaster: Prop = { kind: "weapon", weapon: "blaster", x: 3 };

  it("paints the E-Blaster while the hero has none", () => {
    expect(painting(blaster, { blaster: null })).toBeGreaterThan(0);
  });

  it("paints nothing once the hero owns it", () => {
    expect(painting(blaster, { blaster: 0 })).toBe(0);
    expect(painting(blaster, { blaster: 400 })).toBe(0);
  });

  it("runs the neighbour floor on behind each lift shaft row it reaches, from both sides or up to a wall, never at the bottom stop", () => {
    const mesto = loadMesto();
    const { behind } = drawnTerrain(mesto);
    const { ledges, girders } = mesto.terrain;
    const floorAt = (col: number, row: number): string | null =>
      ledges.some((r) => r.row === row && col >= r.col && col < r.col + r.w) ? "streetWalkway" : girders.some((r) => r.row === row && col >= r.col && col < r.col + r.w) ? "girderBridge" : null;
    const rows = new Set(behind.map((r) => `${mesto.lifts.find((l) => r.col >= l.x && r.col < l.x + l.w && r.row >= l.top && r.row < l.bottom)?.x},${r.row}`));
    expect(rows.size).toBe(15);
    for (const l of mesto.lifts) {
      expect(behind.some((r) => r.row === l.bottom && r.col >= l.x && r.col < l.x + l.w)).toBe(false);
      for (const r of behind.filter((b) => b.row >= l.top && b.row < l.bottom && b.col >= l.x && b.col < l.x + l.w)) {
        expect(r.col + r.w <= l.x + l.w).toBe(true);
        expect([floorAt(l.x - 1, r.row), floorAt(l.x + l.w, r.row)]).toContain(r.asset);
      }
    }
    const lift = mesto.lifts.find((l) => l.x === 52)!;
    expect(behind.filter((r) => r.row === 10 && r.col >= lift.x && r.col < lift.x + lift.w).map((r) => r.asset)).toEqual(["girderBridge", "streetWalkway"]);
  });

  it("leaves bare cells, lift stops and the cells under bottom stops out of the terrain runs and lands each = stop", () => {
    const mesto = loadMesto();
    const { ledges: mestoLedges, behind, ...mestoRest } = drawnTerrain(mesto);
    expect(behind.every((r) => mesto.lifts.some((l) => r.col >= l.x && r.col < l.x + l.w && r.row >= l.top && r.row < l.bottom))).toBe(true);
    expect(mestoRest).toEqual({ walls: mesto.terrain.walls, girders: mesto.terrain.girders, landings: [], bases: mesto.lifts.map((l) => ({ row: l.bottom, col: l.x, w: l.w })) });
    for (const l of mesto.lifts) {
      for (let col = l.x; col < l.x + l.w; col++) expect(mestoLedges.some((r) => r.row === l.bottom + 1 && col >= r.col && col < r.col + r.w), `${col},${l.bottom + 1}`).toBe(false);
    }
    const vesnice = loadMission("vesnice");
    const { walls, ledges, girders, landings, bases } = drawnTerrain(vesnice);
    expect(bases).toEqual([]);
    const covers = (col: number, row: number): boolean =>
      [...ledges.map((r) => ({ ...r, h: 1 })), ...girders.map((r) => ({ ...r, h: 1 })), ...walls].some((r) => row >= r.row && row < r.row + r.h && col >= r.col && col < r.col + r.w);
    for (let col = 45; col < 57; col++) expect(covers(col, 41), String(col)).toBe(false);
    expect(covers(44, 41)).toBe(true);
    expect(covers(57, 41)).toBe(true);
    for (const l of vesnice.lifts) for (const row of l.stops) {
      expect(landings).toContainEqual({ row, col: l.x, w: l.w });
      expect(covers(l.x, row)).toBe(false);
    }
  });
});

describe("tiles painted aside", () => {
  it("asks for the start view tiles under the scale the canvas keeps, as float32", () => {
    const jobs: TileJob[] = [];
    const own = loadSandbox(sandboxJson);
    paintTilesWith(own, (job) => void jobs.push(job));
    askTiles(own, loadMovement(movementJson), 1, { scale: 1.590277777777778, offsetX: 0, offsetY: 0 }, { x: 0, y: 0, w: 600, h: 400 });
    expect(jobs.length).toBeGreaterThan(0);
    expect(new Set(jobs.map((job) => job.scale))).toEqual(new Set([Math.fround(1.590277777777778)]));
    expect(new Set(jobs.map((job) => job.layer))).toEqual(new Set(["below", "above"]));
  });
});
