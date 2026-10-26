import { describe, it, expect, beforeEach } from 'vitest';
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
    expect(c.width).toBe(8); // single character width
    expect(c.height).toBe(8); // single character height
    expect(c.sheetWidth()).toBe(128); // 16 cols * 8
    expect(c.sheetHeight()).toBe(128); // 16 rows * 8
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
    const sprite = p.graphics[0];
    sprite.set(1, 1, 1);

    const charset = Graphic.newCharset('test font');
    charset.setCharPixel(0, 3, 3, 1);
    p.graphics.push(charset);

    const json = p.toJson();
    const data = JSON.parse(json);

    // Sprite pixels should be a single string
    expect(typeof data.graphics[0].pixels).toBe('string');
    // Charset pixels should be an array of strings, one per character
    expect(Array.isArray(data.graphics[1].pixels)).toBe(true);
    expect(data.graphics[1].pixels.length).toBe(256);
    expect(typeof data.graphics[1].pixels[0]).toBe('string');
    // Charset width and height in pxp format should be character dimensions (8x8)
    expect(data.graphics[1].width).toBe(8);
    expect(data.graphics[1].height).toBe(8);
    expect(data.graphics[1].char_width).toBe(8);
    expect(data.graphics[1].char_height).toBe(8);

    const loaded = Project.fromJson(json);
    expect(loaded.name).toBe('Test Game');
    expect(loaded.graphics.length).toBe(2);
    expect(loaded.graphics[0].get(1, 1)).toBe(1);
    expect(loaded.graphics[1].isCharset()).toBe(true);
    expect(loaded.graphics[1].width).toBe(8);
    expect(loaded.graphics[1].height).toBe(8);
    expect(loaded.graphics[1].sheetWidth()).toBe(128);
    expect(loaded.graphics[1].sheetHeight()).toBe(128);
    expect(loaded.graphics[1].getCharPixel(0, 3, 3)).toBe(1);
  });

  it('deserializes legacy charset pxp files with 128x128 dimensions', () => {
    const legacyJson = JSON.stringify({
      format: 'pixel_project',
      version: 1,
      name: 'Legacy Project',
      palettes: [],
      graphics: [
        {
          name: 'Old Charset',
          kind: 'charset',
          width: 128,
          height: 128,
          char_width: 8,
          char_height: 8,
          char_count: 256,
          columns: 16,
          depth: 2,
          pixel_mode: 'hires',
          palette: 'builtin:c64_pepto',
          slots: [0, 1],
          transparent_slot: null,
          pixels: Array(256).fill('0'.repeat(64)),
        },
      ],
    });

    const loaded = Project.fromJson(legacyJson);
    const g = loaded.graphics[0];
    expect(g.isCharset()).toBe(true);
    expect(g.width).toBe(8);
    expect(g.height).toBe(8);
    expect(g.sheetWidth()).toBe(128);
    expect(g.sheetHeight()).toBe(128);
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

describe('Graphic Transformations & Mode Conversion', () => {
  it('converts multicolor sprite to hires turning all non-zero pixels to 1', () => {
    const g = Graphic.newSprite('spr', 4, 4, 4, 'wide');
    g.set(0, 0, 0); // background
    g.set(1, 0, 1); // color 1
    g.set(2, 0, 2); // color 2
    g.set(3, 0, 3); // color 3

    g.setDepthAndMode(2, 'hires');
    expect(g.depth).toBe(2);
    expect(g.pixelMode).toBe('hires');
    expect(g.get(0, 0)).toBe(0);
    expect(g.get(1, 0)).toBe(1);
    expect(g.get(2, 0)).toBe(1);
    expect(g.get(3, 0)).toBe(1);
  });

  it('shifts sprite pixels with edge wrap', () => {
    const g = Graphic.newSprite('spr', 3, 3);
    g.set(0, 0, 1);

    // Shift right: (0,0) -> (1,0)
    g.shiftPixels(1, 0);
    expect(g.get(0, 0)).toBe(0);
    expect(g.get(1, 0)).toBe(1);

    // Shift left: (1,0) -> (0,0)
    g.shiftPixels(-1, 0);
    expect(g.get(0, 0)).toBe(1);

    // Shift left again: wrap to (2,0)
    g.shiftPixels(-1, 0);
    expect(g.get(0, 0)).toBe(0);
    expect(g.get(2, 0)).toBe(1);

    // Shift down: (2,0) -> (2,1)
    g.shiftPixels(0, 1);
    expect(g.get(2, 1)).toBe(1);

    // Shift up: (2,1) -> (2,0)
    g.shiftPixels(0, -1);
    expect(g.get(2, 0)).toBe(1);

    // Shift up again: wrap to (2,2)
    g.shiftPixels(0, -1);
    expect(g.get(2, 2)).toBe(1);
  });

  it('mirrors horizontally and vertically', () => {
    const g = Graphic.newSprite('spr', 4, 4);
    g.set(0, 1, 1);

    g.mirrorH();
    expect(g.get(0, 1)).toBe(0);
    expect(g.get(3, 1)).toBe(1);

    g.mirrorV();
    expect(g.get(3, 1)).toBe(0);
    expect(g.get(3, 2)).toBe(1);
  });

  it('rotates square graphics 90 degrees without loss', () => {
    const g = Graphic.newSprite('spr', 4, 4);
    g.set(0, 0, 1);

    expect(g.wouldRotationLoseData(true)).toBe(false);
    expect(g.wouldRotationLoseData(false)).toBe(false);

    // 90° Clockwise: top-left (0,0) -> top-right (3,0)
    g.rotate(true);
    expect(g.get(3, 0)).toBe(1);
    expect(g.get(0, 0)).toBe(0);

    // 90° Counter-Clockwise returns to (0,0)
    g.rotate(false);
    expect(g.get(0, 0)).toBe(1);
  });

  it('detects potential data loss on rotating non-square graphics', () => {
    const g = Graphic.newSprite('spr', 24, 21);
    // Pixel inside the 21x21 square safe area
    g.set(5, 5, 1);
    expect(g.wouldRotationLoseData(true)).toBe(false);

    // Pixel at column 22 (outside height 21 when rotated CW)
    g.set(22, 5, 1);
    expect(g.wouldRotationLoseData(true)).toBe(true);
  });
});

describe('LocalStorage Persistence', () => {
  const mockStorage: Record<string, string> = {};
  const fakeStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = val;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
    length: 0,
    key: () => null,
  };

  beforeEach(() => {
    fakeStorage.clear();
    // @ts-ignore
    globalThis.localStorage = fakeStorage;
  });

  it('saves and restores project and settings', async () => {
    const { saveAllToStorage, loadAllFromStorage, clearStorage } = await import('./storage');

    const project = new Project('Test Game');
    project.graphics[0].set(2, 3, 1);

    const settings = {
      activeGraphicIndex: 0,
      activeCharIndex: 5,
      tool: 'line' as const,
      brushShape: 'round' as const,
      brushSize: 3,
      fillMode: true,
      primary: 1,
      secondary: 0,
      showGrid: false,
    };

    expect(saveAllToStorage(project, settings)).toBe(true);

    const loaded = loadAllFromStorage();
    expect(loaded.project).not.toBeNull();
    expect(loaded.project?.name).toBe('Test Game');
    expect(loaded.project?.graphics[0].get(2, 3)).toBe(1);

    expect(loaded.settings).toEqual(settings);

    clearStorage();
    const empty = loadAllFromStorage();
    expect(empty.project).toBeNull();
    expect(empty.settings).toBeNull();
  });
});

describe('ProjectSnapshot History & Undoable Operations', () => {
  it('undoes and redoes graphic deletion', async () => {
    const { History, cloneProjectSnapshot } = await import('./history');
    const history = new History(50, cloneProjectSnapshot);

    const g1 = Graphic.newSprite('Spr 1', 24, 21);
    const g2 = Graphic.newSprite('Spr 2', 24, 21);
    let graphics = [g1, g2];
    let activeIdx = 1;

    // Snapshot before deleting g2
    history.pushSnapshot({
      graphics: graphics.map((g) => g.clone()),
      activeGraphicIndex: activeIdx,
    });

    graphics = [g1];
    activeIdx = 0;

    // Undo delete
    const current = {
      graphics: graphics.map((g) => g.clone()),
      activeGraphicIndex: activeIdx,
    };
    const prev = history.undo(current);
    expect(prev).not.toBeNull();
    expect(prev!.graphics.length).toBe(2);
    expect(prev!.graphics[1].name).toBe('Spr 2');
    expect(prev!.activeGraphicIndex).toBe(1);

    // Redo delete
    const redone = history.redo(prev!);
    expect(redone).not.toBeNull();
    expect(redone!.graphics.length).toBe(1);
    expect(redone!.graphics[0].name).toBe('Spr 1');
  });

  it('undoes and redoes graphic mode and resize changes', async () => {
    const { History, cloneProjectSnapshot } = await import('./history');
    const history = new History(50, cloneProjectSnapshot);

    const g = Graphic.newSprite('Player', 24, 21, 2, 'hires');
    g.set(5, 5, 1);
    let graphics = [g];

    // Snapshot before resize
    history.pushSnapshot({
      graphics: graphics.map((item) => item.clone()),
      activeGraphicIndex: 0,
    });

    g.resize(12, 21);
    g.setDepthAndMode(4, 'wide');

    expect(g.width).toBe(12);
    expect(g.depth).toBe(4);
    expect(g.pixelMode).toBe('wide');

    // Undo resize & mode
    const current = {
      graphics: graphics.map((item) => item.clone()),
      activeGraphicIndex: 0,
    };
    const restored = history.undo(current);
    expect(restored).not.toBeNull();
    expect(restored!.graphics[0].width).toBe(24);
    expect(restored!.graphics[0].depth).toBe(2);
    expect(restored!.graphics[0].pixelMode).toBe('hires');
    expect(restored!.graphics[0].get(5, 5)).toBe(1);
  });

  it('accurately identifies empty vs drawn graphics for thumbnail display', () => {
    const g = Graphic.newSprite('IconTest', 24, 21);
    expect(g.hasDrawnPixels()).toBe(false);

    g.set(0, 0, 1);
    expect(g.hasDrawnPixels()).toBe(true);

    g.set(0, 0, 0);
    expect(g.hasDrawnPixels()).toBe(false);
  });
});

