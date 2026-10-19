import { loadMesto } from "../game/level/mesto";
import { startRun, type RunOptions } from "../game/run";
import { useSandbox } from "../sandbox/store";
import { Hud } from "../sandbox/ui/Hud";
import { InventoryScreen } from "../sandbox/ui/InventoryScreen";
import { LevelEnd } from "./LevelEnd";
import { Subtitle } from "./Subtitle";

useSandbox.setState({ fogOn: true });

let drawOver: RunOptions["drawOver"];

const run = startRun({
  world: loadMesto(),
  drawOver: (ctx, view, cellPx) => drawOver?.(ctx, view, cellPx),
  ui: (
    <>
      <Hud />
      <Subtitle />
      <LevelEnd />
      <InventoryScreen />
    </>
  ),
});

if (import.meta.env.DEV) {
  void import("./originalOverlay").then((m) => {
    drawOver = m.originalOverlay(run);
  });
}
