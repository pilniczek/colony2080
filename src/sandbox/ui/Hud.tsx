import controls from "@config/controls.json";
import { useLayoutEffect, useMemo, useRef } from "react";
import { hudIcons } from "../../game/hud/icons";
import { applyLive, hudSvg, keyLabel, type HudKeys, type HudState } from "../../game/hud/svg";
import type { Weapon } from "../../game/hero/config";
import type { Lang } from "../../game/i18n";
import type { ItemId } from "../../game/items";
import { useSandbox } from "../store";

const { keyboard } = controls;
const KEYS: HudKeys = {
  weapons: [keyboard.weapon1, keyboard.weapon2, keyboard.weapon3].map(([code]) => keyLabel(code ?? "")),
  run: keyLabel(keyboard.runToggle[0] ?? ""),
  sound: keyLabel(keyboard.soundToggle[0] ?? ""),
  hide: keyLabel(keyboard.hide[0] ?? ""),
  map: keyLabel(keyboard.map[0] ?? ""),
  menu: keyLabel(keyboard.menu[0] ?? ""),
  item: `${keyLabel(keyboard.useItem[0] ?? "")}\u00a0\u00a0/\u00a0\u00a0${keyLabel(keyboard.inventory[0] ?? "")}`,
};

const ALARM_PULSES = 5;
const ALARM_PULSE_MS = 1000;

const WEAPON_SLOTS: Record<Weapon, number> = { gun: 0, fists: 1, blaster: 2 };

export interface HudValues {
  energy: number;
  max: number;
  shields: number;
  ammo: number;
  blaster: number | null;
  weapon: Weapon;
  running: boolean;
  soundOn: boolean;
  mapOn: boolean;
  mapOpen: boolean;
  hidden: boolean;
  menuOpen: boolean;
  item: ItemId | null;
  lang?: Lang;
}

export const hudState = ({ energy, max, shields, ammo, blaster, weapon, running, soundOn, mapOn, mapOpen, hidden, menuOpen, item, lang }: HudValues): HudState => ({
  weapon: WEAPON_SLOTS[weapon],
  bonus: blaster !== null,
  bonusAmmo: blaster ?? 0,
  life: (100 * energy) / max,
  shields,
  running,
  soundOn,
  mapOn,
  mapOpen,
  hidden,
  menuOpen,
  ammo,
  item,
  lang,
});

export function Hud() {
  const icons = useMemo(hudIcons, []);
  const root = useRef<HTMLDivElement>(null);
  const fit = useSandbox((s) => s.hud);
  const energy = useSandbox((s) => s.energy);
  const shields = useSandbox((s) => s.shields);
  const ammo = useSandbox((s) => s.ammo);
  const blaster = useSandbox((s) => s.blaster);
  const max = useSandbox((s) => s.movement.energy.max);
  const weapon = useSandbox((s) => s.weapon);
  const running = useSandbox((s) => s.running);
  const soundOn = useSandbox((s) => s.soundOn);
  const mapOn = useSandbox((s) => s.mapOn);
  const mapOpen = useSandbox((s) => s.mapOpen);
  const hidden = useSandbox((s) => s.hidden);
  const menuOpen = useSandbox((s) => s.menu !== null && s.menu.screen !== "gameOver");
  const item = useSandbox((s) => s.item);
  const filming = useSandbox((s) => s.cutscene);
  const lang = useSandbox((s) => s.lang);
  const alarmAt = useSandbox((s) => s.alarmAt);
  const state = hudState({ energy, max, shields, ammo, blaster, weapon, running, soundOn, mapOn, mapOpen, hidden, menuOpen, item, lang });
  const live = useRef(state);
  live.current = state;
  const armed = blaster !== null;
  const svg = useMemo(
    () => hudSvg(fit.W, fit.H, live.current, icons, KEYS),
    [fit.W, fit.H, shields, armed, max, weapon, running, soundOn, mapOn, mapOpen, hidden, menuOpen, item, lang, icons],
  );
  const html = useMemo(() => ({ __html: svg }), [svg]);
  useLayoutEffect(() => {
    if (root.current) applyLive(root.current, live.current);
  }, [svg, energy, ammo, blaster]);
  useLayoutEffect(() => {
    const letter = root.current?.querySelector('[data-hud="alarm"]');
    if (alarmAt === null || !letter) return;
    const elapsed = performance.now() - alarmAt;
    if (elapsed >= ALARM_PULSES * ALARM_PULSE_MS) return;
    const pulse = letter.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: ALARM_PULSE_MS, iterations: ALARM_PULSES });
    pulse.currentTime = elapsed;
    return () => pulse.cancel();
  }, [svg, alarmAt]);
  return (
    <div
      ref={root}
      style={{ position: "absolute", left: 0, top: 0, width: fit.W * fit.unit, height: fit.H * fit.unit, pointerEvents: "none", display: filming ? "none" : undefined, zIndex: menuOpen ? 1 : undefined }}
      dangerouslySetInnerHTML={html}
    />
  );
}
