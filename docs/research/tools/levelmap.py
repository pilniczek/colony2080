import json
import os
import sys

W, H = 160, 80
BAND = 6
EMPTY = (0, 0)
ZONES_NOTE = (
    "hazards are the layout zones as cell rects on the stand row (engine y + 5, the cell over the feet), the damage rate "
    "spread over the clip length; conveyors are the carry tile runs at 5.5 px per tick and 32 ticks per s; teleports go from "
    "the pad centre to the target foot cell, enabledBy names the flag a conditioned pad needs; each variant is the cell patch from the base map to that map file (variantSources), "
    "blocking cells only, a whole-map state, not cumulative; enemies stand at their original foot cells"
)
EXTRAS = {
    1: {
        "source": (
            "docs/research/reports/13-level1-layout.md, built by docs/research/tools/mestomap.py from MAPY/M11.MAP "
            "and gamedata/disasm/level1_layout.json: '#' floor planks and wall columns, '|' invisible blocker at a floor end "
            "(map clamp), lift shafts open on their plank rows; taskWalls are the walls a task removes (water, plasma, card door, "
            "dark metro tunnel), not baked into rows; the tunnel west end wall is dropped so the tunnel is walkable once open; "
            "lift stops are the repaired ones for the damaged lift (enabledBy); lift 122 skips its unused middle stop (row 23, user); droids are the chromeDroid cells and patrols from config/levels/mesto/enemies.json; flyers are its flyer cells and patrols with the plank row of their floor (engine y + 6); '|' shaft floors fill every bottom stop row so no pit "
            "opens under a lift (report 13, Our blockers); a floor beside a shaft on a row where its lift does not stop gets a wall up to the floor above, "
            "so it does not read as a landing (user);the crane mast gap (floor 10, cols 36-38) stays a plank with no wall so the hero walks west "
            "past the crane panel, and the plank row 10 gap over the crane (cols 22-30) stays open; the never reached floors over the crashed ship "
            "(cols 7-22, rows 11-38, around the col 18 and row 23 edges of the reached runs) and the planks under its pad (rows 44 and 51, cols 11-20) "
            "are cleared to open sky, the pad (row 41, on to col 21 under the rear strut) is the roof of a building drawn by world.json down to the street (row 59), "
            "whose east side (col 21, rows 42-51) is an invisible blocker; its tail pillar (col 14, rows 39-40) turns into an invisible hull blocker and "
            "the wall west of its lift (col 7) runs up to the lift rail tops (row 39); borderFills fill solid from the outer walls (col 7 from row 39, "
            "col 9 from row 60, col 141 rows 17-44) on to the map edge over never reached cells, so the view there shows wall, not sky (user); "
            "the street (row 59) is the ground floor and its slab runs down to row 65 around the lift 78 shaft, so the metro under it is 4 rows high like the original tunnel art (rows 66-69, user); "
            "never reached cells under the street are solid too (cols 18-19 and 86-157 of the upper tunnel, cols 48-157 of the lower one, the map edge cols 158-159 from the street down and rows 76-79, user); "
            "the never reached pockets walled in on every side are the original towers, so they are solid (cols 24-27, 69-73, 72-76, 93-99, 125-140); "
            "the floors of rows 44-59 end at col 140 like the original, solid east of it; the unreached sky east of the col 127 skyscraper (cols 136-159, rows 0-15) and the clamp cells under the west roof (col 6, rows 11-29) are open sky; "
            "unseen fills every open cell under a solid cell that no reached spot ever sees (fog sight from every reached floor, ladder and lift row, all task gates open) solid, "
            "so no art is kept where the player cannot look; the sky above the top floors and the sky rects over the crashed ship stay open; the floor 44 pocket west of lift 67 (cols 41-65) is walled in, so it is unseen too (user); the map ends at col 142, everything east of it is wall or never reached, and its top right corner east of the col 127 skyscraper (cols 128-142, rows 0-16) is wall; the invisible col 6 blockers left from the dropped west roof are gone (rows 4-9); the hull stub on the crashed ship pad (col 14, rows 39-40) is open, so the hero walks the pad up to the col 22 wall; the never reached west roof plank (row 10, cols 6-21) is dropped and the pocket west of lift 122 at its unused middle stop (cols 117-120, rows 17-22) is walled in; the never reached roof over floor 16 (row 10, cols 66-126) is dropped and the col 127 skyscraper wall runs up to the map top (user)"
        ),
        "spawn": [62.5, 59],
        "liftHints": {55: "The lift is broken."},
        "liftStops": {122: [16, 30]},
        "tunnelWestEnd": (70, 40),
        "taskWalls": {
            (75, 20): "waterPipe",
            (44, 102): "plasmaBarrier",
            (23, 49): "cardDoor",
            (70, 56): "metroTunnel",
        },
        "plankGaps": {(10, col) for col in range(36, 39)},
        "holes": [(col, 10) for col in range(22, 31)],
        "sky": [(7, 11, 17, 29), (18, 24, 22, 29), (7, 30, 22, 38), (21, 39, 21, 40), (11, 42, 20, 51), (6, 11, 6, 29), (136, 0, 159, 15)],
        "width": 143,
        "unseen": [(128, 11, 135, 15), (115, 45, 140, 50), (41, 38, 65, 43)],
        "borderFills": [(0, 39, 7, 59), (0, 60, 8, 75), (141, 17, 159, 44)],
        "patches": [(22, 24, 22, 43, "#"), (128, 0, 142, 16, "#"), (6, 4, 6, 9, "."), (14, 39, 14, 40, "."), (6, 10, 21, 10, "."), (117, 17, 120, 22, "#"), (66, 10, 126, 10, "."), (127, 0, 127, 2, "#"), (15, 41, 20, 41, "#"), (21, 42, 21, 51, "|"), (9, 60, 77, 65, "#"), (81, 60, 157, 65, "#"),
                    (18, 66, 19, 69, "#"), (86, 66, 157, 69, "#"), (48, 71, 157, 74, "#"), (158, 59, 159, 79, "#"), (0, 76, 157, 79, "#"),
                    (24, 24, 27, 29, "#"), (24, 31, 27, 36, "#"), (69, 24, 73, 29, "#"), (72, 38, 76, 43, "#"), (72, 45, 76, 50, "#"),
                    (93, 17, 99, 22, "#"), (125, 17, 140, 22, "#"), (125, 24, 140, 29, "#"), (141, 45, 159, 58, "#"), (133, 52, 159, 58, "#")],
    },
    2: {
        "borderFills": [],
        "unseen": [(94, 26, 94, 33), (91, 33, 93, 33), (95, 33, 95, 33), (145, 42, 159, 42), (149, 43, 159, 79), (0, 51, 72, 51), (145, 51, 148, 58), (0, 52, 67, 79), (74, 52, 74, 52), (146, 59, 148, 79), (136, 60, 145, 79), (68, 61, 68, 79), (69, 69, 135, 79)],
        "patches": [(6, 0, 6, 79, "."), (158, 0, 158, 79, "."), (87, 16, 87, 16, "."), (58, 17, 58, 17, "."), (86, 17, 86, 17, "."), (125, 17, 125, 17, "."), (148, 17, 148, 17, "."),
                    (106, 23, 106, 23, "."), (61, 25, 61, 25, "."), (29, 26, 29, 26, "."), (46, 26, 46, 26, "."), (62, 26, 62, 26, "."), (86, 26, 86, 26, "."), (109, 26, 109, 26, "."),
                    (152, 26, 152, 26, "."), (155, 33, 155, 33, "."), (14, 35, 14, 35, "."), (22, 35, 22, 35, "."), (99, 35, 99, 35, "."), (153, 35, 153, 35, "."), (13, 43, 13, 43, "."),
                    (14, 44, 14, 44, "."), (58, 44, 58, 44, "."), (72, 44, 72, 44, "."), (137, 44, 137, 44, "."), (77, 53, 77, 53, "."), (103, 53, 103, 53, "."), (115, 53, 115, 53, "."),
                    (80, 62, 80, 62, "."), (124, 62, 124, 62, "."), (90, 12, 95, 25, "#"), (153, 13, 156, 23, "#"), (117, 14, 119, 23, "#"), (50, 15, 53, 23, "#"), (87, 15, 89, 22, "#"),
                    (120, 15, 120, 23, "#"), (54, 16, 54, 32, "#"), (121, 16, 121, 23, "#"), (151, 16, 152, 23, "#"), (55, 17, 55, 22, "#"), (122, 17, 122, 23, "#"), (56, 18, 57, 22, "#"),
                    (123, 18, 124, 22, "#"), (148, 18, 150, 22, "#"), (58, 19, 58, 22, "#"), (125, 19, 125, 22, "#"), (86, 20, 86, 22, "#"), (51, 24, 53, 32, "#"), (55, 24, 60, 31, "#"),
                    (88, 24, 89, 31, "#"), (102, 24, 106, 31, "#"), (155, 24, 159, 31, "#"), (0, 25, 0, 25, "#"), (49, 25, 50, 32, "#"), (61, 25, 61, 31, "#"), (154, 25, 154, 31, "#"),
                    (90, 26, 93, 32, "#"), (95, 26, 95, 32, "#"), (46, 27, 48, 31, "#"), (86, 27, 87, 31, "#"), (107, 27, 108, 31, "#"), (152, 27, 153, 31, "#"), (109, 28, 109, 31, "#"),
                    (62, 29, 62, 31, "#"), (55, 32, 58, 32, "#"), (102, 32, 105, 32, "#"), (156, 32, 159, 32, "#"), (5, 33, 11, 40, "#"), (155, 33, 158, 40, "#"), (159, 34, 159, 41, "#"),
                    (0, 35, 0, 42, "#"), (12, 36, 13, 40, "#"), (153, 36, 154, 40, "#"), (14, 37, 14, 40, "#"), (5, 41, 9, 41, "#"), (156, 41, 158, 41, "#"), (6, 42, 12, 49, "#"),
                    (62, 42, 68, 50, "#"), (141, 42, 144, 59, "#"), (13, 43, 13, 49, "#"), (60, 43, 61, 49, "#"), (69, 43, 69, 49, "#"), (139, 43, 140, 49, "#"), (145, 43, 148, 50, "#"),
                    (70, 44, 70, 49, "#"), (58, 45, 59, 49, "#"), (71, 45, 71, 49, "#"), (137, 45, 138, 49, "#"), (72, 46, 72, 49, "#"), (14, 47, 14, 49, "#"), (8, 50, 10, 50, "#"),
                    (140, 50, 140, 58, "#"), (107, 51, 111, 59, "#"), (137, 51, 139, 58, "#"), (68, 52, 73, 60, "#"), (105, 52, 106, 58, "#"), (112, 52, 112, 59, "#"), (74, 53, 74, 58, "#"),
                    (113, 53, 113, 58, "#"), (75, 54, 76, 58, "#"), (103, 54, 104, 58, "#"), (114, 54, 114, 58, "#"), (77, 55, 77, 58, "#"), (115, 55, 115, 58, "#"), (106, 59, 106, 59, "#"),
                    (145, 59, 145, 59, "#"), (74, 60, 77, 67, "#"), (127, 60, 135, 68, "#"), (69, 61, 73, 68, "#"), (78, 63, 79, 67, "#"), (124, 63, 126, 67, "#"), (80, 64, 80, 67, "#"),
                    (74, 68, 76, 68, "#"), (0, 24, 6, 49, "#"), (0, 50, 10, 50, "#"), (156, 13, 159, 41, "#")],
        "source": (
            "docs/research/reports/14-level2-layout.md, built by docs/research/tools/levelmap.py from MAPY/M21.MAP "
            "and gamedata/disasm/level2_layout.json: '=' one-way floor support tiles, '#' wall tiles (walls filled over the hero stand height), "
            "the bridge guard post code wall '|' (column 52), lift shafts open from two rows over the top stop "
            "to the bottom stop; spawn dropped from engine (146, 33) to the floor below; patches drop the map clamp (columns 6 and 158) and the caps over bare wall tops "
            "(no jump reaches them), fill every original crate block and rock tile (sheet 10, not the lattice, deck or machine tiles) solid, so the cliffs and masses of the map image are walls, "
            "and wall the west edge (cols 0-6 rows 24-50) and the east edge (cols 156-159 rows 13-41) on to the map edge (map composition blueprint); unseen fills the never seen cells under the lower floors "
            "(bedrock under floors 50, 59 and 68 and east of the floor 41 to 59 masses) and the lattice slot in the col 87-95 mass, leaving the one-row strips under the floors open; "
        )
        + ZONES_NOTE,
        "fallDeathCells": None,
        "hazardZones": {0: ("bridgeGap", "death")},
        "teleportZones": {1: "padUp", 2: "padDown", 3: "sourceTeleport", 4: "targetTeleport"},
        "teleportFlags": {"sourceTeleport": "flag:teleportLinked", "targetTeleport": "flag:teleportLinked"},
        "variants": {"powerOff": "M22", "powerOn": "M23", "barricadeGone": "M24"},
        "enemyKinds": ("rocketRobot", "greyTrooper"),
    },
    3: {
        "borderFills": [(0, 11, 21, 79), (148, 35, 159, 79)],
        "width": 152,
        "unseen": [(22, 38, 75, 79), (76, 39, 80, 48), (81, 46, 81, 48), (82, 47, 82, 47), (97, 42, 147, 45), (99, 46, 147, 47), (99, 48, 147, 79), (76, 49, 79, 79), (98, 49, 98, 49),
                   (80, 50, 86, 79), (96, 50, 98, 79)],
        "patches": [(6, 0, 6, 10, "."), (21, 10, 21, 10, "."), (75, 5, 75, 5, "."), (107, 3, 107, 3, "."), (116, 19, 116, 19, "."), (131, 19, 131, 19, "."),
                    (82, 39, 82, 39, "#"), (96, 42, 96, 42, "#"), (76, 37, 80, 38, "#"), (83, 43, 83, 43, "#"), (84, 45, 84, 45, "#"), (84, 47, 84, 47, "#"), (82, 48, 85, 48, "#"), (80, 49, 88, 49, "#"), (87, 50, 88, 79, "#"),
                    (93, 49, 95, 79, "#"), (96, 49, 97, 49, "#"), (97, 46, 98, 47, "#"), (42, 17, 42, 17, "."), (80, 18, 80, 18, "."), (82, 18, 82, 18, "."),
                    (107, 28, 111, 28, "."), (135, 24, 141, 24, ".")],
        "source": (
            "docs/research/reports/15-level3-layout.md, built by docs/research/tools/levelmap.py from MAPY/M31.MAP "
            "and gamedata/disasm/level3_layout.json: '=' one-way floor tiles, '#' wall tiles and wall table columns (west x+4, east x+7, "
            "filled over the hero stand height), '|' map clamp (columns 6 and 158) and a cap over each bare wall top (wall tiles hold no hero); no lifts (the tower lift is a scripted teleport); "
            "spawn on the spawn ledge; the clamp at column 6 and the wall caps (cols 21, 75, 107, 116, 131) are dropped; borderFills fill solid from the west girder column (col 21, from row 11) "
            "and the east wall col 148 (from row 35) on to the map edge, and the map ends at col 151; unseen fills the never seen ground under floors 37 and 41 and around the cave solid; "
            "the dip east of floor 37 (cols 76-80, rows 37-38) is ground, the rock west of the cave stair and the cave floor are solid except the pit under its gaps (cols 89-92), "
            "the cabinet niche behind the col 96 wall (cols 97-98, rows 46-47) is solid, since the cabinet stands on the wall face 2 cells west (user), the cell over the col 96 wall and the col 82 rock top are solid; "
            "stray floor tiles inside the building (42,17) and by the pipe (80 and 82, row 18) and the never seen planks under and on the spawn deck (row 28 cols 107-111, row 24 cols 135-141) are dropped; "
        )
        + ZONES_NOTE,
        "fallDeathCells": None,
        "hazardZones": {0: ("cannonTurret", "damage"), 2: ("chasm", "death"), 3: ("spikes", "death"), 4: ("tripwire", "death")},
        "damage": {"cannonTurret": {"hit": 30, "push": 1, "clipFrames": 51, "clipJiffies": 3}},
        "variants": {"cabinetShot": "M32", "grenadeRubble": "M33", "puzzleSteps": "M34"},
        "enemyKinds": ("rocketDroid", "crawler"),
        "variantRects": {"M32": [(90, 31, 90, 31), (97, 46, 98, 46)]},
    },
    4: {
        "borderFills": [],
        "width": 157,
        "patches": [(85, 21, 85, 22, "."), (89, 23, 90, 23, "="), (49, 30, 51, 39, "#"), (0, 0, 159, 7, "#"), (0, 8, 86, 12, "#"), (130, 8, 159, 10, "#"), (138, 11, 159, 29, "#"), (0, 13, 14, 55, "#"), (24, 13, 31, 13, "#"), (40, 13, 43, 47, "#"), (67, 13, 86, 13, "#"), (24, 14, 26, 16, "#"), (67, 14, 81, 15, "#"), (68, 16, 70, 22, "#"), (36, 21, 43, 35, "#"), (48, 21, 51, 21, "#"), (57, 21, 60, 21, "#"), (107, 21, 111, 31, "#"), (48, 22, 48, 39, "#"), (112, 22, 116, 31, "#"), (15, 29, 19, 55, "#"), (55, 30, 57, 36, "#"), (76, 30, 103, 31, "#"), (138, 30, 138, 30, "#"), (142, 30, 159, 40, "#"), (55, 37, 55, 40, "#"), (101, 40, 122, 40, "#"), (101, 41, 115, 50, "#"), (152, 41, 159, 79, "#"), (20, 44, 34, 55, "#"), (44, 45, 47, 47, "#"), (53, 45, 70, 49, "#"), (81, 46, 81, 63, "#"), (130, 49, 159, 79, "#"), (53, 50, 64, 55, "#"), (113, 51, 115, 66, "#"), (85, 53, 85, 65, "#"), (52, 55, 64, 55, "#"), (0, 56, 11, 79, "#"), (62, 56, 64, 56, "#"), (116, 57, 126, 65, "#"), (25, 64, 44, 66, "#"), (116, 66, 117, 66, "#"), (123, 66, 126, 66, "#"), (20, 75, 43, 79, "#"), (45, 75, 45, 79, "#"), (50, 75, 51, 79, "#"), (53, 75, 54, 79, "#"), (56, 75, 61, 79, "#"), (63, 75, 63, 79, "#"), (66, 75, 66, 79, "#"), (69, 75, 74, 79, "#"), (76, 75, 91, 79, "#"), (93, 75, 159, 79, "#"), (12, 76, 159, 79, "#"), (137, 16, 137, 16, "."), (63, 23, 66, 23, "."), (76, 38, 118, 38, "."), (89, 47, 100, 47, "."), (96, 60, 105, 60, "."), (25, 67, 61, 73, ".")],
        "source": (
            "docs/research/reports/16-level4-layout.md, built by docs/research/tools/levelmap.py from MAPY/M41.MAP "
            "and gamedata/disasm/level4_layout.json: '=' one-way floor tiles, '#' wall tiles and wall table columns (west x+4, east x+7, "
            "filled over the hero stand height), lift shafts open from two rows over the top stop "
            "to the bottom stop; lift 1 uses its stops after the rod (enabledBy); each three-stop lift is split into two two-stop lifts side by side that both reach the middle floor (liftSplits, user): "
            "lift 1 into cols 49-51 (floors 44-55) and cols 52-54 (floors 29-44), both locked by the rod, the col 49-51 shaft over floor 29 walled in; lift 4 into cols 82-84 (floors 23-29) and cols 86-88 (floors 21-23), "
            "the wall stub at col 85 between them opened and floor 23 run on to the col 91 wall; the original lift 4 snap to its top while the hero is on the cart stretch (7:0x87A5) moves the cols 86-88 half; "
            "spawn dropped from engine (28, 8) to floor 20; a cave has no sky: patches fill solid every cell no reached spot sees (fog sight from every reached floor and lift row and along every fall and jump, all task gates open) and the lava band from row 76, "
            "except the left lava shaft and the marker 13 ledge (cols 12-19, rows 64-75); the map clamp (columns 6 and 158) and the caps over bare wall tops are gone, three caps the hero lands on are rock (cols 81, 85, 107); "
            "free-hanging wall bits grow to the rock above (cols 55, 57, 81, 130), one-cell notches and slots under a ceiling are filled, rock tops nobody reaches grow up to the rock over them; the map ends at col 156, everything east of it is rock; "
        )
        + ZONES_NOTE,
        "liftEnabled": {49: ("flag:liftLock", [29, 44, 55])},
        "liftSplits": {49: [(49, [44, 55], 55), (52, [29, 44], 44)], 82: [(82, [23, 29], 29), (86, [21, 23], 23)]},
        "fallDeathCells": None,
        "hazardZones": {0: ("stalactiteChasm", "death"), 1: ("middleChasm", "death"), 2: ("cartCrush", "death"), 3: ("lava", "death")},
        "soundZones": {"cartSparks": ({"x": [95, 119], "y": [30, 33]}, "spark")},
        "conveyorPxPerTick": 5.5,
        "variants": {"stalactiteShot": "M42", "tankShot": "M43"},
        "enemyKinds": ("spiderWalker", "podWalker", "trooper"),
        "variantDrops": {"M42": ["crystal"], "M43": ["crystal"]},
    },
}
CLAMP_COLS = (6, 158)
STAND = 5
TICKS_PER_S = 32
CELL_PX = 24
FLI_JIFFY_S = 1 / 70


