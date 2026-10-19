import type { Platform } from "../../engine/world/collide";
import type { Projectile } from "../../engine/world/projectiles";
import { TileGrid } from "../../engine/world/tiles";
import { isAssetId, type AssetId } from "../env/assets";
import type { Fog } from "../fog";
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
  lift: Lift;
  props: Prop[];
  spawn: [number, number];
  sky: AssetId;
  backdrop: Scenery[];
  dressing: Scenery[];
  terrain: ReturnType<typeof terrain>;
  fog: Fog | null;
  projectiles: Projectile[];
  sparks: Spark[];
  enemy: Enemy;
}

type SceneryJson = Omit<Scenery, "asset"> & { asset: string };

interface SandboxJson {
  rows: string[];
  spawn: [number, number];
  sky: string;
  backdrop: SceneryJson[];
  dressing: SceneryJson[];
  lift: { x: number; width: number; top: number; bottom: number };
  props: Prop[];
  enemy: EnemyJson;
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
  return {
    grid,
    lift: {
      x: data.lift.x,
      y: data.lift.bottom,
      w: data.lift.width,
      vy: 0,
      top: data.lift.top,
      bottom: data.lift.bottom,
      target: null,
    },
    props: data.props.map((prop) => ({ ...prop })),
    spawn: [data.spawn[0], data.spawn[1]],
    sky: scenery([{ asset: data.sky, x: 0 }])[0]!.asset,
    backdrop: scenery(data.backdrop),
    dressing: scenery(data.dressing),
    terrain: terrain(grid),
    fog: null,
    projectiles: [],
    sparks: [],
    enemy: createEnemy(data.enemy, grid),
  };
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
