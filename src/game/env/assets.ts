import { buildingAssets } from "./buildings";
import { flyer } from "./flyer";
import { shootGuard } from "./shootGuard";
import { guardAssets } from "./guard";
import { machineAssets } from "./machines";
import type { EnvAsset } from "./paint";
import { propAssets } from "./props";
import { structureAssets } from "./structures";
import { vesniceAssets } from "./vesnice";
import { bridgeGuard } from "./bridgeGuard";
import { vesnicePropAssets } from "./vesniceProps";

const ASSET_IDS = [
  "streetWalkway", "hazardPlate", "girderBridge", "ladder", "liftLanding", "pipeColumn", "pipeBend", "fuelTank", "staircase", "chainFence", "latticePylon", "stripLight", "tunnelGate", "tunnelFloor", "tunnelWall", "metroPlatformWall",
  "skyBackground", "midgroundRuins", "windowBuilding", "ruinedBuilding", "colonnadeBuilding", "facadeTower", "skylineTower", "brickWall", "graffitiWall", "gantryBuilding", "barSign", "barDoor", "crashedShip", "metroTrain",
  "wireBox", "switchboard", "trainDoor", "trainCarriage", "tapValveWheel", "ceilingPipe", "waterPipe", "plasmaBarrier", "codeLock", "acidTank", "crane", "craneMast", "cardDoor", "lift", "liftPanel", "damagedLift", "acidGuard", "acidGuardFront", "flyer", "shootGuard",
  "barrel", "dyingRebel", "corpse", "crowbar", "eBlaster", "craneKey", "shipPart", "controller", "wires", "tapHandle", "card", "holoPlan", "shipPlan", "decoder", "crate", "signPost", "floorVent", "rubblePile", "brickPile", "fallenGirders",
  "sourceTeleport", "targetTeleport", "brokenTeleport", "teleportPad", "fuseBox", "electricCabinet", "cannon", "energyBarrier", "transformer",
  "grassyWalkway", "cliffBlocks", "fireBarricade", "dynamiteWall", "powerBridge", "rockCliff", "overheadPipeline", "storageTank", "watchtower", "bridgeGuardPost",
  "villageBackdrop", "villageHouse", "stiltBuilding", "bridgeGuard", "smoulderingRemains", "smallKey", "walkieTalkie", "detonator", "projectile", "fuse", "dynamite",
  "navCircuit", "toaster", "energyPickup", "ammoPickup", "shieldPickup", "projectileCrate",
] as const;

export type AssetId = (typeof ASSET_IDS)[number];

const list: EnvAsset[] = [...structureAssets, ...buildingAssets, ...machineAssets, ...propAssets, ...guardAssets, flyer, shootGuard, ...vesniceAssets, bridgeGuard, ...vesnicePropAssets];

export const ASSETS = Object.fromEntries(list.map((a) => [a.id, a])) as Record<AssetId, EnvAsset>;

export const isAssetId = (id: string): id is AssetId => (ASSET_IDS as readonly string[]).includes(id);

export const assetList = list;
