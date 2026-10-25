import { DEFAULT_PALETTE_ID, type PaletteRef } from './palette';

export type ColorDepth = 2 | 4 | 8 | 16;

export type PixelMode = 'hires' | 'wide';

export function pixelModeAspect(mode: PixelMode): number {
  return mode === 'wide' ? 2.0 : 1.0;
}

export type GraphicKind =
  | { kind: 'sprite' }
  | {
      kind: 'charset';
      charWidth: number;
      charHeight: number;
      charCount: number;
      columns: number;
    };

export interface GraphicJson {
  name: string;
  kind: 'sprite' | 'charset';
  width: number;
  height: number;
  char_width?: number;
  char_height?: number;
  char_count?: number;
  columns?: number;
  depth: number;
  pixel_mode: 'hires' | 'wide';
  palette: string;
  slots: number[];
  transparent_slot: number | null;
  pixels: string | string[] | number[];
}

export class Graphic {
  name: string;
  kind: GraphicKind;
  width: number;
  height: number;
  depth: ColorDepth;
  pixelMode: PixelMode;
  palette: PaletteRef;
  slots: number[];
  transparentSlot: number | null;
  pixels: Uint8Array;

  constructor(
    name: string,
    kind: GraphicKind,
    width: number,
    height: number,
    depth: ColorDepth,
    pixelMode: PixelMode,
    palette: PaletteRef,
    slots: number[],
    transparentSlot: number | null,
    pixels?: Uint8Array
  ) {
    this.name = name;
    this.kind = kind;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.pixelMode = pixelMode;
    this.palette = palette;
    this.slots = slots;
    this.transparentSlot = transparentSlot;
    this.pixels = pixels ?? new Uint8Array(width * height);
  }

  static newSprite(
    name: string,
    width = 24,
    height = 21,
    depth: ColorDepth = 2,
    pixelMode: PixelMode = 'hires'
  ): Graphic {
    const slots = Array.from({ length: depth }, (_, i) => i);
    return new Graphic(
      name,
      { kind: 'sprite' },
      width,
      height,
      depth,
      pixelMode,
      { kind: 'builtin', id: DEFAULT_PALETTE_ID },
      slots,
      0
    );
  }

  static newCharset(
    name: string,
    charWidth = 8,
    charHeight = 8,
    charCount = 256,
    columns = 16
  ): Graphic {
    const rows = Math.ceil(charCount / columns);
    const width = columns * charWidth;
    const height = rows * charHeight;
    return new Graphic(
      name,
      { kind: 'charset', charWidth, charHeight, charCount, columns },
      width,
      height,
      2,
      'hires',
      { kind: 'builtin', id: DEFAULT_PALETTE_ID },
      [0, 1],
      null
    );
  }

  isSprite(): boolean {
    return this.kind.kind === 'sprite';
  }

  isCharset(): boolean {
    return this.kind.kind === 'charset';
  }

