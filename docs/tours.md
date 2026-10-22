# Check tours

Paste a tour into the debug panel Tour box (sandbox, or game page after `c2080isdebugging`) and press Play. Each stop is a `moveto(x,y)` in `config/levels/mesto/world.json` coordinates.

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
