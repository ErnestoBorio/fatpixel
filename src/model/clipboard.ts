import type { Graphic, ColorDepth, PixelMode } from './graphic';
import { defaultPalette, type Palette, type Rgb } from './palette';
import { slotColor } from './render';

export interface ClipboardItem {
  width: number;
  height: number;
  depth: ColorDepth;
  pixelMode: PixelMode;
  pixels: Uint8Array;
  rgbColors?: Rgb[];
  transparentSlot?: number | null;
}

let memoryClipboard: ClipboardItem | null = null;

export function getMemoryClipboard(): ClipboardItem | null {
  return memoryClipboard
    ? {
        ...memoryClipboard,
        pixels: new Uint8Array(memoryClipboard.pixels),
        rgbColors: memoryClipboard.rgbColors ? [...memoryClipboard.rgbColors] : undefined,
      }
    : null;
}

export function setMemoryClipboard(item: ClipboardItem | null): void {
  memoryClipboard = item
    ? {
        ...item,
        pixels: new Uint8Array(item.pixels),
        rgbColors: item.rgbColors ? [...item.rgbColors] : undefined,
      }
    : null;
}

/**
 * Computes perceptual color distance between two RGB colors using Redmean approximation.
 */
export function colorDistance(c1: Rgb, c2: Rgb): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  const rBar = (c1.r + c2.r) * 0.5;
  return (2 + rBar / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rBar) / 256) * db * db;
}

/**
 * Copies pixels from a graphic or an active rectangular selection into the clipboard.
 */
export function copyFromGraphic(
  graphic: Graphic,
  paletteOrCharIndex?: Palette | number,
  selection?: { x: number; y: number; w: number; h: number } | null,
  charIndex = 0
): ClipboardItem {
  let palette: Palette;
  let activeChar = 0;

  if (typeof paletteOrCharIndex === 'number') {
    activeChar = paletteOrCharIndex;
    palette = defaultPalette();
  } else if (paletteOrCharIndex && 'colors' in paletteOrCharIndex) {
    palette = paletteOrCharIndex;
    activeChar = charIndex;
  } else {
    palette = defaultPalette();
    activeChar = charIndex;
  }

  const startX = selection ? Math.max(0, selection.x) : 0;
  const startY = selection ? Math.max(0, selection.y) : 0;
  const maxW = Math.max(1, graphic.width - startX);
  const maxH = Math.max(1, graphic.height - startY);
  const w = selection ? Math.max(1, Math.min(selection.w, maxW)) : graphic.width;
  const h = selection ? Math.max(1, Math.min(selection.h, maxH)) : graphic.height;

  const pixels = new Uint8Array(w * h);
  const rgbColors: Rgb[] = new Array(w * h);

  for (let ly = 0; ly < h; ly++) {
    for (let lx = 0; lx < w; lx++) {
      const gx = startX + lx;
      const gy = startY + ly;
      let val: number | null = null;
      if (graphic.isCharset()) {
        val = graphic.getCharPixel(activeChar, gx, gy);
      } else {
        val = graphic.get(gx, gy);
      }
      const pixelVal = val ?? 0;
      const idx = ly * w + lx;
      pixels[idx] = pixelVal;
      rgbColors[idx] = slotColor(graphic, palette, pixelVal);
    }
  }

  const item: ClipboardItem = {
    width: w,
    height: h,
    depth: graphic.depth,
    pixelMode: graphic.pixelMode,
    pixels,
    rgbColors,
    transparentSlot: graphic.transparentSlot,
  };

  setMemoryClipboard(item);
  return item;
}

/**
 * Converts clipboard pixels to match target graphic's color depth and palette,
 * conserving the palette and BPP as best as possible using color quantization / down-sampling.
 */
