import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { build } from "rolldown";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ENTRY = "\0c28-sounds";
const entry = {
  name: "c28-sounds",
  resolveId: id => (id === ENTRY ? id : null),
  load: id => (id === ENTRY ? `export { SOUNDS } from ${JSON.stringify(join(root, "src/game/sound/index.ts"))};\nexport { BASE_RATE } from ${JSON.stringify(join(root, "src/engine/audio/synth.ts"))};\n` : null)
};
const { output } = await build({
  input: ENTRY,
  plugins: [entry],
  write: false,
  output: { format: "iife", name: "C28_SOUNDS" }
});
const out = join(root, "spikes/shared/sounds.js");
writeFileSync(out, output[0].code);
console.log("wrote", out);
