export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** progresso 0..1 de t entre a e b */
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
/** fade-in em [a, a+fi] e fade-out em [b-fo, b] */
export const window = (t: number, a: number, b: number, fi = 0.4, fo = 0.4) =>
  smooth(seg(t, a, a + fi)) * (1 - smooth(seg(t, b - fo, b)));
