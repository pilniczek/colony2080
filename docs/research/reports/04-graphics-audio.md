# Colony 28 - graphics, art, camera, audio research

Scope: what could be established from public sources. Screenshots in `screens/` (s0..s8.jpg, 1920x1080 downloads from Steam appdetails). Viewed: s0, s1, s2, s3, s5, s6, s8. Not viewed: s4, s7 (downloaded only).

## Basic facts
- Steam page: dev "5th Dimension", publisher "Jindrich Skeldal", released 20 Feb 2026, genre Action, single-player, Czech only. Source: https://store.steampowered.com/api/appdetails?appids=4381340
- Steam text says "original Czech arcade-adventure from 1996", "classic 2D action platformer", 8 levels, keycards, traps, mechanical sentries, "dark industrial visuals and haunting soundtrack". Same source.
- Steam min reqs: Pentium II 350 MHz, 640 MB RAM, "Graphics: any", "Sound card: any" -> it is the original DOS game re-released (inferred: wrapped DOS exe). Same source.
- Original: MS-DOS, Napoleon Games / 5th Dimension team (lead Martin Matejka), publisher JRC Interactive, June 1997 (some sources say 1996). Source: https://en.wikipedia.org/wiki/Colony_28 ; https://www.mobygames.com/game/756/colony-28/ (via search snippet; page itself returned 403).
- Steam page text names the author "Karel Matejka (Ko.dll)"; Wikipedia/MobyGames say Martin Matejka. Discrepancy, unresolved.
- Archive release is run in DOSBox (COL28.BAT). Source: https://proxy.archived.software/QmP7ucLdfzXxUkf6DpY5cRgQTwq1UZGUWaAMdUcKAbUjDX (search snippet).
- Engine: custom DOS engine (inferred; 1997 DOS game, no engine named anywhere). SteamDB not fetched (not attempted; likely blocked), so no engine detection.

## Inspirations / reception
- "Inspired by Another World and Flashback" (cinematic platformer). Source: https://en.wikipedia.org/wiki/Colony_28
- Level magazine reviewer Petr Bulir: 60%, praised "atmosphere and music", criticised animations and graphics, high difficulty. Source: Wikipedia, same URL.
- MobyGames snippet: "good graphics previously unseen in any Czech game", rendered (CGI) cutscenes, pre-rendered sprites; "best Czech game of the year 97". Source: search snippet of https://www.mobygames.com/game/756/colony-28/
- 2026 blog review: "exquisitely pixelled" environments (e.g. crashed helicopter wreck), pre-rendered 3D first-person dungeon-crawl finale with FMV transitions, cover mechanic, crashes on loading saves, no classic boss fight. Source: https://kimimithegameeatingshemonster.com/2026/03/06/colony-28-a-czech-wonder-finally-released-worldwide/
- Cover mechanic: key hides player in background, completely invulnerable, unlimited time. Source: search snippet (MobyGames/Wikipedia description) of https://www.mobygames.com/game/756/colony-28/

