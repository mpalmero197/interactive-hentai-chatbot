export function hexToNum(hex: string): number {
  const clean = hex.replace("#", "").trim();
  const n = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return Number.isFinite(n) ? n : 0xf0c4ae;
}

export function shade(color: number, factor: number): number {
  const r = Math.min(255, Math.max(0, Math.round(((color >> 16) & 255) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((color >> 8) & 255) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((color & 255) * factor)));
  return (r << 16) | (g << 8) | b;
}

export function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
