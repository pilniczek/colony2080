# Colony 28 - official info report

KEY FINDING: Colony 28 is NOT a new game. It is a 1996/97 Czech MS-DOS 2D side-scrolling action platformer (Another World / Flashback style), re-released on Steam 2026-02-20 as a DOSBox-wrapped original (inferred from DOSBox mention in secondary source). A "faithful clone" = clone the 1997 DOS game, not a modern title.

## Steam store (source: https://store.steampowered.com/api/appdetails?appids=4381340 ; page https://store.steampowered.com/app/4381340/Colony_28/)
- App ID 4381340, type game. Developer: 5th Dimension. Publisher: Jindrich Skeldal. 
- Release: Feb 20, 2026. Full release (not Early Access; none indicated). Not coming soon.
- Price: $4.99 USD (API, cc=us). Steambase showed $3.99 sale (https://steambase.io/games/colony-28/info).
- Platforms: Windows only (API). Steambase claims Win/Mac/Linux - conflicts; trust API.
- Genre: Action. Categories: Single-player, Family Sharing.
- Store tags (page HTML): Action, Arcade, 2D Platformer, 2D, 1990's, Retro, Singleplayer.
- Languages: Czech only, with full audio.
- Age ratings: DEJUS 10, Steam Germany 12, IGRS 13 (violence).
- Support: https://www.skeldal.com, email on API (omitted). Website field: null.
- DLC: none. Achievements: none (global achievements API returned {}; API lists none). Steam news/devlogs: none (ISteamNews returned 0 items; events API empty).
- Trailer: one video, "Colony 28 gameplay" (movie id 257275548), gameplay footage. Not viewed (inferred content from title).
- Reviews: 4 user reviews, all positive (Steam appreviews API). Reviewers recall the yellow robot protagonist, Terminator-like intro animation, high difficulty, "Earth 2140" comparison.

### System requirements (API)
Min: Windows 10, Pentium II 350MHz, 640 MB RAM, any graphics, 500 MB storage, any sound card. Rec: same with Pentium II 750MHz. Mac/Linux: none.

### Store description (verbatim, HTML stripped)
Short: "Colony 28 is a raw piece of Czech gaming history. Step into the circuits of a malfunctioning android, defy your alien masters, and fight for humanity's remnants across 8 sprawling levels. Experience an authentic 90s sci-fi classic in its original Czech version."

Long: "Colony 28 is an original Czech arcade-adventure from 1996. It is the very first game developed by Karel Matejka (Ko.dll), the author of the phenomenal BZZZT. Please keep in mind that this is not 'retro' - it is a truly old game. Not to mention, it is only available in the Czech language.
Relive a cult classic of Czech sci-fi gaming history: The year is 2028. Earth is in ruins, and the remnants of humanity struggle to survive in the harsh environments of space colonies. After an alien invasion, humankind was transformed into a working android army dedicated to draining the planet's resources. You wake up inside the chassis of a combat droid on Colony 28 (Earth), but your mind remains human. You are the final hope for the resistance against a tyrannical reign of machines and corporations.
Gameplay: Colony 28 is a classic 2D action platformer known for its gripping atmosphere and challenging gameplay. Experience the journey of a soul trapped in steel, fighting to reclaim a future for mankind.
Key Features: Authentic Retro Sci-Fi (dark industrial visuals, haunting soundtrack); Tactical Combat (blast mechanical sentries; finding keycards and navigating hazardous traps as vital as shooting); Intricate Level Design (sprawling, labyrinthine sectors of a desolate mining colony); A Piece of Gaming History (originally Czech release, optimized for modern PC players)."

Note: store says year 2028 and "Karel Matejka"; Wikipedia says invasion in 2013, game 5 years later (2018) and leader "Martin Matejka" - discrepancy in sources.

## Original game facts (source: https://en.wikipedia.org/wiki/Colony_28 raw wikitext)
- MS-DOS, developer 5th Dimension team (lead Martin Matejka) / Napoleon Games; publisher JRC Interactive; June 1997 (Level magazine 5/1997). Designer Martin Matejka; composers Martin Matejka, Petr Klabik. Genre platform. Single-player. Engine: not stated.
- Plot: aliens conquer Earth in 2013, rename it Colony 28, humans turned to obedient androids; protagonist cyborg keeps memories due to malfunction, joins human resistance.
- Gameplay: side-scrolling; shoot enemies; multiple tasks per level then next level. Influences: Another World, Flashback. Level magazine 60%: praised atmosphere, music, story/ending; criticized animations/graphics; high difficulty.
- Demo: pre-release 1996-09-26, Score magazine coverdisk 36 (Dec 1996), colony28.exe 15,755,967 bytes; Czech; uses Gravis Ultrasound sound (https://proxy.archived.software/QmP7ucLdfzXxUkf6DpY5cRgQTwq1UZGUWaAMdUcKAbUjDX/5dtHY74iG21hPD67JMW14a5PdqQW2U/raw/COLONY28-Info-Card.txt, fetched via curl -k).
- Mechanics from a review (https://kimimithegameeatingshemonster.com/2026/03/06/colony-28-a-czech-wonder-finally-released-worldwide/): non-linear exploration (tunnels, locked doors); SMG with limited ammo plus strong special weapons; infinite punch/kick; "cover" mechanic = invulnerable while stationary; one ammo crate per stage, sparse health; puzzles like dissolving robots with acid, grenades to open paths, observing enemy behaviour; pre-rendered CGI cutscenes between areas; finale is a pre-rendered 3D first-person dungeon crawl, video-based, no classic boss; Steam version crashes often when loading saves, frequent saving mitigates; keycards and traps (store text).
- Steam release comes with a DOSBox wrapper (web search summary, source Steambase/aggregator; not verified on depot).

## Not found / tried
- SteamDB (https://steamdb.info/app/4381340/): 403. Depot files/engine unverifiable. Engine: original is DOS native (inferred); Steam build is DOSBox-wrapped (secondary source).
- MobyGames: 403. skeldal.com: only lists Colony 28 as portfolio item with Steam link (https://www.skeldal.com). No press kit, dedicated site, Discord, X/Bluesky/YouTube found for the game. SteamSpy: owners 0..20,000, language Czech.
- Did not view the trailer video or screenshots. Not fetched: databaze-her.cz, oldgames.sk Level/Score scans (https://www.oldgames.sk/mag/level-28/page/15/ , https://www.oldgames.sk/mag/score-34/page/25/) - recommended for level/enemy detail; archive.org score1296 for demo files; Czech YouTube playthroughs.
- Raw API dump saved at scratchpad/research/api.json.
