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
  stopAll(bus?: Bus): void;
  setMuted(muted: boolean): void;
  readonly muted: boolean;
}

export const MAX_VOICES = 8;

const MAX_VOL = 63;

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
  const buffers = new Map<string, AudioBuffer>();

  function bufferOf(context: AudioContext, id: string): AudioBuffer {
    const cached = buffers.get(id);
    if (cached) return cached;
    const data = samples(id);
    const buffer = context.createBuffer(1, data.length, BASE_RATE);
    buffer.getChannelData(0).set(data);
    buffers.set(id, buffer);
    return buffer;
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
        const master = context.createGain();
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
      source.buffer = bufferOf(context, cue.id);
      source.playbackRate.value = cue.rate / BASE_RATE;
      const gain = context.createGain();
      gain.gain.value = (cue.vol ?? MAX_VOL) / MAX_VOL;
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
