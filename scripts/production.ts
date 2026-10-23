import { cpSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const DEV_ONLY = /\n?[ \t]*<(\w+) [^>]*\bdata-dev\b[^>]*>[\s\S]*?<\/\1>/g;
const ORIGINALS_BLOCK = /\n?<!-- originals -->[\s\S]*?<!-- \/originals -->/g;
const ORIGINALS_OFF = "window.ORIGINALS = { on: false, src: () => null, cutscenes: {} };\n";
const CONFIG_PREFIX = "window.C28_CONFIG = ";
const BLANKED_KEYS = new Set(["source", "note", "units", "description", "csName", "cs", "preview"]);
const EMPTIED_KEYS = new Set(["refs"]);
const ORIGINAL_GAME = [/colony[ -]?28/i, /x-bot/i, /klev\d/i, /grafika/i, /\.gra\b/i, /\.anm\b/i, /metropac/i, /docs\/research/i, /město/i, /kolonie/i, /score 44/i, /steam/i, /\bds:0x/i, /\bM1[1-6]\b/, /\bfootage\b/i, /\bvideo [AB]\b/i, /\breport \d+\b/i, /\bfirstSighting\b/, /\bbehaviour\b/i, /\.snd\b/i, /zvuky/i, /strelba|kulomet|vybuch|vytah|sirena|invend|p1_cann/i, /\b(laser[23]|uder|krok\d|ikona|dvere\d?|mriz\d?|hrom|zkrat|hydra|zazeh|prulet\d?|prelet|vrata\d?|odlet)\b/i];
const TEXT_FILE = /\.(html|js|mjs|css|json|svg|txt)$/;

const files = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? files(path) : [path];
});

export const stripDevOnly = (html: string): string => html.replace(DEV_ONLY, "");

export const stripOriginals = (html: string): string => html.replace(ORIGINALS_BLOCK, "");

const KEPT_IN: [RegExp, string][] = [[/\/config\/items\.json$/, "cs"]];

export const scrubConfig = (value: unknown, kept: ReadonlySet<string> = new Set()): unknown => {
  if (Array.isArray(value)) return value.map((v) => scrubConfig(v, kept));
  if (!value || typeof value !== "object") return value;
  const blank = (key: string): boolean => BLANKED_KEYS.has(key) && !kept.has(key);
  return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, EMPTIED_KEYS.has(key) ? [] : blank(key) && typeof v === "string" ? "" : scrubConfig(v, kept)]));
};

export const scrubConfigFile = (id: string, value: unknown): unknown => scrubConfig(value, new Set(KEPT_IN.filter(([file]) => file.test(id)).map(([, key]) => key)));

const productionConfig = (js: string): string => {
  const json: unknown = JSON.parse(js.slice(CONFIG_PREFIX.length).replace(/;\s*$/, ""));
  return `${CONFIG_PREFIX}${JSON.stringify(scrubConfig(json))};\n`;
};

export function buildProductionSpikes(src: string, out: string): void {
  cpSync(src, out, { recursive: true });
  for (const path of files(out).filter((p) => p.endsWith(".html"))) writeFileSync(path, stripOriginals(readFileSync(path, "utf8")));
  writeFileSync(join(out, "shared/originals.js"), ORIGINALS_OFF);
  const config = join(out, "shared/config.js");
  writeFileSync(config, productionConfig(readFileSync(config, "utf8")));
}

export function assertNoOriginalGame(dist: string): void {
  const leaks = files(dist)
    .filter((p) => TEXT_FILE.test(p))
    .flatMap((p) => {
      const text = readFileSync(p, "utf8");
      return ORIGINAL_GAME.filter((re) => re.test(text)).map((re) => `${relative(dist, p)} (${re.source})`);
    });
  if (leaks.length) throw new Error(`production build references the original game: ${leaks.join(", ")}`);
}
