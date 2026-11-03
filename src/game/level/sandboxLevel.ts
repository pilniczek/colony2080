import type { SoundCue } from "../../engine/audio/mixer";
import { isCutsceneId, type CutsceneId } from "../cutscene";
import type { Platform } from "../../engine/world/collide";
import { TileGrid } from "../../engine/world/tiles";
import { isAssetId, type AssetId } from "../env/assets";
import { createFog, type Fog } from "../fog";
import { createSoundClock, type SoundClock } from "../sound/triggers";
import type { MovementConfig } from "../hero/config";
import type { Hero } from "../hero/hero";
import { ITEMS, type ItemId } from "../items";
import { keepOutOf, type Cover } from "./cover";
import { createEnemy, type Enemy, type EnemyJson } from "./enemy";
import type { Missile } from "./missiles";
import type { Rocket } from "./rockets";
import type { PropFire, PropRepel } from "./guards";
import { loadQuests, type Quest } from "./quests";
import { applyBlocks, loadTasks, type Subtitle, type Task } from "./tasks";
import { terrain, type Rect as CellRect } from "./terrain";

export interface Prop {
  kind: string;
  x: number;
  y?: number;
  width?: number;
  height?: number;
  item?: ItemId;
  weapon?: BonusWeapon;
  taken?: boolean;
  shownBy?: string;
  on?: boolean;
  id?: string;
  asset?: AssetId;
  art?: { dx?: number; dy?: number; top?: number };
  state?: number;
  solidStates?: number[];
  gapStates?: number[];
  seeThrough?: boolean;
  cells?: { col: number; row: number; w: number; h: number };
  cover?: Cover;
  shootable?: { hits: number; state: number; gives?: string[]; subtitle?: string; by?: "beam"; cutscene?: CutsceneId };
  cutscene?: CutsceneId;
  approach?: { cells: number; cutscene: CutsceneId; gives: string };
  hitsTaken?: number;
  fires?: PropFire;
  repels?: PropRepel;
  fireTime?: number | null;
  pauseLeft?: number;
  brokenAge?: number;
}

export interface Scenery {
  asset: AssetId;
  x: number;
  y?: number;
  state?: number;
  w?: number;
  h?: number;
  flip?: boolean;
}

export interface Lift extends Platform {
  top: number;
  bottom: number;
  stops: number[];
  target: number | null;
  enabledBy?: string;
  hint?: string;
}

export interface Spark {
  x: number;
  y: number;
  age: number;
}

export interface Beam {
  x: number;
  y: number;
  end: number;
  facing: 1 | -1;
  tick: number;
  cycle?: number;
  clock?: number;
}

export interface Inventory {
  items: ItemId[];
  shown: ItemId | null;
}

export interface Hazard {
  id: string;
  kind: "death" | "damage";
  col: number;
  row: number;
  w: number;
  h: number;
  perSecond?: number;
  push?: number;
  sound?: "spark";
}

export interface Conveyor {
  col: number;
  row: number;
  w: number;
  vx: number;
}

export interface Teleport {
  id: string;
  from: [number, number];
  to: [number, number];
  col: number;
  w: number;
  enabledBy?: string;
}

export interface CellPatch {
  col: number;
  row: number;
  ch: string;
}

export interface SandboxWorld {
  grid: TileGrid;
  fallDeathCells: number | null | undefined;
  hazards: Hazard[];
  conveyors: Conveyor[];
  teleports: Teleport[];
  variants: Record<string, CellPatch[]>;
  lifts: Lift[];
  boarding: Lift | null;
  props: Prop[];
  inventory: Inventory;
  spawn: [number, number];
  sky: AssetId;
  backdrop: Scenery[];
  dressing: Scenery[];
  terrain: ReturnType<typeof terrain>;
  terrainArt: TerrainArt;
  haze: string;
  bare: CellRect[];
  ground: number | null;
  fog: Fog | null;
  heroHits: number;
  sparks: Spark[];
  projectiles: (Rocket | Missile)[];
  beam: Beam | null;
  beamHits: Set<Enemy>;
  bonus: BonusWeapon;
  enemies: Enemy[];
  flags: Set<string>;
  tasks: Task[];
  quests: Quest[];
  subtitle: Subtitle | null;
  cutscene: { id: CutsceneId; prop: Prop | null; t: number } | null;
  complete: boolean;
  immortal: boolean;
  allQuests: boolean;
  autosave: boolean;
  sounds: SoundCue[];
  sfx: SoundClock;
  source: SandboxJson;
}

export type BonusWeapon = "blaster" | "toaster";

export const BONUS_NAMES: Record<BonusWeapon, string> = { blaster: "E-Blaster", toaster: "Toaster" };

