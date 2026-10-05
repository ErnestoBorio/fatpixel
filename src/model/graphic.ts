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
  pixels: number[];
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

  setDepthAndMode(depth: ColorDepth, pixelMode: PixelMode): void {
    if (this.depth === depth && this.pixelMode === pixelMode) return;
    this.depth = depth;
    this.pixelMode = pixelMode;
    while (this.slots.length < depth) {
      this.slots.push(this.slots.length);
    }
    this.slots = this.slots.slice(0, depth);
    for (let i = 0; i < this.pixels.length; i++) {
      if (this.pixels[i] >= depth) {
        this.pixels[i] = 0;
      }
    }
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
      pixels: Array.from(this.pixels),
    };
    if (this.kind.kind === 'charset') {
      base.char_width = this.kind.charWidth;
      base.char_height = this.kind.charHeight;
      base.char_count = this.kind.charCount;
      base.columns = this.kind.columns;
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

    return new Graphic(
      json.name,
      kind,
      json.width,
      json.height,
      json.depth as ColorDepth,
      json.pixel_mode,
      paletteRef,
      [...json.slots],
      json.transparent_slot,
      new Uint8Array(json.pixels)
    );
  }
}
