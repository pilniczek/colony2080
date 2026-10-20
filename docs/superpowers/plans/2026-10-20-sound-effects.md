# Sound Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synthesized sound effects close to original, played in game, sandbox and films, with HUD sound toggle on `S`.

**Architecture:** Game code pushes sound cues into `world.sounds`; runner drains them into game-agnostic WebAudio mixer (`src/engine/audio/`). Each sound is TypeScript recipe rendering 8-bit samples at 11025 Hz once; mixer plays buffer at `rate / 11025`, same per-call rate model as original. Node tool scores each recipe against local original `.SND`.

**Tech Stack:** TypeScript, Vite 8 (rolldown), Vitest, WebAudio, Zustand store, SVG HUD.

**Spec:** `docs/superpowers/specs/2026-10-20-sound-design.md`

## Global Constraints

- No original sample, SND file name or byte in `dist/`; recipe ids are English (`gunShot`, not `strelba`).
- Base rate `11025` Hz; samples quantized to 256 levels (8-bit).
- Gain = `vol / 63`, `vol` default 63.
- Original tick = 1/32 s: low energy every 40 ticks = 1.25 s (ours: 15 s by user request); spark every 10 ticks = 0.3125 s.
- `src/engine/**` imports nothing from `game/`, React, Zustand.
- No code comments (AGENTS.md). Docs in caveman lite, dash `-` never em dash.
- Commit messages without any `Co-Authored-By` line.
- Every film and sandbox and `game.html` play sound.

## Review Focus

- First key press: AudioContext created and resumed inside that gesture; sound from that very press (shot) plays, not lost. Test in Task 3 (`unlock then play in same call starts source`).
- Mute toggled during film or pause: no new voice starts; toggling back does not replay missed cues. Test in Task 3 (`muted play drops cue`).
- Tab hidden or loop paused with voices running: world bus stops, UI bus keeps sound of inventory open. Test in Task 3 (`stopAll world keeps ui`).
- Replay of recorded input: cues follow simulation, so replay produces same cue list. Test in Task 6 (`same input gives same cues`).
- Rapid fire (shot every 2 ticks, beam every tick): voice cap 8 drops oldest, no growth. Test in Task 3 (`ninth voice stops oldest`).

---

### Task 1: Research record and film cue table

Research outputs exist only in session scratchpad `/tmp/claude-1000/-home-pilniczek--Projects-ubuntu-personal-colony2080/ae675bfa-efed-4a14-aff2-cc0a5f7c902b/scratchpad/` (`sfx-map.json`, `calls.txt`, `films.txt`, `loads.txt`, `describe.txt`, `tools/`, `iso_snd.py`). Copy before scratchpad expires.

**Files:**
- Create: `docs/research/reports/17-sound.md`
- Create: `docs/research/tools/sound/` (copied extract and match scripts, plus `isosnd.py`)
- Create (local, gitignored): `docs/research/gamedata/raw/CD/ZVUKY/*.SND`
- Modify: `docs/research/README.md` (Audio row: SFX model, link report 17)

**Interfaces:**
- Produces: report section `Film cues` with one table per mission 1 film id (`missionStart`, `rebelShot`, `talkRebel`, `pullWires`, `wireSwitchboard`, `takeTapHandle`, `searchCorpse`, `tradeHoloPlan`, `tradeShipPart`, `unlockPlasma`, `repairLift`, `openDoor`, `useAcidTank`, `hullCover`, `pickShipPart`, `pickCraneKey`, `pickCrowbar`, `pickController`, `pickEBlaster`, `repairCrane`, `crowbarDoor`): rows `original ANM, frame, SND, rate, vol, voice?`. Film to ANM comes from each `config/cutscenes/<kebab>.json` `source`.
- Produces: list `Film-only sounds` (SND files used by mission 1 film cues that are not voices and not in spec event table).

