import { useMemo } from "react";
import { menuSvg } from "../game/hud/menu";
import { missionName } from "../game/save/slots";
import { useSandbox } from "../sandbox/store";
import { art } from "../sandbox/ui/InventoryScreen";

export function MenuScreen({ mission }: { mission: string }) {
  const menu = useSandbox((s) => s.menu);
  const slots = useSandbox((s) => s.slots);
  const fit = useSandbox((s) => s.hud);
  const svg = useMemo(() => menu && menuSvg(fit.W, fit.H, menu, slots, art().robot, missionName(mission)), [menu, slots, fit.W, fit.H, mission]);
  if (!svg) return null;
  return (
    <div
      style={{ position: "absolute", left: 0, top: 0, width: fit.W * fit.unit, height: fit.H * fit.unit, pointerEvents: "none" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
