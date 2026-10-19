import { ITEMS, type ItemId } from "../items";
import { HAND_DRAWN, HAND_SCALE, HUD_H, READOUT_SIZE, SLOT, topBar, VIEW_BOX, WEAPON_W, type Span } from "./layout";

export interface HudState {
  weapon: number;
  bonus: boolean;
  ammo: number;
  bonusAmmo: number;
  life: number;
  reserve: number;
  shields: number;
  running: boolean;
  item: ItemId | null;
}

export interface HudIcon {
  url: string;
  w: number;
  h: number;
}

export interface HudIcons {
  gun: HudIcon;
  fist: HudIcon;
  items: Record<ItemId, HudIcon>;
}

export interface HudKeys {
  weapons: string[];
  run: string;
  item: string;
}

export const SHIELDS_MAX = 5;

export const keyLabel = (code: string): string => code.replace(/^(Digit|Key)/, "").replace(/(Left|Right)$/, "").toUpperCase();

const READOUT = "#a8844a";
const MONO = "Share Tech Mono, monospace";
const BOLD = "Orbitron, sans-serif";
const HI = "#d8c8ae";
const LO = "#0e0b08";
const BAR_H = VIEW_BOX.top;
const ROD_YS = [3.4, 7.8, 12.2, 16.6];

