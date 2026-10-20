import type { Snapshot } from "./snapshot";

export const SLOT_IDS = ["A", "B", "C", "D", "E"] as const;

const MISSION_NAMES: Record<string, string> = { mesto: "City" };

export interface SlotEntry {
  mission: string;
  name: string;
  savedAt: number;
  picture: string;
  snapshot: Snapshot;
}

export type Slots = (SlotEntry | null)[];

export const missionName = (mission: string): string => MISSION_NAMES[mission] ?? mission;

export const slotName = (mission: string, typed: string): string => (typed ? `${missionName(mission)} - ${typed}` : missionName(mission));

const two = (n: number): string => String(n).padStart(2, "0");

export const savedStamp = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;
};

export const slotHref = (page: string, i: number): string => `${page}?slot=${SLOT_IDS[i]}`;

export const slotFromQuery = (search: string): number | null => {
  const i = SLOT_IDS.indexOf(new URLSearchParams(search).get("slot") as (typeof SLOT_IDS)[number]);
  return i < 0 ? null : i;
};

const key = (prefix: string, i: number): string => `${prefix}${SLOT_IDS[i]}`;

const PICTURE_PREFIX = "data:image/";

const entryOk = (value: unknown): value is SlotEntry => {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.mission === "string" &&
    typeof e.name === "string" &&
    typeof e.savedAt === "number" &&
    Number.isFinite(e.savedAt) &&
    typeof e.picture === "string" &&
    e.picture.startsWith(PICTURE_PREFIX) &&
    typeof e.snapshot === "object" &&
    e.snapshot !== null
  );
};

function readOne(storage: Storage, k: string): SlotEntry | null {
  try {
    const text = storage.getItem(k);
    const entry: unknown = text ? JSON.parse(text) : null;
    return entryOk(entry) ? entry : null;
  } catch {
    return null;
  }
}

export const readSlots = (storage: Storage | null, prefix = "c2080.save."): Slots => SLOT_IDS.map((_, i) => (storage ? readOne(storage, key(prefix, i)) : null));

export function writeSlot(storage: Storage | null, i: number, entry: SlotEntry, prefix = "c2080.save."): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key(prefix, i), JSON.stringify(entry));
    return true;
  } catch {
    return false;
  }
}
