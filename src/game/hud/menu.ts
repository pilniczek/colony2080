import type { Rect } from "../geometry";
import { savedStamp, type Slots } from "../save/slots";
import { BOLD, box, image, INV, INVENTORY_BOXES, INVENTORY_DEFS, label, MONO } from "./inventory";
import { HUD_H, HUD_MIN_W } from "./layout";
import type { MenuState } from "./menuKeys";
import type { HudIcon } from "./svg";

const MENU = { back: "#0a1f14", grid: "#5a1a14", over: "#ffffff", overEdge: "#2438d0" };
const ENTRIES = ["SAVE GAME", "LOAD GAME", "MISSION SELECT"];
const MENU_BOX: Rect = { x: 22, y: 60, w: 128, h: 56 };
const SLOT_BOX: Rect = { x: 10, y: 8, w: 210, h: 184 };
const CHOICE_BOX: Rect = { x: 106, y: 146, w: 108, h: 45 };
const OVER = { size: 9, stroke: 1.2, fallback: { y: 100 } };
const SLOT_ROW = 30;
const MENU_ROW = 12;
const CHOICE_ROW = 13;
const PICTURE = { w: 40, h: 24 };
const ROBOT_OPACITY = 0.3;
const DIM = 0.25;
const LEAVE = "LEAVE? UNSAVED PROGRESS IS LOST  ENTER / ESC";

const DEFS = `<defs><pattern id="menuGrid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 16V0H16" fill="none" stroke="${MENU.grid}" stroke-width=".6"/></pattern></defs>`;

const escaped = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const text = (x: number, y: number, size: number, fill: string, value: string, attrs = ""): string =>
  `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" fill="${fill}" ${attrs}>${escaped(value)}</text>`;

const pick = (x: number, y: number, w: number, h: number): string => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${INV.pick}"/>`;

function backdrop(W: number, H: number, robot: HudIcon): string {
  const r = INVENTORY_BOXES.robot;
  return `<rect width="${W}" height="${H}" fill="${MENU.back}"/>
  <g transform="translate(${(W - HUD_MIN_W) / 2} ${(H - HUD_H) / 2})" style="opacity:${ROBOT_OPACITY}">${image(robot, r.x + (r.w - robot.w) / 2, r.y + r.h - robot.h)}</g>
  <rect width="${W}" height="${H}" fill="url(#menuGrid)"/>`;
}

function pause(s: Extract<MenuState, { screen: "pause" }>): string {
  const b = MENU_BOX;
  const rows = ENTRIES.map((entry, i) => {
    const y = b.y + 16 + i * MENU_ROW;
    const on = i === s.cursor;
    return (on ? pick(b.x + 2, y, b.w - 4, MENU_ROW - 1) : "") + text(b.x + 8, y + MENU_ROW * 0.66, 6.4, on ? "#fff" : INV.name, entry);
  }).join("");
  const ask = s.confirm ? text(b.x + b.w / 2, b.y + b.h + 9, 5.2, INV.stat, LEAVE, 'text-anchor="middle"') : "";
  return box(b) + label(b.x + b.w / 2, b.y + 10, 7.6, "MENU") + rows + ask;
}

function footer(s: Extract<MenuState, { screen: "save" | "load" }>): [string, string] {
  if (s.message) return [s.message.toUpperCase(), INV.stat];
  if (s.confirm) return ["OVERWRITE?  ENTER / ESC", INV.stat];
  if (s.typing !== null) return ["TYPE A NAME  ENTER SAVES  ESC BACK", INV.frame];
  return ["ENTER SELECTS  ESC BACK", INV.frame];
}

function slotList(s: Extract<MenuState, { screen: "save" | "load" }>, slots: Slots, prefix: string): string {
  const b = SLOT_BOX;
  const rows = slots.map((slot, i) => {
    const y = b.y + 16 + i * SLOT_ROW;
    const on = i === s.cursor;
    const typing = on && s.typing !== null;
    const name = typing ? `${s.typing ? `${prefix} - ${s.typing}` : prefix}|` : slot ? slot.name : "EMPTY";
    const picture = slot
      ? `<image href="${escaped(slot.picture)}" x="${b.x + b.w - PICTURE.w - 6}" y="${y + 3}" width="${PICTURE.w}" height="${PICTURE.h}" preserveAspectRatio="xMidYMid slice"/><rect x="${b.x + b.w - PICTURE.w - 6}" y="${y + 3}" width="${PICTURE.w}" height="${PICTURE.h}" fill="none" stroke="${INV.frame}" stroke-width=".5"/>`
      : "";
    return (
      (on ? pick(b.x + 2, y, b.w - 4, SLOT_ROW - 2) : "") +
      text(b.x + 6, y + 11, 7.2, on ? "#fff" : INV.label, String.fromCharCode(65 + i)) +
      text(b.x + 18, y + 11, 6, on ? "#fff" : slot || typing ? INV.name : INV.frame, name.toUpperCase()) +
      (slot ? text(b.x + 18, y + 21, 5, on ? "#fff" : INV.frame, savedStamp(slot.savedAt)) : "") +
      picture
    );
  }).join("");
  const [hint, colour] = footer(s);
  return box(b) + label(b.x + b.w / 2, b.y + 10, 7.6, s.screen === "save" ? "SAVE GAME" : "LOAD GAME") + rows + text(b.x + b.w / 2, b.y + b.h - 4, 5.2, colour, hint, 'text-anchor="middle"');
}

function gameOver(W: number, H: number, s: Extract<MenuState, { screen: "gameOver" }>): string {
  const choices = ["LOAD LAST SAVE", "RESTART MISSION", "EXIT"];
  const rows = choices.map((choice, i) => {
    const y = CHOICE_BOX.y + 4 + i * CHOICE_ROW;
    const on = i === s.cursor;
    const off = i === 0 && !s.canLoad;
    return (on ? pick(CHOICE_BOX.x + 4, y, CHOICE_BOX.w - 8, CHOICE_ROW - 1) : "") + text(CHOICE_BOX.x + CHOICE_BOX.w / 2, y + 8.4, 6.4, on ? "#fff" : off ? INV.frame : INV.name, choice, 'text-anchor="middle"');
  }).join("");
  const note = s.message ? text(160, CHOICE_BOX.y - 4, 5.2, INV.stat, s.message.toUpperCase(), 'text-anchor="middle"') : "";
  const ox = (W - HUD_MIN_W) / 2;
  const oy = (H - HUD_H) / 2;
  const at = { x: W / 2, y: s.at?.y ?? oy + OVER.fallback.y };
  const title = `<text x="${at.x}" y="${at.y}" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="${OVER.size}" letter-spacing="1" fill="${MENU.over}" stroke="${MENU.overEdge}" stroke-width="${OVER.stroke}" stroke-linejoin="miter" paint-order="stroke">GAME OVER</text>`;
  return `<rect width="${W}" height="${H}" fill="#000" opacity="${DIM}"/>
  ${title}
  <g transform="translate(${ox} ${oy})">${note}${box(CHOICE_BOX)}${rows}</g>`;
}

export function menuSvg(W: number, H: number, state: MenuState, slots: Slots, robot: HudIcon, prefix = "City"): string {
  const open = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${INVENTORY_DEFS}${DEFS}`;
  if (state.screen === "gameOver") return `${open}${gameOver(W, H, state)}</svg>`;
  const body = state.screen === "pause" ? pause(state) : slotList(state, slots, prefix);
  return `${open}${backdrop(W, H, robot)}<g transform="translate(${(W - HUD_MIN_W) / 2} ${(H - HUD_H) / 2})">${body}</g></svg>`;
}