const DEFS = `<defs>
  <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a08f76"/><stop offset=".1" stop-color="#6e604e"/><stop offset=".5" stop-color="#4b4034"/><stop offset=".85" stop-color="#2f2720"/><stop offset="1" stop-color="#1a1511"/></linearGradient>
  <linearGradient id="barMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a08f76"/><stop offset=".1" stop-color="#6e604e"/><stop offset=".5" stop-color="#54483a"/><stop offset=".85" stop-color="#43392e"/><stop offset="1" stop-color="#352d24"/></linearGradient>
  <linearGradient id="metalV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c1712"/><stop offset=".3" stop-color="#4a3e32"/><stop offset=".45" stop-color="#5c4e40"/><stop offset=".75" stop-color="#342a21"/><stop offset="1" stop-color="#17120e"/></linearGradient>
  <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b09f86"/><stop offset=".45" stop-color="#6e5e4c"/><stop offset="1" stop-color="#3a3027"/></linearGradient>
  <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset=".45" stop-color="#bba98f"/><stop offset=".55" stop-color="#5a4d3f"/><stop offset="1" stop-color="#eadfcb"/></linearGradient>
  <linearGradient id="amberFill" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a85a00"/><stop offset=".45" stop-color="#ffd650"/><stop offset=".6" stop-color="#ffe9a0"/><stop offset="1" stop-color="#a85a00"/></linearGradient>
  <linearGradient id="lifeFill" gradientUnits="userSpaceOnUse" x1="0" y1="77.1" x2="0" y2="181.1"><stop offset="0" stop-color="#fff2a0"/><stop offset=".35" stop-color="#ffd030"/><stop offset=".7" stop-color="#ff8a10"/><stop offset="1" stop-color="#d81c06"/></linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#fff" stop-opacity=".45"/><stop offset=".38" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
  <linearGradient id="insetTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".75"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
  <linearGradient id="insetSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset=".04" stop-color="#000" stop-opacity="0"/><stop offset=".96" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
  <linearGradient id="glare" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="flame" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffde70"/><stop offset=".5" stop-color="#ff7a10"/><stop offset="1" stop-color="#ff7a10" stop-opacity="0"/></linearGradient>
  <linearGradient id="bevelUp" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="${HI}" stop-opacity=".85"/><stop offset=".4" stop-color="${HI}" stop-opacity=".25"/><stop offset=".6" stop-color="${LO}" stop-opacity=".35"/><stop offset="1" stop-color="${LO}" stop-opacity=".95"/></linearGradient>
  <linearGradient id="bevelDown" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="${LO}" stop-opacity=".95"/><stop offset=".4" stop-color="${LO}" stop-opacity=".35"/><stop offset=".6" stop-color="${HI}" stop-opacity=".2"/><stop offset="1" stop-color="${HI}" stop-opacity=".75"/></linearGradient>
  <linearGradient id="rodG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3128"/><stop offset=".3" stop-color="#f0e4cc"/><stop offset=".55" stop-color="#8a7a64"/><stop offset="1" stop-color="#1a140f"/></linearGradient>
  <linearGradient id="shieldOn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b87a14"/><stop offset=".22" stop-color="#e2a818"/><stop offset=".5" stop-color="#ffd62a"/><stop offset=".78" stop-color="#e2a818"/><stop offset="1" stop-color="#b87a14"/></linearGradient>
  <linearGradient id="shieldOff" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3416"/><stop offset=".22" stop-color="#5e5a1c"/><stop offset=".5" stop-color="#6c6a22"/><stop offset=".78" stop-color="#5e5a1c"/><stop offset="1" stop-color="#5a3416"/></linearGradient>
  <pattern id="lampLines" width="1" height="2" patternUnits="userSpaceOnUse"><rect y="1" width="1" height="1" fill="#000" fill-opacity=".3"/></pattern>
  <pattern id="lampRail" width="1" height="2" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#3a2412"/></pattern>
  <radialGradient id="screwHead" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#e6d8c0"/><stop offset=".45" stop-color="#8a7a64"/><stop offset="1" stop-color="#2e261e"/></radialGradient>
  <pattern id="grid" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><rect width="3.2" height="3.2" fill="#120b05"/><path d="M0 .1H3.2M.1 0V3.2" stroke="#5a360c" stroke-width=".2"/></pattern>
  <pattern id="circuit" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#111a17"/><path d="M1 1H8V5H12M3 13V8H6V11M10 8H13M1 6H4" fill="none" stroke="#24403a" stroke-width=".35"/><circle cx="12" cy="5" r=".55" fill="#2f5249"/><circle cx="6" cy="11" r=".55" fill="#2f5249"/></pattern>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="lampHalo" x="-150%" y="-100%" width="400%" height="300%"><feGaussianBlur stdDeviation="1.6"/></filter>
  <filter id="iconGlow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="b"/><feFlood flood-color="#ffb21c" flood-opacity=".6"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="iconDim"><feColorMatrix type="saturate" values=".25"/><feComponentTransfer><feFuncR type="linear" slope=".55"/><feFuncG type="linear" slope=".55"/><feFuncB type="linear" slope=".55"/></feComponentTransfer></filter>
  <filter id="keyHalo" x="-100%" y="-100%" width="300%" height="300%"><feMorphology operator="dilate" radius=".3"/><feGaussianBlur stdDeviation=".7"/></filter>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".35"/></filter>
  <g id="screw"><circle r="1.15" fill="#120e0b"/><circle r=".9" fill="url(#screwHead)"/><path d="M-.6 .35L.6 -.35" stroke="#2a221a" stroke-width=".3"/><path d="M-.55 .5L.65 -.2" stroke="#e6d8c0" stroke-width=".12" opacity=".6"/></g>
</defs>`;

const blaster = (x: number): string => `<g transform="translate(${x} 5.2)" fill="#7f8b86" stroke="#202826" stroke-width=".3">
  <rect y="1" width="34" height="3" rx=".5"/><rect x="8" y="-1.4" width="14" height="2.4" rx=".5" fill="#3f4a46"/>
  <rect x="5" y="4" width="10" height="2.5"/><rect x="9" y="6.5" width="3" height="4.5" rx=".5"/></g>
  <path transform="translate(${x} 5.2)" d="M35 2.5q8-3 22 0q-14 2.6-22 0z" fill="url(#flame)"/>`;

const BLASTER_BODY_W = 34;
const keyCentre = (i: number): number => (i === 2 ? BLASTER_BODY_W : WEAPON_W[i]!) / 2;

