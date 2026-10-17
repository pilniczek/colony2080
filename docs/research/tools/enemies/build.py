import os, sys, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
WORK = os.path.join(tempfile.gettempdir(), 'c28-enemies')
import json
S = os.path.join(WORK, '')
R = os.path.join(ROOT, '')
raw = json.load(open(S + "/bin/level1_enemies_decoded.json"))
OFF = 6
seen = {
    4: ("A 3:46", "high", "Walked in from the left past the hidden player to x 58, turned back, killed at x 54-55 (A 3:52). Ammo 350 to 324."),
    3: ("A 3:57", "high", "Walked in from the left to the hidden player at x 44, killed there (A 4:02). Ammo 324 to 300."),
    11: ("A 4:15", "high", "Comes from the left right after the rebel cutscene (A 4:06-4:14), likely the robot shown shooting the rebel. Walks right from x 19-20 to the hidden player, killed at x 21 (A 4:23) for 16 rounds."),
    13: ("A 5:05", "high", "Seen from the lift while riding up, then walks left from x 28-29 to the lift, killed at x 28-30 (A 5:09)."),
    17: ("A 5:14", "high", "Walks left from x 46-47 past the graffiti wall to the hidden player at x 39-41, killed (A 5:18)."),
    14: ("A 5:22", "high", "Flies at x 29-32 about 3 rows above the floor next to the crowbar spot, fires, shot down (A 5:24)."),
    18: ("A 5:40", "high", "Flies at x 49-52 under the girder bridge, shot down while the player hides (A 5:43)."),
    19: ("A 5:45", "high", "Walks up to the hidden player at x 56-57, killed at x 59-60 (A 5:49)."),
    6: ("A 6:17", "high", "Walks left to the fuel tank at x 99-100, killed (A 6:20)."),
    7: ("A 6:22", "high", "Flies in from the right at x 107-108 above the fuel tank pipes, fires, shot down (A 6:24). Could swap identity with e05."),
    5: ("A 6:31", "high", "Flyer that follows the player into the colonnade from the left (x about 115). Could swap identity with e07."),
    8: ("A 6:31", "high", "Walks left through the colonnade (x 116-123) with a flyer, killed (A 6:37)."),
    9: ("A 6:56", "high", "Metro platform, walks right toward the lift at x 74-75, killed (A 6:58)."),
    10: ("A 7:00", "high", "Metro platform, walks in front of the train at x 68-69, killed (A 7:03)."),
    15: ("A 7:41", "high", "Metro tunnel, walks left from x 32-33 firing, killed at x 30-31 (A 7:46). Also B 10:00."),
    20: ("A 9:12", "high", "Flies left to the hidden player at x 50-54 near the street lift, shot down (A 9:15)."),
    21: ("A 9:18", "high", "Walks to the hidden player under the BAR sign at x 45-46, killed (A 9:22). In B it was killed with the E-blaster at x 53 (B 13:04)."),
    22: ("A 10:08", "high", "Flies in from the right at x 82-84 and its shot kills the player at 10% energy (A 10:09, KONEC HRY). In B a flyer is shot down with the E-blaster near x 97-101 (B 14:24), either this one or e24."),
    23: ("B 14:22", "high", "Stands at x 84-85 by the gantry building east of the bar."),
    24: ("B 14:34", "high", "Flies at x 110-111, shot down with the E-blaster (B 14:38)."),
    25: ("B 14:42", "high", "Walks left at x 115-116 by the fence, killed (B 14:44)."),
    26: ("B 14:53", "high", "Flies at x 134-136 near the lift down, shot down with the E-blaster (B 14:55)."),
    27: ("B 15:18", "high", "One of two droids waiting at x 127-130 when the player rides the lift down from floor 31. They kill him (B 15:18)."),
    28: ("B 15:18", "medium", "Probably the second droid in the B 15:18 lift ambush (e28 or e29)."),
    29: ("B 15:18", "medium", "Possibly the second droid in the B 15:18 lift ambush (e28 or e29)."),
}
markers = [
    {"marker": 1, "what": "dying rebel", "cell": [33, 58]},
    {"marker": 2, "what": "crowbar", "cell": [25, 43]},
    {"marker": 3, "what": "wire box", "cell": [127, 57]},
    {"marker": 4, "what": "second switchboard (estimate)", "cell": [66, 69]},
    {"marker": 5, "what": "train door", "cell": [60, 68]},
    {"marker": 6, "what": "water valve", "cell": [20, 73]},
    {"marker": 7, "what": "corpse", "cell": [16, 69]},
    {"marker": 8, "what": "E-blaster", "cell": [40, 74]},
    {"marker": 9, "what": "bar", "cell": [42, 36]},
    {"marker": 10, "what": "crashed ship", "cell": [11, 40]},
    {"marker": 11, "what": "plasma", "cell": [103, 42]},
    {"marker": 12, "what": "controller", "cell": [112, 50]},
    {"marker": 13, "what": "damaged lift", "cell": [56, 36]},
    {"marker": 14, "what": "acid tank", "cell": [115, 20]},
    {"marker": 15, "what": "guard", "cell": [23, 13]},
    {"marker": 16, "what": "crane", "cell": [26, 11]},
    {"marker": 17, "what": "card door", "cell": [49, 21]},
]
def near(cell):
    best = min(markers, key=lambda m: abs(m["cell"][0] - cell[0]) + 3 * abs(m["cell"][1] - cell[1]))
    d = abs(best["cell"][0] - cell[0]) + 3 * abs(best["cell"][1] - cell[1])
    return best["marker"], d
