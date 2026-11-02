import { describe, it, expect } from 'vitest';
import { parseCsvToGraphic } from './importCsv';
import { exportGraphicToCsv } from './exportCsv';
import { Graphic } from './graphic';
import { createDefaultSprite } from './defaultSprite';
import { Project } from './project';

describe('importCsv', () => {
  it('parses basic CSV pixel grid into a Graphic sprite', () => {
    const csv = `
0, 1, 0
1, 0, 1
0, 1, 0
    `.trim();

    const g = parseCsvToGraphic(csv, { name: 'test_cross' });
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

  it('detects 8bpp and VGA-256 palette for high color indices', () => {
    const csv = `
16, 15, 250
14, 62, 111
    `.trim();

    const g = parseCsvToGraphic(csv);
    expect(g.width).toBe(3);
    expect(g.height).toBe(2);
    expect(g.bpp).toBe(8);
    expect(g.depth).toBe(256);
    expect(g.palette.id).toBe('vga-256');
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
    expect(sprite.palette.id).toBe('vga-256');
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
    expect(initialGraphic.palette.id).toBe('vga-256');
  });

  it('throws an error on empty CSV', () => {
    expect(() => parseCsvToGraphic('')).toThrow('empty');
  });

  it('exports and imports a Charset in sequential ROM order (one value per pixel)', () => {
    const charset = Graphic.newCharset('test_font', 8, 8, 256, 16);
    // Draw a pattern in Char 0
    charset.setCharPixel(0, 0, 0, 1);
    charset.setCharPixel(0, 7, 7, 1);
    // Draw a pattern in Char 1
    charset.setCharPixel(1, 3, 3, 1);
    charset.setCharPixel(1, 4, 4, 1);

    const csv = exportGraphicToCsv(charset);
    const lines = csv.trim().split('\n');
    expect(lines.length).toBe(256 * 8); // 2048 scanlines total

    // Verify Char 0 scanline 0 (line 0)
    expect(lines[0]).toBe('1,0,0,0,0,0,0,0');
    // Verify Char 0 scanline 7 (line 7)
    expect(lines[7]).toBe('0,0,0,0,0,0,0,1');
    // Verify Char 1 scanline 3 (line 8 + 3 = 11)
    expect(lines[11]).toBe('0,0,0,1,0,0,0,0');
    // Verify Char 1 scanline 4 (line 8 + 4 = 12)
    expect(lines[12]).toBe('0,0,0,0,1,0,0,0');

    // Round-trip import
    const imported = parseCsvToGraphic(csv, { name: 'reimported_font' });
    expect(imported.isCharset()).toBe(true);
    expect(imported.width).toBe(8);
    expect(imported.height).toBe(8);
    expect(imported.charsetInfo()?.charCount).toBe(256);
    expect(imported.getCharPixel(0, 0, 0)).toBe(1);
    expect(imported.getCharPixel(0, 7, 7)).toBe(1);
    expect(imported.getCharPixel(1, 3, 3)).toBe(1);
    expect(imported.getCharPixel(1, 4, 4)).toBe(1);
    expect(imported.getCharPixel(0, 1, 0)).toBe(0);
  });

  it('imports petscii.hu packed 1bpp bytes CSV format (256 lines x 8 bytes)', () => {
    // 256 lines of 8 packed bytes (simulating petscii.krissz.hu arcade.csv)
    const lines: string[] = [];
    for (let c = 0; c < 256; c++) {
      if (c === 65) {
        // Character 'A' on line 66 / index 65:
        // 56, 108, 198, 198, 254, 198, 198, 0
        lines.push(' 56,108,198,198,254,198,198,  0,');
      } else {
        lines.push('  0,  0,  0,  0,  0,  0,  0,  0,');
      }
    }
    const csv = lines.join('\n');
    const imported = parseCsvToGraphic(csv, { name: 'petscii_arcade' });
    expect(imported.isCharset()).toBe(true);
    expect(imported.width).toBe(8);
    expect(imported.height).toBe(8);
    expect(imported.charsetInfo()?.charCount).toBe(256);
    expect(imported.bpp).toBe(1);

    // Verify unpacked bits for Character 'A' (index 65)
    // Row 0: 56 = 00111000
    expect(imported.getCharPixel(65, 0, 0)).toBe(0);
    expect(imported.getCharPixel(65, 1, 0)).toBe(0);
    expect(imported.getCharPixel(65, 2, 0)).toBe(1);
    expect(imported.getCharPixel(65, 3, 0)).toBe(1);
    expect(imported.getCharPixel(65, 4, 0)).toBe(1);
    expect(imported.getCharPixel(65, 5, 0)).toBe(0);

    // Row 4: 254 = 11111110
    for (let x = 0; x < 7; x++) {
      expect(imported.getCharPixel(65, x, 4)).toBe(1);
    }
    expect(imported.getCharPixel(65, 7, 4)).toBe(0);

    // Row 7: 0
    for (let x = 0; x < 8; x++) {
      expect(imported.getCharPixel(65, x, 7)).toBe(0);
    }
  });
});

