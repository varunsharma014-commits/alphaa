// Minimal types for opentype.js (only what lib/social-card.ts uses).
declare module "opentype.js" {
  export interface Path { toPathData(decimals?: number): string }
  export interface Glyph { index: number }
  export interface Font {
    getPath(text: string, x: number, y: number, fontSize: number): Path
    getAdvanceWidth(text: string, fontSize: number): number
    charToGlyph(ch: string): Glyph
  }
  export function parse(buffer: ArrayBuffer): Font
  const opentype: { parse: typeof parse }
  export default opentype
}
