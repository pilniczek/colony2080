import { moveBox, type Platform } from "../../engine/world/collide";
import type { MovementConfig } from "../hero/config";
import { drain, isDead, kill, type Hero, type HeroEvent } from "../hero/hero";
import type { Hazard, SandboxWorld } from "./sandboxLevel";

export const fallLimit = (world: SandboxWorld, cfg: MovementConfig): number =>
  world.fallDeathCells === undefined ? cfg.fallDeathCells : (world.fallDeathCells ?? Infinity);

const footCell = (h: Hero): [number, number] => [Math.floor(h.x), Math.floor(h.y - 0.001)];

const inside = (z: Hazard, [col, row]: [number, number]): boolean =>
  col >= z.col && col < z.col + z.w && row >= z.row && row < z.row + z.h;

const live = (world: SandboxWorld, h: Hero): boolean => world.cutscene === null && !isDead(h.state);

export function floorsOf(world: SandboxWorld): Platform[] {
  if (!world.immortal) return world.lifts;
  const pits = world.hazards.filter((z) => z.kind === "death").map((z) => ({ x: z.col, y: z.row, w: z.w, vy: 0 }));
  return [...world.lifts, ...pits, { x: 0, y: world.grid.height, w: world.grid.width, vy: 0 }];
}

function carry(world: SandboxWorld, h: Hero, cfg: MovementConfig, dx: number): void {
  if (dx === 0) return;
  h.x = moveBox({ x: h.x, y: h.y, w: cfg.box.width, h: cfg.box.height }, dx, 0, world.grid, world.lifts).x;
}

export function stepHazards(world: SandboxWorld, h: Hero, cfg: MovementConfig, dt: number, events: HeroEvent[]): void {
  if (!live(world, h) || world.immortal) return;
  const cell = footCell(h);
  for (const z of world.hazards) {
    if (isDead(h.state) || !inside(z, cell)) continue;
    if (z.kind === "death") events.push(...kill(h, "hazard"));
    else {
      events.push(...drain(h, cfg, (z.perSecond ?? 0) * dt, "hazard"));
      carry(world, h, cfg, (z.push ?? 0) * dt);
    }
  }
}

export function conveyorVx(world: SandboxWorld, h: Hero): number {
  if (!live(world, h) || !h.onGround || h.onLift) return 0;
  const col = Math.floor(h.x);
  const row = Math.floor(h.y + 0.001);
  return world.conveyors.find((c) => c.row === row && col >= c.col && col < c.col + c.w)?.vx ?? 0;
}

export function stepConveyors(world: SandboxWorld, h: Hero, cfg: MovementConfig, dt: number): void {
  carry(world, h, cfg, conveyorVx(world, h) * dt);
}
