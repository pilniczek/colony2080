import { describe, expect, it } from "vitest";
import { cheatOf, isCheatKey } from "./cheats";

describe("cheat codes", () => {
  it("maps each code to its cheat, ignoring case and outer spaces", () => {
    expect(cheatOf("c2080isforever")).toBe("immortal");
    expect(cheatOf(" C2080IsEverywhere ")).toBe("noFog");
    expect(cheatOf("c2080ispowerful")).toBe("weapon");
    expect(cheatOf("c2080isrich")).toBe("items");
    expect(cheatOf("c2080isunstoppable")).toBe("open");
    expect(cheatOf("c2080isdebugging")).toBe("debug");
  });

  it("reads the moveto target cell", () => {
    expect(cheatOf("moveto(40,10)")).toEqual({ moveTo: [40, 10] });
    expect(cheatOf(" MoveTo( 39.5 , 16 ) ")).toEqual({ moveTo: [39.5, 16] });
  });

  it("reads moveto(start) as the spawn cell", () => {
    expect(cheatOf("moveto(start)")).toEqual({ moveTo: "start" });
    expect(cheatOf(" MoveTo( Start ) ")).toEqual({ moveTo: "start" });
  });

  it("rejects anything else", () => {
    for (const code of ["", "c2080", "constructor", "c2080isforeverx", "moveto(40)", "moveto(a,10)", "moveto(1,2,3)", "moveto 40,10", "moveto(start,1)", "moveto()"]) expect(cheatOf(code)).toBeNull();
  });
});

describe("cheat key", () => {
  it("matches the typed semicolon on any layout, without modifiers", () => {
    expect(isCheatKey({ key: ";", ctrlKey: false, metaKey: false, altKey: false })).toBe(true);
    expect(isCheatKey({ key: "ů", ctrlKey: false, metaKey: false, altKey: false })).toBe(false);
    expect(isCheatKey({ key: ";", ctrlKey: true, metaKey: false, altKey: false })).toBe(false);
  });
});
