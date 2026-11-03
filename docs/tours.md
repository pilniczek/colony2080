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

## Missions 2-4 art

One stop per art spot of each mission map.

Vesnice:

```
moveto(150,41) moveto(135,23) moveto(148,32) moveto(126,32) moveto(112,32) moveto(68,32) moveto(42,32) moveto(35,41) moveto(50,41) moveto(70,41) moveto(100,41) moveto(40,50) moveto(80,50) moveto(100,50) moveto(95,59) moveto(124,59) moveto(100,68) moveto(9,32) moveto(60,23)
```

Jungle:

```
moveto(124,25) moveto(41,20) moveto(51,20) moveto(97,20) moveto(104,17) moveto(78,11) moveto(30,37) moveto(50,37) moveto(78,37) moveto(55,32) moveto(86,32) moveto(95,35) moveto(104,41) moveto(118,41) moveto(141,41) moveto(146,41) moveto(94,48)
```

Jeskyne:

```
moveto(34,20) moveto(36,55) moveto(48,55) moveto(48,44) moveto(56,29) moveto(61,29) moveto(59,37) moveto(85,23) moveto(90,21) moveto(94,39) moveto(58,44) moveto(103,74) moveto(40,74) moveto(50,74) moveto(137,48) moveto(18,72) moveto(100,15) moveto(126,74) moveto(124,21)
```
