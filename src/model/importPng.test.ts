import { describe, it, expect } from 'vitest';
import { createGraphicFromRgba, createCharsetFromRgbaSheet, findClosestVgaColorIndex } from './importPng';
import { VGA_256_COLORS } from './palette';

describe('importPng module', () => {
  it('finds closest VGA color index', () => {
    // Pure black maps to 16 (first 6x6x6 cube black, preserving 0 for transparency)
    const blackIdx = findClosestVgaColorIndex(0, 0, 0);
    expect(blackIdx).toBe(16);
    expect(VGA_256_COLORS[blackIdx]).toEqual({ r: 0, g: 0, b: 0 });

    // Pure white maps to 15 (standard EGA white) or 231 (6x6x6 cube white)
    const whiteIdx = findClosestVgaColorIndex(255, 255, 255);
    const whiteCol = VGA_256_COLORS[whiteIdx];
    expect(whiteCol).toEqual({ r: 255, g: 255, b: 255 });

    // Red
    const redIdx = findClosestVgaColorIndex(255, 0, 0);
    const redCol = VGA_256_COLORS[redIdx];
    expect(redCol.r).toBeGreaterThan(150);
    expect(redCol.g).toBe(0);
    expect(redCol.b).toBe(0);
  });

  it('creates an 8bpp sprite with VGA palette from RGBA data', () => {
    // 2x2 image:
    // [0,0] = pure red opaque
    // [1,0] = pure green opaque
    // [0,1] = pure black opaque
    // [1,1] = transparent
    const rgba = new Uint8ClampedArray([
      255, 0, 0, 255,   // red
      0, 255, 0, 255,   // green
      0, 0, 0, 255,     // black
      0, 0, 0, 0,       // transparent
    ]);

    const sprite = createGraphicFromRgba('test_hero', 2, 2, rgba);

    expect(sprite.name).toBe('test_hero');
    expect(sprite.width).toBe(2);
    expect(sprite.height).toBe(2);
    expect(sprite.depth).toBe(256);
    expect(sprite.bpp).toBe(8);
    expect(sprite.pixelAspectRatio).toBe('1:1');
    expect(sprite.palette).toEqual({ kind: 'builtin', id: 'vga' });
    expect(sprite.transparentSlot).toBe(0);

    // [0,0] red -> VGA red index
    const redCol = VGA_256_COLORS[sprite.get(0, 0)!];
    expect(redCol.r).toBeGreaterThan(150);
    expect(redCol.g).toBe(0);

    // [1,0] green -> VGA green index
    const greenCol = VGA_256_COLORS[sprite.get(1, 0)!];
    expect(greenCol.g).toBeGreaterThan(150);

    // [0,1] black -> index 16 (opaque black)
    expect(sprite.get(0, 1)).toBe(16);

    // [1,1] transparent -> 0
    expect(sprite.get(1, 1)).toBe(0);
  });

  it('sets transparentSlot to null when no transparent pixels exist', () => {
    const rgba = new Uint8ClampedArray([
      255, 255, 255, 255,
      100, 100, 100, 255,
    ]);

    const sprite = createGraphicFromRgba('opaque_sprite', 2, 1, rgba);
    expect(sprite.transparentSlot).toBeNull();
  });

  it('supports down-sampling the imported 8bpp sprite to lower BPP with setBpp', () => {
    const rgba = new Uint8ClampedArray([
      255, 0, 0, 255, // red
      0, 255, 0, 255, // green
      0, 0, 255, 255, // blue
      255, 255, 0, 255, // yellow
    ]);

    const sprite = createGraphicFromRgba('downsample_test', 4, 1, rgba);
    expect(sprite.depth).toBe(256);
    expect(sprite.bpp).toBe(8);

    // Downsample to 2 BPP (4 colors)
    sprite.setBpp(2);
    expect(sprite.bpp).toBe(2);
    expect(sprite.depth).toBe(4);
    expect(sprite.slots.length).toBe(4);
  });

  it('slices a 2D sheet image into a Charset (2D sheet slicing)', () => {
    // Create a 16x8 sheet containing 2 characters of 8x8 (Char 0 on left, Char 1 on right)
    // 16 pixels wide x 8 pixels high = 128 pixels * 4 = 512 bytes
    const sheetW = 16;
    const sheetH = 8;
    const rgba = new Uint8ClampedArray(sheetW * sheetH * 4);

    // In Char 0 (x: 0..7, y: 0..7), draw a red pixel at (0, 0)
    rgba[0] = 255;
    rgba[1] = 0;
    rgba[2] = 0;
    rgba[3] = 255;

    // In Char 1 (x: 8..15, y: 0..7), draw a green pixel at local (1, 2) -> global (9, 2)
    const char1GlobalIdx = (2 * sheetW + 9) * 4;
    rgba[char1GlobalIdx] = 0;
    rgba[char1GlobalIdx + 1] = 255;
    rgba[char1GlobalIdx + 2] = 0;
    rgba[char1GlobalIdx + 3] = 255;

    const charset = createCharsetFromRgbaSheet('test_charset', sheetW, sheetH, 8, 8, rgba);
    expect(charset.isCharset()).toBe(true);
    expect(charset.width).toBe(8);
    expect(charset.height).toBe(8);
    expect(charset.charsetInfo()?.charCount).toBe(2);
    expect(charset.charsetInfo()?.columns).toBe(2);

    // Check Char 0 pixel (0, 0)
    const c0p0 = VGA_256_COLORS[charset.getCharPixel(0, 0, 0)!];
    expect(c0p0.r).toBeGreaterThan(150);

    // Check Char 1 pixel (1, 2)
    const c1p1 = VGA_256_COLORS[charset.getCharPixel(1, 1, 2)!];
    expect(c1p1.g).toBeGreaterThan(150);

    // Check other pixels are 0
    expect(charset.getCharPixel(0, 1, 0)).toBe(0);
    expect(charset.getCharPixel(1, 0, 0)).toBe(0);
  });
});
