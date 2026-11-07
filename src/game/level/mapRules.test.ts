import cameraJson from "@config/camera.json";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { ASSETS, type AssetId } from "../env/assets";
import { createFog, loadFog } from "../fog";
import { cfg } from "../hero/testWorld";
import type { MissionId } from "./missionIds";
import { loadMission } from "./missions";
import { id } from "./reach";
import type { Lift, SandboxWorld, Scenery } from "./sandboxLevel";
import { terrain, type Run } from "./terrain";
import { openGraph, opened } from "./testMissions";

const BUILT: MissionId[] = ["mesto", "vesnice", "jeskyne"];

type Role =
  | "sky" | "far" | "filler" | "wall" | "fence" | "floor" | "girder" | "building" | "support" | "pipe"
  | "machine" | "rubble" | "mounted" | "bigClutter" | "smallClutter" | "sign" | "panel";

const GRIMED: Role[] = ["far", "filler", "wall", "fence", "floor", "girder", "building", "support", "pipe", "machine", "rubble"];
const TOWERS: Role[] = ["building", "wall"];
const BACK: Role[] = ["sky", "far", "filler", "wall", "fence", "floor", "girder", "building", "support", "pipe", "machine", "rubble"];
const OVERLAP_SHARE = 0.1;
const BOX_SLACK = 0.4;

interface Cells {
  col: number;
  row: number;
  w: number;
  h: number;
  why: string;
}

interface MissionRules {
  roles: Record<Role, AssetId[]> & { hazard?: AssetId[] };
  hangs: AssetId[];
  panelProps: string[];
  clutter: { small: number; big: number };
  blockersUnderArt: boolean;
  openEnds: Cells[];
  towersOnReach: { asset: AssetId; x: number; why: string }[];
  seenFrom?: Cells[];
}

