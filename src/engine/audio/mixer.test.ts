import { describe, expect, it, vi } from "vitest";
import { BASE_RATE } from "./synth";
import { MAX_VOICES, createMixer } from "./mixer";

interface FakeSource {
  buffer: { length: number; data: Float32Array } | null;
  playbackRate: { value: number };
  gainNode: FakeGain | null;
  started: number;
  stopped: number;
  onended: (() => void) | null;
  connect(node: FakeGain): void;
  start(): void;
  stop(): void;
}

interface FakeGain {
  gain: { value: number };
  target: FakeGain | null;
  connect(node: FakeGain): void;
}

function fakeContext() {
  const sources: FakeSource[] = [];
  const gains: FakeGain[] = [];
  const buffers: { rate: number }[] = [];
  const resume = vi.fn(() => Promise.resolve());
  const makeGain = (): FakeGain => {
    const node: FakeGain = {
      gain: { value: 1 },
      target: null,
      connect(next) {
        node.target = next;
      },
    };
    gains.push(node);
    return node;
  };
  const destination = makeGain();
  const context = {
    destination,
    state: "suspended",
    resume,
    createBuffer(_channels: number, length: number, rate: number) {
      const data = new Float32Array(length);
      buffers.push({ rate });
      return { length, data, getChannelData: () => data };
    },
    createBufferSource() {
      const source: FakeSource = {
        buffer: null,
        playbackRate: { value: 1 },
        gainNode: null,
        started: 0,
        stopped: 0,
        onended: null,
        connect(node) {
          source.gainNode = node as FakeGain;
        },
        start() {
          source.started++;
        },
        stop() {
          source.stopped++;
        },
      };
      sources.push(source);
      return source;
    },
    createGain: makeGain,
  };
  return { context: context as unknown as AudioContext, sources, buffers, resume };
}

function at(sources: FakeSource[], index: number): FakeSource {
  const source = sources[index];
  if (!source) throw new Error(`no source ${index}`);
  return source;
}

function setup(samples = () => new Float32Array([0.5, -0.5, 0.25])) {
  const fake = fakeContext();
  const sampleFn = vi.fn(samples);
  const mixer = createMixer(sampleFn, () => fake.context);
  return { ...fake, mixer, sampleFn };
}

describe("mixer", () => {
  it("play before unlock drops cue", () => {
    const { mixer, sources } = setup();
    mixer.play({ id: "a", rate: BASE_RATE });
    expect(sources).toHaveLength(0);
  });

  it("unlock then play in same call starts source", () => {
    const { mixer, sources, resume } = setup();
    mixer.unlock();
    mixer.play({ id: "a", rate: BASE_RATE });
    expect(resume).toHaveBeenCalled();
    expect(sources).toHaveLength(1);
    expect(at(sources, 0).started).toBe(1);
  });

  it("copies samples into a base rate buffer", () => {
    const { mixer, sources, buffers } = setup();
    mixer.unlock();
    mixer.play({ id: "a", rate: BASE_RATE });
    expect(buffers[0]?.rate).toBe(BASE_RATE);
    expect(Array.from(at(sources, 0).buffer!.data)).toEqual([0.5, -0.5, 0.25]);
  });

  it("rate maps to playbackRate", () => {
    const { mixer, sources } = setup();
    mixer.unlock();
    mixer.play({ id: "a", rate: 15000 });
    expect(at(sources, 0).playbackRate.value).toBe(15000 / BASE_RATE);
  });

  it("vol maps to gain", () => {
    const { mixer, sources } = setup();
    mixer.unlock();
    mixer.play({ id: "a", rate: BASE_RATE, vol: 33 });
    mixer.play({ id: "a", rate: BASE_RATE });
    expect(at(sources, 0).gainNode!.gain.value).toBe(33 / 63);
    expect(at(sources, 1).gainNode!.gain.value).toBe(1);
  });

  it("muted play drops cue", () => {
    const { mixer, sources } = setup();
    mixer.unlock();
    mixer.setMuted(true);
    mixer.play({ id: "a", rate: BASE_RATE });
    expect(mixer.muted).toBe(true);
    expect(sources).toHaveLength(0);
  });

  it("ninth voice stops oldest", () => {
    const { mixer, sources } = setup();
    mixer.unlock();
    for (let i = 0; i < MAX_VOICES + 1; i++) mixer.play({ id: "a", rate: BASE_RATE });
    expect(at(sources, 0).stopped).toBe(1);
    expect(at(sources, 1).stopped).toBe(0);
  });

  it("ended source frees its voice slot", () => {
    const { mixer, sources } = setup();
    mixer.unlock();
    for (let i = 0; i < MAX_VOICES; i++) mixer.play({ id: "a", rate: BASE_RATE });
    at(sources, 0).onended?.();
    mixer.play({ id: "a", rate: BASE_RATE });
    expect(sources.every((source) => source.stopped === 0)).toBe(true);
  });

  it("stopAll world keeps ui", () => {
    const { mixer, sources } = setup();
    mixer.unlock();
    mixer.play({ id: "a", rate: BASE_RATE });
    mixer.play({ id: "a", rate: BASE_RATE, bus: "ui" });
    mixer.stopAll("world");
    expect(at(sources, 0).stopped).toBe(1);
    expect(at(sources, 1).stopped).toBe(0);
  });

  it("stopAll without bus stops everything", () => {
    const { mixer, sources } = setup();
    mixer.unlock();
    mixer.play({ id: "a", rate: BASE_RATE });
    mixer.play({ id: "a", rate: BASE_RATE, bus: "ui" });
    mixer.stopAll();
    expect(sources.map((source) => source.stopped)).toEqual([1, 1]);
  });

  it("samples rendered once per id", () => {
    const { mixer, sampleFn } = setup();
    mixer.unlock();
    mixer.play({ id: "a", rate: BASE_RATE });
    mixer.play({ id: "a", rate: BASE_RATE });
    mixer.play({ id: "b", rate: BASE_RATE });
    expect(sampleFn).toHaveBeenCalledTimes(2);
  });

  it("unlock creates the context once", () => {
    const fake = fakeContext();
    const makeContext = vi.fn(() => fake.context);
    const mixer = createMixer(() => new Float32Array(1), makeContext);
    mixer.unlock();
    mixer.unlock();
    expect(makeContext).toHaveBeenCalledTimes(1);
  });
});
