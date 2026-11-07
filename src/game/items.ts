import itemsJson from "@config/items.json";
import { isAssetId, type AssetId } from "./env/assets";

export type ItemId = string;

export interface ItemIcon {
  asset: AssetId;
  state: number;
  tilt: number;
  scale: number;
}

export interface Item {
  name: string;
  cs: string;
  icon: ItemIcon;
}

const fail = (id: string, what: string): never => {
  throw new Error(`item ${id}: ${what}`);
};

const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function loadItem(id: string, json: unknown): Item {
  const { name, cs, icon } = (json ?? {}) as Partial<Record<keyof Item, unknown>>;
  if (typeof name !== "string") fail(id, "missing name");
  if (typeof cs !== "string") fail(id, "missing cs");
  const { asset, tilt, scale, state = 0 } = (icon ?? {}) as Record<string, unknown>;
  if (!icon) fail(id, "missing icon");
  if (typeof asset !== "string" || !isAssetId(asset)) throw new Error(`unknown asset: ${String(asset)}`);
  if (!isNumber(tilt) || !isNumber(scale) || !isNumber(state)) fail(id, "icon needs numeric state, tilt and scale");
  return { name, cs, icon: { asset, state, tilt, scale } } as Item;
}

export function loadItems(json: unknown): Record<ItemId, Item> {
  const { items } = (json ?? {}) as { items?: Record<ItemId, unknown> };
  if (!items) throw new Error("items config has no items");
  return Object.fromEntries(Object.entries(items).map(([id, item]) => [id, loadItem(id, item)]));
}

export const ITEMS = loadItems(itemsJson);