const RULES: Partial<Record<MissionId, MissionRules>> = {
  mesto: {
    roles: {
      sky: ["skyBackground"],
      far: ["skylineTower", "midgroundRuins"],
      filler: ["brickWall"],
      wall: ["brickWall", "graffitiWall", "tunnelWall", "metroPlatformWall"],
      fence: ["chainFence"],
      floor: ["streetWalkway", "tunnelFloor", "hazardPlate", "liftLanding"],
      girder: ["girderBridge"],
      building: ["windowBuilding", "ruinedBuilding", "colonnadeBuilding", "facadeTower", "gantryBuilding"],
      support: ["latticePylon", "craneMast", "staircase"],
      pipe: ["pipeColumn", "pipeBend", "ceilingPipe"],
      machine: ["fuelTank", "metroTrain"],
      rubble: ["rubblePile", "fallenGirders"],
      mounted: ["floorVent"],
      bigClutter: ["carWreck"],
      smallClutter: ["barrel", "tyres", "brickPile"],
      sign: ["signPost", "barSign", "stripLight"],
      panel: ["liftPanel"],
    },
    hangs: ["stripLight", "ceilingPipe"],
    panelProps: ["damagedLift"],
    clutter: { small: 14, big: 13 },
    blockersUnderArt: true,
    openEnds: [
      { col: 22, row: 10, w: 9, h: 1, why: "crane gap in plank row 10 (levelmap.py holes)" },
      { col: 6, row: 11, w: 17, h: 40, why: "open sky over the crashed ship (levelmap.py sky)" },
    ],
    towersOnReach: [{ asset: "facadeTower", x: 11, why: "the crashed ship pad is its roof" }],
  },
  vesnice: {
    roles: {
      sky: ["villageBackdrop"],
      far: ["farPalms", "farRuins"],
      filler: ["crateWall", "stoneWall"],
      wall: ["rivetWall", "plankWall"],
      fence: ["chainFence"],
      floor: ["grassyWalkway", "steelDeckPlate", "liftLanding"],
      girder: ["trussWalkway"],
      building: ["villageHouse", "stiltBuilding", "powerHouse"],
      support: ["latticeMast", "watchtower"],
      pipe: ["pipeColumn", "overheadPipeline"],
      machine: ["transformer", "storageTank", "fuelTank", "powerPlant"],
      rubble: ["rockCliff", "rubbleHeap"],
      mounted: ["warningLamp", "junctionBox"],
      bigClutter: ["militaryWreck"],
      smallClutter: ["fuelDrum", "sandbags", "shellCrate", "smoulderingRemains"],
      sign: ["warningLamp"],
      panel: ["liftPanel"],
    },
    hangs: ["overheadPipeline"],
    panelProps: [],
    clutter: { small: 14, big: 13 },
    blockersUnderArt: false,
    openEnds: [
      { col: 45, row: 13, w: 15, h: 14, why: "rock mass slope over floors 23 and 32, cols 46-63, tops nobody reaches (original rock tiles, map M21)" },
      { col: 85, row: 11, w: 12, h: 7, why: "crate block mass over floor 23, cols 87-95, tops nobody reaches (map M21)" },
      { col: 101, row: 23, w: 10, h: 4, why: "crate and rock mass under floor 23, cols 102-109, tops nobody reaches (map M21)" },
      { col: 116, row: 13, w: 11, h: 5, why: "rock slope west of floor 23 east, cols 117-125, tops nobody reaches (map M21)" },
      { col: 147, row: 12, w: 6, h: 6, why: "rock slope east of floor 23 east, cols 148-156, tops nobody reaches (map M21)" },
      { col: 7, row: 23, w: 1, h: 1, why: "west edge wall top under the open sky (levelmap.py patches)" },
      { col: 28, row: 26, w: 3, h: 1, why: "top of the col 29 wall the dynamite blows to end the level (report 14 marker 14)" },
    ],
    towersOnReach: [],
  },
  jeskyne: {
    roles: {
      sky: ["caveBackdrop"],
      far: ["farStalagmites"],
      filler: ["caveRock"],
      wall: ["rockRibs", "lavaFall"],
      fence: ["safetyRail"],
      floor: ["caveFloor", "liftLanding"],
      girder: ["rockLedge", "mineCarts"],
      building: ["metalPillars"],
      support: ["ropeColumn", "shaftHead"],
      pipe: ["minePipe"],
      machine: ["pressureTank", "cartCrusher"],
      rubble: ["screeHeap"],
      mounted: ["caveLamp"],
      bigClutter: ["mineWreck"],
      smallClutter: ["powderKeg", "toolCrate"],
      sign: ["explosiveSign", "caveLamp"],
      panel: ["liftPanel"],
      hazard: ["lavaPit", "chasm"],
    },
    hangs: ["ropeColumn", "shaftHead", "cartCrusher", "lavaPit", "chasm", "stalactite"],
    panelProps: [],
    clutter: { small: 14, big: 13 },
    blockersUnderArt: false,
    openEnds: [
      { col: 18, row: 19, w: 1, h: 1, why: "start drop from floor 20 to floor 28 (report 16 start chain)" },
      { col: 32, row: 27, w: 1, h: 1, why: "start drop from floor 28 to floor 36 (report 16 start chain)" },
      { col: 23, row: 35, w: 1, h: 1, why: "start drop from floor 36 to floor 43 (report 16 start chain)" },
      { col: 35, row: 42, w: 1, h: 1, why: "start drop from floor 43 to floor 55 (report 16 start chain)" },
      { col: 61, row: 19, w: 1, h: 1, why: "stalactite chasm edge, floor 20 east (report 16 zones)" },
      { col: 95, row: 20, w: 6, h: 1, why: "middle chasm edges and its one-cell platform, floor 21 (report 16 chasm 8)" },
      { col: 101, row: 23, w: 1, h: 1, why: "floor 24 under the middle chasm, the jump back to the platform (report 16 chasm 8)" },
      { col: 124, row: 14, w: 6, h: 6, why: "ledge stair from floor 15 down to floor 21 (map M41)" },
      { col: 130, row: 20, w: 7, h: 10, why: "east ledge stair from floor 31 up to floor 21 (map M41)" },
      { col: 117, row: 30, w: 5, h: 8, why: "ledge stair from the carts up to floor 31 (map M41)" },
      { col: 104, row: 28, w: 1, h: 1, why: "drop from the floor 29 east end to the carts (report 16 route)" },
      { col: 75, row: 38, w: 3, h: 1, why: "hanging wall col 76, kept short so falls pass it (requirements.md)" },
      { col: 88, row: 47, w: 3, h: 1, why: "hanging wall col 89, kept short so falls pass it (requirements.md)" },
      { col: 87, row: 38, w: 5, h: 2, why: "cart conveyor west end, the drop to the bottom corridor (report 16 route)" },
      { col: 131, row: 38, w: 2, h: 2, why: "cart conveyor east end at the crusher (report 16 zones)" },
      { col: 71, row: 43, w: 1, h: 1, why: "drop from floor 44 to floor 51, the key door route (report 16)" },
      { col: 116, row: 47, w: 7, h: 8, why: "ledge stair from floor 56 up to floor 48 (map M41)" },
      { col: 77, row: 50, w: 1, h: 1, why: "drop from floor 51 to floor 64 (report 16 key route)" },
      { col: 84, row: 51, w: 12, h: 14, why: "ledge stair from floor 66 up to the entry card (map M41); the col 85 wall stays short so the drop from floor 51 passes it" },
      { col: 104, row: 57, w: 9, h: 8, why: "ledge stair from floor 66 up to floor 58 (map M41)" },
      { col: 62, row: 62, w: 2, h: 2, why: "floor 63 and floor 64 ends over the row 67 ledge (map M41)" },
      { col: 15, row: 62, w: 1, h: 1, why: "lava shaft lip, floor 63 west end, the marker 13 jump (report 16 dead end 2)" },
      { col: 19, row: 25, w: 1, h: 1, why: "step ledge splitting a long drop into falls of at most 7 rows (global fall rule, levelmap.py)" },
      { col: 31, row: 32, w: 1, h: 1, why: "step ledge splitting a long drop into falls of at most 7 rows (global fall rule, levelmap.py)" },
      { col: 106, row: 33, w: 1, h: 1, why: "step ledge splitting a long drop into falls of at most 7 rows (global fall rule, levelmap.py)" },
      { col: 131, row: 45, w: 1, h: 1, why: "step ledge splitting a long drop into falls of at most 7 rows (global fall rule, levelmap.py)" },
      { col: 135, row: 45, w: 1, h: 1, why: "step ledge splitting a long drop into falls of at most 7 rows (global fall rule, levelmap.py)" },
      { col: 85, row: 45, w: 1, h: 1, why: "step ledge splitting a long drop into falls of at most 7 rows (global fall rule, levelmap.py)" },
      { col: 89, row: 45, w: 1, h: 1, why: "step ledge splitting a long drop into falls of at most 7 rows (global fall rule, levelmap.py)" },
      { col: 39, row: 48, w: 1, h: 1, why: "step ledge splitting a long drop into falls of at most 7 rows (global fall rule, levelmap.py)" },
      { col: 80, row: 56, w: 1, h: 1, why: "step ledge splitting a long drop into falls of at most 7 rows (global fall rule, levelmap.py)" },
      { col: 15, row: 71, w: 1, h: 1, why: "lava shaft lip of the marker 13 ledge (report 16 dead end 2)" },
      { col: 21, row: 71, w: 1, h: 1, why: "marker 13 ledge east end over the lava pit (report 16 dead end 2)" },
      { col: 44, row: 73, w: 49, h: 1, why: "lava gaps in the bottom corridor floor (report 16 lava)" },
    ],
    towersOnReach: [],
    seenFrom: [
      { col: 21, row: 74, w: 23, h: 1, why: "bottom corridor west of the lava gaps, reached by running jumps the strict graph leaves out (report 16 lava)" },
      { col: 17, row: 72, w: 3, h: 1, why: "marker 13 energy ledge over the lava shaft, an exact jump no reach graph models (report 16 dead end 2)" },
    ],
  },
};

