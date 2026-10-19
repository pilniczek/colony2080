import tasks from "@config/levels/mesto/tasks.json";
import { describe, expect, it } from "vitest";
import { ITEMS, loadItems } from "./items";

const entry = (asset: string | null) => ({ name: "x", cs: "x", icon: { asset, tilt: 0, scale: 1 } });

describe("loadItems", () => {
  it("names the item and field of an invalid entry", () => {
    expect(() => loadItems({ items: { a: { cs: "x", icon: { asset: null, tilt: 0, scale: 1 } } } })).toThrow("item a: missing name");
    expect(() => loadItems({ items: { a: { name: "x", cs: "x" } } })).toThrow("item a: missing icon");
    expect(() => loadItems({ items: { a: { name: "x", cs: "x", icon: { asset: null, tilt: "1", scale: 1 } } } })).toThrow("item a: icon needs numeric tilt and scale");
  });

  it("defaults the icon state to 0", () => {
    expect(loadItems({ items: { a: entry(null) } }).a!.icon.state).toBe(0);
  });

  it("rejects an unknown asset", () => {
    expect(() => loadItems({ items: { a: entry("nope") } })).toThrow("unknown asset: nope");
  });

  it("accepts a null asset as a placeholder", () => {
    expect(loadItems({ items: { a: entry(null) } }).a!.icon.asset).toBeNull();
  });

  it("keeps the crowbar look and configures the crane key", () => {
    expect(ITEMS.crowbar!.icon).toEqual({ asset: "crowbar", state: 0, tilt: 45, scale: 1.25 });
    expect(ITEMS.craneKey!.icon.asset).toBe("craneKey");
  });
});

describe("task graph", () => {
  it("has an item config for every item token", () => {
    const tokens = tasks.tasks.flatMap((t) => [...t.requires, ...(t.consumes ?? []), ...t.gives]).filter((v) => v.startsWith("item:"));
    expect(tokens.length).toBeGreaterThan(0);
    for (const token of tokens) expect(ITEMS[token.slice("item:".length)], token).toBeDefined();
  });

  it("draws the ship part from a visible state", () => {
    expect(ITEMS.shipPart!.icon.state).toBe(1);
  });
});
