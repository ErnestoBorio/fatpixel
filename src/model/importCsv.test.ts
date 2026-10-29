import { describe, it, expect } from 'vitest';
import { parseCsvToGraphic } from './importCsv';
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
    expect(sprite.name).toBe('FatPixel');
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
    expect(initialGraphic.name).toBe('FatPixel');
    expect(initialGraphic.width).toBe(160);
    expect(initialGraphic.height).toBe(200);
    expect(initialGraphic.bpp).toBe(8);
    expect(initialGraphic.pixelAspectRatio).toBe('2:1');
    expect(initialGraphic.palette.id).toBe('vga-256');
  });

  it('throws an error on empty CSV', () => {
    expect(() => parseCsvToGraphic('')).toThrow('empty');
  });
});
