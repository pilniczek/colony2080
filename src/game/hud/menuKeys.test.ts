import controls from "@config/controls.json";
import { describe, expect, it } from "vitest";
import { START_DIFFICULTY as D } from "../difficulty";
import type { SlotEntry, Slots } from "../save/slots";
import { ASSISTS, presetPicks } from "../difficulty";
import { DIFFICULTY_ROWS, difficultyState, gameOverState, menuKey, menuPoint, PAUSE_ROWS, SETTINGS_ROWS, type DifficultyState, type MenuPress, type MenuState } from "./menuKeys";

const keys = controls.keyboard;
const press = (code: string, key = code) => ({ code, key });
const filled = { mission: "mesto", name: "City", savedAt: 1, picture: "", snapshot: {} } as unknown as SlotEntry;
const slots: Slots = [filled, null, null, null, { ...filled, mission: "other" }, filled];
const list = (screen: "save" | "load", extra: Partial<MenuState & { screen: "save" }> = {}): MenuState => ({ screen, cursor: 0, typing: null, confirm: false, message: null, ...extra }) as MenuState;
const step = (state: MenuState, code: string, key?: string) => menuKey(state, press(code, key), slots, "mesto", keys);

describe("menuKey", () => {
  it("switches autosave and language with Left and Right, and only START starts", () => {
    const at = { screen: "settings", cursor: 4, autosave: true, difficulty: D } as const;
    expect(step(at, "ArrowUp").state).toEqual({ ...at, cursor: 3 });
    expect(step({ ...at, cursor: 0 }, "ArrowUp").state).toEqual({ ...at, cursor: 0 });
    expect(step({ ...at, cursor: 0 }, "ArrowRight").state).toEqual({ ...at, cursor: 0, autosave: false });
    expect(step({ ...at, cursor: 0, autosave: false }, "ArrowLeft").state).toEqual({ ...at, cursor: 0 });
    expect(step({ ...at, cursor: 1 }, "ArrowRight")).toEqual({ state: { ...at, cursor: 1 }, action: "lang", lang: "cs" });
    expect(step({ ...at, cursor: 1 }, "ArrowLeft")).toEqual({ state: { ...at, cursor: 1 }, action: "lang", lang: "en" });
    expect(step({ ...at, cursor: 0 }, "Enter")).toEqual({ state: { ...at, cursor: 0 } });
    expect(step({ ...at, cursor: 1 }, "Enter")).toEqual({ state: { ...at, cursor: 1 } });
    expect(step({ ...at, autosave: false }, "Enter")).toEqual({ state: null, action: "difficulty", autosave: false, difficulty: D });
    expect(step(at, "Escape")).toEqual({ state: at, action: "home" });
  });

  it("switches autosave and language from the pause menu", () => {
    expect(step({ screen: "pause", cursor: 4 }, "ArrowRight")).toEqual({ state: { screen: "pause", cursor: 4 }, action: "autosave", autosave: false });
    expect(step({ screen: "pause", cursor: 4 }, "ArrowLeft")).toEqual({ state: { screen: "pause", cursor: 4 }, action: "autosave", autosave: true });
    expect(step({ screen: "pause", cursor: 5 }, "ArrowRight")).toEqual({ state: { screen: "pause", cursor: 5 }, action: "lang", lang: "cs" });
    expect(step({ screen: "pause", cursor: 5 }, "Enter")).toEqual({ state: { screen: "pause", cursor: 5 } });
    expect(step({ screen: "pause", cursor: 0 }, "ArrowRight")).toEqual({ state: { screen: "pause", cursor: 0 } });
  });

  it("loads the auto slot from the load list but never saves into it", () => {
    expect(step(list("load", { cursor: 4 }), "ArrowDown").state).toMatchObject({ cursor: 5 });
    expect(step(list("load", { cursor: 5 }), "Enter")).toMatchObject({ action: "load", slot: 5 });
    expect(step(list("save", { cursor: 4 }), "ArrowDown").state).toMatchObject({ cursor: 4 });
  });

  it("moves the pause cursor and stops at the ends", () => {
    expect(step({ screen: "pause", cursor: 0 }, "ArrowUp").state).toEqual({ screen: "pause", cursor: 0 });
    expect(step({ screen: "pause", cursor: 6 }, "ArrowDown").state).toEqual({ screen: "pause", cursor: 6 });
    expect(step({ screen: "pause", cursor: 0 }, "ArrowDown").state).toEqual({ screen: "pause", cursor: 1 });
  });

  it("opens the lists and closes on Esc", () => {
    expect(step({ screen: "pause", cursor: 0 }, "Enter").state).toEqual(list("save"));
    expect(step({ screen: "pause", cursor: 1 }, "Enter").state).toEqual(list("load"));
    expect(step({ screen: "pause", cursor: 0 }, "Escape").state).toBeNull();
  });

  it("asks before restarting the mission", () => {
    const restart = step({ screen: "pause", cursor: 2 }, "Enter");
    expect(restart.action).toBeUndefined();
    expect(restart.state).toEqual({ screen: "pause", cursor: 2, confirm: true });
    expect(step(restart.state!, "Enter").action).toBe("restart");
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

  it("offers load, restart, difficulty and exit after game over", () => {
    const over = gameOverState(true);
    expect(over).toMatchObject({ cursor: 0 });
    expect(step(over, "Enter").action).toBe("load");
    expect(step({ ...over, cursor: 1 } as MenuState, "Enter").action).toBe("restart");
    expect(step({ ...over, cursor: 2 } as MenuState, "Enter").action).toBe("chooseDifficulty");
    expect(step({ ...over, cursor: 3 } as MenuState, "Enter").action).toBe("end");
    expect(step(over, "Escape").state).toEqual(over);
  });

  it("skips load after game over when no save loads", () => {
    const over = gameOverState(false);
    expect(over).toMatchObject({ cursor: 1 });
    expect(step(over, "ArrowUp").state).toMatchObject({ cursor: 1 });
    expect(step(over, "ArrowDown").state).toMatchObject({ cursor: 2 });
  });
});

describe("menuPoint", () => {
  const point = (state: MenuState, row: number, press: MenuPress) => menuPoint(state, { row, press }, slots, "mesto", keys);

  it("moves the cursor to a hovered row and acts on a clicked one like Enter", () => {
    const at = { screen: "pause", cursor: 0 } as const;
    expect(point(at, 2, "hover")).toEqual({ state: { screen: "pause", cursor: 2 } });
    expect(point(at, 0, "hover").state).toBe(at);
    expect(point(at, 2, "useItem")).toEqual({ state: { screen: "pause", cursor: 2, confirm: true } });
    expect(point({ screen: "settings", cursor: 0, autosave: true, difficulty: D }, 4, "useItem")).toEqual({ state: null, action: "difficulty", autosave: true, difficulty: D });
  });

  it("switches an option row toward the clicked side", () => {
    const at = { screen: "settings", cursor: 3, autosave: true, difficulty: D } as const;
    expect(point(at, 0, "moveRight").state).toEqual({ ...at, cursor: 0, autosave: false });
    expect(point(at, 1, "moveRight")).toEqual({ state: { ...at, cursor: 1 }, action: "lang", lang: "cs" });
  });

  it("skips a greyed load row and keeps a typing or confirming row", () => {
    const over = gameOverState(false);
    expect(point(over, 0, "hover").state).toBe(over);
    expect(point(over, 0, "useItem")).toEqual({ state: over });
    const typing = list("save", { cursor: 1, typing: "ab" });
    expect(point(typing, 2, "hover").state).toBe(typing);
    expect(point(typing, 2, "useItem")).toEqual({ state: typing });
    expect(point(typing, 1, "useItem")).toEqual({ state: { ...typing, typing: null }, action: "save", slot: 1, name: "ab" });
    const asking = { screen: "pause", cursor: 2, confirm: true } as const;
    expect(point(asking, 0, "useItem")).toEqual({ state: asking });
    expect(point(asking, 2, "useItem")).toEqual({ state: asking, action: "restart" });
  });

  it("clears a list message when the cursor moves", () => {
    expect(point(list("load", { message: "Saved." }), 1, "hover").state).toMatchObject({ cursor: 1, message: null });
  });
});

describe("help", () => {
  it("opens from the HELP row of settings and the pause menu and goes back with Enter, Esc or a click", () => {
    const settings = { screen: "settings", cursor: 3, autosave: false, difficulty: D } as const;
    const help = step(settings, "Enter").state!;
    expect(help).toEqual({ screen: "help", cursor: 0, from: settings });
    expect(step(help, "Enter").state).toBe(settings);
    expect(step(help, "Escape").state).toBe(settings);
    expect(step(help, "ArrowDown").state).toBe(help);
    expect(menuPoint(help, { row: 0, press: "useItem" }, slots, "mesto", keys).state).toBe(settings);
    const pause = { screen: "pause", cursor: 6 } as const;
    expect(step(pause, "Enter").state).toEqual({ screen: "help", cursor: 0, from: pause });
  });
});

describe("difficulty", () => {
  const settings = { screen: "settings", cursor: SETTINGS_ROWS.difficulty, autosave: true, difficulty: D } as const;
  const pause = { screen: "pause", cursor: PAUSE_ROWS.difficulty } as const;
  const assistRow = (id: string) => DIFFICULTY_ROWS.first + ASSISTS.findIndex((a) => a.id === id);
  const custom = { level: "custom", assists: D.assists };

  it("opens from settings, switches presets, skips HARD and hands the picks back without a restart", () => {
    const open = step(settings, "Enter").state as DifficultyState;
    expect(open).toEqual(difficultyState(settings, D));
    const easy = step(open, "ArrowLeft").state as DifficultyState;
    expect(easy.picks).toEqual(presetPicks("easy"));
    expect((step(open, "ArrowRight").state as DifficultyState).picks).toEqual(custom);
    expect(step({ ...easy, cursor: DIFFICULTY_ROWS.done }, "Enter")).toEqual({ state: { ...settings, difficulty: presetPicks("easy") } });
    expect(step(easy, "Escape")).toEqual({ state: settings });
  });

  it("toggles an assist on Enter only in CUSTOM and never a locked one", () => {
    const preset = { ...(difficultyState(settings, D) as DifficultyState), cursor: assistRow("fogOff") };
    expect(step(preset, "Enter").state).toBe(preset);
    const own = { ...preset, picks: custom };
    expect((step(own, "Enter").state as DifficultyState).picks.assists).toContain("fogOff");
    const locked = { ...own, cursor: assistRow("hideAnywhere") };
    expect(step(locked, "Enter").state).toBe(locked);
  });

  it("asks the runner to open it from the pause menu and game over", () => {
    expect(step(pause, "Enter")).toEqual({ state: pause, action: "chooseDifficulty" });
    const over = { ...gameOverState(false), cursor: 2 } as MenuState;
    expect(step(over, "Enter")).toEqual({ state: over, action: "chooseDifficulty" });
  });

  it("restarts with new picks only after a confirm from the pause menu, at once from game over, and goes back when nothing changed", () => {
    const open = { ...(difficultyState(pause, D) as DifficultyState), cursor: DIFFICULTY_ROWS.done };
    expect(step(open, "Enter")).toEqual({ state: pause });
    const story = { ...open, picks: presetPicks("story") };
    const asking = step(story, "Enter").state as DifficultyState;
    expect(asking.confirm).toBe(true);
    expect(step(asking, "Escape").state).toEqual({ ...asking, confirm: false });
    expect(step(asking, "Enter")).toMatchObject({ action: "restartWith", difficulty: presetPicks("story") });
    const over = { ...(difficultyState(gameOverState(false) as DifficultyState["from"], D) as DifficultyState), cursor: DIFFICULTY_ROWS.done, picks: presetPicks("story") };
    expect(step(over, "Enter")).toMatchObject({ action: "restartWith", difficulty: presetPicks("story") });
  });
});
