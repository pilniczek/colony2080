import type { Platform } from "../../engine/world/collide";
import type { Projectile } from "../../engine/world/projectiles";
import { TileGrid } from "../../engine/world/tiles";
import { isAssetId, type AssetId } from "../env/assets";
import { createFog, type Fog } from "../fog";
import type { MovementConfig } from "../hero/config";
import type { Hero } from "../hero/hero";
import { createEnemy, type Enemy, type EnemyJson } from "./enemy";
import { terrain } from "./terrain";

export interface Prop {
  kind: string;
  x: number;
  y?: number;
  width?: number;
  height?: number;
  taken?: boolean;
  on?: boolean;
}

export interface Scenery {
  asset: AssetId;
  x: number;
  y?: number;
  state?: number;
}

export interface Lift extends Platform {
  top: number;
  bottom: number;
  target: number | null;
}

export interface Spark {
  x: number;
  y: number;
  age: number;
}

export interface SandboxWorld {
  grid: TileGrid;
  lifts: Lift[];
  props: Prop[];
  spawn: [number, number];
  sky: AssetId;
  backdrop: Scenery[];
  dressing: Scenery[];
  terrain: ReturnType<typeof terrain>;
  fog: Fog | null;
  projectiles: Projectile[];
  sparks: Spark[];
  enemies: Enemy[];
  source: SandboxJson;
}

type SceneryJson = Omit<Scenery, "asset"> & { asset: string };

interface SandboxJson {
  rows: string[];
  spawn: [number, number];
  sky: string;
  backdrop: SceneryJson[];
  dressing: SceneryJson[];
  lifts: { x: number; width: number; top: number; bottom: number; start?: "top" | "bottom" }[];
  props: Prop[];
  enemies: EnemyJson[];
}

function scenery(items: SceneryJson[]): Scenery[] {
  return items.map((item) => {
    if (!isAssetId(item.asset)) throw new Error(`unknown asset: ${item.asset}`);
    return { ...item, asset: item.asset };
  });
}

export function loadSandbox(json: unknown): SandboxWorld {
  const data = json as SandboxJson;
  const grid = new TileGrid(data.rows);
  const lifts = data.lifts.map((lift) => ({
    x: lift.x,
    y: lift.start === "top" ? lift.top : lift.bottom,
    w: lift.width,
    vy: 0,
    top: lift.top,
    bottom: lift.bottom,
    target: null,
  }));
  return {
    grid,
    lifts,
    props: data.props.map((prop) => ({ ...prop })),
    spawn: [data.spawn[0], data.spawn[1]],
    sky: scenery([{ asset: data.sky, x: 0 }])[0]!.asset,
    backdrop: scenery(data.backdrop),
    dressing: scenery(data.dressing),
    terrain: terrain(grid),
    fog: null,
    projectiles: [],
    sparks: [],
    enemies: data.enemies.map((e) => createEnemy(e, grid, lifts)),
    source: data,
  };
}

export function resetWorld(world: SandboxWorld): void {
  const { fog } = world;
  Object.assign(world, loadSandbox(world.source));
  const [x, y] = world.spawn;
  world.fog = fog && createFog(fog.cfg, { x, y }, world.grid);
}

export const heldItems = (world: SandboxWorld): string[] =>
  world.props.filter((p) => p.kind === "item" && p.taken).map(() => "crowbar");

export function liftAt(world: SandboxWorld, h: Pick<Hero, "x" | "y">, cfg: MovementConfig): Lift | null {
  const half = cfg.box.width / 2;
  return (
    world.lifts.find((l) => h.x + half > l.x && h.x - half < l.x + l.w && h.y >= l.top - 1 && h.y <= l.bottom) ?? null
  );
}

export function callLift(lift: Lift, dir: -1 | 1): void {
  if (lift.target !== null) return;
  lift.target = dir < 0 ? lift.top : lift.bottom;
}

export function updateLift(lift: Lift, speed: number, dt: number): void {
  if (lift.target === null) {
    lift.vy = 0;
    return;
  }
  const remaining = lift.target - lift.y;
  const step = speed * dt;
  if (Math.abs(remaining) <= step) {
    lift.y = lift.target;
    lift.target = null;
    lift.vy = remaining / dt;
    return;
  }
  const dir = Math.sign(remaining);
  lift.y += dir * step;
  lift.vy = dir * speed;
}
