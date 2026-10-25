import { describe, it, expect } from 'vitest';
import { Graphic } from './graphic';
import { Project } from './project';
import { History } from './history';
import { hexStrToRgb, rgbToHexStr, rgbHex } from './palette';

describe('Palette & RGB', () => {
  it('converts hex to RGB and back', () => {
    const rgb = rgbHex(0x102030);
    expect(rgb).toEqual({ r: 0x10, g: 0x20, b: 0x30 });
    expect(rgbToHexStr(rgb)).toBe('#102030');
    expect(hexStrToRgb('#102030')).toEqual(rgb);
  });
});

describe('Graphic Model', () => {
  it('creates blank C64 sprite with default dimensions', () => {
    const g = Graphic.newSprite('spr 1');
    expect(g.width).toBe(24);
    expect(g.height).toBe(21);
    expect(g.depth).toBe(2);
    expect(g.pixelMode).toBe('hires');
    expect(g.pixels.every((p) => p === 0)).toBe(true);
  });

  it('sets and gets pixel within bounds', () => {
    const g = Graphic.newSprite('spr 1', 4, 4);
    expect(g.set(1, 2, 1)).toBe(true);
    expect(g.set(1, 2, 1)).toBe(false);
    expect(g.get(1, 2)).toBe(1);
    expect(g.get(5, 5)).toBe(null);
  });

  it('resizes while preserving overlapping pixels', () => {
    const g = Graphic.newSprite('spr', 2, 2);
    g.set(0, 0, 1);
    g.set(1, 1, 1);
    g.resize(3, 3);
    expect(g.width).toBe(3);
    expect(g.height).toBe(3);
    expect(g.get(0, 0)).toBe(1);
    expect(g.get(1, 1)).toBe(1);
    expect(g.get(2, 2)).toBe(0);
  });

  it('creates charset with 256 8x8 characters', () => {
    const c = Graphic.newCharset('font 1');
    expect(c.isCharset()).toBe(true);
    expect(c.width).toBe(128); // 16 cols * 8
    expect(c.height).toBe(128); // 16 rows * 8
  });

  it('detects drawn pixels outside new dimensions', () => {
    const g = Graphic.newSprite('spr', 4, 4);
    expect(g.hasDrawnPixelsOutside(2, 2)).toBe(false);
    g.set(3, 3, 1);
    expect(g.hasDrawnPixelsOutside(2, 2)).toBe(true);
    expect(g.hasDrawnPixelsOutside(4, 4)).toBe(false);
  });

  it('clears all pixels', () => {
    const g = Graphic.newSprite('spr', 3, 3);
    g.set(1, 1, 1);
    expect(g.clear()).toBe(true);
    expect(g.get(1, 1)).toBe(0);
    expect(g.clear()).toBe(false);
  });

  it('inverts monochrome pixels', () => {
    const g = Graphic.newSprite('spr', 2, 2);
    g.set(0, 0, 1);
    expect(g.invert()).toBe(true);
    expect(g.get(0, 0)).toBe(0);
    expect(g.get(0, 1)).toBe(1);
    expect(g.get(1, 0)).toBe(1);
    expect(g.get(1, 1)).toBe(1);
  });

  it('reads and writes individual character pixels in charset', () => {
    const c = Graphic.newCharset('chars');
    // char 1 is col 1, row 0 -> origin x=8, y=0
    expect(c.setCharPixel(1, 2, 3, 1)).toBe(true);
    expect(c.getCharPixel(1, 2, 3)).toBe(1);
    expect(c.get(10, 3)).toBe(1);
  });
});

describe('Project Serialization', () => {
  it('serializes and deserializes project correctly', () => {
    const p = new Project('Test Game');
    p.graphics.push(Graphic.newCharset('test font'));
    const json = p.toJson();
    const loaded = Project.fromJson(json);
    expect(loaded.name).toBe('Test Game');
    expect(loaded.graphics.length).toBe(2);
    expect(loaded.graphics[1].isCharset()).toBe(true);
  });
});

describe('History Stack', () => {
  it('undoes and redoes states', () => {
    const h = new History();
    const g = Graphic.newSprite('s', 2, 2);
    h.pushSnapshot(g.clonePixels());
    g.set(0, 0, 1);

    const undone = h.undo(g.clonePixels());
    expect(undone).not.toBeNull();
    expect(undone![0]).toBe(0);

    const redone = h.redo(undone!);
    expect(redone).not.toBeNull();
    expect(redone![0]).toBe(1);
  });
});