def tile_at(data, col, row):
    i = (row * W + col) * 2
    return (data[i], data[i + 1])


def fill(grid, col, top, bottom, char):
    for row in range(top, bottom + 1):
        if grid[row][col] != "#":
            grid[row][col] = char


def paint(grid, left, top, right, bottom, char):
    for row in range(top, bottom + 1):
        for col in range(left, right + 1):
            grid[row][col] = char


def fill_borders(grid, cfg):
    for left, top, right, bottom in cfg["borderFills"]:
        paint(grid, left, top, right, bottom, "#")


def band_top(floor, floors):
    above = [f for f in floors if f < floor]
    return max(floor - BAND, above[-1] + 1) if above else floor - BAND


def wall_top(data, planks, col, floor):
    for row in range(floor - 1, -1, -1):
        if planks[row][col] == "#":
            return row + 1
    row = floor
    while row > 0 and tile_at(data, col, row - 1) != EMPTY:
        row -= 1
    return row


def lift_stops(lift):
    return lift.get("stopsAfterRepair") or lift["stops"]


def with_stops(lifts, cfg):
    return [{**lift, "stops": cfg.get("liftStops", {}).get(lift["x"], lift["stops"])} for lift in lifts]


def shaft_cells(lifts, rows):
    cells = set()
    for lift in lifts:
        stops = lift_stops(lift)
        for row in rows:
            if stops[0] <= row <= stops[-1]:
                cells.update((col, row) for col in range(lift["x"], lift["x"] + lift["width"]))
    return cells


