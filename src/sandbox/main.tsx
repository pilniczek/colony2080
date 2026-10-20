import sandboxJson from "@config/levels/sandbox.json";
import { loadSandbox } from "../game/level/sandboxLevel";
import { startRun, type Run } from "../game/run";
import { Subtitle } from "../play/Subtitle";
import { panelCommands } from "./commands";
import { Hud } from "./ui/Hud";
import { InventoryScreen } from "./ui/InventoryScreen";
import { Panel } from "./ui/Panel";

const { commands, afterStep } = panelCommands(() => run);

const run: Run = startRun({
  world: loadSandbox(sandboxJson),
  ui: (
    <>
      <Hud />
      <Subtitle />
      <InventoryScreen />
      <Panel commands={commands} />
    </>
  ),
  afterStep,
});
