import difficultyJson from "@config/difficulty.json";

export interface Assist {
  id: string;
  label: string;
  cost: number;
  locked?: boolean;
}

export interface Level {
  id: string;
  label: string;
  points: number;
  picks: string[];
}

export interface Difficulty {
  level: string;
  assists: string[];
}

export const ASSISTS: Assist[] = difficultyJson.assists;
export const PRESETS: Level[] = difficultyJson.levels;
export const CUSTOM = difficultyJson.custom;
export const LEVEL_IDS = [...PRESETS.map((l) => l.id), CUSTOM.id];

const assistOf = (id: string): Assist | undefined => ASSISTS.find((a) => a.id === id);

const presetOf = (id: string): Level | undefined => PRESETS.find((l) => l.id === id);

export const isCustom = (d: Difficulty): boolean => d.level === CUSTOM.id;

export const levelLabel = (id: string): string => presetOf(id)?.label ?? CUSTOM.label;

export const costOf = (assists: string[]): number => assists.reduce((sum, id) => sum + (assistOf(id)?.cost ?? 0), 0);

const LOCKED = ASSISTS.filter((a) => a.locked).map((a) => a.id);

export const reachable = (level: string): boolean => level === CUSTOM.id || LOCKED.every((id) => presetOf(level)?.picks.includes(id));

export const presetPicks = (level: string): Difficulty => ({ level, assists: [...(presetOf(level)?.picks ?? [])] });

export const START_DIFFICULTY = presetPicks(difficultyJson.start);

export const tierOf = (assists: string[]): Level => {
  const spent = costOf(assists);
  return PRESETS.find((l) => l.points <= spent) ?? PRESETS[PRESETS.length - 1]!;
};

export const canToggle = (d: Difficulty, id: string): boolean => isCustom(d) && assistOf(id) !== undefined && !assistOf(id)!.locked;

export function toggled(d: Difficulty, id: string): Difficulty {
  if (!canToggle(d, id)) return d;
  const on = d.assists.includes(id);
  return { ...d, assists: ASSISTS.map((a) => a.id).filter((a) => (a === id ? !on : d.assists.includes(a))) };
}

export function switched(d: Difficulty, side: -1 | 1): Difficulty {
  const at = LEVEL_IDS.indexOf(d.level);
  for (let i = at + side; i >= 0 && i < LEVEL_IDS.length; i += side) {
    const id = LEVEL_IDS[i]!;
    if (!reachable(id)) continue;
    return id === CUSTOM.id ? { level: id, assists: [...d.assists] } : presetPicks(id);
  }
  return d;
}

export const sameDifficulty = (a: Difficulty, b: Difficulty): boolean => a.level === b.level && a.assists.join() === b.assists.join();

export const difficultyOk = (d: unknown): d is Difficulty => {
  const { level, assists } = (d ?? {}) as Partial<Record<keyof Difficulty, unknown>>;
  if (typeof level !== "string" || !LEVEL_IDS.includes(level) || !reachable(level) || !Array.isArray(assists)) return false;
  if (!assists.every((id) => typeof id === "string" && assistOf(id) !== undefined) || new Set(assists).size !== assists.length) return false;
  const ids = assists as string[];
  if (!LOCKED.every((id) => ids.includes(id))) return false;
  return level === CUSTOM.id || sameDifficulty({ level, assists: ids }, presetPicks(level));
};
