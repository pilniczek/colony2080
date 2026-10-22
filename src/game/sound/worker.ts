import { samplesOf } from "./index";

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<string[]>) => void) | null;
  postMessage(message: RenderedSound, transfer: Transferable[]): void;
};

export interface RenderedSound {
  id: string;
  samples: Float32Array;
}

scope.onmessage = ({ data: ids }) => {
  for (const id of ids) {
    const samples = samplesOf(id);
    scope.postMessage({ id, samples }, [samples.buffer]);
  }
};
