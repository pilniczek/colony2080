export type Bindings = Record<string, string[]>;

export interface InputFrame {
  held: Set<string>;
  pressed: Set<string>;
  dir: -1 | 0 | 1;
}

export type InputRecord = { frame: number; type: "down" | "up"; code: string }[];

interface VisibilitySource {
  visibilityState?: string;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

interface KeyLikeEvent {
  code: string;
  repeat?: boolean;
  target?: unknown;
  preventDefault(): void;
}

const NON_TEXT_INPUTS = new Set(["checkbox", "radio", "button", "submit", "reset", "range", "color", "file", "image"]);

export const isTextField = (target: unknown): boolean => {
  const el = target as { tagName?: unknown; type?: unknown } | null | undefined;
  if (el?.tagName === "TEXTAREA" || el?.tagName === "SELECT") return true;
  return el?.tagName === "INPUT" && !NON_TEXT_INPUTS.has(String(el.type));
};

export class Input {
  private readonly actionsByCode = new Map<string, string[]>();
  private readonly heldCodes = new Set<string>();
  private readonly pressedAt = new Map<string, number>();
  private dirOrder: ("moveLeft" | "moveRight")[] = [];
  private frameIndex = 0;
  private recording: InputRecord | null = null;
  private playback: InputRecord | null = null;
  private playbackCursor = 0;

  constructor(
    bindings: Bindings,
    private readonly now: () => number,
    public bufferMs: number,
  ) {
    for (const [action, codes] of Object.entries(bindings)) {
      for (const code of codes) {
        const list = this.actionsByCode.get(code) ?? [];
        list.push(action);
        this.actionsByCode.set(code, list);
      }
    }
  }

  keyDown(code: string, time: number = this.clock()): boolean {
    const bound = this.actionsByCode.has(code);
    if (bound && !this.playback) this.applyDown(code, time);
    return bound;
  }

  keyUp(code: string): boolean {
    const bound = this.actionsByCode.has(code);
    if (bound && !this.playback) this.applyUp(code);
    return bound;
  }

  releaseAll(): void {
    if (this.playback) return;
    for (const code of [...this.heldCodes]) this.applyUp(code);
    this.pressedAt.clear();
  }

  clearPresses(): void {
    this.pressedAt.clear();
  }

  frame(): InputFrame {
    if (this.playback) this.feedPlayback();
    const time = this.clock();
    for (const [action, at] of this.pressedAt) {
      if (time - at > this.bufferMs) this.pressedAt.delete(action);
    }
    const held = new Set<string>();
    for (const code of this.heldCodes) {
      for (const action of this.actionsByCode.get(code) ?? []) held.add(action);
    }
    const dir = this.dirOrder.length === 0 ? 0 : this.dirOrder[this.dirOrder.length - 1] === "moveLeft" ? -1 : 1;
    const frame: InputFrame = { held, pressed: new Set(this.pressedAt.keys()), dir };
    this.frameIndex++;
    return frame;
  }

  consume(action: string): boolean {
    const at = this.pressedAt.get(action);
    if (at === undefined) return false;
    this.pressedAt.delete(action);
    return this.clock() - at <= this.bufferMs;
  }

  startRecording(): void {
    this.stopPlayback();
    this.releaseAll();
    this.pressedAt.clear();
    this.frameIndex = 0;
    this.recording = [];
  }

  stopRecording(): InputRecord {
    const record = this.recording ?? [];
    this.recording = null;
    return record;
  }

  play(record: InputRecord): void {
    this.recording = null;
    this.stopPlayback();
    this.releaseAll();
    this.pressedAt.clear();
    this.frameIndex = 0;
    this.playback = record;
    this.playbackCursor = 0;
  }

  attach(target: Window, doc: VisibilitySource | undefined = globalThis.document): () => void {
    const onKeyDown = (raw: unknown) => {
      const event = raw as KeyLikeEvent;
      if (!this.actionsByCode.has(event.code) || isTextField(event.target)) return;
      event.preventDefault();
      if (!event.repeat) this.keyDown(event.code);
    };
    const onKeyUp = (raw: unknown) => {
      const event = raw as KeyLikeEvent;
      if (!this.actionsByCode.has(event.code)) return;
      if (!isTextField(event.target)) event.preventDefault();
      this.keyUp(event.code);
    };
    const onBlur = () => this.releaseAll();
    const onVisibility = () => {
      if (doc?.visibilityState === "hidden") this.releaseAll();
    };
    target.addEventListener("keydown", onKeyDown);
    target.addEventListener("keyup", onKeyUp);
    target.addEventListener("blur", onBlur);
    doc?.addEventListener("visibilitychange", onVisibility);
    return () => {
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
      target.removeEventListener("blur", onBlur);
      doc?.removeEventListener("visibilitychange", onVisibility);
    };
  }

  stopPlayback(): void {
    this.playback = null;
  }

  private feedPlayback(): void {
    const record = this.playback!;
    const time = this.clock();
    for (let entry = record[this.playbackCursor]; entry && entry.frame <= this.frameIndex; entry = record[this.playbackCursor]) {
      this.playbackCursor++;
      if (entry.type === "down") this.applyDown(entry.code, time, true);
      else this.applyUp(entry.code, true);
    }
  }

  private applyDown(code: string, time: number, replay = false): void {
    if (this.heldCodes.has(code)) return;
    this.heldCodes.add(code);
    if (!replay) this.recording?.push({ frame: this.frameIndex, type: "down", code });
    for (const action of this.actionsByCode.get(code) ?? []) {
      this.pressedAt.set(action, time);
      if (action === "moveLeft" || action === "moveRight") {
        this.dirOrder = this.dirOrder.filter((a) => a !== action);
        this.dirOrder.push(action);
      }
    }
  }

  private applyUp(code: string, replay = false): void {
    if (!this.heldCodes.delete(code)) return;
    if (!replay) this.recording?.push({ frame: this.frameIndex, type: "up", code });
    for (const action of this.actionsByCode.get(code) ?? []) {
      if (action === "moveLeft" || action === "moveRight") {
        if (!this.isActionHeld(action)) this.dirOrder = this.dirOrder.filter((a) => a !== action);
      }
    }
  }

  private clock(): number {
    return this.recording || this.playback ? (this.frameIndex * 1000) / 60 : this.now();
  }

  private isActionHeld(action: string): boolean {
    for (const code of this.heldCodes) {
      if (this.actionsByCode.get(code)?.includes(action)) return true;
    }
    return false;
  }
}
