export type Mat2D = { a: number; b: number; c: number; d: number; e: number; f: number };

export const identity = (): Mat2D => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });

export const multiply = (m: Mat2D, n: Mat2D): Mat2D => ({
  a: m.a * n.a + m.c * n.b,
  b: m.b * n.a + m.d * n.b,
  c: m.a * n.c + m.c * n.d,
  d: m.b * n.c + m.d * n.d,
  e: m.a * n.e + m.c * n.f + m.e,
  f: m.b * n.e + m.d * n.f + m.f,
});

export const translate = (m: Mat2D, x: number, y: number): Mat2D => multiply(m, { a: 1, b: 0, c: 0, d: 1, e: x, f: y });

export const rotate = (m: Mat2D, deg: number): Mat2D => {
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return multiply(m, { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 });
};

export const scale = (m: Mat2D, sx: number, sy: number): Mat2D => multiply(m, { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 });

export const apply = (m: Mat2D, [x, y]: [number, number]): [number, number] => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];

export const determinant = (m: Mat2D): number => m.a * m.d - m.b * m.c;

export const parseTransform = (s: string | null): Mat2D => {
  let m = identity();
  if (!s) return m;
  for (const [, op, raw = ""] of s.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const v = raw.trim().split(/[\s,]+/).map(Number);
    const first = v[0] ?? 0;
    if (op === "translate") m = translate(m, first, v[1] || 0);
    else if (op === "scale") m = scale(m, first, v[1] ?? first);
    else if (op === "rotate") {
      const cx = v[1] || 0;
      const cy = v[2] || 0;
      m = translate(rotate(translate(m, cx, cy), first), -cx, -cy);
    }
  }
  return m;
};
