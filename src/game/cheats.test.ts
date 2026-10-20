import { describe, expect, it } from "vitest";
import { cheatOf, isCheatKey } from "./cheats";

describe("cheat codes", () => {
  it("maps each code to its cheat, ignoring case and outer spaces", () => {
    expect(cheatOf("c2080isforever")).toBe("immortal");
    expect(cheatOf(" C2080IsEverywhere ")).toBe("noFog");
  });

  it("rejects anything else", () => {
    for (const code of ["", "c2080", "constructor", "c2080isforeverx"]) expect(cheatOf(code)).toBeNull();
  });
});

describe("cheat key", () => {
  it("matches the typed semicolon on any layout, without modifiers", () => {
    expect(isCheatKey({ key: ";", ctrlKey: false, metaKey: false, altKey: false })).toBe(true);
    expect(isCheatKey({ key: "ů", ctrlKey: false, metaKey: false, altKey: false })).toBe(false);
    expect(isCheatKey({ key: ";", ctrlKey: true, metaKey: false, altKey: false })).toBe(false);
  });
});