const HAND = `<g transform="translate(0 2.6)" fill="#f0a818" stroke="#6a4206" stroke-width=".3">
  <path d="M3 13c-2-2-3-4-3-6l1-1 2 2V2.2a1 1 0 0 1 2 0V6V1a1 1 0 0 1 2 0v5V1.6a1 1 0 0 1 2 0V6V3a1 1 0 0 1 2 0v6c0 2.6-1.4 4-3 4z"/></g>`;


const screw = (x: number, y: number): string => `<use href="#screw" x="${x}" y="${y}"/>`;

const bevel = (x: number, y: number, w: number, h: number, r: number, raised = true, lw = 0.45): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="url(#${raised ? "bevelUp" : "bevelDown"})" stroke-width="${lw}"/>`;

const counter = (x: number, n: number): string =>
  `<text x="${x}" y="16" text-anchor="end" font-family="${MONO}" font-size="4.6" fill="${READOUT}">${Math.round(n)}</text>`;

const image = ({ url, w, h }: HudIcon, x: number, y: number): string =>
  `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;

const gridPanel = (x: number, w: number): string => `<rect x="${x + 0.4}" y="1.8" width="${w - 0.8}" height="16.2" rx="1.4" fill="#0b0806"/>
  ${["grid", "insetTop", "insetSide", "glare"].map((f) => `<rect x="${x + 1}" y="2.4" width="${w - 2}" height="15" rx="1" fill="url(#${f})"/>`).join("")}
  ${bevel(x + 0.4, 1.8, w - 0.8, 16.2, 1.4, false, 0.35)}`;

const plate = ([a, b]: Span): string => `<rect x="${a}" y="0" width="${b - a}" height="${BAR_H}" rx="1.6" fill="url(#barMetal)"/>
  <path d="M${a + 1.6} .4H${b - 1.6}" stroke="#e8d8bc" stroke-width=".5"/>
  ${bevel(a, 0, b - a, BAR_H, 1.6, true, 0.45)}`;

const rod = ([a, b]: Span, y: number): string => `<rect x="${a - 1}" y="${y - 1.4}" width="${b - a + 2}" height="2.8" fill="url(#rodG)"/>
  <rect x="${a - 1.8}" y="${y - 1.9}" width="1.4" height="3.8" rx=".4" fill="url(#plate)" stroke="${LO}" stroke-width=".25"/>
  <rect x="${b + 0.4}" y="${y - 1.9}" width="1.4" height="3.8" rx=".4" fill="url(#plate)" stroke="${LO}" stroke-width=".25"/>`;


function badge(x: number): string {
  return `<rect x="${x + 3.4}" y="3.8" width="41.2" height="12.8" rx="1.8" fill="#16110d"/>
  <rect x="${x + 3.4}" y="3.8" width="41.2" height="12.8" rx="1.8" fill="url(#insetTop)"/>
  ${bevel(x + 3.4, 3.8, 41.2, 12.8, 1.8, false, 0.45)}
  <text x="${x + 24}" y="13.9" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="7.6" fill="#000" opacity=".7">C2080</text>
  <text x="${x + 24}" y="13.3" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="7.6" fill="url(#chrome)" stroke="#1a140f" stroke-width=".2">C2080</text>
  ${screw(x + 2.4, 3.2)}${screw(x + 45.6, 3.2)}${screw(x + 2.4, 17.2)}${screw(x + 45.6, 17.2)}`;
}

const SLOT_MID_Y = 9.1;

const handAt = (centre: number): string =>
  `<g transform="translate(${centre} ${SLOT_MID_Y}) scale(${HAND_SCALE}) translate(${-HAND_DRAWN.w / 2} ${-SLOT_MID_Y})">${HAND}</g>`;

function slot(x: number, w: number, item: ItemId | null, icons: HudIcons): string {
  const icon = item === null ? undefined : icons.items[item];
  const centre = x + SLOT.pad + SLOT.iconW / 2;
  const art = icon ? image(icon, centre - icon.w / 2, SLOT_MID_Y - icon.h / 2) : handAt(centre);
  const label = item === null ? "nothing" : (ITEMS[item]?.name ?? item);
  return art + readout((x + SLOT.pad + SLOT.iconW + SLOT.gap + x + w - SLOT.pad) / 2, label);
}

