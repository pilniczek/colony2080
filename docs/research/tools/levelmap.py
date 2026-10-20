import json
import sys

W, H = 160, 80
BAND = 6
EMPTY = (0, 0)
EXTRAS = {
    1: {
        "source": (
            "docs/research/reports/13-level1-layout.md, built by docs/research/tools/mestomap.py from MAPY/M11.MAP "
            "and gamedata/disasm/level1_layout.json: '#' floor planks and wall columns, '|' invisible blocker at a floor end "
            "(map clamp), lift shafts open on their plank rows; taskWalls are the walls a task removes (water, plasma, card door, "
            "dark metro tunnel), not baked into rows; the tunnel west end wall is dropped so the tunnel is walkable once open; "
            "lift stops are the repaired ones for the damaged lift (enabledBy); droids are the chromeDroid cells and patrols from config/levels/mesto/enemies.json; flyers are its flyer cells and patrols with the plank row of their floor (engine y + 6); '|' shaft floors under two bottom stops stop a survivable "
            "drop past a lift (report 13, Our blockers)"
        ),
        "spawn": [62.5, 59],
        "liftHints": {55: "The lift is broken."},
        "tunnelWestEnd": (70, 40),
        "taskWalls": {
            (75, 20): "waterPipe",
            (44, 102): "plasmaBarrier",
            (23, 49): "cardDoor",
            (70, 56): "metroTunnel",
        },
        "shaftFloors": [(col, 17) for col in range(52, 55)] + [(col, 31) for col in range(33, 36)],
    },
    2: {
        "source": (
            "docs/research/reports/14-level2-layout.md, built by docs/research/tools/levelmap.py from MAPY/M21.MAP "
            "and gamedata/disasm/level2_layout.json: '#' floor support tiles and wall tiles (walls filled over the hero stand height), "
            "'|' map clamp (columns 6 and 158) and the bridge guard post code wall, lift shafts open from two rows over the top stop "
            "to the bottom stop; spawn dropped from engine (146, 33) to the floor below"
        ),
        "fallDeathCells": None,
    },
    3: {
        "source": (
            "docs/research/reports/15-level3-layout.md, built by docs/research/tools/levelmap.py from MAPY/M31.MAP "
            "and gamedata/disasm/level3_layout.json: '#' floor tiles, wall tiles and wall table columns (west x+4, east x+7, "
            "filled over the hero stand height), '|' map clamp (columns 6 and 158); no lifts (the tower lift is a scripted teleport); "
            "spawn on the spawn ledge"
        ),
        "fallDeathCells": None,
    },
    4: {
        "source": (
            "docs/research/reports/16-level4-layout.md, built by docs/research/tools/levelmap.py from MAPY/M41.MAP "
            "and gamedata/disasm/level4_layout.json: '#' floor tiles, wall tiles and wall table columns (west x+4, east x+7, "
            "filled over the hero stand height), '|' map clamp (columns 6 and 158), lift shafts open from two rows over the top stop "
            "to the bottom stop; lift 1 uses its stops after the rod (enabledBy); spawn dropped from engine (28, 8) to floor 20"
        ),
        "liftEnabled": {49: ("flag:liftLock", [29, 44, 55])},
        "fallDeathCells": None,
    },
}
CLAMP_COLS = (6, 158)
STAND = 5


def tile_at(data, col, row):
    i = (row * W + col) * 2
    return (data[i], data[i + 1])


def fill(grid, col, top, bottom, char):
    for row in range(top, bottom + 1):
        if grid[row][col] != "#":
            grid[row][col] = char


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
            elif key != cfg["tunnelWestEnd"]:
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
    for col, row in shaft_cells(layout["lifts"], segments):
        grid[row][col] = "."
    for col, row in cfg["shaftFloors"]:
        if grid[row][col] != ".":
            raise SystemExit(f"shaft floor not empty at {col},{row}")
        grid[row][col] = "|"
    lifts = [lift_json(lift, cfg) for lift in layout["lifts"]]
    for lift in lifts:
        for row in range(lift["top"] - 2, lift["bottom"] + 1):
            for col in range(lift["x"], lift["x"] + lift["width"]):
                if grid[row][col] != ".":
                    raise SystemExit(f"lift shaft blocked at {col},{row}")
    task_walls.sort(key=lambda w: (w["id"], w["col"]))
    return {
        "status": "draft",
        "source": cfg["source"],
        "rows": ["".join(r) for r in grid],
        "lifts": lifts,
        "taskWalls": task_walls,
        "droids": droids(enemies),
        "flyers": flyers(enemies),
        "spawn": cfg["spawn"],
    }


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
        out.append({"x": lift["x"], "width": lift["width"], "stops": stops, "start": lift["start"], "enabledBy": enabled})
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


def build_tiles(data, layout, cfg):
    grid = tile_rows(data, layout)
    lifts = plain_lifts(layout["lifts"], cfg)
    for col, row, was, now in open_shafts(grid, lifts):
        print(f"shaft cell {col},{row} {was} -> {now}", file=sys.stderr)
    return {
        "status": "draft",
        "source": cfg["source"],
        "rows": ["".join(r) for r in grid],
        "lifts": [lift_json(lift, cfg) for lift in lifts],
        "spawn": drop_spawn(grid, layout["spawn"]),
        "fallDeathCells": cfg["fallDeathCells"],
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
        write(build(data, layout, enemies, EXTRAS[level]), out_path)
    else:
        write(build_tiles(data, layout_of(level, layout), EXTRAS[level]), out_path)


main()
