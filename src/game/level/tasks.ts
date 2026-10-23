import { isCutsceneId, type CutsceneId } from "../cutscene";
import { ITEMS, type ItemId } from "../items";
import { cue } from "../sound/cues";
import { OPEN_SOUND } from "../sound/props";
import { pickUp, useShown, type Prop, type SandboxWorld } from "./sandboxLevel";

export interface Task {
  id: string;
  object: string;
  requires: string[];
  consumes: string[];
  gives: string[];
  state?: number;
  sets?: Record<string, number>;
  cutscene?: CutsceneId;
  touch?: true;
  subtitle: string;
  hint?: string;
}

export interface Subtitle {
  text: string;
  age: number;
  note?: string;
  film?: true;
}

const ITEM = "item:";
const FLAG = "flag:";
const COMPLETE = "flag:levelComplete";
const MISSING = "Something is missing here.";
const DONE = "Nothing more to do here.";

const itemOf = (token: string): ItemId | null => (token.startsWith(ITEM) ? token.slice(ITEM.length) : null);
const doneToken = (task: Task) => `task:${task.id}`;

function tokens(id: string, value: unknown, field: string): string[] {
  if (value === undefined && field === "consumes") return [];
  if (!Array.isArray(value)) throw new Error(`task ${id}: missing ${field}`);
  return value.map((token: unknown) => {
    if (typeof token !== "string" || !(token.startsWith(ITEM) || token.startsWith(FLAG))) {
      throw new Error(`task ${id}: bad token: ${String(token)}`);
    }
    const item = itemOf(token);
    if (item !== null && !ITEMS[item]) throw new Error(`task ${id}: unknown item: ${item}`);
    return token;
  });
}

function loadTask(json: unknown): Task {
  const t = (json ?? {}) as Record<string, unknown>;
  const id = String(t.id);
  if (typeof t.object !== "string") throw new Error(`task ${id}: missing object`);
  if (typeof t.subtitle !== "string") throw new Error(`task ${id}: missing subtitle`);
  const task: Task = {
    id,
    object: t.object,
    requires: tokens(id, t.requires, "requires"),
    consumes: tokens(id, t.consumes, "consumes"),
    gives: tokens(id, t.gives, "gives"),
    subtitle: t.subtitle,
  };
  const used = task.requires.filter((token) => itemOf(token) !== null);
  if (used.length > 1) throw new Error(`task ${id}: needs more than one item`);
  if (task.consumes.some((token) => itemOf(token) !== null && !used.includes(token))) throw new Error(`task ${id}: consumes an item it does not use`);
  if (t.hint !== undefined) {
    if (typeof t.hint !== "string") throw new Error(`task ${id}: hint is not text`);
    task.hint = t.hint;
  }
  if (typeof t.state === "number") task.state = t.state;
  if (t.sets) task.sets = { ...(t.sets as Record<string, number>) };
  if (t.cutscene !== undefined) {
    if (typeof t.cutscene !== "string" || !isCutsceneId(t.cutscene)) throw new Error(`task ${id}: unknown cutscene: ${String(t.cutscene)}`);
    task.cutscene = t.cutscene as CutsceneId;
  }
  if (t.touch === true) {
    if (!task.cutscene) throw new Error(`task ${id}: touch needs a cutscene`);
    task.touch = true;
  }
  return task;
}

export function loadTasks(json: unknown): Task[] {
  const { tasks } = (json ?? {}) as { tasks?: unknown[] };
  if (!Array.isArray(tasks)) throw new Error("tasks config has no tasks");
  return tasks.map(loadTask);
}

export function say(world: SandboxWorld, text: string): void {
  world.subtitle = { text, age: 0 };
}

const met = (world: SandboxWorld, token: string): boolean => {
  const item = itemOf(token);
  return item === null ? world.flags.has(token) : world.inventory.shown === item;
};

