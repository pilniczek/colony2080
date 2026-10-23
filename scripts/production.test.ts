import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertNoOriginalGame, scrubConfig, scrubConfigFile } from "./production";

const distWith = (text: string): string => {
  const dir = mkdtempSync(join(tmpdir(), "c2080-dist-"));
  writeFileSync(join(dir, "page.js"), text);
  return dir;
};

describe("assertNoOriginalGame", () => {
  it("scrub rejects SND names", () => {
    expect(() => assertNoOriginalGame(distWith('play("KROK3.SND")'))).toThrow(/page\.js/);
  });

  it("rejects the original sound folder and Czech sound names", () => {
    for (const text of ["raw/CD/ZVUKY/", "STRELBA", "kulomet", "VYBUCH6", "VYTAH1", "SIRENA3", "INVEND", "P1_CANN"]) {
      expect(() => assertNoOriginalGame(distWith(text)), text).toThrow();
    }
  });

  it("rejects every distinctive stem of a mapped SND", () => {
    for (const text of ["LASER2", "laser3", "UDER", "KROK3", "IKONA", "DVERE", "DVERE2", "MRIZ2", "HROM", "ZKRAT", "HYDRA", "ZAZEH", "PRULET2", "PRELET", "VRATA1", "VRATA2", "ODLET", "VYBUCH2"]) {
      expect(() => assertNoOriginalGame(distWith(`play("${text}")`)), text).toThrow();
    }
  });

  it("passes words that only contain a stem", () => {
    expect(() => assertNoOriginalGame(distWith("dehydrated hydrant chrome laser lasers elevator krokodyl powder prelude shroom vratarna signal gate teleport"))).not.toThrow();
  });

  it("passes English sound ids", () => {
    expect(() => assertNoOriginalGame(distWith("gunShot cannon explosion liftStart siren inventory"))).not.toThrow();
  });
});

describe("scrubConfig", () => {
  it("blanks Czech names and sources, except the item names the game shows in Czech", () => {
    const item = { crowbar: { name: "crowbar", cs: "Páčidlo", preview: "x" } };
    expect(scrubConfig({ items: item })).toEqual({ items: { crowbar: { name: "crowbar", cs: "", preview: "" } } });
    expect(scrubConfigFile("/repo/config/items.json", { items: item })).toEqual({ items: { crowbar: { name: "crowbar", cs: "Páčidlo", preview: "" } } });
    expect(scrubConfigFile("/repo/config/levels/mesto/objects.json", { csName: "bar", cs: "bar" })).toEqual({ csName: "", cs: "" });
  });
});