- [ ] **Step 1:** Extract SNDs: `uv run --with pycdlib python -I docs/research/tools/sound/isosnd.py docs/research/gamedata/raw/CD/Colony28.iso docs/research/gamedata/raw/CD/ZVUKY`. Expected: 146 `.SND` files.
- [ ] **Step 2:** Resolve slots S12-S19 per film: for each film table entry in `films.txt` with `S1x`, find segment loader in `loads.txt` / disassembly that fills slot before that film plays. Mark voice lines (Czech speech: `DEAD*`, `KURVA*`, `OK*`, `RAD*`, `SMICH`, `HEJTY`, `DELEJ`, `POSILA`, `HARD*`, `PIS`, `5MINUT`, `MISTO`, `VYPADNI`, `COTUCH`, `TOTED`, `KDES`, `FAJN`, `TOHLE`, `DECO`, `MIMOZ`, `V1`, `V2`, `ROB_MES`, `KONEC`, `KECY`, `JMENUJI`, `1994`, `*V.SND`). Confirm by listening is impossible: spectrum with formants 300-3000 Hz and syllable rhythm 3-6 Hz = voice.
- [ ] **Step 3:** Write report 17: original model (play call, rates, slots), event table (spec copy plus code addresses), film cues, acoustics per sound (`describe.txt`). Mermaid chart for slot loading.
- [ ] **Step 4:** Verify: `git status` shows no file under `docs/research/gamedata/raw/`; `ls docs/research/gamedata/raw/CD/ZVUKY | wc -l` = 146.
- [ ] **Step 5:** Commit `Record original sound research`.

### Task 2: Synth primitives

**Files:**
- Create: `src/engine/audio/synth.ts`, `src/engine/audio/synth.test.ts`

**Interfaces:**
- Produces:
  - `BASE_RATE = 11025`
  - `seeded(seed: number): () => number` (uniform -1..1, deterministic)
  - `buffer(seconds: number): Float32Array` (length `round(seconds * BASE_RATE)`)
  - `envelope(points: [number, number][]): (t: number) => number` (linear segments, seconds to level, 0 after last)
  - `osc(shape: "sine" | "square" | "saw" | "triangle", freq: (t: number) => number): (t: number) => number` (phase integrated per sample)
  - `onePole(cutoff: number, kind: "low" | "high"): (x: number) => number`
  - `biquad(kind: "low" | "high" | "band", freq: number, q: number): (x: number) => number`
  - `fill(out: Float32Array, fn: (t: number, i: number) => number): Float32Array`
  - `quantize8(samples: Float32Array): Float32Array` (clip to -1..1, round to 256 levels)

- [ ] **Step 1: Failing tests** in `synth.test.ts`: `seeded is deterministic` (two `seeded(7)` give same 100 values, values within -1..1); `buffer length` (`buffer(1).length === 11025`); `envelope interpolates` (`envelope([[0,0],[0.1,1],[0.3,0]])(0.05) ≈ 0.5`, `(0.2) ≈ 0.5`, `(1) === 0`); `osc sine frequency` (1 s of 441 Hz has 882 ± 2 zero crossings); `lowpass attenuates high tone` (RMS of 4000 Hz sine through `onePole(200,"low")` < 0.1 × input RMS); `quantize8 levels` (every output `x * 127.5` within 1e-6 of half-integer grid; `quantize8([2])[0] <= 1`).
- [ ] **Step 2:** `npx vitest run src/engine/audio/synth.test.ts` fails (module missing).
- [ ] **Step 3:** Implement in `synth.ts`.
- [ ] **Step 4:** Tests pass; `npm run lint` passes.
- [ ] **Step 5:** Commit `Add audio synth primitives`.

### Task 3: Mixer

**Files:**
- Create: `src/engine/audio/mixer.ts`, `src/engine/audio/mixer.test.ts`

**Interfaces:**
- Consumes: `BASE_RATE` (Task 2).
- Produces:
  - `type Bus = "world" | "ui"`
  - `interface SoundCue { id: string; rate: number; vol?: number; bus?: Bus }`
  - `interface Mixer { unlock(): void; play(cue: SoundCue): void; stopAll(bus?: Bus): void; setMuted(muted: boolean): void; readonly muted: boolean }`
  - `createMixer(samples: (id: string) => Float32Array, makeContext: () => AudioContext = () => new AudioContext()): Mixer`
  - `MAX_VOICES = 8`

Behaviour: `unlock` creates context once (inside user gesture) and calls `resume()`. Buffers rendered lazily per id and cached (`ctx.createBuffer(1, n, BASE_RATE)`). `play` before unlock or while muted drops cue. Source `playbackRate = rate / BASE_RATE`, gain `(vol ?? 63) / 63`, through bus gain into master. Voice over cap stops oldest. Ended source leaves voice list.