## Audio
- Composers: Martin Matejka and Petr Klabik. Source: search snippet of MobyGames (https://www.mobygames.com/game/756/colony-28/). Sound card "any" (Steam source above).
- Style: dark industrial / atmospheric (Steam text "haunting soundtrack"; Level review praises music). No instrument/format details found (likely MOD/tracker or Sound Blaster FM/PCM; inferred, unverified). SFX not documented in text; screenshots imply gunfire, explosions, energy beam, hum of machinery (inferred).

## Resolution and scale
- MobyGames screenshots listed as 320x200 (search snippet, https://www.mobygames.com/game/756/colony-28/). Consistent with VGA mode 13h, 256 colours (inferred).
- Steam screenshots: s0, s5 are 1920x1080 (16:9, window stretched with side bars); s1,s2,s3,s6,s8 show frame 1728x1080 (16:10 = 320x200 ratio) with black pillars beyond. Pixel blocks visible ~5.4 px each = 1728/320 (inferred).
- So native 320x200, 16:10, integer-ish upscale with nearest neighbour; recommended web clone: 320x200 canvas, image-rendering: pixelated.

## Screenshot descriptions (all paths under docs/research/images/steam-screens/)
- Common HUD (all shots): metallic riveted frame around playfield. Top bar ~12% height: left panel = weapon icon (pistol-like) + amber 7-seg style ammo "N:072"-type counter, portrait of player (head) in centre; second weapon icon + counter on right when a second weapon owned; centre badge "C28" in chrome lettering; right panel = inventory slot showing an amber hand icon (empty) or item name text (e.g. "ELEKTROMAGNET"). Amber/yellow grid (dot matrix) backgrounds. Small red tick under the active weapon slot. Left edge: vertical energy/health bar (black tube, orange-yellow fill, red marker at left), bottom-left "E" key box. Right edge: vertical segmented green/yellow bar (ammo/shield level), bottom-right "S" box. Right/left sides carry circuit-board pattern art. Numbers use blocky pixel font with "N:" prefix, amber on dark. In-world text (labels like "DEA", "KONEC HRY") is blue-outlined white blocky pixel capitals with diacritic-free Czech.
- s0.jpg: 16:9 variant. Rust-red cloudy sky with dark silhouettes of ruined city; steel girder hung on chains and truss tower; brick/metal floor strip. Player in yellow-orange armoured robot, kneeling/crouch aiming right, firing a blue-white lightning/chain beam left across screen; big orange cartoon-pixel explosion cluster. Counters 305 / 146.
- s1.jpg: green overgrown jungle backdrop (blurred photo-like trees, teal/green), rusty crashed helicopter wreck with moss at left, riveted brown catwalk top, grey cobblestone floor with yellow-black hazard dots. Player standing with rifle; enemy turret dome (silver mushroom on tracks) right; dolphin-like grey drone left. Ammo 072.
- s2.jpg: dark cave with orange rock-ribs or machine drum, green-grey steel panels, chains from ceiling; player crouching firing a pointed-bolt weapon; small walker enemy. Ammo 109 / 000.
- s3.jpg: industrial grey metal interior with panel textures, spotlit wall alcoves (vignette lighting baked into backgrounds), vertical ladder-rail; floor with yellow-black hazard strips. Player firing white plasma blobs; human soldier enemy at left hit by orange explosion. Item text "ELEKTROMAGNET", "DEA" label.
- s5.jpg: 16:9. Red sky, concrete building with broken glittery windows, player seen from behind/in cover (back to camera in background layer, evidencing cover mechanic), flying silver missile/drone right. Ammo 344.
- s6.jpg: ruined colonnaded building, chain-link fence drawn with dithered checkerboard transparency (player and enemies visible through the fence), mossy ground. Player crouching firing; muzzle flash orange ball; blue enemy crawling, burning. Ammo 698 / 229.
- s8.jpg: "KONEC HRY" (game over) text over an explosion between two hanging yellow robot suits on a teal-and-dark industrial wall, lit door with white light bar. Shows the player robot design: yellow armoured humanoid with grey joints.
- Art style (from the above): hand-painted/photo-sourced backgrounds plus pre-rendered 3D-style sprites, 256-colour palette dominated by rust orange, olive/steel green, grey and black, with amber UI. Dithering used for transparency (fence) and gradients. Large character sprite: player roughly 40 px tall at 320x200 (about 1/4 of playfield height; inferred from ~250 px tall at 5.4x). Floor line at about 83% of playfield height; ground tiles look like 32-px-wide repeating pieces (cobbles ~ 130 px / 5.4 = 24 px; inferred, uncertain).
- Playfield on-screen: left 86 to right 1642 of 1728 = ~288 px wide, top 140 to bottom 1035 = ~165 px tall at 320x200 (inferred).

## Camera / animation (limited)
- Strict side view, 2D, single-screen-sized scrolling playfield; parallax is not evident in stills (backgrounds look static or slow; unverified). No screen-shake documentation found. Camera follow behaviour unknown; trailer not analysed (only HLS m3u8 URL: https://video.akamai.steamstatic.com/store_trailers/4381340/43145683/2530ce8b085c3f3a8639f8f188348557c0b8cdbc/1769717246/hls_264_master.m3u8?t=1770270400 ). Animation frame counts not found. Visible states from stills: stand, crouch-aim, shoot, cover (back to camera), death; enemy burning/explosion frames.
- Gaps: no dev posts, composer interviews, SteamDB engine tag, or YouTube descriptions retrieved. Watch the trailer and capture the gameplay to fill camera and animation facts.

## Confidence
Medium for visual style, HUD and resolution (direct screenshots); low for camera, animation, audio specifics.
