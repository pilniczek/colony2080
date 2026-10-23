import { itemName, tr, type Lang } from "../i18n";
import type { Rect } from "../geometry";
import type { ItemId } from "../items";
import { blasterIcon } from "./blasterIcon";
import { HUD_H, HUD_MIN_W } from "./layout";
import { SHIELDS_MAX, type HudIcon } from "./svg";

export interface InventoryState {
  items: ItemId[];
  cursor: number;
  energy: number;
  shields: number;
  ammo: number;
  blaster: number | null;
  lang?: Lang;
}

export interface InventoryArt {
  robot: HudIcon;
  body: HudIcon;
  gun: HudIcon;
  items: Record<ItemId, HudIcon>;
  liftPanel: HudIcon;
}

export type InventoryBox = "list" | "title" | "stats" | "ammo" | "item" | "robot";

export const INVENTORY_BOXES: Record<InventoryBox, Rect> = {
  list: { x: 4, y: 4, w: 74, h: 116 },
  title: { x: 80, y: 4, w: 72, h: 18 },
  stats: { x: 80, y: 24, w: 72, h: 62 },
  ammo: { x: 80, y: 88, w: 72, h: 32 },
  item: { x: 4, y: 122, w: 148, h: 74 },
  robot: { x: 154, y: 4, w: 162, h: 192 },
};

export const ITEM_FILL = 0.8;
export const BODY_BOX = { w: 30, h: 56 };
export const GUN_SCALE = 0.55;
export const STAT_COLOR = "#e8c020";

export const INV = { frame: "#5aa9a0", back: "#0b1a17", line: "#1d4a3f", name: "#f2e7a0", label: "#8fd3c8", pick: "#2f6b63", stat: STAT_COLOR };
export const MONO = "Share Tech Mono, Oxanium, monospace";
export const BOLD = "Orbitron, Oxanium, sans-serif";
const ROW = 7.2;
const TEXT = 5.6;
const PULSE_BARS = [6, 9, 5, 11, 8, 10];

export const INVENTORY_DEFS = `<defs>
  <pattern id="invGrid" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M4 0H0V4" fill="none" stroke="${INV.line}" stroke-width=".25"/></pattern>
  <pattern id="statGrid" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M4 0H0V4" fill="none" stroke="#5a4a10" stroke-width=".25"/></pattern>
  <linearGradient id="room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15120f"/><stop offset=".55" stop-color="#2a241d"/><stop offset=".72" stop-color="#1a1714"/><stop offset="1" stop-color="#0c0d0c"/></linearGradient>
  <radialGradient id="lamp"><stop offset="0" stop-color="#fff"/><stop offset=".15" stop-color="#fff" stop-opacity=".85"/><stop offset=".4" stop-color="#cfe4ff" stop-opacity=".25"/><stop offset="1" stop-color="#cfe4ff" stop-opacity="0"/></radialGradient>
</defs>`;

export const box = ({ x, y, w, h }: Rect): string => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${INV.back}" fill-opacity=".9"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#invGrid)"/>
  <rect x="${x + 0.4}" y="${y + 0.4}" width="${w - 0.8}" height="${h - 0.8}" fill="none" stroke="${INV.frame}" stroke-width=".8"/>`;

const text = (x: number, y: number, fill: string, label: string, attrs = ""): string =>
  `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${TEXT}" fill="${fill}" ${attrs}>${label}</text>`;

