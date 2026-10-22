import { loadSandbox, type SandboxJson, type SandboxWorld } from "../level/sandboxLevel";
import { paintTile, type TileJob } from "./environment";

export type TileRequest = { json: SandboxJson } | TileJob;

export interface TileReply {
  job: TileJob;
  image: ImageBitmap | null;
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<TileRequest>) => void) | null;
  postMessage(message: TileReply, transfer: Transferable[]): void;
};

let world: SandboxWorld | null = null;

scope.onmessage = ({ data }) => {
  if ("json" in data) {
    world = loadSandbox(data.json);
    return;
  }
  const image = world && paintTile(world, data);
  scope.postMessage({ job: data, image }, image ? [image] : []);
};
