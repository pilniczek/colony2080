import { buildingAssets } from "./buildings";
import { machineAssets } from "./machines";
import type { EnvAsset } from "./paint";
import { propAssets } from "./props";
import { structureAssets } from "./structures";

const ASSET_IDS = [
  "streetWalkway", "hazardPlate", "girderBridge", "ladder", "pipeColumn", "pipeBend", "fuelTank", "staircase", "chainFence", "latticePylon", "stripLight", "tunnelFloor", "tunnelWall", "metroPlatformWall",
  "skyBackground", "midgroundRuins", "windowBuilding", "ruinedBuilding", "colonnadeBuilding", "facadeTower", "brickWall", "graffitiWall", "gantryBuilding", "barSign", "barDoor", "crashedShip", "metroTrain",
  "wireBox", "switchboard", "trainDoor", "tapValveWheel", "waterPipe", "plasmaBarrier", "codeLock", "acidTank", "crane", "cardDoor", "lift", "liftPanel", "damagedLift",
  "barrel", "dyingRebel", "corpse", "crowbar", "eBlaster", "craneKey", "shipPart", "controller", "wires", "tapHandle", "card", "holoPlan", "shipPlan", "decoder", "crate", "signPost", "floorVent", "rubblePile", "fallenGirders",
] as const;

export type AssetId = (typeof ASSET_IDS)[number];

const list: EnvAsset[] = [...structureAssets, ...buildingAssets, ...machineAssets, ...propAssets];

export const ASSETS = Object.fromEntries(list.map((a) => [a.id, a])) as Record<AssetId, EnvAsset>;

export const isAssetId = (id: string): id is AssetId => (ASSET_IDS as readonly string[]).includes(id);

export const assetList = list;
