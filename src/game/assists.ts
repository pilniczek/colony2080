import { EFFECTS, picked, type Difficulty } from "./difficulty";
import type { MovementConfig } from "./hero/config";
import type { SandboxWorld } from "./level/sandboxLevel";

const cache = new WeakMap<MovementConfig, WeakMap<Difficulty, MovementConfig>>();

function apply(cfg: MovementConfig, d: Difficulty): MovementConfig {
  const out: MovementConfig = structuredClone(cfg);
  if (picked(d, "extraShield")) out.energy.shields += EFFECTS.extraShield.shields;
  if (picked(d, "moreAmmo")) {
    const { scale, ammoCap } = EFFECTS.moreAmmo;
    out.ammo = Math.round(cfg.ammo * scale);
    out.bonuses.ammo = { add: Math.round(cfg.bonuses.ammo.add * scale), cap: ammoCap };
    out.blaster.ammo = Math.round(cfg.blaster.ammo * scale);
    out.toaster.ammo = Math.round(cfg.toaster.ammo * scale);
  }
  if (picked(d, "halfDamage")) out.damageScale = cfg.damageScale * EFFECTS.halfDamage.scale;
  if (picked(d, "strongPunches")) out.punch.damage = cfg.punch.damage * EFFECTS.strongPunches.scale;
  return out;
}

export function assisted(cfg: MovementConfig, d: Difficulty): MovementConfig {
  const byDifficulty = cache.get(cfg) ?? new WeakMap<Difficulty, MovementConfig>();
  cache.set(cfg, byDifficulty);
  const known = byDifficulty.get(d);
  if (known) return known;
  const made = apply(cfg, d);
  byDifficulty.set(d, made);
  return made;
}

export function applyAssists(world: SandboxWorld): void {
  if (picked(world.difficulty, "lateEnemies")) return;
  for (const enemy of world.enemies) enemy.sightMs = Math.min(enemy.sightMs, EFFECTS.lateEnemies.offSightMs);
}

export const fogWanted = (d: Difficulty): boolean => !picked(d, "fogOff");
