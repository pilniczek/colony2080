import controls from "@config/controls.json";
import sandboxJson from "@config/levels/sandbox.json";
import { SHIELDS_MAX } from "../game/hud/svg";
import type { Weapon } from "../game/hero/config";
import { damage, kill } from "../game/hero/hero";
import { loadSandbox } from "../game/level/sandboxLevel";
import { startRun, type Run, type RunStart } from "../game/run";
import { blasterAmmo, useSandbox } from "./store";
import { Hud } from "./ui/Hud";
import { Panel, type SandboxCommands } from "./ui/Panel";

const tuning = () => useSandbox.getState();

const WEAPON_KEYS: Record<Weapon, string> = { gun: "weapon1", fists: "weapon2", blaster: "weapon3" };

let started: RunStart = { fogOn: tuning().fogOn, weapon: "gun", running: true, blaster: null };
let recordedSteps = 0;
let playedSteps = 0;

const endPlayback = (): void => {
  run.input.stopPlayback();
  run.input.releaseAll();
  useSandbox.setState({ playing: false });
};

const afterStep = (): void => {
  const { recording, playing } = tuning();
  if (recording) recordedSteps++;
  if (playing && ++playedSteps >= recordedSteps) endPlayback();
};

const press = (action: string): void => {
  const code = controls.keyboard[action as keyof typeof controls.keyboard]?.[0];
  if (!code) return;
  run.input.keyDown(code);
  run.input.keyUp(code);
};

const commands: SandboxCommands = {
  step: () => run.loop.stepOnce(),
  startRecording() {
    if (tuning().playing) endPlayback();
    started = { fogOn: tuning().fogOn, weapon: run.hero.weapon, running: run.hero.running, blaster: run.hero.blaster };
    run.restart(started);
    run.input.startRecording();
    recordedSteps = 0;
    useSandbox.setState({ recording: true });
  },
  stopRecording() {
    if (tuning().playing) return endPlayback();
    useSandbox.setState({ recording: false, record: run.input.stopRecording() });
  },
  replay() {
    const { record } = tuning();
    if (!record) return;
    run.restart(started);
    run.input.play(record);
    playedSteps = 0;
    useSandbox.setState({ playing: true });
  },
  setWeapon: (weapon) => press(WEAPON_KEYS[weapon]),
  hit: () => void damage(run.hero, tuning().movement),
  kill: () => void kill(run.hero),
  setAmmo: (ammo) => void (run.hero.ammo = Math.max(0, Math.round(ammo))),
  setBlaster: (ammo) => void (run.hero.blaster = blasterAmmo(ammo, run.hero.blaster)),
  setShields: (shields) => void (run.hero.shields = Math.min(SHIELDS_MAX, Math.max(0, Math.round(shields)))),
  setFog(on) {
    run.applyFog(on);
    useSandbox.setState({ fogOn: on });
  },
};

const run: Run = startRun({
  world: loadSandbox(sandboxJson),
  ui: (
    <>
      <Hud />
      <Panel commands={commands} />
    </>
  ),
  afterStep,
});
