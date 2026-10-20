export type Cheat = "immortal" | "noFog";

const CODES = new Map<string, Cheat>([
  ["c2080isforever", "immortal"],
  ["c2080iseverywhere", "noFog"],
]);

export const cheatOf = (code: string): Cheat | null => CODES.get(code.trim().toLowerCase()) ?? null;
