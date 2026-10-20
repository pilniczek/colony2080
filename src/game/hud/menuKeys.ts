import type { Bindings } from "../../engine/input";
import type { Slots } from "../save/slots";

export const NAME_MAX = 16;
const PAUSE_ROWS = 3;
const GAME_OVER_ROWS = 2;

type ListScreen = { screen: "save" | "load"; cursor: number; typing: string | null; confirm: boolean; message: string | null };

export type MenuState = { screen: "pause"; cursor: number } | ListScreen | { screen: "gameOver"; cursor: number; canLoad: boolean };

export type MenuAction = "save" | "load" | "restart" | "end" | "home";

export interface MenuResult {
  state: MenuState | null;
  action?: MenuAction;
  slot?: number;
  name?: string;
}

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
  if (is("up") || is("down")) return { state: { ...s, cursor: moved(s.cursor, slots.length, is("up") ? -1 : 1), message: null } };
  if (!is("useItem")) return { state: s };
  if (s.screen === "save") return { state: { ...s, typing: "", message: null } };
  return slots[s.cursor]?.mission === mission ? { state: s, action: "load", slot: s.cursor } : { state: s };
}

export function menuKey(state: MenuState, key: { code: string; key: string }, slots: Slots, mission: string, keys: Bindings): MenuResult {
  const is = (action: string): boolean => keys[action]?.includes(key.code) ?? false;
  if (state.screen === "save" || state.screen === "load") return list(state, key, slots, mission, is);
  const rows = state.screen === "pause" ? PAUSE_ROWS : GAME_OVER_ROWS;
  if (is("up") || is("down")) return { state: { ...state, cursor: moved(state.cursor, rows, is("up") ? -1 : 1) } };
  if (state.screen === "gameOver") {
    if (!is("useItem")) return { state };
    return { state, action: state.cursor === 1 ? "end" : state.canLoad ? "load" : "restart" };
  }
  if (is("menu")) return { state: null };
  if (!is("useItem")) return { state };
  if (state.cursor === 0) return { state: listOf("save") };
  if (state.cursor === 1) return { state: listOf("load") };
  return { state, action: "home" };
}