const WEAPON_ASSETS: Record<BonusWeapon, AssetId> = { blaster: "eBlaster", toaster: "toaster" };

export const firstBonus = (props: Prop[]): BonusWeapon => props.find((p) => p.kind === "weapon")?.weapon ?? "blaster";

export interface TerrainArt {
  wall: AssetId;
  ledge: AssetId;
  girder: AssetId;
  top?: AssetId;
  deep?: AssetId;
}

const TERRAIN_PARTS: (keyof TerrainArt)[] = ["wall", "ledge", "girder", "top", "deep"];

const MESTO_HAZE = "rgba(26, 12, 8, 0.45)";

const MESTO_TERRAIN: TerrainArt = { wall: "brickWall", ledge: "streetWalkway", girder: "girderBridge" };

const terrainArtOf = (art: SandboxJson["terrainArt"] = {}): TerrainArt => {
  const out = { ...MESTO_TERRAIN };
  for (const part of TERRAIN_PARTS) {
    const id = art[part];
    if (id === undefined) continue;
    if (!isAssetId(id)) throw new Error(`unknown asset: ${id}`);
    out[part] = id;
  }
  return out;
};

type SceneryJson = Omit<Scenery, "asset"> & { asset: string };

export interface LiftJson {
  x: number;
  width: number;
  top: number;
  bottom: number;
  stops?: number[];
  start?: "top" | "bottom";
  startRow?: number;
  enabledBy?: string;
  hint?: string;
}

export interface SandboxJson {
  rows: string[];
  spawn: [number, number];
  sky: string;
  backdrop: SceneryJson[];
  dressing: SceneryJson[];
  lifts: LiftJson[];
  props: Prop[];
  enemies: EnemyJson[];
  tasks?: unknown;
  fallDeathCells?: number | null;
  hazards?: Hazard[];
  conveyors?: Conveyor[];
  teleports?: Teleport[];
  variants?: Record<string, CellPatch[]>;
  bare?: CellRect[];
  terrainArt?: Partial<Record<keyof TerrainArt, string>>;
  haze?: string;
  ground?: number;
}

function checkedProp(prop: Prop): Prop {
  if (prop.kind === "item" && !(prop.item && ITEMS[prop.item])) throw new Error(`unknown item: ${prop.item}`);
  if (prop.kind === "weapon" && !(prop.weapon !== undefined && prop.weapon in BONUS_NAMES)) throw new Error(`unknown weapon: ${prop.weapon}`);
  if (prop.kind === "object" && !prop.id) throw new Error("object prop without id");
  if (prop.asset !== undefined && !isAssetId(prop.asset)) throw new Error(`unknown asset: ${prop.asset}`);
  for (const id of [prop.cutscene, prop.shootable?.cutscene, prop.approach?.cutscene, prop.repels?.cutscene]) if (id !== undefined && !isCutsceneId(id)) throw new Error(`unknown cutscene: ${id}`);
  const copy = structuredClone(prop);
  if (copy.kind === "weapon") copy.asset ??= WEAPON_ASSETS[copy.weapon!];
  return copy;
}

function scenery(items: SceneryJson[]): Scenery[] {
  return items.map((item) => {
    if (!isAssetId(item.asset)) throw new Error(`unknown asset: ${item.asset}`);
    return { ...item, asset: item.asset };
  });
}

export const fallLimit = (world: SandboxWorld, cfg: MovementConfig): number =>
  world.fallDeathCells === undefined ? cfg.fallDeathCells : (world.fallDeathCells ?? Infinity);

export function floorsOf(world: SandboxWorld): Platform[] {
  if (!world.immortal) return world.lifts;
  const pits = world.hazards.filter((z) => z.kind === "death").map((z) => ({ x: z.col, y: z.row, w: z.w, vy: 0 }));
  return [...world.lifts, ...pits, { x: 0, y: world.grid.height, w: world.grid.width, vy: 0 }];
}

