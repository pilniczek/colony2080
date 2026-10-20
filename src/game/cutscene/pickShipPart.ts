import config from "@config/cutscenes/pick-ship-part.json";
import { pickupFilm } from "./pickController";
import type { Cutscene } from "./index";

export const pickShipPart: Cutscene = pickupFilm("pickShipPart", config);
