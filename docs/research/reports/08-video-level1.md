# Colony 28 - video evidence, Level 1 (city) and core mechanics

Confidence: MEDIUM-HIGH for level 1 layout, enemies, hide mechanic, HUD, item chain. LOW for jump, run speed, exact hit counts, ladder animation (not visible in footage). Timestamps are seconds into the video (m:ss in brackets) and are accurate to roughly +-2 s for ones read from 3-5 s contact sheets, +-0.5 s for ones from dense extraction.

## Sources (downloaded to research/video/)
| ID | URL | Content | Local file |
|---|---|---|---|
| A | https://www.youtube.com/watch?v=5r7Yie502C0 | OldGames.sk "Intro + Level 1 (mesto)", 10:11, native 320x200 capture. Best source. Intro 0:00-3:40, gameplay 3:44-10:11, ends in a death (KONEC HRY) | 5r7Yie502C0.mp4 |
| B | https://www.youtube.com/watch?v=KkPeKkoohvk | "COLONY 28 [1997, Napoleon Games] - Retro Gameplay", 15:23. Starts with unrelated DOS clips, same level 1 route played again, shows map screen and inventory | KkPeKkoohvk.mp4 |
| C | https://www.youtube.com/watch?v=E6RLt99E-qc | "Colony 28 (Dos game 1997)", 9:04. Same city route, English caption at ~0:41 of the gameplay: "the speed of firing of enemies is abnormally fast. So, the difficulty is so hard" | E6RLt99E-qc.mp4 |
| D | https://www.youtube.com/watch?v=98GhruztJP0 | "Colony 28 (1997) - demo", 6:30. Jungle level only (NOT level 1) | 98GhruztJP0.mp4 |
| E | https://www.youtube.com/watch?v=UcF9R9PrypE | "Colony 28 gameplay (PC Game, 1997)", 12:00, 780x480. Demo: bridge with red van, then jungle. NOT level 1 | UcF9R9PrypE.mp4 |
| F | https://www.youtube.com/watch?v=uMpKFeY7FJI | 5th Interactive "Colony 28 - 1997", 6:20. Mostly intro cinematics | uMpKFeY7FJI.mp4 |
| G | Steam trailer (HLS), appdetails movies[0] "Colony 28 gameplay" | Not downloaded as video (HLS only); store screenshots already covered in 03-level-design.md | - |

No auto-captions exist for any of these (no .vtt produced). Tool setup: yt-dlp and ffmpeg could not use venv (no ensurepip, no pip), so wheels were fetched straight from PyPI and unzipped into scratchpad/pylib; ffmpeg binary at scratchpad/ffmpeg (symlink). ffmpeg build has no drawtext.

Contact sheets: research/video/sheets/ (5r7_NN.png = 12 frames, 3 s apart, sheet N starts at (N-1)*36 s; KkPeKkoohvk_NN, etc. = 16 frames, 5 s apart; d1-d8, a1 = dense). Best frames: research/video/frames-best/ (28 files, named with video time).

