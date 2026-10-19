import { cpSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ORIGINALS_BLOCK = /\n?<!-- originals -->[\s\S]*?<!-- \/originals -->/g;
const ORIGINALS_OFF = "window.ORIGINALS = { on: false, src: () => null };\n";
const CONFIG_PREFIX = "window.C28_CONFIG = ";
const FORBIDDEN = "docs/research";
const DROPPED_KEYS = new Set(["source"]);
const EMPTIED_KEYS = new Set(["refs"]);

const files = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? files(path) : [path];
});

export const stripOriginals = (html: string): string => html.replace(ORIGINALS_BLOCK, "");

const dropKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(dropKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !DROPPED_KEYS.has(key)).map(([key, v]) => [key, EMPTIED_KEYS.has(key) ? [] : dropKeys(v)]));
};

export const productionConfig = (js: string): string => {
  const json = JSON.parse(js.slice(CONFIG_PREFIX.length).replace(/;\s*$/, ""));
  return `${CONFIG_PREFIX}${JSON.stringify(dropKeys(json))};\n`;
};

export function buildProductionSpikes(src: string, out: string): void {
  cpSync(src, out, { recursive: true });
  for (const path of files(out).filter((p) => p.endsWith(".html"))) writeFileSync(path, stripOriginals(readFileSync(path, "utf8")));
  writeFileSync(join(out, "shared/originals.js"), ORIGINALS_OFF);
  const config = join(out, "shared/config.js");
  writeFileSync(config, productionConfig(readFileSync(config, "utf8")));
  const leaks = files(out).filter((p) => readFileSync(p, "utf8").includes(FORBIDDEN));
  if (leaks.length) throw new Error(`original game resources referenced in production spikes: ${leaks.map((p) => relative(out, p)).join(", ")}`);
}