def lift_json(lift, extra):
    stops = lift_stops(lift)
    out = {"x": lift["x"], "width": lift["width"], "top": stops[0], "bottom": stops[-1]}
    if len(stops) > 2:
        out["stops"] = stops
    start = lift["start"]
    if start == stops[0]:
        out["start"] = "top"
    elif start == stops[-1]:
        out["start"] = "bottom"
    else:
        out["startRow"] = start
    if lift.get("enabledBy"):
        out["enabledBy"] = lift["enabledBy"]
    if lift["x"] in extra.get("liftHints", {}):
        out["hint"] = extra["liftHints"][lift["x"]]
    return out


def wall_passed_floors(grid, lifts):
    for lift in lifts:
        stops = lift.get("stops", [lift["top"], lift["bottom"]])
        for row in range(stops[0] + 1, stops[-1]):
            if row in stops:
                continue
            for col in (lift["x"] - 1, lift["x"] + lift["width"]):
                if grid[row][col] not in "#=" or grid[row - 1][col] in "#=":
                    continue
                top = row - 1
                while top > 0 and grid[top - 1][col] not in "#=":
                    top -= 1
                paint(grid, col, top, col, row - 1, "#")


def droids(enemies):
    return [{"cell": e["cell"], "patrol": e["patrol"]} for e in enemies["enemies"] if e["type"] == "chromeDroid"]


