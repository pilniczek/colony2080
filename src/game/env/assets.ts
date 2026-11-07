import { buildingAssets } from "./buildings";
import { flyer } from "./flyer";
import { shootGuard } from "./shootGuard";
import { guardAssets } from "./guard";
import { machineAssets } from "./machines";
import type { EnvAsset } from "./paint";
import { propAssets } from "./props";
import { structureAssets } from "./structures";
import { VESNICE_IDS, vesniceSceneryAssets } from "./vesnice";
import { radioGuard } from "./radioGuard";
import { JESKYNE_IDS, jeskyneAssets } from "./jeskyne";
import { JUNGLE_IDS } from "./jungle";
import { jungleClutterAssets } from "./jungleClutter";
import { junglePropAssets } from "./jungleProps";
import { jungleSceneryAssets } from "./jungleScenery";
import { jungleTerrainAssets } from "./jungleTerrain";
import { vesnicePropAssets } from "./vesniceProps";

const BASE_IDS = [
  "streetWalkway", "hazardPlate", "girderBridge", "ladder", "liftLanding", "pipeColumn", "pipeBend", "fuelTank", "staircase", "chainFence", "latticePylon", "stripLight", "tunnelGate", "tunnelFloor", "tunnelWall", "metroPlatformWall",
  "skyBackground", "midgroundRuins", "windowBuilding", "ruinedBuilding", "colonnadeBuilding", "facadeTower", "skylineTower", "brickWall", "graffitiWall", "gantryBuilding", "barSign", "barDoor", "crashedShip", "metroTrain",
  "wireBox", "switchboard", "trainDoor", "trainCarriage", "tapValveWheel", "ceilingPipe", "waterPipe", "plasmaBarrier", "codeLock", "acidTank", "crane", "craneMast", "cardDoor", "lift", "liftPanel", "damagedLift", "acidGuard", "acidGuardFront", "flyer", "shootGuard",
  "barrel", "dyingRebel", "corpse", "crowbar", "eBlaster", "craneKey", "shipPart", "controller", "wires", "tapHandle", "card", "holoPlan", "shipPlan", "decoder", "crate", "signPost", "floorVent", "rubblePile", "brickPile", "tyres", "carWreck", "fallenGirders", "ammoBox", "energyCell", "shieldCell",
  "radioGuard",
] as const;

const ASSET_IDS = [...BASE_IDS, ...VESNICE_IDS, ...JUNGLE_IDS, ...JESKYNE_IDS] as const;

export type AssetId = (typeof ASSET_IDS)[number];

const list: EnvAsset[] = [...structureAssets, ...buildingAssets, ...machineAssets, ...propAssets, ...guardAssets, flyer, shootGuard, radioGuard, ...vesnicePropAssets, ...vesniceSceneryAssets, ...junglePropAssets, ...jungleTerrainAssets, ...jungleSceneryAssets, ...jungleClutterAssets, ...jeskyneAssets];

export const ASSETS = Object.fromEntries(list.map((a) => [a.id, a])) as Record<AssetId, EnvAsset>;

export const isAssetId = (id: string): id is AssetId => (ASSET_IDS as readonly string[]).includes(id);

export const assetList = list;
