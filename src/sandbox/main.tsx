import "@fontsource/orbitron/900.css";
import "@fontsource/share-tech-mono/400.css";
import controls from "@config/controls.json";
import sandboxJson from "@config/levels/sandbox.json";
import cameraJson from "@config/camera.json";
import { createRoot } from "react-dom/client";
import { Input } from "../engine/input";
import { FIXED_STEP, FixedLoop } from "../engine/loop";
import { followView, resizeCanvas, type ViewTransform } from "../engine/render/view";
import { createFog, loadFog } from "../game/fog";
import type { Weapon } from "../game/hero/config";
import { hudFit, viewRect, type Rect } from "../game/hud/layout";
import { SHIELDS_MAX } from "../game/hud/svg";
import { createHero, damage, kill } from "../game/hero/hero";
import { createRigs, heroLook } from "../game/hero/look";
import { heldItems, loadSandbox, resetWorld } from "../game/level/sandboxLevel";
import { drawFog, revealedPath } from "../game/render/fog";
import { drawOverlays } from "../game/render/overlays";
import { drawScene } from "../game/render/scene";
import { holdPoses } from "../game/robot/gun";
import { stepWorld } from "../game/stepWorld";
import { useSandbox } from "./store";
import { Hud } from "./ui/Hud";
import { Panel, type SandboxCommands } from "./ui/Panel";

const MAX_STEPS = 5;
const SNAP_CELLS = 1;
const LOG_SIZE = 8;
const FPS_SMOOTHING = 0.1;
const MAX_PANEL_SHARE = 0.5;

const canvas = document.getElementById("game");
const ui = document.getElementById("ui");
if (!(canvas instanceof HTMLCanvasElement) || !ui) throw new Error("missing #game or #ui");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("no 2d context");

const tuning = () => useSandbox.getState();
const fogConfig = loadFog(cameraJson);
const cameraConfig = cameraJson as { view: { widthCells: number; heightCells: number } };
const world = loadSandbox(sandboxJson);
const hero = createHero(world.spawn, "gun", tuning().movement.energy.max, tuning().movement.energy.shields, tuning().movement.ammo, true);
const applyFog = (on: boolean): void => {
  world.fog = on ? createFog(fogConfig, hero, world.grid) : null;
};
applyFog(tuning().fogOn);
const rigs = createRigs(true);
const enemyRigs = createRigs(true, true);
const hold = holdPoses(rigs.side, rigs.front);
const input = new Input(controls.keyboard, () => performance.now(), tuning().movement.inputBufferMs);
input.attach(window);

let prev = { x: hero.x, y: hero.y };
let gameWindow: Rect = { x: 0, y: 0, w: 1, h: 1 };

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
  return { ...v, offsetX: v.offsetX + gameWindow.x, offsetY: v.offsetY + gameWindow.y };
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

const lerp = (a: number, b: number, k: number): number => (Math.abs(b - a) > SNAP_CELLS ? b : a + (b - a) * k);

let run = { fogOn: tuning().fogOn, weapon: "gun" as Weapon, running: true };
let recordedSteps = 0;
let playedSteps = 0;
let inputLog: string[] = [];
let lastHeld = "";
let lastRender = 0;
let fps = 0;

const respawn = (): void => {
  resetWorld(world);
  Object.assign(hero, createHero(world.spawn, run.weapon, tuning().movement.energy.max, tuning().movement.energy.shields, tuning().movement.ammo, run.running));
  applyFog(run.fogOn);
  prev = { x: hero.x, y: hero.y };
};

const endPlayback = (): void => {
  input.stopPlayback();
  input.releaseAll();
  useSandbox.setState({ playing: false });
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
  const items = heldItems(world);
  useSandbox.setState({
    ...(items.join() === useSandbox.getState().items.join() ? {} : { items }),
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
    const { movement: cfg, clips, recording, playing } = tuning();
    prev = { x: hero.x, y: hero.y };
    input.bufferMs = cfg.inputBufferMs;
    const frame = input.frame();
    logInput(frame.held);
    stepWorld(world, hero, frame, cfg, clips, dt, (action) => input.consume(action));
    if (recording) recordedSteps++;
    if (playing && ++playedSteps >= recordedSteps) endPlayback();
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
    drawScene(ctx, world, shown, look, rigs, cfg, view, alpha, world.enemies.map((e) => heroLook(e.body, clips, enemyRigs, hold, cfg)), enemyRigs, sight, devicePixelRatio || 1);
    if (world.fog) drawFog(ctx, world.fog, view, cfg.cellPx);
    drawOverlays(ctx, world, shown, look, rigs, cfg, view, overlays, [gameWindow.x, gameWindow.y]);
    ctx.restore();
    push();
  },
});

const press = (action: string): void => {
  const code = controls.keyboard[action as keyof typeof controls.keyboard]?.[0];
  if (!code) return;
  input.keyDown(code);
  input.keyUp(code);
};

const commands: SandboxCommands = {
  step: () => loop.stepOnce(),
  startRecording() {
    if (tuning().playing) endPlayback();
    run = { fogOn: tuning().fogOn, weapon: hero.weapon, running: hero.running };
    respawn();
    input.startRecording();
    recordedSteps = 0;
    useSandbox.setState({ recording: true });
  },
  stopRecording() {
    if (tuning().playing) return endPlayback();
    useSandbox.setState({ recording: false, record: input.stopRecording() });
  },
  replay() {
    const { record } = tuning();
    if (!record) return;
    respawn();
    input.play(record);
    playedSteps = 0;
    useSandbox.setState({ playing: true });
  },
  setWeapon: (weapon) => press(weapon === "gun" ? "weapon1" : "weapon2"),
  hit: () => void damage(hero, tuning().movement),
  kill: () => void kill(hero),
  setAmmo: (ammo) => void (hero.ammo = Math.max(0, Math.round(ammo))),
  setShields: (shields) => void (hero.shields = Math.min(SHIELDS_MAX, Math.max(0, Math.round(shields)))),
  setFog(on) {
    applyFog(on);
    useSandbox.setState({ fogOn: on });
  },
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

createRoot(ui).render(
  <>
    <Hud />
    <Panel commands={commands} />
  </>,
);
