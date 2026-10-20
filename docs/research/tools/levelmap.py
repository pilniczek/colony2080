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
            "lift stops are the repaired ones for the damaged lift (enabledBy); droids are the chromeDroid cells and patrols from config/levels/mesto/enemies.json; flyers are its flyer cells and patrols with the plank row of their floor (engine y + 6); '|' shaft floors fill every bottom stop row so no pit "
            "opens under a lift (report 13, Our blockers); the crane mast gap (floor 10, cols 36-38) stays a plank with no wall so the hero walks west "
            "past the crane panel, and the plank row 10 gap over the crane (cols 22-30) stays open (user)"
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
        "plankGaps": {(10, col) for col in range(36, 39)},
        "holes": [(col, 10) for col in range(22, 31)],
    },
    2: {
        "source": (
            "docs/research/reports/14-level2-layout.md, built by docs/research/tools/levelmap.py from MAPY/M21.MAP "
            "and gamedata/disasm/level2_layout.json: '=' one-way floor support tiles, '#' wall tiles (walls filled over the hero stand height), "
            "'|' map clamp (columns 6 and 158), the bridge guard post code wall and a cap over each bare wall top (wall tiles hold no hero), lift shafts open from two rows over the top stop "
            "to the bottom stop; spawn dropped from engine (146, 33) to the floor below; "
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
        "source": (
            "docs/research/reports/15-level3-layout.md, built by docs/research/tools/levelmap.py from MAPY/M31.MAP "
            "and gamedata/disasm/level3_layout.json: '=' one-way floor tiles, '#' wall tiles and wall table columns (west x+4, east x+7, "
            "filled over the hero stand height), '|' map clamp (columns 6 and 158) and a cap over each bare wall top (wall tiles hold no hero); no lifts (the tower lift is a scripted teleport); "
            "spawn on the spawn ledge; "
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
        "source": (
            "docs/research/reports/16-level4-layout.md, built by docs/research/tools/levelmap.py from MAPY/M41.MAP "
            "and gamedata/disasm/level4_layout.json: '=' one-way floor tiles, '#' wall tiles and wall table columns (west x+4, east x+7, "
            "filled over the hero stand height), '|' map clamp (columns 6 and 158) and a cap over each bare wall top (wall tiles hold no hero), lift shafts open from two rows over the top stop "
            "to the bottom stop; lift 1 uses its stops after the rod (enabledBy); spawn dropped from engine (28, 8) to floor 20; "
        )
        + ZONES_NOTE,
        "liftEnabled": {49: ("flag:liftLock", [29, 44, 55])},
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
    for col, row in shaft_cells(layout["lifts"], segments):
        grid[row][col] = "."
    lifts = [lift_json(lift, cfg) for lift in layout["lifts"]]
    for lift in lifts:
        for col in range(lift["x"], lift["x"] + lift["width"]):
            grid[lift["bottom"]][col] = "|"
        for row in range(lift["top"] - 2, lift["bottom"]):
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
            for col in range(W)
            if grid[row][col] != base[row][col] and (rects is None or inside(rects, col, row))
        ]
        sources[vid] = name
    return out, sources


def build_tiles(data, layout, cfg, raw, enemies, map_path):
    grid = tile_rows(data, layout)
    lifts = plain_lifts(layout["lifts"], cfg)
    for col, row, was, now in open_shafts(grid, lifts):
        print(f"shaft cell {col},{row} {was} -> {now}", file=sys.stderr)
    found, sources = variants(grid, map_path, layout, cfg)
    zones = hazards(raw["zones"], cfg)
    return {
        "status": "draft",
        "source": cfg["source"],
        "rows": ["".join(r) for r in grid],
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
        write(build(data, layout, enemies, EXTRAS[level]), out_path)
    else:
        write(build_tiles(data, layout_of(level, layout), EXTRAS[level], layout, enemies, map_path), out_path)


main()
