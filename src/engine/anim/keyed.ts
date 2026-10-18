export type Keys = [number, Record<string, number>][];
type Easing = (k: number) => number;

export const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
export const ease: Easing = k => k * k * (3 - 2 * k);
export const easeIn: Easing = k => k * k;
export const easeOut: Easing = k => 1 - (1 - k) * (1 - k);
export const span = (t: number, a: number, b: number): number => clamp((t - a) / (b - a));

export const mix = (a: Record<string, number>, b: Record<string, number>, k: number): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const n of new Set([...Object.keys(a), ...Object.keys(b)])) out[n] = (a[n] || 0) + ((b[n] || 0) - (a[n] || 0)) * k;
  return out;
};

export const keyed = (keys: Keys, t: number, fn: Easing = ease): Record<string, number> => {
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) return {};
  if (t <= first[0]) return { ...first[1] };
  for (let i = 1; i < keys.length; i++) {
    const [t0, p0] = keys[i - 1]!;
    const [t1, p1] = keys[i]!;
    if (t > t1) continue;
    return mix(p0, p1, fn((t - t0) / (t1 - t0)));
  }
  return { ...last[1] };
};

export const num = (keys: [number, number][], t: number, fn: Easing = ease): number =>
  keyed(keys.map(([a, v]): [number, Record<string, number>] => [a, { v }]), t, fn).v ?? 0;
