import { HUD_H, topBar, VIEW_BOX, type Span } from "./layout";

export interface HudState {
  weapon: number;
  bonus: boolean;
  ammo: number;
  bonusAmmo: number;
  life: number;
  reserve: number;
  shields: number;
  item: string;
}

export interface HudIcon {
  url: string;
  w: number;
  h: number;
}

export interface HudIcons {
  gun: HudIcon;
  fist: HudIcon;
}

export const SHIELDS_MAX = 5;

const AMBER = "#ffb21c";
const MONO = "Share Tech Mono, monospace";
const BOLD = "Orbitron, sans-serif";
const HI = "#d8c8ae";
const LO = "#0e0b08";
const BAR_H = 26.4;
const ROD_YS = [4.2, 9.6, 15, 20.4];
const SLOTS = [30, 98, 145];

const DEFS = `<defs>
  <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a08f76"/><stop offset=".1" stop-color="#6e604e"/><stop offset=".5" stop-color="#4b4034"/><stop offset=".85" stop-color="#2f2720"/><stop offset="1" stop-color="#1a1511"/></linearGradient>
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
  <radialGradient id="lampOn" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#fff6e4"/><stop offset=".18" stop-color="#ffb08a"/><stop offset=".42" stop-color="#ff3a16"/><stop offset=".78" stop-color="#b80c02"/><stop offset="1" stop-color="#4a0400"/></radialGradient>
  <radialGradient id="lampOff" cx=".5" cy=".4" r=".62"><stop offset="0" stop-color="#6e2a1e"/><stop offset=".5" stop-color="#3c0d07"/><stop offset="1" stop-color="#170403"/></radialGradient>
  <radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff4020" stop-opacity=".7"/><stop offset=".5" stop-color="#ff2a10" stop-opacity=".25"/><stop offset="1" stop-color="#ff2a10" stop-opacity="0"/></radialGradient>
  <linearGradient id="shieldOn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b87a14"/><stop offset=".22" stop-color="#e2a818"/><stop offset=".5" stop-color="#ffd62a"/><stop offset=".78" stop-color="#e2a818"/><stop offset="1" stop-color="#b87a14"/></linearGradient>
  <linearGradient id="shieldOff" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3416"/><stop offset=".22" stop-color="#5e5a1c"/><stop offset=".5" stop-color="#6c6a22"/><stop offset=".78" stop-color="#5e5a1c"/><stop offset="1" stop-color="#5a3416"/></linearGradient>
  <pattern id="lampLines" width="1" height="2" patternUnits="userSpaceOnUse"><rect y="1" width="1" height="1" fill="#000" fill-opacity=".3"/></pattern>
  <pattern id="lampRail" width="1" height="2" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#3a2412"/></pattern>
  <radialGradient id="screwHead" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#e6d8c0"/><stop offset=".45" stop-color="#8a7a64"/><stop offset="1" stop-color="#2e261e"/></radialGradient>
  <pattern id="grid" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><rect width="3.2" height="3.2" fill="#120b05"/><path d="M0 .1H3.2M.1 0V3.2" stroke="#5a360c" stroke-width=".2"/></pattern>
  <pattern id="circuit" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#111a17"/><path d="M1 1H8V5H12M3 13V8H6V11M10 8H13M1 6H4" fill="none" stroke="#24403a" stroke-width=".35"/><circle cx="12" cy="5" r=".55" fill="#2f5249"/><circle cx="6" cy="11" r=".55" fill="#2f5249"/></pattern>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="lampHalo" x="-150%" y="-100%" width="400%" height="300%"><feGaussianBlur stdDeviation="1.6"/></filter>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".35"/></filter>
  <g id="screw"><circle r="1.15" fill="#120e0b"/><circle r=".9" fill="url(#screwHead)"/><path d="M-.6 .35L.6 -.35" stroke="#2a221a" stroke-width=".3"/><path d="M-.55 .5L.65 -.2" stroke="#e6d8c0" stroke-width=".12" opacity=".6"/></g>
</defs>`;

const BLASTER = `<g transform="translate(126 7.2)" fill="#7f8b86" stroke="#202826" stroke-width=".3">
  <rect y="1" width="34" height="3" rx=".5"/><rect x="8" y="-1.4" width="14" height="2.4" rx=".5" fill="#3f4a46"/>
  <rect x="5" y="4" width="10" height="2.5"/><rect x="9" y="6.5" width="3" height="4.5" rx=".5"/></g>
  <path d="M161 9.7q8-3 22 0q-14 2.6-22 0z" fill="url(#flame)"/>`;

