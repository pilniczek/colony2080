import { adoptSamples } from "./index";
import type { RenderedSound } from "./worker";

export function prerender(ids: readonly string[]): Promise<void> {
  if (typeof Worker === "undefined" || ids.length === 0) return Promise.resolve();
  const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  return new Promise((resolve) => {
    let left = ids.length;
    const done = (): void => {
      worker.terminate();
      resolve();
    };
    worker.onmessage = ({ data }: MessageEvent<RenderedSound>) => {
      adoptSamples(data.id, data.samples);
      if (--left === 0) done();
    };
    worker.onerror = done;
    worker.postMessage(ids);
  });
}
