import type { Graphic, ColorDepth, PixelMode } from './graphic';

export interface ClipboardItem {
  width: number;
  height: number;
  depth: ColorDepth;
  pixelMode: PixelMode;
  pixels: Uint8Array;
}

let memoryClipboard: ClipboardItem | null = null;

export function getMemoryClipboard(): ClipboardItem | null {
  return memoryClipboard ? { ...memoryClipboard, pixels: new Uint8Array(memoryClipboard.pixels) } : null;
}

export function setMemoryClipboard(item: ClipboardItem | null): void {
  memoryClipboard = item ? { ...item, pixels: new Uint8Array(item.pixels) } : null;
}

export function copyFromGraphic(
  graphic: Graphic,
  charIndex = 0
): ClipboardItem {
  const w = graphic.width;
  const h = graphic.height;
  const pixels = new Uint8Array(w * h);

  for (let ly = 0; ly < h; ly++) {
    for (let lx = 0; lx < w; lx++) {
      let val: number | null = null;
      if (graphic.isCharset()) {
        val = graphic.getCharPixel(charIndex, lx, ly);
      } else {
        val = graphic.get(lx, ly);
      }
      pixels[ly * w + lx] = val ?? 0;
    }
  }

  const item: ClipboardItem = {
    width: w,
    height: h,
    depth: graphic.depth,
    pixelMode: graphic.pixelMode,
    pixels,
  };

  setMemoryClipboard(item);
  return item;
}

export function pasteToGraphic(
  graphic: Graphic,
  item: ClipboardItem,
  charIndex = 0,
  targetPos?: { x: number; y: number } | null
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

  for (let ly = 0; ly < pastedH; ly++) {
    for (let lx = 0; lx < pastedW; lx++) {
      const srcVal = item.pixels[ly * item.width + lx];
      let destVal = srcVal;

      if (graphic.depth === 2) {
        // Converting to 1bpp: any opaque slot becomes 1, slot 0 stays 0
        destVal = srcVal > 0 ? 1 : 0;
      } else if (graphic.depth === 256) {
        destVal = srcVal;
      } else {
        destVal = srcVal % graphic.depth;
      }

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
