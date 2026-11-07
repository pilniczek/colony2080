export type MissionId = "mesto" | "vesnice" | "jungle" | "jeskyne";

export const MISSIONS: MissionId[] = ["mesto", "vesnice", "jungle", "jeskyne"];

export const missionFromQuery = (search: string, open: readonly MissionId[] = MISSIONS): MissionId =>
  open.find((id) => id === new URLSearchParams(search).get("mission")) ?? "mesto";