export function convertClipboardPixels(
  item: ClipboardItem,
  targetGraphic: Graphic,
  targetPalette: Palette
): Uint8Array {
  const len = item.width * item.height;
  const result = new Uint8Array(len);

  // If both graphics have the same depth and both are slotted
  if (item.depth === targetGraphic.depth && (targetGraphic.depth === 2 || targetGraphic.depth === 4)) {
    for (let i = 0; i < len; i++) {
      result[i] = item.pixels[i] % targetGraphic.depth;
    }
    return result;
  }

  // Target is 1bpp (2 colors / monochrome)
  if (targetGraphic.depth === 2) {
    for (let i = 0; i < len; i++) {
      result[i] = item.pixels[i] > 0 ? 1 : 0;
    }
    return result;
  }

  // Target is 8bpp direct (256 colors)
  if (targetGraphic.depth === 256) {
    if (item.rgbColors && item.rgbColors.length === len) {
      const cache = new Map<number, number>();
      for (let i = 0; i < len; i++) {
        const rgb = item.rgbColors[i];
        const key = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
        let mapped = cache.get(key);
        if (mapped === undefined) {
          let bestDist = Infinity;
          let bestIdx = 0;
          for (let p = 0; p < targetPalette.colors.length; p++) {
            const d = colorDistance(rgb, targetPalette.colors[p]);
            if (d < bestDist) {
              bestDist = d;
              bestIdx = p;
              if (d === 0) break;
            }
          }
          mapped = bestIdx;
          cache.set(key, mapped);
        }
        result[i] = mapped;
      }
    } else {
      for (let i = 0; i < len; i++) {
        result[i] = item.pixels[i];
      }
    }
    return result;
  }

  // Target is slotted 2bpp (4 colors) or 4bpp (16 colors):
  // Map each pixel to the closest available slot color in target graphic using perceptual color distance
  const slotCount = targetGraphic.depth;
  const slotRgbs: Rgb[] = [];
  for (let s = 0; s < slotCount; s++) {
    slotRgbs.push(slotColor(targetGraphic, targetPalette, s));
  }

  if (item.rgbColors && item.rgbColors.length === len) {
    for (let i = 0; i < len; i++) {
      if (item.pixels[i] === 0 || item.pixels[i] === item.transparentSlot) {
        result[i] = targetGraphic.transparentSlot ?? 0;
        continue;
      }
      const rgb = item.rgbColors[i];
      let bestSlot = 1;
      let bestDist = Infinity;
      for (let s = 0; s < slotCount; s++) {
        const d = colorDistance(rgb, slotRgbs[s]);
        if (d < bestDist) {
          bestDist = d;
          bestSlot = s;
          if (d === 0) break;
        }
      }
      result[i] = bestSlot;
    }
  } else {
    for (let i = 0; i < len; i++) {
      result[i] = item.pixels[i] % targetGraphic.depth;
    }
  }

  return result;
}

export function pasteToGraphic(
  graphic: Graphic,
  item: ClipboardItem,
  charIndex = 0,
  targetPos?: { x: number; y: number } | null,
  palette?: Palette
): { pastedW: number; pastedH: number } {
  const targetW = graphic.width;
  const targetH = graphic.height;

  const startX = targetPos ? Math.max(0, targetPos.x) : 0;
  const startY = targetPos ? Math.max(0, targetPos.y) : 0;

  if (startX >= targetW || startY >= targetH) {
    return { pastedW: 0, pastedH: 0 };
  }

  const pastedW = Math.min(item.width, targetW - startX);
  const pastedH = Math.min(item.height, targetH - startY);

  const convertedPixels = convertClipboardPixels(item, graphic, palette ?? defaultPalette());

  for (let ly = 0; ly < pastedH; ly++) {
    for (let lx = 0; lx < pastedW; lx++) {
      const destVal = convertedPixels[ly * item.width + lx];
      const destX = startX + lx;
      const destY = startY + ly;

      if (graphic.isCharset()) {
        graphic.setCharPixel(charIndex, destX, destY, destVal);
      } else {
        graphic.set(destX, destY, destVal);
      }
    }
  }

  return { pastedW, pastedH };
}