def flyers(enemies):
    return [{"cell": e["cell"], "patrol": e["patrol"], "floor": e["engine"]["y"] + BAND} for e in enemies["enemies"] if e["type"] == "flyer"]


def build(data, layout, enemies, cfg):
    blocking = layout["blocking"]
    floors = sorted(layout["floors"])
    solid_tiles = {tuple(t) for t in blocking["solidTiles"]}
    code_walls = {(w["floor"], w["solidCol"]) for w in blocking["codeWalls"]}
    extra = layout["extraStopFloor"]
    segments = {int(f): s for f, s in blocking["walkSegments"].items()}
    segments[extra["row"]] = [extra["cols"]]
    grid = [["."] * W for _ in range(H)]
    task_walls = []
    walls = []
    for floor, segs in sorted(segments.items()):
        top = band_top(floor, floors) if floor in floors else floor - BAND
        for a, b in segs:
            for col in range(a, b + 1):
                grid[floor][col] = "#"
        gaps = [c for (_, b), (a, _) in zip(segs, segs[1:]) for c in range(b + 1, a)]
        for col in gaps:
            key = (floor, col)
            grid[floor][col] = "#"
            if key in cfg["taskWalls"]:
                task_walls.append({"id": cfg["taskWalls"][key], "col": col, "top": top, "bottom": floor - 1})
            elif key != cfg["tunnelWestEnd"] and key not in cfg["plankGaps"]:
                walls.append((col, floor))
        for col in (segs[0][0] - 1, segs[-1][1] + 1):
            if (floor, col) in code_walls or tile_at(data, col, floor - 1) in solid_tiles:
                grid[floor][col] = "#"
                walls.append((col, floor))
            else:
                fill(grid, col, top, floor - 1, "|")
    planks = [row[:] for row in grid]
    for col, floor in walls:
        fill(grid, col, wall_top(data, planks, col, floor), floor, "#")
    for col, row in cfg["holes"]:
        if grid[row][col] != "#":
            raise SystemExit(f"hole not a plank at {col},{row}")
        grid[row][col] = "."
    compose(grid, cfg)
    for w in task_walls:
        while grid[w["top"]][w["col"]] == "#":
            w["top"] += 1
    for col, row in shaft_cells(layout["lifts"], segments):
        grid[row][col] = "."
    lifts = [lift_json(lift, cfg) for lift in layout["lifts"]]
    for lift in lifts:
        for col in range(lift["x"], lift["x"] + lift["width"]):
            grid[lift["bottom"]][col] = "|"
    wall_passed_floors(grid, lifts)
    for lift in lifts:
        for row in range(lift["top"] - 2, lift["bottom"]):
            for col in range(lift["x"], lift["x"] + lift["width"]):
                if grid[row][col] != ".":
                    raise SystemExit(f"lift shaft blocked at {col},{row}")
    task_walls.sort(key=lambda w: (w["id"], w["col"]))
    return {
        "status": "draft",
        "source": cfg["source"],
        "rows": ["".join(r[:cfg["width"]]) for r in grid],
        "lifts": lifts,
        "taskWalls": task_walls,
        "droids": droids(enemies),
        "flyers": flyers(enemies),
        "spawn": cfg["spawn"],
    }


