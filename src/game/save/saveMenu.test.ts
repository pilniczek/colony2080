import controls from "@config/controls.json";
import { beforeEach, describe, expect, it } from "vitest";
import type { SoundCue } from "../../engine/audio/mixer";
import { Input } from "../../engine/input";
import { useSandbox } from "../../sandbox/store";
import { createHero, kill, type Hero } from "../hero/hero";
import { cfg } from "../hero/testWorld";
import { loadMesto } from "../level/mesto";
import { pickUp, type SandboxWorld } from "../level/sandboxLevel";
import { AUTOSAVED, createSaveMenu, gameOverDue, latestLoadable, PROBLEMS, SAVE_FAILED, type SaveMenuDeps } from "./saveMenu";
import { AUTO_SLOT, readSlots, slotName, writeSlot, type SlotEntry } from "./slots";
import { takeSnapshot } from "./snapshot";
import { MENU_CUE } from "../sound/ui";

const DT = 1 / 60;

const memory = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
};

interface Rig {
  world: SandboxWorld;
  hero: Hero;
  input: Input;
  storage: Storage;
  left: string[];
  restarts: number;
  begins: number;
  played: SoundCue[];
  press(code: string, key?: string, extra?: Partial<KeyboardEvent>): { prevented: boolean };
  menu: ReturnType<typeof createSaveMenu>;
}

function rig(storage: Storage = memory(), startSlot: number | null = null, askDifficulty = false): Rig {
  const world = loadMesto();
  const hero = createHero(world.spawn, "gun", cfg.energy.max, 0, cfg.ammo);
  const input = new Input(controls.keyboard, () => 0, 150);
  let handler: (e: KeyboardEvent) => void = () => {};
  const left: string[] = [];
  const played: SoundCue[] = [];
  const r = { restarts: 0, begins: 0 };
  const deps: SaveMenuDeps = {
    mission: "mesto",
    storage,
    startSlot,
    askDifficulty,
    world,
    hero,
    input,
    keys: controls.keyboard,
    picture: () => "data:image/jpeg;base64,AA",
    movement: () => cfg,
    moved: () => {},
    leave: (href) => void left.push(href),
    restart: () => {
      r.restarts++;
      Object.assign(hero, createHero(world.spawn, "gun", cfg.energy.max, 0, cfg.ammo));
    },
    begin: () => void r.begins++,
    bodyAt: () => ({ x: 40, y: 50 }),
    playUi: (cue) => void played.push(cue),
    target: { addEventListener: ((_: string, h: (e: KeyboardEvent) => void) => (handler = h)) as Window["addEventListener"] },
  };
  const menu = createSaveMenu(deps);
  const press = (code: string, key = code, extra: Partial<KeyboardEvent> = {}) => {
    let prevented = false;
    handler({ code, key, repeat: false, ctrlKey: false, metaKey: false, altKey: false, preventDefault: () => (prevented = true), stopImmediatePropagation: () => {}, ...extra } as KeyboardEvent);
    return { prevented };
  };
  return Object.assign(r, { world, hero, input, storage, left, played, press, menu });
}

const saveOf = (r: Rig, savedAt: number, change: (h: Hero) => void = () => {}): SlotEntry => {
  const hero = { ...r.hero };
  change(hero);
  return { mission: "mesto", name: slotName("mesto", ""), savedAt, picture: "data:image/jpeg;base64,AA", snapshot: takeSnapshot(r.world, hero) };
};

const die = (r: Rig): void => {
  kill(r.hero);
  r.hero.time = cfg.respawnMs / 1000;
};

beforeEach(() => useSandbox.setState({ menu: null, slots: [], lang: "en" }));

describe("gameOverDue", () => {
  it("fires on the tick the respawn would happen, only while dead", () => {
    const hero = createHero([1, 1], "gun", 1);
    expect(gameOverDue(hero, DT, 2000)).toBe(false);
    kill(hero);
    hero.time = 1.9;
    expect(gameOverDue(hero, DT, 2000)).toBe(false);
    hero.time = 1.99;
    expect(gameOverDue(hero, DT, 2000)).toBe(true);
  });
});

