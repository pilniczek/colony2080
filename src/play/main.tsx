import { mapItemOf, missionFromQuery, MISSIONS } from "../game/level/missionIds";
import { loadMesto } from "../game/level/mesto";
import { startRun, type Run, type RunOptions } from "../game/run";
import { browserStorage } from "../game/save/saveMenu";
import { slotFromQuery } from "../game/save/slots";
import { panelCommands } from "../sandbox/commands";
import { useSandbox } from "../sandbox/store";
import { Hud } from "../sandbox/ui/Hud";
import { InventoryScreen } from "../sandbox/ui/InventoryScreen";
import { DebugPanel } from "./DebugPanel";
import { LevelEnd } from "./LevelEnd";
import { MenuScreen } from "./MenuScreen";
import { Subtitle } from "./Subtitle";

useSandbox.setState({ fogOn: true });

let drawOver: RunOptions["drawOver"];

const MISSION = missionFromQuery(location.search, import.meta.env.DEV ? MISSIONS : ["mesto"]);

const startSlot = slotFromQuery(location.search);

const { commands, afterStep } = panelCommands(() => run);

const run: Run = startRun({
  world: import.meta.env.DEV ? (await import("../game/level/missions")).loadMission(MISSION) : loadMesto(),
  saves: { mission: MISSION, storage: browserStorage(), startSlot, askDifficulty: true },
  intro: startSlot === null && MISSION === "mesto" ? "missionStart" : undefined,
  mapItem: mapItemOf(MISSION),
  afterStep,
  drawOver: (ctx, view, cellPx) => drawOver?.(ctx, view, cellPx),
  ui: (
    <>
      <Hud />
      <Subtitle />
      <LevelEnd />
      <InventoryScreen />
      <MenuScreen mission={MISSION} />
      <DebugPanel commands={commands} mission={MISSION} />
    </>
  ),
});

if (import.meta.env.DEV) {
  void import("./originalOverlay").then((m) => {
    drawOver = m.originalOverlay(run, MISSION);
  });
}
