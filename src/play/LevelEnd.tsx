import { tr } from "../game/i18n";
import { useSandbox } from "../sandbox/store";
import { Caption } from "./Subtitle";

const LINK_SCALE = 0.7;

export function LevelEnd() {
  const complete = useSandbox((s) => s.complete);
  const text = useSandbox((s) => s.subtitle);
  const filming = useSandbox((s) => s.cutscene);
  const lang = useSandbox((s) => s.lang);
  if (!complete || filming) return null;
  return (
    <Caption>
      {text && <div>{tr(text, lang)}</div>}
      <a href="index.html" style={{ color: "inherit", fontSize: `${LINK_SCALE}em`, pointerEvents: "auto" }}>
        {tr("Back to mission select", lang)}
      </a>
    </Caption>
  );
}
