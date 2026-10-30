import { describe, expect, it } from "vitest";
import { menuPointOf } from "./pointer";

const at = (attrs: Record<string, string>): EventTarget =>
  ({ closest: (selector: string) => (selector.slice(1, -1) in attrs ? { getAttribute: (name: string) => attrs[name] ?? null } : null) }) as unknown as EventTarget;

describe("menuPointOf", () => {
  it("reads the row and the clicked side of an option row", () => {
    expect(menuPointOf(at({ "data-menu-row": "2" }), false)).toEqual({ row: 2, press: "hover" });
    expect(menuPointOf(at({ "data-menu-row": "2" }), true)).toEqual({ row: 2, press: "useItem" });
    expect(menuPointOf(at({ "data-menu-row": "0", "data-arrow": "right" }), true)).toEqual({ row: 0, press: "moveRight" });
    expect(menuPointOf(at({ "data-menu-row": "1", "data-option": "0" }), true)).toEqual({ row: 1, press: "moveLeft" });
    expect(menuPointOf(at({ "data-menu-row": "1", "data-option": "1" }), false)).toEqual({ row: 1, press: "hover" });
  });

  it("ignores targets outside a row", () => {
    expect(menuPointOf(at({}), true)).toBeNull();
    expect(menuPointOf(null, true)).toBeNull();
  });
});