def compose(grid, cfg):
    sky = cfg.get("sky", [])
    for left, top, right, bottom in sky:
        paint(grid, left, top, right, bottom, ".")
    for left, top, right, bottom, char in cfg.get("patches", []):
        paint(grid, left, top, right, bottom, char)
    fill_borders(grid, cfg)
    covered = [[any(grid[r][c] != "." for r in range(row)) for c in range(W)] for row in range(H)]
    for left, top, right, bottom in cfg.get("unseen", []):
        for row in range(top, bottom + 1):
            for col in range(left, right + 1):
                if covered[row][col] and not inside(sky, col, row):
                    grid[row][col] = "#"


def pairs(tiles):
    return {tuple(t) for t in tiles}


def by_sheet(tiles):
    return {(int(sheet), tile) for sheet, ids in tiles.items() for tile in ids}


def table_col(entry):
    if "solidCol" in entry:
        return entry["solidCol"]
    x = entry["engine"][0]
    return x + 4 if entry["table"].startswith("west") else x + 7


def plain_lifts(lifts, cfg):
    out = []
    for lift in lifts:
        enabled, stops = cfg.get("liftEnabled", {}).get(lift["x"], (None, lift["stops"]))
        halves = cfg.get("liftSplits", {}).get(lift["x"], [(lift["x"], stops, lift["start"])])
        out.extend({"x": x, "width": lift["width"], "stops": s, "start": start, "enabledBy": enabled} for x, s, start in halves)
    return out


