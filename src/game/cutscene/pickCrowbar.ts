import config from "@config/cutscenes/pick-crowbar.json";
import { pickupFilm } from "./pickController";
import type { Cutscene } from "./index";

export const pickCrowbar: Cutscene = pickupFilm("pickCrowbar", config);
