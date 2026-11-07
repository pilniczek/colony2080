import { describe, expect, it } from "vitest";
import { ASSISTS, presetPicks, START_DIFFICULTY as D } from "../difficulty";
import { tr } from "../i18n";
import type { SlotEntry, Slots } from "../save/slots";
import { VIEW_BOX } from "./layout";
import { helpLayout, helpTextW, menuSvg } from "./menu";
import { difficultyState, gameOverState, type DifficultyState } from "./menuKeys";
import { hudFit } from "./layout";

const icon = { url: "data:,", w: 10, h: 20 };
const robot = { robot: icon, liftPanel: { url: "data:panel", w: 15, h: 14 }, liftDeck: { url: "data:lift", w: 8, h: 16 }, wireBox: { url: "data:wires", w: 9, h: 16 }, crashedShip: { url: "data:ship", w: 22, h: 7 }, crowbar: { url: "data:crowbar", w: 22, h: 4 } };
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

  it("asks before restarting the mission in the box right of the menu", () => {
    const svg = menuSvg(320, 200, { screen: "pause", cursor: 2, confirm: true }, slots, robot);
    expect(svg).toContain("RESTART?");
    expect(svg).toContain("UNSAVED PROGRESS IS LOST");
    expect(menuSvg(320, 200, { screen: "pause", cursor: 2, confirm: true }, slots, robot, "City", "cs")).toContain("NEULOŽENÝ POSTUP SE ZTRATÍ");
  });

  it("shows the manual and the tips with their pictures under settings and the pause menu, in the chosen language", () => {
    for (const state of [{ screen: "settings", cursor: 2, autosave: true, difficulty: D }, { screen: "pause", cursor: 0 }] as const) {
      const en = menuSvg(320, 200, state, slots, robot);
      for (const entry of [">MANUAL<", ">MOVE<", ">JUMP, CLIMB UP<", ">DUCK, CLIMB DOWN<", ">SHOOT / PUNCH<", ">ENTER<", ">USE ITEM FROM INVENTORY<", ">I<", ">INVENTORY<", ">ENTER CALLS A DISTANT LIFT<", ">X<", ">HIDING MIGHT BE MORE THAN SHOOTING<", ">ENTER TO USE THE LIFT<", ">ENTER TO USE THINGS<", ">ENTER PICKS UP AN ITEM<", ">SOME THINGS NEED TO BE DAMAGED<", 'href="data:panel"', 'href="data:lift"', 'href="data:wires"', 'href="data:ship"', 'href="data:crowbar"']) expect(en).toContain(entry);
      const cs = menuSvg(320, 200, state, slots, robot, "City", "cs");
      for (const entry of [">OVLÁDÁNÍ<", ">POHYB<", ">POUŽITÍ PŘEDMĚTU Z INVENTÁŘE<", ">INVENTÁŘ<", ">ENTER PŘIVOLÁ VZDÁLENÝ VÝTAH<", ">SKRÝVÁNÍ MŮŽE BÝT VÍC NEŽ STŘÍLENÍ<", ">ENTER POUŽIJE VÝTAH<", ">ENTER POUŽIJE VĚCI<", ">NĚKTERÉ VĚCI JE TŘEBA POŠKODIT<"]) expect(cs).toContain(entry);
      expect(en).not.toContain(">TIPS<");
      expect(cs.match(/>OVLÁDÁNÍ</g)).toHaveLength(1);
      const rowY = (value: string): string | undefined => en.match(new RegExp(`y="([\\d.]+)"[^>]*>${value}<`))?.[1];
      expect(rowY("SOME THINGS NEED TO BE DAMAGED")).toBe(rowY("HIDING MIGHT BE MORE THAN SHOOTING"));
      expect(rowY("ENTER TO USE THE LIFT")).toBe(rowY("MOVE"));
      expect(rowY("MOVE")).toBeDefined();
    }
  });

  it("shows settings with the active options lit, in the chosen language", () => {
    const svg = menuSvg(320, 200, { screen: "settings", cursor: 2, autosave: false, difficulty: D }, slots, robot);
    for (const entry of ["SETTINGS", ">AUTOSAVE<", ">NO AUTOSAVE<", ">ENGLISH<", ">ČESKY<", ">START<"]) expect(svg).toContain(entry);
    expect(svg).toContain('<tspan fill="#f2e7a0" data-option="1" text-decoration="underline">NO AUTOSAVE</tspan>');
    expect(svg).toContain('<tspan fill="#5aa9a0" data-option="0">AUTOSAVE</tspan>');
    const cs = menuSvg(320, 200, { screen: "settings", cursor: 2, autosave: true, difficulty: D }, slots, robot, "City", "cs");
    for (const entry of ["NASTAVENÍ", ">AUTOUKLÁDÁNÍ<", ">UKLÁDÁNÍ RUČNĚ<", ">SPUSTIT<"]) expect(cs).toContain(entry);
    expect(cs).toContain('<tspan fill="#f2e7a0" data-option="1" text-decoration="underline">ČESKY</tspan>');
  });

  it("marks only the switch rows with a left and right triangle", () => {
    const settings = menuSvg(320, 200, { screen: "settings", cursor: 2, autosave: true, difficulty: D }, slots, robot);
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

  it("adds a HELP row to settings and the pause menu", () => {
    expect(menuSvg(320, 200, { screen: "settings", cursor: 3, autosave: true, difficulty: D }, slots, robot)).toContain(">HELP<");
    expect(menuSvg(320, 200, { screen: "pause", cursor: 0 }, slots, robot, "City", "cs")).toContain(">NÁPOVĚDA<");
  });

  it("shows the help screen with a BACK button and weapon 3 only with the E-Blaster", () => {
    const help = { screen: "help", cursor: 0, from: { screen: "pause", cursor: 5 } } as const;
    const en = menuSvg(400, 200, help, slots, robot);
    for (const entry of [">OPENS THE MENU<", ">FISTS<", ">MAP<", ">HIDE<", ">ITEM IN HAND: ENTER USES IT, I OPENS INVENTORY<", ">SHIELDS: SPARE LIVES<", ">PRO TIP<", ">BACK<", 'data-menu-row="0"']) expect(en).toContain(entry);
    expect(en).not.toContain(">E-BLASTER<");
    expect(en).not.toContain(">MANUAL<");
    expect(menuSvg(400, 200, help, slots, robot, "City", "en", false, true)).toContain(">E-BLASTER<");
    const cs = menuSvg(400, 200, help, slots, robot, "City", "cs", false, true);
    for (const entry of [">ZPĚT<", ">OTEVŘE MENU<", ">TIP PRO PROFÍKY<", ">DRŽ VÍC KLÁVES NARÁZ, NAPŘ. C A X.<", ">E-BLASTER<", ">SKRÝVÁNÍ<"]) expect(cs).toContain(entry);
  });

  it("keeps every help label clear of the other labels and of every arrow, on narrow and wide screens", () => {
    const TEXT = 5.2;
    for (const [width, height] of [[320, 200], [1280, 800], [2000, 1024], [1920, 1080], [800, 900]] as const) {
      const { W, H } = hudFit(width, height);
      for (const lang of ["en", "cs"] as const) {
        for (const blaster of [false, true]) {
          const { labels, arrows, tip, back } = helpLayout(W, H, blaster, lang);
          const words = labels.map(({ x, y, end, text }) => {
            const w = helpTextW(text);
            return { x0: end ? x - w : x, x1: end ? x : x + w, y0: y - TEXT * 0.8, y1: y + TEXT * 0.25 };
          });
          const boxes = [...words, ...[tip, back].map(({ x, y, w, h }) => ({ x0: x, x1: x + w, y0: y, y1: y + h }))];
          for (const b of boxes) {
            expect(b.x0).toBeGreaterThanOrEqual(VIEW_BOX.left);
            expect(b.x1).toBeLessThanOrEqual(W - VIEW_BOX.right);
          }
          boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => expect(a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0, `${width}x${height} ${lang} ${labels[i]?.text ?? "box"}`).toBe(true)));
          for (const { path } of arrows) {
            const [mx, my, hx, vy] = path.match(/-?[\d.]+/g)!.map(Number) as [number, number, number, number?];
            const hit = (x0: number, x1: number, y0: number, y1: number) => boxes.some((b) => Math.max(x0, b.x0) < Math.min(x1, b.x1) && Math.max(y0, b.y0) < Math.min(y1, b.y1));
            expect(hit(Math.min(mx, hx), Math.max(mx, hx), my - 0.3, my + 0.3), path).toBe(false);
            if (vy !== undefined) expect(hit(hx - 0.3, hx + 0.3, Math.min(my, vy), Math.max(my, vy)), path).toBe(false);
          }
        }
      }
    }
  });
});