def layout_of(level, data):
    blocking = data["blocking"]
    if level == 2:
        return {
            "floors": pairs(blocking["supportTiles"]),
            "walls": pairs(blocking["solidTiles"]),
            "wallCells": [],
            "codeCells": [(w["solidCol"], row) for w in blocking["codeWalls"] for row in range(w["rows"][0], w["rows"][1] + 1)],
            "lifts": data["lifts"],
            "spawn": (data["spawnEngine"]["x"], data["spawnEngine"]["y"]),
        }
    if level == 3:
        return {
            "floors": by_sheet(data["floorTiles"]),
            "walls": pairs(blocking["solidTiles"]),
            "wallCells": [(table_col(w), w["engine"][1]) for w in blocking["codeWalls"]],
            "codeCells": [],
            "lifts": data["lifts"],
            "spawn": tuple(data["spawnEngine"]),
        }
    return {
        "floors": pairs(data["floorTiles"]["tiles"]),
        "walls": pairs(blocking["solidTiles"]) | pairs(blocking["solidTilesB"]),
        "wallCells": [(table_col(w), w["engine"][1]) for w in blocking["wallTables"]],
        "namedWalls": {w["object"]: (table_col(w), w["engine"][1]) for w in blocking["wallTables"] if "object" in w},
        "codeCells": [],
        "lifts": data["lifts"],
        "spawn": tuple(data["spawn"]["engine"]),
    }


def floor_near(floors, col, row, reach):
    return 0 <= row < H and any(floors[row][c] for c in range(max(col - reach, 0), min(col + reach, W - 1) + 1))


def raise_wall(grid, floors, col, plank):
    for row in range(plank - 1, max(plank - 1 - STAND, -1), -1):
        if floors[row][col]:
            return
        grid[row][col] = "#"


def bare_wall_top(grid, col, row):
    beside = [grid[row][c] for c in (col - 1, col + 1) if 0 <= c < W]
    return grid[row][col] == "#" and row > 0 and grid[row - 1][col] == "." and "=" not in beside


def cap_walls(grid):
    for col, row in [(c, r) for r in range(H) for c in range(W) if bare_wall_top(grid, c, r)]:
        grid[row - 1][col] = "|"


