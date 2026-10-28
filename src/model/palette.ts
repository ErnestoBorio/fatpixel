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

export const DREAN_16_COLORS: Rgb[] = [
  rgbHex(0x000000), // 0: Black
  rgbHex(0x0000ff), // 1: Blue
  rgbHex(0xff0000), // 2: Red
  rgbHex(0xff00ff), // 3: Magenta
  rgbHex(0x00ff00), // 4: Green
  rgbHex(0x00ffff), // 5: Cyan
  rgbHex(0xffff00), // 6: Yellow
  rgbHex(0xffffff), // 7: White
  rgbHex(0xffdbac), // 8: Light Skin
  rgbHex(0x8b4513), // 9: Brown
  rgbHex(0x008080), // 10: Teal
  rgbHex(0x8a2be2), // 11: Violet
  rgbHex(0x87ceeb), // 12: Sky Blue
  rgbHex(0xff8080), // 13: Light Red
  rgbHex(0xababab), // 14: Light Gray
  rgbHex(0x575757), // 15: Dark Gray
];

export const DREAN_COLOR_NAMES = [
  'Black',
  'Blue',
  'Red',
  'Magenta',
  'Green',
  'Cyan',
  'Yellow',
  'White',
  'Light Skin',
  'Brown',
  'Teal',
  'Violet',
  'Sky Blue',
  'Light Red',
  'Light Gray',
  'Dark Gray',
];

export const MONO_2_COLORS: Rgb[] = [
  rgbHex(0x000000), // 0: Black
  rgbHex(0xffffff), // 1: White
];

export const CGA_COOL_COLORS: Rgb[] = [
  rgbHex(0x000000), // 0: Black
  rgbHex(0x55ffff), // 1: Cyan
  rgbHex(0xff55ff), // 2: Magenta
  rgbHex(0xffffff), // 3: White
];

export const CGA_WARM_COLORS: Rgb[] = [
  rgbHex(0x000000), // 0: Black
  rgbHex(0x55ff55), // 1: Green
  rgbHex(0xff5555), // 2: Red
  rgbHex(0xffff55), // 3: Yellow
];

// Alias for backwards compatibility
export const CGA_4_COLORS = CGA_COOL_COLORS;

export const CGA_COOL_NAMES = ['Black', 'Cyan', 'Magenta', 'White'];
export const CGA_WARM_NAMES = ['Black', 'Green', 'Red', 'Yellow'];

export const GAMEBOY_4_COLORS: Rgb[] = [
  rgbHex(0x0f380f), // 0: Darkest Green
  rgbHex(0x306230), // 1: Dark Green
  rgbHex(0x8bac0f), // 2: Light Green
  rgbHex(0x9bbc0f), // 3: Lightest Green
];

export const TELETEXT_8_COLORS: Rgb[] = [
  rgbHex(0x000000), // 0: Black
  rgbHex(0xd70000), // 1: Red
  rgbHex(0x00d700), // 2: Green
  rgbHex(0xd7d700), // 3: Yellow
  rgbHex(0x0000d7), // 4: Blue
  rgbHex(0xd700d7), // 5: Magenta
  rgbHex(0x00d7d7), // 6: Cyan
  rgbHex(0xffffff), // 7: White
];

export const TELETEXT_COLOR_NAMES = [
  'Black',
  'Red',
  'Green',
  'Yellow',
  'Blue',
  'Magenta',
  'Cyan',
  'White',
];

export const ZX_16_COLORS: Rgb[] = [
  // 0-7: Normal intensity (dark)
  rgbHex(0x000000), // 0: Black
  rgbHex(0x0000d7), // 1: Blue
  rgbHex(0xd70000), // 2: Red
  rgbHex(0xd700d7), // 3: Magenta
  rgbHex(0x00d700), // 4: Green
  rgbHex(0x00d7d7), // 5: Cyan
  rgbHex(0xd7d700), // 6: Yellow
  rgbHex(0xd7d7d7), // 7: Grey (Dark White)
  // 8-15: Bright intensity (light)
  rgbHex(0x000000), // 8: Bright Black (just black)
  rgbHex(0x0000ff), // 9: Bright Blue
  rgbHex(0xff0000), // 10: Bright Red
  rgbHex(0xff00ff), // 11: Bright Magenta
  rgbHex(0x00ff00), // 12: Bright Green
  rgbHex(0x00ffff), // 13: Bright Cyan
  rgbHex(0xffff00), // 14: Bright Yellow
  rgbHex(0xffffff), // 15: Bright White
];

