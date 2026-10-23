import { useState } from "react";
import { filmsOf, type CutsceneId } from "../../game/cutscene";
import { MISSIONS, type MissionId } from "../../game/level/missionIds";
import { useSandbox } from "../store";
import { Button, Section, styles, type SandboxCommands } from "./Panel";

const sorted = (mission: MissionId): CutsceneId[] => filmsOf(mission).sort((a, b) => a.localeCompare(b));

const options = (ids: CutsceneId[]) =>
  ids.map((id) => (
    <option key={id} value={id}>
      {id}
    </option>
  ));

export function Films({ commands, mission }: { commands: SandboxCommands; mission?: MissionId }) {
  const groups = MISSIONS.filter((id) => mission === undefined || id === mission)
    .map((id) => [id, sorted(id)] as const)
    .filter(([, ids]) => ids.length > 0);
  const [film, setFilm] = useState<CutsceneId | undefined>(groups[0]?.[1][0]);
  const locked = useSandbox((s) => s.recording || s.playing);
  if (!film) return null;
  return (
    <Section title="Films">
      <div style={styles.row}>
        <select value={film} disabled={locked} onChange={(e) => setFilm(e.target.value as CutsceneId)} style={{ ...styles.input, width: "auto", flex: 1 }}>
          {mission ? options(groups[0]![1]) : groups.map(([id, ids]) => <optgroup key={id} label={id}>{options(ids)}</optgroup>)}
        </select>
        <Button disabled={locked} onClick={() => commands.playFilm(film)}>
          Play
        </Button>
      </div>
    </Section>
  );
}
