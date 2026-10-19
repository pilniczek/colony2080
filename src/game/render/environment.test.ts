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
  const e: Env = { ctx, world, cell: CELL, unit: 1, lines: 1, screen: worldRect, clip };
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

const painting = (p: Prop): number => {
  const { ctx } = counting();
  let count = 0;
  const spy = new Proxy(ctx, { get: (t, key) => (key === "fill" || key === "stroke" ? () => count++ : Reflect.get(t, key)) });
  prop({ ctx: spy, world, cell: CELL, unit: 1, lines: 1, screen: worldRect }, p);
  return count;
};

describe("object props", () => {
  it("paints an object from its asset in its state", () => {
    expect(painting({ kind: "object", id: "a", x: 3 })).toBe(0);
    expect(painting({ kind: "object", id: "a", asset: "switchboard", x: 3, state: 1 })).toBeGreaterThan(painting({ kind: "object", id: "a", asset: "switchboard", x: 3, state: 0 }));
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
