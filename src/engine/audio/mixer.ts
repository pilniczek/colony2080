import { BASE_RATE } from "./synth";

export type Bus = "world" | "ui";

export interface SoundCue {
  id: string;
  rate: number;
  vol?: number;
  bus?: Bus;
}

export interface Mixer {
  unlock(): void;
  play(cue: SoundCue): void;
  warm(id: string): void;
  stopAll(bus?: Bus): void;
  setMuted(muted: boolean): void;
  readonly muted: boolean;
}

export const MAX_VOICES = 8;

const MAX_VOL = 63;

export const LEVEL = 0.04;

const LOUDNESS_WINDOW = Math.round(BASE_RATE * 0.05);

export function loudness(data: Float32Array): number {
  const size = Math.min(LOUDNESS_WINDOW, data.length);
  let sum = 0;
  let loudest = 0;
  data.forEach((x, i) => {
    sum += x * x;
    const old = data[i - size];
    if (old !== undefined) sum -= old * old;
    if (i >= size - 1) loudest = Math.max(loudest, sum / size);
  });
  return Math.sqrt(loudest);
}

export const volGain = (vol: number): number => Math.sqrt(vol / MAX_VOL);

interface Sound {
  buffer: AudioBuffer;
  level: number;
}

interface Voice {
  source: AudioBufferSourceNode;
  bus: Bus;
}

interface Graph {
  context: AudioContext;
  buses: Record<Bus, GainNode>;
}

export function createMixer(
  samples: (id: string) => Float32Array,
  makeContext: () => AudioContext = () => new AudioContext(),
): Mixer {
  let graph: Graph | null = null;
  let muted = false;
  let voices: Voice[] = [];
  const sounds = new Map<string, Sound>();

  function soundOf(context: AudioContext, id: string): Sound {
    const cached = sounds.get(id);
    if (cached) return cached;
    const data = samples(id);
    const buffer = context.createBuffer(1, data.length, BASE_RATE);
    buffer.getChannelData(0).set(data);
    const sound = { buffer, level: LEVEL / Math.max(loudness(data), LEVEL) };
    sounds.set(id, sound);
    return sound;
  }

  function stopVoice(voice: Voice): void {
    voice.source.onended = null;
    voice.source.stop();
    voices = voices.filter((other) => other !== voice);
  }

  function stopAll(bus?: Bus): void {
    for (const voice of voices.filter((other) => !bus || other.bus === bus)) stopVoice(voice);
  }

  return {
    unlock() {
      if (!graph) {
        const context = makeContext();
        const master = context.createDynamicsCompressor();
        master.threshold.value = -12;
        master.knee.value = 6;
        master.ratio.value = 4;
        master.connect(context.destination);
        const world = context.createGain();
        const ui = context.createGain();
        world.connect(master);
        ui.connect(master);
        graph = { context, buses: { world, ui } };
      }
      graph.context.resume().catch(() => {});
    },
    play(cue) {
      if (!graph || muted) return;
      const { context, buses } = graph;
      const bus = cue.bus ?? "world";
      const source = context.createBufferSource();
      const sound = soundOf(context, cue.id);
      source.buffer = sound.buffer;
      source.playbackRate.value = cue.rate / BASE_RATE;
      const gain = context.createGain();
      gain.gain.value = volGain(cue.vol ?? MAX_VOL) * sound.level;
      source.connect(gain);
      gain.connect(buses[bus]);
      const voice: Voice = { source, bus };
      source.onended = () => {
        voices = voices.filter((other) => other !== voice);
      };
      voices.push(voice);
      const oldest = voices[0];
      if (voices.length > MAX_VOICES && oldest) stopVoice(oldest);
      source.start();
    },
    warm(id) {
      if (graph) soundOf(graph.context, id);
    },
    stopAll,
    setMuted(value) {
      muted = value;
      if (muted) stopAll();
    },
    get muted() {
      return muted;
    },
  };
}