export const label = (x: number, y: number, size: number, value: string): string =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="${size}" fill="${INV.label}" stroke="${INV.back}" stroke-width=".3" paint-order="stroke">${value}</text>`;

export const image = (art: HudIcon, x: number, y: number): string => `<image href="${art.url}" x="${x}" y="${y}" width="${art.w}" height="${art.h}"/>`;

const centred = (art: HudIcon, r: Rect): string => image(art, r.x + (r.w - art.w) / 2, r.y + (r.h - art.h) / 2);

export const newestFirst = (items: ItemId[]): ItemId[] => [...items].reverse();

function room(W: number, H: number): string {
  const floor = H * 0.7;
  const rays = Array.from({ length: 13 }, (_, i) => {
    const x = W * (i / 12 - 0.5) * 3 + W / 2;
    return `<path d="M${W / 2 + (x - W / 2) * 0.2} ${floor}L${x} ${H}" stroke="#2a3a33" stroke-width=".4"/>`;
  }).join("");
  const rows = [0, 0.15, 0.35, 0.6, 1].map((t) => `<path d="M0 ${floor + (H - floor) * t}H${W}" stroke="#2a3a33" stroke-width=".4"/>`).join("");
  return `<rect width="${W}" height="${H}" fill="url(#room)"/>
  <path d="M0 ${H * 0.33}H${W}M0 ${H * 0.52}H${W}" stroke="#3a3128" stroke-width="1.2"/>
  <rect y="${floor}" width="${W}" height="${H - floor}" fill="#101511"/>${rays}${rows}
  <circle cx="${W - 34}" cy="${H * 0.24}" r="30" fill="url(#lamp)"/>`;
}

function list(s: InventoryState, lang: Lang): string {
  const b = INVENTORY_BOXES.list;
  const rows = newestFirst(s.items).map((id, i) => {
    const y = b.y + 4 + i * ROW;
    const on = i === s.cursor;
    const pick = on ? `<rect x="${b.x + 2}" y="${y}" width="${b.w - 4}" height="${ROW}" fill="${INV.pick}"/>` : "";
    return `<g data-row="${i}" data-on="${on}">${pick}${text(b.x + 4, y + ROW * 0.72, on ? "#fff" : INV.name, itemName(id, lang).toUpperCase())}</g>`;
  });
  return box(b) + rows.join("") + label(b.x + b.w / 2, b.y + b.h - 5, 7.6, tr("INVENTORY", lang));
}

function stats(s: InventoryState, art: InventoryArt, lang: Lang): string {
  const b = INVENTORY_BOXES.stats;
  const x = b.x + 4;
  const shields = Array.from({ length: SHIELDS_MAX }, (_, i) => {
    const on = i < s.shields;
    return `<rect data-shield="${on ? "on" : "off"}" x="${x + i * 5.4}" y="${b.y + 26}" width="4.6" height="3.4" fill="${on ? INV.stat : "none"}" stroke="${INV.stat}" stroke-width=".4"/>`;
  }).join("");
  const pulse = `<path d="M${x} ${b.y + 42}h8l2 -5l3 9l2 -4h11" fill="none" stroke="${INV.stat}" stroke-width=".6"/>`;
  const bars = PULSE_BARS.map((h, i) => `<rect x="${x + i * 5.2}" y="${b.y + b.h - 4 - h}" width="3" height="${h}" fill="${INV.stat}"/>`).join("");
  const diagram = { x: b.x + b.w - BODY_BOX.w - 4, y: b.y + 3, w: BODY_BOX.w + 1, h: b.h - 6 };
  return `${box(b)}<rect x="${diagram.x}" y="${diagram.y}" width="${diagram.w}" height="${diagram.h}" fill="url(#statGrid)" stroke="${INV.stat}" stroke-width=".4"/>
  ${centred(art.body, diagram)}
  ${text(x, b.y + 9, INV.name, tr("ENERGY", lang))}${text(x, b.y + 16, INV.name, `${s.energy}%`)}${text(x, b.y + 24, INV.name, tr("SHIELDS:", lang))}
  ${shields}${pulse}${bars}`;
}

function ammo(s: InventoryState, art: InventoryArt): string {
  const b = INVENTORY_BOXES.ammo;
  const right = b.x + b.w - 4;
  const gun = image(art.gun, b.x + 4, b.y + 3) + text(right, b.y + 11, INV.name, `x${s.ammo}`, 'text-anchor="end"');
  const extra =
    s.blaster === null
      ? ""
      : `<g transform="translate(${b.x + 4} ${b.y + 19.5}) scale(${GUN_SCALE}) translate(0 -5.2)">${blasterIcon(0)}</g>` +
        text(right, b.y + b.h - 6, INV.name, `EXTRA x${s.blaster}`, 'text-anchor="end"');
  return box(b) + gun + extra;
}

export function inventorySvg(W: number, H: number, s: InventoryState, art: InventoryArt): string {
  const { title, item, robot } = INVENTORY_BOXES;
  const lang = s.lang ?? "en";
  const shown = newestFirst(s.items)[s.cursor];
  const picture = shown === undefined ? "" : centred(art.items[shown]!, item);
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${INVENTORY_DEFS}${room(W, H)}
  <g transform="translate(${(W - HUD_MIN_W) / 2} ${(H - HUD_H) / 2})">
  ${image(art.robot, robot.x + (robot.w - art.robot.w) / 2, robot.y + robot.h - art.robot.h)}
  ${picture}${list(s, lang)}
  ${box(title)}${label(title.x + title.w / 2, title.y + 8, 6.6, "C2080")}${label(title.x + title.w / 2, title.y + 15.4, 6.6, tr("STATISTICS", lang))}
  ${stats(s, art, lang)}${ammo(s, art)}</g></svg>`;
}
