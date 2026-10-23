import type { Rect } from "../geometry";
import { LANG_NAMES, LANGS, tr, type Lang } from "../i18n";
import { AUTO_SLOT, savedStamp, slotLabel, type Slots } from "../save/slots";
import { BOLD, box, image, INV, INVENTORY_BOXES, INVENTORY_DEFS, label, MONO, type InventoryArt } from "./inventory";
import { HUD_H, HUD_MIN_W, viewRect } from "./layout";
import { PAUSE_ROWS, SETTINGS_ROWS, type MenuState } from "./menuKeys";
import type { HudIcon } from "./svg";

const MENU = { back: "#0a1f14", grid: "#5a1a14", over: "#ffffff", overEdge: "#2438d0" };
const AUTOSAVES = ["AUTOSAVE", "NO AUTOSAVE"];
const MENU_BOX: Rect = { x: 22, y: 8, w: 148, h: 68 };
const SLOT_BOX: Rect = { x: 10, y: 8, w: 210, h: 184 };
const CHOICE_BOX: Rect = { x: 106, y: 146, w: 108, h: 45 };
const OVER = { size: 9, stroke: 1.2, fallback: { y: 100 } };
const SLOT_ROW = 30;
const SLOT_ROOM = 26;
const LETTER = { size: 7.2, auto: 4.4 };
const MENU_ROW = 12;
const MENU_ROOM = 20;
const BUTTON_GAP = 6;
const ARROW = { w: 3, h: 4.4, inset: 2.4 };
const CHOICE_ROW = 13;
const PICTURE = { aspect: 5 / 3, pad: 6 };
const ROBOT_OPACITY = 0.3;
const DIM = 0.25;
const ASK: Record<number, string> = { [PAUSE_ROWS.restart]: "RESTART? UNSAVED PROGRESS IS LOST  ENTER / ESC" };
const STEPS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] } as const;
type Step = keyof typeof STEPS;
const MANUAL_KEYS: [string | Step[] | "liftPanel", string][] = [
  [["left", "right"], "MOVE"],
  [["up"], "JUMP, CLIMB UP"],
  [["down"], "DUCK, CLIMB DOWN"],
  ["CTRL", "SHOOT / PUNCH"],
  ["liftPanel", "ENTER CALLS A DISTANT LIFT"],
  ["X", "HIDING MIGHT BE MORE THAN SHOOTING"],
];
const ARROW_KEY = { len: 5.4, head: 1.6, stroke: 0.7, spread: 4.5 };
const MANUAL = { gap: 14, text: 5.6, key: 14, keyGap: 10, top: 18, pitch: 13, pad: 6 };
const CAPS_EM = 0.7;

export type MenuArt = Pick<InventoryArt, "robot" | "liftPanel">;

type Row = { entry: string; gap?: boolean } | { options: string[]; on: number };

const DEFS = `<defs><pattern id="menuGrid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 16V0H16" fill="none" stroke="${MENU.grid}" stroke-width=".6"/></pattern></defs>`;

const escaped = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const text = (x: number, y: number, size: number, fill: string, value: string, attrs = ""): string =>
  `<text x="${x}" y="${y}" font-family="${MONO}" font-size="${size}" fill="${fill}" ${attrs}>${escaped(value)}</text>`;

const pick = (x: number, y: number, w: number, h: number): string => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${INV.pick}"/>`;

const fitIn = ({ x, y, w, h }: Rect): string => {
  const k = Math.min(w / HUD_MIN_W, h / HUD_H);
  return `translate(${x + (w - HUD_MIN_W * k) / 2} ${y + (h - HUD_H * k) / 2}) scale(${k})`;
};

const area = ({ x, y, w, h }: Rect, fill: string): string => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;

function backdrop(view: Rect, robot: HudIcon): string {
  const r = INVENTORY_BOXES.robot;
  return `${area(view, MENU.back)}
  <g transform="${fitIn(view)}" style="opacity:${ROBOT_OPACITY}">${image(robot, r.x + (r.w - robot.w) / 2, r.y + r.h - robot.h)}</g>
  ${area(view, "url(#menuGrid)")}`;
}

