import mapJson from "@config/levels/mesto/map.json";
import tasksJson from "@config/levels/mesto/tasks.json";
import worldJson from "@config/levels/mesto/world.json";
import { describe, expect, it } from "vitest";
import { itemName, knowsCs, loadLang, saveLang, tr } from "./i18n";
import { ITEMS } from "./items";
import { loadMesto } from "./level/mesto";
import { showItem, pickUp } from "./level/sandboxLevel";
import { hintFor } from "./level/tasks";

const texts = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(texts);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, v]) => ((key === "subtitle" || key === "hint") && typeof v === "string" ? [v] : texts(v)));
};

describe("i18n", () => {
  it("has Czech for every mission 1 subtitle and hint", () => {
    const missing = [...texts(tasksJson), ...texts(worldJson), ...texts(mapJson)].filter((text) => !knowsCs(text));
    expect(missing).toEqual([]);
  });

  it("has Czech for every hint an object use can say, with each item shown", () => {
    const world = loadMesto();
    for (const id of Object.keys(ITEMS)) pickUp(world, id);
    const said = new Set<string>();
    for (const prop of world.props.filter((p) => p.kind === "object")) {
      said.add((world.inventory.shown = null, hintFor(prop, world)));
      for (const id of Object.keys(ITEMS)) {
        showItem(world, id);
        said.add(hintFor(prop, world));
      }
    }
    const untranslated = [...said].filter((text) => tr(text, "cs") === text);
    expect(untranslated).toEqual([]);
  });

  it("names the wrong item in Czech without a gendered verb", () => {
    expect(tr("Ship part didn't work, maybe something else might be useful here.", "cs")).toBe("Součástka: tady to nefunguje, možná pomůže něco jiného.");
    expect(tr("Crane key didn't work, maybe something else might be useful here.", "cs")).toBe("Klíč: tady to nefunguje, možná pomůže něco jiného.");
  });

  it("keeps English as is and translates known text to Czech", () => {
    expect(tr("Game saved.", "en")).toBe("Game saved.");
    expect(tr("Game saved.", "cs")).toBe("Hra uložena.");
    expect(tr("unknown text", "cs")).toBe("unknown text");
  });

  it("names items and pickups in the chosen language", () => {
    expect(itemName("crowbar", "en")).toBe("crowbar");
    expect(itemName("crowbar", "cs")).toBe("Páčidlo");
    expect(tr("Picked up crowbar", "cs")).toBe("Sebráno: Páčidlo");
    expect(tr("Picked up E-Blaster", "cs")).toBe("Sebráno: E-Blaster");
  });

  it("remembers the language, English when unset or unreadable", () => {
    const data = new Map<string, string>();
    const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
    expect(loadLang(storage)).toBe("en");
    saveLang("cs", storage);
    expect(loadLang(storage)).toBe("cs");
    expect(loadLang(null)).toBe("en");
    expect(loadLang({ getItem: () => { throw new Error("blocked"); } })).toBe("en");
  });
});
