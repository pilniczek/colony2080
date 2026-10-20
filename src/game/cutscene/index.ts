export const CUTSCENE_IDS = ["crowbarDoor", "missionStart", "rebelShot", "talkRebel", "pullWires", "wireSwitchboard", "takeTapHandle", "searchCorpse", "tradeHoloPlan", "tradeShipPart", "unlockPlasma", "repairLift", "openDoor", "useAcidTank", "hullCover", "pickShipPart", "pickCraneKey", "pickCrowbar", "pickController", "pickEBlaster", "repairCrane"] as const;

export type CutsceneId = (typeof CUTSCENE_IDS)[number];

export interface Cutscene {
  id: CutsceneId;
  duration: number;
  camera: string;
  render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void;
}

const LOADERS: Record<CutsceneId, () => Promise<Cutscene>> = {
  crowbarDoor: () => import("./crowbarDoor").then((m) => m.crowbarDoor),
  missionStart: () => import("./missionStart").then((m) => m.missionStart),
  rebelShot: () => import("./rebelShot").then((m) => m.rebelShot),
  talkRebel: () => import("./talkRebel").then((m) => m.talkRebel),
  pullWires: () => import("./pullWires").then((m) => m.pullWires),
  wireSwitchboard: () => import("./wireSwitchboard").then((m) => m.wireSwitchboard),
  takeTapHandle: () => import("./takeTapHandle").then((m) => m.takeTapHandle),
  searchCorpse: () => import("./searchCorpse").then((m) => m.searchCorpse),
  tradeHoloPlan: () => import("./tradeHoloPlan").then((m) => m.tradeHoloPlan),
  tradeShipPart: () => import("./tradeShipPart").then((m) => m.tradeShipPart),
  unlockPlasma: () => import("./unlockPlasma").then((m) => m.unlockPlasma),
  repairLift: () => import("./repairLift").then((m) => m.repairLift),
  openDoor: () => import("./openDoor").then((m) => m.openDoor),
  useAcidTank: () => import("./useAcidTank").then((m) => m.useAcidTank),
  hullCover: () => import("./hullCover").then((m) => m.hullCover),
  pickShipPart: () => import("./pickShipPart").then((m) => m.pickShipPart),
  pickCraneKey: () => import("./pickCraneKey").then((m) => m.pickCraneKey),
  pickCrowbar: () => import("./pickCrowbar").then((m) => m.pickCrowbar),
  pickController: () => import("./pickController").then((m) => m.pickController),
  pickEBlaster: () => import("./pickEBlaster").then((m) => m.pickEBlaster),
  repairCrane: () => import("./repairCrane").then((m) => m.repairCrane),
};

const loaded = new Map<CutsceneId, Cutscene>();
const loading = new Map<CutsceneId, Promise<Cutscene>>();

export const isCutsceneId = (id: unknown): id is CutsceneId => (CUTSCENE_IDS as readonly unknown[]).includes(id);

export const filmOf = (id: CutsceneId): Cutscene | null => loaded.get(id) ?? null;

export function loadFilm(id: CutsceneId): Promise<Cutscene> {
  const started = loading.get(id) ?? LOADERS[id]().then((film) => {
    loaded.set(id, film);
    return film;
  });
  loading.set(id, started);
  return started;
}

export const loadFilms = (): Promise<Cutscene[]> => Promise.all(CUTSCENE_IDS.map(loadFilm));
