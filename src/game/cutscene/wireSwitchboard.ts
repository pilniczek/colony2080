import config from "@config/cutscenes/wire-switchboard.json";
import { placeholder } from "./kit";
import type { Cutscene } from "./index";

export const wireSwitchboard: Cutscene = placeholder("wireSwitchboard", config);
