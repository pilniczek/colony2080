import type { ItemId } from "../items";

export type MissionId = "mesto" | "vesnice" | "jungle" | "jeskyne";

export const MISSIONS: MissionId[] = ["mesto", "vesnice", "jungle", "jeskyne"];

export const missionFromQuery = (search: string, open: readonly MissionId[] = MISSIONS): MissionId =>
  open.find((id) => id === new URLSearchParams(search).get("mission")) ?? "mesto";

const MAP_FROM_START: MissionId[] = ["vesnice", "jeskyne"];

export const mapItemOf = (id: MissionId): ItemId | undefined => (MAP_FROM_START.includes(id) ? undefined : "holoPlan");