function top(W: number, s: HudState, icons: HudIcons, keys: HudKeys): string {
  const bar = topBar(W);
  const wx = bar.weapons;
  const item = slot(bar.inv, bar.invW, s.item, icons);
  return `<rect x="${bar.gaps[0]![1]}" width="${W - 2 * bar.gaps[0]![1]}" height="${BAR_H}" fill="#060504"/>
  ${bar.gaps.filter(([a, b]) => b > a).map((g) => ROD_YS.map((y) => rod(g, y)).join("")).join("")}
  ${bar.plates.map(plate).join("")}
  ${gridPanel(bar.gridX, bar.gridW)}
  ${weapon(image(icons.gun, wx[0]!, 2.9), s.weapon === 0)}${counter(wx[0]! + WEAPON_W[0]!, s.ammo)}
  ${weapon(image(icons.fist, wx[1]!, 2.4), s.weapon === 1)}
  ${s.bonus ? weapon(blaster(wx[2]!), s.weapon === 2) + counter(wx[2]! + WEAPON_W[2]!, s.bonusAmmo) : ""}
  ${wx.slice(0, s.bonus ? 3 : 2).map((x, i) => keyTab(x + keyCentre(i), keys.weapons[i] ?? "", s.weapon === i)).join("")}
  ${badge(bar.badge)}
  ${gridPanel(bar.run, bar.runW)}${readout(bar.run + bar.runW / 2, "RUN")}${keyTab(bar.run + bar.runW / 2, keys.run, s.running)}
  ${gridPanel(bar.inv, bar.invW)}${item}${keyTab(bar.inv + bar.invW / 2, keys.item)}`;
}

const TAB = { top: 15.2, bottom: 18.2, r: 0.8, font: 3.4, pad: 1.2 };
const GLYPH_W = TAB.font * 0.7;
const TAB_MIN_W = 1.6 * (GLYPH_W + 2 * TAB.pad);
const TAB_SIDE = (TAB_MIN_W - GLYPH_W) / 2;
const tabWidth = (label: string): number => Math.max(TAB_MIN_W, label.length * GLYPH_W + 2 * TAB_SIDE);

