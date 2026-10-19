import json
import sys

W, H = 160, 80
BAND = 6
SPAWN = [62.5, 59]
TUNNEL_WEST_END = (70, 40)
TASK_WALLS = {
    (75, 20): "waterPipe",
    (44, 102): "plasmaBarrier",
    (23, 49): "cardDoor",
    (70, 56): "metroTunnel",
}
SOURCE = (
    "docs/research/reports/13-level1-layout.md, built by docs/research/tools/mestomap.py from MAPY/M11.MAP "
    "and gamedata/disasm/level1_layout.json: '#' floor planks and wall columns, '|' invisible blocker at a floor end "
    "(map clamp), lift shafts open on their plank rows; taskWalls are the walls a task removes (water, plasma, card door, "
    "dark metro tunnel), not baked into rows; the tunnel west end wall is dropped so the tunnel is walkable once open; "
    "lift stops are the repaired ones for the damaged lift (enabledBy)"
)


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


def lift_json(lift):
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
    return out


def build(data, layout):
    blocking = layout["blocking"]
    floors = sorted(layout["floors"])
    solid_tiles = {tuple(t) for t in blocking["solidTiles"]}
    code_walls = {(w["floor"], w["solidCol"]) for w in blocking["codeWalls"]}
    extra = layout["extraStopFloor"]
    segments = {int(f): s for f, s in blocking["walkSegments"].items()}
    segments[extra["row"]] = [extra["cols"]]
    grid = [["."] * W for _ in range(H)]
    task_walls = []
    for floor, segs in sorted(segments.items()):
        top = band_top(floor, floors) if floor in floors else floor - BAND
        for a, b in segs:
            for col in range(a, b + 1):
                grid[floor][col] = "#"
        gaps = [c for (_, b), (a, _) in zip(segs, segs[1:]) for c in range(b + 1, a)]
        for col in gaps:
            key = (floor, col)
            if key in TASK_WALLS:
                grid[floor][col] = "#"
                task_walls.append({"id": TASK_WALLS[key], "col": col, "top": top, "bottom": floor - 1})
            elif key == TUNNEL_WEST_END:
                grid[floor][col] = "#"
            else:
                fill(grid, col, top, floor, "#")
        for col in (segs[0][0] - 1, segs[-1][1] + 1):
            if (floor, col) in code_walls or tile_at(data, col, floor - 1) in solid_tiles:
                fill(grid, col, top, floor, "#")
            else:
                fill(grid, col, top, floor - 1, "|")
    for col, row in shaft_cells(layout["lifts"], segments):
        grid[row][col] = "."
    lifts = [lift_json(lift) for lift in layout["lifts"]]
    for lift in lifts:
        for row in range(lift["top"] - 2, lift["bottom"] + 1):
            for col in range(lift["x"], lift["x"] + lift["width"]):
                if grid[row][col] != ".":
                    raise SystemExit(f"lift shaft blocked at {col},{row}")
    task_walls.sort(key=lambda w: (w["id"], w["col"]))
    return {
        "status": "draft",
        "source": SOURCE,
        "rows": ["".join(r) for r in grid],
        "lifts": lifts,
        "taskWalls": task_walls,
        "spawn": SPAWN,
    }


def write(out, path):
    d = lambda v: json.dumps(v, ensure_ascii=False)
    lines = ["{"]
    lines.append(f'  "status": {d(out["status"])},')
    lines.append(f'  "source": {d(out["source"])},')
    lines.append('  "rows": [')
    lines.append(",\n".join(f"    {d(r)}" for r in out["rows"]))
    lines.append("  ],")
    for key in ("lifts", "taskWalls"):
        lines.append(f'  "{key}": [')
        lines.append(",\n".join(f"    {d(v)}" for v in out[key]))
        lines.append("  ],")
    lines.append(f'  "spawn": {d(out["spawn"])}')
    lines.append("}")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def main():
    map_path, layout_path, out_path = sys.argv[1:4]
    with open(map_path, "rb") as f:
        data = f.read()
    with open(layout_path, encoding="utf-8") as f:
        layout = json.load(f)
    write(build(data, layout), out_path)


main()
