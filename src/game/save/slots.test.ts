import { describe, expect, it } from "vitest";
import type { Snapshot } from "./snapshot";
import { readSlots, slotFromQuery, slotHref, slotName, writeSlot, type SlotEntry } from "./slots";

const memory = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
};

const entry = (mission: string, savedAt: number): SlotEntry => ({ mission, name: slotName(mission, ""), savedAt, picture: "data:image/jpeg;base64,AA", snapshot: {} as Snapshot });

describe("slots", () => {
  it("names a slot by its mission and the typed text", () => {
    expect(slotName("mesto", "")).toBe("City");
    expect(slotName("mesto", "door")).toBe("City - door");
  });

  it("reads back what it wrote, five slots", () => {
    const storage = memory();
    expect(writeSlot(storage, 1, entry("mesto", 5))).toBe(true);
    const slots = readSlots(storage);
    expect(slots).toHaveLength(5);
    expect(slots[1]).toEqual(entry("mesto", 5));
    expect(slots[0]).toBeNull();
  });

  it("survives storage that throws or holds garbage", () => {
    const broken = { ...memory(), getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); } } as Storage;
    expect(writeSlot(broken, 0, entry("mesto", 1))).toBe(false);
    expect(readSlots(broken)).toEqual([null, null, null, null, null]);
    expect(readSlots(null)).toEqual([null, null, null, null, null]);
    const junk = memory();
    junk.setItem("c2080.save.A", "{oops");
    junk.setItem("c2080.save.B", JSON.stringify({ ...entry("mesto", 1), picture: 'x" onerror="alert(1)' }));
    junk.setItem("c2080.save.C", JSON.stringify({ ...entry("mesto", 1), savedAt: "now" }));
    junk.setItem("c2080.save.D", JSON.stringify({ ...entry("mesto", 1), snapshot: null }));
    expect(readSlots(junk)).toEqual([null, null, null, null, null]);
  });

  it("links a slot by its letter and reads it back from the query", () => {
    expect(slotHref("game.html", 2)).toBe("game.html?slot=C");
    expect(slotFromQuery("?slot=C")).toBe(2);
    expect(slotFromQuery("?slot=Z")).toBeNull();
    expect(slotFromQuery("")).toBeNull();
  });
});
