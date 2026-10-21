import { useState } from "react";
import { CHEATS } from "../../game/cheats";
import { useSandbox } from "../store";
import { Button, Section, styles, type SandboxCommands } from "./Panel";

const TOGGLES = CHEATS.filter((c) => c.cheat);
const MOVE_TO = CHEATS.find((c) => !c.cheat);

export function Cheats({ commands }: { commands: SandboxCommands }) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const locked = useSandbox((s) => s.recording || s.playing);
  return (
    <Section title="Cheats">
      <div style={styles.row}>
        {TOGGLES.map(({ code, effect }) => (
          <Button key={code} title={effect} disabled={locked} onClick={() => commands.cheat(code)}>
            {code}
          </Button>
        ))}
      </div>
      <div style={styles.row} title={MOVE_TO?.effect}>
        x <input type="number" value={x} disabled={locked} onChange={(e) => setX(Number(e.target.value))} style={{ ...styles.input, width: 50 }} />
        y <input type="number" value={y} disabled={locked} onChange={(e) => setY(Number(e.target.value))} style={{ ...styles.input, width: 50 }} />
        <Button disabled={locked} onClick={() => commands.cheat(`moveto(${x},${y})`)}>
          moveto
        </Button>
      </div>
    </Section>
  );
}
