import type { SoundCue } from "../../engine/audio/mixer";
import { seeded } from "../../engine/audio/synth";
import { cue } from "./cues";

const SEED = 28;
const LOW_ENERGY = 20;
const SIREN_EVERY = 1.25;
const SPARK_EVERY = 0.3125;
const THUNDER_GAP = [8, 20] as const;
const STEP_RATES = [10000, 9400] as const;
const STEP_VOL = 33;
const EXPLOSION_RATE = 8000;
const EXPLOSION_SPREAD = 2000;
const EDGE = 1e-6;

export interface SoundClock {
  random: () => number;
  foot: 0 | 1;
  siren: number | null;
  spark: number | null;
  thunder: number;
}

type Cued = { sounds: SoundCue[]; sfx: SoundClock };

const thunderGap = (random: () => number): number => THUNDER_GAP[0] + random() * (THUNDER_GAP[1] - THUNDER_GAP[0]);

export function createSoundClock(): SoundClock {
  const next = seeded(SEED);
  const random = (): number => (next() + 1) / 2;
  return { random, foot: 0, siren: null, spark: null, thunder: thunderGap(random) };
}

export function explode(world: Cued): void {
  cue(world, "explosion", EXPLOSION_RATE + Math.floor(world.sfx.random() * EXPLOSION_SPREAD));
}

export function step(world: Cued, contacts: number): void {
  for (let i = 0; i < contacts; i++) {
    cue(world, "step", STEP_RATES[world.sfx.foot], STEP_VOL);
    world.sfx.foot = world.sfx.foot ? 0 : 1;
  }
}

function pulses(since: number | null, on: boolean, every: number, dt: number): [number | null, number] {
  if (!on) return [null, 0];
  if (since === null) return [0, 1];
  const t = since + dt;
  const count = Math.floor(t / every + EDGE);
  return [t - count * every, count];
}

export function siren(world: Cued, energy: number, live: boolean, dt: number): void {
  const [since, count] = pulses(world.sfx.siren, live && energy < LOW_ENERGY, SIREN_EVERY, dt);
  world.sfx.siren = since;
  for (let i = 0; i < count; i++) cue(world, "siren", 8500, 34);
}

export function spark(world: Cued, inside: boolean, dt: number): void {
  const [since, count] = pulses(world.sfx.spark, inside, SPARK_EVERY, dt);
  world.sfx.spark = since;
  for (let i = 0; i < count; i++) cue(world, "spark", 12000);
}

export function thunder(world: Cued, dt: number): void {
  world.sfx.thunder -= dt;
  if (world.sfx.thunder > EDGE) return;
  cue(world, "thunder", 9000);
  world.sfx.thunder += thunderGap(world.sfx.random);
}
