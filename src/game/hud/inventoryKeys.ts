import type { Bindings } from "../../engine/input";
import type { HeroState } from "../hero/config";
import type { ItemId } from "../items";
import { newestFirst } from "./inventory";

export interface InventoryKeyResult {
  cursor: number;
  pick: boolean;
  close: boolean;
}

const DEAD: ReadonlySet<HeroState> = new Set(["death", "jumpDeath", "fallDeath"]);

export const canOpenInventory = (state: HeroState, replaying: boolean): boolean => !replaying && !DEAD.has(state);

export const openCursor = (items: ItemId[], shown: ItemId | null): number => Math.max(0, newestFirst(items).indexOf(shown ?? ""));

export function inventoryKey(code: string, cursor: number, count: number, keys: Bindings): InventoryKeyResult {
  const is = (action: string): boolean => keys[action]?.includes(code) ?? false;
  if (is("useItem")) return { cursor, pick: count > 0, close: true };
  if (is("inventory") || is("menu")) return { cursor, pick: false, close: true };
  if (is("up")) return { cursor: Math.max(0, cursor - 1), pick: false, close: false };
  if (is("down")) return { cursor: Math.max(0, Math.min(count - 1, cursor + 1)), pick: false, close: false };
  return { cursor, pick: false, close: false };
}
