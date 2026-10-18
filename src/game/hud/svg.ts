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
  <linearGradient id="lifeFill" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="164"><stop offset="0" stop-color="#fff2a0"/><stop offset=".35" stop-color="#ffd030"/><stop offset=".7" stop-color="#ff8a10"/><stop offset="1" stop-color="#d81c06"/></linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#fff" stop-opacity=".45"/><stop offset=".38" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
  <linearGradient id="insetTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".75"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
  <linearGradient id="insetSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset=".04" stop-color="#000" stop-opacity="0"/><stop offset=".96" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
  <linearGradient id="glare" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="flame" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffde70"/><stop offset=".5" stop-color="#ff7a10"/><stop offset="1" stop-color="#ff7a10" stop-opacity="0"/></linearGradient>
  <linearGradient id="bevelUp" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="${HI}" stop-opacity=".85"/><stop offset=".4" stop-color="${HI}" stop-opacity=".25"/><stop offset=".6" stop-color="${LO}" stop-opacity=".35"/><stop offset="1" stop-color="${LO}" stop-opacity=".95"/></linearGradient>
  <linearGradient id="bevelDown" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="${LO}" stop-opacity=".95"/><stop offset=".4" stop-color="${LO}" stop-opacity=".35"/><stop offset=".6" stop-color="${HI}" stop-opacity=".2"/><stop offset="1" stop-color="${HI}" stop-opacity=".75"/></linearGradient>
  <linearGradient id="rodG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3128"/><stop offset=".3" stop-color="#f0e4cc"/><stop offset=".55" stop-color="#8a7a64"/><stop offset="1" stop-color="#1a140f"/></linearGradient>
  <linearGradient id="pipeG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0e1e1c"/><stop offset=".35" stop-color="#7fb8ae"/><stop offset=".6" stop-color="#3a6a64"/><stop offset="1" stop-color="#0a1412"/></linearGradient>
  <radialGradient id="lampOn" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#fff6e4"/><stop offset=".18" stop-color="#ffb08a"/><stop offset=".42" stop-color="#ff3a16"/><stop offset=".78" stop-color="#b80c02"/><stop offset="1" stop-color="#4a0400"/></radialGradient>
  <radialGradient id="lampOff" cx=".5" cy=".4" r=".62"><stop offset="0" stop-color="#6e2a1e"/><stop offset=".5" stop-color="#3c0d07"/><stop offset="1" stop-color="#170403"/></radialGradient>
  <radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff4020" stop-opacity=".7"/><stop offset=".5" stop-color="#ff2a10" stop-opacity=".25"/><stop offset="1" stop-color="#ff2a10" stop-opacity="0"/></radialGradient>
  <radialGradient id="shieldOn" cx=".45" cy=".4" r=".65"><stop offset="0" stop-color="#fffbe0"/><stop offset=".3" stop-color="#ffe060"/><stop offset=".75" stop-color="#d89a10"/><stop offset="1" stop-color="#6a4400"/></radialGradient>
  <radialGradient id="shieldOff" cx=".45" cy=".4" r=".65"><stop offset="0" stop-color="#5a5228"/><stop offset=".6" stop-color="#34301a"/><stop offset="1" stop-color="#1a170c"/></radialGradient>
  <radialGradient id="screwHead" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#e6d8c0"/><stop offset=".45" stop-color="#8a7a64"/><stop offset="1" stop-color="#2e261e"/></radialGradient>
  <pattern id="grid" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><rect width="3.2" height="3.2" fill="#140c05"/><path d="M0 .2H3.2M.2 0V3.2" stroke="#9a5c0c" stroke-width=".35"/></pattern>
  <pattern id="circuit" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#14221d"/><path d="M1 1H8V5H12M3 13V8H6V11M10 8H13M1 6H4" fill="none" stroke="#3c6a58" stroke-width=".6"/><circle cx="12" cy="5" r=".8" fill="#5f9680"/><circle cx="6" cy="11" r=".8" fill="#5f9680"/></pattern>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
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

