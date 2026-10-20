import type { Cutscene, CutsceneId } from "./index";

export interface FilmConfig {
  camera: string;
  duration: number;
}

export const placeholder = (id: CutsceneId, config: FilmConfig): Cutscene => ({
  id,
  duration: config.duration,
  camera: config.camera,
  render(ctx, w, h) {
    ctx.fillStyle = "#101418";
    ctx.fillRect(0, 0, w, h);
  },
});
