import { describe, expect, it } from "vitest";
import type { SlotEntry, Slots } from "../save/slots";
import { menuSvg } from "./menu";

const robot = { url: "data:,", w: 10, h: 20 };
const slot = (name: string): SlotEntry => ({ mission: "mesto", name, savedAt: Date.UTC(2026, 9, 20, 21, 14), picture: "data:image/jpeg;base64,AA", snapshot: {} } as unknown as SlotEntry);
const slots: Slots = [slot("City - door"), null, null, null, null];

describe("menuSvg", () => {
  it("lists the pause entries", () => {
    const svg = menuSvg(320, 200, { screen: "pause", cursor: 0 }, slots, robot);
    for (const entry of ["SAVE GAME", "LOAD GAME", "MISSION SELECT"]) expect(svg).toContain(entry);
  });

  it("shows each slot name, empty slots, the picture and the typed name", () => {
    const svg = menuSvg(320, 200, { screen: "save", cursor: 1, typing: "lift", confirm: false, message: null }, slots, robot);
    expect(svg).toContain("CITY - DOOR");
    expect(svg).toContain("EMPTY");
    expect(svg).toContain("data:image/jpeg;base64,AA");
    expect(svg).toContain("CITY - LIFT|");
  });

  it("asks before overwriting and shows a message", () => {
    expect(menuSvg(320, 200, { screen: "save", cursor: 0, typing: "x", confirm: true, message: null }, slots, robot)).toContain("OVERWRITE?");
    expect(menuSvg(320, 200, { screen: "save", cursor: 0, typing: null, confirm: false, message: "Save failed." }, slots, robot)).toContain("SAVE FAILED.");
  });

  it("shows game over with load, restart and exit, and a message", () => {
    const svg = menuSvg(320, 200, { screen: "gameOver", cursor: 1, canLoad: false, message: "This save is damaged." }, slots, robot);
    for (const entry of [">GAME OVER<", "LOAD LAST SAVE", "RESTART MISSION", "EXIT", "THIS SAVE IS DAMAGED."]) expect(svg).toContain(entry);
  });

  it("puts game over over the dead hero", () => {
    const svg = menuSvg(320, 200, { screen: "gameOver", cursor: 1, canLoad: false, at: { x: 100, y: 80 } }, slots, robot);
    expect(svg).toMatch(/<text x="100" y="80" text-anchor="middle"[^>]*>GAME OVER</);
  });

  it("asks before leaving to mission select", () => {
    expect(menuSvg(320, 200, { screen: "pause", cursor: 2, confirm: true }, slots, robot)).toContain("UNSAVED PROGRESS IS LOST");
  });

  it("escapes typed text", () => {
    expect(menuSvg(320, 200, { screen: "save", cursor: 1, typing: "<b>&", confirm: false, message: null }, slots, robot)).toContain("&lt;B&gt;&amp;");
  });
});
