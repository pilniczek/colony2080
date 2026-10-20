import type { Bindings } from "../../engine/input";
import type { HeroState } from "../hero/config";
import type { ItemId } from "../items";
import { newestFirst } from "./inventory";

export interface InventoryKeyResult {
  cursor: number;
  pick: boolean;
  close: boolean;
}

const NO_SCREEN: ReadonlySet<HeroState> = new Set(["death", "jumpDeath", "fallDeath", "use"]);
const SCREEN_ACTIONS = ["useItem", "inventory", "menu", "up", "down"];
const REPEATING_ACTIONS = ["up", "down"];

const bound = (code: string, keys: Bindings, actions: string[]): boolean => actions.some((action) => keys[action]?.includes(code));

export const canOpenScreen = (state: HeroState, replaying: boolean): boolean => !replaying && !NO_SCREEN.has(state);

export const screenKey = (code: string, keys: Bindings): boolean => bound(code, keys, SCREEN_ACTIONS);

export const repeatsOnScreen = (code: string, keys: Bindings): boolean => bound(code, keys, REPEATING_ACTIONS);

export const openCursor = (items: ItemId[], shown: ItemId | null): number => Math.max(0, newestFirst(items).indexOf(shown ?? ""));

export const closesMap = (code: string, keys: Bindings): boolean => bound(code, keys, ["map", "menu"]);

export function inventoryKey(code: string, cursor: number, count: number, keys: Bindings): InventoryKeyResult {
  const is = (action: string): boolean => keys[action]?.includes(code) ?? false;
  if (is("useItem")) return { cursor, pick: count > 0, close: true };
  if (is("inventory") || is("menu")) return { cursor, pick: false, close: true };
  if (is("up")) return { cursor: Math.max(0, cursor - 1), pick: false, close: false };
  if (is("down")) return { cursor: Math.max(0, Math.min(count - 1, cursor + 1)), pick: false, close: false };
  return { cursor, pick: false, close: false };
}
