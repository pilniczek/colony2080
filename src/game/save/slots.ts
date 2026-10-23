import type { Snapshot } from "./snapshot";

export const SLOT_IDS = ["A", "B", "C", "D", "E"] as const;
export const AUTO_SLOT = SLOT_IDS.length;
const AUTO_ID = "AUTO";

const MISSION_NAMES: Record<string, string> = { mesto: "City", vesnice: "Suburb", jungle: "Jungle", jeskyne: "Caves" };

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

export const slotLabel = (i: number): string => (i === AUTO_SLOT ? AUTO_ID : SLOT_IDS[i]!);

export const slotHref = (mission: string, i: number): string => `game.html?mission=${mission}&slot=${slotLabel(i)}`;

export const slotFromQuery = (search: string): number | null => {
  const id = new URLSearchParams(search).get("slot");
  if (id === AUTO_ID) return AUTO_SLOT;
  const i = SLOT_IDS.indexOf(id as (typeof SLOT_IDS)[number]);
  return i < 0 ? null : i;
};

const key = (prefix: string, i: number, mission: string): string => (i === AUTO_SLOT ? `${prefix}auto.${mission}` : `${prefix}${SLOT_IDS[i]}`);

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

export const readSlots = (storage: Storage | null, mission: string, prefix = "c2080.save."): Slots =>
  Array.from({ length: AUTO_SLOT + 1 }, (_, i) => (storage ? readOne(storage, key(prefix, i, mission)) : null));

export function writeSlot(storage: Storage | null, i: number, entry: SlotEntry, prefix = "c2080.save."): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key(prefix, i, entry.mission), JSON.stringify(entry));
    return true;
  } catch {
    return false;
  }
}