describe("difficulty screen", () => {
  const pause = { screen: "pause", cursor: 3 } as const;
  const open = (picks = D) => ({ ...(difficultyState(pause, D) as DifficultyState), picks });
  const custom = { level: "custom", assists: ["hideAnywhere", "fogOff", "strongPunches", "moreAmmo"] };

  it("lists the levels with HARD dimmed, every assist, the points and READ ONLY for a preset", () => {
    const svg = menuSvg(320, 200, open(), slots, robot);
    for (const entry of [">DIFFICULTY<", ">STORY<", ">EASY<", ">NORMAL<", ">CUSTOM<", ">POINTS<", ">7<", ">READ ONLY<", ">BACK<", ...ASSISTS.map((a) => `>${a.label}<`)]) expect(svg).toContain(entry);
    expect(svg).toMatch(/<tspan opacity="[\d.]+"><tspan fill="[^"]+">HARD<\/tspan><\/tspan>/);
    expect(svg).not.toContain("RESTART?");
  });

  it("shows the preset columns and the tier the CUSTOM points reach", () => {
    const svg = menuSvg(320, 200, open(custom), slots, robot);
    expect(svg).toContain(">10<");
    expect(svg).toContain(">LIKE EASY<");
    for (const head of [">S<", ">E<", ">N<", ">H<"]) expect(svg).toContain(head);
    expect(menuSvg(320, 200, open(custom), slots, robot, "City", "cs")).toContain(">JAKO LEHKÁ<");
  });

  it("offers a restart once the picks change and asks before it", () => {
    const story = open({ level: "story", assists: presetPicks("story").assists });
    expect(menuSvg(320, 200, story, slots, robot)).toContain(">APPLY AND RESTART<");
    expect(menuSvg(320, 200, { ...story, confirm: true }, slots, robot)).toContain("RESTART?");
  });

  it("names the level on the settings and pause rows and the game over choice, in Czech too", () => {
    expect(menuSvg(320, 200, { screen: "settings", cursor: 0, autosave: true, difficulty: D }, slots, robot)).toContain(">DIFFICULTY: NORMAL<");
    expect(menuSvg(320, 200, pause, slots, robot, "City", "cs", false, false, presetPicks("easy"))).toContain(">OBTÍŽNOST: LEHKÁ<");
    expect(menuSvg(320, 200, gameOverState(false), slots, robot)).toContain(">CHANGE DIFFICULTY<");
  });

  it("fits every assist name left of the preset columns and cost pips, in both languages", () => {
    const columns = 3 * 3 + 2 * 1.4 + 6 + 4 * 7;
    for (const lang of ["en", "cs"] as const) for (const a of ASSISTS) expect(10 + 4.4 + 4 + helpTextW(tr(a.label, lang)) * (6.4 / 5.2) + columns + 10 + 2).toBeLessThanOrEqual(200);
  });
});
