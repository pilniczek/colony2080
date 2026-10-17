# Colony 28 - manual and magazine coverage

## Access result
- Official manual scan: NOT found. oldgames.sk game URL guess returned 404; web search found no oldgames.sk manual page. Not verified either way.
- archive.org msdos_Colony_28_1997 (https://archive.org/metadata/msdos_Colony_28_1997): only cover jpg, one DOSBox screenshot gif, and the 558 MB game zip (904 files). Zip listing (see ../gamedata/ziplist.txt) has no txt/doc/nfo/hlp/pdf manual file. No in-package manual.
- Magazine scans: archive.org only holds the CD-ROM images (Score 44 = 1997-08 `score44cd`, Score 47 `score47cd`, Czech Level `czlevel28cd`..`czlevel35cd`), 700+ MB .bin each, no page scans of text. Level `_dir.txt` listings for #28, #31, #33, #35 contain no "colony" entry. No Level/Score/Excalibur/Riki/Bit review scans found.
- Best primary text found: the level-by-level walkthrough on ceskehry.net / abcgames.net is credited "Napsal: Score 44 (8/97)", i.e. it is the Score 44 (August 1997) walkthrough, reproduced by DoMaS. Treat it as period magazine source.
- Level 60% score from the brief: NOT confirmed by any source reached.

## Controls (ceskehry.net/navody/colony28.htm "Ovladani", by DoMaS 2004; same in abclinuxu article)
| Action | Key |
|---|---|
| Move (Pohyb) | arrows |
| Run (Beh) | ALT + left/right arrow |
| Shoot (Strelba) | CTRL |
| Weapon select (Volba zbrane) | 1, 2, 3 |
| Hide in shadow/background (Skryvani) | SHIFT |
| Pick up item (Sbirani predmetu) | down arrow or ENTER |
| Inventory (Inventar) | TAB |
| Use item (Pouzivani predmetu) | ENTER |
| Main menu (Hlavni menu) | ESC |
| Automap (Automaping) | M |
- Jump: running jump = ALT + direction + up arrow (high-voltage.cz comment by "Six", 2021). Left running jump reportedly only works with numpad left arrow, not the cursor key (comment by "Astalavista", 2021). A comment says this bug existed on original 486 too. Level 4 shortcut tip implies jumping left from mine carts is needed.
- Unarmed mode: press the weapon key for the empty-hands slot ("2") then CTRL punches/kicks; needed to smash the stone blocks in level 4 (high-voltage comment; ceskehry L4 "prepnete se do modu beze zbrane ... CTRL"). Duck (down arrow) then hit again.
- Interaction with environment can also be done by shooting (visiongame/high-voltage.cz review: "interakce s prostredim muze probihat i pomoci kvere").
- Pick-up cue: a small text in the top right of the screen names the item/hotspot (databaze-her comment by jvempire; high-voltage review "ikonkou v horni casti obrazovky"). Objects not highlighted otherwise.
- Gamepad: Steam release has gamepad mapping (Garret, databaze-her; gamesite.zoznam.sk review).
- Joystick in the 1997 original: no source found.

## HUD (abclinuxu.cz article "DOSBox - ceska klasika Colony 28", 2010)
- Left side: life energy bar (zivotni energie). Right side: reserve energy bar (zasobni energie). When life energy runs out, the reserve is moved in; after that nothing is left.
- Top left: slots for two carried weapons, active one is marked.
- Top right: inventory slot. Empty hand icon = nothing selected. Open inventory with TAB, mark item, it appears in the slot; press ENTER at the right spot to perform the action (plays a short animation).
- Column of 5 yellow lights on the right = shield indicator (ceskehry.net cheat note: "sloupec 5-ti zlutych kontrolek vpravo").
- Minimap/automap (M) shows explored parts and current position (high-voltage.cz review 2020).

## Health, shields, batteries (high-voltage.cz review by Pentium, 2020)
- Batteries (baterie) refill energy to max. Shields (stity) soften damage slightly and act as reserve: if energy hits zero it is refilled automatically and one shield is lost. Max 5 shields, effects add up. Batteries are rare per level (abclinuxu).
- Carry-over: each level starts with the machine gun ammo, energy and shields you finished the previous level with. Bonus weapon is lost at level start. (high-voltage.cz). jvempire (databaze-her) confirms special weapons do not carry between levels, advises not saving them.
- Level start params of cheat codes give full energy and shields (ceskehry.net).

## Save/load
- Unlimited manual saving anywhere, via the menu (ESC); no quicksave (high-voltage.cz; databaze-her comments by Han22, Garret).
- From level 4 on the game allows irreversible dead ends, so save often (Score 44 walkthrough, ceskehry.net/abcgames.net).
- Bugs: crashes/freezes after every 3rd-4th load; broken input after load (Han22); needs full restart (high-voltage.cz note 2; Garret). Original on 486 crashed after opening inventory twice (high-voltage comment "daef"). Game speed tied to CPU clock (high-voltage.cz).
- Steam version offers level select at start (gamesite.zoznam.sk) - runs original under DOSBox. Original had command line level params (below).

## Command-line level jump (ceskehry.net by DoMaS)
`colony28.exe <param>` with param in: mesto, vesnice, jungle, jeskyne, vezeni, sklad, cas, raketa, finis, dun, titulky. The `cas` (time) and `titulky` (credits) are non-level states (cas = timed escape at end of level 6 per walkthrough marker; titulky = credits).

## Weapons and ammo
- Default: rotary machine gun (rotacni kulomet / lehky kulomet), CTRL, with THREE ammo types of different effectiveness; switch ammo in inventory from level 3 on (Score 44 tip; databaze-her blurb "rotacni kulomet na tri druhy naboju"; Visiongame/Zak review "tri druhy ruzne ucinne munice"). Ammo limited; hitscan weapons (high-voltage).
- Melee: punch and kick (boxovat a kopat), unlimited (abclinuxu; kimimi blog).
- One unique bonus weapon per level (each of 8 levels): only the walkthrough names:
  - L1 E-Blaster (ground pickup in subway)
  - L2 TOASTER (toustovac) at the bridge start
  - L3 flamethrower (plamenomet), behind door opened with small key; "save it, lasts to next level" (Score 44) - contradicts "lost each level" claim, probably carries within that tip's context, unresolved
  - L5 MGX 800
  - L6 rocket launcher (raketomet)
  - L7 flamestream
  - L8 laser
  - L4, L9 not named in walkthrough. abclinuxu also lists paprskomet (beam gun). High-voltage lists rocket launchers, flamethrowers, laser cannons, plasma rifles, electro guns.
- Kimimi blog (2026): each stage has one ammo crate.

## Items and their use (Score 44 walkthrough)
Item types seen: pry bar (pachidlo), wires (dratky), tap handle (kohout), key card (karta), holoplan, ship plan (planek lodi), component (soucastka), decoder (dekoder), controller (ovladac), small key (klicek), crane key, radio (vysilacka), detonator (rozbuska), projectile (projektil), fuses (pojistky), dynamite, canister (kanystr), cutters (stipacky), grenade (granat), rod (tyc), colored keys (orange/blue/yellow), keyboard, chest plate piece (hrudni plat), mechanical jack (zvedak), numbered scrap (utrzek s cislem), key A/B, screwdriver (sroubovak), floppy disk (disketa), belt (remen), hoses (hadicky), ID card, laser, container (nadoba), electromagnet, flare (svetlice), piston (pist), welder (svarecka). Kimimi blog lists keycards, decoder, canisters, dynamite, disks, keys.
- Use pattern: select item in inventory (TAB), stand at hotspot, press ENTER; short rendered animation plays for every significant action (abclinuxu, high-voltage).
- Puzzles: wire panels, logins to computers (L5, L6), circuit puzzle "yellow line joins left and right arrow" (L6), rock-pushing puzzle until all stones are pressed in (L3), final code puzzle in L8: five rows of five symbols scattered across the level; the symbol never repeated at a position gives the key. Reported as unsolvable without guide (databaze-her comments, high-voltage comments). L9 code lock: press anything twice then smash it.
- Arrow on screen indicates exact jump spot in L4 ("musite skocit presne jak naznaci sipka"), game does not tell you.

## Enemies (abclinuxu 2010; high-voltage.cz 2020; Visiongame)
- Normal robots (same as you, different uniforms) - easy.
- Robots with rocket launcher - hit harder.
- Dvojnozec obouhlavnoveny (double-barrelled biped, non-humanoid) - hard to kill.
- Letavice (flying drones) - dangerous especially on lift arrival. Teleportacni letavice (teleporting) - appear from nowhere, worst in the alien ship.
- Guard robots (strazni robot) - not killable by ordinary weapon in some places: L1 must be doused with acid from tanker (cisterna s kyselinou).
- Yellow "x-bots" (former brothers in metal), aliens in spacesuits, mechs, levitating devices (high-voltage).
- Some hide in shadows and never turn their back to you; some teleport (high-voltage).
- Enemy AI: once on screen they patrol between screen edges or obstacles until dead; detect you within a range even from behind and snap to shoot; fire is hitscan. Enemies do not respawn once killed (kimimi blog).
- Hide mechanic (core): SHIFT = hide in background, enemy cannot see you, you cannot shoot while hidden. Tactic: let enemy pass, step out right behind him and shoot (Score 44 tip; all reviews).
- Environmental hazards: mines (L3), traps, falls, fire, water, vacuum, giant fan, lava, spikes/bayonets, electricity, propeller in vent shaft (L5), pit death animations (high-voltage).

## Levels (Score 44 walkthrough; names with level-jump param)
1. Mesto (City) `mesto` - dying rebel, subway, bar, crane.
2. Predmesti (Suburbs) `vesnice` - teleports, fuses, dynamite, wall blast.
3. Dzungle (Jungle) `jungle` - mines, cannon, flamethrower, jeep, winch.
4. Jeskyne (Caves) `jeskyne` - three levers, lifts, stalactite, 3 colored keys, mine carts.
5. Utek z vezeni (Prison escape) `vezeni` - login to prison network, MGX 800, vent shafts.
6. Sklad (Warehouse) `sklad` - rocket launcher, alien body, virus floppy, bomb, timer `cas`, escape to plane.
7. Raketova zakladna (Rocket base) `raketa` - flamestream, pools/pump puzzle, armored vehicle, hangar.
8. Kosmicka lod vetrelcu (Alien ship) `finis` - laser, flammable liquid + flare, symbol code.
9. Pred reaktorem (Before the reactor) `dun` - first-person 3D step-based mini dungeon (welder, grenade, cards A/B), then credits `titulky`.
Counts: store/reviews say 8 levels; databaze-her comment and jvempire say 8 platform levels + 9th 3D mini dungeon. Walkthrough numbers 9. First-person dungeon is pre-rendered (kimimi).
- Walkthrough maps/images exist in ceskehry.net/abcgames.net (screens not downloaded; coordinates "(1)..(17)" refer to numbered map pictures).

## Story / intro
- Intro (abclinuxu): captive human, electrician-genius, shorts a wire to open cell, flees from a robot with bad aim, caught by "elzetka" ("L-Z" presumably beam/guard); converted to robot; boards drop pod with other new guards for Earth; Resistance damages the pod in flight; botched conversion lets him keep human mind. Narrator voice P. Trebicky (high-voltage). Czech amateur dubbing by authors.
- First scene: crash in ruined city; he shoots the robot chasing a fleeing man, then the man is a dying rebel: "Nevim, proc jsi mi pomohl, ale poslouchej me. Musis najit vchod do metra, kch kch..." (abclinuxu).
- Backstory: aliens invaded in 2013 (Wikipedia, high-voltage, zoznam); Earth became Colony 28; humans turned into cyborg workers; small rebel group. Date conflict: 2018 in databaze-her and Visiongame/Zak review. Goal: destroy orbital alien base / mothership (Zak review; Han22).
- Ending: not a boss fight; final first-person pre-rendered dungeon then video (kimimi).

## Presentation facts
- 320x200, 256 colors, 3-layer parallax (high-voltage). About 450 MB, 350 MB of it rendered animations; each major action has a ~2 s animation, many unique death animations (high-voltage).
- Music per level, plus themes for main screen, save, death (abclinuxu). 8-bit/FM-like music claim by Zak review ("pouze 8bitovy") vs SoundBlaster per abclinuxu - unresolved.
- Creator credits ten people; Matejka brothers, J. Rohlik (Napoleon Games) (high-voltage). Development began 1993. Sold by Vision Megastore for 600 CZK (high-voltage).
- Original game was also on a Level CD-ROM compilation ~1998 ("Level CD special") (abclinuxu; high-voltage comments).

## Reception / magazines
- Score 44 (8/97): published the walkthrough above (ceskehry.net, abcgames.net). Score 47 (11/97): commercial description (high-voltage.cz). Score review scores not found.
- High-voltage: contemporary press called it decent craftsmanship, not a breakthrough; "best Czech game of 97" quote appears in search summaries (source not verified).
- Visiongame review by Miroslav Zak (2007/2017): "probably the most professional Czech game so far", Flashback type, hide mechanic like Alcatraz, hardest part the space base teleporters (https://visiongame.cz/colony-28-recenze/).
- databaze-her.cz average about 67-68 percent (32 ratings, 40-90 range). No Level/Excalibur/Riki/Bit or Slovak magazine texts found.

## Sources
- http://ceskehry.net/navody/colony28.htm
- https://www.abcgames.net/?p=navody_zobraz&id=865
- https://www.abclinuxu.cz/clanky/hry-a-zabava/dosbox-ceska-klasika-colony-28
- https://www.high-voltage.cz/2020/colony-28-aneb-ceska-avantgarda/
- https://visiongame.cz/colony-28-recenze/ ; https://visiongame.cz/hra/colony-28/
- https://www.databaze-her.cz/hry/colony-28/
- https://gamesite.zoznam.sk/recenzia-colony-28-paradny-navrat-do-minulosti/
- https://kimimithegameeatingshemonster.com/2026/03/06/colony-28-a-czech-wonder-finally-released-worldwide/
- https://archive.org/metadata/msdos_Colony_28_1997 ; score44cd, czlevel* items on archive.org

## Gaps
- No manual, no Level/Excalibur/Riki/Bit text, no joystick info, no explicit story text beyond reviews, no damage/ammo numbers, no enemy HP. A manual scan may exist on oldgames.sk but the page was not reachable. Raw files kept in ./manual/ (html/txt).
