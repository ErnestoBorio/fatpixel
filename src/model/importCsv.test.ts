import { describe, it, expect } from 'vitest';
import { parseCsvToGraphic } from './importCsv';
import { exportGraphicToCsv } from './exportCsv';
import { Graphic } from './graphic';
import { createDefaultSprite } from './defaultSprite';
import { Project } from './project';

describe('importCsv', () => {
  it('parses basic CSV pixel grid with Fatpixel header into a Graphic sprite', () => {
    const csv = `
# Fatpixel; sprite; test_cross; 3x3; 1bpp; 1:1; Commodore 64
0, 1, 0
1, 0, 1
0, 1, 0
    `.trim();

    const g = parseCsvToGraphic(csv);
    expect(g.name).toBe('test_cross');
    expect(g.width).toBe(3);
    expect(g.height).toBe(3);
    expect(g.bpp).toBe(1);
    expect(g.depth).toBe(2);
    expect(g.pixelAspectRatio).toBe('1:1');
    expect(g.get(0, 0)).toBe(0);
    expect(g.get(1, 0)).toBe(1);
    expect(g.get(1, 1)).toBe(0);
  });

  it('reads 8bpp and VGA palette from header', () => {
    const csv = `
# Fatpixel; sprite; test_vga; 3x2; 8bpp; 1:1; VGA
16, 15, 250
14, 62, 111
    `.trim();

    const g = parseCsvToGraphic(csv);
    expect(g.name).toBe('test_vga');
    expect(g.width).toBe(3);
    expect(g.height).toBe(2);
    expect(g.bpp).toBe(8);
    expect(g.depth).toBe(256);
    expect(g.palette.id).toBe('vga');
    expect(g.get(0, 0)).toBe(16);
    expect(g.get(2, 0)).toBe(250);
  });

  it('parses the default FatPixel sprite correctly', () => {
    const sprite = createDefaultSprite();
    expect(sprite.name).toBe("Ghosts 'n' Goblins");
    expect(sprite.width).toBe(160);
    expect(sprite.height).toBe(200);
    expect(sprite.bpp).toBe(8);
    expect(sprite.depth).toBe(256);
    expect(sprite.pixelAspectRatio).toBe('2:1');
    expect(sprite.palette.id).toBe('vga');
    expect(sprite.pixels.length).toBe(160 * 200);

    // Verify key pixel indices
    expect(sprite.get(0, 0)).toBe(16); // black background
    expect(sprite.get(150, 0)).toBe(15); // white text at top right
  });

  it('initializes a new Project with the FatPixel sprite', () => {
    const project = new Project();
    expect(project.graphics.length).toBe(1);
    const initialGraphic = project.graphics[0];
    expect(initialGraphic.name).toBe("Ghosts 'n' Goblins");
    expect(initialGraphic.width).toBe(160);
    expect(initialGraphic.height).toBe(200);
    expect(initialGraphic.bpp).toBe(8);
    expect(initialGraphic.pixelAspectRatio).toBe('2:1');
    expect(initialGraphic.palette.id).toBe('vga');
  });

  it('throws an error on empty CSV', () => {
    expect(() => parseCsvToGraphic('')).toThrow('empty');
  });

  it('throws a descriptive error when CSV lacks the # Fatpixel header', () => {
    const headerlessCsv = `
0, 1, 0
1, 0, 1
0, 1, 0
    `.trim();
    expect(() => parseCsvToGraphic(headerlessCsv)).toThrow(/Missing required FatPixel header/i);
  });

  it('exports and imports a Charset with # Fatpixel header in sequential ROM order', () => {
    const charset = Graphic.newCharset('PETSCII', 8, 8, 256, 16);
    charset.palette = { kind: 'builtin', id: 'drean-64' };
    charset.pixelAspectRatio = '1:1';
    // Draw a pattern in Char 0
    charset.setCharPixel(0, 0, 0, 1);
    charset.setCharPixel(0, 7, 7, 1);
    // Draw a pattern in Char 1
    charset.setCharPixel(1, 3, 3, 1);
    charset.setCharPixel(1, 4, 4, 1);

    const csv = exportGraphicToCsv(charset);
    const lines = csv.trim().split('\n');
    expect(lines.length).toBe(1 + 256 * 8); // 1 header line + 2048 scanlines

    // Verify header line
    expect(lines[0]).toBe('# Fatpixel; charset; PETSCII; 8x8; 1bpp; 1:1; Drean 64');

    // Verify Char 0 scanline 0 (line 1)
    expect(lines[1]).toBe('1,0,0,0,0,0,0,0');
    // Verify Char 0 scanline 7 (line 1 + 7 = 8)
    expect(lines[8]).toBe('0,0,0,0,0,0,0,1');
    // Verify Char 1 scanline 3 (line 1 + 8 + 3 = 12)
    expect(lines[12]).toBe('0,0,0,1,0,0,0,0');
    // Verify Char 1 scanline 4 (line 1 + 8 + 4 = 13)
    expect(lines[13]).toBe('0,0,0,0,1,0,0,0');

    // Round-trip import without passing options: all metadata should be inferred from header!
    const imported = parseCsvToGraphic(csv);
    expect(imported.isCharset()).toBe(true);
    expect(imported.name).toBe('PETSCII');
    expect(imported.width).toBe(8);
    expect(imported.height).toBe(8);
    expect(imported.bpp).toBe(1);
    expect(imported.pixelAspectRatio).toBe('1:1');
    expect(imported.palette.id).toBe('drean-64');
    expect(imported.charsetInfo()?.charCount).toBe(256);
    expect(imported.getCharPixel(0, 0, 0)).toBe(1);
    expect(imported.getCharPixel(0, 7, 7)).toBe(1);
    expect(imported.getCharPixel(1, 3, 3)).toBe(1);
    expect(imported.getCharPixel(1, 4, 4)).toBe(1);
    expect(imported.getCharPixel(0, 1, 0)).toBe(0);
  });

  it('exports and imports a Sprite with # Fatpixel header', () => {
    const sprite = Graphic.newSprite('Dragon', 24, 21, 4, 'wide'); // 2bpp, 2:1
    sprite.palette = { kind: 'builtin', id: 'c64-pepto' };
    sprite.set(0, 0, 1);
    sprite.set(23, 20, 3);

    const csv = exportGraphicToCsv(sprite);
    const lines = csv.trim().split('\n');
    expect(lines.length).toBe(1 + 21); // 1 header line + 21 rows

    // Verify header line
    expect(lines[0]).toBe('# Fatpixel; sprite; Dragon; 24x21; 2bpp; 2:1; Commodore 64');
    expect(lines[1].split(',').length).toBe(24);

    // Round-trip import without options
    const imported = parseCsvToGraphic(csv);
    expect(imported.isSprite()).toBe(true);
    expect(imported.name).toBe('Dragon');
    expect(imported.width).toBe(24);
    expect(imported.height).toBe(21);
    expect(imported.bpp).toBe(2);
    expect(imported.pixelAspectRatio).toBe('2:1');
    expect(imported.palette.id).toBe('c64-pepto');
    expect(imported.get(0, 0)).toBe(1);
    expect(imported.get(23, 20)).toBe(3);
  });
});
