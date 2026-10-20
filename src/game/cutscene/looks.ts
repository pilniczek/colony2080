import type { CutsceneId } from "./index";

export type Look = "camera" | "robot";

type Views = [number, Look][];

const CONFIGS = import.meta.glob<{ views?: Views }>("../../../config/cutscenes/*.json", { eager: true, import: "default" });

const idOf = (path: string): string => path.slice(path.lastIndexOf("/") + 1, -".json".length).replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

const VIEWS = new Map(Object.entries(CONFIGS).map(([path, config]) => [idOf(path), config.views ?? []]));

export function lookAt(id: CutsceneId, t: number): Look {
  let look: Look = "camera";
  for (const [from, view] of VIEWS.get(id) ?? []) if (t >= from) look = view;
  return look;
}
