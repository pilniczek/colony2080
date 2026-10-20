import type { Hero } from "../hero/hero";
import type { SandboxWorld, Teleport } from "./sandboxLevel";

export const padEnabled = (world: SandboxWorld, pad: Teleport): boolean => pad.enabledBy === undefined || world.flags.has(pad.enabledBy);

export function padUnder(world: SandboxWorld, h: Hero): Teleport | null {
  if (!h.onGround) return null;
  const col = Math.floor(h.x);
  const row = Math.floor(h.y - 0.001);
  return world.teleports.find((t) => t.from[1] === row && col >= t.col && col < t.col + t.w && padEnabled(world, t)) ?? null;
}

export function ridePad(h: Hero, pad: Teleport): void {
  h.x = pad.to[0] + 0.5;
  h.y = pad.to[1] + 1;
  h.vx = 0;
  h.vy = 0;
  h.fallFrom = h.y;
  h.onGround = true;
  h.onLift = false;
}
