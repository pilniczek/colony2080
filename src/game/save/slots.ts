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

const key = (prefix: string, i: number): string => `${prefix}${SLOT_IDS[i]}`;

function readOne(storage: Storage, k: string): SlotEntry | null {
  try {
    const text = storage.getItem(k);
    return text ? (JSON.parse(text) as SlotEntry) : null;
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

export const latestFor = (slots: Slots, mission: string): SlotEntry | null =>
  slots.reduce<SlotEntry | null>((best, slot) => (slot?.mission === mission && (!best || slot.savedAt > best.savedAt) ? slot : best), null);
