import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSoundOn, saveSoundOn, SOUND_KEY } from "./settings";

function storage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("sound settings", () => {
  it("loadSoundOn default true", () => {
    vi.stubGlobal("localStorage", storage());
    expect(loadSoundOn()).toBe(true);
  });

  it("loadSoundOn reads false", () => {
    vi.stubGlobal("localStorage", storage({ [SOUND_KEY]: "false" }));
    expect(loadSoundOn()).toBe(false);
  });

  it("loadSoundOn survives throwing storage", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
    });
    expect(loadSoundOn()).toBe(true);
  });

  it("saveSoundOn writes and ignores errors", () => {
    const store = storage();
    vi.stubGlobal("localStorage", store);
    saveSoundOn(false);
    expect(store.data.get(SOUND_KEY)).toBe("false");
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("full");
      },
    });
    expect(() => saveSoundOn(true)).not.toThrow();
  });
});
