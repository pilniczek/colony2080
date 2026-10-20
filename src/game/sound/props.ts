import type { AssetId } from "../env/assets";
import type { SoundId } from "./index";

export const OPEN_SOUND: Partial<Record<AssetId, { id: SoundId; rate: number }>> = {
  trainDoor: { id: "door", rate: 11000 },
  cardDoor: { id: "door", rate: 11000 },
  tunnelGate: { id: "grate", rate: 18000 },
};
