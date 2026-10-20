import { loadMission, type MissionId } from "../game/level/missions";
import { startRun, type RunOptions } from "../game/run";
import { browserStorage } from "../game/save/saveMenu";
import { slotFromQuery } from "../game/save/slots";
import { useSandbox } from "../sandbox/store";
import { Hud } from "../sandbox/ui/Hud";
import { InventoryScreen } from "../sandbox/ui/InventoryScreen";
import { LevelEnd } from "./LevelEnd";
import { MenuScreen } from "./MenuScreen";
import { Subtitle } from "./Subtitle";

useSandbox.setState({ fogOn: true });

let drawOver: RunOptions["drawOver"];

const MISSION: MissionId = "mesto";

const startSlot = slotFromQuery(location.search);

const run = startRun({
  world: loadMission(MISSION),
  saves: { mission: MISSION, storage: browserStorage(), startSlot },
  intro: startSlot === null ? "missionStart" : undefined,
  mapItem: "holoPlan",
  drawOver: (ctx, view, cellPx) => drawOver?.(ctx, view, cellPx),
  ui: (
    <>
      <Hud />
      <Subtitle />
      <LevelEnd />
      <InventoryScreen />
      <MenuScreen mission={MISSION} />
    </>
  ),
});

if (import.meta.env.DEV) {
  void import("./originalOverlay").then((m) => {
    drawOver = m.originalOverlay(run);
  });
}