- [ ] **Step 1: Failing tests** with fake context (records `createBufferSource`, `start`, `stop`, `playbackRate.value`, gain values): `play before unlock drops cue`; `unlock then play in same call starts source`; `rate maps to playbackRate` (rate 15000 gives `15000/11025`); `vol maps to gain` (vol 33 gives `33/63`); `muted play drops cue`; `ninth voice stops oldest`; `stopAll world keeps ui`; `samples rendered once per id`.
- [ ] **Step 2:** Tests fail.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Tests and lint pass.
- [ ] **Step 5:** Commit `Add WebAudio mixer with world and UI buses`.

### Task 4: Comparison tool

**Files:**
- Create: `tools/sound/metrics.ts`, `tools/sound/metrics.test.ts`, `tools/sound/compare.ts`, `tools/sound/png.ts`
- Create: `src/game/sound/index.ts` (`SOUNDS = {}` typed `Record<SoundId, () => Float32Array>` with `type SoundId = never` placeholder, `samplesOf`), filled by Task 5
- Modify: `package.json` (script `sound:compare`: `vite-node tools/sound/compare.ts` or `node --experimental-strip-types`, whichever runs TS imports of `src/` here), `vite.config.ts` test include if `tools/**/*.test.ts` not covered.

**Interfaces:**
- Consumes: recipe registry `SOUNDS` through `samplesOf(id)` (empty here, Task 5 fills).
- Produces:
  - `readSnd(path: string): Float32Array` (u8 to -1..1)
  - `envelope(samples: Float32Array, windowMs = 10): Float32Array` (RMS per window at `BASE_RATE`)
  - `envelopeCorrelation(a: Float32Array, b: Float32Array): number` (Pearson of RMS envelopes, shorter padded with 0)
  - `spectralDistance(a: Float32Array, b: Float32Array): number` (mean abs dB difference of 512-point log-magnitude STFT frames, hop 128, floor -60 dB)
  - `centroids(samples: Float32Array): Float32Array`
  - CLI `npm run sound:compare -- [id...]`: table `id | original | samples ratio | envCorr | specDist dB`, writes `<scratch>/sound/<id>.png` (original spectrogram over synth spectrogram); `ORIGINAL_OF` map id to SND name lives in `tools/sound/compare.ts` only (dev tool, not built).

- [ ] **Step 1: Failing tests:** `identical signals correlate 1`; `envelopeCorrelation of shifted noise burst < 0.5 when shifted by burst length`; `spectralDistance identical = 0`; `spectralDistance 440 vs 880 sine > 10`; `readSnd maps 128 to 0 and 255 to ~1`.
- [ ] **Step 2:** Tests fail.
- [ ] **Step 3:** Implement metrics; `png.ts` writes greyscale PNG with `node:zlib` (no new dependency).
- [ ] **Step 4:** Tests pass; `npm run sound:compare` with empty registry exits 0 printing header.
- [ ] **Step 5:** Commit `Add sound comparison tool`.

### Task 5: Recipes: combat

Tuning rule for Tasks 5, 7 and 8 recipes: iterate recipe, run `npm run sound:compare -- <id>`, read the PNG, until `envCorr >= 0.9`, `specDist <= 8` dB and samples ratio within 0.95-1.05. Record final scores in report 17 table `Synth scores`. A recipe that cannot reach a threshold after real effort: record best score and reason, move on.

**Files:**
- Create: `src/game/sound/recipes/combat.ts`, `src/game/sound/recipes.test.ts`
- Modify: `src/game/sound/index.ts`

**Interfaces:**
- Consumes: Task 2 primitives.
- Produces:
  - `type SoundId` (union of every recipe id, grows in Tasks 7 and 8)
  - `SOUNDS: Record<SoundId, () => Float32Array>` (each returns `quantize8` output at `BASE_RATE`)
  - `samplesOf(id: string): Float32Array` (cached; throws on unknown id)
  - Combat ids and originals: `gunShot` STRELBA, `cannon` P1_CANN, `laser` LASER2, `beam` LASER3, `punch` UDER, `explosion` VYBUCH6.

