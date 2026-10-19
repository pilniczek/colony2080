import { ARC } from "../robot/eblaster";
import { bolt, LAYERS } from "../render/beam";

const ICON = { body: 34, arcEnd: 57, frame: 2, scale: 0.5 };
const ICON_Y = 2;

export const BLASTER_BODY_W = ICON.body;

const num = (n: number): number => +n.toFixed(2);

const strands = bolt((ICON.arcEnd - ICON.body) / ICON.scale, ICON.frame).map(
  (pts) => "M" + pts.map(([x, y]) => `${num(ICON.body + x * ICON.scale)} ${num(ICON_Y + y * ICON.scale)}`).join("L"),
);

const beamPaths =
  LAYERS.map(([color, width, alpha]) =>
    strands.map((d) => `<path d="${d}" stroke="${color}" stroke-width="${num(width * ICON.scale)}"${alpha < 1 ? ` opacity="${alpha}"` : ""}/>`).join(""),
  ).join("") +
  `<circle cx="${ICON.body}" cy="${ICON_Y}" r="${4 * ICON.scale}" fill="${ARC.glow}" opacity=".6"/>` +
  `<path d="M${ICON.body - 1.5} ${ICON_Y - 1.5}l3 3M${ICON.body - 1.5} ${ICON_Y + 1.5}l3 -3" stroke="${ARC.core}" stroke-width="${ICON.scale}"/>`;

const coils = [20.2, 23.2, 26.2].map((c) => `<rect x="${c}" y=".1" width="1.2" height="3.8" fill="#55636a"/>`).join("");

export const blasterIcon = (x: number): string => `<g transform="translate(${x} 5.2)" stroke="#202826" stroke-width=".3">
  <rect x="6" y="4" width="3" height="7" rx=".5" fill="#8e9aa0"/><rect x="9" y="4" width="6" height="2.6" fill="#55636a"/><rect x="10" y="4.8" width="4" height=".9" fill="#6084a4" stroke="none"/>
  <rect x="0" y="-.2" width="3" height="4" rx=".5" fill="#8e9aa0"/><rect x="2" y="-1" width="17" height="5" rx=".6" fill="#c4ccd0"/>
  <rect x="5.5" y="-2.4" width="10" height="1.6" rx=".4" fill="#8e9aa0"/><rect x="6.5" y="-2" width="8" height=".8" fill="#7ae0ff" stroke="none"/>
  <rect x="8" y="-1" width="1.4" height="5" fill="#6084a4"/><path d="M2.6 0H18.4" stroke="#eef2f2" stroke-width=".4"/>
  <rect x="19" y=".6" width="11" height="2.8" fill="#dfe5e7"/><rect x="19" y="1.6" width="11" height=".8" fill="#6084a4" stroke="none"/>
  ${coils}
  <rect x="29.4" y="-.4" width="1.2" height="4.8" fill="#55636a"/><rect x="30.4" y="-.4" width="3.6" height="1.1" fill="#c4ccd0"/><rect x="30.4" y="3.3" width="3.6" height="1.1" fill="#c4ccd0"/></g>
  <g transform="translate(${x} 5.2)" fill="none" stroke-linecap="round" stroke-linejoin="round">${beamPaths}</g>`;
