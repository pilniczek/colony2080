import { itemName, tr, type Lang } from "../i18n";
import { type ItemId } from "../items";
import { blasterIcon, BLASTER_BODY_W, BLASTER_MID_Y } from "./blasterIcon";
import { BAR_H, CONTENT_SCALE, GRID_CELL, HAND_BOX, HAND_DRAWN, HAND_SCALE, HIDE_W, HUD_H, MAP_W, MENU_LABEL, MENU_W, PANEL_EDGE, READOUT_SIZE, readoutW, SIDE_ART, SLOT, slotW, SPEAKER_INK, SPEAKER_SCALE, SPEAKER_W, TOGGLE_W, topBar, VIEW_BOX, WEAPON_W, type Span } from "./layout";

export interface HudState {
  weapon: number;
  bonus: boolean;
  ammo: number;
  bonusAmmo: number;
  life: number;
  shields: number;
  running: boolean;
  soundOn: boolean;
  mapOn: boolean;
  mapOpen: boolean;
  hidden: boolean;
  menuOpen: boolean;
  item: ItemId | null;
  lang?: Lang;
}

export interface HudIcon {
  url: string;
  w: number;
  h: number;
}

export interface HudIcons {
  gun: HudIcon;
  fist: HudIcon;
  run: HudIcon;
  walk: HudIcon;
  items: Record<ItemId, HudIcon>;
}

export interface HudKeys {
  weapons: string[];
  run: string;
  sound: string;
  hide: string;
  map: string;
  menu: string;
  item: string;
}

export const SHIELDS_MAX = 5;

export const keyLabel = (code: string): string => code.replace(/^(Digit|Key)/, "").replace(/^Escape$/, "Esc").replace(/(Left|Right)$/, "").toUpperCase();

export const READOUT = "#a8844a";
const MONO = "Share Tech Mono, Oxanium, monospace";
const BOLD = "Orbitron, Oxanium, sans-serif";
const HI = "#d8c8ae";
const LO = "#0e0b08";
const ROD_YS = [3.4, 7.8, 12.2, 16.6].map((y) => (y * BAR_H) / 20.4);
const PANEL_H = BAR_H - 2 * PANEL_EDGE;

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
  <linearGradient id="bevelUp" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="${HI}" stop-opacity=".85"/><stop offset=".4" stop-color="${HI}" stop-opacity=".25"/><stop offset=".6" stop-color="${LO}" stop-opacity=".35"/><stop offset="1" stop-color="${LO}" stop-opacity=".95"/></linearGradient>
  <linearGradient id="bevelDown" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="${LO}" stop-opacity=".95"/><stop offset=".4" stop-color="${LO}" stop-opacity=".35"/><stop offset=".6" stop-color="${HI}" stop-opacity=".2"/><stop offset="1" stop-color="${HI}" stop-opacity=".75"/></linearGradient>
  <linearGradient id="rodG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3128"/><stop offset=".3" stop-color="#f0e4cc"/><stop offset=".55" stop-color="#8a7a64"/><stop offset="1" stop-color="#1a140f"/></linearGradient>
  <linearGradient id="shieldOn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b87a14"/><stop offset=".22" stop-color="#e2a818"/><stop offset=".5" stop-color="#ffd62a"/><stop offset=".78" stop-color="#e2a818"/><stop offset="1" stop-color="#b87a14"/></linearGradient>
  <linearGradient id="shieldOff" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3416"/><stop offset=".22" stop-color="#5e5a1c"/><stop offset=".5" stop-color="#6c6a22"/><stop offset=".78" stop-color="#5e5a1c"/><stop offset="1" stop-color="#5a3416"/></linearGradient>
  <pattern id="lampLines" width="1" height="2" patternUnits="userSpaceOnUse"><rect y="1" width="1" height="1" fill="#000" fill-opacity=".3"/></pattern>
  <pattern id="lampRail" width="1" height="2" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#3a2412"/></pattern>
  <radialGradient id="screwHead" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#e6d8c0"/><stop offset=".45" stop-color="#8a7a64"/><stop offset="1" stop-color="#2e261e"/></radialGradient>
  <pattern id="grid" width="${GRID_CELL}" height="${GRID_CELL}" patternUnits="userSpaceOnUse"><rect width="${GRID_CELL}" height="${GRID_CELL}" fill="#120b05"/><path d="M0 .1H${GRID_CELL}M.1 0V${GRID_CELL}" stroke="#5a360c" stroke-width=".2"/></pattern>
  <pattern id="circuit" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#111a17"/><path d="M1 1H8V5H12M3 13V8H6V11M10 8H13M1 6H4" fill="none" stroke="#24403a" stroke-width=".35"/><circle cx="12" cy="5" r=".55" fill="#2f5249"/><circle cx="6" cy="11" r=".55" fill="#2f5249"/></pattern>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="lampHalo" x="-150%" y="-100%" width="400%" height="300%"><feGaussianBlur stdDeviation="1.6"/></filter>
  <filter id="iconGlow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="b"/><feFlood flood-color="#ffb21c" flood-opacity=".6"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="iconDim" x="-30%" y="-60%" width="160%" height="220%"><feColorMatrix type="saturate" values=".25"/><feComponentTransfer><feFuncR type="linear" slope=".55"/><feFuncG type="linear" slope=".55"/><feFuncB type="linear" slope=".55"/></feComponentTransfer></filter>
  <filter id="keyHalo" x="-100%" y="-100%" width="300%" height="300%"><feMorphology operator="dilate" radius=".3"/><feGaussianBlur stdDeviation=".7"/></filter>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".35"/></filter>
  <g id="screw"><circle r="1.15" fill="#120e0b"/><circle r=".9" fill="url(#screwHead)"/><path d="M-.6 .35L.6 -.35" stroke="#2a221a" stroke-width=".3"/><path d="M-.55 .5L.65 -.2" stroke="#e6d8c0" stroke-width=".12" opacity=".6"/></g>
