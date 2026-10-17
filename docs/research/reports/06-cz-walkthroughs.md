# Colony 28 - Czech walkthrough research

Primary source: Score 44 (8/97) walkthrough, re-typed by "DoMaS" with colour map images, published 21.11.2004, updated 12.1.2005: http://ceskehry.net/navody/colony28.htm . Same text mirrored (older/shorter, one extra typo set): https://abcgames.net/?id=865&p=navody_zobraz . Cheats/launch params: https://abcgames.cz/?id=865&p=cheaty_zobraz (same params). Local copies: docs/research/sources/cz-walkthroughs/ (HTML, .txt, img/ with all 13 map images, viewed).

Numbers in parentheses below = numbered markers on the level map image (img/1.jpg ... img/9.jpg). The walkthrough is terse (no room-by-room prose, no enemy lists, no dialogue); the maps only give relative position. Anything not literally in the source is marked (inferred).

## Corrections to earlier assumptions
- The game has NINE playable levels + credits, not 8: mesto, vesnice, jungle, jeskyne, vezeni, sklad (+ "cas" time-bomb countdown inside it), raketa, finis, dun, then "titulky" (credits). Source: ceskehry.net page above. (abclinuxu review says 8 levels: https://www.abclinuxu.cz/clanky/hry-a-zabava/dosbox-ceska-klasika-colony-28 ; Steam says 8. Likely "dun" = final short 3D dungeon crawl, review says "last few steps are 3D".)
- Level names (Czech/launch param): 1 Mesto (mesto), 2 Predmesti (vesnice), 3 Dzungle (jungle), 4 Jeskyne (jeskyne), 5 Utek z vezeni (vezeni), 6 Sklad (sklad; sub-stage "cas"), 7 Raketova zakladna (raketa), 8 Kosmicka lod vetrelcu (finis), 9 Pred reaktorem (dun), credits (titulky).
- Launch `colony28.exe <param>` jumps to that level with full energy and shield (5 yellow lights, right column) - useful as dev/test levels.

## Controls (original) - ceskehry.net
Move arrows; run ALT+left/right; shoot CTRL; weapon 1/2/3; hide SHIFT; pick up arrow-down or ENTER; inventory TAB; use item ENTER (item must be selected in inventory first; selected item shows in HUD slot, empty hand = none); main menu ESC; automap M. Switching ammo type in inventory for machine gun from level 3 on. Bare-handed mode (no weapon) can punch/smash blocks with CTRL (level 4). Source: same page and abclinuxu review.

## General tactics (Score 44)
- Hide in shadow (SHIFT), let enemy walk by, step out right behind him and shoot while moving.
- From level 3 switch machine-gun ammo types in inventory.
- Save often: from level 4 the game lets you make an unrecoverable mistake (dead-end state).
- Enemy types (abclinuxu review): plain robots same as player in other uniforms (easy), robots with rocket launcher (hurt more), a non-humanoid two-legged double-barrel walker (hard), flyers (dangerous when you ride a lift up), teleporting flyers (appear from nowhere). Early weapons: fists/kick, light machine gun (CTRL); later paprskomet (ray gun), toustovac/TOASTER, raketomet, flamestream etc. Two weapons carried at once. HUD: life energy left bar, reserve energy right bar; when life runs out the reserve is used. Batteries rare.
- Every item use plays a short animation (abclinuxu).

## Intro / story (abclinuxu review)
Intro video: captured human electrician-genius shorts a wire to open his cell, a robot shoots "a metre off", he flees but the "elzetka" (alien) catches him; he is turned into a robot, shipped in a landing module with other guard-robots; resistance damages the module in flight; the central-brain fault leaves him with human mind. Level 1 starts in the city after the crash. After a few steps a cutscene shows a fleeing man and a robot shooting precisely: you shoot the robot on the spot. Walk to the lying man: another cutscene, dying rebel speaks. Quote (translated): "I don't know why you helped me, but listen. You must find the metro entrance, cough cough..." He tells you to find the metro entrance where a holo-plan is, and bring it to someone at the bar. Source: abclinuxu URL above (also https://technikpage.webnode.cz/news/colony-28/).

## LEVEL 1 - Mesto (City), param `mesto`   (map: img/1.jpg)
Scenery per review: half-ruined buildings, wall pieces, blinking neons, collapsed metro tunnels, wrecked wagons; access cards, items and parts scattered; actions: short-circuit power distribution, pull out wire, crowbar opens cabinet, grenade frees an entrance, stop running water (but find the tap handle first), acid on a robot that normal weapons cannot kill. (abclinuxu; note "grenade frees entrance" and "crowbar opens cabinet" are the reviewer's loose wording and do not match the walkthrough exactly.)

Task order, translated from Score 44 (http://ceskehry.net/navody/colony28.htm), Czech terms in brackets:
1. Go right to the dying rebel (umirajici rebel) (1), talk (ENTER). He tells who to look for and where.
2. Fetch the crowbar (pacidlo) (2).
3. Pull the wires (dratY) out of the electrical distribution box (elektricky rozvod) (3).
4. Take the lift (vytah) down to the metro entrance (vchod do metra). Put the wires into the second switchboard (druhy rozvadec) (4).
5. Use the crowbar to open the door of the train set (dvere od soupravy) (5). Walk through the train into the metro.
6. Pick up the E-Blaster (8) from the floor.
7. Tighten the water shut-off valve (uzaver vody) (6) (the valve is missing its handle, it works once you use the tap handle - see next) and take the tap handle (kohout uzaveru) from it. (Source wording: "Utahnete uzaver vody (6) a kohout uzaveru seberte." Exact mechanics ambiguous: the "kohout" is later used on the acid tank, so it is taken from the valve. The reviewer says you must find the tap handle first and then close the water; order inside the source is close water, take handle.)
8. Search the corpse (mrtvola) (7): get a card (karta) and a holo-plan (holoplan).
9. Shoot your way to the bar (bar) (9).
10. Show the holo-plan to the man in the bar; take from him the ship plan (planek lodi).
11. He wants a specific part (urcita soucastka) located in the ship (lod) (10): shoot open the cover on the hull (kryt na plasti) and the part drops out. Bring it to the bar man; he gives a decoder (dekoder).
12. Take the decoder to the plasma (plazma) (11) and use it on the code lock (kodovy zamek) right next to it. Pick up the controller (ovladac) (12).
13. Take the controller to the damaged lift (poskozeny vytah) (13) and use it at the snowy/"grainy" screen (zrnici obrazovka).
14. Use the card (karta) on the door (17).
15. At the acid tank (cisterna s kyselinou) (14) use the tap handle (kohout) and pour acid on the guard robot (robot straz) (kills the robot that normal weapons cannot).
16. Another guard robot (15) must simply be shot; behind him lies the small key (klicek) for operating the crane (jerab) (16). Repair the crane, cross to the other side = level end.

Map layout (inferred from img/1.jpg, a wide multi-floor strip map ~2:1): start/rebel (1) in the long lower-middle corridor; crowbar (2) upper left of that; metro/E-Blaster/water/corpse cluster (4,5,6,8) in a small block at bottom left; ship (10) is a vertical shaft at far left top; bar (9) and lift (13) in the centre; plasma (11) and controller (12) right-centre; acid tank and door cluster (14) upper right; level end crane (16) and guard (15) at top centre-left; far right bottom (3) electric distribution box. Level is about 4-5 stacked horizontal floors joined by lifts and ladders (inferred).

Items on level 1 (item -> use): crowbar -> train door (5); wires -> second switchboard (4); E-Blaster (weapon pickup); tap handle (kohout) -> acid tank (14); card (karta) from corpse -> door (17); holo-plan from corpse -> show to bar man; ship plan (planek lodi) from bar man -> tells where the part is; ship part (soucastka) -> bar man for decoder; decoder (dekoder) -> code lock at plasma (11); controller (ovladac) -> damaged lift screen (13); small key (klicek) -> crane (16). The Steam inventory screenshot (docs/research/images/steam-shots/s4) lists KLIC, HOLOG. PLAN, NAKRES (sketch = ship plan), DEKODER, consistent with this chain.

Enemies, traps, passwords: NOT in the source beyond: normal robots early, a robot guard killable only by acid, a second guard that can be shot. No passwords. Codes in later levels only (see level 8 and 9).

## LEVEL 2 - Predmesti (Suburb), param `vesnice`   (img/2.jpg; map is a wide chasm level with ledges, 14 markers, multiple stacked ledges, bridge "mustek")
1. Search the smouldering remains (tlejici zbytky) (1), take small key (maly klicek).
2. At the electric distribution (rozvod) (2) break the fuses (rozbijte pojistky).
3. Run to the special weapon TOASTER (4) (nickname) at start of the bridge (mustek).
4. Shoot the guard (straz) (5) with it; behind him pick up the walkie-talkie (vysilacka) from the ground.
5. Pick up detonator (rozbuska) (7) and projectile (projektil) (8).
6. From second switchbox take fuses (pojistky) (9). Pick up dynamite (10).
7. From the broken teleport (rozbity teleport) (11) take a component and fit it in the target teleport (6).
8. Put fuses into the distribution (2); enter the teleport (3).
9. At the beginning of the bridge (where TOASTER was found) use the walkie-talkie to call the guards away.
10. Put the projectile into the cannon (delo) (12) and blow up the wall.
11. Go through teleport (13). At wall (14) put dynamite and detonator on the ground and detonate the charge (end).
Source: http://ceskehry.net/navody/colony28.htm . Several items in this level are fuses taken and re-inserted: fuses broken at (2) are replaced by good fuses from (9) (reading, partly inferred).

## LEVEL 3 - Dzungle (Jungle), param `jungle`   (img/3.jpg)
WARNING: land mines (nasl apne miny) appear first here.
1. Pick up the canister (kanystr) (8).
2. Shoot the distribution cabinet (rozvodna skrin) (1): disables cannon (delo) (2).
3. Take the small key (3), open door (9): behind it a flamethrower (plamenomet). Conserve ammo: it lasts until the next level.
4. From crate (bedna) (10) take wire cutters (stipacky) and remove trap (past) (4).
5. Found grenade used on rock (5): it collapses onto spikes (bodaky) so you can run-jump over them.
6. Solve the puzzle (hlavolam) (6): goal is for all stones to be pressed in; steps over the waterfall extend.
7. Refuel the jeep (jeep) (8, source reuses number 8 for the canister/jeep area) with the canister; use the winch (navijak) to pull away the fallen tree; cross to next level.
Source same. Review adds: overgrown ruins, abandoned mining excavators, rusty lifts (abclinuxu).

## LEVEL 4 - Jeskyne (Cave), param `jeskyne`   (img/4.jpg; big vertical cave map 15 markers)
1. Pull the three right levers (paky) (1); the door on the left opens.
2. Take the bar/rod (tyc) (2) and release the lift mechanism lock (pojistka vytahu) (3).
3. Above the crystal (krystal) (4) a stalactite (krapnik): shoot it down to pass the crystal.
4. At stone blocks (kameny kvadry) (6): switch to no-weapon mode and smash blocks with CTRL. Behind: orange key-card (oranzova klic-karta) (7).
5. At the chasm (8): jump to middle platform and shoot the explosive tank (nadrz s vybusninou). Take blue key (modry klic) (9).
6. At the moving mine carts (jezdici tezebni vozik) (10) jump in; when passing under platforms jump up. Take yellow key (zluty klic) (11).
7. Use all three keys in the slots (5): doors (12) open.
8. At (13) jump exactly as the arrow indicates or you fall in the pit and die; the game does not warn you.
9. Find keys (14) for door (15) (end).
Shortcut (http://ceskehry.net/navody/colony28.htm, img/zkratka.gif shows red arrow along path): after landing on the mine carts (10) keep jumping left (you must hop over the end of the tunnel's left wall) until you stand on solid ground; then jump as far left as possible and you land near the level exit at far right.
Review: lovely stalactite lookout where one must not fall (abclinuxu).

## LEVEL 5 - Utek z vezeni (Prison escape), param `vezeni`   (img/5.jpg; map: big hall on top, long parallel corridors below)
1. From the dump/scrapheap (skladka) (1) on the left take a keyboard (klavesnice); open the cover (kryt) (2) and log into the prison network with the keyboard. This starts the transporter on the other side of the corridor, which smashes through the gate.
2. At the "accident" site pick up a piece of chest plate (kus hrudniho platu) from a guard robot.
3. Take key (3). Use the chest plate on the lock of door (4): rewrites the ID in the lock.
4. Take special weapon MGX 800. Take mechanical jack (mechanicky zvedak) (6) and a numbered scrap (utrzek s cislem) (7).
5. Try the key on gate (8); when it fails, use the jack.
6. At the ventilation-shaft control (ovladani vetracich sachet) (9) use the scrap: stops the propeller in the last shaft, so you can jump in.

## LEVEL 6 - Sklad (Warehouse), param `sklad`, then `cas`   (img/6.jpg)
1. Get the rocket launcher (raketomet) (1), grenade (granat) (2) just behind it.
2. From a locker take key B and a screwdriver (sroubovak).
3. Climb crates to the shaft above the guard robot by the alien (mimozemstan) (4); unscrew the grille and throw the grenade in.
4. Go to the alien (4) and shoot him. Take key A.
5. From a second locker take controller (ovladac) (5); use at lift control (6).
6. Ride up to the damaged electric circuit (7) and fix it: yellow line must connect left and right arrow (circuit puzzle, img/obvod.gif shows the solved path).
7. Behind the second guard robot: computer (9), log in.
8. Put both keys into the lift controller (8).
9. Go to the dead alien (4) and shoot off his hand; hold it to controller (8); log into computer (9) again.
10. From the desk at the alien (4) take a floppy disk (disketa); load a virus onto it from computer (9); insert it into controller (8).
11. Once you have the bomb, detonate it at the stored robots (10) -> sub-stage "cas" (timer): run toward the aircraft (letadlo) (11).

## LEVEL 7 - Raketova zakladna (Rocket base), param `raketa`   (img/7.jpg)
1. Get special weapon flamestream (1).
2. Pass both pools (bazenky); with lever (2) pump water from lower pool to upper. Take key (4) from the bottom of the lower pool.
3. Pump the water back from upper to lower (2) and take belt (remen) (3) from the mechanism.
4. Open passage (5) with the key. Take entry card (vstupni karta) (15); behind guard take ID card (6).
5. From car (7) take fuel hoses (hadicky). Go back, open door (8) with entry card.
6. Shoot machine-gun at switchbox (9). From lamp (10) tear out wires.
7. Put belt, hose, wires into the armoured vehicle (obrnenec) (11); board it and smash through the wall.
8. Climb under hatch (poklop) (12). Put ID card in computer (13) on the right. Go to the hangar (hangar) (14).

## LEVEL 8 - Kosmicka lod vetrelcu (Alien spaceship), param `finis`   (img/8.jpg)
1. Take laser (1), container (nadoba) (2), wire (drat) at the door (3), electromagnet (elektromagnet) (4).
2. Scoop flammable liquid (horlavina) from pool (5) into container.
3. Use electromagnet to destroy the circuit at cabinet (6); take card from it.
4. Use the wire to close switch (7) of the pressure-chamber door (preplakova komora) before you can pass.
5. Use entry card on door (3); shoot guard robot; he leaves a piston (pist) - use it to repair door (8).
6. Take rod (tyc) (9) and flare (svetlice) (10). Rod stops fan (vetrak) (11); crawl through the shaft.
7. Anywhere at (12) put the container on the floor and light it with the flare. Take the key; use it on the door right of where the laser (1) was found.
8. Then a code must be entered: 5 sets of 5 symbols are scattered around the level; the symbols that never repeat at a given position give the key code. Answer image: img/znaky.jpg (5 alien glyphs). img/cisla.jpg (4 and 5 labelled regions of a puzzle panel, numbers 1-5 mark segment order; inferred it explains the position order).

## LEVEL 9 - Pred reaktorem (Before the reactor), param `dun`   (img/9.jpg)
1. Get welder (svarecka) (1), grenade (2), key (3).
2. Code lock (6): try pressing something twice, then smash it.
3. Use key on locker (7); take card.
4. From spot 4 throw the grenade, and with the welder get into locker (5); take another card.
5. Use card B at (8) and card A at (9). Through door (10) enter the reactor. "That is all, friends." Then `titulky` (credits).

## Gaps / confidence
- Level 1 detail: source gives full task chain and item/use mapping but no enemy placement, trap list, room geometry beyond a stylised map, nor the exact number of floors. Marker numbers cannot be turned into pixel coordinates reliably. Confidence MEDIUM-HIGH for the task chain and items, LOW for geometry and enemies.
- Not found: Slovak walkthroughs (oldgames.sk had no hits), Score/Level scans (no archive.org Colony 28 scan found), YouTube transcripts. Original Level 60% review per Wikipedia; Level special 98.2 on archive.org still the best next step (https://archive.org/details/czlevelspecial982).
- Typos in source (like "dratY" for wires) fixed; numbering collision in level 3 ("8" used twice) is in the source.
