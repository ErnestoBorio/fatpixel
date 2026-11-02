import {
  Graphic,
  depthFromBpp,
  type Bpp,
  type PixelAspectRatio,
  type PixelMode,
} from './graphic';
import { DEFAULT_PALETTE_ID } from './palette';

export interface CsvImportOptions {
  name?: string;
  paletteId?: string;
  pixelAspectRatio?: PixelAspectRatio;
  bpp?: Bpp;
}

/**
 * Parses comma-separated decimal pixel values into a Graphic (Sprite or Charset).
 *
 * Supports:
 * 1. Sequential ROM order Charsets (all scanlines for Char 0, then Char 1, ...,
 *    with 1 value per pixel, e.g. 2048 lines of 8 values for a 256-char 8x8 font).
 * 2. petscii.krissz.hu packed 1bpp byte format (e.g. 256 lines of 8 byte values).
 * 3. Standard 2D Sprite pixel grids (e.g. 160x200 or custom width x height).
 */
export function parseCsvToGraphic(
  csvText: string,
  options?: CsvImportOptions
): Graphic {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) {
    throw new Error('CSV content is empty');
  }

  const rawRows: number[][] = [];
  let maxVal = 0;

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i]
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    if (parts.length === 0) continue;
    const rowVals = parts.map((v) => {
      const n = parseInt(v, 10);
      return isNaN(n) ? 0 : Math.max(0, n);
    });
    for (const val of rowVals) {
      if (val > maxVal) maxVal = val;
    }
    rawRows.push(rowVals);
  }

  if (rawRows.length === 0 || rawRows[0].length === 0) {
    throw new Error('Invalid CSV: first row has 0 columns');
  }

  const numRows = rawRows.length;
  const numCols = rawRows[0].length;
  const name = options?.name ?? 'imported_graphic';

  // Detection 1: petscii.hu packed 1bpp bytes format (256 or 128 rows x 8 cols with byte values > 1)
  // Each line is a character with 8 byte values (each byte packs 8 pixels MSB-first)
  if (numCols === 8 && (numRows === 256 || numRows === 128) && maxVal > 1) {
    const charCount = numRows;
    const charWidth = 8;
    const charHeight = 8;
    const columns = 16;
    const g = Graphic.newCharset(name, charWidth, charHeight, charCount, columns);
    g.bpp = 1;
    g.depth = 2;
    g.palette = { kind: 'builtin', id: options?.paletteId ?? DEFAULT_PALETTE_ID };
    g.slots = [0, 1];

    for (let c = 0; c < charCount; c++) {
      const row = rawRows[c];
      for (let ly = 0; ly < 8; ly++) {
        const byteVal = ly < row.length ? row[ly] : 0;
        for (let lx = 0; lx < 8; lx++) {
          const bit = (byteVal >> (7 - lx)) & 1;
          g.setCharPixel(c, lx, ly, bit);
        }
      }
    }
    return g;
  }

  // Detection 2: Sequential unpacked Charset format (one value per pixel, sequence like ROMs: Char 0 row 0..ch-1, Char 1 row 0..ch-1, ...)
  // Criteria: 8 columns wide and rows count is a multiple of 8, with at least 64 rows (8 characters)
  if (numCols === 8 && numRows >= 64 && numRows % 8 === 0) {
    const charWidth = 8;
    const charHeight = 8;
    const charCount = numRows / 8;
    const columns = 16;
    const g = Graphic.newCharset(name, charWidth, charHeight, charCount, columns);

    let bpp: Bpp = options?.bpp ?? 1;
    if (!options?.bpp) {
      if (maxVal > 15) bpp = 8;
      else if (maxVal > 7) bpp = 4;
      else if (maxVal > 3) bpp = 3;
      else if (maxVal > 1) bpp = 2;
      else bpp = 1;
    }
    const depth = depthFromBpp(bpp);
    const paletteId =
      options?.paletteId ?? (bpp === 8 || maxVal > 16 ? 'vga-256' : DEFAULT_PALETTE_ID);

    g.bpp = bpp;
    g.depth = depth;
    g.palette = { kind: 'builtin', id: paletteId };
    g.slots = Array.from({ length: depth }, (_, i) => i);

    for (let c = 0; c < charCount; c++) {
      for (let ly = 0; ly < charHeight; ly++) {
        const lineIdx = c * charHeight + ly;
        const row = rawRows[lineIdx];
        for (let lx = 0; lx < charWidth; lx++) {
          const val = lx < row.length ? row[lx] : 0;
          g.setCharPixel(c, lx, ly, val);
        }
      }
    }
    return g;
  }

  // Detection 3: Standard Sprite (2D pixel grid)
  const width = numCols;
  const height = numRows;
  const totalPixels = width * height;
  const pixels = new Uint8Array(totalPixels);

  for (let y = 0; y < height; y++) {
    const row = rawRows[y];
    for (let x = 0; x < width; x++) {
      const v = x < row.length ? row[x] : 0;
      pixels[y * width + x] = Math.max(0, Math.min(255, v));
    }
  }

  let bpp: Bpp = options?.bpp ?? 1;
  if (!options?.bpp) {
    if (maxVal > 15) bpp = 8;
    else if (maxVal > 7) bpp = 4;
    else if (maxVal > 3) bpp = 3;
    else if (maxVal > 1) bpp = 2;
    else bpp = 1;
  }
  const depth = depthFromBpp(bpp);

  let aspect: PixelAspectRatio = options?.pixelAspectRatio ?? '1:1';
  if (!options?.pixelAspectRatio && width === 160 && height === 200) {
    aspect = '2:1';
  }
  const pixelMode: PixelMode = aspect === '2:1' ? 'wide' : 'hires';
  const paletteId =
    options?.paletteId ?? (bpp === 8 || maxVal > 16 ? 'vga-256' : DEFAULT_PALETTE_ID);

  const slots = Array.from({ length: depth }, (_, i) => i);

  return new Graphic(
    name,
    { kind: 'sprite' },
    width,
    height,
    depth,
    pixelMode,
    { kind: 'builtin', id: paletteId },
    slots,
    0,
    pixels
  );
}

/**
 * Loads a File object as a Graphic (Sprite or Charset) from its CSV text content.
 */
export async function loadCsvGraphic(
  file: File,
  options?: CsvImportOptions
): Promise<Graphic> {
  const text = await file.text();
  const name = options?.name ?? file.name.replace(/\.[^/.]+$/, '');
  return parseCsvToGraphic(text, { ...options, name });
}

// Backward-compatible alias
export const loadCsvAsSprite = loadCsvGraphic;