- [ ] **Step 1: Failing tests** in `recipes.test.ts` (loop over `SOUNDS`): `renders deterministic`, `peak within 0.3-1`, `ends silent` (last 10 ms RMS < 0.02), `length matches original` via table `LENGTHS` of original sample counts (from `ls -l` of SND files, bytes = samples; numbers only, no names).
- [ ] **Step 2:** Tests fail.
- [ ] **Step 3:** Write recipes; tune each per rule above.
- [ ] **Step 4:** Tests pass; compare scores meet rule.
- [ ] **Step 5:** Commit `Synthesize combat sounds`.

### Task 6: Cue plumbing, toggle and storage

**Files:**
- Create: `src/game/sound/cues.ts`, `src/game/sound/cues.test.ts`, `src/game/sound/settings.ts`, `src/game/sound/settings.test.ts`
- Modify: `src/game/level/sandboxLevel.ts` (`SandboxWorld.sounds: SoundCue[]`, init `[]`, `resetWorld` keeps queue), `src/game/run.ts`, `src/sandbox/store.ts` (`soundOn: boolean`), `config/controls.json` (`"soundToggle": ["KeyS"]`)

**Interfaces:**
- Consumes: `Mixer`, `SoundCue` (Task 3), `samplesOf` (Task 5).
- Produces:
  - `cue(world: { sounds: SoundCue[] }, id: SoundId, rate: number, vol?: number, bus?: Bus): void`
  - `SOUND_KEY = "c2080.sound"`; `loadSoundOn(): boolean` (default true, storage error = true); `saveSoundOn(on: boolean): void` (errors ignored)
  - Runner: one mixer per page (`createMixer(samplesOf)`); `keydown` and `pointerdown` (capture, before other handlers) call `mixer.unlock()`; after every `stepWorld` and film step, drain `world.sounds` into `mixer.play`; loop pause entering (inventory, map, cheat box, menu, hidden tab) calls `mixer.stopAll("world")`; `soundToggle` key flips store `soundOn`, `saveSoundOn`, `mixer.setMuted`; key ignored while typing in input (`typingTarget`) and while save name typing; key works during films and pause.
  - Sandbox `main.tsx` and `src/play/main.tsx` both get this through `startRun` only.

- [ ] **Step 1: Failing tests:** `cue appends with defaults` (vol 63, bus world); `loadSoundOn default true`; `loadSoundOn reads false`; `loadSoundOn survives throwing storage`; `same input gives same cues` (two worlds from `loadSandbox`, same recorded `InputFrame` list with shooting, `stepWorld` loop collects `world.sounds`, lists equal; uses Task 7 shot cue, so write test now, expect pass after Task 7: mark `it.todo` until then, switch to `it` in Task 7).
- [ ] **Step 2:** Tests fail.
- [ ] **Step 3:** Implement; wire runner.
- [ ] **Step 4:** `npm test`, `npm run typecheck`, `npm run lint` pass. Manual: `npx vite --port 5199 --strictPort`, chrome-devtools: open `game.html`, press `S`, `localStorage["c2080.sound"]` flips.
- [ ] **Step 5:** Commit `Route sound cues from world to mixer, toggle on S`.

### Task 7: Gameplay triggers

**Files:**
- Create: `src/game/sound/recipes/world.ts`, `src/game/sound/triggers.test.ts`
- Modify: `src/game/shots.ts`, `src/game/hero/hero.ts`, `src/game/level/enemy.ts`, `src/game/level/sandboxLevel.ts`, `src/game/level/teleports.ts`, `src/game/level/hazards.ts`, `src/game/level/tasks.ts` (prop state change), `src/game/stepWorld.ts`, `src/game/run.ts` (inventory open, menu keys), `src/game/save/saveMenu.ts` (menu keys), `docs/research/tools/levelmap.py` (EXTRAS hazard `sound`), regenerated `config/levels/jeskyne/map.json`
- Modify: `src/game/sound/index.ts` (ids below)

