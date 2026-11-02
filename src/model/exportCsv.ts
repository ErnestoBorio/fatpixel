import type { Graphic } from './graphic';

/**
 * Exports a Graphic (Sprite or Charset) to CSV string format.
 *
 * - For Sprites: Row-by-row (y = 0..height-1) across the full width,
 *   with one decimal palette slot index per pixel.
 * - For Charsets: Sequential ROM order (all scanlines for Char 0,
 *   then Char 1, ..., Char N). Each line contains `charWidth` (e.g. 8)
 *   decimal palette slot indices.
 */
export function exportGraphicToCsv(graphic: Graphic): string {
  if (graphic.isCharset()) {
    const info = graphic.charsetInfo();
    const charCount = info ? info.charCount : 256;
    const cw = graphic.width;
    const ch = graphic.height;
    let csv = '';
    for (let c = 0; c < charCount; c++) {
      for (let ly = 0; ly < ch; ly++) {
        const row: number[] = [];
        for (let lx = 0; lx < cw; lx++) {
          row.push(graphic.getCharPixel(c, lx, ly) ?? 0);
        }
        csv += row.join(',') + '\n';
      }
    }
    return csv;
  }

  // Generic sprite: row by row across width and height
  const w = graphic.sheetWidth();
  const h = graphic.sheetHeight();
  let csv = '';
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      row.push(graphic.get(x, y) ?? 0);
    }
    csv += row.join(',') + '\n';
  }
  return csv;
}
