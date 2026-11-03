import type { Pt } from "../../engine/rig/tree";
import type { TileGrid } from "../../engine/world/tiles";
import { seenAt, type Fog } from "../fog";
import type { Hero } from "../hero/hero";
import type { MissilesJson } from "./enemy";
import { advance, end, projectile, strike, targetable, type Box, type Projectile } from "./projectile";

export interface Missile extends Projectile {
  kind: "missile";
  turn: number;
  steerAt: number;
  glide: number;
  level: number;
  blind: boolean;
  seen: boolean;
  aimed: boolean;
  mark: Pt | null;
}

const DEG = Math.PI / 180;
const LIFE = 10;
const REACHED = 0.5;
export const CLOSE = { cells: 6, climb: 85 * DEG, tighter: 1 };

export function launchMissile([x, y]: Pt, facing: 1 | -1, m: MissilesJson): Missile {
  const climb = m.climb * DEG;
  return {
    ...projectile(x, y, facing > 0 ? -climb : Math.PI + climb, m.speed, m.hits, m.trailMs),
    kind: "missile",
    turn: m.turn * DEG,
    steerAt: m.steerMs / 1000,
    glide: m.glide,
    level: m.level,
    blind: false,
    seen: false,
    aimed: false,
    mark: null,
  };
}

function aim(m: Missile, [x, y]: Pt): number {
  const dx = x - m.x;
  return Math.atan2(m.level * (y - m.y), Math.sign(dx || 1) * Math.min(1, Math.abs(dx) / m.glide));
}

function aimLaunch(m: Missile, [x]: Pt): void {
  m.aimed = true;
  const near = 1 - Math.min(1, Math.abs(x - m.x) / CLOSE.cells);
  const climb = Math.abs(Math.atan2(Math.sin(m.heading), Math.abs(Math.cos(m.heading))));
  const steep = climb + (CLOSE.climb - climb) * near;
  m.heading = x >= m.x ? -steep : Math.PI + steep;
  m.turn *= 1 + CLOSE.tighter * near;
}

function steer(m: Missile, hero: Hero, box: Box, dt: number): void {
  const seen = targetable(hero);
  if (seen) m.mark = [hero.x, hero.y - box.height / 2];
  if (!m.mark) return;
  if (!m.aimed) aimLaunch(m, m.mark);
  if (m.age < m.steerAt && Math.abs(m.mark[0] - m.x) > CLOSE.cells) return;
  if (!seen) {
    m.blind = true;
    if (Math.abs(m.mark[0] - m.x) < REACHED) m.mark = null;
    if (!m.mark) return;
  } else if (m.blind) {
    m.blind = false;
    m.heading = aim(m, m.mark);
    return;
  }
  const want = aim(m, m.mark);
  const diff = Math.atan2(Math.sin(want - m.heading), Math.cos(want - m.heading));
  m.heading += Math.max(-m.turn * dt, Math.min(m.turn * dt, diff));
}

function lost(m: Missile, fog: Fog | null): boolean {
  if (m.age >= LIFE) return true;
  if (!fog) return false;
  const visible = seenAt(fog, Math.floor(m.x), Math.floor(m.y));
  m.seen ||= visible;
  return m.seen && !visible;
}

export function flyMissile(m: Missile, grid: TileGrid, fog: Fog | null, hero: Hero, box: Box, dt: number): { hits: number; burst: boolean } {
  steer(m, hero, box, dt);
  const from: [number, number] = [m.x, m.y];
  advance(m, dt);
  const { hit, wall } = strike(m, from, grid, hero, box);
  const burst = hit || wall;
  if (burst || lost(m, fog)) end(m, burst);
  return { hits: hit ? m.hits : 0, burst };
}
