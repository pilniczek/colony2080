# Colony 28 - level design and missions research

Confidence: LOW for first-mission detail (no text walkthrough or accessible video transcript found), MEDIUM for overall structure.

## Key finding
The Steam release (2026-02-20) is a re-release of the 1996/1997 DOS game, not a new game. Original: MS-DOS, Napoleon Games / 5th Dimension, JRC Interactive, June 1997. Wikipedia: https://en.wikipedia.org/wiki/Colony_28 . Steam: https://store.steampowered.com/app/4381340/Colony_28/ . The original is the best source for a clone brief (abandonware ISO and archive.org copy exist, and the demo has one playable level: https://www.dosgamesarchive.com/download/colony-28 , https://archive.org/details/msdos_Colony_28_1997 ).

## Structure (sourced)
- 8 levels. Steam short description via https://store.steampowered.com/api/appdetails?appids=4381340 ("8 sprawling levels"). Store text: "sprawling, labyrinthine sectors of a desolate mining colony".
- Linear level sequence, each level has several tasks; finishing them advances to next level. Wikipedia (above): "multiple tasks that player has to fulfill in every level. Once they complete the tasks, they move to the next level." Task contents NOT enumerated anywhere I could reach.
- Not a hub, not a metroidvania world. Each level is a self-contained explorable side-scrolling area (inferred from review below).
- Review (Kimimi): free exploration in any direction, "pleasantly small and easily navigated areas", items spread over vertical and horizontal space, a map can be called up, each stage ends with a pre-rendered video, one ammo crate per stage, enemies at fixed spots and once killed stay dead ("when they're gone, they're gone for good"), puzzles use found items, finale is a short pre-rendered 3D first-person dungeon crawl with no traditional boss. https://kimimithegameeatingshemonster.com/2026/03/06/colony-28-a-czech-wonder-finally-released-worldwide/ (fetched via summarizer; quotes are as returned, not verified verbatim)
- Gameplay per Wikipedia: inventory, a few riddles, combat is "Hide and Shoot" (cover mechanic). Inspired by Another World and Flashback. DOSGamesArchive: similar to cinematic platformers like Flashback, "full version includes cover mechanics similar to Blackthorne", pre-rendered sprites, CGI cutscenes.
- Difficulty high (Petr Bulir, via Wikipedia). Steam version crashes especially on loading a save (Steam search summary of a review; weak source).
- Steam features: tactical combat vs mechanical sentries, colored keycards open matching colored doors, hazardous traps, map callable anytime. Hazard types (spikes/pits/lava) not itemised anywhere. Colored keycards claim comes from a search-engine summary of the store page, not seen in the raw store text (the raw text only says "keycards"). https://store.steampowered.com/app/4381340/Colony_28/

## Story / setting
Earth invaded 2013 (Wikipedia) / game set 2028 (Steam), humanity turned into android workers, Earth renamed Colony 28. Player is a combat droid whose control chip malfunctioned so he keeps human mind, joins resistance. https://en.wikipedia.org/wiki/Colony_28 , Steam page.

## First mission
- Level 1 is a CITY ("mesto" in Czech). Only evidence: YouTube title "Colony 28 - Intro + Level 1 (mesto) - Gameplay" https://www.youtube.com/watch?v=5r7Yie502C0 . Page body, description, chapters and comments could not be fetched (WebFetch returns only footer). Also https://www.youtube.com/watch?v=UcF9R9PrypE "Colony 28 gameplay (PC Game, 1997)" - same failure.
- Room sequence, enemies, items, puzzles, tutorial prompts, checkpoints, boss, length, ending: NOT FOUND.
- Plausible first-level look from screenshots (inferred): ruined city, rust-red sky, steel girders and cranes, ruined skyline (screenshot 0 and 5); hanging crane beam platform; enemy lightning/laser fire; explosions.
- Note: the store screenshots with jungle/overgrown scenes (crashed helicopter, wrecked car, fence, ruined building) are probably a different level; which level is unknown.

## Store screenshots (viewed directly, 9 total; URLs from https://store.steampowered.com/api/appdetails?appids=4381340 ; downloaded copies in docs/research/images/steam-shots/s0-s8.jpg)
Common HUD (all gameplay shots): framed viewport roughly 16:9-ish inside a metal-frame border. Top bar: left weapon icon + counter "n:305" style (ammo, 3-digit), center a brownish oval icon (inferred: item/energy), second weapon with counter, centre logo "C28", right box showing held item (a hand icon when empty; "ELEKTROMAGNET" text in shot 2). Left edge vertical meter with "E" icon at bottom, right edge vertical segmented meter with a round icon (inferred: energy/shield). Pixel art, 256-color look, low-res scaled.
- s0: ruined city at dusk, hanging steel crane beam as upper platform, player (orange-yellow bipedal droid, side view, aiming a gun left/right) firing a lightning-like beam at an exploding enemy. Ammo 305 / 146.
- s1: overgrown jungle area, crashed helicopter wreck, girder platform above, a gun turret/dome sentry on the right and a crawler bot on the left; stone-block ground strip. Ammo 072.
- s2: indoor metal corridor, vertical ladder/pipe, hazard-stripe floor plate, a humanoid enemy on left being exploded, player on a railed platform; item slot reads "ELEKTROMAGNET"; ammo 036 and 250. Door recesses in wall.
- s3: cave/organic ribbed tunnel with metal supports, small spider-like walker/tripod bot on the right; two weapons incl. shotgun-like; ammo 109 / 000.
- s4: inventory/status screen (Czech): left panel INVENTAR with items KLIC (key), HOLOG. PLAN (holographic plan), NAKRES (sketch), DEKODER (decoder); right panel "X-BOT STATISTIKA" with body diagram showing energy 83%, shields; ammo counts x305, x0, x0, EXTRA x156; large 3D-rendered brown robot and a key image. Confirms inventory + key items.
- s5: ruined city again, player in crouch/cover facing a building with barred windows, a missile flying in from right. Ammo 344.
- s6: jungle with fence under a wooden/stone structure, player shooting a blue crawler bot that fires back. Ammo 698/229.
- s7: jungle, rusted girder tower with vertical stone ledge stairs on left, wrecked yellow car on right with an enemy bot; ammo 229.
- s8: end/menu-like scene: two yellow droids hanging on red cables in a bay, an explosion, text "KONEC HRY" (game over), vertical elevator/gauge on right.
From screenshots (inferred): smooth/horizontal scroll side view, single flat floor with raised girders; 2D with ladders/pipes; crouch/cover; enemy types: humanoid soldier, crawler, dome turret, spider walker, flying missile.

## What was tried and failed
- WebFetch 403: nichegamer.com, pcgamingwiki.com, mobygames.com. YouTube pages return no content via WebFetch (no transcripts reachable). Steam community discussions only have 4 topics (Nostalgie, war robots, Gamepad, GFX filter), no guides: https://steamcommunity.com/app/4381340/discussions/ . herni-dabing.cz has voice cast only. Reddit/Twitch not found via search. No text walkthrough found (GameFAQs page listed: https://gamefaqs.gamespot.com/pc/220481-colony-28 , not fetched).
- Not tried / worth trying: play the demo/abandonware in DOSBox and record Level 1; archive.org "Level Speciál 98.2" (https://archive.org/details/czlevelspecial982) contains the game; Czech magazines (Level, Score) reviews; yt-dlp for captions of the two YouTube videos if installed.