const open = (world: SandboxWorld, prop: Prop) =>
  world.tasks.filter((t) => t.object === prop.id && !world.flags.has(doneToken(t)));

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function hintFor(prop: Prop, world: SandboxWorld): string {
  const tasks = open(world, prop);
  const [first] = tasks;
  if (!first) return DONE;
  const { shown } = world.inventory;
  const fits = tasks.some((t) => t.requires.includes(`${ITEM}${shown}`));
  if (shown !== null && !fits) return `${capital(ITEMS[shown]?.name ?? shown)} didn't work, maybe something else might be useful here.`;
  return first.hint ?? MISSING;
}

export function applyBlocks(world: SandboxWorld): void {
  world.grid.clearBlocks();
  for (const prop of world.props) {
    const { cells, solidStates } = prop;
    if (!cells || !solidStates?.includes(prop.state ?? 0)) continue;
    for (let row = cells.row; row < cells.row + cells.h; row++) {
      for (let col = cells.col; col < cells.col + cells.w; col++) world.grid.block(col, row, true, prop.seeThrough);
    }
  }
}

function moveProp(world: SandboxWorld, prop: Prop, state: number, filmed: boolean): void {
  if ((prop.state ?? 0) === state) return;
  prop.state = state;
  const sound = !filmed && prop.asset && OPEN_SOUND[prop.asset];
  if (sound) cue(world, sound.id, sound.rate);
}

function setState(world: SandboxWorld, id: string, state: number): void {
  for (const prop of world.props) if (prop.id === id) moveProp(world, prop, state, false);
}

export const openTask = (world: SandboxWorld, prop: Prop): Task | undefined => open(world, prop).find((t) => t.requires.every((token) => met(world, token)));

export function pickAll(world: SandboxWorld): number {
  const ground = world.props.filter((p) => p.kind === "item");
  for (const prop of ground) prop.taken = true;
  const given = world.tasks.flatMap((t) => t.gives.map(itemOf));
  const fresh = [...new Set([...ground.map((p) => p.item!), ...given])].filter((id): id is ItemId => id !== null && !world.inventory.items.includes(id));
  for (const id of fresh) pickUp(world, id);
  return fresh.length;
}

function openState(world: SandboxWorld, prop: Prop): number {
  const solid = prop.solidStates ?? [];
  const known = [...world.tasks.flatMap((t) => (t.object === prop.id ? [t.state] : []).concat(prop.id === undefined ? [] : [t.sets?.[prop.id]])), prop.shootable?.state];
  const opened = known.find((state): state is number => state !== undefined && !solid.includes(state));
  if (opened !== undefined) return opened;
  let state = 0;
  while (solid.includes(state)) state++;
  return state;
}

export function openBlockers(world: SandboxWorld): number {
  const blockers = world.props.filter((p) => p.solidStates?.includes(p.state ?? 0));
  for (const prop of blockers) prop.state = openState(world, prop);
  const locks = [...new Set([...world.lifts, ...world.teleports].flatMap((l) => (l.enabledBy !== undefined && !world.flags.has(l.enabledBy) ? [l.enabledBy] : [])))];
  for (const flag of locks) world.flags.add(flag);
  applyBlocks(world);
  return blockers.length + locks.length;
}

export function runUse(world: SandboxWorld, prop: Prop, { filmed = false } = {}): void {
  const task = openTask(world, prop);
  if (!task) {
    say(world, hintFor(prop, world));
    return;
  }
  for (const token of task.consumes) {
    if (itemOf(token) === null) world.flags.delete(token);
    else useShown(world);
  }
  for (const token of task.gives) {
    const item = itemOf(token);
    if (item === null) world.flags.add(token);
    else pickUp(world, item);
  }
  world.flags.add(doneToken(task));
  if (task.state !== undefined) moveProp(world, prop, task.state, filmed);
  for (const [id, state] of Object.entries(task.sets ?? {})) setState(world, id, state);
  applyBlocks(world);
  say(world, task.subtitle);
  if (world.flags.has(COMPLETE)) world.complete = true;
}
