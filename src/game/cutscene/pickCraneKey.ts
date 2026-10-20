import config from "@config/cutscenes/pick-crane-key.json";
import { pickupFilm } from "./pickController";
import type { Cutscene } from "./index";

export const pickCraneKey: Cutscene = pickupFilm("pickCraneKey", config);
