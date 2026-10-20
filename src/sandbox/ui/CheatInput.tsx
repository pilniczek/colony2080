import { viewRect } from "../../game/hud/layout";
import { SUBTITLE_STYLE } from "../../play/Subtitle";
import { useSandbox } from "../store";

const WIDTH_SHARE = 0.4;
const FONT_UNITS = 7;

export function CheatInput({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const open = useSandbox((s) => s.cheatOpen);
  const fit = useSandbox((s) => s.hud);
  if (!open) return null;
  const r = viewRect(fit);
  const w = r.w * WIDTH_SHARE;
  return (
    <input
      autoFocus
      spellCheck={false}
      autoComplete="off"
      onBlur={onClose}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") onCode(e.currentTarget.value);
        else if (e.key === "Escape") onClose();
        else return;
        e.preventDefault();
      }}
      style={{
        ...SUBTITLE_STYLE,
        position: "absolute",
        left: r.x + (r.w - w) / 2,
        top: r.y + r.h / 2,
        width: w,
        transform: "translateY(-50%)",
        fontSize: FONT_UNITS * fit.unit,
        background: "#000c",
        border: "1px solid #ffd84a",
        outline: "none",
        padding: "2px 8px",
        boxSizing: "border-box",
      }}
    />
  );
}
