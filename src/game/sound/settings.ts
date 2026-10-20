export const SOUND_KEY = "c2080.sound";

export function loadSoundOn(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "false";
  } catch {
    return true;
  }
}

export function saveSoundOn(on: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, String(on));
  } catch {
    return;
  }
}