**Interfaces:**
- Consumes: `cue` (Task 6), combat ids (Task 5).
- Produces new recipe ids and originals: `step` KROK3, `land` SIGNAL, `click` IKONA, `inventory` INVEND, `power` GATE, `siren` SIRENA3, `liftStart` VYTAH1, `liftStop` VYTAH2, `door` DVERE, `grate` MRIZ2, `thunder` HROM, `teleport` TELEPORT, `spark` ZKRAT. Tune per Task 5 rule; extend `LENGTHS`.
- Trigger values (exact):

| Trigger | Cue |
|---|---|
| hero `shot` event | `gunShot` 15000 |
| droid fires, mission `mesto` | none |
| droid fires, other missions | `cannon` 15000 |
| flyer fires | `laser` 15000 |
| hero `beam` event | `beam` 8000 |
| hero `punch` event | `punch` 13000 |
| enemy explodes, guard breaks | `explosion` rate `8000 + floor(rand * 2000)` (seeded world rng, not `Math.random`, so replay matches) |
| live hero energy < 20 | `siren` 8500 vol 34, first at drop below, then every 15 s (user request) |
| shield spent in `damage` | `power` 20000 |
| foot contact in walk or run gait, not while firing | `step` vol 33, rate alternates 10000 / 9400 |
| landing from fall or jump | `land` 8500 vol 44 |
| lift `target` set from null | `liftStart` 8000 |
| lift reaches `target` | `liftStop` 8000 |
| prop opens, door asset | `door` 11000 |
| prop opens, grate or gate asset | `grate` 18000 |
| `quickSwitch` or auto weapon switch | `click` 20000 vol 45, bus ui |
| inventory screen opens | `stopAll()`, then `inventory` 8000, bus ui |
| pause menu and game over move or confirm | `click` 5500 vol 33, bus ui |
| mesto, not filming | `thunder` 9000 at random 8-20 s gaps (seeded) |
| teleport pad use | `teleport` 13000 |
| hero in hazard with `sound: "spark"` | `spark` 12000 every 0.3125 s |

  Door vs grate: list per prop asset id in `src/game/sound/props.ts` (`OPEN_SOUND: Partial<Record<AssetId, SoundId>>`), props without entry silent. Foot contact: gait stance start of each leg (phase crosses `0` and `0.5` of gait cycle in `hero/gait.ts` terms); builder exposes `footContacts(prev, next): number`.

- [ ] **Step 1: Failing tests** in `triggers.test.ts`, one per table row, each building sandbox world (`loadSandbox`, or `loadMission` for mission rows), driving state, asserting `world.sounds` contents: e.g. `hero shot cues gunShot 15000`, `mesto droid shot is silent`, `vesnice droid shot cues cannon`, `steps alternate rates`, `no step while firing`, `siren repeats every 15 s below 20 energy`, `lift start and stop`, `explosion rate within 8000-9999`, `spark only on marked hazard`, `inventory open stops world then cues ui inventory`. Switch Task 6 `same input gives same cues` from `it.todo` to `it`.
- [ ] **Step 2:** Tests fail.
- [ ] **Step 3:** Recipes, then triggers. Regenerate jeskyne map with `levelmap.py` (args per CLAUDE.md), check diff touches only hazard `sound`.
- [ ] **Step 4:** `npm test`, typecheck, lint pass. Manual in `game.html` and `game.html?mission=vesnice`: shoot, walk, punch, ride lift, kill droid, open inventory; listen through chrome-devtools is impossible, so check cue log: `window.__sounds` dev helper in `src/play/originalOverlay.ts` returns last 50 cues.
- [ ] **Step 5:** Commit `Play gameplay sound effects`.

### Task 8: Film cues

**Files:**
- Create: `src/game/sound/recipes/film.ts` (film-only ids from Task 1 list, English names), `src/game/cutscene/sounds.test.ts`
- Modify: `src/game/cutscene/play.ts`, cutscene config loader (wherever `views` is parsed), each mission 1 `config/cutscenes/<kebab>.json` with cues, `node spikes/shared/build-config.mjs` output

**Interfaces:**
- Consumes: Task 1 film cue table, `cue` (Task 6).
- Produces: config field `"sounds": [[t, id, rate, vol?], ...]` (t seconds of film time, sorted). Film time of original frame comes from film's existing original-frame mapping (`ref` in spike scripts, `ORIGINALS.cutscenes.<id>`): t where mapped frame first reaches cue frame. `stepCutscene` cues every entry with `prevT < t <= film.t`, starting cues at `t = 0` on first step; skip cues nothing further. Voice cues omitted.

