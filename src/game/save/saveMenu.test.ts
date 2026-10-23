import controls from "@config/controls.json";
import { beforeEach, describe, expect, it } from "vitest";
import type { SoundCue } from "../../engine/audio/mixer";
import { Input } from "../../engine/input";
import { useSandbox } from "../../sandbox/store";
import { createHero, kill, type Hero } from "../hero/hero";
import { cfg } from "../hero/testWorld";
import { loadMesto } from "../level/mesto";
import { pickUp, type SandboxWorld } from "../level/sandboxLevel";
import { createSaveMenu, gameOverDue, latestLoadable, PROBLEMS, SAVE_FAILED, type SaveMenuDeps } from "./saveMenu";
import { slotName, writeSlot, type SlotEntry } from "./slots";
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
  played: SoundCue[];
  press(code: string, key?: string, extra?: Partial<KeyboardEvent>): { prevented: boolean };
  menu: ReturnType<typeof createSaveMenu>;
}

function rig(storage: Storage = memory(), startSlot: number | null = null): Rig {
  const world = loadMesto();
  const hero = createHero(world.spawn, "gun", cfg.energy.max, 0, cfg.ammo);
  const input = new Input(controls.keyboard, () => 0, 150);
  let handler: (e: KeyboardEvent) => void = () => {};
  const left: string[] = [];
  const played: SoundCue[] = [];
  const deps: SaveMenuDeps = {
    mission: "mesto",
    storage,
    startSlot,
    world,
    hero,
    input,
    keys: controls.keyboard,
    picture: () => "data:image/jpeg;base64,AA",
    movement: () => cfg,
    moved: () => {},
    leave: (href) => void left.push(href),
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
  return { world, hero, input, storage, left, played, press, menu };
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

beforeEach(() => useSandbox.setState({ menu: null, slots: [] }));

describe("gameOverDue", () => {
  it("fires on the tick the respawn would happen, only while dead and not released", () => {
    const hero = createHero([1, 1], "gun", 1);
    expect(gameOverDue(hero, DT, 2000, false)).toBe(false);
    kill(hero);
    hero.time = 1.9;
    expect(gameOverDue(hero, DT, 2000, false)).toBe(false);
    hero.time = 1.99;
    expect(gameOverDue(hero, DT, 2000, false)).toBe(true);
    expect(gameOverDue(hero, DT, 2000, true)).toBe(false);
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

  it("offers restart and exit without a save, then lets the hero respawn", () => {
    const r = rig();
    die(r);
    expect(r.menu.step(DT)).toBe(true);
    expect(useSandbox.getState().menu).toMatchObject({ screen: "gameOver", canLoad: false, cursor: 1, at: { x: 40, y: 50 } });
    r.press("Enter");
    expect(useSandbox.getState().menu).toBeNull();
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
    expect(r.press("ArrowLeft").prevented).toBe(false);
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
    r.press("ArrowDown");
    r.press("ArrowDown");
    r.press("Enter");
    expect(r.left).toEqual([]);
    r.press("Enter");
    expect(r.left).toEqual(["game.html?mission=mesto"]);
  });

  it("asks before leaving for mission select", () => {
    const r = rig();
    r.input.keyDown("Escape");
    r.menu.step(DT);
    r.press("ArrowDown");
    r.press("ArrowDown");
    r.press("ArrowDown");
    r.press("Enter");
    expect(r.left).toEqual([]);
    r.press("Enter");
    expect(r.left).toEqual(["index.html"]);
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