const letter = (x: number, y: number, attrs: string, label: string): string =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="${TAB.font}" ${attrs}>${label}</text>`;

const plainLetter = (x: number, y: number, label: string): string => letter(x + 0.2, y + 0.2, `fill="${HI}" opacity=".55"`, label) + letter(x, y, 'fill="#1a140f"', label);

const litLetter = (x: number, y: number, label: string): string => letter(x, y, 'fill="#ff2a10" opacity=".55" filter="url(#keyHalo)"', label) +
  letter(x, y, 'fill="#ff4a26" stroke="#7a0a02" stroke-width=".3" paint-order="stroke"', label);

function keyTab(cx: number, label: string, active = false): string {
  const { top, bottom, r } = TAB;
  const w = tabWidth(label), a = cx - w / 2, b = cx + w / 2, base = (top + BAR_H) / 2 + TAB.font * 0.36;
  const edge = `M${a} ${bottom}V${top + r}Q${a} ${top} ${a + r} ${top}H${b - r}Q${b} ${top} ${b} ${top + r}V${bottom}`;
  return `<path d="${edge}Z" fill="url(#plate)"/>
  <path d="${edge}" fill="none" stroke="${HI}" stroke-opacity=".55" stroke-width=".35"/>
  ${active ? litLetter(cx, base, label) : plainLetter(cx, base, label)}`;
}

const weapon = (content: string, active: boolean): string => `<g filter="url(#${active ? "iconGlow" : "iconDim"})">${content}</g>`;

const readout = (x: number, label: string): string =>
  `<text x="${x}" y="${(1.8 + TAB.top) / 2 + READOUT_SIZE * 0.35}" text-anchor="middle" font-family="${MONO}" font-size="${READOUT_SIZE}" fill="${READOUT}">${label}</text>`;

const KEY = { y: 181.5, size: 9, font: 6.2 };

function keyBox(x: number, letter: string): string {
  const { y, size, font } = KEY, base = y + size / 2 + font * 0.36;
  return `<rect x="${x - 0.5}" y="${y - 0.5}" width="${size + 1}" height="${size + 1}" rx="1.3" fill="#0b0806"/>
  <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="1" fill="url(#plate)"/>
  ${bevel(x, y, size, size, 1, true, 0.4)}
  <text x="${x + size / 2 + 0.25}" y="${base + 0.25}" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="${font}" fill="${HI}" opacity=".55">${letter}</text>
  <text x="${x + size / 2}" y="${base}" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="${font}" fill="#1a140f">${letter}</text>`;
}

function tube(x: number, y: number, w: number, h: number, fillH: number, inner: number, paint: string): string {
  return `<rect x="${x - 0.9}" y="${y - 0.9}" width="${w + 1.8}" height="${h + 1.8}" fill="url(#plate)"/>
  ${bevel(x - 0.9, y - 0.9, w + 1.8, h + 1.8, 0, true, 0.4)}
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#050403"/>
  ${fillH > 0 ? `<rect x="${x + (w - inner) / 2}" y="${y + h - 1.3 - fillH}" width="${inner}" height="${fillH}" fill="${paint}" filter="url(#glow)"/>` : ""}
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#glass)"/>
  ${bevel(x, y, w, h, 0, false, 0.4)}`;
}

const pct = (v: number): number => Math.min(100, Math.max(0, v)) / 100;

function leftColumn(s: HudState): string {
  const y0 = 77.1, h = 104, fill = (h - 2.6) * pct(s.life), y = y0 + h - 1.3 - fill;
  return `${tube(3.5, y0, 4, h, fill, 1.2, "url(#lifeFill)")}
  <path d="M8.7 97.1h1.4M8.7 117.1h1.4M8.7 137.1h1.4M8.7 157.1h1.4" stroke="${LO}" stroke-width=".6"/>
  <path d="M8.7 97.6h1.4M8.7 117.6h1.4M8.7 137.6h1.4M8.7 157.6h1.4" stroke="${HI}" stroke-opacity=".5" stroke-width=".3"/>
  <path d="M0 ${y - 2.5}l3.4 2.5L0 ${y + 2.5}z" fill="#ff3018" filter="url(#glow)"/>
  <path d="M0 ${y - 1.9}l2 1.4" stroke="#ffd0b0" stroke-width=".3"/>
  ${keyBox(1, "E")}`;
}

const LAMP = { x: 3, y: 132.6, w: 5, h: 8.6, pitch: 9.6 };

function shieldLight(x: number, i: number, on: boolean): string {
  const lx = x + LAMP.x, ly = LAMP.y + i * LAMP.pitch, { w, h } = LAMP;
  const body = `<rect x="${lx}" y="${ly}" width="${w}" height="${h}" fill="url(#${on ? "shieldOn" : "shieldOff"})"${on ? ' filter="url(#glow)"' : ""}/>`;
  if (!on) {
    return `${body}
  <rect x="${lx}" y="${ly}" width="${w}" height="${h}" fill="url(#lampLines)"/>
  <path d="M${lx} ${ly + 0.3}h${w}M${lx} ${ly + h - 0.3}h${w}" stroke="#2a2410" stroke-width=".6"/>`;
  }
  const cx = lx + w / 2, mid = ly + h / 2;
  return `${body}
  <path d="M${lx} ${ly + 0.3}h${w}M${lx} ${ly + h - 0.3}h${w}" stroke="#a8781a" stroke-width=".6"/>
  <rect x="${cx - 0.5}" y="${ly + 1.8}" width="1" height="${h - 3.6}" fill="#fff23c"/>
  <rect x="${cx - 0.5}" y="${mid - 1.6}" width="1" height="1" fill="#fffbe8"/>
  <rect x="${cx - 0.5}" y="${mid + 0.4}" width="1" height="1" fill="#fffbe8"/>`;
}

function shieldHalo(x: number, i: number): string {
  const lx = x + LAMP.x, ly = LAMP.y + i * LAMP.pitch, { w, h } = LAMP;
  return `<rect x="${lx - 0.6}" y="${ly - 0.6}" width="${w + 1.2}" height="${h + 1.2}" rx="1.5" fill="#ffb21c" opacity=".75" filter="url(#lampHalo)" style="mix-blend-mode:screen"/>
  <rect x="${lx + w / 2 - 1}" y="${ly + 1.5}" width="2" height="${h - 3}" fill="#fff6c0" opacity=".6" filter="url(#soft)" style="mix-blend-mode:screen"/>`;
}

function shieldChannel(x: number): string {
  const top = LAMP.y - 1, h = 5 * LAMP.pitch + 1, rail = (rx: number): string =>
    `<rect x="${rx}" y="${top}" width="1" height="${h}" fill="url(#lampRail)"/>`;
  return `<rect x="${x + LAMP.x - 1}" y="${top}" width="${LAMP.w + 2}" height="${h}" fill="#050403"/>
  ${rail(x + LAMP.x - 1)}${rail(x + LAMP.x + LAMP.w)}`;
}

function rightColumn(W: number, s: HudState): string {
  const x = W - VIEW_BOX.right, y0 = 75.6, h = 50;
  const lit = (i: number): boolean => SHIELDS_MAX - 1 - i < s.shields;
  const lamps = Array.from({ length: SHIELDS_MAX }, (_, i) => i);
  const lights = lamps.map((i) => shieldLight(x, i, lit(i))).join("");
  const halos = lamps.filter(lit).map((i) => shieldHalo(x, i)).join("");
  return `${tube(x + 3.8, y0, 3.4, h, (h - 2.6) * pct(s.reserve), 1.2, "url(#amberFill)")}
  <rect x="${x + 1}" y="130.2" width="9" height="51.8" rx="1" fill="url(#plate)"/>
  ${bevel(x + 1, 130.2, 9, 51.8, 1, true, 0.4)}
  ${shieldChannel(x)}
  ${lights}
  ${halos}
  ${keyBox(x + 1, "S")}`;
}

function sides(W: number, H: number): string {
  const h = H - VIEW_BOX.bottom;
  return `<rect width="${VIEW_BOX.left}" height="${h}" fill="url(#circuit)"/>
  <rect transform="translate(${W - VIEW_BOX.right} 0)" width="${VIEW_BOX.right}" height="${h}" fill="url(#circuit)"/>`;
}

function bottom(W: number): string {
  return `<rect y="191.8" width="${W}" height="8.2" fill="url(#metal)"/>
  <path d="M0 192.2H${W}" stroke="${HI}" stroke-opacity=".6" stroke-width=".4"/>
  <path d="M0 199.6H${W}" stroke="${LO}" stroke-width=".8"/>
  <path d="M20 196H${W / 2 - 20}M${W / 2 + 20} 196H${W - 20}" stroke="${LO}" stroke-width=".7"/>
  <path d="M20 196.6H${W / 2 - 20}M${W / 2 + 20} 196.6H${W - 20}" stroke="${HI}" stroke-opacity=".35" stroke-width=".3"/>
  ${screw(W / 2 - 14, 196)}${screw(W / 2 + 14, 196)}`;
}

function frame(W: number, H: number): string {
  const { left, top: t, right, bottom: b } = VIEW_BOX;
  return `<path fill-rule="evenodd" fill="url(#metalV)" d="M0 0H${W}V${H}H0Z M${left} ${t}V${H - b}H${W - right}V${t}Z"/>`;
}

export function hudSvg(W: number, H: number, s: HudState, icons: HudIcons, keys: HudKeys): string {
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${DEFS}
  ${frame(W, H)}${sides(W, H)}${top(W, s, icons, keys)}
  <g transform="translate(0 ${H - HUD_H})">${leftColumn(s)}${rightColumn(W, s)}${bottom(W)}</g></svg>`;
}
