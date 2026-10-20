import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BASE_RATE } from "../../src/engine/audio/synth";
import { SOUNDS, samplesOf, type SoundId } from "../../src/game/sound/index";
import { envelopeCorrelation, readSnd, rms, spectralDistance, spectrogram } from "./metrics";
import { greyPng } from "./png";

const SND_DIR = "docs/research/gamedata/raw/CD/ZVUKY";
const OUT_DIR = join(tmpdir(), "c2080-sound", "sound");
const MAX_FRAMES = 400;

export const ORIGINAL_OF: Partial<Record<SoundId, string>> = {
  gunShot: "STRELBA.SND",
  cannon: "P1_CANN.SND",
  laser: "LASER2.SND",
  beam: "LASER3.SND",
  punch: "UDER.SND",
  explosion: "VYBUCH6.SND",
};

function spectrogramRows(samples: Float32Array): Uint8Array[] {
  const frames = spectrogram(samples).slice(0, MAX_FRAMES).map((power) => power.map((p) => 10 * Math.log10(p + 1e-12)));
  const bins = frames[0]?.length ?? 0;
  const rows: Uint8Array[] = [];
  for (let k = bins - 1; k >= 0; k--) {
    const row = new Uint8Array(MAX_FRAMES);
    frames.forEach((frame, f) => {
      row[f] = Math.round(Math.max(0, Math.min(1, (frame[k]! + 80) / 80)) * 255);
    });
    rows.push(row);
  }
  return rows;
}

function writePicture(id: string, original: Float32Array, synth: Float32Array): void {
  const rows = [...spectrogramRows(original), ...spectrogramRows(synth)];
  const pixels = new Uint8Array(MAX_FRAMES * rows.length);
  rows.forEach((row, y) => pixels.set(row, y * MAX_FRAMES));
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `${id}.png`), greyPng(MAX_FRAMES, rows.length, pixels));
}

const pad = (text: string, width: number) => text.padEnd(width);

function main(): void {
  const wanted = process.argv.slice(2);
  const ids = (Object.keys(SOUNDS) as SoundId[]).filter((id) => wanted.length === 0 || wanted.includes(id));
  console.log(`${pad("id", 20)} | ${pad("original", 14)} | samples ratio | envCorr | specDist dB | level`);
  for (const id of ids) {
    const file = ORIGINAL_OF[id];
    const path = file ? join(SND_DIR, file) : "";
    if (!file || !existsSync(path)) {
      console.log(`${pad(id, 20)} | ${pad(file ?? "-", 14)} | original missing`);
      continue;
    }
    const original = readSnd(path);
    const synth = samplesOf(id);
    writePicture(id, original, synth);
    const ratio = (synth.length / original.length).toFixed(2);
    const corr = envelopeCorrelation(original, synth).toFixed(3);
    const dist = spectralDistance(original, synth).toFixed(1);
    const level = (rms(synth) / rms(original)).toFixed(2);
    console.log(`${pad(id, 20)} | ${pad(file, 14)} | ${pad(ratio, 13)} | ${pad(corr, 7)} | ${pad(dist, 11)} | ${level}`);
  }
  console.log(`rate ${BASE_RATE} Hz, pictures in ${OUT_DIR}`);
}

main();
