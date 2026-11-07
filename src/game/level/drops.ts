import { EFFECTS, picked } from "../difficulty";
import type { MovementConfig } from "../hero/config";
import { isDead as heroDead, type Hero } from "../hero/hero";
import { cue } from "../sound/cues";
import { isDead, KIND_TUNING, type Enemy } from "./enemy";
import type { SandboxWorld } from "./sandboxLevel";
import { say } from "./tasks";

export interface Drop {
  x: number;
  y: number;
  from: number;
  taken: boolean;
}

export const DROP_TEXT = "You found a small energy cell.";

const EPS = 1e-6;

export const isSpecial = (e: Enemy): boolean => KIND_TUNING[e.flight ? "flyer" : e.kind]?.role === "special";

export function dropEnergy(world: SandboxWorld): void {
  if (!picked(world.difficulty, "specialDrops")) return;
  world.enemies.forEach((e, from) => {
    if (isDead(e) && isSpecial(e) && !world.drops.some((d) => d.from === from)) world.drops.push({ x: e.body.x, y: e.flight ? e.spot[1] : e.body.y, from, taken: false });
  });
}

export function pickDrops(world: SandboxWorld, h: Hero, cfg: MovementConfig): void {
  if (heroDead(h.state) || h.hidden || world.cutscene) return;
  const reach = Math.max(cfg.pickReach, cfg.box.width / 2);
  for (const d of world.drops) {
    if (d.taken || Math.abs(d.x - h.x) > reach || h.y <= d.y - cfg.box.height || h.y > d.y + EPS) continue;
    d.taken = true;
    h.energy = Math.max(h.energy, Math.min(cfg.energy.max, h.energy + EFFECTS.specialDrops.energy));
    cue(world, "power", 20000);
    say(world, DROP_TEXT);
  }
}
