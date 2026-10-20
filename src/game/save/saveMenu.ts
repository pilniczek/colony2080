import type { Bindings, Input } from "../../engine/input";
import { useSandbox } from "../../sandbox/store";
import type { Rect } from "../geometry";
import type { MovementConfig } from "../hero/config";
import { isDead, type Hero } from "../hero/hero";
import { menuKey, type MenuResult, type MenuState } from "../hud/menuKeys";
import type { SandboxWorld } from "../level/sandboxLevel";
import { latestFor, readSlots, slotName, writeSlot, type SlotEntry } from "./slots";
import { applySnapshot, fits, takeSnapshot } from "./snapshot";

const PICTURE_W = 96;
const PICTURE_QUALITY = 0.6;
const HOME = "index.html";
const MENU_ACTIONS = ["up", "down", "useItem", "menu"];
const SAVED = "Saved.";
const SAVE_FAILED = "Save failed.";
const MISFIT = "This save does not fit this version of the mission.";

export interface SaveMenuOptions {
  mission: string;
  storage: Storage | null;
}

interface SaveMenuDeps extends SaveMenuOptions {
  world: SandboxWorld;
  hero: Hero;
  input: Input;
  canvas: HTMLCanvasElement;
  keys: Bindings;
  gameWindow: () => Rect;
  movement: () => MovementConfig;
  moved: () => void;
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

function picture(canvas: HTMLCanvasElement, r: Rect): string {
  const shot = document.createElement("canvas");
  shot.width = PICTURE_W;
  shot.height = Math.max(1, Math.round((PICTURE_W * r.h) / r.w));
  shot.getContext("2d")?.drawImage(canvas, r.x, r.y, r.w, r.h, 0, 0, shot.width, shot.height);
  return shot.toDataURL("image/jpeg", PICTURE_QUALITY);
}

export function createSaveMenu(d: SaveMenuDeps): SaveMenu {
  let respawnAllowed = false;
  const menu = (): MenuState | null => useSandbox.getState().menu;
  const slots = () => useSandbox.getState().slots;
  const show = (state: MenuState | null): void => useSandbox.setState({ menu: state });
  const refresh = (): void => useSandbox.setState({ slots: readSlots(d.storage) });

  const close = (): void => {
    d.input.clearPresses();
    show(null);
  };

  const withMessage = (state: MenuState | null, message: string): MenuState | null =>
    state && (state.screen === "save" || state.screen === "load") ? { ...state, message } : state;

  const load = (entry: SlotEntry | null | undefined, state: MenuState | null): void => {
    if (!entry) return;
    if (!fits(d.world, entry.snapshot)) {
      show(withMessage(state, MISFIT));
      return;
    }
    applySnapshot(d.world, d.hero, entry.snapshot, d.movement());
    d.moved();
    close();
  };

  const save = (r: MenuResult): void => {
    const entry: SlotEntry = { mission: d.mission, name: slotName(d.mission, r.name ?? ""), savedAt: Date.now(), picture: picture(d.canvas, d.gameWindow()), snapshot: takeSnapshot(d.world, d.hero) };
    const ok = writeSlot(d.storage, r.slot!, entry);
    refresh();
    show(withMessage(r.state, ok ? SAVED : SAVE_FAILED));
  };

  const act = (r: MenuResult): void => {
    if (r.action === "save") return save(r);
    if (r.action === "load") return load(r.state?.screen === "gameOver" ? latestFor(slots(), d.mission) : slots()[r.slot!], r.state);
    if (r.action === "restart") {
      respawnAllowed = true;
      return close();
    }
    if (r.action === "end" || r.action === "home") {
      location.href = HOME;
      return;
    }
    if (r.state) show(r.state);
    else close();
  };

  const handled = (e: KeyboardEvent, state: MenuState): boolean => {
    const typing = (state.screen === "save" || state.screen === "load") && state.typing !== null;
    const bound = MENU_ACTIONS.some((action) => d.keys[action]?.includes(e.code));
    return bound || (typing && (e.key.length === 1 || e.code === "Backspace"));
  };

  const onKey = (e: KeyboardEvent): void => {
    const state = menu();
    if (!state || e.ctrlKey || e.metaKey || e.altKey || !handled(e, state)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.repeat && !["up", "down"].some((action) => d.keys[action]?.includes(e.code)) && e.code !== "Backspace") return;
    act(menuKey(state, { code: e.code, key: e.key }, slots(), d.mission, d.keys));
  };
  window.addEventListener("keydown", onKey, { capture: true });

  return {
    step(dt) {
      if (menu()) return true;
      const { hero } = d;
      if (!isDead(hero.state)) respawnAllowed = false;
      else if (!respawnAllowed && (hero.time + dt) * 1000 >= d.movement().respawnMs) {
        refresh();
        show({ screen: "gameOver", cursor: 0, canLoad: latestFor(slots(), d.mission) !== null });
        return true;
      }
      if (isDead(hero.state) || !d.input.consume("menu")) return false;
      refresh();
      show({ screen: "pause", cursor: 0 });
      return true;
    },
  };
}
