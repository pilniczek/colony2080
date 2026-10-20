import config from "@config/cutscenes/trade-ship-part.json";
import { drawDoorShot } from "./tradeHoloPlan";
import type { Cutscene } from "./index";

export const tradeShipPart: Cutscene = {
  id: "tradeShipPart",
  duration: config.duration,
  camera: config.camera,
  render: (ctx, w, h, t) => drawDoorShot(ctx, w, h, t, config.items),
};
