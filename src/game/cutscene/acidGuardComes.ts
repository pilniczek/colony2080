import config from "@config/cutscenes/acid-guard-comes.json";
import { ASSETS } from "../env/assets";
import { ACID_GUARD_FRONT } from "../env/guard";
import { drawAsset } from "../env/paint";
import type { Pt } from "../../engine/rig/tree";
import type { Cutscene } from "./index";
import { camera, cloud, fitStage, LINE_W, poly, random, rect, rowFill, shadow, stillLayer, stroke, tracks } from "./kit";

type Ctx = CanvasRenderingContext2D;

const S = config.stage;
const { width: W, height: H, horizon: HORIZON, tower: TOWER, guard: G } = S;
const BUILDING = S.building as Pt[];
const palette = { ...config.palette };
const { num: at } = tracks(config.tracks);
const STOP = config.tracks.guardX[1]![0] as number;
const HIT = 0.09;

const pick = random(S.seed);
const clouds = Array.from({ length: S.clouds }, () => {
  const y = pick() * (HORIZON - 120);
  return { x: -200 + pick() * 2000, y, w: 260 + pick() * 520, h: 30 + pick() * 50, lit: y / HORIZON };
});
const backdrop = stillLayer();

function drawSky(c: Ctx): void {
  rowFill(c, (g) => {
    const sky = g.createLinearGradient(0, -200, 0, HORIZON);
    sky.addColorStop(0, palette.skyTop);
    sky.addColorStop(0.45, palette.skyMid);
    sky.addColorStop(0.78, palette.skyGlow);
    sky.addColorStop(0.88, palette.skyHot);
    sky.addColorStop(1, palette.skyLow);
    g.fillStyle = sky;
    g.fillRect(-1000, -400, 3600, HORIZON + 400);
    const floor = g.createLinearGradient(0, HORIZON, 0, H + 200);
    floor.addColorStop(0, palette.floorFar);
    floor.addColorStop(1, palette.floorNear);
    g.fillStyle = floor;
    g.fillRect(-1000, HORIZON, 3600, H + 400);
  });
  for (const k of clouds) cloud(c, k.x, k.y, k.w, k.h, 0.5 * k.lit, palette.cloudLit, palette.cloud);
  for (let i = 0; i < 9; i++) {
    c.globalAlpha = 0.25;
    rect(c, -1000, HORIZON + 14 + i * i * 4.4, 3600, 2 + i * 0.6, palette.streak);
  }
  c.globalAlpha = 1;
}

function drawTower(c: Ctx): void {
  const { x, w, top, rungs, bar } = TOWER;
  const step = (HORIZON - top) / rungs;
  for (const lx of [x, x + w]) rect(c, lx - bar / 2, top, bar, HORIZON - top + 20, palette.silhouette);
  for (let i = 0; i <= rungs; i++) {
    const y = top + i * step;
    rect(c, x, y - bar / 4, w, bar / 2, palette.silhouette);
    if (i < rungs) {
      stroke(c, [[x, y], [x + w, y + step]], palette.silhouette, bar * 0.6);
      stroke(c, [[x + w, y], [x, y + step]], palette.silhouette, bar * 0.6);
    }
  }
}

function drawBackdrop(c: Ctx): void {
  drawSky(c);
  drawTower(c);
  poly(c, BUILDING, palette.silhouette);
  stroke(c, BUILDING.slice(0, 2), palette.edge, 4);
}

const firing = (t: number): number | null => {
  const fired = t - G.fireFrom;
  return fired < 0 || fired >= G.burst * G.bursts ? null : fired % G.burst;
};

function guardLook(t: number): { state: number; t: number } {
  if (t < STOP) return { state: ACID_GUARD_FRONT.walk, t };
  const age = firing(t);
  return age === null ? { state: ACID_GUARD_FRONT.idle, t } : { state: ACID_GUARD_FRONT.firing, t: age };
}

function drawGuard(c: Ctx, t: number): void {
  const x = at("guardX", t);
  const y = at("guardY", t);
  const k = at("guardScale", t);
  shadow(c, x, y + 4, 34 * k, 5 * k, 0.45, palette.shadow);
  const look = guardLook(t);
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  drawAsset(c, ASSETS.acidGuardFront, { state: look.state, t: look.t, lines: LINE_W / k });
  c.restore();
}

function render(c: Ctx, w: number, h: number, t: number): void {
  c.save();
  fitStage(c, w, h, W, H);
  const age = firing(t);
  const kick = age === null || age >= HIT ? 0 : 1 - age / HIT;
  camera(c, W, H, at("camX", t) + Math.sin(t * 97) * 14 * kick, at("camY", t) + Math.cos(t * 83) * 10 * kick, at("camZ", t));
  backdrop(c, [], drawBackdrop);
  drawGuard(c, t);
  c.restore();
  const flash = Math.max(at("flash", t), 0.35 * kick);
  if (flash > 0) {
    c.save();
    c.globalAlpha = flash;
    c.fillStyle = palette.flash;
    c.fillRect(0, 0, w, h);
    c.restore();
  }
}

export const acidGuardComes: Cutscene = { id: "acidGuardComes", duration: config.duration, camera: config.camera, render };
