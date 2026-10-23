import { useState } from "react";
import { CUTSCENE_IDS, type CutsceneId } from "../../game/cutscene";
import { useSandbox } from "../store";
import { Button, Section, styles, type SandboxCommands } from "./Panel";

const FILMS = [...CUTSCENE_IDS].sort((a, b) => a.localeCompare(b));

export function Films({ commands }: { commands: SandboxCommands }) {
  const [film, setFilm] = useState<CutsceneId>(FILMS[0]!);
  const locked = useSandbox((s) => s.recording || s.playing);
  return (
    <Section title="Films">
      <div style={styles.row}>
        <select value={film} disabled={locked} onChange={(e) => setFilm(e.target.value as CutsceneId)} style={{ ...styles.input, width: "auto", flex: 1 }}>
          {FILMS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <Button disabled={locked} onClick={() => commands.playFilm(film)}>
          Play
        </Button>
      </div>
    </Section>
  );
}
