import config from "@config/cutscenes/mission-start.json";
import { placeholder } from "./kit";
import type { Cutscene } from "./index";

export const missionStart: Cutscene = placeholder("missionStart", config);
