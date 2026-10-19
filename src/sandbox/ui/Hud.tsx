import controls from "@config/controls.json";
import { useMemo } from "react";
import { hudIcons } from "../../game/hud/icons";
import { hudSvg, keyLabel, type HudKeys, type HudState } from "../../game/hud/svg";
import { useSandbox } from "../store";

const UNSIMULATED = { bonus: false, bonusAmmo: 0, item: "" };
const { keyboard } = controls;
const KEYS: HudKeys = {
  weapons: [keyboard.weapon1, keyboard.weapon2, keyboard.weapon3].map(([code]) => keyLabel(code ?? "")),
  run: keyLabel(keyboard.runToggle[0] ?? ""),
};

export function Hud() {
  const icons = useMemo(hudIcons, []);
  const fit = useSandbox((s) => s.hud);
  const energy = useSandbox((s) => s.energy);
  const shields = useSandbox((s) => s.shields);
  const reserve = useSandbox((s) => s.reserve);
  const ammo = useSandbox((s) => s.ammo);
  const max = useSandbox((s) => s.movement.energy.max);
  const weapon = useSandbox((s) => s.weapon);
  const running = useSandbox((s) => s.running);
  const svg = useMemo(() => {
    const state: HudState = { ...UNSIMULATED, weapon: weapon === "gun" ? 0 : 1, life: (100 * energy) / max, reserve, shields, running, ammo };
    return hudSvg(fit.W, fit.H, state, icons, KEYS);
  }, [fit.W, fit.H, energy, reserve, shields, ammo, max, weapon, running, icons]);
  return (
    <div
      style={{ position: "absolute", left: 0, top: 0, width: fit.W * fit.unit, height: fit.H * fit.unit, pointerEvents: "none" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
