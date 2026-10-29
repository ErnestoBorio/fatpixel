import defaultSpriteCsv from '../assets/default_sprite.csv?raw';
import { parseCsvToGraphic } from './importCsv';
import type { Graphic } from './graphic';

/**
 * Creates the default sprite used to initialize a new FatPixel project.
 * Loaded from the exported FatPixel sprite CSV (160×200, 8 bpp, 2:1 fat pixel aspect ratio, VGA 256 palette).
 */
export function createDefaultSprite(): Graphic {
  return parseCsvToGraphic(defaultSpriteCsv, {
    name: "Ghosts 'n' Goblins",
    paletteId: 'vga-256',
    pixelAspectRatio: '2:1',
    bpp: 8,
  });
}
