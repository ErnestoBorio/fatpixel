export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function rgbHex(hex: number): Rgb {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff,
  };
}

export function rgbToHexStr(rgb: Rgb): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function hexStrToRgb(str: string): Rgb {
  const hex = parseInt(str.replace(/^#/, ''), 16);
  return rgbHex(hex);
}

export interface Palette {
  id: string;
  name: string;
  colors: Rgb[];
}

export type PaletteRef =
  | { kind: 'builtin'; id: string }
  | { kind: 'custom'; id: string };

export function parsePaletteRef(str: string): PaletteRef {
  if (str.startsWith('builtin:')) {
    return { kind: 'builtin', id: str.slice(8) };
  }
  if (str.startsWith('custom:')) {
    return { kind: 'custom', id: str.slice(7) };
  }
  return { kind: 'builtin', id: str };
}

export function paletteRefToString(ref: PaletteRef): string {
  return `${ref.kind}:${ref.id}`;
}

export const C64_PEPTO_COLORS: Rgb[] = [
  rgbHex(0x000000), // 0: Black
  rgbHex(0xffffff), // 1: White
  rgbHex(0x880000), // 2: Red
  rgbHex(0xaaffee), // 3: Cyan
  rgbHex(0xcc44cc), // 4: Purple
  rgbHex(0x00cc55), // 5: Green
  rgbHex(0x0000aa), // 6: Blue
  rgbHex(0xeeee77), // 7: Yellow
  rgbHex(0xdd8855), // 8: Orange
  rgbHex(0x664400), // 9: Brown
  rgbHex(0xff7777), // 10: Light Red
  rgbHex(0x333333), // 11: Dark Grey
  rgbHex(0x777777), // 12: Grey
  rgbHex(0xaaff66), // 13: Light Green
  rgbHex(0x0088ff), // 14: Light Blue
  rgbHex(0xbbbbbb), // 15: Light Grey
];

export const C64_COLOR_NAMES = [
  'Black',
  'White',
  'Red',
  'Cyan',
  'Purple',
  'Green',
  'Blue',
  'Yellow',
  'Orange',
  'Brown',
  'Light Red',
  'Dark Grey',
  'Grey',
  'Light Green',
  'Light Blue',
  'Light Grey',
];

export const DEFAULT_PALETTE_ID = 'c64-pepto';

export const BUILTIN_PALETTES: Palette[] = [
  {
    id: DEFAULT_PALETTE_ID,
    name: 'Commodore 64 (Pepto)',
    colors: C64_PEPTO_COLORS,
  },
];

export function getBuiltinPalette(id: string): Palette | undefined {
  return BUILTIN_PALETTES.find((p) => p.id === id);
}

export function defaultPalette(): Palette {
  return BUILTIN_PALETTES[0];
}
