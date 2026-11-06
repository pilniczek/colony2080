import { useEffect, useMemo } from "react";
import { whenIdle } from "../../engine/idle";
import { inventoryArtJobs, MENU_ART_JOBS } from "../../game/hud/icons";
import { inventorySvg, type InventoryArt } from "../../game/hud/inventory";
import type { MenuArt } from "../../game/hud/menu";
import { useSandbox } from "../store";

let build: ReturnType<typeof inventoryArtJobs> | null = null;
let done = 0;

const jobs = (): ReturnType<typeof inventoryArtJobs> => (build ??= inventoryArtJobs());

const built = (count: number): InventoryArt => {
  const { jobs: all, art: made } = jobs();
  while (done < Math.min(count, all.length)) all[done++]!();
  return made;
};

export const art = (): InventoryArt => built(Infinity);

export const menuArt = (): MenuArt => built(MENU_ART_JOBS);

const buildWhenIdle = (): void => {
  const { jobs: all } = jobs();
  if (done >= all.length) return;
  all[done++]!();
  whenIdle(buildWhenIdle);
};

export function InventoryScreen() {
  const { open, cursor } = useSandbox((s) => s.inventory);
  const fit = useSandbox((s) => s.hud);
  const items = useSandbox((s) => s.items);
  const energy = useSandbox((s) => s.energy);
  const max = useSandbox((s) => s.movement.energy.max);
  const shields = useSandbox((s) => s.shields);
  const ammo = useSandbox((s) => s.ammo);
  const blaster = useSandbox((s) => s.blaster);
  const bonusModel = useSandbox((s) => s.bonus);
  const filming = useSandbox((s) => s.cutscene);
  const lang = useSandbox((s) => s.lang);
  const quests = useSandbox((s) => s.quests);
  useEffect(() => whenIdle(buildWhenIdle), []);
  const svg = useMemo(
    () => open && inventorySvg(fit.W, fit.H, { items, cursor, energy: Math.round((100 * energy) / max), shields, ammo, blaster, bonusModel, quests, lang }, art()),
    [open, fit.W, fit.H, items, cursor, energy, max, shields, ammo, blaster, bonusModel, quests, lang],
  );
  if (!svg || filming) return null;
  return (
    <div
      style={{ position: "absolute", left: 0, top: 0, width: fit.W * fit.unit, height: fit.H * fit.unit, pointerEvents: "auto" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
