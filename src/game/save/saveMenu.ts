import type { SoundCue } from "../../engine/audio/mixer";
import type { Bindings, Input } from "../../engine/input";
import { useSandbox } from "../../sandbox/store";
import type { MovementConfig } from "../hero/config";
import { isDead, type Hero } from "../hero/hero";
import { gameOverState, menuKey, type MenuResult, type MenuState } from "../hud/menuKeys";
import type { SandboxWorld } from "../level/sandboxLevel";
import { MENU_CUE } from "../sound/ui";
import { readSlots, slotName, writeSlot, type SlotEntry, type Slots } from "./slots";
import { checkSnapshot, loadSnapshot, takeSnapshot, type SaveProblem } from "./snapshot";

const HOME = "index.html";
const MENU_ACTIONS = ["up", "down", "useItem", "menu"];
const REPEATING = ["up", "down"];
const CLICKING = ["up", "down", "useItem"];
export const SAVED = "Saved.";
export const SAVE_FAILED = "Save failed.";
export const PROBLEMS: Record<SaveProblem, string> = {
  misfit: "This save does not fit this version of the mission.",
  damaged: "This save is damaged and cannot be loaded.",
};

export interface SaveMenuOptions {
  mission: string;
  storage: Storage | null;
  startSlot?: number | null;
}

export interface SaveMenuDeps extends SaveMenuOptions {
  world: SandboxWorld;
  hero: Hero;
  input: Input;
  keys: Bindings;
  picture: () => string;
  movement: () => MovementConfig;
  moved: () => void;
  leave: (href: string) => void;
  restart: () => void;
  bodyAt: () => { x: number; y: number } | null;
  playUi: (cue: SoundCue) => void;
  target?: Pick<Window, "addEventListener">;
}

export interface SaveMenu {
  step(dt: number): boolean;
}

export const browserStorage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const latestLoadable = (slots: Slots, mission: string, world: SandboxWorld): SlotEntry | null =>
  slots.reduce<SlotEntry | null>(
    (best, slot) => (slot?.mission === mission && (!best || slot.savedAt > best.savedAt) && checkSnapshot(world, slot.snapshot) === null ? slot : best),
    null,
  );

export const gameOverDue = (hero: Hero, dt: number, respawnMs: number): boolean => isDead(hero.state) && (hero.time + dt) * 1000 >= respawnMs;

export function createSaveMenu(d: SaveMenuDeps): SaveMenu {
  const menu = (): MenuState | null => useSandbox.getState().menu;
  const slots = (): Slots => useSandbox.getState().slots;
  const show = (state: MenuState | null): void => useSandbox.setState({ menu: state });
  const refresh = (): void => useSandbox.setState({ slots: readSlots(d.storage) });
  const loadableNow = (): boolean => latestLoadable(slots(), d.mission, d.world) !== null;

  const close = (): void => {
    d.input.clearPresses();
    show(null);
  };

  const withMessage = (state: MenuState | null, message: string): MenuState | null => {
    if (!state || state.screen === "pause") return state;
    if (state.screen === "gameOver") return gameOverState(loadableNow(), message, state.at ?? null);
    return { ...state, message };
  };

  const load = (entry: SlotEntry | null | undefined, state: MenuState | null): void => {
    if (!entry) return;
    const problem = loadSnapshot(d.world, d.hero, entry.snapshot, d.movement());
    if (problem) {
      show(withMessage(state, PROBLEMS[problem]));
      return;
    }
    d.moved();
    close();
  };

  const save = (r: MenuResult): void => {
    const entry: SlotEntry = { mission: d.mission, name: slotName(d.mission, r.name ?? ""), savedAt: Date.now(), picture: d.picture(), snapshot: takeSnapshot(d.world, d.hero) };
    const ok = writeSlot(d.storage, r.slot!, entry);
    refresh();
    show(withMessage(r.state, ok ? SAVED : SAVE_FAILED));
  };

  const act = (r: MenuResult): void => {
    if (r.action === "save") return save(r);
    if (r.action === "load") return load(r.state?.screen === "gameOver" ? latestLoadable(slots(), d.mission, d.world) : slots()[r.slot!], r.state);
    if (r.action === "restart") {
      d.restart();
      return close();
    }
    if (r.action === "end" || r.action === "home") return d.leave(HOME);
    if (r.state) show(r.state);
    else close();
  };

  const bound = (code: string, actions: string[]): boolean => actions.some((action) => d.keys[action]?.includes(code));

  const handled = (e: KeyboardEvent, state: MenuState): boolean => {
    const typing = (state.screen === "save" || state.screen === "load") && state.typing !== null;
    return bound(e.code, MENU_ACTIONS) || (typing && (e.key.length === 1 || e.code === "Backspace"));
  };

  const onKey = (e: KeyboardEvent): void => {
    const state = menu();
    if (!state || e.ctrlKey || e.metaKey || e.altKey || !handled(e, state)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.repeat && !bound(e.code, REPEATING) && e.code !== "Backspace") return;
    if (bound(e.code, CLICKING)) d.playUi(MENU_CUE);
    act(menuKey(state, { code: e.code, key: e.key }, slots(), d.mission, d.keys));
  };
  (d.target ?? window).addEventListener("keydown", onKey as EventListener, { capture: true });

  if (d.startSlot != null) {
    refresh();
    const entry = slots()[d.startSlot];
    if (entry?.mission === d.mission) load(entry, { screen: "load", cursor: d.startSlot, typing: null, confirm: false, message: null });
  }

  return {
    step(dt) {
      if (menu()) return true;
      const { hero } = d;
      if (gameOverDue(hero, dt, d.movement().respawnMs)) {
        refresh();
        show(gameOverState(loadableNow(), null, d.bodyAt()));
        return true;
      }
      if (isDead(hero.state) || !d.input.consume("menu")) return false;
      refresh();
      show({ screen: "pause", cursor: 0 });
      return true;
    },
  };
}
