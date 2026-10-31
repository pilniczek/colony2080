import { ITEMS } from "../items";

export interface Quest {
  text: string;
  after: string[];
  any?: string[];
  until?: string;
}

interface QuestWorld {
  flags: ReadonlySet<string>;
  inventory: { items: readonly string[] };
}

const ITEM = "item:";

function token(text: string, value: unknown): string {
  if (typeof value !== "string" || !(value.startsWith(ITEM) || value.startsWith("flag:"))) throw new Error(`quest ${text}: bad token: ${String(value)}`);
  if (value.startsWith(ITEM) && !ITEMS[value.slice(ITEM.length)]) throw new Error(`quest ${text}: unknown item: ${value}`);
  return value;
}

function loadQuest(json: unknown): Quest {
  const q = (json ?? {}) as Record<string, unknown>;
  if (typeof q.text !== "string") throw new Error("quest without text");
  const { text } = q;
  if (!Array.isArray(q.after)) throw new Error(`quest ${text}: missing after`);
  const quest: Quest = { text, after: q.after.map((t: unknown) => token(text, t)) };
  if (q.any !== undefined) {
    if (!Array.isArray(q.any)) throw new Error(`quest ${text}: any is not a list`);
    quest.any = q.any.map((t: unknown) => token(text, t));
  }
  if (q.until !== undefined) quest.until = token(text, q.until);
  return quest;
}

export function loadQuests(json: unknown): Quest[] {
  const { quests } = (json ?? {}) as { quests?: unknown[] };
  return quests === undefined ? [] : quests.map(loadQuest);
}

const holds = (world: QuestWorld, token: string): boolean =>
  token.startsWith(ITEM) ? world.inventory.items.includes(token.slice(ITEM.length)) : world.flags.has(token);

export const activeQuests = (quests: readonly Quest[], world: QuestWorld): string[] =>
  quests.filter(
    (q) => q.after.every((t) => holds(world, t)) && (q.any === undefined || q.any.some((t) => holds(world, t))) && (q.until === undefined || !holds(world, q.until)),
  ).map((q) => q.text);
