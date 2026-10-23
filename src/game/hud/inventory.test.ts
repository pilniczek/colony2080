import { describe, expect, it } from "vitest";
import { ITEMS, type ItemId } from "../items";
import { INVENTORY_BOXES, inventorySvg, type InventoryArt, type InventoryState } from "./inventory";

const art = (): InventoryArt => ({
  robot: { url: "robot.png", w: 100, h: 150 },
  liftPanel: { url: "panel.png", w: 15, h: 14 },
  body: { url: "body.png", w: 20, h: 40 },
  gun: { url: "gun.png", w: 20, h: 8 },
  items: Object.fromEntries(Object.keys(ITEMS).map((id) => [id, { url: `${id}.png`, w: 40, h: 30 }])) as InventoryArt["items"],
});

const base: InventoryState = { items: ["wires", "crowbar"], cursor: 0, energy: 40, shields: 2, ammo: 501, blaster: null };
const svg = (s: Partial<InventoryState> = {}): string => inventorySvg(320, 200, { ...base, ...s }, art());
const name = (id: ItemId): string => ITEMS[id]!.name.toUpperCase();

describe("inventory screen", () => {
  it("keeps every box apart", () => {
    const boxes = Object.values(INVENTORY_BOXES);
    for (const a of boxes) {
      for (const b of boxes) {
        if (a === b) continue;
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(apart).toBe(true);
      }
    }
  });

  it("leaves 2-unit gaps between neighbour boxes", () => {
    const { list, title, stats, ammo, item, robot } = INVENTORY_BOXES;
    expect(title.x - (list.x + list.w)).toBe(2);
    expect(stats.y - (title.y + title.h)).toBe(2);
    expect(ammo.y - (stats.y + stats.h)).toBe(2);
    expect(item.y - (list.y + list.h)).toBe(2);
    expect(robot.x - (title.x + title.w)).toBe(2);
  });

  it("lists names newest first", () => {
    const s = svg();
    expect(s.indexOf(name("crowbar"))).toBeLessThan(s.indexOf(name("wires")));
  });

  it("highlights the row under the cursor", () => {
    expect(svg({ cursor: 0 })).toMatch(new RegExp(`data-row="0" data-on="true"[^]*?${name("crowbar")}`));
    expect(svg({ cursor: 1 })).toMatch(new RegExp(`data-row="1" data-on="true"[^]*?${name("wires")}`));
  });

  it("draws the item under the cursor", () => {
    const s = svg({ cursor: 0 });
    expect(s).toContain('href="crowbar.png"');
    expect(s).not.toContain('href="wires.png"');
  });

  it("shows energy, shields and ammo", () => {
    const s = svg();
    expect(s).toContain("ENERGY");
    expect(s).toContain("40%");
    expect(s).toContain("x501");
    expect(s.match(/data-shield="on"/g)).toHaveLength(2);
    expect(s.match(/data-shield="off"/g)).toHaveLength(3);
  });

  it("shows EXTRA only with the E-Blaster", () => {
    expect(svg()).not.toContain("EXTRA");
    expect(svg({ blaster: 324 })).toContain("EXTRA x324");
  });

  it("draws no item picture when empty", () => {
    const s = svg({ items: [], cursor: 0 });
    for (const id of Object.keys(ITEMS)) expect(s).not.toContain(`href="${id}.png"`);
  });

  it("centres the layout and fills the screen with the room", () => {
    const s = inventorySvg(400, 300, base, art());
    expect(s).toContain('viewBox="0 0 400 300"');
    expect(s).toContain('transform="translate(40 50)"');
  });

  it("names no original game text", () => {
    const s = svg({ items: Object.keys(ITEMS) as ItemId[], blaster: 1 });
    for (const item of Object.values(ITEMS)) expect(s).not.toContain(item.cs);
    expect(s.toLowerCase()).not.toContain("x-bot");
  });
});