  charsetInfo(): { charWidth: number; charHeight: number; charCount: number; columns: number } | null {
    if (this.kind.kind === 'charset') {
      return {
        charWidth: this.kind.charWidth,
        charHeight: this.kind.charHeight,
        charCount: this.kind.charCount,
        columns: this.kind.columns,
      };
    }
    return null;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  get(x: number, y: number): number | null {
    if (!this.inBounds(x, y)) return null;
    return this.pixels[y * this.width + x];
  }

  set(x: number, y: number, value: number): boolean {
    if (!this.inBounds(x, y)) return false;
    const idx = y * this.width + x;
    const changed = this.pixels[idx] !== value;
    this.pixels[idx] = value;
    return changed;
  }

  clonePixels(): Uint8Array {
    return new Uint8Array(this.pixels);
  }

  replacePixels(newPixels: Uint8Array): void {
    if (newPixels.length !== this.width * this.height) {
      throw new Error('Pixel size mismatch');
    }
    this.pixels = new Uint8Array(newPixels);
  }

  hasDrawnPixelsOutside(newWidth: number, newHeight: number): boolean {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (x >= newWidth || y >= newHeight) {
          if (this.pixels[y * this.width + x] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  resize(newWidth: number, newHeight: number): void {
    if (newWidth <= 0 || newHeight <= 0 || (newWidth === this.width && newHeight === this.height)) {
      return;
    }
    const newPixels = new Uint8Array(newWidth * newHeight);
    const copyW = Math.min(this.width, newWidth);
    const copyH = Math.min(this.height, newHeight);
    for (let y = 0; y < copyH; y++) {
      for (let x = 0; x < copyW; x++) {
        newPixels[y * newWidth + x] = this.pixels[y * this.width + x];
      }
    }
    this.width = newWidth;
    this.height = newHeight;
    this.pixels = newPixels;
  }

  clear(): boolean {
    let changed = false;
    for (let i = 0; i < this.pixels.length; i++) {
      if (this.pixels[i] !== 0) {
        this.pixels[i] = 0;
        changed = true;
      }
    }
    return changed;
  }

  invert(): boolean {
    if (this.depth !== 2) return false;
    for (let i = 0; i < this.pixels.length; i++) {
      this.pixels[i] = this.pixels[i] === 0 ? 1 : 0;
    }
    return true;
  }

  getCharOrigin(charIndex: number): { x: number; y: number } | null {
    const info = this.charsetInfo();
    if (!info) return null;
    const col = charIndex % info.columns;
    const row = Math.floor(charIndex / info.columns);
    return {
      x: col * info.charWidth,
      y: row * info.charHeight,
    };
  }

  getCharPixel(charIndex: number, lx: number, ly: number): number | null {
    const orig = this.getCharOrigin(charIndex);
    const info = this.charsetInfo();
    if (!orig || !info) return null;
    if (lx < 0 || lx >= info.charWidth || ly < 0 || ly >= info.charHeight) return null;
    return this.get(orig.x + lx, orig.y + ly);
  }

  setCharPixel(charIndex: number, lx: number, ly: number, value: number): boolean {
    const orig = this.getCharOrigin(charIndex);
    const info = this.charsetInfo();
    if (!orig || !info) return false;
    if (lx < 0 || lx >= info.charWidth || ly < 0 || ly >= info.charHeight) return false;
    return this.set(orig.x + lx, orig.y + ly, value);
  }

  clearChar(charIndex: number): boolean {
    const orig = this.getCharOrigin(charIndex);
    const info = this.charsetInfo();
    if (!orig || !info) return false;
    let changed = false;
    for (let ly = 0; ly < info.charHeight; ly++) {
      for (let lx = 0; lx < info.charWidth; lx++) {
        if (this.set(orig.x + lx, orig.y + ly, 0)) {
          changed = true;
        }
      }
    }
    return changed;
  }

  invertChar(charIndex: number): boolean {
    if (this.depth !== 2) return false;
    const orig = this.getCharOrigin(charIndex);
    const info = this.charsetInfo();
    if (!orig || !info) return false;
    let changed = false;
    for (let ly = 0; ly < info.charHeight; ly++) {
      for (let lx = 0; lx < info.charWidth; lx++) {
        const cur = this.get(orig.x + lx, orig.y + ly) ?? 0;
        const next = cur === 0 ? 1 : 0;
        if (this.set(orig.x + lx, orig.y + ly, next)) {
          changed = true;
        }
      }
    }
    return changed;
  }

  hasDrawnPixels(): boolean {
    for (let i = 0; i < this.pixels.length; i++) {
      if (this.pixels[i] !== 0) return true;
    }
    return false;
  }

  setDepthAndMode(depth: ColorDepth, pixelMode: PixelMode): void {
    if (this.depth === depth && this.pixelMode === pixelMode) return;
    const oldDepth = this.depth;
    this.depth = depth;
    this.pixelMode = pixelMode;
    while (this.slots.length < depth) {
      this.slots.push(this.slots.length);
    }
    this.slots = this.slots.slice(0, depth);

    if (oldDepth === 4 && depth === 2) {
      // When changing a multi color sprite to a hires one, turn all color slots other than 00 into the new slot 01,
      // so all opaque pixels in the original sprite are still opaque in the changed sprite.
      for (let i = 0; i < this.pixels.length; i++) {
        if (this.pixels[i] > 0) {
          this.pixels[i] = 1;
        }
      }
    } else {
      for (let i = 0; i < this.pixels.length; i++) {
        if (this.pixels[i] >= depth) {
          this.pixels[i] = 0;
        }
      }
    }
  }

  shiftPixels(dx: number, dy: number, charIndex?: number): boolean {
    if (this.isCharset() && charIndex !== undefined) {
      const info = this.charsetInfo();
      const orig = this.getCharOrigin(charIndex);
      if (!info || !orig) return false;
      const cw = info.charWidth;
      const ch = info.charHeight;
      const temp = new Uint8Array(cw * ch);
      for (let ly = 0; ly < ch; ly++) {
        for (let lx = 0; lx < cw; lx++) {
          temp[ly * cw + lx] = this.getCharPixel(charIndex, lx, ly) ?? 0;
        }
      }
      for (let ly = 0; ly < ch; ly++) {
        for (let lx = 0; lx < cw; lx++) {
          const srcX = (lx - dx + cw) % cw;
          const srcY = (ly - dy + ch) % ch;
          this.setCharPixel(charIndex, lx, ly, temp[srcY * cw + srcX]);
        }
      }
      return true;
    }

    const w = this.width;
    const h = this.height;
    const temp = new Uint8Array(this.pixels);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const srcX = (x - dx + w) % w;
        const srcY = (y - dy + h) % h;
        this.pixels[y * w + x] = temp[srcY * w + srcX];
      }
    }
    return true;
  }

  mirrorH(charIndex?: number): boolean {
    if (this.isCharset() && charIndex !== undefined) {
      const info = this.charsetInfo();
      const orig = this.getCharOrigin(charIndex);
      if (!info || !orig) return false;
      const cw = info.charWidth;
      const ch = info.charHeight;
      for (let ly = 0; ly < ch; ly++) {
        for (let lx = 0; lx < Math.floor(cw / 2); lx++) {
          const oppX = cw - 1 - lx;
          const p1 = this.getCharPixel(charIndex, lx, ly) ?? 0;
          const p2 = this.getCharPixel(charIndex, oppX, ly) ?? 0;
          this.setCharPixel(charIndex, lx, ly, p2);
          this.setCharPixel(charIndex, oppX, ly, p1);
        }
      }
      return true;
    }

    const w = this.width;
    const h = this.height;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < Math.floor(w / 2); x++) {
        const oppX = w - 1 - x;
        const idx1 = y * w + x;
        const idx2 = y * w + oppX;
        const tmp = this.pixels[idx1];
        this.pixels[idx1] = this.pixels[idx2];
        this.pixels[idx2] = tmp;
      }
    }
    return true;
  }

