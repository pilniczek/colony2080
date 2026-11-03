import { runIdleJob, whenIdle } from "../../engine/idle";
import { context2d } from "../../engine/render/surface";
import { loadFilms } from "../cutscene";
import { drawRobotView } from "../cutscene/robotView";
import { drawSecurityCam } from "../cutscene/securityCam";
import type { FogConfig } from "../fog";
import { loadSandbox, type SandboxJson, type SandboxWorld } from "../level/sandboxLevel";
import { createKit, paintFrame, type FrameState, type Kit, type Target, type Tune } from "./frame";
import { applySync, type WorldSync } from "./sync";
import { paintTilesAside } from "./tilesAside";

export type ToRenderer =
  | { kind: "init"; source: SandboxJson; fogCfg: FogConfig; top: OffscreenCanvas }
  | { kind: "frame"; w: number; h: number; state: FrameState; sync: WorldSync; paused: boolean; thumb: { w: number; h: number } | null }
  | { kind: "warm"; w: number; h: number };

export type FromRenderer = { kind: "done" } | { kind: "thumb"; image: ImageBitmap } | { kind: "failed"; reason: string };

const CACHE_PASSES = 2;

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<ToRenderer>) => void) | null;
  postMessage(message: FromRenderer, transfer?: Transferable[]): void;
};

let world: SandboxWorld | null = null;
let fogCfg: FogConfig | null = null;
let top: OffscreenCanvas | null = null;
let target: Target | null = null;
let kit: Kit | null = null;
let tune: Tune | null = null;

function init(source: SandboxJson, cfg: FogConfig, given: OffscreenCanvas): void {
  world = loadSandbox(source);
  fogCfg = cfg;
  top = given;
  kit = createKit();
  paintTilesAside(world);
  target = { ctx: context2d(given, { alpha: false }), w: given.width, h: given.height };
}

function resize(w: number, h: number): void {
  if (!top || !target || (target.w === w && target.h === h)) return;
  top.width = w;
  top.height = h;
  target.w = w;
  target.h = h;
}

function thumbOf({ w, h }: { w: number; h: number }, window: { x: number; y: number; w: number; h: number }): ImageBitmap {
  const out = new OffscreenCanvas(w, h);
  const ctx = context2d(out);
  ctx.drawImage(top!, window.x, window.y, window.w, window.h, 0, 0, w, h);
  return out.transferToImageBitmap();
}

function warm(w: number, h: number): void {
  const scratch = new OffscreenCanvas(Math.max(1, Math.round(w)), Math.max(1, h));
  const ctx = context2d(scratch);
  void loadFilms().then((films) => {
    whenIdle(() => {
      for (let pass = 0; pass < CACHE_PASSES; pass++) {
        drawSecurityCam(ctx, scratch.width, scratch.height, 0, "");
        drawRobotView(ctx, scratch.width, scratch.height, 0);
      }
    });
    for (const film of films) whenIdle(() => {
      for (let pass = 0; pass < CACHE_PASSES; pass++) film.render(ctx, scratch.width, scratch.height, 0);
    });
  });
}

scope.onmessage = ({ data }) => {
  try {
    if (data.kind === "init") return init(data.source, data.fogCfg, data.top);
    if (data.kind === "warm") return warm(data.w, data.h);
    if (!world || !target || !kit || !fogCfg) return;
    resize(data.w, data.h);
    applySync(world, fogCfg, data.sync);
    tune = data.sync.tune ?? tune;
    if (data.state.kind === "game") world.enemies = data.state.enemies;
    if (tune) paintFrame(target, world, data.state, kit, tune);
    if (data.paused) runIdleJob();
    if (data.thumb && data.state.kind === "game") {
      const image = thumbOf(data.thumb, data.state.window);
      scope.postMessage({ kind: "thumb", image }, [image]);
    }
    scope.postMessage({ kind: "done" });
  } catch (error) {
    scope.postMessage({ kind: "failed", reason: String(error) });
  }
};