</defs>`;

const keyCentre = (i: number): number => (i === 2 ? BLASTER_BODY_W * CONTENT_SCALE : WEAPON_W[i]!) / 2;

const HAND = `<g fill="${READOUT}" stroke="#6a4206" stroke-width=".3">
  <path d="M3 13c-2-2-3-4-3-6l1-1 2 2V2.2a1 1 0 0 1 2 0V6V1a1 1 0 0 1 2 0v5V1.6a1 1 0 0 1 2 0V6V3a1 1 0 0 1 2 0v6c0 2.6-1.4 4-3 4z"/></g>`;


const SPEAKER_CONE = "M-4.4 -1.5H-2.6L.1 -3.9V3.9L-2.6 1.5H-4.4Z";
const SPEAKER_WAVES = "M1.6 -1.7Q2.6 0 1.6 1.7M3 -3.4Q4.9 0 3 3.4";
const SPEAKER_CROSS = "M1.7 -1.7L4.5 1.7M1.7 1.7L4.5 -1.7";

const speaker = (on: boolean): string => `<path d="${SPEAKER_CONE}" fill="${READOUT}"/>
  <path d="${on ? SPEAKER_WAVES : SPEAKER_CROSS}" fill="none" stroke="${READOUT}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`;

const MAP_SHEET = "M-4.5 -3.1L-1.5 -4.1L1.5 -3.1L4.5 -4.1V3.1L1.5 4.1L-1.5 3.1L-4.5 4.1Z";
const MAP_FOLDS = "M-1.5 -4.1V3.1M1.5 -3.1V4.1";

const QUESTION = `<path d="M-2.2 -1.9Q-2.2 -4.1 0 -4.1Q2.3 -4.1 2.3 -2Q2.3 -.6 0 .3V1.4" fill="none" stroke="${READOUT}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cy="3.4" r=".85" fill="${READOUT}"/>`;
const EYE = `<path d="M-4 0Q0 -3.6 4 0Q0 3.6 -4 0Z" fill="none" stroke="${READOUT}" stroke-width="1.1" stroke-linejoin="round"/>
  <circle r="1.3" fill="${READOUT}"/>`;
const EYE_SLASH = `<path d="M-3.3 3.3L3.3 -3.3" stroke="${LO}" stroke-width="2"/>
  <path d="M-3.3 3.3L3.3 -3.3" stroke="${READOUT}" stroke-width="1.1" stroke-linecap="round"/>`;
const foldedMap = `<path d="${MAP_SHEET}" fill="${READOUT}"/>
  <path d="${MAP_FOLDS}" stroke="${LO}" stroke-width=".6"/>`;

