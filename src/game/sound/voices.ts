import type { Mixer } from "../../engine/audio/mixer";
import type { FilmStep } from "../cutscene/play";

type Stopper = Pick<Mixer, "stopAll">;

export function stopOnSkip(mixer: Stopper, step: FilmStep): void {
  if (step === "skipped") mixer.stopAll("world");
}

export function stopOnPause(mixer: Stopper, wasPaused: boolean, paused: boolean): void {
  if (paused && !wasPaused) mixer.stopAll("world");
}

export function stopWhenHidden(mixer: Stopper, hidden: boolean): void {
  if (hidden) mixer.stopAll("world");
}

export function warmOnUnlock(mixer: Pick<Mixer, "unlock" | "warm">, ids: readonly string[], idle: (task: () => void) => void): () => void {
  let warming = false;
  const warmFrom = (i: number): void => {
    const id = ids[i];
    if (id === undefined) return;
    mixer.warm(id);
    idle(() => warmFrom(i + 1));
  };
  return () => {
    mixer.unlock();
    if (warming) return;
    warming = true;
    idle(() => warmFrom(0));
  };
}