export const ZX_COLOR_NAMES = [
  'Black',
  'Blue',
  'Red',
  'Magenta',
  'Green',
  'Cyan',
  'Yellow',
  'Grey',
  'Bright Black',
  'Bright Blue',
  'Bright Red',
  'Bright Magenta',
  'Bright Green',
  'Bright Cyan',
  'Bright Yellow',
  'Bright White',
];

// Alias for backwards compatibility
export const ZX_8_COLORS = ZX_16_COLORS.slice(0, 8);

export function createVga256Colors(): Rgb[] {
  const colors: Rgb[] = [];
  // 0-15: Standard 16 CGA/EGA colors
  const standard16 = [
    0x000000, 0x0000aa, 0x00aa00, 0x00aaaa,
    0xaa0000, 0xaa00aa, 0xaa5500, 0xaaaaaa,
    0x555555, 0x5555ff, 0x55ff55, 0x55ffff,
    0xff5555, 0xff55ff, 0xffff55, 0xffffff,
  ];
  for (const hex of standard16) {
    colors.push(rgbHex(hex));
  }
  // 16-231: 6x6x6 color cube (216 colors)
  const steps = [0, 51, 102, 153, 204, 255];
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        colors.push({ r: steps[r], g: steps[g], b: steps[b] });
      }
    }
  }
  // 232-255: 24 grayscale steps
  for (let i = 0; i < 24; i++) {
    const val = Math.round((i + 1) * (255 / 25));
    colors.push({ r: val, g: val, b: val });
  }
  return colors;
}

export const VGA_256_COLORS: Rgb[] = createVga256Colors();

export const DEFAULT_PALETTE_ID = 'c64-pepto';

export function isPowerOfTwo(n: number): boolean {
  return n >= 2 && n <= 256 && (n & (n - 1)) === 0;
}

export const BUILTIN_PALETTES: Palette[] = [
  {
    id: DEFAULT_PALETTE_ID,
    name: 'Commodore 64 (16)',
    colors: C64_PEPTO_COLORS,
  },
  {
    id: 'zx-16',
    name: 'ZX Spectrum (16)',
    colors: ZX_16_COLORS,
  },
  {
    id: 'drean-16',
    name: 'Drean 64 (16)',
    colors: DREAN_16_COLORS,
  },
  {
    id: 'vga-256',
    name: 'VGA Mode 13h (256)',
    colors: VGA_256_COLORS,
  },
  {
    id: 'teletext-8',
    name: 'Teletext / RGB (8)',
    colors: TELETEXT_8_COLORS,
  },
  {
    id: 'cga-cool-4',
    name: 'CGA Cool (4)',
    colors: CGA_COOL_COLORS,
  },
  {
    id: 'cga-warm-4',
    name: 'CGA Warm (4)',
    colors: CGA_WARM_COLORS,
  },
  {
    id: 'gameboy-4',
    name: 'Game Boy (4)',
    colors: GAMEBOY_4_COLORS,
  },
  {
    id: 'mono-2',
    name: 'Monochrome (2)',
    colors: MONO_2_COLORS,
  },
];

export function getBuiltinPalette(id: string): Palette | undefined {
  if (id === 'cga-4') return BUILTIN_PALETTES.find((p) => p.id === 'cga-cool-4');
  if (id === 'zx-8') return BUILTIN_PALETTES.find((p) => p.id === 'zx-16');
  return BUILTIN_PALETTES.find((p) => p.id === id);
}

export function defaultPalette(): Palette {
  return BUILTIN_PALETTES[0];
}

export function getColorName(paletteId: string, colorIndex: number): string {
  if (paletteId === 'drean-16') {
    return DREAN_COLOR_NAMES[colorIndex] ?? `Color #${colorIndex}`;
  }
  if (paletteId === DEFAULT_PALETTE_ID) {
    return C64_COLOR_NAMES[colorIndex] ?? `Color #${colorIndex}`;
  }
  if (paletteId === 'zx-16' || paletteId === 'zx-8') {
    return ZX_COLOR_NAMES[colorIndex] ?? `Color #${colorIndex}`;
  }
  if (paletteId === 'cga-cool-4' || paletteId === 'cga-4') {
    return CGA_COOL_NAMES[colorIndex] ?? `Color #${colorIndex}`;
  }
  if (paletteId === 'cga-warm-4') {
    return CGA_WARM_NAMES[colorIndex] ?? `Color #${colorIndex}`;
  }
  if (paletteId === 'teletext-8') {
    return TELETEXT_COLOR_NAMES[colorIndex] ?? `Color #${colorIndex}`;
  }
  return `Color #${colorIndex}`;
}
