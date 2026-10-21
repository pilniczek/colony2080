import "@fontsource/orbitron/900.css";
import "@fontsource/share-tech-mono/400.css";
import controls from "@config/controls.json";
import cameraJson from "@config/camera.json";
import { createElement, Fragment, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createMixer, type SoundCue } from "../engine/audio/mixer";
import { Input } from "../engine/input";
import { FIXED_STEP, FixedLoop } from "../engine/loop";
import { followView, resizeCanvas, type ViewTransform } from "../engine/render/view";
import { useSandbox } from "../sandbox/store";
import { CheatInput } from "../sandbox/ui/CheatInput";
import { whenIdle } from "../engine/idle";
import { filmOf, loadFilms, type Cutscene, type CutsceneId } from "./cutscene";
import { lookAt } from "./cutscene/looks";
import { drawRobotView } from "./cutscene/robotView";
import { playFilm, stepCutscene } from "./cutscene/play";
import { drawSecurityCam } from "./cutscene/securityCam";
import { cheatOf, isCheatKey } from "./cheats";
import { createFog, loadFog, sightSpan } from "./fog";
import { createSaveMenu, type SaveMenuOptions } from "./save/saveMenu";
import type { Rect } from "./geometry";
import type { Weapon } from "./hero/config";
import { createHero, halt, type Hero } from "./hero/hero";
import { createRigs, heroLook } from "./hero/look";
import { canOpenScreen, closesMap, inventoryKey, openCursor, repeatsOnScreen, screenKey } from "./hud/inventoryKeys";
import { newestFirst } from "./hud/inventory";
import { hudFit, viewRect } from "./hud/layout";
import type { ItemId } from "./items";
import { resetWorld, showItem, startFilm, type SandboxWorld } from "./level/sandboxLevel";
import { openBlockers, pickAll, say } from "./level/tasks";
import { drawFog, seenPath } from "./render/fog";
import { drawMap } from "./render/map";
import { drawOverlays } from "./render/overlays";
import { drawScene, viewCells, visibleEnemies } from "./render/scene";
import { momentOf, tween, type Moment } from "./render/tween";
import { snapView } from "./render/snapView";
import { SOUNDS, samplesOf } from "./sound";
import { saveSoundOn } from "./sound/settings";
import { openInventory } from "./sound/ui";
import { stopOnPause, stopOnSkip, stopWhenHidden, warmOnUnlock } from "./sound/voices";
import { holdPoses } from "./robot/gun";
import { stepWorld } from "./stepWorld";

const MAX_STEPS = 5;
const ENEMY_MARGIN_CELLS = 2;
const LOG_SIZE = 8;
const FPS_SMOOTHING = 0.1;
const MAX_PANEL_SHARE = 0.5;
const MAP_HINT = "You have no map.";
const PICTURE_W = 96;
const PICTURE_QUALITY = 0.6;
const HEAD_GAP = 0.25;
const CACHE_PASSES = 2;
const FILM_PRELOAD_MS = 1000;
const SOUND_LOG_SIZE = 50;

export interface RunStart {
  weapon: Weapon;
  running: boolean;
  blaster: number | null;
  fogOn: boolean;
}

export interface Run {
  world: SandboxWorld;
  hero: Hero;
  input: Input;
  loop: FixedLoop;
  restart(start: RunStart): void;
  applyFog(on: boolean): void;
  soundLog(): SoundCue[];
}

export interface RunOptions {
  world: SandboxWorld;
  ui: ReactNode;
  mapItem?: ItemId;
  afterStep?: () => void;
  drawOver?: (ctx: CanvasRenderingContext2D, view: ViewTransform, cellPx: number) => void;
  saves?: SaveMenuOptions;
  intro?: CutsceneId;
}

const typingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

const modified = (e: KeyboardEvent): boolean => e.ctrlKey || e.metaKey || e.altKey;

const sameItems = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && a.every((id, i) => id === b[i]);


