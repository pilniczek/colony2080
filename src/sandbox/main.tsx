import controls from "@config/controls.json";
import clipsJson from "@config/hero/clips.json";
import movementJson from "@config/hero/movement.json";
import sandboxJson from "@config/levels/sandbox.json";
import { createRoot } from "react-dom/client";
import { Input } from "../engine/input";
import { FIXED_STEP, FixedLoop } from "../engine/loop";
import { fitView, resizeCanvas, type ViewTransform } from "../engine/render/view";
import { stepProjectiles } from "../engine/world/projectiles";
import { loadClips, loadMovement } from "../game/hero/config";
import { createHero, updateHero } from "../game/hero/hero";
import { createRigs, heroLook } from "../game/hero/look";
import { loadSandbox, updateEmitter, updateLift } from "../game/level/sandboxLevel";
import { drawScene } from "../game/render/scene";
import { holdPoses } from "../game/robot/gun";

const MAX_STEPS = 5;
const SNAP_CELLS = 1;

const canvas = document.getElementById("game");
const ui = document.getElementById("ui");
if (!(canvas instanceof HTMLCanvasElement) || !ui) throw new Error("missing #game or #ui");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("no 2d context");

const cfg = loadMovement(movementJson);
const clips = loadClips(clipsJson);
const world = loadSandbox(sandboxJson);
const hero = createHero(world.spawn, "gun", cfg.energy.max);
const rigs = createRigs(true);
const hold = holdPoses(rigs.side, rigs.front);
const input = new Input(controls.keyboard, () => performance.now(), cfg.inputBufferMs);
input.attach(window);

let prev = { x: hero.x, y: hero.y };
let view: ViewTransform = { scale: 1, offsetX: 0, offsetY: 0 };

const fit = (): void => {
  resizeCanvas(canvas, devicePixelRatio || 1);
  view = fitView(canvas.width, canvas.height, world.grid.width * cfg.cellPx, world.grid.height * cfg.cellPx);
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

const loop = new FixedLoop({
  step: FIXED_STEP,
  maxSteps: MAX_STEPS,
  update(dt) {
    prev = { x: hero.x, y: hero.y };
    const frame = input.frame();
    updateEmitter(world, dt);
    world.projectiles = stepProjectiles(world.projectiles, world.grid, dt);
    updateLift(world.lift, cfg.liftSpeed, dt);
    updateHero(hero, frame, world, cfg, clips, dt, (action) => input.consume(action));
  },
  render(alpha) {
    const shown = { ...hero, x: lerp(prev.x, hero.x, alpha), y: lerp(prev.y, hero.y, alpha) };
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawScene(ctx, world, shown, heroLook(hero, clips, rigs, hold), rigs, cfg, view, alpha);
  },
});

fit();
window.addEventListener("resize", fit);
watchPixelRatio();
loop.start();

createRoot(ui).render(null);
