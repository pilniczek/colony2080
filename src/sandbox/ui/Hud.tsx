import { useMemo } from "react";
import { hudIcons } from "../../game/hud/icons";
import { HUD_H } from "../../game/hud/layout";
import { hudSvg, type HudState } from "../../game/hud/svg";
import { useSandbox } from "../store";

const UNSIMULATED = { bonus: false, bonusAmmo: 0, item: "" };

export function Hud() {
  const icons = useMemo(hudIcons, []);
  const fit = useSandbox((s) => s.hud);
  const energy = useSandbox((s) => s.energy);
  const shields = useSandbox((s) => s.shields);
  const reserve = useSandbox((s) => s.reserve);
  const ammo = useSandbox((s) => s.ammo);
  const max = useSandbox((s) => s.movement.energy.max);
  const weapon = useSandbox((s) => s.weapon);
  const svg = useMemo(() => {
    const state: HudState = { ...UNSIMULATED, weapon: weapon === "gun" ? 0 : 1, life: (100 * energy) / max, reserve, shields, ammo };
    return hudSvg(fit.W, state, icons);
  }, [fit.W, energy, reserve, shields, ammo, max, weapon, icons]);
  return (
    <div
      style={{ position: "absolute", left: fit.x, top: fit.y, width: fit.W * fit.unit, height: HUD_H * fit.unit, pointerEvents: "none" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
