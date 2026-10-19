import controls from "@config/controls.json";
import { describe, expect, it } from "vitest";
import { canOpenInventory, inventoryKey, openCursor } from "./inventoryKeys";

const keys = controls.keyboard;

describe("inventory keys", () => {
  it("starts the cursor on the shown item", () => {
    expect(openCursor(["wires", "crowbar"], "wires")).toBe(1);
    expect(openCursor(["wires", "crowbar"], "crowbar")).toBe(0);
    expect(openCursor([], null)).toBe(0);
  });

  it("moves the cursor and stops at the list ends", () => {
    expect(inventoryKey("ArrowDown", 0, 2, keys)).toEqual({ cursor: 1, pick: false, close: false });
    expect(inventoryKey("ArrowDown", 1, 2, keys)).toEqual({ cursor: 1, pick: false, close: false });
    expect(inventoryKey("ArrowUp", 0, 2, keys)).toEqual({ cursor: 0, pick: false, close: false });
  });

  it("picks with ENTER and closes", () => {
    expect(inventoryKey("Enter", 1, 2, keys)).toEqual({ cursor: 1, pick: true, close: true });
  });

  it("closes without a pick on an empty list", () => {
    expect(inventoryKey("Enter", 0, 0, keys)).toEqual({ cursor: 0, pick: false, close: true });
  });

  it("closes without a pick on I or Esc", () => {
    expect(inventoryKey("KeyI", 1, 2, keys)).toEqual({ cursor: 1, pick: false, close: true });
    expect(inventoryKey("Escape", 1, 2, keys)).toEqual({ cursor: 1, pick: false, close: true });
  });

  it("ignores other keys", () => {
    expect(inventoryKey("KeyX", 1, 2, keys)).toEqual({ cursor: 1, pick: false, close: false });
  });

  it("opens only in live states", () => {
    expect(canOpenInventory("death", false)).toBe(false);
    expect(canOpenInventory("jumpDeath", false)).toBe(false);
    expect(canOpenInventory("fallDeath", false)).toBe(false);
    expect(canOpenInventory("ladder", false)).toBe(true);
  });

  it("stays shut while input is recorded or replayed", () => {
    expect(canOpenInventory("idle", true)).toBe(false);
  });
});
