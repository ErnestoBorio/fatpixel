import { Graphic } from './graphic';
import { VGA_256_COLORS, type Rgb } from './palette';

/**
 * Finds the closest color index in the VGA palette (1..255) using perceptual RGB distance.
 * Index 0 is skipped so it remains available for transparency.
 */
export function findClosestVgaColorIndex(
  r: number,
  g: number,
  b: number,
  palette: Rgb[] = VGA_256_COLORS
): number {
  let bestDist = Infinity;
  let bestIndex = 16; // default black fallback in VGA 6x6x6 cube

  for (let i = 1; i < palette.length; i++) {
    const pal = palette[i];
    const dr = r - pal.r;
    const dg = g - pal.g;
    const db = b - pal.b;
    const rBar = (r + pal.r) * 0.5;
    // Redmean color distance approximation
    const dist = (2 + rBar / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rBar) / 256) * db * db;

    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
      if (dist === 0) break;
    }
  }

  return bestIndex;
}

/**
 * Creates an 8bpp Graphic sprite from raw RGBA pixel data, adapting all colors
 * to the VGA 256 palette.
 */
export function createGraphicFromRgba(
  name: string,
  width: number,
  height: number,
  rgbaData: Uint8ClampedArray | Uint8Array,
  palette: Rgb[] = VGA_256_COLORS
): Graphic {
  const totalPixels = width * height;
  const pixels = new Uint8Array(totalPixels);
  let hasTransparency = false;

  const colorCache = new Map<number, number>();

  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4;
    const r = rgbaData[offset];
    const g = rgbaData[offset + 1];
    const b = rgbaData[offset + 2];
    const a = rgbaData[offset + 3];

    if (a < 128) {
      hasTransparency = true;
      pixels[i] = 0;
    } else {
      const key = (r << 16) | (g << 8) | b;
      let vgaIdx = colorCache.get(key);
      if (vgaIdx === undefined) {
        vgaIdx = findClosestVgaColorIndex(r, g, b, palette);
        colorCache.set(key, vgaIdx);
      }
      pixels[i] = vgaIdx;
    }
  }

  return new Graphic(
    name,
    { kind: 'sprite' },
    width,
    height,
    256, // 8bpp
    'hires', // 1:1 aspect ratio
    { kind: 'builtin', id: 'vga-256' },
    [], // 8bpp uses empty slots (direct palette index)
    hasTransparency ? 0 : null,
    pixels
  );
}

/**
 * Reads a PNG File in the browser, draws it to an offscreen canvas,
 * and creates an 8bpp VGA Graphic sprite.
 */
export function loadPngAsSprite(file: File): Promise<Graphic> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Failed to decode image'));
      };

      img.onload = () => {
        try {
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;
          if (width <= 0 || height <= 0) {
            reject(new Error('Invalid image dimensions'));
            return;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get 2d context for image import'));
            return;
          }

          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, width, height);

          const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Imported Sprite';
          const sprite = createGraphicFromRgba(cleanName, width, height, imgData.data);
          resolve(sprite);
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