describe("latestLoadable", () => {
  it("takes the newest save of the mission that loads", () => {
    const r = rig();
    const good = saveOf(r, 1);
    const misfit = { ...saveOf(r, 3), snapshot: { ...good.snapshot, version: 99 } };
    const damaged = { ...saveOf(r, 2), snapshot: { ...good.snapshot, hero: null } } as unknown as SlotEntry;
    const other = { ...saveOf(r, 9), mission: "other" };
    expect(latestLoadable([good, misfit, damaged, other, null], "mesto", r.world)).toBe(good);
    expect(latestLoadable([misfit, null], "mesto", r.world)).toBeNull();
  });
});

describe("save menu", () => {
  it("opens the pause menu on Esc only while the hero lives", () => {
    const r = rig();
    r.input.keyDown("Escape");
    expect(r.menu.step(DT)).toBe(true);
    expect(useSandbox.getState().menu).toEqual({ screen: "pause", cursor: 0 });
    useSandbox.setState({ menu: null });
    kill(r.hero);
    r.input.keyDown("Escape");
    expect(r.menu.step(DT)).toBe(false);
    expect(useSandbox.getState().menu).toBeNull();
  });

  it("offers restart and exit without a save, then restarts the mission", () => {
    const r = rig();
    die(r);
    expect(r.menu.step(DT)).toBe(true);
    expect(useSandbox.getState().menu).toMatchObject({ screen: "gameOver", canLoad: false, cursor: 1, at: { x: 40, y: 50 } });
    r.press("Enter");
    expect(useSandbox.getState().menu).toBeNull();
    expect(r.restarts).toBe(1);
    expect(r.menu.step(DT)).toBe(false);
  });

  it("loads the last good save after game over", () => {
    const r = rig();
    writeSlot(r.storage, 2, saveOf(r, 5, (h) => Object.assign(h, { x: 30, ammo: 7 })));
    die(r);
    r.menu.step(DT);
    expect(useSandbox.getState().menu).toMatchObject({ screen: "gameOver", canLoad: true, cursor: 0 });
    r.press("Enter");
    expect(useSandbox.getState().menu).toBeNull();
    expect(r.hero).toMatchObject({ x: 30, ammo: 7, state: "idle" });
  });

  it("refuses a misfit save from the load list and keeps the world", () => {
    const r = rig();
    const entry = saveOf(r, 5, (h) => (h.x = 30));
    writeSlot(r.storage, 0, { ...entry, snapshot: { ...entry.snapshot, counts: { ...entry.snapshot.counts, props: 1 } } });
    r.input.keyDown("Escape");
    r.menu.step(DT);
    r.press("ArrowDown");
    r.press("Enter");
    r.press("Enter");
    expect(useSandbox.getState().menu).toMatchObject({ screen: "load", message: PROBLEMS.misfit });
    expect(r.hero.x).toBe(r.world.spawn[0]);
  });

  it("says the save failed when storage refuses it", () => {
    const full = { ...memory(), setItem: () => { throw new Error("full"); } } as Storage;
    const r = rig(full);
    r.input.keyDown("Escape");
    r.menu.step(DT);
    r.press("Enter");
    r.press("Enter");
    r.press("Enter");
    expect(useSandbox.getState().menu).toMatchObject({ screen: "save", message: SAVE_FAILED });
  });

  it("types a name without moving the hero and lets Ctrl through", () => {
    const r = rig();
    pickUp(r.world, "crowbar");
    r.input.keyDown("Escape");
    r.menu.step(DT);
    r.press("Enter");
    r.press("Enter");
    expect(r.press("KeyX", "x").prevented).toBe(true);
    expect(r.press("F5").prevented).toBe(false);
    expect(r.press("KeyC", "c", { ctrlKey: true }).prevented).toBe(false);
    expect(useSandbox.getState().menu).toMatchObject({ typing: "x" });
  });

  it("clicks on pause menu and game over moves and confirms, not on Esc or typing", () => {
    const r = rig();
    r.input.keyDown("Escape");
    r.menu.step(DT);
    r.press("ArrowDown");
    r.press("ArrowUp");
    r.press("Enter");
    expect(r.played).toEqual([MENU_CUE, MENU_CUE, MENU_CUE]);
    expect(MENU_CUE).toEqual({ id: "click", rate: 5500, vol: 33, bus: "ui" });
    r.press("Enter");
    r.press("KeyX", "x");
    r.press("Escape");
    expect(r.played).toHaveLength(4);
    const over = rig();
    die(over);
    over.menu.step(DT);
    over.press("ArrowUp");
    over.press("Enter");
    expect(over.played).toEqual([MENU_CUE, MENU_CUE]);
  });

  it("asks before restarting the mission", () => {
    const r = rig();
    r.input.keyDown("Escape");
    r.menu.step(DT);
    for (let i = 0; i < 2; i++) r.press("ArrowDown");
    r.press("Enter");
    expect(r.restarts).toBe(0);
    r.press("Enter");
    expect(r.restarts).toBe(1);
    expect(useSandbox.getState().menu).toBeNull();
    expect(r.left).toEqual([]);
  });

  it("loads the slot the page opened with", () => {
    const storage = memory();
    writeSlot(storage, 3, saveOf(rig(storage), 5, (h) => Object.assign(h, { x: 30, ammo: 7 })));
    const r = rig(storage, 3);
    expect(useSandbox.getState().menu).toBeNull();
    expect(r.hero).toMatchObject({ x: 30, ammo: 7 });
  });

  it("opens the load list with the reason when the opened slot cannot load", () => {
    const storage = memory();
    const entry = saveOf(rig(storage), 5, (h) => (h.x = 30));
    writeSlot(storage, 1, { ...entry, snapshot: { ...entry.snapshot, counts: { ...entry.snapshot.counts, props: 1 } } });
    const r = rig(storage, 1);
    expect(useSandbox.getState().menu).toMatchObject({ screen: "load", cursor: 1, message: PROBLEMS.misfit });
    expect(r.hero.x).toBe(r.world.spawn[0]);
  });

  it("starts a new game when the opened slot is empty", () => {
    const r = rig(memory(), 2);
    expect(useSandbox.getState().menu).toBeNull();
    expect(r.hero.x).toBe(r.world.spawn[0]);
  });
});

