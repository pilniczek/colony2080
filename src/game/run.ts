import "@fontsource/orbitron/900.css";
import "@fontsource/share-tech-mono/400.css";
import controls from "@config/controls.json";
import cameraJson from "@config/camera.json";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Input } from "../engine/input";
import { FIXED_STEP, FixedLoop } from "../engine/loop";
import { followView, resizeCanvas, type ViewTransform } from "../engine/render/view";
import { useSandbox } from "../sandbox/store";
import { createFog, loadFog } from "./fog";
import type { Rect } from "./geometry";
import type { Weapon } from "./hero/config";
import { createHero, type Hero } from "./hero/hero";
import { createRigs, heroLook } from "./hero/look";
import { hudFit, viewRect } from "./hud/layout";
import { resetWorld, type SandboxWorld } from "./level/sandboxLevel";
import { drawFog, revealedPath } from "./render/fog";
import { drawOverlays } from "./render/overlays";
import { drawScene } from "./render/scene";
import { snapView } from "./render/snapView";
import { holdPoses } from "./robot/gun";
import { stepWorld } from "./stepWorld";

const MAX_STEPS = 5;
const SNAP_CELLS = 1;
const LOG_SIZE = 8;
const FPS_SMOOTHING = 0.1;
const MAX_PANEL_SHARE = 0.5;

export interface RunStart {
  weapon: Weapon;
  running: boolean;
  fogOn: boolean;
}

export interface Run {
  hero: Hero;
  input: Input;
  loop: FixedLoop;
  restart(start: RunStart): void;
  applyFog(on: boolean): void;
}

export interface RunOptions {
  world: SandboxWorld;
  ui: ReactNode;
  afterStep?: () => void;
  drawOver?: (ctx: CanvasRenderingContext2D, view: ViewTransform, cellPx: number) => void;
}

const lerp = (a: number, b: number, k: number): number => (Math.abs(b - a) > SNAP_CELLS ? b : a + (b - a) * k);

export function startRun({ world, ui: tree, afterStep, drawOver }: RunOptions): Run {
  const canvas = document.getElementById("game");
  const ui = document.getElementById("ui");
  if (!(canvas instanceof HTMLCanvasElement) || !ui) throw new Error("missing #game or #ui");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");

  const tuning = () => useSandbox.getState();
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

  let prev = { x: hero.x, y: hero.y };
  let gameWindow: Rect = { x: 0, y: 0, w: 1, h: 1 };
  let inputLog: string[] = [];
  let lastHeld = "";
  let lastRender = 0;
  let fps = 0;

  const freeWidth = (dpr: number): number => {
    const panel = ui.querySelector("[data-panel]");
    const reserved = panel ? panel.getBoundingClientRect().width * dpr : 0;
    return reserved < canvas.width * MAX_PANEL_SHARE ? canvas.width - reserved : canvas.width;
  };

  const fit = (): void => {
    const dpr = devicePixelRatio || 1;
    resizeCanvas(canvas, dpr);
    const hud = hudFit(freeWidth(dpr) / dpr, canvas.height / dpr);
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
      subtitle: world.subtitle?.text ?? null,
      complete: world.complete,
      state: hero.state,
      time: hero.time,
      vx: hero.vx,
      vy: hero.vy,
      energy: hero.energy,
      shields: hero.shields,
      ammo: hero.ammo,
      weapon: hero.weapon,
      running: hero.running,
      fps: Math.round(fps),
      inputLog,
    });
  };

  const loop = new FixedLoop({
    step: FIXED_STEP,
    maxSteps: MAX_STEPS,
    update(dt) {
      const { movement: cfg, clips } = tuning();
      prev = { x: hero.x, y: hero.y };
      input.bufferMs = cfg.inputBufferMs;
      const frame = input.frame();
      logInput(frame.held);
      stepWorld(world, hero, frame, cfg, clips, dt, (action) => input.consume(action));
      afterStep?.();
    },
    render(alpha) {
      const { movement: cfg, clips, overlays } = tuning();
      const shown = { ...hero, x: lerp(prev.x, hero.x, alpha), y: lerp(prev.y, hero.y, alpha) };
      const look = heroLook(hero, clips, rigs, hold, cfg);
      const view = cameraView(shown, cfg);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.beginPath();
      ctx.rect(gameWindow.x, gameWindow.y, gameWindow.w, gameWindow.h);
      ctx.clip();
      const sight = world.fog && revealedPath(world.fog, cfg.cellPx);
      drawScene(ctx, world, shown, look, rigs, cfg, view, alpha, world.enemies.map((e) => heroLook(e.body, clips, enemyRigs, hold, cfg)), enemyRigs, sight, devicePixelRatio || 1, gameWindow);
      if (world.fog) drawFog(ctx, world.fog, view, cfg.cellPx);
      drawOverlays(ctx, world, shown, look, rigs, cfg, view, overlays, [gameWindow.x, gameWindow.y]);
      drawOver?.(ctx, view, cfg.cellPx);
      ctx.restore();
      push();
    },
  });

  const restart = ({ weapon, running, fogOn }: RunStart): void => {
    resetWorld(world, tuning().movement);
    Object.assign(hero, createHero(world.spawn, weapon, tuning().movement.energy.max, tuning().movement.energy.shields, tuning().movement.ammo, running));
    applyFog(fogOn);
    prev = { x: hero.x, y: hero.y };
  };

  const applyTime = ({ paused, timeScale }: { paused: boolean; timeScale: number }): void => {
    loop.paused = paused;
    loop.timeScale = timeScale;
  };

  applyTime(tuning());
  useSandbox.subscribe((s, before) => {
    applyTime(s);
    if (s.movement.cellPx !== before.movement.cellPx) fit();
  });

  fit();
  window.addEventListener("resize", fit);
  new MutationObserver(fit).observe(ui, { childList: true });
  watchPixelRatio();
  loop.start();

  createRoot(ui).render(tree);
  return { hero, input, loop, restart, applyFog };
}
