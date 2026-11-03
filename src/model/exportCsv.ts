import type { Graphic } from './graphic';
import { BUILTIN_PALETTES } from './palette';

/**
 * Formats the standard FatPixel metadata header for CSV exports.
 * Format:
 * # Fatpixel; <kind>; <name>; <size>; <bpp>; <aspect_ratio>; <palette_name>
 *
 * Examples:
 * # Fatpixel; charset; PETSCII; 8x8; 1bpp; 1:1; Drean 64
 * # Fatpixel; sprite; Dragon; 24x21; 2bpp; 2:1; Commodore 64
 */
export function formatFatpixelCsvHeader(graphic: Graphic): string {
  const kind = graphic.isCharset() ? 'charset' : 'sprite';
  const name = graphic.name;
  const size = `${graphic.width}x${graphic.height}`;
  const bpp = `${graphic.bpp}bpp`;
  const aspect = graphic.pixelAspectRatio;

  let paletteName = 'Commodore 64';
  if (graphic.palette.kind === 'builtin') {
    const found = BUILTIN_PALETTES.find((p) => p.id === graphic.palette.id);
    paletteName = found ? found.name : graphic.palette.id;
  } else {
    paletteName = 'Custom';
  }

  return `# Fatpixel; ${kind}; ${name}; ${size}; ${bpp}; ${aspect}; ${paletteName}`;
}

/**
 * Exports a Graphic (Sprite or Charset) to CSV string format.
 *
 * Includes the `# Fatpixel; ...` metadata header on the first line.
 * - For Sprites: Row-by-row across sprite width x height, 1 decimal slot index per pixel.
 * - For Charsets: Sequential ROM order (Char 0 row 0..ch-1, then Char 1 row 0..ch-1, ..., Char N).
 *   Each line contains `charWidth` (e.g. 8) decimal palette slot indices.
 */
export function exportGraphicToCsv(graphic: Graphic): string {
  const header = formatFatpixelCsvHeader(graphic) + '\n';

  if (graphic.isCharset()) {
    const info = graphic.charsetInfo();
    const charCount = info ? info.charCount : 256;
    const cw = graphic.width;
    const ch = graphic.height;
    let csv = header;
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
  let csv = header;
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      row.push(graphic.get(x, y) ?? 0);
    }
    csv += row.join(',') + '\n';
  }
  return csv;
}
