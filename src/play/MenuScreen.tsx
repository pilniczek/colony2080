import { useMemo } from "react";
import { menuSvg } from "../game/hud/menu";
import { missionName } from "../game/save/slots";
import { useSandbox } from "../sandbox/store";
import { art } from "../sandbox/ui/InventoryScreen";

export function MenuScreen({ mission }: { mission: string }) {
  const menu = useSandbox((s) => s.menu);
  const slots = useSandbox((s) => s.slots);
  const fit = useSandbox((s) => s.hud);
  const lang = useSandbox((s) => s.lang);
  const autosave = useSandbox((s) => s.autosave);
  const blaster = useSandbox((s) => s.blaster !== null);
  const svg = useMemo(
    () => menu && menuSvg(fit.W, fit.H, menu, slots, art(), missionName(mission), lang, autosave, blaster),
    [menu, slots, fit.W, fit.H, mission, lang, autosave, blaster],
  );
  if (!svg) return null;
  return (
    <div
      style={{ position: "absolute", left: 0, top: 0, width: fit.W * fit.unit, height: fit.H * fit.unit, pointerEvents: "auto" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
