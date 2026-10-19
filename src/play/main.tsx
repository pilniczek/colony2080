import { loadMesto } from "../game/level/mesto";
import { startRun } from "../game/run";
import { useSandbox } from "../sandbox/store";
import { Hud } from "../sandbox/ui/Hud";
import { LevelEnd } from "./LevelEnd";
import { Subtitle } from "./Subtitle";

useSandbox.setState({ fogOn: true });

startRun({
  world: loadMesto(),
  ui: (
    <>
      <Hud />
      <Subtitle />
      <LevelEnd />
    </>
  ),
});
