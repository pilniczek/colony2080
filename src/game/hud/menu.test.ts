import { describe, expect, it } from "vitest";
import type { SlotEntry, Slots } from "../save/slots";
import { VIEW_BOX } from "./layout";
import { menuSvg } from "./menu";

const icon = { url: "data:,", w: 10, h: 20 };
const robot = { robot: icon, liftPanel: { url: "data:panel", w: 15, h: 14 } };
const slot = (name: string): SlotEntry => ({ mission: "mesto", name, savedAt: Date.UTC(2026, 9, 20, 21, 14), picture: "data:image/jpeg;base64,AA", snapshot: {} } as unknown as SlotEntry);
const slots: Slots = [slot("City - door"), null, null, null, null, slot("City - Autosave")];

describe("menuSvg", () => {
  it("lists the pause entries", () => {
    const svg = menuSvg(320, 200, { screen: "pause", cursor: 0 }, slots, robot);
    for (const entry of ["SAVE GAME", "LOAD GAME", "RESTART MISSION"]) expect(svg).toContain(entry);
    expect(svg).not.toContain("MISSION SELECT");
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

  it("puts game over at the dead hero height, centred on the screen", () => {
    const svg = menuSvg(320, 200, { screen: "gameOver", cursor: 1, canLoad: false, at: { x: 100, y: 80 } }, slots, robot);
    expect(svg).toMatch(/<text x="160" y="80" text-anchor="middle"[^>]*>GAME OVER</);
  });

  it("fills only the game window, so the HUD frame stays in view, for pause, save and load", () => {
    const W = 400, H = 200;
    const w = W - VIEW_BOX.left - VIEW_BOX.right, h = H - VIEW_BOX.top - VIEW_BOX.bottom;
    const k = Math.min(w / 320, h / 200);
    for (const state of [{ screen: "pause", cursor: 0 }, { screen: "load", cursor: 0, typing: null, confirm: false, message: null }] as const) {
      const svg = menuSvg(W, H, state, slots, robot);
      expect(svg).not.toContain(`width="${W}" height="${H}"`);
      expect(svg).toContain(`<rect x="${VIEW_BOX.left}" y="${VIEW_BOX.top}" width="${w}" height="${h}" fill="#0a1f14"/>`);
      expect(svg).toContain(`transform="translate(${VIEW_BOX.left + (w - 320 * k) / 2} ${VIEW_BOX.top + (h - 200 * k) / 2}) scale(${k})"`);
    }
  });

  it("asks before restarting the mission", () => {
    expect(menuSvg(320, 200, { screen: "pause", cursor: 2, confirm: true }, slots, robot)).toContain("RESTART? UNSAVED PROGRESS IS LOST");
  });

  it("shows the manual with the lift panel under settings and the pause menu, in the chosen language", () => {
    for (const state of [{ screen: "settings", cursor: 2, autosave: true }, { screen: "pause", cursor: 0 }] as const) {
      const en = menuSvg(320, 200, state, slots, robot);
      for (const entry of [">MANUAL<", ">MOVE<", ">JUMP, CLIMB UP<", ">DUCK, CLIMB DOWN<", ">SHOOT / PUNCH<", ">ENTER CALLS A DISTANT LIFT<", ">X<", ">HIDING MIGHT BE MORE THAN SHOOTING<", 'href="data:panel"']) expect(en).toContain(entry);
      const cs = menuSvg(320, 200, state, slots, robot, "City", "cs");
      for (const entry of [">NÁVOD<", ">POHYB<", ">ENTER PŘIVOLÁ VZDÁLENÝ VÝTAH<", ">SKRÝVÁNÍ MŮŽE BÝT VÍC NEŽ STŘÍLENÍ<"]) expect(cs).toContain(entry);
    }
  });

  it("shows settings with the active options lit, in the chosen language", () => {
    const svg = menuSvg(320, 200, { screen: "settings", cursor: 2, autosave: false }, slots, robot);
    for (const entry of ["SETTINGS", ">AUTOSAVE<", ">NO AUTOSAVE<", ">ENGLISH<", ">ČESKY<", ">START<"]) expect(svg).toContain(entry);
    expect(svg).toContain('<tspan fill="#f2e7a0" text-decoration="underline">NO AUTOSAVE</tspan>');
    expect(svg).toContain('<tspan fill="#5aa9a0">AUTOSAVE</tspan>');
    const cs = menuSvg(320, 200, { screen: "settings", cursor: 2, autosave: true }, slots, robot, "City", "cs");
    for (const entry of ["NASTAVENÍ", ">AUTOUKLÁDÁNÍ<", ">RUČNĚ<", ">SPUSTIT<"]) expect(cs).toContain(entry);
    expect(cs).toContain('<tspan fill="#f2e7a0" text-decoration="underline">ČESKY</tspan>');
  });

  it("marks only the switch rows with a left and right triangle", () => {
    const settings = menuSvg(320, 200, { screen: "settings", cursor: 2, autosave: true }, slots, robot);
    expect(settings.match(/data-arrow="left"/g)).toHaveLength(2);
    expect(settings.match(/data-arrow="right"/g)).toHaveLength(2);
    const pause = menuSvg(320, 200, { screen: "pause", cursor: 0 }, slots, robot);
    expect(pause.match(/data-arrow="left"/g)).toHaveLength(2);
  });

  it("shows the autosave and language rows in the pause menu, in Czech too", () => {
    const svg = menuSvg(320, 200, { screen: "pause", cursor: 0 }, slots, robot, "City", "cs", true);
    for (const entry of ["ULOŽIT HRU", "NAHRÁT HRU", ">AUTOUKLÁDÁNÍ<", ">ČESKY<", "RESTARTOVAT MISI"]) expect(svg).toContain(entry);
    expect(menuSvg(320, 200, { screen: "gameOver", cursor: 1, canLoad: false }, slots, robot, "City", "cs")).toContain(">KONEC HRY<");
  });

  it("shows the auto slot in the load list only", () => {
    const load = menuSvg(320, 200, { screen: "load", cursor: 0, typing: null, confirm: false, message: null }, slots, robot);
    expect(load).toContain("CITY - AUTOSAVE");
    expect(load).toContain(">AUTO<");
    const save = menuSvg(320, 200, { screen: "save", cursor: 0, typing: null, confirm: false, message: null }, slots, robot);
    expect(save).not.toContain("AUTOSAVE");
  });

  it("escapes typed text", () => {
    expect(menuSvg(320, 200, { screen: "save", cursor: 1, typing: "<b>&", confirm: false, message: null }, slots, robot)).toContain("&lt;B&gt;&amp;");
  });
});