const screw = (x: number, y: number): string => `<use href="#screw" x="${x}" y="${y}"/>`;

const bevel = (x: number, y: number, w: number, h: number, r: number, raised = true, lw = 0.45): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="url(#${raised ? "bevelUp" : "bevelDown"})" stroke-width="${lw}"/>`;

const TAB = { y: BAR_H - PANEL_EDGE / 2, half: 2.47, r: 1, font: 3.4, pad: 2.2 };

const COUNTER_Y = BAR_H - PANEL_EDGE - 0.7;

const counter = (x: number, n: number, live: LiveCounter): string =>
  `<text x="${x}" y="${COUNTER_Y}" text-anchor="end" font-family="${MONO}" font-size="${4.6 * CONTENT_SCALE}" fill="${READOUT}" data-hud="${live}">${Math.round(n)}</text>`;

const image = ({ url, w, h }: HudIcon, x: number, y: number): string =>
  `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;

const FIST_SCALE = 0.6;

const shrunk = (icon: HudIcon, k: number, x: number, y: number): string =>
  image({ ...icon, w: icon.w * k, h: icon.h * k }, x + (icon.w * (1 - k)) / 2, y + (icon.h * (1 - k)) / 2);

const notchedBox = (x: number, y: number, w: number, h: number, r: number, notches: Span[], level: number): string => {
  const bottom = y + h, s = Math.sign(level - bottom), q = TAB.r;
  const steps = [...notches].sort(([a], [b]) => b - a).map(([a, b]) =>
    `H${b + q}Q${b} ${bottom} ${b} ${bottom + s * q}V${level - s * q}Q${b} ${level} ${b - q} ${level}H${a + q}Q${a} ${level} ${a} ${level - s * q}V${bottom + s * q}Q${a} ${bottom} ${a - q} ${bottom}`).join("");
  return `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${bottom - r}Q${x + w} ${bottom} ${x + w - r} ${bottom}${steps}H${x + r}Q${x} ${bottom} ${x} ${bottom - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
};

const bevelPath = (d: string, raised: boolean, lw: number): string =>
  `<path d="${d}" fill="none" stroke="url(#${raised ? "bevelUp" : "bevelDown"})" stroke-width="${lw}"/>`;

const within = (spans: Span[], x: number, w: number): Span[] => spans.filter(([a, b]) => a > x && b < x + w);

const INSET = 0.6;

function gridPanel(x: number, w: number, tabs: Span[]): string {
  const notches = within(tabs, x, w), level = TAB.y - TAB.half;
  const outer = notchedBox(x + 0.4, PANEL_EDGE, w - 0.8, PANEL_H, 1.4, notches, level);
  const inner = notchedBox(x + 1, PANEL_EDGE + INSET, w - 2, PANEL_H - 2 * INSET, 1, notches.map(([a, b]): Span => [a - INSET, b + INSET]), level - INSET);
  return `<path d="${outer}" fill="#0b0806"/>
  ${["grid", "insetTop", "insetSide", "glare"].map((f) => `<path d="${inner}" fill="url(#${f})"/>`).join("")}
  ${bevelPath(outer, false, 0.35)}`;
}

function plate([a, b]: Span, tabs: Span[]): string {
  const outline = notchedBox(a, 0, b - a, BAR_H, 1.6, within(tabs, a, b - a), TAB.y + TAB.half);
  return `<path d="${outline}" fill="url(#barMetal)"/>
  <path d="M${a + 1.6} .4H${b - 1.6}" stroke="#e8d8bc" stroke-width=".5"/>
  ${bevelPath(outline, true, 0.45)}`;
}

const rod = ([a, b]: Span, y: number): string => `<rect x="${a - 1}" y="${y - 1.4}" width="${b - a + 2}" height="2.8" fill="url(#rodG)"/>
  <rect x="${a - 1.8}" y="${y - 1.9}" width="1.4" height="3.8" rx=".4" fill="url(#plate)" stroke="${LO}" stroke-width=".25"/>
  <rect x="${b + 0.4}" y="${y - 1.9}" width="1.4" height="3.8" rx=".4" fill="url(#plate)" stroke="${LO}" stroke-width=".25"/>`;


const BADGE_TEXT = `<text x="24" y="13.9" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="7.6" fill="#000" opacity=".7">C2080</text>
  <text x="24" y="13.3" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="7.6" fill="url(#chrome)" stroke="#1a140f" stroke-width=".2">C2080</text>`;

const BADGE_SCREW = 1.6;

function badge(x: number, [a, b]: Span): string {
  const l = a + PANEL_EDGE, r = b - PANEL_EDGE, t = PANEL_EDGE, d = BAR_H - PANEL_EDGE;
  const screws = [l + BADGE_SCREW, r - BADGE_SCREW].flatMap((sx) => [t + BADGE_SCREW, d - BADGE_SCREW].map((sy) => screw(sx, sy)));
  return `<rect x="${l}" y="${t}" width="${r - l}" height="${PANEL_H}" rx="1.4" fill="#16110d"/>
  <rect x="${l}" y="${t}" width="${r - l}" height="${PANEL_H}" rx="1.4" fill="url(#insetTop)"/>
  ${bevel(l, t, r - l, PANEL_H, 1.4, false, 0.35)}
  <g transform="translate(${x} ${(BAR_H - 20.4 * CONTENT_SCALE) / 2}) scale(${CONTENT_SCALE})">${BADGE_TEXT}</g>
  ${screws.join("")}`;
}

const CONTENT_MID = (PANEL_EDGE + TAB.y - TAB.half) / 2;
const WEAPON_MID = CONTENT_MID + 0.5;
const SLOT_MID_Y = CONTENT_MID;

const handAt = (centre: number): string =>
  `<g transform="translate(${centre} ${SLOT_MID_Y}) scale(${HAND_SCALE}) translate(${-HAND_DRAWN.w / 2} ${-HAND_DRAWN.h / 2})">${HAND}</g>`;

function slot(x: number, w: number, item: ItemId | null, icons: HudIcons, lang: Lang): string {
  const icon = item === null ? undefined : icons.items[item];
  const label = item === null ? tr("nothing", lang) : itemName(item, lang);
  const iconW = icon ? icon.w : HAND_BOX.w;
  const textW = readoutW(label);
  const start = x + (w - slotW(iconW, label)) / 2;
  const centre = start + iconW / 2;
  const nameCentre = start + iconW + SLOT.gap + textW / 2;
  const art = icon ? image(icon, centre - icon.w / 2, SLOT_MID_Y - icon.h / 2) : handAt(centre);
  return art + readout(nameCentre, label);
}

interface KeyTab {
  cx: number;
  label: string;
  active: boolean;
}

function top(W: number, s: HudState, icons: HudIcons, keys: HudKeys): string {
  const bar = topBar(W);
  const wx = bar.weapons;
  const item = slot(bar.inv, bar.invW, s.item, icons, s.lang ?? "en");
  const tabs: KeyTab[] = [
    { cx: bar.menu + MENU_W / 2, label: keys.menu, active: s.menuOpen },
    ...wx.slice(0, s.bonus ? 3 : 2).map((x, i) => ({ cx: x + keyCentre(i), label: keys.weapons[i] ?? "", active: s.weapon === i })),
    { cx: bar.sound + SPEAKER_W / 2, label: keys.sound, active: s.soundOn },
    { cx: bar.run + TOGGLE_W / 2, label: keys.run, active: s.running },
    { cx: bar.hide + HIDE_W / 2, label: keys.hide, active: s.hidden },
    { cx: bar.map + MAP_W / 2, label: keys.map, active: s.mapOpen },
    { cx: bar.inv + bar.invW / 2, label: keys.item, active: false },
  ];
  const spans = tabs.map(tabSpan);
  return `<rect width="${W}" height="${BAR_H}" fill="url(#circuit)"/>
  ${bar.gaps.filter(([a, b]) => b > a).map((g) => ROD_YS.map((y) => rod(g, y)).join("")).join("")}
  ${bar.plates.map((p) => plate(p, spans)).join("")}
  ${gridPanel(bar.menuX, bar.menuW, spans)}
  ${menuIcon(bar.menu + MENU_W / 2, s.menuOpen)}
  ${gridPanel(bar.gridX, bar.gridW, spans)}
  ${weapon(image(icons.gun, wx[0]!, WEAPON_MID - icons.gun.h / 2), s.weapon === 0)}${counter(wx[0]! + WEAPON_W[0]!, s.ammo, "ammo")}
  ${weapon(shrunk(icons.fist, FIST_SCALE, wx[1]!, WEAPON_MID - icons.fist.h / 2), s.weapon === 1)}
  ${s.bonus ? weapon(`<g transform="translate(${wx[2]!} ${WEAPON_MID}) scale(${CONTENT_SCALE}) translate(0 ${-BLASTER_MID_Y})">${blasterIcon(0)}</g>`, s.weapon === 2) + counter(wx[2]! + WEAPON_W[2]!, s.bonusAmmo, "bonusAmmo") : ""}
  ${badge(bar.badge, bar.plates[2]!)}
  ${gridPanel(bar.togglesX, bar.togglesW, spans)}
  ${soundIcon(bar.sound + SPEAKER_INK.left * SPEAKER_SCALE, s.soundOn)}
  ${runIcon(s.running ? icons.run : icons.walk, bar.run + TOGGLE_W / 2, s.running)}
  ${hideIcon(bar.hide + HIDE_W / 2, s.hidden)}
  ${mapIcon(bar.map + MAP_W / 2, s.mapOn, s.mapOpen)}
  ${gridPanel(bar.inv, bar.invW, spans)}${item}
  ${tabs.map(keyTab).join("")}`;
}

const ADVANCE: Record<string, number> = { "1": 0.39, "4": 0.73, "7": 0.66, " ": 0.32, "\u00a0": 0.32, "/": 0.52, E: 0.77, F: 0.72, I: 0.21, J: 0.78, K: 0.8, L: 0.78, M: 0.93, P: 0.79, Q: 0.88, T: 0.76, V: 1, W: 1.18, X: 0.81, Y: 0.81 };
const ADVANCE_DEFAULT = 0.83;
const textWidth = (label: string): number => [...label].reduce((w, ch) => w + (ADVANCE[ch] ?? ADVANCE_DEFAULT), 0) * TAB.font;
const tabWidth = (label: string): number => textWidth(label) + 2 * TAB.pad;

const letter = (x: number, y: number, attrs: string, label: string): string =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="${TAB.font}" ${attrs}>${label}</text>`;

const plainLetter = (x: number, y: number, label: string): string => letter(x + 0.2, y + 0.2, `fill="${HI}" opacity=".55"`, label) + letter(x, y, 'fill="#1a140f"', label);

const litLetter = (x: number, y: number, label: string): string => letter(x, y, 'fill="#ff2a10" opacity=".55" filter="url(#keyHalo)"', label) +
  letter(x, y, 'fill="#ff4a26" stroke="#7a0a02" stroke-width=".3" paint-order="stroke"', label);

const tabSpan = ({ cx, label }: KeyTab): Span => [cx - tabWidth(label) / 2, cx + tabWidth(label) / 2];

const keyTab = ({ cx, label, active }: KeyTab): string => {
  const base = TAB.y + TAB.font * 0.36;
  return active ? litLetter(cx, base, label) : plainLetter(cx, base, label);
};

const weapon = (content: string, active: boolean): string => `<g filter="url(#${active ? "iconGlow" : "iconDim"})">${content}</g>`;

const runIcon = (icon: HudIcon, x: number, running: boolean): string =>
  `<g filter="url(#${running ? "iconGlow" : "iconDim"})" data-icon="run">${image(icon, x - icon.w / 2, CONTENT_MID - icon.h / 2)}</g>`;

const soundIcon = (x: number, on: boolean): string =>
  `<g filter="url(#${on ? "iconGlow" : "iconDim"})" data-icon="sound"${on ? "" : ' data-sound="off"'}><g transform="translate(${x} ${CONTENT_MID}) scale(${SPEAKER_SCALE})">${speaker(on)}</g></g>`;

const hideIcon = (x: number, hidden: boolean): string =>
  `<g filter="url(#${hidden ? "iconGlow" : "iconDim"})" data-icon="hide"><g transform="translate(${x} ${CONTENT_MID}) scale(${SPEAKER_SCALE})">${EYE}${hidden ? EYE_SLASH : ""}</g></g>`;

const menuIcon = (x: number, open: boolean): string =>
  `<g${open ? ' filter="url(#iconGlow)"' : ""} data-icon="menu">${readout(x, MENU_LABEL)}</g>`;

const mapIcon = (x: number, held: boolean, open: boolean): string =>
  `<g filter="url(#${open ? "iconGlow" : "iconDim"})" data-icon="map"${held ? "" : ' data-map="none"'}><g transform="translate(${x} ${CONTENT_MID}) scale(${SPEAKER_SCALE})">${held ? foldedMap : QUESTION}</g></g>`;

const readout = (x: number, label: string): string =>
  `<text x="${x}" y="${CONTENT_MID + READOUT_SIZE * 0.35}" text-anchor="middle" font-family="${MONO}" font-size="${READOUT_SIZE}" fill="${READOUT}">${label}</text>`;

const KEY = { y: 181.5, size: 9, font: 6.2 };

function keyBox(x: number, letter: string, live?: string): string {
  const { y, size, font } = KEY, base = y + size / 2 + font * 0.36;
  return `<rect x="${x - 0.5}" y="${y - 0.5}" width="${size + 1}" height="${size + 1}" rx="1.3" fill="#0b0806"/>
  <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="1" fill="url(#plate)"/>
  ${bevel(x, y, size, size, 1, true, 0.4)}
  <text x="${x + size / 2 + 0.25}" y="${base + 0.25}" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="${font}" fill="${HI}" opacity=".55">${letter}</text>
  <text x="${x + size / 2}" y="${base}" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="${font}" fill="#1a140f">${letter}</text>${live ? `
  <text x="${x + size / 2}" y="${base}" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="${font}" fill="#ff3018" filter="url(#glow)" opacity="0" data-hud="${live}">${letter}</text>` : ""}`;
}

function tube(x: number, y: number, w: number, h: number, fillH: number, inner: number, paint: string, live?: string): string {
  return `<rect x="${x - 0.9}" y="${y - 0.9}" width="${w + 1.8}" height="${h + 1.8}" fill="url(#plate)"/>
  ${bevel(x - 0.9, y - 0.9, w + 1.8, h + 1.8, 0, true, 0.4)}
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#050403"/>
  ${fillH > 0 || live ? `<rect x="${x + (w - inner) / 2}" y="${y + h - 1.3 - fillH}" width="${inner}" height="${fillH}" fill="${paint}" filter="url(#glow)"${live ? ` data-hud="${live}"` : ""}/>` : ""}
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#glass)"/>
  ${bevel(x, y, w, h, 0, false, 0.4)}`;
}

const pct = (v: number): number => Math.min(100, Math.max(0, v)) / 100;

const LIFE = { y: 77.1, h: 104 };

export function lifeLevel(life: number): { fill: number; y: number } {
  const fill = (LIFE.h - 2.6) * pct(life);
  return { fill, y: LIFE.y + LIFE.h - 1.3 - fill };
}

function leftColumn(s: HudState): string {
  const { fill, y } = lifeLevel(s.life);
  return `${tube(3.5, LIFE.y, 4, LIFE.h, fill, 1.2, "url(#lifeFill)", "lifeFill")}
  <path d="M8.7 97.1h1.4M8.7 117.1h1.4M8.7 137.1h1.4M8.7 157.1h1.4" stroke="${LO}" stroke-width=".6"/>
  <path d="M8.7 97.6h1.4M8.7 117.6h1.4M8.7 137.6h1.4M8.7 157.6h1.4" stroke="${HI}" stroke-opacity=".5" stroke-width=".3"/>
  <g transform="translate(0 ${y})" data-hud="lifeArrow"><path d="M0 -2.5l3.4 2.5L0 2.5z" fill="#ff3018" filter="url(#glow)"/>
  <path d="M0 -1.9l2 1.4" stroke="#ffd0b0" stroke-width=".3"/></g>
  ${keyBox(1, "E", "alarm")}`;
}

const LAMP = { x: 3, y: 132.6, w: 5, h: 8.6, pitch: 9.6 };

function shieldLight(i: number, on: boolean): string {
  const lx = LAMP.x, ly = LAMP.y + i * LAMP.pitch, { w, h } = LAMP;
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

function shieldHalo(i: number): string {
  const lx = LAMP.x, ly = LAMP.y + i * LAMP.pitch, { w, h } = LAMP;
  return `<rect x="${lx - 0.6}" y="${ly - 0.6}" width="${w + 1.2}" height="${h + 1.2}" rx="1.5" fill="#ffb21c" opacity=".75" filter="url(#lampHalo)" style="mix-blend-mode:screen"/>
  <rect x="${lx + w / 2 - 1}" y="${ly + 1.5}" width="2" height="${h - 3}" fill="#fff6c0" opacity=".6" filter="url(#soft)" style="mix-blend-mode:screen"/>`;
}

function shieldChannel(): string {
  const top = LAMP.y - 1, h = 5 * LAMP.pitch + 1, rail = (rx: number): string =>
    `<rect x="${rx}" y="${top}" width="1" height="${h}" fill="url(#lampRail)"/>`;
  return `<rect x="${LAMP.x - 1}" y="${top}" width="${LAMP.w + 2}" height="${h}" fill="#050403"/>
  ${rail(LAMP.x - 1)}${rail(LAMP.x + LAMP.w)}`;
}

function rightColumn(s: HudState): string {
  const y0 = 75.6, h = 50;
  const lit = (i: number): boolean => SHIELDS_MAX - 1 - i < s.shields;
  const lamps = Array.from({ length: SHIELDS_MAX }, (_, i) => i);
  const lights = lamps.map((i) => shieldLight(i, lit(i))).join("");
  const halos = lamps.filter(lit).map((i) => shieldHalo(i)).join("");
  return `${tube(3.8, y0, 3.4, h, h - 2.6, 1.2, "url(#amberFill)")}
  <rect x="1" y="130.2" width="9" height="51.8" rx="1" fill="url(#plate)"/>
  ${bevel(1, 130.2, 9, 51.8, 1, true, 0.4)}
  ${shieldChannel()}
  ${lights}
  ${halos}
  ${keyBox(1, "S")}`;
}

function sideArt(x: number, art: string): string {
  return `<g transform="translate(${x} ${HUD_H - VIEW_BOX.bottom}) scale(${SIDE_ART.scale}) translate(0 ${-SIDE_ART.bottom})">${art}</g>`;
}

function sides(W: number, H: number): string {
  const h = H - VIEW_BOX.bottom;
  return `<rect width="${VIEW_BOX.left}" height="${h}" fill="url(#circuit)"/>
  <rect transform="translate(${W - VIEW_BOX.right} 0)" width="${VIEW_BOX.right}" height="${h}" fill="url(#circuit)"/>`;
}

function bottom(W: number): string {
  return `<rect y="${HUD_H - VIEW_BOX.bottom}" width="${W}" height="${VIEW_BOX.bottom}" fill="url(#metal)"/>
  <path d="M0 ${HUD_H - VIEW_BOX.bottom + 0.2}H${W}" stroke="${HI}" stroke-opacity=".6" stroke-width=".3"/>
  <path d="M0 ${HUD_H - 0.2}H${W}" stroke="${LO}" stroke-width=".4"/>`;
}

function frame(W: number, H: number): string {
  const { left, top: t, right, bottom: b } = VIEW_BOX;
  return `<path fill-rule="evenodd" fill="url(#metalV)" d="M0 0H${W}V${H}H0Z M${left} ${t}V${H - b}H${W - right}V${t}Z"/>`;
}

type LiveCounter = "ammo" | "bonusAmmo";

export function applyLive(root: ParentNode, s: Pick<HudState, "ammo" | "bonusAmmo" | "life">): void {
  const set = (live: string, apply: (el: Element) => void): void => {
    const el = root.querySelector(`[data-hud="${live}"]`);
    if (el) apply(el);
  };
  const text = (n: number) => (el: Element): void => {
    el.textContent = String(Math.round(n));
  };
  set("ammo", text(s.ammo));
  set("bonusAmmo", text(s.bonusAmmo));
  const { fill, y } = lifeLevel(s.life);
  set("lifeFill", (el) => {
    el.setAttribute("y", String(y));
    el.setAttribute("height", String(fill));
  });
  set("lifeArrow", (el) => el.setAttribute("transform", `translate(0 ${y})`));
}

export function hudSvg(W: number, H: number, s: HudState, icons: HudIcons, keys: HudKeys): string {
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${DEFS}
  ${frame(W, H)}${sides(W, H)}${top(W, s, icons, keys)}
  <g transform="translate(0 ${H - HUD_H})">${sideArt(0, leftColumn(s))}${sideArt(W - VIEW_BOX.right, rightColumn(s))}${bottom(W)}</g></svg>`;
}