describe("settings", () => {
  it("asks on a new game and starts the intro only from START", () => {
    const r = rig(memory(), null, true);
    expect(useSandbox.getState().menu).toEqual({ screen: "settings", cursor: 2, autosave: true });
    r.press("ArrowUp");
    r.press("ArrowUp");
    r.press("ArrowRight");
    r.press("Enter");
    expect(r.begins).toBe(0);
    r.press("ArrowDown");
    r.press("ArrowDown");
    r.press("Enter");
    expect(useSandbox.getState().menu).toBeNull();
    expect(r.world.autosave).toBe(false);
    expect(r.begins).toBe(1);
    const auto = rig(memory(), null, true);
    auto.press("Enter");
    expect(auto.world.autosave).toBe(true);
  });

  it("switches and remembers the language", () => {
    const r = rig(memory(), null, true);
    r.press("ArrowUp");
    r.press("ArrowRight");
    expect(useSandbox.getState().lang).toBe("cs");
    expect(r.storage.getItem("c2080.lang")).toBe("cs");
    r.press("ArrowLeft");
    expect(useSandbox.getState().lang).toBe("en");
  });

  it("switches autosave from the pause menu", () => {
    const r = rig();
    r.input.keyDown("Escape");
    r.menu.step(DT);
    r.press("ArrowDown");
    r.press("ArrowDown");
    r.press("ArrowDown");
    r.press("ArrowLeft");
    expect(r.world.autosave).toBe(true);
    r.press("ArrowRight");
    expect(r.world.autosave).toBe(false);
  });

  it("goes back to mission select on Esc", () => {
    const r = rig(memory(), null, true);
    r.press("Escape");
    expect(r.left).toEqual(["index.html"]);
    expect(r.begins).toBe(0);
  });

  it("asks also when the opened slot is empty, never when it loads", () => {
    rig(memory(), 2, true);
    expect(useSandbox.getState().menu).toMatchObject({ screen: "settings" });
    const storage = memory();
    writeSlot(storage, 3, saveOf(rig(storage), 5));
    useSandbox.setState({ menu: null });
    rig(storage, 3, true);
    expect(useSandbox.getState().menu).toBeNull();
  });
});