const HAND = `<g transform="translate(0 4.4)" fill="#f0a818" stroke="#6a4206" stroke-width=".3">
  <path d="M3 13c-2-2-3-4-3-6l1-1 2 2V2.2a1 1 0 0 1 2 0V6V1a1 1 0 0 1 2 0v5V1.6a1 1 0 0 1 2 0V6V3a1 1 0 0 1 2 0v6c0 2.6-1.4 4-3 4z"/></g>`;

const screw = (x: number, y: number): string => `<use href="#screw" x="${x}" y="${y}"/>`;

const bevel = (x: number, y: number, w: number, h: number, r: number, raised = true, lw = 0.45): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="url(#${raised ? "bevelUp" : "bevelDown"})" stroke-width="${lw}"/>`;

const counter = (x: number, n: number): string =>
  `<text x="${x}" y="15.6" font-family="${MONO}" font-size="7.4" fill="${AMBER}" filter="url(#glow)">N:${String(Math.round(n)).padStart(3, "0")}</text>`;

const image = ({ url, w, h }: HudIcon, x: number, y: number): string =>
  `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;

function lamp(slot: number, on: boolean): string {
  const w = 12, h = 2, x = slot + 2, y = 22.2, padX = 1.6, padY = 1;
  return `${on ? `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w}" ry="4.4" fill="url(#halo)"/>` : ""}
  <rect x="${x - padX}" y="${y - padY}" width="${w + 2 * padX}" height="${h + 2 * padY}" rx="1.4" fill="url(#plate)"/>
  ${bevel(x - padX, y - padY, w + 2 * padX, h + 2 * padY, 1.4, true, 0.3)}
  <rect x="${x - 0.5}" y="${y - 0.4}" width="${w + 1}" height="${h + 0.8}" rx="1" fill="#0a0605"/>
  ${bevel(x - 0.5, y - 0.4, w + 1, h + 0.8, 1, false, 0.2)}
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".8" fill="url(#${on ? "lampOn" : "lampOff"})"${on ? ' filter="url(#glow)"' : ""}/>
  <path d="${[3, 6, 9].map((d) => `M${x + d} ${y + 0.2}v${h - 0.4}`).join("")}" stroke="#000" stroke-opacity="${on ? 0.14 : 0.3}" stroke-width=".2"/>
  <rect x="${x + 1}" y="${y + 0.25}" width="${w - 2}" height=".5" rx=".25" fill="#fff" opacity="${on ? 0.55 : 0.14}" filter="url(#soft)"/>
  <circle cx="${x + 2}" cy="${y + 0.55}" r=".28" fill="#fff" opacity="${on ? 0.9 : 0.25}"/>`;
}

const gridPanel = (x: number, w: number): string => `<rect x="${x - 0.6}" y="2" width="${w + 1.2}" height="18.6" rx="2" fill="url(#plate)"/>
  ${bevel(x - 0.6, 2, w + 1.2, 18.6, 2, true, 0.4)}
  <rect x="${x + 0.4}" y="3" width="${w - 0.8}" height="16.6" rx="1.4" fill="#0b0806"/>
  ${["grid", "insetTop", "insetSide", "glare"].map((f) => `<rect x="${x + 1}" y="3.6" width="${w - 2}" height="15.4" rx="1" fill="url(#${f})"/>`).join("")}
  ${bevel(x + 0.4, 3, w - 0.8, 16.6, 1.4, false, 0.35)}`;

const plate = ([a, b]: Span): string => `<rect x="${a}" y="0" width="${b - a}" height="${BAR_H}" rx="1.6" fill="url(#metal)"/>
  <path d="M${a + 1.6} .4H${b - 1.6}" stroke="#e8d8bc" stroke-width=".5"/>
  ${bevel(a, 0, b - a, BAR_H, 1.6, true, 0.45)}`;

const rod = ([a, b]: Span, y: number): string => `<rect x="${a - 1}" y="${y - 1.4}" width="${b - a + 2}" height="2.8" fill="url(#rodG)"/>
  <rect x="${a - 1.8}" y="${y - 1.9}" width="1.4" height="3.8" rx=".4" fill="url(#plate)" stroke="${LO}" stroke-width=".25"/>
  <rect x="${b + 0.4}" y="${y - 1.9}" width="1.4" height="3.8" rx=".4" fill="url(#plate)" stroke="${LO}" stroke-width=".25"/>`;

const emptyScrews = ([a, b]: Span): string => screw(a + 3, 6) + screw(b - 3, 6) + screw(a + 3, 19) + screw(b - 3, 19);

function badge(x: number): string {
  return `<rect x="${x - 0.4}" y="1.8" width="48.8" height="21" rx="3.4" fill="#0b0806"/>
  <rect x="${x + 0.6}" y="2.6" width="46.8" height="19.4" rx="3" fill="url(#plate)"/>
  ${bevel(x + 0.6, 2.6, 46.8, 19.4, 3, true, 0.5)}
  <rect x="${x + 3.4}" y="5.4" width="41.2" height="13.8" rx="1.8" fill="#16110d"/>
  <rect x="${x + 3.4}" y="5.4" width="41.2" height="13.8" rx="1.8" fill="url(#insetTop)"/>
  ${bevel(x + 3.4, 5.4, 41.2, 13.8, 1.8, false, 0.45)}
  <text x="${x + 24}" y="16" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="7.6" fill="#000" opacity=".7">C2080</text>
  <text x="${x + 24}" y="15.4" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="7.6" fill="url(#chrome)" stroke="#1a140f" stroke-width=".2">C2080</text>
  ${screw(x + 2.4, 4.4)}${screw(x + 45.6, 4.4)}${screw(x + 2.4, 20.2)}${screw(x + 45.6, 20.2)}`;
}

function top(W: number, s: HudState, icons: HudIcons): string {
  const bar = topBar(W);
  const item = s.item
    ? `<text x="${bar.inv + 29.5}" y="13.8" text-anchor="middle" font-family="${MONO}" font-size="5.6" fill="${AMBER}" filter="url(#glow)">${s.item}</text>`
    : `<g transform="translate(${bar.inv + 5} 0)">${HAND}</g>`;
  return `<rect x="${bar.gaps[0]![1]}" width="${W - 2 * bar.gaps[0]![1]}" height="${BAR_H}" fill="#060504"/>
  ${bar.gaps.map((g) => ROD_YS.map((y) => rod(g, y)).join("")).join("")}
  ${bar.plates.map(plate).join("")}
  ${bar.empty ? emptyScrews(bar.empty) : ""}
  ${gridPanel(bar.gridX, bar.gridW)}
  ${image(icons.gun, 19, 4.4)}${counter(59, s.ammo)}
  ${image(icons.fist, 96, 3.8)}
  ${s.bonus ? BLASTER + counter(168, s.bonusAmmo) : ""}
  ${SLOTS.slice(0, s.bonus ? 3 : 2).map((x, i) => lamp(x, s.weapon === i)).join("")}
  ${badge(bar.badge)}
  ${gridPanel(bar.inv, 59)}${item}`;
}

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

function sides(W: number): string {
  return `<rect width="${VIEW_BOX.left}" height="192" fill="url(#circuit)"/>
  <rect transform="translate(${W - VIEW_BOX.right} 0)" width="${VIEW_BOX.right}" height="192" fill="url(#circuit)"/>`;
}

function bottom(W: number): string {
  return `<rect y="191.8" width="${W}" height="8.2" fill="url(#metal)"/>
  <path d="M0 192.2H${W}" stroke="${HI}" stroke-opacity=".6" stroke-width=".4"/>
  <path d="M0 199.6H${W}" stroke="${LO}" stroke-width=".8"/>
  <path d="M20 196H${W / 2 - 20}M${W / 2 + 20} 196H${W - 20}" stroke="${LO}" stroke-width=".7"/>
  <path d="M20 196.6H${W / 2 - 20}M${W / 2 + 20} 196.6H${W - 20}" stroke="${HI}" stroke-opacity=".35" stroke-width=".3"/>
  ${screw(W / 2 - 14, 196)}${screw(W / 2 + 14, 196)}`;
}

function frame(W: number): string {
  const { left, top: t, right, bottom: b } = VIEW_BOX;
  return `<path fill-rule="evenodd" fill="url(#metalV)" d="M0 0H${W}V${HUD_H}H0Z M${left} ${t}V${HUD_H - b}H${W - right}V${t}Z"/>`;
}

export function hudSvg(W: number, s: HudState, icons: HudIcons): string {
  return `<svg viewBox="0 0 ${W} ${HUD_H}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${DEFS}
  ${frame(W)}${sides(W)}${top(W, s, icons)}${leftColumn(s)}${rightColumn(W, s)}${bottom(W)}</svg>`;
}
