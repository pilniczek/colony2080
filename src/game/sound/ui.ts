import type { Mixer, SoundCue } from "../../engine/audio/mixer";
import type { SoundId } from "./index";

type UiCue = SoundCue & { id: SoundId };

export const INVENTORY_CUE: UiCue = { id: "inventory", rate: 8000, vol: 63, bus: "ui" };

export const MENU_CUE: UiCue = { id: "click", rate: 5500, vol: 33, bus: "ui" };

export function openInventory(mixer: Pick<Mixer, "stopAll" | "play">): void {
  mixer.stopAll();
  mixer.play(INVENTORY_CUE);
}
