import { DEFAULT_PALETTE_ID, type PaletteRef } from './palette';

export type ColorDepth = 2 | 4 | 8 | 16 | 256;

export type Bpp = 1 | 2 | 3 | 4 | 8;

export type PixelAspectRatio = '1:1' | '2:1';

export type PixelMode = 'hires' | 'wide';

export function depthFromBpp(bpp: Bpp): ColorDepth {
  switch (bpp) {
    case 1:
      return 2;
    case 2:
      return 4;
    case 3:
      return 8;
    case 4:
      return 16;
    case 8:
      return 256;
    default:
      return 2;
  }
}

export function bppFromDepth(depth: number): Bpp {
  switch (depth) {
    case 2:
      return 1;
    case 4:
      return 2;
    case 8:
      return 3;
    case 16:
      return 4;
    case 256:
      return 8;
    default:
      return 1;
  }
}

export function pixelModeAspect(mode: PixelMode | PixelAspectRatio): number {
  return mode === 'wide' || mode === '2:1' ? 2.0 : 1.0;
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
  bpp?: number;
  pixel_mode: 'hires' | 'wide';
  pixel_aspect?: '1:1' | '2:1';
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

    const totalPixels =
      kind.kind === 'charset'
        ? kind.columns * width * Math.ceil(kind.charCount / kind.columns) * height
        : width * height;

    this.pixels = pixels ?? new Uint8Array(totalPixels);
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
    return new Graphic(
      name,
      { kind: 'charset', charWidth, charHeight, charCount, columns },
      charWidth,
      charHeight,
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

  get bpp(): Bpp {
    return bppFromDepth(this.depth);
  }

  set bpp(val: Bpp) {
    this.setBpp(val);
  }

  get pixelAspectRatio(): PixelAspectRatio {
    return this.pixelMode === 'wide' ? '2:1' : '1:1';
  }

  set pixelAspectRatio(val: PixelAspectRatio) {
    this.setPixelAspectRatio(val);
  }

  setPixelAspectRatio(aspect: PixelAspectRatio): void {
    this.pixelMode = aspect === '2:1' ? 'wide' : 'hires';
  }

  sheetWidth(): number {
    if (this.kind.kind === 'charset') {
      return this.kind.columns * this.width;
    }
    return this.width;
  }

  sheetHeight(): number {
    if (this.kind.kind === 'charset') {
      const rows = Math.ceil(this.kind.charCount / this.kind.columns);
      return rows * this.height;
    }
    return this.height;
  }

  charsetInfo(): { charWidth: number; charHeight: number; charCount: number; columns: number } | null {
    if (this.kind.kind === 'charset') {
      return {
        charWidth: this.width,
        charHeight: this.height,
        charCount: this.kind.charCount,
        columns: this.kind.columns,
      };
    }
    return null;
  }

  inBounds(x: number, y: number): boolean {
    const w = this.sheetWidth();
    const h = this.sheetHeight();
    return x >= 0 && y >= 0 && x < w && y < h;
  }

  get(x: number, y: number): number | null {
    if (!this.inBounds(x, y)) return null;
    return this.pixels[y * this.sheetWidth() + x];
  }

  set(x: number, y: number, value: number): boolean {
    if (!this.inBounds(x, y)) return false;
    const stride = this.sheetWidth();
    const idx = y * stride + x;
    const changed = this.pixels[idx] !== value;
    this.pixels[idx] = value;
    return changed;
  }

  clonePixels(): Uint8Array {
    return new Uint8Array(this.pixels);
  }

  replacePixels(newPixels: Uint8Array): void {
    const expected = this.sheetWidth() * this.sheetHeight();
    if (newPixels.length !== expected) {
      throw new Error('Pixel size mismatch');
    }
    this.pixels = new Uint8Array(newPixels);
  }

  hasDrawnPixelsOutside(newWidth: number, newHeight: number): boolean {
    if (this.isCharset()) return false;
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
    if (this.isCharset()) return;
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
      x: col * this.width,
      y: row * this.height,
    };
  }

  getCharPixel(charIndex: number, lx: number, ly: number): number | null {
    const orig = this.getCharOrigin(charIndex);
    const info = this.charsetInfo();
    if (!orig || !info) return null;
    if (lx < 0 || lx >= this.width || ly < 0 || ly >= this.height) return null;
    return this.get(orig.x + lx, orig.y + ly);
  }

  setCharPixel(charIndex: number, lx: number, ly: number, value: number): boolean {
    const orig = this.getCharOrigin(charIndex);
    const info = this.charsetInfo();
    if (!orig || !info) return false;
    if (lx < 0 || lx >= this.width || ly < 0 || ly >= this.height) return false;
    return this.set(orig.x + lx, orig.y + ly, value);
  }

  clearChar(charIndex: number): boolean {
    const orig = this.getCharOrigin(charIndex);
    const info = this.charsetInfo();
    if (!orig || !info) return false;
    let changed = false;
    for (let ly = 0; ly < this.height; ly++) {
      for (let lx = 0; lx < this.width; lx++) {
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
    for (let ly = 0; ly < this.height; ly++) {
      for (let lx = 0; lx < this.width; lx++) {
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

  setBpp(newBpp: Bpp): void {
    const newDepth = depthFromBpp(newBpp);
    if (this.depth === newDepth) return;
    const oldDepth = this.depth;
    this.depth = newDepth;

    if (newDepth === 256) {
      // Slotted (1..4 bpp) -> 8bpp direct:
      // Map each pixel from its slot index to the palette index it currently points to
      for (let i = 0; i < this.pixels.length; i++) {
        const slot = this.pixels[i];
        this.pixels[i] = this.slots[slot] ?? slot;
      }
      this.slots = [];
    } else if (oldDepth === 256) {
      // 8bpp direct -> slotted (1..4 bpp):
      // Collect unique palette colors used
      const uniqueColors: number[] = [];
      const seen = new Set<number>();
      for (let i = 0; i < this.pixels.length; i++) {
        const c = this.pixels[i];
        if (!seen.has(c)) {
          seen.add(c);
          uniqueColors.push(c);
        }
      }
      const newSlots: number[] = [];
      const colorToSlot = new Map<number, number>();
      for (let i = 0; i < newDepth; i++) {
        const palIdx = i < uniqueColors.length ? uniqueColors[i] : i;
        newSlots.push(palIdx);
        colorToSlot.set(palIdx, i);
      }
      this.slots = newSlots;
      for (let i = 0; i < this.pixels.length; i++) {
        const c = this.pixels[i];
        if (colorToSlot.has(c)) {
          this.pixels[i] = colorToSlot.get(c)!;
        } else {
          this.pixels[i] = c % newDepth;
        }
      }
    } else {
      // Slotted to Slotted (1..4 bpp):
      while (this.slots.length < newDepth) {
        this.slots.push(this.slots.length);
      }
      this.slots = this.slots.slice(0, newDepth);

      if (newDepth < oldDepth) {
        if (newDepth === 2) {
          // Down to 1bpp: any opaque slot becomes 1, slot 0 stays 0
          for (let i = 0; i < this.pixels.length; i++) {
            if (this.pixels[i] > 0) {
              this.pixels[i] = 1;
            }
          }
        } else {
          for (let i = 0; i < this.pixels.length; i++) {
            if (this.pixels[i] >= newDepth) {
              this.pixels[i] = this.pixels[i] % newDepth;
            }
          }
        }
      }
    }
  }

  setDepthAndMode(depth: ColorDepth, pixelMode: PixelMode): void {
    this.setBpp(bppFromDepth(depth));
    this.pixelMode = pixelMode;
  }

  shiftPixels(dx: number, dy: number, charIndex?: number): boolean {
    if (this.isCharset() && charIndex !== undefined) {
      const orig = this.getCharOrigin(charIndex);
      if (!orig) return false;
      const cw = this.width;
      const ch = this.height;
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

    const w = this.sheetWidth();
    const h = this.sheetHeight();
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
      const orig = this.getCharOrigin(charIndex);
      if (!orig) return false;
      const cw = this.width;
      const ch = this.height;
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

    const w = this.sheetWidth();
    const h = this.sheetHeight();
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
      const orig = this.getCharOrigin(charIndex);
      if (!orig) return false;
      const cw = this.width;
      const ch = this.height;
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

    const w = this.sheetWidth();
    const h = this.sheetHeight();
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
      if (this.width === this.height) return false;
    } else if (this.isCharset()) {
      if (this.sheetWidth() === this.sheetHeight()) return false;
    } else if (this.width === this.height) {
      return false;
    }

    const w = this.sheetWidth();
    const h = this.sheetHeight();
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
      const orig = this.getCharOrigin(charIndex);
      if (!orig) return false;
      const cw = this.width;
      const ch = this.height;
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

    const w = this.sheetWidth();
    const h = this.sheetHeight();
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
      this.clonePixels()
    );
  }

  toJson(): GraphicJson {
    const is256 = this.depth === 256;
    const base: GraphicJson = {
      name: this.name,
      kind: this.kind.kind,
      width: this.width,
      height: this.height,
      depth: this.depth,
      bpp: this.bpp,
      pixel_mode: this.pixelMode,
      pixel_aspect: this.pixelAspectRatio,
      palette: `${this.palette.kind}:${this.palette.id}`,
      slots: [...this.slots],
      transparent_slot: this.transparentSlot,
      pixels: '',
    };

    if (this.kind.kind === 'charset') {
      base.char_width = this.width;
      base.char_height = this.height;
      base.char_count = this.kind.charCount;
      base.columns = this.kind.columns;

      const charStrings: string[] = [];
      for (let c = 0; c < this.kind.charCount; c++) {
        let str = '';
        for (let ly = 0; ly < this.height; ly++) {
          for (let lx = 0; lx < this.width; lx++) {
            const v = this.getCharPixel(c, lx, ly) ?? 0;
            str += is256 ? v.toString(16).padStart(2, '0') : v.toString(16);
          }
        }
        charStrings.push(str);
      }
      base.pixels = charStrings;
    } else {
      // Sprites: entire sprite in a single string
      if (is256) {
        base.pixels = Array.from(this.pixels)
          .map((p) => p.toString(16).padStart(2, '0'))
          .join('');
      } else {
        base.pixels = Array.from(this.pixels)
          .map((p) => p.toString(16))
          .join('');
      }
    }

    return base;
  }

  static fromJson(json: GraphicJson): Graphic {
    let kind: GraphicKind;
    let width = json.width;
    let height = json.height;

    if (json.kind === 'charset') {
      const charWidth = json.char_width ?? (json.width > 32 ? 8 : json.width) ?? 8;
      const charHeight = json.char_height ?? (json.height > 32 ? 8 : json.height) ?? 8;
      const charCount = json.char_count ?? 256;
      const columns = json.columns ?? 16;
      kind = {
        kind: 'charset',
        charWidth,
        charHeight,
        charCount,
        columns,
      };
      width = charWidth;
      height = charHeight;
    } else {
      kind = { kind: 'sprite' };
    }

    const paletteParts = json.palette.split(':');
    const paletteRef: PaletteRef =
      paletteParts.length === 2
        ? { kind: paletteParts[0] as 'builtin' | 'custom', id: paletteParts[1] }
        : { kind: 'builtin', id: json.palette };

    const parsedDepth = (Number(json.depth) || (json.bpp ? depthFromBpp(json.bpp as Bpp) : 2)) as ColorDepth;
    const pixelMode = json.pixel_mode ?? (json.pixel_aspect === '2:1' ? 'wide' : 'hires');
    const is256 = parsedDepth === 256;

    const graphic = new Graphic(
      json.name,
      kind,
      width,
      height,
      parsedDepth,
      pixelMode,
      paletteRef,
      json.slots ? [...json.slots] : [],
      json.transparent_slot
    );

    if (typeof json.pixels === 'string') {
      if (is256 && json.pixels.length === graphic.pixels.length * 2) {
        for (let i = 0; i < graphic.pixels.length; i++) {
          graphic.pixels[i] = parseInt(json.pixels.slice(i * 2, i * 2 + 2), 16) || 0;
        }
      } else {
        for (let i = 0; i < json.pixels.length && i < graphic.pixels.length; i++) {
          graphic.pixels[i] = parseInt(json.pixels[i], 16) || 0;
        }
      }
    } else if (Array.isArray(json.pixels)) {
      if (json.pixels.length > 0 && typeof json.pixels[0] === 'string') {
        const charStrs = json.pixels as string[];
        if (graphic.isCharset()) {
          const info = graphic.charsetInfo()!;
          const step = is256 ? 2 : 1;
          for (let c = 0; c < charStrs.length && c < info.charCount; c++) {
            const str = charStrs[c];
            for (let ly = 0; ly < graphic.height; ly++) {
              for (let lx = 0; lx < graphic.width; lx++) {
                const charPixelIdx = ly * graphic.width + lx;
                const strIdx = charPixelIdx * step;
                if (strIdx < str.length) {
                  const val = is256
                    ? parseInt(str.slice(strIdx, strIdx + 2), 16) || 0
                    : parseInt(str[strIdx], 16) || 0;
                  graphic.setCharPixel(c, lx, ly, val);
                }
              }
            }
          }
        } else {
          // If a sprite was stored as an array of strings
          const flatStr = charStrs.join('');
          if (is256 && flatStr.length === graphic.pixels.length * 2) {
            for (let i = 0; i < graphic.pixels.length; i++) {
              graphic.pixels[i] = parseInt(flatStr.slice(i * 2, i * 2 + 2), 16) || 0;
            }
          } else {
            for (let i = 0; i < flatStr.length && i < graphic.pixels.length; i++) {
              graphic.pixels[i] = parseInt(flatStr[i], 16) || 0;
            }
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
