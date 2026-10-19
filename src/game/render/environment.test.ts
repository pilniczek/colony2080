import sandboxJson from "@config/levels/sandbox.json";
import { describe, expect, it } from "vitest";
import { ITEMS } from "../items";
import { loadSandbox, type Prop } from "../level/sandboxLevel";
import { above, below, prop, type Env } from "./environment";
import type { Rect } from "../geometry";

const CELL = 24;

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
});
