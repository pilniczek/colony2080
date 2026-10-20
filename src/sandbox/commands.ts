import controls from "@config/controls.json";
import { SHIELDS_MAX } from "../game/hud/svg";
import type { Weapon } from "../game/hero/config";
import { damage, halt, kill } from "../game/hero/hero";
import { startFilm } from "../game/level/sandboxLevel";
import type { Run, RunStart } from "../game/run";
import { blasterAmmo, useSandbox } from "./store";
import type { SandboxCommands } from "./ui/Panel";

const tuning = () => useSandbox.getState();

const WEAPON_KEYS: Record<Weapon, string> = { gun: "weapon1", fists: "weapon2", blaster: "weapon3" };

export function panelCommands(runOf: () => Run): { commands: SandboxCommands; afterStep: () => void } {
  let started: RunStart = { fogOn: tuning().fogOn, weapon: "gun", running: true, blaster: null };
  let recordedSteps = 0;
  let playedSteps = 0;

  const endPlayback = (): void => {
    runOf().input.stopPlayback();
    runOf().input.releaseAll();
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
    runOf().input.keyDown(code);
    runOf().input.keyUp(code);
  };

  const commands: SandboxCommands = {
    step: () => runOf().loop.stepOnce(),
    startRecording() {
      const run = runOf();
      if (tuning().playing) endPlayback();
      started = { fogOn: tuning().fogOn, weapon: run.hero.weapon, running: run.hero.running, blaster: run.hero.blaster };
      run.restart(started);
      run.input.startRecording();
      recordedSteps = 0;
      useSandbox.setState({ recording: true });
    },
    stopRecording() {
      if (tuning().playing) return endPlayback();
      useSandbox.setState({ recording: false, record: runOf().input.stopRecording() });
    },
    replay() {
      const { record } = tuning();
      if (!record) return;
      runOf().restart(started);
      runOf().input.play(record);
      playedSteps = 0;
      useSandbox.setState({ playing: true });
    },
    setWeapon: (weapon) => press(WEAPON_KEYS[weapon]),
    hit: () => void damage(runOf().hero, tuning().movement),
    kill: () => void kill(runOf().hero),
    setAmmo: (ammo) => void (runOf().hero.ammo = Math.max(0, Math.round(ammo))),
    setBlaster: (ammo) => void (runOf().hero.blaster = blasterAmmo(ammo, runOf().hero.blaster)),
    setShields: (shields) => void (runOf().hero.shields = Math.min(SHIELDS_MAX, Math.max(0, Math.round(shields)))),
    setFog(on) {
      runOf().applyFog(on);
      useSandbox.setState({ fogOn: on });
    },
    playFilm(id) {
      startFilm(runOf().world, id);
      halt(runOf().hero);
    },
  };

  return { commands, afterStep };
}
