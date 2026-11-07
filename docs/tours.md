# Check tours

Paste a tour into the debug panel Tour box (sandbox, or game page after `c2080isdebugging`) and press Play. Each stop is a `moveto(x,y)` in the mission's `world.json` coordinates (game page `game.html?mission=<id>`).

## Mesto lift shafts

One stop per shaft row with the floor run on behind the lift (`behind` in `src/game/render/environment.ts`). Each stop stands the hero on the floor next to the shaft; with a wall on one side the stop is on the floor side. A lift deck parked on the row covers the floor, so ride it away first.

| Shaft col | Row | Left / right | Stop |
|---|---|---|---|
| 78 | 59 | walkway / walkway | `moveto(77,59)` |
| 25 | 70 | metro / metro | `moveto(24,70)` |
| 10 | 70 | wall / metro | `moveto(13,70)` |
| 24 | 51 | girder / girder | `moveto(23,51)` |
| 8 | 41 | wall / girder | `moveto(11,41)` |
| 34 | 44 | girder / walkway | `moveto(33,44)` |
| 67 | 37 | walkway / walkway | `moveto(66,37)` |
| 131 | 37 | walkway / walkway | `moveto(130,37)` |
| 82 | 44 | walkway / walkway | `moveto(81,44)` |
| 55 | 30 | girder / walkway | `moveto(54,30)` |
| 33 | 23 | walkway / walkway | `moveto(32,23)` |
| 84 | 23 | walkway / walkway | `moveto(83,23)` |
| 104 | 23 | walkway / walkway | `moveto(103,23)` |
| 122 | 16 | walkway / walkway | `moveto(121,16)` |
| 122 | 23 | walkway / walkway | `moveto(121,23)` |
| 52 | 10 | girder / walkway | `moveto(51,10)` |

```
moveto(77,59) moveto(24,70) moveto(13,70) moveto(23,51) moveto(11,41) moveto(33,44) moveto(66,37) moveto(130,37) moveto(81,44) moveto(54,30) moveto(32,23) moveto(83,23) moveto(103,23) moveto(121,16) moveto(121,23) moveto(51,10)
```

## Vesnice regions

One stop per region of `docs/research/vesnice-map.md` (game page `game.html?mission=vesnice`): spawn, fuse box, remains, east floors, power plant, the middle floors, guard, target teleport, cannon and bridge, the west floors, then the lower floors.

```
moveto(146,41) moveto(148,32) moveto(111,32) moveto(130,32) moveto(135,23) moveto(135,41) moveto(95,41) moveto(72,41) moveto(70,23) moveto(66,32) moveto(36,41) moveto(57,41) moveto(37,32) moveto(36,50) moveto(110,50) moveto(120,59) moveto(88,59) moveto(100,68)
```

## Vesnice objects

Interactive objects, pickups and blockers in route order: fuse box, small key, target and source teleports, walkie-talkie guard, west guard post, plasma gate, barricade, dynamite wall, bonus pickups (energy, ammo, shield), power plant arcs.

```
moveto(146,32) moveto(112,32) moveto(65,32) moveto(128,23) moveto(66,23) moveto(41,41) moveto(97,41) moveto(27,41) moveto(34,32) moveto(83,23) moveto(129,41) moveto(41,41) moveto(135,23)
```

## Vesnice enemies

One stop 4-6 cells from each rocket robot and grey trooper group (`docs/research/vesnice-map.md` Enemies).

```
moveto(130,41) moveto(109,41) moveto(127,32) moveto(132,23) moveto(78,50) moveto(112,50) moveto(120,59) moveto(102,68) moveto(81,59) moveto(69,41) moveto(83,23) moveto(29,50) moveto(45,50) moveto(40,32)
```

## Vesnice lifts and rock

Lift bottom stops (walkway across the shaft) and stone fill edges.

```
moveto(113,41) moveto(87,50) moveto(78,41) moveto(69,32) moveto(141,32) moveto(130,59) moveto(115,68) moveto(82,68) moveto(16,50) moveto(12,50) moveto(17,41) moveto(64,32) moveto(72,59) moveto(78,68) moveto(108,59)
```

## Jeskyne regions

One stop per region of `docs/research/jeskyne-map.md` (game page `game.html?mission=jeskyne`): start, west drop chain, middle hub, east floors, cart strip and exit, lower west, lower east.

```
moveto(34,20) moveto(40,55) moveto(68,29) moveto(115,21) moveto(128,48) moveto(40,63) moveto(100,74)
```

## Jeskyne lift stops

One stop beside each lift stop, on the panel side: lift 1 lower and upper halves, lift 2, lift 3, lift 4 lower and upper halves, lift 5, lift 6.

```
moveto(48,44) moveto(48,55) moveto(55,29) moveto(55,44) moveto(47,20) moveto(47,44) moveto(71,29) moveto(71,37) moveto(85,23) moveto(81,29) moveto(89,21) moveto(89,23) moveto(100,66) moveto(96,74) moveto(126,56) moveto(126,74)
```