def tile_rows(data, layout):
    floors = [[tile_at(data, col, row) in layout["floors"] for col in range(W)] for row in range(H)]
    grid = [["=" if floors[row][col] else "." for col in range(W)] for row in range(H)]
    walls = [(col, row) for row in range(H) for col in range(W) if tile_at(data, col, row) in layout["walls"]]
    for col, row in walls:
        grid[row][col] = "#"
        if floor_near(floors, col, row + 1, 1):
            raise_wall(grid, floors, col, row + 1)
    for col, y in layout["wallCells"]:
        for plank in [p for p in range(y + 4, y + 7) if floor_near(floors, col, p, 3)] or [y + 6]:
            raise_wall(grid, floors, col, plank)
    cap_walls(grid)
    for col, row in layout["codeCells"]:
        if grid[row][col] == ".":
            grid[row][col] = "|"
    for col in CLAMP_COLS:
        for row in range(H):
            if grid[row][col] == ".":
                grid[row][col] = "|"
    return grid


def open_shafts(grid, lifts):
    changed = []
    for lift in lifts:
        for row in range(lift["stops"][0] - 2, lift["stops"][-1] + 1):
            cell = "=" if row in lift["stops"] else "."
            for col in range(lift["x"], lift["x"] + lift["width"]):
                if grid[row][col] != cell:
                    changed.append((col, row, grid[row][col], cell))
                    grid[row][col] = cell
    return changed


def drop_spawn(grid, engine):
    col, row = engine[0] + 6, engine[1] + 6
    while grid[row][col] not in "#=":
        row += 1
        if row >= H:
            raise SystemExit(f"no floor under spawn at {col}")
    if grid[row - 1][col] != "." or grid[row - 2][col] != ".":
        raise SystemExit(f"spawn not open at {col},{row}")
    return [col + 0.5, row]


def span(v):
    return (v, v) if isinstance(v, int) else (v[0], v[1])


def zone_rect(engine):
    y = engine["y"]
    if isinstance(y, str):
        y0, y1 = int(y.lstrip("> ")) + 1, H - 1 - STAND
    else:
        y0, y1 = span(y)
    x0, x1 = span(engine["x"]) if "x" in engine else (-6, W - 7)
    col, last = x0 + 6, min(x1 + 6, W - 1)
    row, bottom = y0 + STAND, min(y1 + STAND, H - 1)
    return {"col": col, "row": row, "w": last - col + 1, "h": bottom - row + 1}


def damage_rates(spec):
    period = spec["clipFrames"] * spec["clipJiffies"] * FLI_JIFFY_S
    return {"perSecond": round(spec["hit"] / period, 1), "push": round(spec["push"] / period, 2)}


def hazards(zones, cfg):
    out = []
    for index, (name, kind) in cfg["hazardZones"].items():
        hazard = {"id": name, "kind": kind, **zone_rect(zones[index]["engine"])}
        if kind == "damage":
            hazard.update(damage_rates(cfg["damage"][name]))
        out.append(hazard)
    for name, (engine, sound) in cfg.get("soundZones", {}).items():
        out.append({"id": name, "kind": "damage", **zone_rect(engine), "perSecond": 0, "sound": sound})
    return out


def runs(cells):
    out = []
    for row, col in sorted((r, c) for c, r in cells):
        if out and out[-1]["row"] == row and out[-1]["col"] + out[-1]["w"] == col:
            out[-1]["w"] += 1
        else:
            out.append({"col": col, "row": row, "w": 1})
    return out


def conveyors(data, zones, cfg):
    carry = [z for z in zones if z.get("kind") == "carry"]
    if not carry:
        return []
    tiles = pairs(carry[0]["tiles"])
    vx = round(cfg["conveyorPxPerTick"] * TICKS_PER_S / CELL_PX, 2)
    cells = [(col, row) for row in range(H) for col in range(W) if tile_at(data, col, row) in tiles]
    return [{**run, "vx": vx} for run in runs(cells)]


def foot(grid, col, row):
    if grid[row][col] != "." or grid[row + 1][col] not in "#=":
        raise SystemExit(f"no floor under foot cell {col},{row}")
    return [col, row]