floorname = {53: "long street (floor 53)", 64: "metro platform (floor 64)", 69: "metro tunnel (floor 69)", 45: "floor 45", 38: "floor 38", 31: "bar street (floor 31)", 24: "floor 24", 17: "floor 17", 10: "top floor 10 (crane level)"}
out = []
for e in sorted(raw, key=lambda q: q["index"]):
    x, y = e["x"] + OFF, e["y_init"]
    fly = e["type"] == 2
    cell = [x, y + (3 if fly else 5)]
    pat = [e["patrol"][0] + OFF, e["patrol"][1] + OFF]
    s = seen.get(e["index"])
    mk, d = near(cell)
    beh = ("Flyer: patrols cells %d-%d about 3 rows above the floor, fires downward at the player. 2.0 hit points: 14 machine-gun hits or 4 E-blaster hits." if fly else
           "Chrome droid: patrols cells %d-%d on the floor, walks up to the player, ignores him while hidden, fires fast bolts. 2.0 hit points: 14 machine-gun hits or 4 E-blaster hits.") % tuple(pat)
    if s: beh += " Video: " + s[2]
    out.append({
        "id": "e%02d" % e["index"], "type": "flyer" if fly else "chromeDroid", "cell": cell,
        "confidence": s[1] if s else "medium", "behaviour": beh,
        "nearMarker": mk if d <= 30 else None,
        "floor": y, "area": floorname.get(y, "floor %d" % y), "patrol": pat,
        "firstSighting": s[0] if s else None,
        "engine": {"slot": e["index"], "type": e["type"], "x": e["x"], "y": e["y_init"], "patrol": e["patrol"], "hp": e["hp_real"]},
    })
out.append({"id": "g15", "type": "guardShootable", "cell": [26, 15], "confidence": "low",
            "behaviour": "Second guard (marker 15). Separate shootable-object table: 80 hit points, 4 per hit (about 20 hits), only hurt from the same floor. The crane key lies behind him. Cell assumes the same +6 x offset as the enemy table; without it he would stand at x 20. Never seen in footage.",
            "nearMarker": 15, "floor": 10, "area": floorname[10], "patrol": None, "firstSighting": None,
            "engine": {"table": "ds:0x39B9", "x": 20, "y": 10, "hp": 80}})
out.append({"id": "acid14", "type": "guardAcid", "cell": [110, 29], "confidence": "medium",
            "behaviour": "Guard robot that normal weapons cannot kill (marker 14). Drawn as map tiles at x 109-111, y 28-30, not as a sprite. Using the tap handle on the acid tank one floor up (x 113-117, y 18-23) pours acid on it; map variant M16 swaps it for wreckage. Never seen in footage.",
            "nearMarker": 14, "floor": 24, "area": floorname[24], "patrol": None, "firstSighting": None,
            "engine": {"source": "M11 vs M16 tile diff"}})
doc = {"status": "draft", "source": "docs/research/reports/10-level1-enemies.md",
       "coordinates": "cell = [x, y] on the 160x80 map grid (24 px cells). Ground enemies: the cell they stand in (floor plank is the row below). Flyers: typical hover cell. World x = engine x + 6. Engine y = top row of the 7-row floor band.",
       "enemies": out}
json.dump(doc, open(R + "/config/levels/mesto/enemies.json", "w"), indent=2, ensure_ascii=False)
json.dump(markers, open(S + "/markers.json", "w"), indent=1)
from collections import Counter
print(len(out), Counter(o["confidence"] for o in out), Counter(o["type"] for o in out))
for o in out: print(o["id"], o["type"], o["cell"], o["patrol"], o["confidence"], o["nearMarker"], o["firstSighting"])
