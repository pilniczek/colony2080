import type { CSSProperties, ReactNode } from "react";
import { viewRect } from "../game/hud/layout";
import { tr } from "../game/i18n";
import { useSandbox } from "../sandbox/store";

const BOTTOM_SHARE = 0.08;
const FONT_UNITS = 6;

export const SUBTITLE_STYLE: CSSProperties = {
  color: "#ffd84a",
  fontFamily: '"Share Tech Mono", Oxanium, ui-monospace, monospace',
  textShadow: "0 0 4px #000, 0 2px 3px #000, 0 0 10px #000c",
  textAlign: "center",
  lineHeight: 1.3,
};

export function Caption({ children, opacity = 1 }: { children: ReactNode; opacity?: number }) {
  const fit = useSandbox((s) => s.hud);
  const r = viewRect(fit);
  return (
    <div
      style={{
        ...SUBTITLE_STYLE,
        position: "absolute",
        left: r.x,
        width: r.w,
        bottom: `calc(100% - ${r.y + r.h * (1 - BOTTOM_SHARE)}px)`,
        fontSize: FONT_UNITS * fit.unit,
        padding: "0 16px",
        boxSizing: "border-box",
        opacity,
      }}
    >
      {children}
    </div>
  );
}

export function Subtitle() {
  const text = useSandbox((s) => s.subtitle);
  const note = useSandbox((s) => s.subtitleNote);
  const lang = useSandbox((s) => s.lang);
  const opacity = useSandbox((s) => s.subtitleOpacity);
  const complete = useSandbox((s) => s.complete);
  const filming = useSandbox((s) => s.cutscene);
  const caption = useSandbox((s) => s.subtitleFilm);
  if ((!text && !note) || complete || (filming && !caption)) return null;
  return (
    <Caption opacity={opacity}>
      {text && <div>{tr(text, lang)}</div>}
      {note && <div>{tr(note, lang)}</div>}
    </Caption>
  );
}
