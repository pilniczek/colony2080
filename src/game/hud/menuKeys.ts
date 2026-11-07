import type { Bindings } from "../../engine/input";
import { ASSISTS, sameDifficulty, switched, toggled, type Difficulty } from "../difficulty";
import type { Lang } from "../i18n";
import { AUTO_SLOT, otherDifficulty, type Slots } from "../save/slots";

export const NAME_MAX = 16;
export const GAME_OVER_ACTIONS = ["load", "restart", "chooseDifficulty", "end"] as const;
export const PAUSE_ROWS = { save: 0, load: 1, restart: 2, difficulty: 3, autosave: 4, lang: 5, help: 6 } as const;
export const SETTINGS_ROWS = { autosave: 0, lang: 1, difficulty: 2, help: 3, start: 4 } as const;
export const DIFFICULTY_ROWS = { level: 0, first: 1, done: ASSISTS.length + 1 } as const;
const PAUSE_COUNT = Object.keys(PAUSE_ROWS).length;
const SETTINGS_COUNT = Object.keys(SETTINGS_ROWS).length;

type ListScreen = { screen: "save" | "load"; cursor: number; typing: string | null; confirm: boolean; message: string | null };

type SettingsState = { screen: "settings"; cursor: number; autosave: boolean; difficulty: Difficulty; confirm?: boolean; purge?: number };
type PauseState = { screen: "pause"; cursor: number; confirm?: boolean };
type GameOverState = { screen: "gameOver"; cursor: number; canLoad: boolean; message?: string | null; at?: { x: number; y: number } | null };
type HelpFrom = SettingsState | PauseState;
export type DifficultyState = { screen: "difficulty"; cursor: number; picks: Difficulty; was: Difficulty; from: SettingsState | PauseState | GameOverState; confirm?: boolean; purge?: number };

export type MenuState =
  | HelpFrom
  | { screen: "help"; cursor: number; from: HelpFrom }
  | DifficultyState
  | ListScreen
  | GameOverState;

export const gameOverState = (canLoad: boolean, message: string | null = null, at: { x: number; y: number } | null = null): MenuState => ({
  screen: "gameOver",
  cursor: canLoad ? 0 : 1,
  canLoad,
  message,
  at,
});

export type MenuAction = "save" | "load" | "restart" | "end" | "home" | "difficulty" | "chooseDifficulty" | "restartWith" | "autosave" | "lang";

export interface MenuResult {
  state: MenuState | null;
  action?: MenuAction;
  slot?: number;
  name?: string;
  autosave?: boolean;
  lang?: Lang;
  difficulty?: Difficulty;
}

export const settingsState = (difficulty: Difficulty): MenuState => ({ screen: "settings", cursor: SETTINGS_ROWS.start, autosave: true, difficulty });

export const difficultyState = (from: DifficultyState["from"], current: Difficulty): MenuState => ({ screen: "difficulty", cursor: DIFFICULTY_ROWS.level, picks: current, was: current, from });

export const changed = (state: DifficultyState): boolean => !sameDifficulty(state.picks, state.was);

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

function gameOver(state: GameOverState, is: (action: string) => boolean): MenuResult {
  const first = state.canLoad ? 0 : 1;
  if (is("up") || is("down")) return { state: { ...state, cursor: Math.max(first, moved(state.cursor, GAME_OVER_ACTIONS.length, is("up") ? -1 : 1)) } };
  if (!is("useItem")) return { state };
  return { state, action: GAME_OVER_ACTIONS[state.cursor] };
}

function difficulty(state: DifficultyState, is: (action: string) => boolean, purge: (d: Difficulty) => number): MenuResult {
  if (state.confirm) {
    if (is("useItem")) return { state, action: "restartWith", difficulty: state.picks };
    if (is("menu")) return { state: { ...state, confirm: false } };
    return { state };
  }
  const side = sideways(is);
  if (is("up") || is("down")) return { state: { ...state, cursor: moved(state.cursor, DIFFICULTY_ROWS.done + 1, is("up") ? -1 : 1) } };
  if (is("menu")) return { state: state.from };
  if (side && state.cursor === DIFFICULTY_ROWS.level) {
    const picks = switched(state.picks, side);
    return { state: picks === state.picks ? state : { ...state, picks } };
  }
  if (!is("useItem")) return { state };
  const assist = ASSISTS[state.cursor - DIFFICULTY_ROWS.first];
  if (assist) {
    const picks = toggled(state.picks, assist.id);
    return { state: picks === state.picks ? state : { ...state, picks } };
  }
  if (state.cursor !== DIFFICULTY_ROWS.done) return { state };
  if (state.from.screen === "settings") return { state: { ...state.from, difficulty: state.picks } };
  if (!changed(state)) return { state: state.from };
  const doomed = purge(state.picks);
  if (state.from.screen === "pause" || doomed > 0) return { state: { ...state, confirm: true, purge: doomed } };
  return { state, action: "restartWith", difficulty: state.picks };
}

