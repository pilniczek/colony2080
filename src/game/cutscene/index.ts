import { crowbarDoor } from "./crowbarDoor";

export type CutsceneId = "crowbarDoor";

export interface Cutscene {
  id: CutsceneId;
  duration: number;
  camera: string;
  render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void;
}

export const CUTSCENES: Record<CutsceneId, Cutscene> = { crowbarDoor };