  mirrorV(charIndex?: number): boolean {
    if (this.isCharset() && charIndex !== undefined) {
      const info = this.charsetInfo();
      const orig = this.getCharOrigin(charIndex);
      if (!info || !orig) return false;
      const cw = info.charWidth;
      const ch = info.charHeight;
      for (let lx = 0; lx < cw; lx++) {
        for (let ly = 0; ly < Math.floor(ch / 2); ly++) {
          const oppY = ch - 1 - ly;
          const p1 = this.getCharPixel(charIndex, lx, ly) ?? 0;
          const p2 = this.getCharPixel(charIndex, lx, oppY) ?? 0;
          this.setCharPixel(charIndex, lx, ly, p2);
          this.setCharPixel(charIndex, lx, oppY, p1);
        }
      }
      return true;
    }

    const w = this.width;
    const h = this.height;
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < Math.floor(h / 2); y++) {
        const oppY = h - 1 - y;
        const idx1 = y * w + x;
        const idx2 = oppY * w + x;
        const tmp = this.pixels[idx1];
        this.pixels[idx1] = this.pixels[idx2];
        this.pixels[idx2] = tmp;
      }
    }
    return true;
  }

  wouldRotationLoseData(clockwise: boolean, charIndex?: number): boolean {
    if (this.isCharset() && charIndex !== undefined) {
      const info = this.charsetInfo();
      if (info && info.charWidth === info.charHeight) return false;
    }
    if (this.width === this.height) return false;

    const w = this.width;
    const h = this.height;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const val = this.pixels[y * w + x];
        if (val !== 0) {
          const targetX = clockwise ? h - 1 - y : y;
          const targetY = clockwise ? x : w - 1 - x;
          if (targetX < 0 || targetX >= w || targetY < 0 || targetY >= h) {
            return true;
          }
        }
      }
    }
    return false;
  }

  rotate(clockwise: boolean, charIndex?: number): boolean {
    if (this.isCharset() && charIndex !== undefined) {
      const info = this.charsetInfo();
      const orig = this.getCharOrigin(charIndex);
      if (!info || !orig) return false;
      const cw = info.charWidth;
      const ch = info.charHeight;
      const temp = new Uint8Array(cw * ch);
      for (let ly = 0; ly < ch; ly++) {
        for (let lx = 0; lx < cw; lx++) {
          temp[ly * cw + lx] = this.getCharPixel(charIndex, lx, ly) ?? 0;
        }
      }
      for (let ly = 0; ly < ch; ly++) {
        for (let lx = 0; lx < cw; lx++) {
          this.setCharPixel(charIndex, lx, ly, 0);
        }
      }
      for (let ly = 0; ly < ch; ly++) {
        for (let lx = 0; lx < cw; lx++) {
          const val = temp[ly * cw + lx];
          if (val !== 0) {
            const targetX = clockwise ? ch - 1 - ly : ly;
            const targetY = clockwise ? lx : cw - 1 - lx;
            if (targetX >= 0 && targetX < cw && targetY >= 0 && targetY < ch) {
              this.setCharPixel(charIndex, targetX, targetY, val);
            }
          }
        }
      }
      return true;
    }

    const w = this.width;
    const h = this.height;
    const temp = new Uint8Array(this.pixels);
    this.pixels.fill(0);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const val = temp[y * w + x];
        if (val !== 0) {
          const targetX = clockwise ? h - 1 - y : y;
          const targetY = clockwise ? x : w - 1 - x;
          if (targetX >= 0 && targetX < w && targetY >= 0 && targetY < h) {
            this.pixels[targetY * w + targetX] = val;
          }
        }
      }
    }
    return true;
  }

  clone(): Graphic {
    return new Graphic(
      this.name,
      this.kind.kind === 'charset' ? { ...this.kind } : { kind: 'sprite' },
      this.width,
      this.height,
      this.depth,
      this.pixelMode,
      { ...this.palette },
      [...this.slots],
      this.transparentSlot,
      this.pixels
    );
  }

  toJson(): GraphicJson {
    const base: GraphicJson = {
      name: this.name,
      kind: this.kind.kind,
      width: this.width,
      height: this.height,
      depth: this.depth,
      pixel_mode: this.pixelMode,
      palette: `${this.palette.kind}:${this.palette.id}`,
      slots: [...this.slots],
      transparent_slot: this.transparentSlot,
      pixels: '',
    };

    if (this.kind.kind === 'charset') {
      base.char_width = this.kind.charWidth;
      base.char_height = this.kind.charHeight;
      base.char_count = this.kind.charCount;
      base.columns = this.kind.columns;

      const charStrings: string[] = [];
      for (let c = 0; c < this.kind.charCount; c++) {
        let str = '';
        for (let ly = 0; ly < this.kind.charHeight; ly++) {
          for (let lx = 0; lx < this.kind.charWidth; lx++) {
            str += (this.getCharPixel(c, lx, ly) ?? 0).toString(16);
          }
        }
        charStrings.push(str);
      }
      base.pixels = charStrings;
    } else {
      // Sprites: entire sprite in a single line
      base.pixels = Array.from(this.pixels)
        .map((p) => p.toString(16))
        .join('');
    }

    return base;
  }

  static fromJson(json: GraphicJson): Graphic {
    const kind: GraphicKind =
      json.kind === 'charset'
        ? {
            kind: 'charset',
            charWidth: json.char_width ?? 8,
            charHeight: json.char_height ?? 8,
            charCount: json.char_count ?? 256,
            columns: json.columns ?? 16,
          }
        : { kind: 'sprite' };

    const paletteParts = json.palette.split(':');
    const paletteRef: PaletteRef =
      paletteParts.length === 2
        ? { kind: paletteParts[0] as 'builtin' | 'custom', id: paletteParts[1] }
        : { kind: 'builtin', id: json.palette };

    const parsedDepth = (Number(json.depth) || 2) as ColorDepth;
    const pixelMode = json.pixel_mode ?? (parsedDepth === 4 ? 'wide' : 'hires');
    const graphic = new Graphic(
      json.name,
      kind,
      json.width,
      json.height,
      parsedDepth,
      pixelMode,
      paletteRef,
      [...json.slots],
      json.transparent_slot
    );

    if (typeof json.pixels === 'string') {
      for (let i = 0; i < json.pixels.length && i < graphic.pixels.length; i++) {
        graphic.pixels[i] = parseInt(json.pixels[i], 16) || 0;
      }
    } else if (Array.isArray(json.pixels)) {
      if (json.pixels.length > 0 && typeof json.pixels[0] === 'string') {
        const charStrs = json.pixels as string[];
        if (graphic.isCharset()) {
          const info = graphic.charsetInfo()!;
          for (let c = 0; c < charStrs.length && c < info.charCount; c++) {
            const str = charStrs[c];
            for (let ly = 0; ly < info.charHeight; ly++) {
              for (let lx = 0; lx < info.charWidth; lx++) {
                const idx = ly * info.charWidth + lx;
                if (idx < str.length) {
                  graphic.setCharPixel(c, lx, ly, parseInt(str[idx], 16) || 0);
                }
              }
            }
          }
        } else {
          // If a sprite was stored as an array of strings
          const flatStr = charStrs.join('');
          for (let i = 0; i < flatStr.length && i < graphic.pixels.length; i++) {
            graphic.pixels[i] = parseInt(flatStr[i], 16) || 0;
          }
        }
      } else {
        // Flat number array (backward compatibility)
        const numArr = json.pixels as number[];
        for (let i = 0; i < numArr.length && i < graphic.pixels.length; i++) {
          graphic.pixels[i] = numArr[i];
        }
      }
    }

    return graphic;
  }
}