export function loadSandbox(json: unknown): SandboxWorld {
  const data = json as SandboxJson;
  const grid = new TileGrid(data.rows);
  const lifts = data.lifts.map((lift) => ({
    x: lift.x,
    y: lift.startRow ?? (lift.start === "top" ? lift.top : lift.bottom),
    w: lift.width,
    vy: 0,
    top: lift.top,
    bottom: lift.bottom,
    stops: lift.stops ? [...lift.stops] : [lift.top, lift.bottom],
    target: null,
    ...(lift.enabledBy === undefined ? {} : { enabledBy: lift.enabledBy }),
    ...(lift.hint === undefined ? {} : { hint: lift.hint }),
  }));
  const world: SandboxWorld = {
    grid,
    fallDeathCells: data.fallDeathCells,
    hazards: structuredClone(data.hazards ?? []),
    conveyors: structuredClone(data.conveyors ?? []),
    teleports: structuredClone(data.teleports ?? []),
    variants: structuredClone(data.variants ?? {}),
    lifts,
    props: data.props.map(checkedProp),
    inventory: { items: [], shown: null },
    spawn: [data.spawn[0], data.spawn[1]],
    sky: scenery([{ asset: data.sky, x: 0 }])[0]!.asset,
    backdrop: scenery(data.backdrop),
    dressing: scenery(data.dressing),
    terrain: terrain(grid),
    terrainArt: terrainArtOf(data.terrainArt),
    haze: data.haze ?? MESTO_HAZE,
    bare: structuredClone(data.bare ?? []),
    ground: data.ground ?? null,
    fog: null,
    heroHits: 0,
    sparks: [],
    projectiles: [],
    beam: null,
    beamHits: new Set(),
    bonus: firstBonus(data.props),
    enemies: data.enemies.map((e) => createEnemy(e, grid, lifts, keepOutOf(data.props))),
    flags: new Set(),
    tasks: data.tasks === undefined ? [] : loadTasks(data.tasks),
    quests: loadQuests(data.tasks),
    subtitle: null,
    cutscene: null,
    complete: false,
    immortal: false,
    allQuests: false,
    autosave: false,
    boarding: null,
    sounds: [],
    sfx: createSoundClock(),
    source: data,
  };
  applyBlocks(world);
  return world;
}

export function resetWorld(world: SandboxWorld, cfg: MovementConfig): void {
  const { fog, immortal, allQuests, autosave, sounds, bonus } = world;
  Object.assign(world, loadSandbox(world.source), { immortal, allQuests, autosave, sounds, bonus });
  const [x, y] = world.spawn;
  world.fog = fog && createFog(fog.cfg, cfg, { x, y }, world.grid);
}

const held = (prop: Prop, hero: Pick<Hero, "blaster">, bonus: BonusWeapon | undefined): boolean => hero.blaster !== null && (bonus === undefined || bonus === prop.weapon);

export const onGround = (prop: Prop, hero: Pick<Hero, "blaster">, flags: ReadonlySet<string> = new Set(), bonus?: BonusWeapon): boolean =>
  (prop.kind === "weapon" ? !held(prop, hero, bonus) : !prop.taken) && (prop.shownBy === undefined || flags.has(prop.shownBy));

export function startFilm(world: SandboxWorld, id: CutsceneId | undefined, prop: Prop | null = null): void {
  if (id && !world.cutscene) world.cutscene = { id, prop, t: 0 };
}

const FLOOR_EPS = 0.01;

export function approachFilms(world: SandboxWorld, hero: Pick<Hero, "x" | "y">, height: number): void {
  for (const prop of world.props) {
    const near = prop.approach;
    const floor = prop.y ?? 0;
    if (!near || world.flags.has(near.gives) || hero.y > floor + FLOOR_EPS || hero.y <= floor - height || Math.abs(hero.x - prop.x) > near.cells) continue;
    world.flags.add(near.gives);
    startFilm(world, near.cutscene);
  }
}

export function pickUp(world: SandboxWorld, id: ItemId): void {
  if (!world.inventory.items.includes(id)) world.inventory.items.push(id);
  world.inventory.shown = id;
}

export function showItem(world: SandboxWorld, id: ItemId): void {
  if (world.inventory.items.includes(id)) world.inventory.shown = id;
}

export function useShown(world: SandboxWorld): ItemId | null {
  const { inventory } = world;
  const { shown, items } = inventory;
  if (shown === null) return null;
  const at = items.indexOf(shown);
  items.splice(at, 1);
  inventory.shown = items[at - 1] ?? items[at] ?? null;
  return shown;
}

export function liftAt(world: SandboxWorld, h: Pick<Hero, "x" | "y">, cfg: MovementConfig): Lift | null {
  const half = cfg.box.width / 2;
  return (
    world.lifts.find((l) => h.x + half > l.x && h.x - half < l.x + l.w && h.y >= l.top - 1 && h.y <= l.bottom) ?? null
  );
}

export const liftGoes = (lift: Lift, dir: -1 | 1): boolean =>
  lift.target !== null || (dir < 0 ? lift.y > lift.top : lift.y < lift.bottom);

export function callLift(lift: Lift, dir: -1 | 1, flags?: Set<string>): boolean {
  if (lift.enabledBy !== undefined && !flags?.has(lift.enabledBy)) return false;
  if (lift.target !== null) return true;
  const ahead = lift.stops.filter((row) => (row - lift.y) * dir > 0);
  lift.target = ahead.length ? (dir < 0 ? Math.max(...ahead) : Math.min(...ahead)) : dir < 0 ? lift.top : lift.bottom;
  return true;
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
