import { useEffect, useMemo } from "react";
import { inventoryArt } from "../../game/hud/icons";
import { inventorySvg, type InventoryArt } from "../../game/hud/inventory";
import { useSandbox } from "../store";

let cached: InventoryArt | null = null;
const art = (): InventoryArt => (cached ??= inventoryArt());
const whenIdle = (task: () => void): void => {
  if (typeof requestIdleCallback === "function") requestIdleCallback(task);
  else setTimeout(task);
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
  useEffect(() => whenIdle(art), []);
  const svg = useMemo(
    () => open && inventorySvg(fit.W, fit.H, { items, cursor, energy: Math.round((100 * energy) / max), shields, ammo, blaster }, art()),
    [open, fit.W, fit.H, items, cursor, energy, max, shields, ammo, blaster],
  );
  if (!svg) return null;
  return (
    <div
      style={{ position: "absolute", left: 0, top: 0, width: fit.W * fit.unit, height: fit.H * fit.unit, pointerEvents: "none" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
