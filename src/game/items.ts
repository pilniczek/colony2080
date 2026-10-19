import itemsJson from "@config/items.json";
import { isAssetId, type AssetId } from "./env/assets";

export type ItemId = string;

export interface ItemIcon {
  asset: AssetId | null;
  tilt: number;
  scale: number;
}

export interface Item {
  name: string;
  cs: string;
  icon: ItemIcon;
}

interface ItemJson {
  name: string;
  cs: string;
  icon: { asset: string | null; tilt: number; scale: number };
}

export function loadItems(json: unknown): Record<ItemId, Item> {
  const { items } = json as { items: Record<ItemId, ItemJson> };
  return Object.fromEntries(
    Object.entries(items).map(([id, item]) => {
      const { asset } = item.icon;
      if (asset !== null && !isAssetId(asset)) throw new Error(`unknown asset: ${asset}`);
      return [id, { ...item, icon: { ...item.icon, asset } }];
    }),
  );
}

export const ITEMS = loadItems(itemsJson);
