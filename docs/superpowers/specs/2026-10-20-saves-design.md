# Saves, pause menu and game over

## Intent

Mission 1 has no saves: a death resets every task. The user wants saves like the original game (decided earlier: manual save and load any time, 5 slots), kept in the browser, and a death that leads back to the last save instead of a full reset.

## Goals

- Esc opens a pause menu over the frozen game, like the original (user). Entries (Claude's call, the original also had music off and game speed; there is no music):
  - Save game
  - Load game
  - Back to mission select
  - Esc again closes the menu.
- Save and load show 5 slots, A to E (user).
  - A slot name is the mission name prefix (`City - `) plus text the player types (user). Empty text keeps just the prefix.
  - Each filled slot shows a small picture of the saved game view and the save time (Claude's guess after the original's live preview).
  - Saving onto a filled slot overwrites it after one confirm (Claude's call).
  - Load lists all 5 slots; empty and other-mission slots cannot be loaded (Claude's call).
- A save holds the whole mission state: hero (position, facing, weapon, energy, shields, ammo, E-Blaster ammo, run mode), inventory and shown item, flags and done tasks, prop states (taken items, opened doors, shot covers), lift positions, enemies (alive, position, hits), and the explored fog.
- Saves live in `localStorage` (user), one entry per slot, versioned so an incompatible save is refused with a message instead of breaking the game.
- Death (user):
  - After the death animation, **GAME OVER** shows over the frozen game in the original style: chunky white capitals with a blue outline. English text (the published site never shows the original's Czech).
  - Two choices under it: **Load last save** (the most recent save of this mission, any slot) and **End** (back to mission select).
  - With no save of this mission the first choice is **Restart mission** (Claude's guess).
- The menu, slot list, typing and game-over screen are designed in a spike first (`spikes/hud-design/`, same look as the inventory screen), then built into the game (project rule).

## Non-goals

- Music and game speed entries.
- Cloud or cross-device saves, export or import.
- Quicksave key.
- Saves in the sandbox (Claude's call: the sandbox has its own record and replay; the menu may still open there but save and load stay mission-only).

## Anti-goals

- A broken or old save that crashes the game or leaves it half loaded (the original was known for crashing on load).
- Losing a save because the browser storage throws (private mode, quota): the menu says the save failed, the game goes on.
- Any original-game name or Czech text in the published build.

## Constraints

- The game loop stays paused while the menu or game over is open; input goes only to the screen (as the inventory screen does: capture-phase key handler, only its own keys).
- Esc also closes the inventory and map screens and skips a cutscene; the menu opens only when none of those is active.
- Loading rebuilds the world from config plus the saved state; it must not depend on object identity from before the load.
- `localStorage` access is wrapped so a throwing or missing storage never breaks the page.
- No code comments; docs in caveman lite.

## Builder check calls (Claude's, user said implement)

- A save holds the full hero object (state machine state, ladder `climb`, lift link, hit age) and every lift's `y` and `target`, so a hero saved mid-jump or on a ladder loads exactly there. Save is greyed out while the hero is dead (death states) or a cutscene plays.
- Game over is a `startRun` option: `game.html` uses it, the sandbox keeps its automatic respawn.
- Restart mission is today's death reset (`resetWorld`, the hero keeps ammo, E-Blaster ammo, weapon and run mode).
- Load from the mission select page: a mission bar with saves opens a dropdown (New game, saves newest first); a save opens `game.html?slot=X` (2026-10-20).
- A save carries `SAVE_VERSION` (bumped by hand when the save shape changes) and the mission's prop, lift and enemy counts; a load refuses a save whose version or counts differ, with a message ("This save does not fit this version of the mission.").

## Left to the builder

- Save format and module layout (e.g. `src/game/save/`), and how world state is serialized.
- The picture size and format stored per slot (keep each slot small).
- Exact menu look and the game-over font build, tuned in the spike.
- Keys inside the menu (arrows and Enter like the inventory screen, typing for the name).