const rulesOf = (mission: MissionId): MissionRules => RULES[mission]!;

const TILE = 24;

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

const boxOf = (world: SandboxWorld, s: Scenery): Box => {
  const [left, boxTop, boxRight, bottom] = ASSETS[s.asset].box;
  const right = s.w === undefined ? boxRight : s.w * TILE - left;
  const top = s.h === undefined ? boxTop : -s.h * TILE;
  const [l, r] = s.flip ? [-right, -left] : [left, right];
  const y = s.y ?? world.spawn[1];
  return { x0: s.x + l / TILE, x1: s.x + r / TILE, y0: y + top / TILE, y1: y + bottom / TILE };
};

const baseCols = (b: Box): number[] => {
  const cols: number[] = [];
  for (let col = Math.floor(b.x0 + 0.01); col < Math.ceil(b.x1 - 0.01); col++) cols.push(col);
  return cols;
};

const inCells = (cells: Omit<Cells, "why">[], col: number, row: number): boolean => cells.some((c) => col >= c.col && col < c.col + c.w && row >= c.row && row < c.row + c.h);

const inShaft = (lifts: Lift[], col: number, row: number): boolean => lifts.some((l) => l.top <= row && row <= l.bottom && col >= l.x && col < l.x + l.w);

const sceneryOf = (world: SandboxWorld): Scenery[] => [...world.backdrop, ...world.dressing];

