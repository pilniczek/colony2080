import { isTextField } from "../engine/input";
import type { ViewTransform } from "../engine/render/view";
import { kill } from "../game/hero/hero";
import type { ItemId } from "../game/items";
import type { MissionId } from "../game/level/missionIds";
import { pickUp } from "../game/level/sandboxLevel";
import type { Run } from "../game/run";
import { useSandbox } from "../sandbox/store";

const MAP_FILES: Record<MissionId, string> = { mesto: "M11", vesnice: "M21", jungle: "M31", jeskyne: "M41" };
const MAP_CELL_PX = 24;
const ALPHA = 0.5;
const TOGGLE = "KeyO";

export type DrawOver = (ctx: CanvasRenderingContext2D, view: ViewTransform, cellPx: number) => void;

export function originalOverlay(run: Run, mission: MissionId): DrawOver {
  const image = new Image();
  image.src = `/docs/research/gamedata/png/maps/map_${MAP_FILES[mission]}.png`;
  let on = false;
  addEventListener("keydown", (e) => {
    if (e.code === TOGGLE && !isTextField(e.target)) on = !on;
  });
  Object.assign(window, {
    __teleport: (x: number, y: number) => Object.assign(run.hero, { x, y, vx: 0, vy: 0 }),
    __overlay: (show: boolean) => (on = show),
    __fog: (fog: boolean) => run.applyFog(fog),
    __pause: (paused: boolean) => useSandbox.setState({ paused }),
    __flag: (name: string) => run.world.flags.add(`flag:${name}`),
    __give: (item: ItemId) => pickUp(run.world, item),
    __kill: () => kill(run.hero),
    __sounds: () => run.soundLog(),
    __state: () => ({ x: run.hero.x, y: run.hero.y, state: run.hero.state, flags: [...run.world.flags], shown: run.world.inventory.shown }),
  });
  return (ctx, view, cellPx) => {
    if (!on || !image.complete || !image.naturalWidth) return;
    const k = cellPx / MAP_CELL_PX;
    ctx.save();
    ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
    ctx.globalAlpha = ALPHA;
    ctx.drawImage(image, 0, 0, image.naturalWidth * k, image.naturalHeight * k);
    ctx.restore();
  };
}
