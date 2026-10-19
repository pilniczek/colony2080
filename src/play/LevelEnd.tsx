import { useSandbox } from "../sandbox/store";
import { Caption } from "./Subtitle";

const LINK_SCALE = 0.7;

export function LevelEnd() {
  const complete = useSandbox((s) => s.complete);
  if (!complete) return null;
  return (
    <Caption>
      <div>Level complete</div>
      <a href="index.html" style={{ color: "inherit", fontSize: `${LINK_SCALE}em`, pointerEvents: "auto" }}>
        Back to mission select
      </a>
    </Caption>
  );
}
