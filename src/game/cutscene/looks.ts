import { FILM_CONFIGS } from "./configs";
import type { CutsceneId } from "./index";

export type Look = "camera" | "robot";

type Views = [number, Look][];

export function lookAt(id: CutsceneId, t: number): Look {
  let look: Look = "camera";
  for (const [from, view] of (FILM_CONFIGS.get(id)?.views as Views | undefined) ?? []) if (t >= from) look = view;
  return look;
}
