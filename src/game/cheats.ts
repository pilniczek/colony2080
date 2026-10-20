export type Cheat = "immortal" | "noFog" | "weapon" | "items" | "debug" | { moveTo: [number, number] };

type Toggle = Exclude<Cheat, { moveTo: [number, number] }>;

export const CHEATS: { code: string; effect: string; cheat?: Toggle }[] = [
  { code: "c2080isforever", cheat: "immortal", effect: "Immortality: shots, hazards and falls do nothing, pits hold the hero. Enter again to turn off." },
  { code: "c2080iseverywhere", cheat: "noFog", effect: "No fog of war. Enter again to turn fog back on." },
  { code: "c2080ispowerful", cheat: "weapon", effect: "Gives the mission's special weapon with full ammo and removes its pickup from the map." },
  { code: "c2080isrich", cheat: "items", effect: "Gives every item of the mission: items on the map (hidden ones too) and items tasks hand out, each once. Weapons stay. No films." },
  { code: "c2080isdebugging", cheat: "debug", effect: "Turns on immortality, turns off fog of war, gives the special weapon and every item, opens the sandbox debug panel, and skips every film from then on (tasks still run). Stays on when entered again." },
  { code: "moveto(x,y)", effect: "Moves the hero to map cell x, y (y is the floor row, as in world.json), e.g. moveto(40,10)." },
];

const CODES = new Map(CHEATS.flatMap(({ code, cheat }) => (cheat ? [[code, cheat] as const] : [])));

const NUMBER = String.raw`\s*(-?\d+(?:\.\d+)?)\s*`;
const MOVE_TO = new RegExp(`^moveto\\(${NUMBER},${NUMBER}\\)$`);

export function cheatOf(code: string): Cheat | null {
  const typed = code.trim().toLowerCase();
  const move = MOVE_TO.exec(typed);
  if (move) return { moveTo: [Number(move[1]), Number(move[2])] };
  return CODES.get(typed) ?? null;
}

export const isCheatKey = (e: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey">): boolean =>
  e.key === ";" && !e.ctrlKey && !e.metaKey && !e.altKey;
