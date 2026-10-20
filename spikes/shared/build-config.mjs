import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = p => JSON.parse(readFileSync(join(root, p), "utf8"));
const levelFile = (id, name) => `config/levels/${id}/${name}.json`;
const levels = Object.fromEntries(
  readdirSync(join(root, "config/levels"), { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(root, levelFile(d.name, "objects"))))
    .map(({ name: id }) => {
      const { order, name } = read(levelFile(id, "level"));
      return [id, { order, name: name.en, objects: read(levelFile(id, "objects")) }];
    })
);
const config = {
  items: read("config/items.json").items,
  robots: { xbot: read("config/robots/xbot.json") },
  cutscenes: Object.fromEntries(
    readdirSync(join(root, "config/cutscenes"))
      .filter(f => f.endsWith(".json"))
      .map(f => [f.slice(0, -5).replace(/-(\w)/g, (_, c) => c.toUpperCase()), read(`config/cutscenes/${f}`)])
  ),
  levels
};
const out = join(root, "spikes/shared/config.js");
writeFileSync(out, `window.C28_CONFIG = ${JSON.stringify(config, null, 1)};\n`);
console.log("wrote", out);