def pad(grid, cols, floor):
    return {"from": foot(grid, (cols[0] + cols[1]) // 2, floor - 1), "col": cols[0], "w": cols[1] - cols[0] + 1}


def teleports(grid, layout, cfg):
    out = []
    for index, name in cfg.get("teleportZones", {}).items():
        zone = layout["zones"][index]
        flag = cfg.get("teleportFlags", {}).get(name)
        out.append(
            {"id": name, **pad(grid, zone["from"]["cols"], zone["from"]["floor"]), "to": foot(grid, zone["to"]["col"], zone["to"]["floor"] - 1)}
            | ({"enabledBy": flag} if flag else {})
        )
    for lift in layout.get("scriptedLifts", []):
        for end, other, way in (("bottom", "top", "Up"), ("top", "bottom", "Down")):
            col, floor = lift[end]["to"]
            out.append({"id": lift["id"] + way, **pad(grid, lift[end]["cols"], lift[end]["floor"]), "to": foot(grid, col, floor - 1)})
    return out


def standable(grid, deaths, col, row):
    return 0 <= col < W and grid[row][col] not in "#|" and grid[row + 1][col] in "#=" and not any(
        h["col"] <= col < h["col"] + h["w"] and h["row"] <= row < h["row"] + h["h"] for h in deaths
    )


def walk_run(grid, deaths, col, row):
    a = b = col
    while standable(grid, deaths, a - 1, row):
        a -= 1
    while standable(grid, deaths, b + 1, row):
        b += 1
    return a, b


def enemy(grid, deaths, e):
    col, row = e["cell"]
    if not standable(grid, deaths, col, row):
        raise SystemExit(f"enemy {e['id']} off its floor at {col},{row}")
    a, b = walk_run(grid, deaths, col, row)
    lo, hi = max(e["patrol"][0], a), min(e["patrol"][1], b)
    free = sorted((c for c in range(lo, hi + 1) if grid[row][c] == "."), key=lambda c: (abs(c - col), c))
    if not free:
        raise SystemExit(f"enemy {e['id']} has no open foot cell on its floor at row {row}")
    if (free[0], lo, hi) != (col, *e["patrol"]):
        print(f"enemy {e['id']} cell {col} -> {free[0]}, patrol {e['patrol']} -> {[lo, hi]}", file=sys.stderr)
    return {"kind": e["type"], "hp": e["engine"]["hp"], "cell": foot(grid, free[0], row), "patrol": [lo, hi]}


def enemies_of(grid, enemies, kinds, hazards):
    deaths = [h for h in hazards if h["kind"] == "death"]
    return [enemy(grid, deaths, e) for e in enemies["enemies"] if e["type"] in kinds]


def variant_grid(data, layout, cfg, name):
    drops = {layout.get("namedWalls", {})[wall] for wall in cfg.get("variantDrops", {}).get(name, [])}
    grid = tile_rows(data, {**layout, "wallCells": [w for w in layout["wallCells"] if w not in drops]})
    open_shafts(grid, plain_lifts(layout["lifts"], cfg))
    compose(grid, cfg)
    return grid


def inside(rects, col, row):
    return any(c0 <= col <= c1 and r0 <= row <= r1 for c0, r0, c1, r1 in rects)


def variants(base, map_path, layout, cfg):
    out, sources = {}, {}
    for vid, name in cfg["variants"].items():
        with open(os.path.join(os.path.dirname(map_path), name + ".MAP"), "rb") as f:
            grid = variant_grid(f.read(), layout, cfg, name)
        rects = cfg.get("variantRects", {}).get(name)
        out[vid] = [
            {"col": col, "row": row, "ch": grid[row][col]}
            for row in range(H)
            for col in range(cfg.get("width", W))
            if grid[row][col] != base[row][col] and (rects is None or inside(rects, col, row))
        ]
        sources[vid] = name
    return out, sources


def build_tiles(data, layout, cfg, raw, enemies, map_path):
    grid = tile_rows(data, layout)
    lifts = plain_lifts(layout["lifts"], cfg)
    for col, row, was, now in open_shafts(grid, lifts):
        print(f"shaft cell {col},{row} {was} -> {now}", file=sys.stderr)
    compose(grid, cfg)
    found, sources = variants(grid, map_path, layout, cfg)
    zones = hazards(raw["zones"], cfg)
    return {
        "status": "draft",
        "source": cfg["source"],
        "rows": ["".join(r[:cfg.get("width", W)]) for r in grid],
        "lifts": [lift_json(lift, cfg) for lift in lifts],
        "spawn": drop_spawn(grid, layout["spawn"]),
        "fallDeathCells": cfg["fallDeathCells"],
        "hazards": zones,
        "conveyors": conveyors(data, raw["zones"], cfg),
        "teleports": teleports(grid, raw, cfg),
        "variants": found,
        "variantSources": sources,
        "enemies": enemies_of(grid, enemies, cfg["enemyKinds"], zones),
    }


def write(out, path):
    d = lambda v: json.dumps(v, ensure_ascii=False)
    keys = list(out)
    lines = ["{"]
    for key in keys:
        end = "" if key == keys[-1] else ","
        value = out[key]
        if isinstance(value, list) and value and isinstance(value[0], (str, dict)):
            lines.append(f'  "{key}": [')
            lines.append(",\n".join(f"    {d(v)}" for v in value))
            lines.append(f"  ]{end}")
        elif isinstance(value, dict) and any(isinstance(v, list) for v in value.values()):
            lines.append(f'  "{key}": {{')
            lines.append(",\n".join(f'    {d(k)}: {d(v)}' for k, v in value.items()))
            lines.append(f"  }}{end}")
        else:
            lines.append(f'  "{key}": {d(value)}{end}')
    lines.append("}")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def main():
    level = int(sys.argv[1])
    map_path, layout_path, enemies_path, out_path = sys.argv[2:6]
    with open(map_path, "rb") as f:
        data = f.read()
    with open(layout_path, encoding="utf-8") as f:
        layout = json.load(f)
    with open(enemies_path, encoding="utf-8") as f:
        enemies = json.load(f)
    if level == 1:
        write(build(data, {**layout, "lifts": with_stops(layout["lifts"], EXTRAS[level])}, enemies, EXTRAS[level]), out_path)
    else:
        write(build_tiles(data, layout_of(level, layout), EXTRAS[level], layout, enemies, map_path), out_path)


main()
