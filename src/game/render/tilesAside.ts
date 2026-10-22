import type { SandboxWorld } from "../level/sandboxLevel";
import { adoptTile, paintTilesWith } from "./environment";
import type { TileReply, TileRequest } from "./tileWorker";

export function paintTilesAside(world: SandboxWorld): void {
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return;
  const worker = new Worker(new URL("./tileWorker.ts", import.meta.url), { type: "module" });
  const send = (request: TileRequest): void => worker.postMessage(request);
  worker.onmessage = ({ data }: MessageEvent<TileReply>) => adoptTile(world, data.job, data.image);
  worker.onerror = () => {
    paintTilesWith(world, null);
    worker.terminate();
  };
  send({ json: world.source });
  paintTilesWith(world, send);
}