const tspan = (fill: string, value: string, active = false): string =>
  `<tspan fill="${fill}"${active ? ' text-decoration="underline"' : ""}>${escaped(value)}</tspan>`;

function rowText(row: Row, x: number, y: number, on: boolean): string {
  const bright = on ? "#fff" : INV.name;
  if ("entry" in row) return text(x, y, 6.4, bright, row.entry);
  const parts = row.options.map((option, i) => tspan(i === row.on ? bright : INV.frame, option, i === row.on)).join(tspan(INV.frame, " / "));
  return `<text x="${x}" y="${y}" font-family="${MONO}" font-size="6.4" xml:space="preserve">${parts}</text>`;
}

function arrows(b: Rect, y: number, on: boolean): string {
  const fill = on ? "#fff" : INV.frame;
  const mid = y + (MENU_ROW - 1) / 2;
  const top = mid - ARROW.h / 2;
  const bottom = mid + ARROW.h / 2;
  const left = b.x + ARROW.inset;
  const right = b.x + b.w - ARROW.inset;
  return (
    `<polygon data-arrow="left" points="${left},${mid} ${left + ARROW.w},${top} ${left + ARROW.w},${bottom}" fill="${fill}"/>` +
    `<polygon data-arrow="right" points="${right},${mid} ${right - ARROW.w},${top} ${right - ARROW.w},${bottom}" fill="${fill}"/>`
  );
}

const rowsHeight = (rows: Row[]): number => MENU_ROOM + rows.length * MENU_ROW + rows.filter((row) => "entry" in row && row.gap).length * BUTTON_GAP;

function rowsBox(title: string, rows: Row[], cursor: number): string {
  const b = { ...MENU_BOX, h: rowsHeight(rows) };
  let y = b.y + 16;
  const drawn = rows.map((row, i) => {
    if ("entry" in row && row.gap) y += BUTTON_GAP;
    const on = i === cursor;
    const out = (on ? pick(b.x + 2, y, b.w - 4, MENU_ROW - 1) : "") + rowText(row, b.x + 10, y + MENU_ROW * 0.66, on) + ("options" in row ? arrows(b, y, on) : "");
    y += MENU_ROW;
    return out;
  }).join("");
  return box(b) + label(b.x + b.w / 2, b.y + 10, 7.6, title) + drawn;
}

