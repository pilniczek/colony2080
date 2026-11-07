import { P, type EnvAsset } from "./paint";

export const HEALTH_BAR = { segments: 7, w: 24, h: 4, pad: 1, gap: 0.6, lift: 3 };

export const healthBar: EnvAsset = {
  id: "healthBar",
  box: [-HEALTH_BAR.w / 2 - 1, -HEALTH_BAR.h - 1, HEALTH_BAR.w + 2, HEALTH_BAR.h + 2],
  draw(ctx, state) {
    const { segments, w, h, pad, gap } = HEALTH_BAR;
    const left = Math.max(0, Math.min(segments, state));
    const fill = left > segments / 2 ? "acid" : left > segments / 4 ? "y2" : "a1";
    const seg = (w - 2 * pad - (segments - 1) * gap) / segments;
    P.flat(ctx, -w / 2, -h, w, h, "k0", "kLine");
    for (let i = 0; i < segments; i++) P.flat(ctx, -w / 2 + pad + i * (seg + gap), -h + pad, seg, h - 2 * pad, i < left ? fill : "k1");
  },
};
