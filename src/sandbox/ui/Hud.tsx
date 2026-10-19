import controls from "@config/controls.json";
import { useMemo } from "react";
import { hudIcons } from "../../game/hud/icons";
import { hudSvg, keyLabel, type HudKeys, type HudState } from "../../game/hud/svg";
import type { Weapon } from "../../game/hero/config";
import type { ItemId } from "../../game/items";
import { useSandbox } from "../store";

const { keyboard } = controls;
const KEYS: HudKeys = {
  weapons: [keyboard.weapon1, keyboard.weapon2, keyboard.weapon3].map(([code]) => keyLabel(code ?? "")),
  run: keyLabel(keyboard.runToggle[0] ?? ""),
  item: keyLabel(keyboard.useItem[0] ?? ""),
};

const WEAPON_SLOTS: Record<Weapon, number> = { gun: 0, fists: 1, blaster: 2 };

export interface HudValues {
  energy: number;
  max: number;
  shields: number;
  ammo: number;
  blaster: number | null;
  weapon: Weapon;
  running: boolean;
  item: ItemId | null;
}

export const hudState = ({ energy, max, shields, ammo, blaster, weapon, running, item }: HudValues): HudState => ({
  weapon: WEAPON_SLOTS[weapon],
  bonus: blaster !== null,
  bonusAmmo: blaster ?? 0,
  life: (100 * energy) / max,
  shields,
  running,
  ammo,
  item,
});

export function Hud() {
  const icons = useMemo(hudIcons, []);
  const fit = useSandbox((s) => s.hud);
  const energy = useSandbox((s) => s.energy);
  const shields = useSandbox((s) => s.shields);
  const ammo = useSandbox((s) => s.ammo);
  const blaster = useSandbox((s) => s.blaster);
  const max = useSandbox((s) => s.movement.energy.max);
  const weapon = useSandbox((s) => s.weapon);
  const running = useSandbox((s) => s.running);
  const item = useSandbox((s) => s.item);
  const svg = useMemo(
    () => hudSvg(fit.W, fit.H, hudState({ energy, max, shields, ammo, blaster, weapon, running, item }), icons, KEYS),
    [fit.W, fit.H, energy, shields, ammo, blaster, max, weapon, running, item, icons],
  );
  return (
    <div
      style={{ position: "absolute", left: 0, top: 0, width: fit.W * fit.unit, height: fit.H * fit.unit, pointerEvents: "none" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
