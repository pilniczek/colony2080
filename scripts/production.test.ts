import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertNoOriginalGame } from "./production";

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

  it("passes English sound ids", () => {
    expect(() => assertNoOriginalGame(distWith("gunShot cannon explosion liftStart siren inventory"))).not.toThrow();
  });
});