- [ ] **Step 1: Failing tests:** `film cues fire when time crosses`; `cue at 0 fires on first step`; `skip drops later cues`; `every film cue id is a SoundId` (loop over all cutscene configs); `cue times within film duration`.
- [ ] **Step 2:** Tests fail.
- [ ] **Step 3:** Film-only recipes (tune per Task 5 rule), config cues, playback.
- [ ] **Step 4:** Tests pass; sandbox Films panel plays `pickCrowbar` with cues in `window.__sounds`.
- [ ] **Step 5:** Commit `Play film sound cues`.

### Task 9: HUD icons and sound plate

**Files:**
- Modify: `src/game/hud/layout.ts` (`TopBar.sound`, `soundW`; sound plate `RUN_W` wide left of run plate, own gaps; badge takes leftover), `src/game/hud/svg.ts` (`HudState.soundOn`, `HudKeys.sound`; `runIcon()` running figure replaces `RUN` readout; `soundIcon(on)` speaker with two waves, off: speaker with `x`; amber `READOUT` colour, `iconGlow` when on, `iconDim` when off), `src/sandbox/ui/Hud.tsx` (keys, `soundOn` from store, memo deps), `spikes/hud-design/index.html` (same change)
- Test: `src/game/hud/layout.test.ts`, `src/game/hud/svg.test.ts` (existing or new)

**Interfaces:**
- Consumes: store `soundOn` (Task 6), `soundToggle` binding.
- Produces: HUD shows `S` key tab under sound plate, lit when on.

- [ ] **Step 1: Failing tests:** `sound plate sits left of run plate with GAP` (for W 320 and 520: `sound + soundW + PLATE_PAD + GAP + PLATE_PAD === run`); `plates do not overlap at 320`; `svg has no RUN text`; `svg sound off draws cross` (marker attribute `data-sound="off"`); `S key tab lit when on`.
- [ ] **Step 2:** Tests fail.
- [ ] **Step 3:** Implement; same art in hud-design spike.
- [ ] **Step 4:** Tests pass. Screenshot `game.html` at 320x200 and 1280x720 with chrome-devtools, read images: both icons legible, no overlap with badge.
- [ ] **Step 5:** Commit `Show run and sound icons in HUD`.

### Task 10: Sound sheet, production guard, docs

**Files:**
- Create: `spikes/sound-design/index.html`, `spikes/shared/build-sounds.mjs` (rolldown bundle of `src/game/sound/index.ts` to classic `spikes/shared/sounds.js`, `window.C28_SOUNDS = { SOUNDS, BASE_RATE }`)
- Modify: `scripts/production.ts` (`ORIGINAL_GAME` adds `/\.snd\b/i`, `/zvuky/i`, `/strelba|kulomet|vybuch|vytah|sirena|invend|p1_cann/i`), `scripts/production.test.ts` if present, `index.html` dev links (sound sheet), `CLAUDE.md` (sound section: `src/engine/audio/`, `src/game/sound/`, cues, `S` key, `npm run sound:compare`, spike rebuild command), `docs/requirements.md` (decision: synthesized SFX, no music, no voices)

**Interfaces:**
- Consumes: `SOUNDS`, `BASE_RATE`.
- Produces: sheet lists every `SoundId` with play button (rate input default = event rate), waveform and spectrogram canvas; `<!-- originals -->` block adds original play button and spectrogram from `docs/research/gamedata/raw/CD/ZVUKY/` through `ORIGINALS.src`.

- [ ] **Step 1:** Write failing production test: `scrub rejects SND names` (text with `KROK3.SND` reported as leak).
- [ ] **Step 2:** Test fails, then add patterns, passes.
- [ ] **Step 3:** Build sheet and bundle script; run `node spikes/shared/build-sounds.mjs`.
- [ ] **Step 4:** `npm run build` passes leak check; `npx vite build && npx vite preview --port 5198 --strictPort`, chrome-devtools: sheet page production variant has no original panel; dev variant plays both.
- [ ] **Step 5:** Commit `Add sound design sheet and guard originals in build`.