const rolesOf = (rules: MissionRules, asset: AssetId): string[] => Object.entries(rules.roles).filter(([, assets]) => assets.includes(asset)).map(([role]) => role);

const label = (s: Scenery): string => `${s.asset} ${s.x},${s.y}`;

interface Reached {
  runs: Run[];
  body: Set<string>;
  seen: Uint8Array;
}

const reachedCache = new Map<MissionId, Reached>();

function reached(mission: MissionId): Reached {
  const cached = reachedCache.get(mission);
  if (cached) return cached;
  const world = opened(mission);
  const { r, from } = openGraph(world);
  const runs = r.runs.filter((run) => from.has(id(run)));
  const body = new Set(runs.flatMap((run) => Array.from({ length: run.w }, (_, i) => [`${run.col + i},${run.row - 1}`, `${run.col + i},${run.row - 2}`]).flat()));
  const strict = openGraph(world, "strict");
  const spots: [number, number][] = [];
  for (const run of strict.r.runs.filter((run) => strict.from.has(id(run)))) for (let col = run.col; col < run.col + run.w; col++) spots.push([col + 0.5, run.row]);
  for (const l of world.lifts) for (let row = l.top; row <= l.bottom; row++) spots.push([l.x + l.w / 2, row]);
  for (const c of rulesOf(mission).seenFrom ?? []) for (let col = c.col; col < c.col + c.w; col++) spots.push([col + 0.5, c.row]);
  const fog = loadFog(cameraJson);
  const seen = new Uint8Array(world.grid.width * world.grid.height);
  for (const [x, y] of spots) for (const i of createFog(fog, cfg, { x, y }, world.grid).seenCells) seen[i] = 1;
  const out = { runs, body, seen };
  reachedCache.set(mission, out);
  return out;
}

const ENV_DIR = join(__dirname, "../env");

const envSources = readdirSync(ENV_DIR)
  .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
  .map((f) => ts.createSourceFile(f, readFileSync(join(ENV_DIR, f), "utf8"), ts.ScriptTarget.Latest, true));

