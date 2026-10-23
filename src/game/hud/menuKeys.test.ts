import controls from "@config/controls.json";
import { describe, expect, it } from "vitest";
import type { SlotEntry, Slots } from "../save/slots";
import { gameOverState, menuKey, type MenuState } from "./menuKeys";

const keys = controls.keyboard;
const press = (code: string, key = code) => ({ code, key });
const filled = { mission: "mesto", name: "City", savedAt: 1, picture: "", snapshot: {} } as unknown as SlotEntry;
const slots: Slots = [filled, null, null, null, { ...filled, mission: "other" }];
const list = (screen: "save" | "load", extra: Partial<MenuState & { screen: "save" }> = {}): MenuState => ({ screen, cursor: 0, typing: null, confirm: false, message: null, ...extra }) as MenuState;
const step = (state: MenuState, code: string, key?: string) => menuKey(state, press(code, key), slots, "mesto", keys);

describe("menuKey", () => {
  it("moves the pause cursor and stops at the ends", () => {
    expect(step({ screen: "pause", cursor: 0 }, "ArrowUp").state).toEqual({ screen: "pause", cursor: 0 });
    expect(step({ screen: "pause", cursor: 3 }, "ArrowDown").state).toEqual({ screen: "pause", cursor: 3 });
    expect(step({ screen: "pause", cursor: 0 }, "ArrowDown").state).toEqual({ screen: "pause", cursor: 1 });
  });

  it("opens the lists, goes home and closes on Esc", () => {
    expect(step({ screen: "pause", cursor: 0 }, "Enter").state).toEqual(list("save"));
    expect(step({ screen: "pause", cursor: 1 }, "Enter").state).toEqual(list("load"));
    const leave = step({ screen: "pause", cursor: 3 }, "Enter");
    expect(leave.action).toBeUndefined();
    expect(leave.state).toEqual({ screen: "pause", cursor: 3, confirm: true });
    expect(step(leave.state!, "Enter").action).toBe("home");
    expect(step(leave.state!, "Escape").state).toEqual({ screen: "pause", cursor: 3 });
    expect(step({ screen: "pause", cursor: 0 }, "Escape").state).toBeNull();
  });

  it("asks before restarting the mission", () => {
    const restart = step({ screen: "pause", cursor: 2 }, "Enter");
    expect(restart.action).toBeUndefined();
    expect(restart.state).toEqual({ screen: "pause", cursor: 2, confirm: true });
    expect(step(restart.state!, "Enter").action).toBe("restartMission");
    expect(step(restart.state!, "Escape").state).toEqual({ screen: "pause", cursor: 2 });
  });

  it("types a slot name and saves an empty slot at once", () => {
    let s = step(list("save", { cursor: 1 }), "Enter").state!;
    expect(s).toMatchObject({ typing: "" });
    s = step(s, "KeyD", "d").state!;
    s = step(s, "KeyX", "x").state!;
    s = step(s, "Backspace").state!;
    expect(s).toMatchObject({ typing: "d" });
    const done = step(s, "Enter");
    expect(done).toMatchObject({ action: "save", slot: 1, name: "d" });
  });

  it("asks before overwriting a filled slot", () => {
    const typed = step(list("save"), "Enter").state!;
    const asked = step(typed, "Enter");
    expect(asked.action).toBeUndefined();
    expect(asked.state).toMatchObject({ confirm: true });
    expect(step(asked.state!, "Enter")).toMatchObject({ action: "save", slot: 0 });
    expect(step(asked.state!, "Escape").state).toMatchObject({ confirm: false });
  });

  it("caps the typed name at 16 characters", () => {
    const s = list("save", { typing: "a".repeat(16) });
    expect(step(s, "KeyB", "b").state).toMatchObject({ typing: "a".repeat(16) });
  });

  it("cancels typing on Esc, then steps back to the pause menu", () => {
    const typing = list("save", { typing: "ab" });
    const back = step(typing, "Escape").state!;
    expect(back).toMatchObject({ typing: null });
    expect(step(back, "Escape").state).toEqual({ screen: "pause", cursor: 0 });
  });

  it("loads only a filled slot of this mission", () => {
    expect(step(list("load"), "Enter")).toMatchObject({ action: "load", slot: 0 });
    expect(step(list("load", { cursor: 1 }), "Enter").action).toBeUndefined();
    expect(step(list("load", { cursor: 4 }), "Enter").action).toBeUndefined();
  });

  it("offers load, restart and exit after game over", () => {
    const over = gameOverState(true);
    expect(over).toMatchObject({ cursor: 0 });
    expect(step(over, "Enter").action).toBe("load");
    expect(step({ ...over, cursor: 1 } as MenuState, "Enter").action).toBe("restart");
    expect(step({ ...over, cursor: 2 } as MenuState, "Enter").action).toBe("end");
    expect(step(over, "Escape").state).toEqual(over);
  });

  it("skips load after game over when no save loads", () => {
    const over = gameOverState(false);
    expect(over).toMatchObject({ cursor: 1 });
    expect(step(over, "ArrowUp").state).toMatchObject({ cursor: 1 });
    expect(step(over, "ArrowDown").state).toMatchObject({ cursor: 2 });
  });
});