const helpOf = (from: HelpFrom): MenuState => ({ screen: "help", cursor: 0, from });

const help = (state: Extract<MenuState, { screen: "help" }>, is: (action: string) => boolean): MenuResult =>
  is("useItem") || is("menu") ? { state: state.from } : { state };

const sideways = (is: (action: string) => boolean): -1 | 1 | 0 => (is("moveLeft") ? -1 : is("moveRight") ? 1 : 0);

function settings(state: SettingsState, is: (action: string) => boolean, purge: (d: Difficulty) => number): MenuResult {
  if (state.confirm) {
    if (is("useItem")) return { state: null, action: "difficulty", autosave: state.autosave, difficulty: state.difficulty };
    if (is("menu")) return { state: { ...state, confirm: false } };
    return { state };
  }
  const side = sideways(is);
  if (is("up") || is("down")) return { state: { ...state, cursor: moved(state.cursor, SETTINGS_COUNT, is("up") ? -1 : 1) } };
  if (is("menu")) return { state, action: "home" };
  if (side && state.cursor === SETTINGS_ROWS.autosave) return { state: { ...state, autosave: side < 0 } };
  if (side && state.cursor === SETTINGS_ROWS.lang) return { state, action: "lang", lang: side < 0 ? "en" : "cs" };
  if (is("useItem") && state.cursor === SETTINGS_ROWS.help) return { state: helpOf(state) };
  if (is("useItem") && state.cursor === SETTINGS_ROWS.difficulty) return { state: difficultyState(state, state.difficulty) };
  if (!is("useItem") || state.cursor !== SETTINGS_ROWS.start) return { state };
  const doomed = purge(state.difficulty);
  if (doomed > 0) return { state: { ...state, confirm: true, purge: doomed } };
  return { state: null, action: "difficulty", autosave: state.autosave, difficulty: state.difficulty };
}

function pause(state: PauseState, is: (action: string) => boolean): MenuResult {
  if (state.confirm) {
    if (is("useItem")) return { state, action: "restart" };
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
  if (state.cursor === PAUSE_ROWS.restart) return { state: { ...state, confirm: true } };
  if (state.cursor === PAUSE_ROWS.help) return { state: helpOf(state) };
  if (state.cursor === PAUSE_ROWS.difficulty) return { state, action: "chooseDifficulty" };
  return { state };
}

export function menuKey(state: MenuState, key: { code: string; key: string }, slots: Slots, mission: string, keys: Bindings): MenuResult {
  const is = (action: string): boolean => keys[action]?.includes(key.code) ?? false;
  const purge = (d: Difficulty): number => otherDifficulty(slots, mission, d).length;
  if (state.screen === "settings") return settings(state, is, purge);
  if (state.screen === "gameOver") return gameOver(state, is);
  if (state.screen === "pause") return pause(state, is);
  if (state.screen === "help") return help(state, is);
  if (state.screen === "difficulty") return difficulty(state, is, purge);
  return list(state, key, slots, mission, is);
}

export type MenuPress = "hover" | "useItem" | "moveLeft" | "moveRight";

export interface MenuPoint {
  row: number;
  press: MenuPress;
}

const held = (state: MenuState): boolean =>
  ((state.screen === "save" || state.screen === "load") && (state.typing !== null || state.confirm)) || ((state.screen === "pause" || state.screen === "difficulty" || state.screen === "settings") && !!state.confirm);

function pointed(state: MenuState, row: number): MenuState | null {
  if (row === state.cursor) return state;
  if (held(state) || (state.screen === "gameOver" && row === 0 && !state.canLoad)) return null;
  return state.screen === "save" || state.screen === "load" ? { ...state, cursor: row, message: null } : { ...state, cursor: row };
}

export function menuPoint(state: MenuState, { row, press }: MenuPoint, slots: Slots, mission: string, keys: Bindings): MenuResult {
  const at = pointed(state, row);
  if (!at) return { state };
  const code = keys[press]?.[0];
  if (press === "hover" || !code) return { state: at };
  return menuKey(at, { code, key: "" }, slots, mission, keys);
}
