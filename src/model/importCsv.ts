import {
  Graphic,
  depthFromBpp,
  type Bpp,
  type PixelAspectRatio,
  type PixelMode,
} from './graphic';
import { BUILTIN_PALETTES, DEFAULT_PALETTE_ID } from './palette';

export interface CsvImportOptions {
  name?: string;
  paletteId?: string;
  pixelAspectRatio?: PixelAspectRatio;
  bpp?: Bpp;
}

export interface FatpixelCsvHeader {
  kind: 'charset' | 'sprite';
  name: string;
  width: number;
  height: number;
  bpp: Bpp;
  pixelAspectRatio: PixelAspectRatio;
  paletteId: string;
}

/**
 * Parses the `# Fatpixel; ...` metadata header line if present.
 * Format:
 * # Fatpixel; <kind>; <name>; <size>; <bpp>; <aspect_ratio>; <palette_name>
 */
export function parseFatpixelCsvHeader(line: string): FatpixelCsvHeader | null {
  const trimmed = line.trim();
  if (!trimmed.toLowerCase().startsWith('# fatpixel;')) {
    return null;
  }
  const parts = trimmed.substring(1).split(';').map((s) => s.trim());
  if (parts.length < 7) {
    return null;
  }

  const kind = parts[1].toLowerCase() === 'charset' ? 'charset' : 'sprite';
  const name = parts[2] || 'imported_graphic';

  const sizeParts = parts[3].toLowerCase().split('x');
  const width = parseInt(sizeParts[0], 10) || 8;
  const height = parseInt(sizeParts[1], 10) || width;

  const bppNum = parseInt(parts[4].replace(/bpp/i, ''), 10);
  const bpp: Bpp = ([1, 2, 3, 4, 8].includes(bppNum) ? bppNum : 1) as Bpp;

  const pixelAspectRatio: PixelAspectRatio = parts[5].trim() === '2:1' ? '2:1' : '1:1';

  const palStr = parts[6].trim().toLowerCase();
  const foundPal = BUILTIN_PALETTES.find(
    (p) => p.name.toLowerCase() === palStr || p.id.toLowerCase() === palStr
  );
  const paletteId = foundPal ? foundPal.id : DEFAULT_PALETTE_ID;

  return {
    kind,
    name,
    width,
    height,
    bpp,
    pixelAspectRatio,
    paletteId,
  };
}

/**
 * Parses comma-separated decimal pixel values into a Graphic (Sprite or Charset).
 *
 * If the first line contains a `# Fatpixel; ...` header, it is used to determine
 * the graphic kind (sprite/charset), name, dimensions, bpp, aspect ratio, and palette.
 *
 * If no header is present, it falls back to automatic detection:
 * 1. petscii.krissz.hu packed 1bpp bytes (256 lines x 8 bytes).
 * 2. Sequential ROM order Charsets (multiple of 8 scanlines with 8 columns).
 * 3. Standard 2D Sprite pixel grids.
 */
export function parseCsvToGraphic(
  csvText: string,
  options?: CsvImportOptions
): Graphic {
  const allLines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (allLines.length === 0) {
    throw new Error('CSV content is empty');
  }

  // Look for # Fatpixel header in comment lines
  let header: FatpixelCsvHeader | null = null;
  for (const line of allLines) {
    if (line.startsWith('#')) {
      header = parseFatpixelCsvHeader(line);
      if (header) break;
    } else {
      break;
    }
  }

  // Filter data lines (skipping comments)
  const dataLines = allLines.filter((l) => !l.startsWith('#'));
  if (dataLines.length === 0) {
    throw new Error('CSV contains no data rows');
  }

  const rawRows: number[][] = [];
  let maxVal = 0;

  for (let i = 0; i < dataLines.length; i++) {
    const parts = dataLines[i]
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

  // ----------------------------------------------------
  // Path A: Use # Fatpixel header metadata if present
  // ----------------------------------------------------
  if (header) {
    const name = options?.name ?? header.name;
    const bpp = options?.bpp ?? header.bpp;
    const depth = depthFromBpp(bpp);
    const aspect = options?.pixelAspectRatio ?? header.pixelAspectRatio;
    const paletteId = options?.paletteId ?? header.paletteId;
    const slots = Array.from({ length: depth }, (_, i) => i);

    if (header.kind === 'charset') {
      const charWidth = header.width;
      const charHeight = header.height;
      const charCount = Math.max(1, Math.floor(numRows / charHeight));
      const columns = 16;
      const g = Graphic.newCharset(name, charWidth, charHeight, charCount, columns);
      g.bpp = bpp;
      g.depth = depth;
      g.pixelAspectRatio = aspect;
      g.palette = { kind: 'builtin', id: paletteId };
      g.slots = slots;

      for (let c = 0; c < charCount; c++) {
        for (let ly = 0; ly < charHeight; ly++) {
          const lineIdx = c * charHeight + ly;
          const row = rawRows[lineIdx] ?? [];
          for (let lx = 0; lx < charWidth; lx++) {
            const val = lx < row.length ? row[lx] : 0;
            g.setCharPixel(c, lx, ly, val);
          }
        }
      }
      return g;
    } else {
      // Sprite
      const width = header.width;
      const height = header.height;
      const pixelMode: PixelMode = aspect === '2:1' ? 'wide' : 'hires';
      const pixels = new Uint8Array(width * height);

      for (let y = 0; y < Math.min(height, numRows); y++) {
        const row = rawRows[y];
        for (let x = 0; x < Math.min(width, numCols); x++) {
          const v = x < row.length ? row[x] : 0;
          pixels[y * width + x] = Math.max(0, Math.min(255, v));
        }
      }

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
  }

  // ----------------------------------------------------
  // Path B: Fallback heuristics when no header is present
  // ----------------------------------------------------
  const name = options?.name ?? 'imported_graphic';

  // Detection 1: petscii.hu packed 1bpp bytes format (256 or 128 rows x 8 cols with byte values > 1)
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

  // Detection 2: Sequential unpacked Charset format (8 columns wide and rows multiple of 8, >= 64 rows)
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
