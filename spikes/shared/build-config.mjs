import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = p => JSON.parse(readFileSync(join(root, p), "utf8"));
const config = {
  robots: { xbot: read("config/robots/xbot.json") },
  cutscenes: { crowbarDoor: read("config/cutscenes/crowbar-door.json") }
};
const out = join(root, "spikes/shared/config.js");
writeFileSync(out, `window.C28_CONFIG = ${JSON.stringify(config, null, 1)};\n`);
console.log("wrote", out);
