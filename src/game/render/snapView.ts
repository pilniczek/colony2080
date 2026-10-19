import type { ViewTransform } from "../../engine/render/view";

export const snapView = (v: ViewTransform): ViewTransform => ({
  ...v,
  offsetX: Math.round(v.offsetX),
  offsetY: Math.round(v.offsetY),
});
