const EPSILON = 1e-9;

export interface FixedLoopOptions {
  step: number;
  maxSteps: number;
  update(dt: number): void;
  render(alpha: number): void;
}

export class FixedLoop {
  timeScale = 1;
  paused = false;
  private accumulator = 0;
  private generation = 0;
  private running = false;
  private lastTime: number | null = null;

  constructor(private readonly opts: FixedLoopOptions) {}

  advance(realDtSeconds: number): void {
    if (!this.paused) {
      this.accumulator += realDtSeconds * this.timeScale;
      let steps = 0;
      while (this.accumulator >= this.opts.step - EPSILON && steps < this.opts.maxSteps) {
        this.opts.update(this.opts.step);
        this.accumulator -= this.opts.step;
        steps++;
      }
      if (steps === this.opts.maxSteps) this.accumulator = 0;
    }
    this.opts.render(this.alpha());
  }

  stepOnce(): void {
    this.opts.update(this.opts.step);
    this.opts.render(this.alpha());
  }

  start(raf: (cb: FrameRequestCallback) => number = (cb) => requestAnimationFrame(cb)): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = null;
    const generation = ++this.generation;
    const tick: FrameRequestCallback = (time) => {
      if (!this.running || generation !== this.generation) return;
      if (this.lastTime !== null) this.advance((time - this.lastTime) / 1000);
      this.lastTime = time;
      raf(tick);
    };
    raf(tick);
  }

  stop(): void {
    this.running = false;
  }

  private alpha(): number {
    return Math.min(1, Math.max(0, this.accumulator / this.opts.step));
  }
}