## Presentation and HUD (A 3:44 onward; frame L1_t0226_street_start_barrel_hud.png)
- Fixed 320x200 screen. Metal-frame border, scene viewport about 290x170 px. Scene is side view, pre-rendered 3D sprites in 256 colours, dithered. A 3D-rendered robot art panel appears on pause/inventory screens.
- Top bar, left to right: weapon-1 icon + "n:NNN" ammo counter (350 at start of A's session), brown oval icon (extra/grenade-like item), weapon-2 icon + counter once picked up, centre "C28" logo plate, right box showing HELD ITEM (empty hand icon, or text such as PACIDLO / VSTUPNI KARTA / HOLOG. PLAN / SOUCASTKA) (A 5:30 "PAČIDLO", 7:50 "E-BLASTER" label appears top right on pickup; B 0:10:20 "VSTUPNI KARTA").
- Left edge vertical meter marked "E" (energy), right edge vertical segmented meter marked "S" (shield). Red tick marker on the E meter in B 15:00ish (low energy).
- Message line: top-left of viewport, yellow pixel text in Czech, typewriter style (reveals letters; e.g. A 7:40 "U MRTVEHO JSI NASEL VSTUPNI KARTU A HOLOGRAFICKY PLAN KOSMICKE LODI."). Item pickups produce this line, not a popup.
- Pause/system menu (A 3:42-3:46 and 4:26-4:35): robot art on green grid, entries VYPNOUT HUDBU, RYCHLOST HRY (speed slider), ULOZIT HRU, NAHRAT HRU, KONEC HRY. Load list shows named slots (DJ, BAD, POZICE C, D, E) with live preview of the saved screen in the corner (A 4:30).
- Inventory screen (A 9:45; B 15:00; frame L1_KkPeK_t0901_inventory_energy10pct_ammo501_extra324.png): left panel INVENTAR (list of text names: VSTUPNI KARTA, HOLOG. PLAN, NAKRES, KOHOUT, SOUCASTKA, PACIDLO, DRAT), right panel X-BOT STATISTIKA with body diagram, ENERGIE n%, STITY bar, ammo table (pistol x501, two more calibres x0 x0, EXTRA x324), picture of the selected item shown in 3D (blueprint "nakres", etc.). Energy shown as 10% when near death, 40% earlier (A 9:45), 102/"10%" per later screen.
- Map screen (B 15:12, frame L1_KkPeK_t0912_map_screen_grid_tiers.png): needs HOLOG. PLAN item in hand (the top-right box shows HOLOG. PLAN). Grey grid, discovered rooms drawn as light-grey rectangles, walls dark lines, tiers of long horizontal corridors joined by short vertical shafts; player marker is a small yellow rectangle at top right. Map is a schematic of the whole level: about 4 horizontal tiers (top = city street, lower = subway/tunnels), very wide (much wider than tall).

## Scrolling and camera
- Smooth horizontal scrolling, not flip-screen: successive 0.25 s frames in A 3:51-3:54 show the whole scenery sliding continuously (frame set sheets/d3.png). Player stays roughly in the middle 40-55% of the viewport; camera follows.
- Parallax: the distant skyline and cloud layer move much slower than the near fence/buildings (sheets/d3.png frames 1-3, skyline almost static while fence moves).
- Vertical scroll exists for lifts: when the player rides a lift platform the view scrolls vertically (A 4:56-5:12 and 8:10-8:30, sheets/d5.png, d6.png, d7.png).
- Scene never zooms or cuts for gameplay; 3D pre-rendered cutscenes interrupt (see below).

## Player sprite and animation states observed
Player is a yellow/orange armoured droid (X-BOT), side view, gun held forward.
- Idle: stands aiming gun forward.
- Walk/run: leaning stride, one animation (no separate walk and run seen) (A 3:51-3:54; A 9:58-10:08, sheets/d8.png). Roughly the same speed throughout; no sprint key observed.
- Shoot while standing: muzzle flash at gun, burst fire consuming ammo quickly (A 4:23, ammo 300 -> 284 in about 1 s, sheets/a1.png). Shots visible as small tracer/bolt.
- Hide/cover: player turns into a DARK, desaturated brown-blue standing sprite (same pose, facing camera/back plane) next to an object (barrel, crate, doorframe). While hidden the enemy walks up to point blank and does not attack; player emerges (sprite returns to yellow) and fires (A 3:51-3:52 barrel; A 4:21-4:23 sheets/a1.png frames 1-6 hide, then 7-12 emerge; frames L1_t0231_hide_dark_sprite_behind_barrel_chrome_enemy_near.png, L1_t0261_hide_pose_enemy_adjacent_wall_hole_scene.png). Hide happened next to crates/barrels; also when standing near a doorframe in the subway (A 7:45 sheets/d6.png frames 2-3, 9-12). Not seen: hiding with nothing nearby (all observed hides were beside a prop; cannot tell if the prop is required).
- Kneel/crouch: player crouches to pick up items and search the dead body in the subway (A 8:16-8:25, sheets/d7.png rows 5-6; frame L1_t0500_crouch_search_dead_body_card_holoplan.png). No crouch-to-dodge seen.
- Item use: at electrical panels and doors a short 3D cutscene plays (see below), not an in-sprite animation.
- Take-damage: orange swirl/ring effect around the player (A 5:42, frame L1_t0342_drone_fire_hit_swirl_on_player.png).
- Death: fireball overlays the player, text "KONEC HRY" appears over the explosion, game ends (A 10:08; B 15:19, frame L1_KkPeK_t0919_death_fireball_KONEC_HRY.png). Player died while energy was 10% (B inventory 15:01).
- NOT seen in any footage: jump, ladder climbing, punch/melee, run-versus-walk distinction, rolling. Players only move on the ground plane; elevations are via lifts. So jump distance in character widths: no data. If a jump exists it was never used in the level 1 route.
- Scale: sprite about 20 px wide and 30 px tall at 320x200, viewport shows about 14 character widths across, about 6 high.

## Enemies seen in level 1 (behaviour and hit data)
1. Chrome/silver humanoid droid (most common). Walks (shuffling run) toward the player along the ground, stops adjacent, shoots an orange bolt. Dies with a large orange explosion. A 3:51-3:52 (sheets/d3.png): wandered into the hidden player and did not react. A 4:20-4:24: walked right up to the hidden player; killed after about 10-16 ammo units (297, 294, 291, 289, 285, 284 over 6 frames; kill happened by the third of those). First fight (A 3:53): 350 -> 324 ammo. Roughly 8-16 bullets, consistent with a few hits, but counter drops per burst so exact hit points unknown.
2. (Superseded by `10-level1-enemies.md`: this figure is the player's dark hide sprite, not an enemy.) Brownish armoured soldier standing still behind props (appears in sheets 10-13 with windows/cracks: A 5:36, 5:40, 5:58, 6:12): the dark-blue/brown figure beside a barrel or building window was initially mistaken for the hidden player - in A 5:36-5:58 it is a stationary enemy "gunner" in window frames with a rocket launcher (bazooka-like weapon visible at A 5:36, A 5:40 "sheet 10 row 2 col 1-2"). Confidence on this one: LOW-MEDIUM; the same dark sprite style is used for the hide state.
3. Flying drone (small grey/black winged craft) crossing the sky at gantry height, fires down (A 5:40-5:42 frame L1_t0342...; A 10:08 missile flying at player and hits, B 15:19). Seen repeatedly over the top of girder structures. Not killable by the player in any footage (never shot).
4. Wall-mounted/dome turret and blue crawler bots appear only in the jungle demo (D 0:00-1:30; E 0:30-3:00) - not level 1.
- Enemies are at fixed spots and appear when the player reaches the area; they approach from off-screen right or left at constant speed. They did not respawn when the player re-walked the same corridor in A after a reload (A 4:35 vs 3:50 differ because the reload restored position, uncertain).
- Enemy firing is fast. Commenter in video C: "the speed of firing of enemies is abnormally fast, so the difficulty is so hard".

## Level 1 route, screen by screen (A = video A time; B/C corroborate unless noted)
Level is one continuous scrolling strip with background sky and skyline: red-brown sunset sky, black skyline silhouettes. Street floor is a riveted metal walkway with hazard-stripe plates at pickup points. Fences (mesh wire), barrels, crates and ruined concrete blocks are the props.

Intro (A 0:00-3:40): logo Napoleon Games, 5th Dimension, "UVADI HRU", title Colony 28, text "PRACOVNI TABOR L490" (work camp L490), CGI of the robot in a locker bay, a human worker in a tunnel (shirt "ASC 004563H"), alien ship "KOSMICKA LOD VETRELCU", robot landing, ending on a sketch/blueprint and a bound human. Also on the main menu: START, INTRO, LOAD, DOS (B 0:00-0:30, E 0:20).

Street, part 1 (A 3:44-3:56). Start at left of a fence section with a barrel; yellow hazard plate at the floor right of player. Skyline buildings behind. Enemy 1 walks in from the left and gets killed (see hide mechanic). Ammo 350 -> 324. Frame: L1_t0226_street_start_barrel_hud.png, L1_t0232_chrome_enemy_explodes.png.

Street, part 2 (A 3:56-4:00). Ruined concrete building with a large hole in the wall; stepped roof. Player walks past it. Message appears at A 4:12ish. 3D cutscene A 4:12 (text "ROZSTRELIL JSI KRYT U TRYSEK A VYTAHL JSI"): player shoots an access cover at the nozzles and pulls something out - a 3D closeup of the robot and a crashed craft. Frame: L1_t0288_text_message_top_left_ruined_building.png.

Landing craft screen (A 4:50, sheet 9 frames 1-3). A crashed grey ship with landing struts stands on the street; the player is standing on a platform/gantry with a rail. A 3D closeup of robot with gun at A 4:12; after the closeup the message "Ze zeme jsi sebral soucastku z rakety" (picked up a part from the rocket, A 4:56-5:12). Item added to inventory: SOUCASTKA (part). A 5:12-5:25 two bunker-like building facades with brick wall area on the left and a collapsed hole in the wall; box on the floor.

Lift/scaffold screen (A 5:00-5:12, sheets/d5.png). Narrow brick shaft with a ladder-like rail ("lift scaffold") at left of a ruined tower. Player rides a platform with railing in the shaft (railed platform with hazard-stripe base - an elevator). Enemy 1 walks in from the right across the rubble; the player hides next to the crate on the platform and kills it in about 2-3 s (A 5:06-5:12, sheets/d5.png rows 5-6). Dead enemy lies as scrap.

Graffiti wall + fence section (A 5:20-5:45). Large concrete wall with spray-painted graffiti; steel truss pylons; mesh fences. "NASEL JSI PACIOLO" (A 5:30): picks up a crowbar (PACIDLO), appears in the held-item box. Frame L1_t0330_found_crowbar_message.png. Drone overhead (A 5:36-5:42) shoots; player takes a burn effect (frame L1_t0342...).

Girder gantry, fuel tank (A 5:45-6:20). Steel girder bridge overhead with pipes; large horizontal fuel tank with radiation trefoil on the end; vertical pipe. Chrome enemy plus armoured gunner approach from the right (A 6:00). Explosion (A 6:36). Frame L1_t0372_fuel_tank_radiation_sign.png.

Pipe-and-brick wall with green panel (A 6:36-7:00). A building with a pipe column and a small green wall panel marked "05" (electrical distribution box) at A 6:40. Message "2 ELEKTRICKEHO ROZDELOVACE JSI VYTRHL DRAT" (A 6:50-7:00): short 3D cutscene of the robot ripping a cable from the box (A 6:45, frame L1_t0405_green_wall_panel_wire_cutscene_trigger.png). Item: DRAT (wire).

Lift down to subway (A 7:05-7:15). Same railed lift platform as before, on a brick shaft with a fan unit; descent takes the player to the underground level (vertical camera scroll).

Subway platform (A 7:15-8:00). Dark tiled wall, train carriage with blood stains stands on the track. Chrome enemy approaches from the left, player hides at the lift, shoots (A 7:22 explosion, sheets/d6.png rows 3-5). Player uses the wire on the electrical divider: "POUZITIM DRATU JSI OPRAVIL ROZDELOVAC ELEKTRINY" (A 7:32). Tries a door "POKUSIL JSI SE OTEVRIT DVERE ALE NE" (tried to open door but not) (A 7:36). Then crowbar: "PACIDLEM JSI OTEVREL DVERE METRA" (A 7:44). Cutscene A 7:40-7:50 shows first-person 3D view inside the train. Frames: L1_t0436_subway_train_carriage_player_opens_door.png.

Tunnel level (A 7:50-9:25). Grey rivet-plated tunnel, pipes, rubble pile, strip lights, a lift cage at several places (vertical brick shaft with railed platform). Several lift transitions upward and downward; the camera scrolls vertically; tunnel has two stacked corridors visible at once (A 8:20-8:30). Chrome enemy approaches from the right at A 8:12 (killed in about 1.5 s of fire: A 8:09-8:14, sheets/d6.png rows 3-4). Stopcock/valve puzzle: "KOHOUTEK JSI UZRVAL / DOSROUBOVAL JSI KOHOUT" (A 8:10-8:35): finds a tap (KOHOUT) at a pipe corner, then screws it onto a pipe elsewhere; water flows ("KOHOUTEM UZAVRIL JSI PRIVOD VODY" at B ~9:30). Weapon pickup A 7:50ish "NASEL JSI E-BLASTER" (a second weapon, shown top right and as a second ammo counter n:400 appears at A 7:55). Frame L1_t0468_pickup_E-BLASTER_label_top_right.png.

Dead body (A 8:15-8:40). Rubble pile and a dead human in a side room reached by lift. Prompt MRTVE TELO (dead body). Player crouches, a 3D cutscene shows the robot kneeling beside the body. Found: VSTUPNI KARTA (entry card) and HOLOGRAFICKY PLAN KOSMICKE LODI (holographic plan of the spaceship) - message A 8:40, inventory item HOLOG. PLAN lets the map be opened. Frames: L1_t0495_lift_shaft_rubble_dead_body_prompt.png, L1_t0500_crouch_search_dead_body_card_holoplan.png.

Back to the street (A 8:40-9:15). Player returns up the lifts to the same train station, up the first lift to the street near the fence start. Street now has the first corpses; the crashed craft and lift scenery re-appear (same geometry as at 4:50 - the world persists).

Bar and NPC (A 9:15-9:45). Street with a red "BAR" neon sign on a lattice tower in front of a ruined concrete building (A 9:15-9:20, frame L1_t0555_BAR_sign_street.png). A grey chrome enemy walks near it (A 9:25). Inside/at the door a human NPC face appears, dialogue lines at the bottom: "TY? CO TU CHCES!?" (You? What do you want!?), "TOHLE BY TE MOHLO ZAJIMAT" (This could interest you), "TO TED NENI DULEZITE, ALE POTREBUJI SE DOSTAT VEN Z MESTA. REVCH TO MOHL OBSTARAT" (That's not important now, but I need to get out of the city. Revch could arrange it) (A 9:24-9:36). Robot closeup shows glowing red eyes. Then the NPC: "CLOVEK VYBABRAL (VYBAVIL?) TI DAL SCHEMA SOUCASTKY A POZADAL TE ABY JSI MU JI NASEL" (the man gave you the schematic of the part and asked you to find it) (A 9:42-9:46) - the NAKRES (sketch) added to inventory (A 9:48 inventory shows NAKRES, SOUCASTKA, VSTUPNI KARTA, HOLOG. PLAN, KOHOUT). Later "VYMENIL S TEBOU SOUCASTKU ZA DEKODER" (traded the part for a decoder) (A 9:57-10:08; the trade is automatic dialogue with the NPC, the inventory item swap shown only via text).

Street east of the bar (A 9:58-10:10). Fences, lattice pylons, a large industrial building with a blue-trimmed upper arcade and gantry structure to the right (frame L1_t0608_gantry_building_drone_missile_hit.png). Player runs right. A drone/missile launcher fires a missile from the right; the explosion hits the player; KONEC HRY (A 10:08, frame L1_t0610_KONEC_HRY_after_missile_hit.png). One missile killed the player here with energy at 10%.

Quest chain summary (level 1 tasks, observable):
1. Find rocket/craft part (SOUCASTKA) on the street (A 4:56).
2. Find crowbar PACIDLO (A 5:30).
3. Wire: rip the wire from an electrical box (A 6:50), use it to repair a divider in the subway (A 7:32).
4. Crowbar the subway door (A 7:44).
5. Valve/tap puzzle (A 8:10-8:35).
6. E-blaster pickup (A 7:50).
7. Search the dead body for entry card + holo plan (A 8:40).
8. Return to the bar NPC for the part swap -> decoder (A 9:15-10:08).
Level end is not seen in any video (player dies; level end probably requires the decoder + the gantry building to the right).

## Interaction with objects
- Items on the ground are collected by walking over them or pressing an action key while overlapping; text message appears, item goes to the held-item box (A 5:30 PACIDLO). Only one item visible in the box at a time; inventory screen lists all.
- Use-item at objects (electrical box, door, valve) triggers a 3D CGI close-up of the robot performing the action (A 6:45, 7:40, 8:10, 8:20). These cutscenes last 2-6 s and show a small "scan-line" TV frame with a red pulse waveform in the corner (A 7:40 frame).
- Doors are not obviously coloured; only the subway door (crowbar) and train carriage doors seen.
- The "cover" is the dark hide sprite described above, not an object that the player ducks behind with a crouch.

## Implementation-relevant conclusions
- One continuous scrolling strip with vertical lifts; flip-screen is wrong. Smooth scroll with slow parallax background; vertical scrolling is needed for lifts.
- Player verbs confirmed: walk, shoot, hide (dark sprite, stationary, enemies ignore), kneel (item/body search), interact (item/door/valve), lift ride, inventory/map. Unconfirmed: jump, climb, melee.
- Enemies: patrol/approach, stop at melee range and shoot fast, die with a big explosion after about 8-16 bullets (not exact), fixed spawns, drones fire missiles from off-screen (one hit lethal at low energy).
- Ammo is plentiful on the first level (350, 300, 224-501 seen) so shooting is spammy, with a second weapon (E-blaster) picked up mid-level.
- Messages in Czech; implement a typewriter message line top-left.

## Gaps / not verified
- Jump distances, jump arc, ladders, punching: not in any video. Check the Steam trailer or DOSBox demo for these.
- Exact enemy hit points; need frame-by-frame with a counting of bullets that hit.
- Level exit and levels 2-8: not seen in these videos. Jungle demo (D, E) is a different level with turret and crawler enemies, rock ledges, helicopter wreck, a canister item "KANISTR S PALIVEM" (fuel canister, E 0:40) and "NASEL JSI STIPACKY" (found cutters? D 1:25), "V TRAVE JSI NASEL MALY KLIC" (a small key in the grass D 1:50).
- Time stamps are approximate for sheet-derived events.