function arrowKey(cx: number, cy: number, step: Step): string {
  const [dx, dy] = STEPS[step];
  const { len, head } = ARROW_KEY;
  const tip = [cx + (dx * len) / 2, cy + (dy * len) / 2] as const;
  const back = [tip[0] - dx * head, tip[1] - dy * head] as const;
  const wing = (side: number): string => `${back[0] - dy * head * side},${back[1] + dx * head * side}`;
  return `<path d="M${cx - (dx * len) / 2},${cy - (dy * len) / 2}L${tip[0]},${tip[1]}M${wing(1)}L${tip[0]},${tip[1]}L${wing(-1)}" fill="none" stroke="${INV.name}" stroke-width="${ARROW_KEY.stroke}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

const arrowKeys = (cx: number, cy: number, steps: Step[]): string =>
  steps.map((step, i) => arrowKey(cx + (i - (steps.length - 1) / 2) * 2 * ARROW_KEY.spread, cy, step)).join("");

function manual(rows: Row[], panel: HudIcon, lang: Lang): string {
  const top = MENU_BOX.y + rowsHeight(rows) + MANUAL.gap;
  const x = MENU_BOX.x + 10;
  const keyMid = x + MANUAL.key / 2;
  const actionX = x + MANUAL.key + MANUAL.keyGap;
  const capsMid = (MANUAL.text * CAPS_EM) / 2;
  const midOf = (i: number): number => top + MANUAL.top + i * MANUAL.pitch;
  const action = (i: number, value: string): string => text(actionX, midOf(i) + capsMid, MANUAL.text, INV.label, tr(value, lang));
  const keyOf = (key: string | Step[], mid: number): string => {
    if (key === "liftPanel") return image(panel, keyMid - panel.w / 2, mid - panel.h / 2);
    if (typeof key === "string") return text(keyMid, mid + capsMid, MANUAL.text, INV.name, key, 'text-anchor="middle"');
    return arrowKeys(keyMid, mid, key);
  };
  const keys = MANUAL_KEYS.map(([key, value], i) => keyOf(key, midOf(i)) + action(i, value)).join("");
  const b = { ...MENU_BOX, y: top, h: midOf(MANUAL_KEYS.length - 1) + capsMid + MANUAL.pad - top };
  return box(b) + label(b.x + b.w / 2, b.y + 10, 7.6, tr("MANUAL", lang)) + keys;
}

const autosaveRow = (autosave: boolean, lang: Lang): Row => ({ options: AUTOSAVES.map((o) => tr(o, lang)), on: autosave ? 0 : 1 });

const langRow = (lang: Lang): Row => ({ options: LANGS.map((l) => LANG_NAMES[l]), on: LANGS.indexOf(lang) });

function settings(s: Extract<MenuState, { screen: "settings" }>, lang: Lang, panel: HudIcon): string {
  const rows: Row[] = [];
  rows[SETTINGS_ROWS.autosave] = autosaveRow(s.autosave, lang);
  rows[SETTINGS_ROWS.lang] = langRow(lang);
  rows[SETTINGS_ROWS.start] = { entry: tr("START", lang), gap: true };
  return rowsBox(tr("SETTINGS", lang), rows, s.cursor) + manual(rows, panel, lang);
}

function pause(s: Extract<MenuState, { screen: "pause" }>, lang: Lang, autosave: boolean, panel: HudIcon): string {
  const rows: Row[] = [];
  rows[PAUSE_ROWS.save] = { entry: tr("SAVE GAME", lang) };
  rows[PAUSE_ROWS.load] = { entry: tr("LOAD GAME", lang) };
  rows[PAUSE_ROWS.autosave] = autosaveRow(autosave, lang);
  rows[PAUSE_ROWS.lang] = langRow(lang);
  rows[PAUSE_ROWS.restart] = { entry: tr("RESTART MISSION", lang) };
  const b = MENU_BOX;
  const bottom = b.y + MENU_ROOM + rows.length * MENU_ROW;
  const ask = s.confirm ? text(b.x + b.w / 2, bottom + 9, 5.2, INV.stat, tr(ASK[s.cursor] ?? "", lang), 'text-anchor="middle"') : "";
  return rowsBox(tr("MENU", lang), rows, s.cursor) + ask + manual(rows, panel, lang);
}

function footer(s: Extract<MenuState, { screen: "save" | "load" }>, lang: Lang): [string, string] {
  if (s.message) return [tr(s.message, lang).toUpperCase(), INV.stat];
  if (s.confirm) return [tr("OVERWRITE?  ENTER / ESC", lang), INV.stat];
  if (s.typing !== null) return [tr("TYPE A NAME  ENTER SAVES  ESC BACK", lang), INV.frame];
  return [tr("ENTER SELECTS  ESC BACK", lang), INV.frame];
}

function slotList(s: Extract<MenuState, { screen: "save" | "load" }>, slots: Slots, prefix: string, lang: Lang): string {
  const b = SLOT_BOX;
  const shown = s.screen === "save" ? slots.slice(0, AUTO_SLOT) : slots;
  const row = Math.min(SLOT_ROW, (b.h - SLOT_ROOM) / shown.length);
  const ph = row - PICTURE.pad;
  const pw = ph * PICTURE.aspect;
  const rows = shown.map((slot, i) => {
    const y = b.y + 16 + i * row;
    const on = i === s.cursor;
    const typing = on && s.typing !== null;
    const name = typing ? `${s.typing ? `${prefix} - ${s.typing}` : prefix}|` : slot ? slot.name : tr("EMPTY", lang);
    const picture = slot
      ? `<image href="${escaped(slot.picture)}" x="${b.x + b.w - pw - 6}" y="${y + 3}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid slice"/><rect x="${b.x + b.w - pw - 6}" y="${y + 3}" width="${pw}" height="${ph}" fill="none" stroke="${INV.frame}" stroke-width=".5"/>`
      : "";
    return (
      (on ? pick(b.x + 2, y, b.w - 4, row - 2) : "") +
      text(b.x + 6, y + 11, i === AUTO_SLOT ? LETTER.auto : LETTER.size, on ? "#fff" : INV.label, slotLabel(i)) +
      text(b.x + 18, y + 11, 6, on ? "#fff" : slot || typing ? INV.name : INV.frame, name.toUpperCase()) +
      (slot ? text(b.x + 18, y + 21, 5, on ? "#fff" : INV.frame, savedStamp(slot.savedAt)) : "") +
      picture
    );
  }).join("");
  const [hint, colour] = footer(s, lang);
  return box(b) + label(b.x + b.w / 2, b.y + 10, 7.6, tr(s.screen === "save" ? "SAVE GAME" : "LOAD GAME", lang)) + rows + text(b.x + b.w / 2, b.y + b.h - 4, 5.2, colour, hint, 'text-anchor="middle"');
}

function gameOver(W: number, H: number, s: Extract<MenuState, { screen: "gameOver" }>, lang: Lang): string {
  const choices = ["LOAD LAST SAVE", "RESTART MISSION", "EXIT"].map((choice) => tr(choice, lang));
  const rows = choices.map((choice, i) => {
    const y = CHOICE_BOX.y + 4 + i * CHOICE_ROW;
    const on = i === s.cursor;
    const off = i === 0 && !s.canLoad;
    return (on ? pick(CHOICE_BOX.x + 4, y, CHOICE_BOX.w - 8, CHOICE_ROW - 1) : "") + text(CHOICE_BOX.x + CHOICE_BOX.w / 2, y + 8.4, 6.4, on ? "#fff" : off ? INV.frame : INV.name, choice, 'text-anchor="middle"');
  }).join("");
  const note = s.message ? text(160, CHOICE_BOX.y - 4, 5.2, INV.stat, tr(s.message, lang).toUpperCase(), 'text-anchor="middle"') : "";
  const ox = (W - HUD_MIN_W) / 2;
  const oy = (H - HUD_H) / 2;
  const at = { x: W / 2, y: s.at?.y ?? oy + OVER.fallback.y };
  const title = `<text x="${at.x}" y="${at.y}" text-anchor="middle" font-family="${BOLD}" font-weight="900" font-size="${OVER.size}" letter-spacing="1" fill="${MENU.over}" stroke="${MENU.overEdge}" stroke-width="${OVER.stroke}" stroke-linejoin="miter" paint-order="stroke">${escaped(tr("GAME OVER", lang))}</text>`;
  return `<rect width="${W}" height="${H}" fill="#000" opacity="${DIM}"/>
  ${title}
  <g transform="translate(${ox} ${oy})">${note}${box(CHOICE_BOX)}${rows}</g>`;
}

export function menuSvg(W: number, H: number, state: MenuState, slots: Slots, art: MenuArt, prefix = "City", lang: Lang = "en", autosave = false): string {
  const open = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${INVENTORY_DEFS}${DEFS}`;
  if (state.screen === "gameOver") return `${open}${gameOver(W, H, state, lang)}</svg>`;
  const body = state.screen === "settings" ? settings(state, lang, art.liftPanel) : state.screen === "pause" ? pause(state, lang, autosave, art.liftPanel) : slotList(state, slots, prefix, lang);
  const view = viewRect({ W, H, unit: 1 });
  return `${open}${backdrop(view, art.robot)}<g transform="${fitIn(view)}">${body}</g></svg>`;
}
