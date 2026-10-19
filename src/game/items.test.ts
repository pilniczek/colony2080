import { describe, expect, it } from "vitest";
import { ITEMS, loadItems } from "./items";

const entry = (asset: string | null) => ({ name: "x", cs: "x", icon: { asset, tilt: 0, scale: 1 } });

describe("loadItems", () => {
  it("rejects an unknown asset", () => {
    expect(() => loadItems({ items: { a: entry("nope") } })).toThrow("unknown asset: nope");
  });

  it("accepts a null asset as a placeholder", () => {
    expect(loadItems({ items: { a: entry(null) } }).a!.icon.asset).toBeNull();
  });

  it("keeps the crowbar look and configures the crane key", () => {
    expect(ITEMS.crowbar!.icon).toEqual({ asset: "crowbar", tilt: 45, scale: 1.25 });
    expect(ITEMS.craneKey!.icon.asset).toBe("craneKey");
  });
});