export function startRun({ world, ui: tree, mapItem, afterStep, drawOver, saves, intro }: RunOptions): Run {
  const canvas = document.getElementById("game");
  const ui = document.getElementById("ui");
  if (!(canvas instanceof HTMLCanvasElement) || !ui) throw new Error("missing #game or #ui");
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("no 2d context");

  const tuning = () => useSandbox.getState();
  const mapOn = (): boolean => !mapItem || world.inventory.items.includes(mapItem);
  const fogConfig = loadFog(cameraJson);
  const cameraConfig = cameraJson as { view: { widthCells: number; heightCells: number } };
  const hero = createHero(world.spawn, "gun", tuning().movement.energy.max, tuning().movement.energy.shields, tuning().movement.ammo, true);
  const applyFog = (on: boolean): void => {
    world.fog = on ? createFog(fogConfig, tuning().movement, hero, world.grid) : null;
  };
  applyFog(tuning().fogOn);
  const rigs = createRigs(true);
  const enemyRigs = createRigs(true, true);
  const hold = holdPoses(rigs.side, rigs.front);
  const input = new Input(controls.keyboard, () => performance.now(), tuning().movement.inputBufferMs);
  input.attach(window);

  const mixer = createMixer(samplesOf);
  mixer.setMuted(!tuning().soundOn);
  const unlockAudio = warmOnUnlock(mixer, Object.keys(SOUNDS), whenIdle);
  window.addEventListener("keydown", unlockAudio, { capture: true });
  window.addEventListener("pointerdown", unlockAudio, { capture: true });

  const soundKey = (e: KeyboardEvent): void => {
    const menu = tuning().menu;
    const nameTyping = menu !== null && (menu.screen === "save" || menu.screen === "load") && menu.typing !== null;
    if (e.repeat || modified(e) || typingTarget(e.target) || nameTyping || !controls.keyboard.soundToggle.includes(e.code)) return;
    const soundOn = !tuning().soundOn;
    useSandbox.setState({ soundOn });
    saveSoundOn(soundOn);
    mixer.setMuted(!soundOn);
  };
  window.addEventListener("keydown", soundKey, { capture: true });

  let soundLog: SoundCue[] = [];
  const play = (sound: SoundCue): void => {
    soundLog = [...soundLog, sound].slice(-SOUND_LOG_SIZE);
    mixer.play(sound);
  };

  const drainSounds = (): void => {
    for (const sound of world.sounds.splice(0)) play(sound);
  };

  let prev = momentOf(hero);
  const prevEnemies = new WeakMap<Hero, Moment>();
  let gameWindow: Rect = { x: 0, y: 0, w: 1, h: 1 };
  let filmWidth = 1;
  let lastView: ViewTransform | null = null;
  let inputLog: string[] = [];
  let lastHeld = "";
  let lastRender = 0;
  let fps = 0;
  let cheatPressed = false;
  let filmsOff = false;

  const freeWidth = (dpr: number): number => {
    const panel = ui.querySelector("[data-panel]");
    const reserved = panel ? panel.getBoundingClientRect().width * dpr : 0;
    return reserved < canvas.width * MAX_PANEL_SHARE ? canvas.width - reserved : canvas.width;
  };

  const fit = (): void => {
    const dpr = devicePixelRatio || 1;
    resizeCanvas(canvas, dpr);
    filmWidth = freeWidth(dpr);
    const hud = hudFit(filmWidth / dpr, canvas.height / dpr);
    const r = viewRect(hud);
    gameWindow = { x: r.x * dpr, y: r.y * dpr, w: r.w * dpr, h: r.h * dpr };
    useSandbox.setState({ hud });
  };

  const cameraView = (shown: { x: number; y: number }, cfg: { cellPx: number; box: { height: number } }): ViewTransform => {
    const { cellPx } = cfg;
    const v = followView(
      gameWindow.w,
      gameWindow.h,
      world.grid.width * cellPx,
      world.grid.height * cellPx,
      cameraConfig.view.widthCells * cellPx,
      cameraConfig.view.heightCells * cellPx,
      shown.x * cellPx,
      (shown.y - cfg.box.height / 2) * cellPx,
    );
    return snapView({ ...v, offsetX: v.offsetX + gameWindow.x, offsetY: v.offsetY + gameWindow.y });
  };

  const watchPixelRatio = (): void => {
    matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener(
      "change",
      () => {
        fit();
        watchPixelRatio();
      },
      { once: true },
    );
  };

  const logInput = (held: Set<string>): void => {
    const now = [...held].sort().join("+");
    if (now === lastHeld) return;
    lastHeld = now;
    inputLog = [...inputLog, now || "-"].slice(-LOG_SIZE);
  };

  const push = (): void => {
    const now = performance.now();
    if (lastRender) fps += (1000 / Math.max(1, now - lastRender) - fps) * FPS_SMOOTHING;
    lastRender = now;
    useSandbox.setState({
      item: world.inventory.shown,
      items: sameItems(tuning().items, world.inventory.items) ? tuning().items : [...world.inventory.items],
      subtitle: world.subtitle?.text ?? null,
      complete: world.complete,
      cutscene: world.cutscene !== null,
      state: hero.state,
      time: hero.time,
      vx: hero.vx,
      vy: hero.vy,
      energy: hero.energy,
      shields: hero.shields,
      ammo: hero.ammo,
      blaster: hero.blaster,
      weapon: hero.weapon,
      running: hero.running,
      mapOn: mapOn(),
      fps: Math.round(fps),
      inputLog,
    });
  };

  const drawFilm = (id: CutsceneId, t: number): void => {
    const film = filmOf(id);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!film) {
      push();
      return;
    }
    film.render(ctx, filmWidth, canvas.height, t);
    if (lookAt(id, t) === "robot") drawRobotView(ctx, filmWidth, canvas.height, t);
    else drawSecurityCam(ctx, filmWidth, canvas.height, t, film.camera);
    push();
  };

  const warmFilms = (films: Cutscene[]): void => {
    const scratch = document.createElement("canvas");
    scratch.width = Math.max(1, Math.round(filmWidth));
    scratch.height = canvas.height;
    const warm = scratch.getContext("2d");
    if (!warm) return;
    const next = (i: number): void => {
      const film = films[i];
      if (!film) return;
      if (world.cutscene) return whenIdle(() => next(i));
      for (let pass = 0; pass < CACHE_PASSES; pass++) film.render(warm, scratch.width, scratch.height, 0);
      whenIdle(() => next(i + 1));
    };
    for (let pass = 0; pass < CACHE_PASSES; pass++) {
      drawSecurityCam(warm, scratch.width, scratch.height, 0, "");
      drawRobotView(warm, scratch.width, scratch.height, 0);
    }
    whenIdle(() => next(0));
  };

  const picture = (): string => {
    const shot = document.createElement("canvas");
    shot.width = PICTURE_W;
    shot.height = Math.max(1, Math.round((PICTURE_W * gameWindow.h) / gameWindow.w));
    shot.getContext("2d")?.drawImage(canvas, gameWindow.x, gameWindow.y, gameWindow.w, gameWindow.h, 0, 0, shot.width, shot.height);
    return shot.toDataURL("image/jpeg", PICTURE_QUALITY);
  };

  const saveMenu =
    saves &&
    createSaveMenu({
      ...saves,
      world,
      hero,
      input,
      keys: controls.keyboard,
      picture,
      movement: () => tuning().movement,
      moved: () => {
        prev = momentOf(hero);
      },
      leave: (href) => location.assign(href),
      playUi: play,
      bodyAt: () => {
        if (!lastView) return null;
        const { cellPx } = tuning().movement;
        const { unit } = tuning().hud;
        const dpr = devicePixelRatio || 1;
        return {
          x: (lastView.offsetX + hero.x * cellPx * lastView.scale) / dpr / unit,
          y: (lastView.offsetY + (hero.y - tuning().movement.box.height - HEAD_GAP) * cellPx * lastView.scale) / dpr / unit,
        };
      },
    });

  const loop = new FixedLoop({
    step: FIXED_STEP,
    maxSteps: MAX_STEPS,
    update(dt) {
      const { movement: cfg, clips } = tuning();
      prev = momentOf(hero);
      for (const { body } of world.enemies) prevEnemies.set(body, momentOf(body));
      input.bufferMs = cfg.inputBufferMs;
      if (world.cutscene) {
        logInput(input.frame().held);
        stopOnSkip(mixer, playFilm(world, input, dt));
        drainSounds();
        afterStep?.();
        return;
      }
      if (tuning().inventory.open || tuning().mapOpen || tuning().cheatOpen) return;
      const frame = input.frame();
      const cheat = cheatPressed;
      cheatPressed = false;
      if (saveMenu?.step(dt)) return;
      const canOpen = canOpenScreen(hero.state, tuning().recording || tuning().playing);
      if (cheat && canOpen) {
        useSandbox.setState({ cheatOpen: true });
        return;
      }
      if (input.consume("inventory") && canOpen) {
        openInventory({ stopAll: (bus) => mixer.stopAll(bus), play });
        useSandbox.setState({ inventory: { open: true, cursor: openCursor(world.inventory.items, world.inventory.shown) } });
        return;
      }
      if (input.consume("map") && canOpen) {
        if (mapOn()) {
          useSandbox.setState({ mapOpen: true });
          return;
        }
        say(world, MAP_HINT);
      }
      logInput(frame.held);
      stepWorld(world, hero, frame, cfg, clips, dt, (action) => input.consume(action));
      if (filmsOff && world.cutscene) {
        stepCutscene(world, 0, true);
        input.clearPresses();
      }
      drainSounds();
      afterStep?.();
    },
    render(alpha) {
      if (world.cutscene) {
        drawFilm(world.cutscene.id, world.cutscene.t);
        return;
      }
      const { movement: cfg, clips, overlays } = tuning();
      const shown = tween(prev, hero, alpha);
      const look = heroLook(shown, clips, rigs, hold, cfg);
      const view = cameraView(shown, cfg);
      lastView = view;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.beginPath();
      ctx.rect(gameWindow.x, gameWindow.y, gameWindow.w, gameWindow.h);
      ctx.clip();
      const sight = world.fog && seenPath(world.fog, cfg.cellPx);
      drawScene(ctx, world, shown, look, rigs, cfg, view, alpha, visibleEnemies(world.enemies, viewCells(view, gameWindow, cfg.cellPx), ENEMY_MARGIN_CELLS).map((enemy) => {
        const body = tween(prevEnemies.get(enemy.body) ?? momentOf(enemy.body), enemy.body, alpha);
        return { enemy: { ...enemy, body }, look: heroLook(body, clips, enemyRigs, hold, cfg) };
      }), enemyRigs, sight, devicePixelRatio || 1, gameWindow, () => {
        if (world.fog) drawFog(ctx, world.fog, view, cfg.cellPx, gameWindow, sightSpan(world.fog, cfg.sightCells, shown.x));
      });
      drawOverlays(ctx, world, shown, look, rigs, cfg, view, overlays, [gameWindow.x, gameWindow.y]);
      drawOver?.(ctx, view, cfg.cellPx);
      if (tuning().mapOpen) drawMap(ctx, world, shown, cfg.box.height, gameWindow, tuning().debugPanel);
      ctx.restore();
      push();
    },
  });

  const restart = ({ weapon, running, blaster, fogOn }: RunStart): void => {
    resetWorld(world, tuning().movement);
    Object.assign(hero, createHero(world.spawn, weapon, tuning().movement.energy.max, tuning().movement.energy.shields, tuning().movement.ammo, running, blaster));
    applyFog(fogOn);
    prev = momentOf(hero);
    useSandbox.setState({ inventory: { open: false, cursor: 0 }, mapOpen: false });
  };

  const applyTime = ({ paused, timeScale }: { paused: boolean; timeScale: number }): void => {
    const wasPaused = loop.paused;
    loop.paused = paused || tuning().inventory.open || tuning().mapOpen || tuning().cheatOpen || tuning().menu !== null;
    loop.timeScale = timeScale;
    stopOnPause(mixer, wasPaused, loop.paused);
  };

  document.addEventListener("visibilitychange", () => {
    stopWhenHidden(mixer, document.hidden);
  });

  applyTime(tuning());
  useSandbox.subscribe((s, before) => {
    applyTime(s);
    if (s.movement.cellPx !== before.movement.cellPx) fit();
  });

  const inventoryKeys = (e: KeyboardEvent): void => {
    const { inventory } = tuning();
    if (!inventory.open || modified(e) || typingTarget(e.target) || !screenKey(e.code, controls.keyboard)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.repeat && !repeatsOnScreen(e.code, controls.keyboard)) return;
    const items = newestFirst(world.inventory.items);
    const { cursor, pick, close } = inventoryKey(e.code, inventory.cursor, items.length, controls.keyboard);
    if (pick) showItem(world, items[cursor]!);
    if (close) input.clearPresses();
    useSandbox.setState({ inventory: { open: !close, cursor }, item: world.inventory.shown });
  };
  window.addEventListener("keydown", inventoryKeys, { capture: true });

  const mapKeys = (e: KeyboardEvent): void => {
    if (!tuning().mapOpen) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.repeat || !closesMap(e.code, controls.keyboard)) return;
    input.clearPresses();
    useSandbox.setState({ mapOpen: false });
  };
  window.addEventListener("keydown", mapKeys, { capture: true });

  const cheatKeys = (e: KeyboardEvent): void => {
    if (!isCheatKey(e) || typingTarget(e.target)) return;
    e.preventDefault();
    cheatPressed = !loop.paused && !world.cutscene;
  };
  window.addEventListener("keydown", cheatKeys);

  const closeCheat = (): void => {
    input.clearPresses();
    useSandbox.setState({ cheatOpen: false });
  };

  const enterCheat = (code: string): void => {
    closeCheat();
    const cheat = cheatOf(code);
    if (cheat === "immortal") {
      world.immortal = !world.immortal;
      say(world, world.immortal ? "Immortality on" : "Immortality off");
    }
    if (cheat === "noFog") {
      const fogOn = world.fog === null;
      setFog(fogOn);
      say(world, fogOn ? "Fog of war on" : "Fog of war off");
    }
    if (cheat === "weapon") say(world, giveWeapon());
    if (cheat === "items") say(world, giveItems());
    if (cheat === "open") say(world, openAll());
    if (cheat === "debug") debug();
    if (typeof cheat === "object" && cheat !== null) moveTo(...cheat.moveTo);
  };

  const setFog = (fogOn: boolean): void => {
    applyFog(fogOn);
    useSandbox.setState({ fogOn });
  };

  const giveWeapon = (): string => {
    const props = world.props.filter((p) => p.kind === "weapon");
    if (!props.length) return "No special weapon in this mission";
    for (const p of props) p.taken = true;
    hero.blaster = tuning().movement.blaster.ammo;
    return "Picked up E-Blaster";
  };

  const giveItems = (): string => {
    const count = pickAll(world);
    return count ? `Picked up ${count} items` : "Every item already held";
  };

  const openAll = (): string => {
    const count = openBlockers(world);
    return count ? `Opened ${count} blockers` : "Nothing left to open";
  };

  const debug = (): void => {
    filmsOff = true;
    world.immortal = true;
    useSandbox.setState({ debugPanel: true });
    if (world.fog !== null) setFog(false);
    say(world, `Debugging: immortal, no fog, no films, debug panel. ${giveWeapon()}. ${giveItems()}`);
  };

  const moveTo = (x: number, y: number): void => {
    if (x < 0 || x > world.grid.width || y <= 0 || y > world.grid.height) return say(world, "Off the map");
    Object.assign(hero, { x, y, vx: 0, vy: 0, fallFrom: y, onGround: false, onLift: false });
    halt(hero);
    prev = momentOf(hero);
    say(world, `Moved to ${x}, ${y}`);
  };

  if (import.meta.env.VITE_START_CHEAT) enterCheat(import.meta.env.VITE_START_CHEAT);
  if (!filmsOff) startFilm(world, intro);
  setTimeout(() => void loadFilms().then(warmFilms), FILM_PRELOAD_MS);
  fit();
  window.addEventListener("resize", fit);
  new MutationObserver(fit).observe(ui, { childList: true });
  watchPixelRatio();
  loop.start();

  createRoot(ui).render(createElement(Fragment, null, tree, createElement(CheatInput, { onCode: enterCheat, onClose: closeCheat })));
  return { world, hero, input, loop, restart, applyFog, soundLog: () => soundLog };
}
