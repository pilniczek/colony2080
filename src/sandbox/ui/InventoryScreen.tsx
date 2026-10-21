import { useEffect, useMemo } from "react";
import { whenIdle } from "../../engine/idle";
import { inventoryArtJobs } from "../../game/hud/icons";
import { inventorySvg, type InventoryArt } from "../../game/hud/inventory";
import { useSandbox } from "../store";

let build: ReturnType<typeof inventoryArtJobs> | null = null;
let done = 0;

const jobs = (): ReturnType<typeof inventoryArtJobs> => (build ??= inventoryArtJobs());

export const art = (): InventoryArt => {
  const { jobs: all, art: built } = jobs();
  while (done < all.length) all[done++]!();
  return built;
};

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
  const filming = useSandbox((s) => s.cutscene);
  useEffect(() => whenIdle(buildWhenIdle), []);
  const svg = useMemo(
    () => open && inventorySvg(fit.W, fit.H, { items, cursor, energy: Math.round((100 * energy) / max), shields, ammo, blaster }, art()),
    [open, fit.W, fit.H, items, cursor, energy, max, shields, ammo, blaster],
  );
  if (!svg || filming) return null;
  return (
    <div
      style={{ position: "absolute", left: 0, top: 0, width: fit.W * fit.unit, height: fit.H * fit.unit, pointerEvents: "none" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
