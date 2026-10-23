import jeskyneLevel from "@config/levels/jeskyne/level.json";
import jungleLevel from "@config/levels/jungle/level.json";
import mestoLevel from "@config/levels/mesto/level.json";
import vesniceLevel from "@config/levels/vesnice/level.json";
import { describe, expect, it } from "vitest";
import type { Snapshot } from "./snapshot";
import { AUTO_SLOT, missionName, readSlots, slotLabel, slotFromQuery, slotHref, slotName, writeSlot, type SlotEntry } from "./slots";

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
    expect(slotName("vesnice", "lift")).toBe("Suburb - lift");
    expect(slotName("jungle", "")).toBe("Jungle");
    expect(slotName("jeskyne", "lava")).toBe("Caves - lava");
  });

  it.each([mestoLevel, vesniceLevel, jungleLevel, jeskyneLevel])("names $id as its level.json English name", (level) => {
    expect(missionName(level.id)).toBe(level.name.en);
  });

  it("reads back what it wrote, five slots", () => {
    const storage = memory();
    expect(writeSlot(storage, 1, entry("mesto", 5))).toBe(true);
    const slots = readSlots(storage, "mesto");
    expect(slots).toHaveLength(6);
    expect(slots[1]).toEqual(entry("mesto", 5));
    expect(slots[0]).toBeNull();
  });

  it("keeps one auto slot per mission after the five", () => {
    const storage = memory();
    expect(writeSlot(storage, AUTO_SLOT, entry("mesto", 5))).toBe(true);
    expect(writeSlot(storage, AUTO_SLOT, entry("jungle", 6))).toBe(true);
    expect(readSlots(storage, "mesto")[AUTO_SLOT]).toEqual(entry("mesto", 5));
    expect(readSlots(storage, "jungle")[AUTO_SLOT]).toEqual(entry("jungle", 6));
    expect(readSlots(storage, "jungle").slice(0, AUTO_SLOT)).toEqual([null, null, null, null, null]);
    expect(storage.getItem("c2080.save.auto.mesto")).not.toBeNull();
    expect(slotLabel(AUTO_SLOT)).toBe("AUTO");
    expect(slotLabel(1)).toBe("B");
  });

  it("survives storage that throws or holds garbage", () => {
    const broken = { ...memory(), getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); } } as Storage;
    expect(writeSlot(broken, 0, entry("mesto", 1))).toBe(false);
    expect(readSlots(broken, "mesto")).toEqual([null, null, null, null, null, null]);
    expect(readSlots(null, "mesto")).toEqual([null, null, null, null, null, null]);
    const junk = memory();
    junk.setItem("c2080.save.A", "{oops");
    junk.setItem("c2080.save.B", JSON.stringify({ ...entry("mesto", 1), picture: 'x" onerror="alert(1)' }));
    junk.setItem("c2080.save.C", JSON.stringify({ ...entry("mesto", 1), savedAt: "now" }));
    junk.setItem("c2080.save.D", JSON.stringify({ ...entry("mesto", 1), snapshot: null }));
    expect(readSlots(junk, "mesto")).toEqual([null, null, null, null, null, null]);
  });

  it("links a slot by its mission and letter and reads the letter back from the query", () => {
    expect(slotHref("jungle", 2)).toBe("game.html?mission=jungle&slot=C");
    expect(slotFromQuery("?mission=jungle&slot=C")).toBe(2);
    expect(slotFromQuery("?slot=C")).toBe(2);
    expect(slotHref("jungle", AUTO_SLOT)).toBe("game.html?mission=jungle&slot=AUTO");
    expect(slotFromQuery("?slot=AUTO")).toBe(AUTO_SLOT);
    expect(slotFromQuery("?slot=Z")).toBeNull();
    expect(slotFromQuery("")).toBeNull();
  });
});