function grimed(asset: string): boolean {
  for (const sf of envSources) {
    const tops = new Map<string, ts.Node>();
    for (const st of sf.statements) {
      if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) tops.set(d.name.text, d);
      if (ts.isFunctionDeclaration(st) && st.name) tops.set(st.name.text, st);
    }
    let start: ts.Node | undefined;
    const find = (node: ts.Node): void => {
      if (start) return;
      if (ts.isObjectLiteralExpression(node) && node.properties.some((p) => ts.isPropertyAssignment(p) && p.name.getText() === "id" && ts.isStringLiteral(p.initializer) && p.initializer.text === asset)) start = node;
      else if (ts.isCallExpression(node) && node.arguments.some((a) => ts.isStringLiteral(a) && a.text === asset)) start = node;
      else ts.forEachChild(node, find);
    };
    find(sf);
    if (!start) continue;
    const seenNodes = new Set<ts.Node>();
    const queue: ts.Node[] = [start];
    while (queue.length) {
      const node = queue.pop()!;
      if (seenNodes.has(node)) continue;
      seenNodes.add(node);
      if (/\bG\.[a-z]/.test(node.getText())) return true;
      const visit = (n: ts.Node): void => {
        if (ts.isIdentifier(n) && tops.has(n.text) && tops.get(n.text) !== node) queue.push(tops.get(n.text)!);
        ts.forEachChild(n, visit);
      };
      visit(node);
    }
    return false;
  }
  return false;
}

