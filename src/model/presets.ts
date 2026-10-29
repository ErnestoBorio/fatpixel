import type { Bpp, PixelAspectRatio } from './graphic';

export interface SystemPreset {
  id: string;
  name: string;
  paletteId: string;
  sprite: {
    bpp: Bpp;
    pixelAspectRatio: PixelAspectRatio;
    width?: number;
    height?: number;
  };
  charset: {
    bpp: Bpp;
    pixelAspectRatio: PixelAspectRatio;
    charWidth: number;
    charHeight: number;
  };
}

export const SYSTEM_PRESETS: SystemPreset[] = [
  {
    id: 'c64',
    name: 'Commodore 64',
    paletteId: 'c64-pepto',
    sprite: {
      bpp: 2,
      pixelAspectRatio: '2:1',
      width: 12,
      height: 21,
    },
    charset: {
      bpp: 1,
      pixelAspectRatio: '1:1',
      charWidth: 8,
      charHeight: 8,
    },
  },
  {
    id: 'gameboy',
    name: 'Game Boy',
    paletteId: 'gameboy-4',
    sprite: {
      bpp: 2,
      pixelAspectRatio: '1:1',
    },
    charset: {
      bpp: 1,
      pixelAspectRatio: '1:1',
      charWidth: 8,
      charHeight: 8,
    },
  },
  {
    id: 'zx-spectrum',
    name: 'ZX Spectrum',
    paletteId: 'zx-16',
    sprite: {
      bpp: 4,
      pixelAspectRatio: '1:1',
    },
    charset: {
      bpp: 4,
      pixelAspectRatio: '1:1',
      charWidth: 8,
      charHeight: 8,
    },
  },
  {
    id: 'ibm-pc',
    name: 'IBM PC',
    paletteId: 'vga-256',
    sprite: {
      bpp: 8,
      pixelAspectRatio: '1:1',
    },
    charset: {
      bpp: 1,
      pixelAspectRatio: '1:1',
      charWidth: 9,
      charHeight: 14,
    },
  },
  {
    id: 'nes',
    name: 'NES',
    paletteId: 'nes-64',
    sprite: {
      bpp: 2,
      pixelAspectRatio: '1:1',
    },
    charset: {
      bpp: 2,
      pixelAspectRatio: '1:1',
      charWidth: 8,
      charHeight: 8,
    },
  },
];