describe("autosave", () => {
  const autoRig = (): Rig => {
    const r = rig(memory(), null, true);
    r.press("Enter");
    return r;
  };
  const auto = (r: Rig): SlotEntry | null | undefined => readSlots(r.storage, "mesto")[AUTO_SLOT];

  it("saves to the auto slot after a pickup and adds a second subtitle line", () => {
    const r = autoRig();
    expect(r.menu.step(DT)).toBe(false);
    r.menu.flush();
    expect(auto(r)).toBeNull();
    pickUp(r.world, "crowbar");
    r.world.subtitle = { text: "Picked up crowbar", age: 0 };
    r.menu.step(DT);
    r.menu.flush();
    expect(auto(r)).toMatchObject({ mission: "mesto", name: "City - Autosave" });
    expect(auto(r)!.snapshot.inventory.items).toContain("crowbar");
    expect(auto(r)!.snapshot.autosave).toBe(true);
    expect(r.world.subtitle).toEqual({ text: "Picked up crowbar", age: 0, note: AUTOSAVED });
    r.storage.clear();
    r.menu.flush();
    expect(auto(r)).toBeNull();
  });

  it("saves after a finished task, with only the note when nothing was said", () => {
    const r = autoRig();
    r.world.flags.add("task:openDoor");
    r.menu.step(DT);
    r.menu.flush();
    expect(auto(r)).not.toBeNull();
    expect(r.world.subtitle).toEqual({ text: "", age: 0, note: AUTOSAVED });
  });

  it("never saves without autosave, while dead, at the level end or after a tracked cheat", () => {
    const off = rig(memory(), null, true);
    off.press("ArrowUp");
    off.press("ArrowUp");
    off.press("ArrowRight");
    off.press("ArrowDown");
    off.press("ArrowDown");
    off.press("Enter");
    pickUp(off.world, "crowbar");
    off.menu.step(DT);
    off.menu.flush();
    expect(auto(off)).toBeNull();
    const dead = autoRig();
    pickUp(dead.world, "crowbar");
    kill(dead.hero);
    dead.menu.step(DT);
    dead.menu.flush();
    expect(auto(dead)).toBeNull();
    const done = autoRig();
    pickUp(done.world, "crowbar");
    done.world.complete = true;
    done.menu.step(DT);
    done.menu.flush();
    expect(auto(done)).toBeNull();
    const cheat = autoRig();
    pickUp(cheat.world, "crowbar");
    cheat.menu.track();
    cheat.menu.step(DT);
    cheat.menu.flush();
    expect(auto(cheat)).toBeNull();
  });

  it("does not save the state a load or restart brings", () => {
    const storage = memory();
    const first = rig(storage);
    pickUp(first.world, "crowbar");
    writeSlot(storage, 0, { ...saveOf(first, 5), snapshot: { ...takeSnapshot(first.world, first.hero), autosave: true } });
    const r = rig(storage, 0);
    expect(r.world.autosave).toBe(true);
    r.menu.step(DT);
    r.menu.flush();
    expect(auto(r)).toBeNull();
  });
});