function keyBox(x: number, letter: string): string {
  return `<rect x="${x - 0.6}" y="165.9" width="13.2" height="13.2" rx="1.6" fill="#0b0806"/>
  <rect x="${x}" y="166.5" width="12" height="12" rx="1.2" fill="url(#plate)"/>
  ${bevel(x, 166.5, 12, 12, 1.2, true, 0.5)}
  <text x="${x + 6.3}" y="176.1" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="8.4" fill="${HI}" opacity=".55">${letter}</text>
  <text x="${x + 6}" y="175.8" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="8.4" fill="#1a140f">${letter}</text>`;
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
  const y0 = 60, h = 104, fill = (h - 2.6) * pct(s.life), y = y0 + h - 1.3 - fill;
  return `${tube(4.6, y0, 4, h, fill, 1.2, "url(#lifeFill)")}
  <path d="M9.8 80h1.4M9.8 100h1.4M9.8 120h1.4M9.8 140h1.4" stroke="${LO}" stroke-width=".6"/>
  <path d="M9.8 80.5h1.4M9.8 100.5h1.4M9.8 120.5h1.4M9.8 140.5h1.4" stroke="${HI}" stroke-opacity=".5" stroke-width=".3"/>
  <path d="M0 ${y - 2.5}l3.4 2.5L0 ${y + 2.5}z" fill="#ff3018" filter="url(#glow)"/>
  <path d="M0 ${y - 1.9}l2 1.4" stroke="#ffd0b0" stroke-width=".3"/>
  ${screw(6.6, 34)}${screw(6.6, 186)}
  ${keyBox(0.6, "E")}`;
}

function shieldLight(x: number, i: number, on: boolean): string {
  const ly = 112.6 + i * 9.8;
  return `<rect x="${x + 5}" y="${ly - 0.4}" width="8.6" height="9.2" rx=".9" fill="#0a0806"/>
  <rect x="${x + 5.4}" y="${ly}" width="7.8" height="8.4" rx=".7" fill="url(#${on ? "shieldOn" : "shieldOff"})"${on ? ' filter="url(#glow)"' : ""}/>
  <path d="M${x + 6} ${ly + 4.2}h6.6" stroke="#000" stroke-opacity=".18" stroke-width=".3"/>
  <rect x="${x + 6.2}" y="${ly + 0.7}" width="3.4" height="1" rx=".5" fill="#fff" opacity="${on ? 0.75 : 0.18}" filter="url(#soft)"/>`;
}

function rightColumn(W: number, s: HudState): string {
  const x = W - 16, y0 = 56, h = 50;
  const lights = Array.from({ length: SHIELDS_MAX }, (_, i) => shieldLight(x, i, SHIELDS_MAX - 1 - i < s.shields)).join("");
  return `${tube(x + 7.6, y0, 3.4, h, (h - 2.6) * pct(s.reserve), 1.2, "url(#amberFill)")}
  <rect x="${x + 3.4}" y="110.6" width="11.8" height="51.8" rx="1.4" fill="url(#plate)"/>
  ${bevel(x + 3.4, 110.6, 11.8, 51.8, 1.4, true, 0.4)}
  ${lights}
  ${screw(x + 9.3, 34)}${screw(x + 9.3, 186)}
  ${keyBox(x + 3.3, "S")}`;
}

function pipe(x: number, clampSide: number): string {
  const y0 = 26, h = 166, clamps: string[] = [];
  for (let y = y0 + 20; y < y0 + h - 8; y += 16)
    clamps.push(`<rect x="${x + clampSide}" y="${y}" width="1.6" height="1.8" rx=".3" fill="#c09a30"/><rect x="${x + clampSide}" y="${y}" width="1.6" height=".5" fill="#ffe08a" opacity=".7"/>`);
  return `<rect x="${x}" y="${y0}" width="1.8" height="${h}" fill="url(#pipeG)"/>${clamps.join("")}`;
}

function sides(W: number): string {
  return `<rect width="16" height="192" fill="url(#circuit)"/>
  <rect x="${W - 16}" width="16" height="192" fill="url(#circuit)"/>
  ${pipe(13.2, -1.4)}${pipe(W - 15.2, 1.8)}
  <path d="M.4 0V192M${W - 15.6} 26V192" stroke="${HI}" stroke-opacity=".35" stroke-width=".4"/>
  <path d="M15.6 26V192M${W - 0.4} 0V192" stroke="${LO}" stroke-width=".5"/>`;
}

function viewWindow(W: number): string {
  const { left, top: t, right, bottom } = VIEW_BOX;
  const w = W - left - right, h = HUD_H - t - bottom;
  return `<rect x="${left}" y="${t}" width="${w}" height="${h}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="2.4" filter="url(#soft)"/>
  ${bevel(left - 0.6, t - 0.4, w + 1.2, h + 0.8, 0, false, 0.7)}`;
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
  ${frame(W)}${sides(W)}${viewWindow(W)}${top(W, s, icons)}${leftColumn(s)}${rightColumn(W, s)}${bottom(W)}</svg>`;
}
