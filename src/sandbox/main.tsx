import controls from "@config/controls.json";
import sandboxJson from "@config/levels/sandbox.json";
import { createRoot } from "react-dom/client";
import { Input } from "../engine/input";
import { FIXED_STEP, FixedLoop } from "../engine/loop";
import { fitView, resizeCanvas, type ViewTransform } from "../engine/render/view";
import type { Weapon } from "../game/hero/config";
import { createHero, damage, kill } from "../game/hero/hero";
import { createRigs, heroLook } from "../game/hero/look";
import { loadSandbox } from "../game/level/sandboxLevel";
import { drawOverlays } from "../game/render/overlays";
import { drawScene } from "../game/render/scene";
import { holdPoses } from "../game/robot/gun";
import { stepWorld } from "../game/stepWorld";
import { useSandbox } from "./store";
import { Panel, type SandboxCommands } from "./ui/Panel";

const MAX_STEPS = 5;
const SNAP_CELLS = 1;
const LOG_SIZE = 8;
const FPS_SMOOTHING = 0.1;

const canvas = document.getElementById("game");
const ui = document.getElementById("ui");
if (!(canvas instanceof HTMLCanvasElement) || !ui) throw new Error("missing #game or #ui");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("no 2d context");

const tuning = () => useSandbox.getState();
const world = loadSandbox(sandboxJson);
const hero = createHero(world.spawn, "gun", tuning().movement.energy.max);
const rigs = createRigs(true);
const hold = holdPoses(rigs.side, rigs.front);
const input = new Input(controls.keyboard, () => performance.now(), tuning().movement.inputBufferMs);
input.attach(window);

let prev = { x: hero.x, y: hero.y };
let view: ViewTransform = { scale: 1, offsetX: 0, offsetY: 0 };

const fit = (): void => {
  resizeCanvas(canvas, devicePixelRatio || 1);
  const { cellPx } = tuning().movement;
  view = fitView(canvas.width, canvas.height, world.grid.width * cellPx, world.grid.height * cellPx);
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

let run = { emitterOn: false, weapon: "gun" as Weapon };
let recordedSteps = 0;
let playedSteps = 0;
let inputLog: string[] = [];
let lastHeld = "";
let lastRender = 0;
let fps = 0;

const respawn = (): void => {
  Object.assign(world, loadSandbox(sandboxJson));
  world.emitter.on = run.emitterOn;
  Object.assign(hero, createHero(world.spawn, run.weapon, tuning().movement.energy.max));
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
  useSandbox.setState({
    state: hero.state,
    time: hero.time,
    vx: hero.vx,
    vy: hero.vy,
    energy: hero.energy,
    weapon: hero.weapon,
    emitterOn: world.emitter.on,
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
    const look = heroLook(hero, clips, rigs, hold);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawScene(ctx, world, shown, look, rigs, cfg, view, alpha);
    drawOverlays(ctx, world, shown, look, rigs, cfg, view, overlays);
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
    run = { emitterOn: world.emitter.on, weapon: hero.weapon };
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
  setEmitter(on) {
    world.emitter.on = on;
    useSandbox.setState({ emitterOn: on });
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
watchPixelRatio();
loop.start();

createRoot(ui).render(<Panel commands={commands} />);
