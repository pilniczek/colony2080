import type { Bindings } from "../../engine/input";
import type { Lang } from "../i18n";
import { AUTO_SLOT, type Slots } from "../save/slots";

export const NAME_MAX = 16;
const GAME_OVER_ROWS = 3;
export const PAUSE_ROWS = { save: 0, load: 1, autosave: 2, lang: 3, restart: 4, home: 5 } as const;
export const SETTINGS_ROWS = { autosave: 0, lang: 1, start: 2 } as const;
const PAUSE_COUNT = Object.keys(PAUSE_ROWS).length;
const SETTINGS_COUNT = Object.keys(SETTINGS_ROWS).length;

type ListScreen = { screen: "save" | "load"; cursor: number; typing: string | null; confirm: boolean; message: string | null };

export type MenuState =
  | { screen: "settings"; cursor: number; autosave: boolean }
  | { screen: "pause"; cursor: number; confirm?: boolean }
  | ListScreen
  | { screen: "gameOver"; cursor: number; canLoad: boolean; message?: string | null; at?: { x: number; y: number } | null };

export const gameOverState = (canLoad: boolean, message: string | null = null, at: { x: number; y: number } | null = null): MenuState => ({
  screen: "gameOver",
  cursor: canLoad ? 0 : 1,
  canLoad,
  message,
  at,
});

export type MenuAction = "save" | "load" | "restart" | "end" | "home" | "difficulty" | "autosave" | "lang";

export interface MenuResult {
  state: MenuState | null;
  action?: MenuAction;
  slot?: number;
  name?: string;
  autosave?: boolean;
  lang?: Lang;
}

export const settingsState = (): MenuState => ({ screen: "settings", cursor: SETTINGS_ROWS.start, autosave: true });

const listOf = (screen: "save" | "load"): ListScreen => ({ screen, cursor: 0, typing: null, confirm: false, message: null });

const moved = (cursor: number, rows: number, dy: number): number => Math.max(0, Math.min(rows - 1, cursor + dy));

function typed(s: ListScreen, key: { code: string; key: string }, slots: Slots, typing: string, is: (action: string) => boolean): MenuResult {
  if (s.confirm) {
    if (is("useItem")) return { state: { ...s, typing: null, confirm: false }, action: "save", slot: s.cursor, name: typing };
    if (is("menu")) return { state: { ...s, confirm: false } };
    return { state: s };
  }
  if (is("menu")) return { state: { ...s, typing: null } };
  if (is("useItem")) {
    if (slots[s.cursor]) return { state: { ...s, confirm: true } };
    return { state: { ...s, typing: null }, action: "save", slot: s.cursor, name: typing };
  }
  if (key.code === "Backspace") return { state: { ...s, typing: typing.slice(0, -1) } };
  if (key.key.length === 1 && typing.length < NAME_MAX) return { state: { ...s, typing: typing + key.key } };
  return { state: s };
}

function list(s: ListScreen, key: { code: string; key: string }, slots: Slots, mission: string, is: (action: string) => boolean): MenuResult {
  if (s.typing !== null) return typed(s, key, slots, s.typing, is);
  if (is("menu")) return { state: { screen: "pause", cursor: s.screen === "save" ? 0 : 1 } };
  if (is("up") || is("down")) return { state: { ...s, cursor: moved(s.cursor, s.screen === "save" ? AUTO_SLOT : slots.length, is("up") ? -1 : 1), message: null } };
  if (!is("useItem")) return { state: s };
  if (s.screen === "save") return { state: { ...s, typing: "", message: null } };
  return slots[s.cursor]?.mission === mission ? { state: s, action: "load", slot: s.cursor } : { state: s };
}

function gameOver(state: Extract<MenuState, { screen: "gameOver" }>, is: (action: string) => boolean): MenuResult {
  const first = state.canLoad ? 0 : 1;
  if (is("up") || is("down")) return { state: { ...state, cursor: Math.max(first, moved(state.cursor, GAME_OVER_ROWS, is("up") ? -1 : 1)) } };
  if (!is("useItem")) return { state };
  return { state, action: (["load", "restart", "end"] as const)[state.cursor] };
}

const sideways = (is: (action: string) => boolean): -1 | 1 | 0 => (is("moveLeft") ? -1 : is("moveRight") ? 1 : 0);

function settings(state: Extract<MenuState, { screen: "settings" }>, is: (action: string) => boolean): MenuResult {
  const side = sideways(is);
  if (is("up") || is("down")) return { state: { ...state, cursor: moved(state.cursor, SETTINGS_COUNT, is("up") ? -1 : 1) } };
  if (is("menu")) return { state, action: "home" };
  if (side && state.cursor === SETTINGS_ROWS.autosave) return { state: { ...state, autosave: side < 0 } };
  if (side && state.cursor === SETTINGS_ROWS.lang) return { state, action: "lang", lang: side < 0 ? "en" : "cs" };
  if (!is("useItem") || state.cursor !== SETTINGS_ROWS.start) return { state };
  return { state: null, action: "difficulty", autosave: state.autosave };
}

function pause(state: Extract<MenuState, { screen: "pause" }>, is: (action: string) => boolean): MenuResult {
  if (state.confirm) {
    if (is("useItem")) return { state, action: state.cursor === PAUSE_ROWS.restart ? "restart" : "home" };
    if (is("menu")) return { state: { screen: "pause", cursor: state.cursor } };
    return { state };
  }
  const side = sideways(is);
  if (is("up") || is("down")) return { state: { ...state, cursor: moved(state.cursor, PAUSE_COUNT, is("up") ? -1 : 1) } };
  if (is("menu")) return { state: null };
  if (side && state.cursor === PAUSE_ROWS.autosave) return { state, action: "autosave", autosave: side < 0 };
  if (side && state.cursor === PAUSE_ROWS.lang) return { state, action: "lang", lang: side < 0 ? "en" : "cs" };
  if (!is("useItem")) return { state };
  if (state.cursor === PAUSE_ROWS.save) return { state: listOf("save") };
  if (state.cursor === PAUSE_ROWS.load) return { state: listOf("load") };
  if (state.cursor === PAUSE_ROWS.restart || state.cursor === PAUSE_ROWS.home) return { state: { ...state, confirm: true } };
  return { state };
}

export function menuKey(state: MenuState, key: { code: string; key: string }, slots: Slots, mission: string, keys: Bindings): MenuResult {
  const is = (action: string): boolean => keys[action]?.includes(key.code) ?? false;
  if (state.screen === "settings") return settings(state, is);
  if (state.screen === "gameOver") return gameOver(state, is);
  if (state.screen === "pause") return pause(state, is);
  return list(state, key, slots, mission, is);
}
