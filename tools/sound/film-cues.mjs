import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const REPORT = "docs/research/reports/17-sound.md";
const ORIGINALS = "spikes/shared/originals.js";
const CONFIG_DIR = "config/cutscenes";
const FORCED_RATE = { VYBUCH6: 9000 };
const SILENT = new Set(["NIC", "SIGNAL"]);
const ID_OF = {
  STRELBA: "gunShot", P1_CANN: "cannon", LASER2: "laser", LASER3: "beam", UDER: "punch", VYBUCH6: "explosion", KROK3: "step",
  SIGNAL: "land", IKONA: "click", INVEND: "inventory", GATE: "power", SIRENA3: "siren", VYTAH1: "liftStart", VYTAH2: "liftStop",
  DVERE: "door", MRIZ2: "grate", HROM: "thunder", TELEPORT: "teleport", ZKRAT: "spark", HYDRA: "servo", EL: "crackle",
  ZAZEH: "ignition", PRULET2: "flyby", PRELET: "flyover", VRATA1: "hatch", VRATA2: "slam", ODLET: "takeoff", VYBUCH2: "blast",
  DVERE2: "heavyDoor",
};

const kebab = (id) => id.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function filmTables() {
  const text = readFileSync(REPORT, "utf8");
  const section = text.slice(text.indexOf("## 4. Film cues"), text.indexOf("### Film-only sounds"));
  const films = new Map();
  let film = null;
  let anm = null;
  for (const line of section.split("\n")) {
    const heading = line.match(/^### (\w+)/);
    if (heading) {
      film = heading[1];
      films.set(film, []);
      continue;
    }
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (!film || cells.length !== 6 || !/^\d/.test(cells[1])) continue;
    const [anmCell, frames, sndCell, rate, vol, voice] = cells;
    anm = anmCell.split(" ")[0] || anm;
    const snd = sndCell.match(/`(\w+)`/)[1];
    if (voice === "yes" || SILENT.has(snd)) continue;
    for (const part of frames.split(",").map((f) => f.trim())) {
      const [from, to = from] = part.split("-").map(Number);
      for (let frame = from; frame <= to; frame++) films.get(film).push({ anm, frame, snd, rate: FORCED_RATE[snd] ?? Number(rate), vol: Number(vol) });
    }
  }
  return films;
}

function frameMaps() {
  const context = { window: {} };
  vm.runInNewContext(readFileSync(ORIGINALS, "utf8"), context);
  return context.window.ORIGINALS.cutscenes;
}

const keyOf = (path) => {
  const [, anm, frame] = path.match(/png\/(\w+)\/f(\d+)\.png$/);
  return { anm, frame: Number(frame) };
};

function mapperOf(id, maps, config) {
  if (id === "crowbarDoor") {
    const { start, end } = config.clip;
    const frames = maps.crowbarDoor.frames;
    return { duration: end - start, at: (t) => ({ anm: "METROPAC", frame: Math.min(frames, 1 + Math.floor(((t + start) / end) * frames)) }) };
  }
  return { duration: config.duration, at: (t) => keyOf(maps[id].frame(Math.min(config.duration, Math.max(0, t)), config.duration)) };
}

function cueTime({ duration, at }, cue) {
  const order = [];
  for (let t = 0; t <= duration; t += 0.001) {
    const { anm } = at(t);
    if (order.at(-1) !== anm) order.push(anm);
  }
  const rank = ({ anm, frame }) => order.indexOf(anm) * 1e4 + frame;
  const target = rank(cue);
  if (!order.includes(cue.anm) || rank(at(0)) > target || rank(at(duration)) < target) return null;
  let lo = 0;
  let hi = duration;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (rank(at(mid)) >= target) hi = mid;
    else lo = mid;
  }
  const hit = at(hi);
  if (hit.anm !== cue.anm || hit.frame !== cue.frame) return null;
  return rank(at(0)) === target ? 0 : Math.round(hi * 1000) / 1000;
}

function writeSounds(path, sounds) {
  const line = `  "sounds": [${sounds.map((cue) => `[${cue.map((v) => JSON.stringify(v)).join(", ")}]`).join(", ")}]`;
  const lines = readFileSync(path, "utf8").split("\n").filter((l) => !l.startsWith('  "sounds": '));
  const after = lines.findIndex((l) => l.startsWith('  "duration": ') || l.startsWith('  "clip": '));
  lines.splice(after + 1, 0, `${line},`);
  writeFileSync(path, lines.join("\n"));
}

const maps = frameMaps();
for (const [id, cues] of filmTables()) {
  const path = `${CONFIG_DIR}/${kebab(id)}.json`;
  const mapper = mapperOf(id, maps, JSON.parse(readFileSync(path, "utf8")));
  const sounds = [];
  for (const cue of cues) {
    const t = cueTime(mapper, cue);
    if (t === null) {
      console.log(`${id}: dropped ${cue.anm} frame ${cue.frame} ${cue.snd}`);
      continue;
    }
    sounds.push(cue.vol === 63 ? [t, ID_OF[cue.snd], cue.rate] : [t, ID_OF[cue.snd], cue.rate, cue.vol]);
  }
  sounds.sort((a, b) => a[0] - b[0]);
  writeSounds(path, sounds);
  console.log(`${id}: ${sounds.length} cues`);
}
