import type { AssetId } from "../env/assets";
import type { SoundId } from "./index";

export const OPEN_SOUND: Partial<Record<AssetId, SoundId>> = { trainDoor: "door", cardDoor: "door", tunnelGate: "grate" };

export const OPEN_RATE: Partial<Record<SoundId, number>> = { door: 11000, grate: 18000 };
