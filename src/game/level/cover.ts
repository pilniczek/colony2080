import type { Prop } from "./sandboxLevel";

export interface Cover {
  clip: [number, number];
  reach: [number, number];
  rows: number;
  states?: number[];
}

export interface KeepOut {
  y: number;
  span: [number, number];
}

const EPS = 0.01;

type Covered = Prop & { cover: Cover };

const covers = (props: Prop[]): Covered[] => props.filter((p): p is Covered => p.cover !== undefined);

const atHeight = (p: Covered, y: number): boolean => y <= (p.y ?? 0) + EPS && y > (p.y ?? 0) - p.cover.rows;

const live = (p: Covered): boolean => p.cover.states === undefined || p.cover.states.includes(p.state ?? 0);

export const coverClips = (props: Prop[], x: number, y: number): { x: [number, number]; top: number; floor: number }[] =>
  covers(props)
    .filter((p) => live(p) && atHeight(p, y) && x >= p.cover.reach[0] && x <= p.cover.reach[1])
    .map((p) => ({ x: p.cover.clip, top: (p.y ?? 0) - p.cover.rows, floor: p.y ?? 0 }));

export const inCover = (props: Prop[], x: number, half: number, y: number): boolean =>
  covers(props).some((p) => atHeight(p, y) && x + half > p.cover.clip[0] && x - half < p.cover.clip[1]);

export const keepOutOf = (props: Prop[]): KeepOut[] => covers(props).map((p) => ({ y: p.y ?? 0, span: p.cover.reach }));
