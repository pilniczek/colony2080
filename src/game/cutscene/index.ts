import { crowbarDoor } from "./crowbarDoor";
import { missionStart } from "./missionStart";
import { rebelShot } from "./rebelShot";
import { talkRebel } from "./talkRebel";
import { pullWires } from "./pullWires";
import { wireSwitchboard } from "./wireSwitchboard";
import { takeTapHandle } from "./takeTapHandle";
import { searchCorpse } from "./searchCorpse";
import { tradeHoloPlan } from "./tradeHoloPlan";
import { tradeShipPart } from "./tradeShipPart";
import { unlockPlasma } from "./unlockPlasma";
import { repairLift } from "./repairLift";
import { openDoor } from "./openDoor";
import { useAcidTank } from "./useAcidTank";
import { hullCover } from "./hullCover";
import { pickShipPart } from "./pickShipPart";
import { pickCraneKey } from "./pickCraneKey";
import { pickCrowbar } from "./pickCrowbar";
import { pickController } from "./pickController";
import { pickEBlaster } from "./pickEBlaster";
import { repairCrane } from "./repairCrane";

export type CutsceneId = "crowbarDoor" | "missionStart" | "rebelShot" | "talkRebel" | "pullWires" | "wireSwitchboard" | "takeTapHandle" | "searchCorpse" | "tradeHoloPlan" | "tradeShipPart" | "unlockPlasma" | "repairLift" | "openDoor" | "useAcidTank" | "hullCover" | "pickShipPart" | "pickCraneKey" | "pickCrowbar" | "pickController" | "pickEBlaster" | "repairCrane";

export interface Cutscene {
  id: CutsceneId;
  duration: number;
  camera: string;
  render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void;
}

export const CUTSCENES: Record<CutsceneId, Cutscene> = { crowbarDoor, missionStart, rebelShot, talkRebel, pullWires, wireSwitchboard, takeTapHandle, searchCorpse, tradeHoloPlan, tradeShipPart, unlockPlasma, repairLift, openDoor, useAcidTank, hullCover, pickShipPart, pickCraneKey, pickCrowbar, pickController, pickEBlaster, repairCrane };
