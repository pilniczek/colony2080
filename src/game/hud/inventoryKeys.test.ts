import controls from "@config/controls.json";
import { describe, expect, it } from "vitest";
import { canOpenScreen, inventoryKey, openCursor, repeatsOnScreen, screenKey } from "./inventoryKeys";

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
    expect(canOpenScreen("death", false)).toBe(false);
    expect(canOpenScreen("jumpDeath", false)).toBe(false);
    expect(canOpenScreen("fallDeath", false)).toBe(false);
    expect(canOpenScreen("ladder", false)).toBe(true);
  });

  it("stays shut during a use so the used item cannot change", () => {
    expect(canOpenScreen("use", false)).toBe(false);
  });

  it("takes only its own keys and lets the rest through", () => {
    for (const code of ["ArrowUp", "ArrowDown", "Enter", "KeyI", "Escape"]) expect(screenKey(code, keys)).toBe(true);
    for (const code of ["KeyR", "F5", "Tab", "ArrowLeft", "Digit1"]) expect(screenKey(code, keys)).toBe(false);
  });

  it("repeats only the cursor keys", () => {
    expect(repeatsOnScreen("ArrowUp", keys)).toBe(true);
    expect(repeatsOnScreen("ArrowDown", keys)).toBe(true);
    expect(repeatsOnScreen("Enter", keys)).toBe(false);
    expect(repeatsOnScreen("KeyI", keys)).toBe(false);
  });

  it("stays shut while input is recorded or replayed", () => {
    expect(canOpenScreen("idle", true)).toBe(false);
  });
});