describe.each(BUILT)("%s map rules", (mission) => {
  const world = loadMission(mission);
  const { grid, lifts } = world;
  const rules = rulesOf(mission);
  const firm = (col: number, row: number): boolean => grid.solid(col, row) || grid.floor(col, row);
  const ground = (col: number, row: number): boolean => grid.wall(col, row) || grid.floor(col, row);

  it("gives every layout asset a role and fills every role", () => {
    const used = new Set([...sceneryOf(world).map((s) => s.asset), ...Object.values(world.terrainArt).filter(Boolean), world.sky]);
    expect([...used].filter((a) => !rolesOf(rules, a as AssetId).length)).toEqual([]);
    expect(Object.entries(rules.roles).filter(([, assets]) => !assets.length)).toEqual([]);
  });

  it("closes every floor end with a wall", () => {
    const open: string[] = [];
    for (let row = 1; row < grid.height; row++) {
      for (let col = 1; col < grid.width - 1; col++) {
        if (!ground(col, row) || firm(col, row - 1)) continue;
        for (const next of [col - 1, col + 1]) {
          if (firm(next, row) || inShaft(lifts, next, row) || inCells(rules.openEnds, next, row) || inCells(rules.openEnds, next, row - 1)) continue;
          if (!firm(next, row - 1)) open.push(`${next},${row - 1}`);
        }
      }
    }
    expect(open).toEqual([]);
  });

  it(rules.blockersUnderArt ? "keeps every invisible blocker under a lift stop or visible art" : "has no invisible blocker", () => {
    const art = sceneryOf(world).map((s) => boxOf(world, s));
    const bare: string[] = [];
    for (let row = 0; row < grid.height; row++) {
      for (let col = 0; col < grid.width; col++) {
        if (grid.at(col, row) !== "|") continue;
        const underStop = lifts.some((l) => l.bottom === row && col >= l.x && col < l.x + l.w);
        const underArt = art.some((b) => col + 0.5 > b.x0 && col + 0.5 < b.x1 && row + 0.5 > b.y0 && row + 0.5 < b.y1);
        if (!rules.blockersUnderArt || !(underStop || underArt)) bare.push(`${col},${row}`);
      }
    }
    expect(bare).toEqual([]);
  });

  it("runs every wall column above the ground up to the floor above", () => {
    const liftFloor = (col: number, row: number): boolean => lifts.some((l) => l.bottom === row && col >= l.x && col < l.x + l.w);
    const { runs } = reached(mission);
    const walked = (col: number, row: number): boolean => runs.some((run) => run.row === row && col >= run.col && col < run.col + run.w);
    const short: string[] = [];
    for (const wall of terrain(grid).walls.filter((w) => w.h > 1 && w.row < (world.ground ?? grid.height))) {
      for (let col = wall.col; col < wall.col + wall.w; col++) {
        const floorAbove = Array.from({ length: wall.row }, (_, row) => ground(col, row)).some(Boolean);
        if (floorAbove && !ground(col, wall.row - 1) && !liftFloor(col, wall.row - 1) && !walked(col, wall.row) && !inCells(rules.openEnds, col, wall.row - 1)) short.push(`${col},${wall.row}`);
      }
    }
    expect(short).toEqual([]);
  });

  it("keeps every lift shaft open from above its top stop down to a solid bottom stop", () => {
    const shut: string[] = [];
    for (const lift of lifts) {
      for (let col = lift.x; col < lift.x + lift.w; col++) {
        for (let row = lift.top - 2; row < lift.bottom; row++) if (grid.at(col, row) !== ".") shut.push(`${col},${row}`);
        if (!firm(col, lift.bottom)) shut.push(`bottom ${col},${lift.bottom}`);
      }
    }
    expect(shut).toEqual([]);
  });

  it("shows a floor or a wall beside the shaft at every lift stop", () => {
    const pits: string[] = [];
    for (const l of lifts) {
      for (const stop of l.stops) {
        for (const side of [l.x - 1, l.x + l.w]) {
          const floor = firm(side, stop) && !inCells(world.bare, side, stop);
          const deck = lifts.some((o) => o !== l && o.stops.includes(stop) && side >= o.x && side < o.x + o.w);
          if (!floor && !deck && !firm(side, stop - 1)) pits.push(`lift ${l.x} stop ${stop} side ${side}`);
        }
      }
    }
    expect(pits).toEqual([]);
  });

  it("stands a lift panel in a cell touching the shaft at every lift stop", () => {
    const panels = [
      ...world.dressing.filter((s) => rules.roles.panel.includes(s.asset)).map((s) => ({ x: s.x, y: s.y })),
      ...world.props.filter((p) => rules.panelProps.includes(p.id ?? "")).map((p) => ({ x: p.x + (p.art?.dx ?? 0), y: p.y })),
    ];
    const missing: string[] = [];
    for (const l of lifts) {
      for (const stop of l.stops) {
        const touching = panels.some((p) => p.y === stop && (Math.floor(p.x) === l.x - 1 || Math.floor(p.x) === l.x + l.w));
        if (!touching) missing.push(`lift ${l.x} stop ${stop}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("draws lift panels last in the dressing", () => {
    const panel = world.dressing.map((s) => rules.roles.panel.includes(s.asset));
    expect(panel.slice(panel.indexOf(true)).every(Boolean)).toBe(true);
  });

  it("stands every scenery item on solid floor, a girder deck, a lift shaft or hung from the ceiling", () => {
    const loose: string[] = [];
    for (const s of sceneryOf(world)) {
      if (rules.hangs.includes(s.asset) || rules.roles.girder.includes(s.asset)) continue;
      const y = s.y ?? world.spawn[1];
      const cols = baseCols(boxOf(world, s)).filter((col) => !firm(col, y) && !inShaft(lifts, col, y));
      if (cols.length) loose.push(`${label(s)} over ${cols.join(" ")}`);
    }
    expect(loose).toEqual([]);
  });

  it("keeps no scenery item wholly in never seen cells", () => {
    const { seen } = reached(mission);
    const hidden = sceneryOf(world).filter((s) => {
      const b = boxOf(world, s);
      for (let row = Math.max(0, Math.floor(b.y0)); row < Math.min(grid.height, Math.ceil(b.y1)); row++) {
        for (let col = Math.max(0, Math.floor(b.x0)); col < Math.min(grid.width, Math.ceil(b.x1)); col++) if (seen[row * grid.width + col]) return false;
      }
      return true;
    });
    expect(hidden.map(label)).toEqual([]);
  });

  it("keeps tower and wall dressing off reachable cells", () => {
    const { body } = reached(mission);
    const towers = world.dressing.filter((s) => TOWERS.some((role) => rules.roles[role].includes(s.asset)) && !rules.towersOnReach.some((t) => t.asset === s.asset && t.x === s.x));
    expect(towers.length).toBeGreaterThan(0);
    const covered: string[] = [];
    for (const s of towers) {
      const b = boxOf(world, s);
      for (let col = Math.floor(b.x0 + 0.01); col < Math.ceil(b.x1 - 0.01); col++) {
        for (let row = Math.floor(b.y0 + 0.01); row < Math.ceil(b.y1 - 0.01); row++) if (body.has(`${col},${row}`)) covered.push(`${label(s)} covers ${col},${row}`);
      }
    }
    expect(covered).toEqual([]);
  });

  it(`overlaps no two front or two back dressing items by more than ${OVERLAP_SHARE * 100}% of the smaller`, () => {
    const back = (s: Scenery): boolean => rolesOf(rules, s.asset).some((role) => (BACK as string[]).includes(role));
    const items = world.dressing.filter((s) => !rules.hangs.includes(s.asset) && !rules.roles.filler.includes(s.asset)).map((s) => ({ s, b: boxOf(world, s), back: back(s) }));
    const clash: string[] = [];
    items.forEach((a, i) => {
      for (const c of items.slice(i + 1)) {
        if (a.back !== c.back) continue;
        const w = Math.min(a.b.x1, c.b.x1) - Math.max(a.b.x0, c.b.x0);
        const h = Math.min(a.b.y1, c.b.y1) - Math.max(a.b.y0, c.b.y0);
        if (w <= 0 || h <= 0) continue;
        const area = (b: Box): number => (b.x1 - b.x0) * (b.y1 - b.y0);
        if ((w * h) / Math.min(area(a.b), area(c.b)) > OVERLAP_SHARE) clash.push(`${label(a.s)} over ${label(c.s)}`);
      }
    });
    expect(clash).toEqual([]);
  });

  it("stands every prop on a floor", () => {
    const stands = world.props.filter((p) => p.asset === undefined || !rules.hangs.includes(p.asset));
    const off = stands.filter((p) => p.y === undefined || !ground(Math.floor(p.x), p.y) || ground(Math.floor(p.x), p.y - 1));
    expect(off.map((p) => p.id ?? p.item)).toEqual([]);
  });

  it("lays enough small and big ground clutter on reached floors", () => {
    const { runs } = reached(mission);
    const onReach = (s: Scenery): boolean => runs.some((run) => run.row === s.y && s.x >= run.col && s.x < run.col + run.w);
    const count = (role: Role): number => sceneryOf(world).filter((s) => rules.roles[role].includes(s.asset) && onReach(s)).length;
    expect(count("smallClutter")).toBeGreaterThanOrEqual(rules.clutter.small);
    expect(count("bigClutter")).toBeGreaterThanOrEqual(rules.clutter.big);
    const stray = sceneryOf(world).filter((s) => (rules.roles.smallClutter.includes(s.asset) || rules.roles.bigClutter.includes(s.asset)) && !onReach(s));
    expect(stray.map(label)).toEqual([]);
  });

  it("lays clutter at a building edge, never in front of a facade middle or a wall", () => {
    const buildings = sceneryOf(world).filter((s) => rules.roles.building.includes(s.asset));
    const bad: string[] = [];
    for (const s of sceneryOf(world)) {
      if (!rules.roles.smallClutter.includes(s.asset) && !rules.roles.bigClutter.includes(s.asset)) continue;
      const b = boxOf(world, s);
      const facades = buildings.filter((k) => k.y === s.y).map((k) => boxOf(world, k)).filter((k) => k.x0 < b.x1 && k.x1 > b.x0);
      if (facades.some((k) => !(b.x0 <= k.x0 && k.x0 <= b.x1) && !(b.x0 <= k.x1 && k.x1 <= b.x1))) bad.push(`${label(s)} in front of a facade middle`);
      const y = s.y ?? world.spawn[1];
      const walls = baseCols(b).filter((col) => firm(col, y - 1) && Math.min(b.x1, col + 1) - Math.max(b.x0, col) > BOX_SLACK);
      if (walls.length) bad.push(`${label(s)} over wall ${walls.join(" ")},${y - 1}`);
    }
    expect(bad).toEqual([]);
  });

  it("grimes every structure and building asset of the layout", () => {
    const used = new Set([...sceneryOf(world).map((s) => s.asset), ...Object.values(world.terrainArt).filter(Boolean)]);
    const clean = [...used].filter((a) => rolesOf(rules, a as AssetId).some((role) => (GRIMED as string[]).includes(role)) && !grimed(a));
    expect(clean).toEqual([]);
  });
});
