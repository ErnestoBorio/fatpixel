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
  rgbHex(0x9bbc0f), // 0 (00): Lightest Green (brightest)
  rgbHex(0x8bac0f), // 1 (01): Light Green
  rgbHex(0x306230), // 2 (10): Dark Green
  rgbHex(0x0f380f), // 3 (11): Darkest Green (darkest)
];

export const GAMEBOY_COLOR_NAMES = [
  'Lightest Green (White)',
  'Light Green',
  'Dark Green',
  'Darkest Green (Black)',
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

export const PICO_8_COLORS: Rgb[] = [
  rgbHex(0x000000), // 0: Black
  rgbHex(0x1d2b53), // 1: Dark Blue
  rgbHex(0x7e2553), // 2: Dark Purple
  rgbHex(0x008751), // 3: Dark Green
  rgbHex(0xab5236), // 4: Brown
  rgbHex(0x5f574f), // 5: Dark Gray
  rgbHex(0xc2c3c7), // 6: Light Gray
  rgbHex(0xfff1e8), // 7: White
  rgbHex(0xff004d), // 8: Red
  rgbHex(0xffa300), // 9: Orange
  rgbHex(0xffec27), // 10: Yellow
  rgbHex(0x00e436), // 11: Green
  rgbHex(0x29adff), // 12: Blue
  rgbHex(0x83769c), // 13: Lavender
  rgbHex(0xff77a8), // 14: Pink
  rgbHex(0xffccaa), // 15: Peach
];

export const PICO_8_NAMES = [
  'Black',
  'Dark Blue',
  'Dark Purple',
  'Dark Green',
  'Brown',
  'Dark Gray',
  'Light Gray',
  'White',
  'Red',
  'Orange',
  'Yellow',
  'Green',
  'Blue',
  'Lavender',
  'Pink',
  'Peach',
];

export const EGA_16_COLORS: Rgb[] = [
  rgbHex(0x000000), // 0: Black
  rgbHex(0x0000aa), // 1: Blue
  rgbHex(0x00aa00), // 2: Green
  rgbHex(0x00aaaa), // 3: Cyan
  rgbHex(0xaa0000), // 4: Red
  rgbHex(0xaa00aa), // 5: Magenta
  rgbHex(0xaa5500), // 6: Brown
  rgbHex(0xaaaaaa), // 7: Light Gray
  rgbHex(0x555555), // 8: Dark Gray
  rgbHex(0x5555ff), // 9: Bright Blue
  rgbHex(0x55ff55), // 10: Bright Green
  rgbHex(0x55ffff), // 11: Bright Cyan
  rgbHex(0xff5555), // 12: Bright Red
  rgbHex(0xff55ff), // 13: Bright Magenta
  rgbHex(0xffff55), // 14: Yellow
  rgbHex(0xffffff), // 15: Bright White
];

export const EGA_COLOR_NAMES = [
  'Black',
  'Blue',
  'Green',
  'Cyan',
  'Red',
  'Magenta',
  'Brown',
  'Light Gray',
  'Dark Gray',
  'Bright Blue',
  'Bright Green',
  'Bright Cyan',
  'Bright Red',
  'Bright Magenta',
  'Yellow',
  'Bright White',
];

export const MSX_16_COLORS: Rgb[] = [
  rgbHex(0x000000), // 0: Transparent
  rgbHex(0x000000), // 1: Black
  rgbHex(0x3eb849), // 2: Medium Green
  rgbHex(0x74d07d), // 3: Light Green
  rgbHex(0x5955e0), // 4: Dark Blue
  rgbHex(0x8076f1), // 5: Light Blue
  rgbHex(0xb95e51), // 6: Dark Red
  rgbHex(0x65dbef), // 7: Cyan
  rgbHex(0xdb6559), // 8: Medium Red
  rgbHex(0xff897d), // 9: Light Red
  rgbHex(0xccc35e), // 10: Dark Yellow
  rgbHex(0xded087), // 11: Light Yellow
  rgbHex(0x3aa241), // 12: Dark Green
  rgbHex(0xb766b5), // 13: Magenta
  rgbHex(0xcccccc), // 14: Gray
  rgbHex(0xffffff), // 15: White
];

export const MSX_COLOR_NAMES = [
  'Transparent',
  'Black',
  'Medium Green',
  'Light Green',
  'Dark Blue',
  'Light Blue',
  'Dark Red',
  'Cyan',
  'Medium Red',
  'Light Red',
  'Dark Yellow',
  'Light Yellow',
  'Dark Green',
  'Magenta',
  'Gray',
  'White',
];

export const APPLE_II_16_COLORS: Rgb[] = [
  rgbHex(0x000000), // 0: Black
  rgbHex(0x901740), // 1: Deep Red
  rgbHex(0x402ca5), // 2: Dark Blue
  rgbHex(0xd043e5), // 3: Purple
  rgbHex(0x006940), // 4: Dark Green
  rgbHex(0x808080), // 5: Dark Gray
  rgbHex(0x2f95e5), // 6: Medium Blue
  rgbHex(0xbfabff), // 7: Light Blue
  rgbHex(0x405400), // 8: Brown
  rgbHex(0xdf6b00), // 9: Orange
  rgbHex(0xa0a0a0), // 10: Light Gray
  rgbHex(0xff8c85), // 11: Pink
  rgbHex(0x2fd340), // 12: Light Green
  rgbHex(0xdfe840), // 13: Yellow
  rgbHex(0x6fe5a5), // 14: Aquamarine
  rgbHex(0xffffff), // 15: White
];

export const APPLE_II_COLOR_NAMES = [
  'Black',
  'Deep Red',
  'Dark Blue',
  'Purple',
  'Dark Green',
  'Dark Gray',
  'Medium Blue',
  'Light Blue',
  'Brown',
  'Orange',
  'Light Gray',
  'Pink',
  'Light Green',
  'Yellow',
  'Aquamarine',
  'White',
];

export const AMIGA_32_COLORS: Rgb[] = [
  rgbHex(0x0055aa), // 0: Workbench Blue
  rgbHex(0xffffff), // 1: White
  rgbHex(0x000000), // 2: Black
  rgbHex(0xff8800), // 3: Orange
  rgbHex(0x555555), // 4: Dark Gray
  rgbHex(0xaaaaaa), // 5: Light Gray
  rgbHex(0x0088ff), // 6: Sky Blue
  rgbHex(0xee0000), // 7: Red
  rgbHex(0x00cc00), // 8: Green
  rgbHex(0x0000cc), // 9: Deep Blue
  rgbHex(0xeeee00), // 10: Yellow
  rgbHex(0xcc00cc), // 11: Magenta
  rgbHex(0x00cccc), // 12: Cyan
  rgbHex(0x884400), // 13: Brown
  rgbHex(0xffaaaa), // 14: Light Red
  rgbHex(0xaaffaa), // 15: Light Green
  rgbHex(0xaaaaff), // 16: Light Blue
  rgbHex(0xffcc88), // 17: Peach
  rgbHex(0x662200), // 18: Dark Brown
  rgbHex(0x333333), // 19: Charcoal
  rgbHex(0x666666), // 20: Medium Gray
  rgbHex(0xcccccc), // 21: Silver
  rgbHex(0x880000), // 22: Crimson
  rgbHex(0x005500), // 23: Forest Green
  rgbHex(0x000066), // 24: Navy
  rgbHex(0x999900), // 25: Olive
  rgbHex(0x660066), // 26: Purple
  rgbHex(0x006666), // 27: Teal
  rgbHex(0xff5500), // 28: Amber
  rgbHex(0xff8888), // 29: Coral
  rgbHex(0xffff88), // 30: Pale Yellow
  rgbHex(0x88ff88), // 31: Pale Green
];

export const AMIGA_COLOR_NAMES = [
  'Workbench Blue',
  'White',
  'Black',
  'Orange',
  'Dark Gray',
  'Light Gray',
  'Sky Blue',
  'Red',
  'Green',
  'Deep Blue',
  'Yellow',
  'Magenta',
  'Cyan',
  'Brown',
  'Light Red',
  'Light Green',
  'Light Blue',
  'Peach',
  'Dark Brown',
  'Charcoal',
  'Medium Gray',
  'Silver',
  'Crimson',
  'Forest Green',
  'Navy',
  'Olive',
  'Purple',
  'Teal',
  'Amber',
  'Coral',
  'Pale Yellow',
  'Pale Green',
];

export const NES_64_COLORS: Rgb[] = [
  // Row 0
  0x666666, 0x002a88, 0x1412a7, 0x3b00a4, 0x5c007e, 0x6e0040, 0x6c0600, 0x561d00,
  0x333500, 0x0b4800, 0x005200, 0x004f08, 0x00404d, 0x000000, 0x000000, 0x000000,
  // Row 1
  0xadadad, 0x155fd9, 0x4240ff, 0x7527fe, 0xa01acc, 0xb71e7b, 0xb53120, 0x994e00,
  0x6b6d00, 0x388700, 0x0c9300, 0x008f32, 0x007c8d, 0x000000, 0x000000, 0x000000,
  // Row 2
  0xffffff, 0x64b0ff, 0x9290ff, 0xc676ff, 0xf36aff, 0xfe6ecc, 0xfe8170, 0xea9e22,
  0xbcbe00, 0x88d800, 0x5ce430, 0x45e082, 0x48cdde, 0x4f4f4f, 0x000000, 0x000000,
  // Row 3
  0xffffff, 0xc0e0ff, 0xd3d2ff, 0xe8c8ff, 0xfbc2ff, 0xfec4ea, 0xfeccc5, 0xf7d8a5,
  0xe4e594, 0xcfef96, 0xbdf4ab, 0xb3f3cc, 0xb5ebf2, 0xb8b8b8, 0x000000, 0x000000,
].map(rgbHex);

export function createSegaMasterSystemColors(): Rgb[] {
  const steps = [0, 85, 170, 255];
  const colors: Rgb[] = [];
  for (let r = 0; r < 4; r++) {
    for (let g = 0; g < 4; g++) {
      for (let b = 0; b < 4; b++) {
        colors.push({ r: steps[r], g: steps[g], b: steps[b] });
      }
    }
  }
  return colors;
}

export const SEGA_MASTER_SYSTEM_64_COLORS: Rgb[] = createSegaMasterSystemColors();

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
    id: 'drean-16',
    name: 'Drean 64 (16)',
    colors: DREAN_16_COLORS,
  },
  {
    id: 'zx-16',
    name: 'ZX Spectrum (16)',
    colors: ZX_16_COLORS,
  },
  {
    id: 'pico-8',
    name: 'PICO-8 (16)',
    colors: PICO_8_COLORS,
  },
  {
    id: 'ega-16',
    name: 'IBM PC EGA (16)',
    colors: EGA_16_COLORS,
  },
  {
    id: 'msx-16',
    name: 'MSX / TMS9918A (16)',
    colors: MSX_16_COLORS,
  },
  {
    id: 'apple-ii-16',
    name: 'Apple II (16)',
    colors: APPLE_II_16_COLORS,
  },
  {
    id: 'amiga-32',
    name: 'Commodore Amiga (32)',
    colors: AMIGA_32_COLORS,
  },
  {
    id: 'nes-64',
    name: 'NES / Famicom (64)',
    colors: NES_64_COLORS,
  },
  {
    id: 'sms-64',
    name: 'Sega Master System (64)',
    colors: SEGA_MASTER_SYSTEM_64_COLORS,
  },
  {
    id: 'vga-256',
    name: 'VGA',
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
  if (paletteId === 'pico-8') {
    return PICO_8_NAMES[colorIndex] ?? `Color #${colorIndex}`;
  }
  if (paletteId === 'ega-16') {
    return EGA_COLOR_NAMES[colorIndex] ?? `Color #${colorIndex}`;
  }
  if (paletteId === 'msx-16') {
    return MSX_COLOR_NAMES[colorIndex] ?? `Color #${colorIndex}`;
  }
  if (paletteId === 'apple-ii-16') {
    return APPLE_II_COLOR_NAMES[colorIndex] ?? `Color #${colorIndex}`;
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
  if (paletteId === 'amiga-32') {
    return AMIGA_COLOR_NAMES[colorIndex] ?? `Color #${colorIndex}`;
  }
  if (paletteId === 'gameboy-4') {
    return GAMEBOY_COLOR_NAMES[colorIndex] ?? `Color #${colorIndex}`;
  }
  return `Color #${colorIndex}`;
}
