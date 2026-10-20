# Crowbar cutscene in the game

## Intent

The crowbar door clip exists only as a spike (`spikes/shared/cutscenes.js`, `config/cutscenes/crowbar-door.json`). The game plays a short hand-move use clip instead. The user wants the real cutscene in the game: a whole-screen film that feels like a security camera feed, with the game frozen under it. This is the first piece of the cutscene framework (phase 2 in `docs/superpowers/specs/2026-10-17-colony2080-design.md`), so the parts that are not crowbar-specific must be reusable by the next cutscenes.

## Goals

- A use whose task names a cutscene plays that cutscene instead of the use clip (user).
- The cutscene fills the whole screen, HUD frame included (user: "whole-screen movie style").
- Every in-game event pauses while it plays: enemies, flyers, guards, bullets, beams, lifts, fog, respawn timers. Nothing can hurt the hero (user).
- When it ends, the task result applies (state change, `gives`, subtitle) and play continues where it stopped.
- Sandbox: a train door at column 15.5 on the spawn floor (row 14), 8 tiles right of the spawn, plays the crowbar cutscene when used with the crowbar (user; asked for about 10 tiles, column 17.5 is the bottom stop of the lift at columns 17-19). The crowbar already lies at column 9.5, the crane key at 13.5.
- Mission 1: `openTrainDoor` plays the same cutscene (Claude's call, both pages share `startRun`).
- Security camera look (Claude's suggestion, accepted by the user):
  - Hard cuts between the shots the clip already has (B profile, C back), camera moves as in the agreed tracks.
  - Washed-out, slightly green-grey tint over the scene.
  - Scanlines, light animated noise, soft vignette.
  - Blinking red `REC` dot and a running timestamp in a corner, a camera label (e.g. `CAM 03 METRO`) in another, in the HUD mono font (Share Tech Mono).
- A skip key ends the cutscene at once and applies the task (Claude's suggestion, accepted): Enter or Esc.
- Crowbar polish (from `docs/requirements.md` Open):
  - Hand height matches across the cut: shot C keeps its hip-level grip, the shot B arm raise comes down to match (user).
  - Larger shot C pry pull (`pullForeDeg`) so the door visibly follows it.
  - Grip order and hand spacing match across the cut: shot B widens to the shot C two-handed grip (about 367 model units, now 78) (user).
  - The crowbar stays inside the shot B frame (it pokes out at the top around 2.7 s).

## Non-goals

- Other cutscenes (intro, dying rebel, other item uses).
- Saves (separate project, next).
- Sound.
- Scrubbing, speed or palette tools in the game (they stay in the spike player).

## Anti-goals

- The game advancing under the cutscene in any way (an enemy shot landing, a flyer moving, fog changing).
- Any reference to the original game in the published build (labels, file names, frames); the spike `ref` frames stay behind `spikes/shared/originals.js`.
- A cutscene that cannot be replayed deterministically from a recorded input log in the sandbox.

## Constraints

- Spikes are the design source: polish the crowbar clip and design the security camera overlay in the spike first (`spikes/shared/cutscenes.js`, played by `spikes/movement/interaction.html`), then port to TypeScript. `npm run test:visual` gets a case comparing spike and port frames at several clip times, as for the robot and env assets.
- The robot in the cutscene uses the existing ported robot model (`src/game/robot/`), not a copy of `xbot.js`.
- Track data stays in `config/cutscenes/crowbar-door.json`; the agreed motion changes only where the polish list says.
- Cutscene time advances in fixed steps of the game loop, so a recorded run replays the same.
- `src/engine/` stays game-agnostic: a generic keyframe track sampler may live there; the crowbar scene and the overlay live in `src/game/`.
- No code comments; docs in caveman lite.

## Decided how

- Trigger: a task in `config/levels/*/tasks.json` (and the sandbox config) gets an optional `cutscene` id. The use press that would run that task starts the cutscene instead of the use clip.
- The task result is applied when the cutscene ends or is skipped, not at its start.
- The overlay draws over the whole screen canvas; the React HUD, subtitle and inventory layers are hidden while it plays.
- The 1600 x 900 stage is letterboxed with black bars on other screen shapes, like a camera feed, so the robot and the door seam never get cropped (Claude's call). In the sandbox it covers the game and HUD area; the debug panel stays usable (Claude's call).
- Work stops after the spike step (polish and overlay) for the user's review; the port starts after approval (Claude's call: the crowbar motion was agreed by the user, so changes to it go back to the user).
- Enter is both use and skip: a skip counts only for a press that starts after the cutscene began (Claude's call).

## Left to the builder

- Module layout under `src/game/` and how `startRun` switches between play and cutscene.
- How the sandbox gets a task web for its train door (the sandbox config has props but may need a task list).
- Exact overlay values (tint, scanline spacing, noise amount, timestamp format, label text), tuned in the spike.
- How each polish item is solved, within the agreed motion.
- The hero pose and facing after the cutscene.
