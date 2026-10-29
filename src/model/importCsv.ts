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
 * Parses comma-separated decimal pixel values into a Graphic sprite.
 * Detects dimensions from the number of columns and rows.
 * Automatically determines BPP and palette based on the maximum pixel index.
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

  const height = lines.length;
  const row0 = lines[0].split(',').map((v) => parseInt(v.trim(), 10));
  const width = row0.length;
  if (width === 0) {
    throw new Error('Invalid CSV: first row has 0 columns');
  }

  const totalPixels = width * height;
  const pixels = new Uint8Array(totalPixels);
  let maxVal = 0;

  for (let y = 0; y < height; y++) {
    const vals = lines[y].split(',');
    for (let x = 0; x < width; x++) {
      const v = x < vals.length ? parseInt(vals[x].trim(), 10) : 0;
      const num = isNaN(v) ? 0 : Math.max(0, Math.min(255, v));
      pixels[y * width + x] = num;
      if (num > maxVal) maxVal = num;
    }
  }

  // Determine BPP and Depth
  let bpp: Bpp = options?.bpp ?? 1;
  if (!options?.bpp) {
    if (maxVal > 15) bpp = 8;
    else if (maxVal > 7) bpp = 4;
    else if (maxVal > 3) bpp = 3;
    else if (maxVal > 1) bpp = 2;
    else bpp = 1;
  }
  const depth = depthFromBpp(bpp);

  // Aspect ratio: if 160x200 or explicitly specified, use 2:1
  let aspect: PixelAspectRatio = options?.pixelAspectRatio ?? '1:1';
  if (!options?.pixelAspectRatio) {
    if (width === 160 && height === 200) {
      aspect = '2:1';
    }
  }
  const pixelMode: PixelMode = aspect === '2:1' ? 'wide' : 'hires';

  // Palette: default to vga-256 for 8bpp, otherwise default c64-pepto
  const paletteId =
    options?.paletteId ?? (bpp === 8 || maxVal > 16 ? 'vga-256' : DEFAULT_PALETTE_ID);

  const slots = Array.from({ length: depth }, (_, i) => i);
  const name = options?.name ?? 'imported_sprite';

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
 * Loads a File object as a Graphic sprite from its CSV text content.
 */
export async function loadCsvAsSprite(
  file: File,
  options?: CsvImportOptions
): Promise<Graphic> {
  const text = await file.text();
  const name = options?.name ?? file.name.replace(/\.[^/.]+$/, '');
  return parseCsvToGraphic(text, { ...options, name });
}
