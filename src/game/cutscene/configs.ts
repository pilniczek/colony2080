const FILES = import.meta.glob<Record<string, unknown>>("../../../config/cutscenes/*.json", { eager: true, import: "default" });

const idOf = (path: string): string => path.slice(path.lastIndexOf("/") + 1, -".json".length).replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

export const FILM_CONFIGS = new Map(Object.entries(FILES).map(([path, config]) => [idOf(path), config]));
