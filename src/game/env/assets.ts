import { buildingAssets } from "./buildings";
import { machineAssets } from "./machines";
import type { EnvAsset } from "./paint";
import { propAssets } from "./props";
import { structureAssets } from "./structures";

const ASSET_IDS = [
  "streetWalkway", "girderBridge", "ladder", "pipeColumn", "chainFence", "stripLight",
  "skyBackground", "midgroundRuins", "windowBuilding", "ruinedBuilding", "colonnadeBuilding", "facadeTower", "brickWall",
  "switchboard", "lift",
  "barrel", "crowbar", "craneKey", "shipPart", "controller", "crate", "signPost", "floorVent", "rubblePile",
] as const;

export type AssetId = (typeof ASSET_IDS)[number];

const list: EnvAsset[] = [...structureAssets, ...buildingAssets, ...machineAssets, ...propAssets];

export const ASSETS = Object.fromEntries(list.map((a) => [a.id, a])) as Record<AssetId, EnvAsset>;

export const isAssetId = (id: string): id is AssetId => (ASSET_IDS as readonly string[]).includes(id);

export const assetList = list;
