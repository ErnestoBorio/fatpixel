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

describe('Clipboard and Copy & Paste', () => {
  it('copies full sprite and pastes into another sprite', async () => {
    const { copyFromGraphic, pasteToGraphic } = await import('./clipboard');
    const src = Graphic.newSprite('Src', 4, 4);
    src.set(0, 0, 1);
    src.set(1, 1, 1);

    const clip = copyFromGraphic(src);
    expect(clip.width).toBe(4);
    expect(clip.height).toBe(4);

    const dst = Graphic.newSprite('Dst', 4, 4);
    const { pastedW, pastedH } = pasteToGraphic(dst, clip);
    expect(pastedW).toBe(4);
    expect(pastedH).toBe(4);
    expect(dst.get(0, 0)).toBe(1);
    expect(dst.get(1, 1)).toBe(1);
    expect(dst.get(2, 2)).toBe(0);
  });

  it('copies whole graphic and pastes it', async () => {
    const { copyFromGraphic, pasteToGraphic } = await import('./clipboard');
    const src = Graphic.newSprite('Src', 8, 8);
    src.set(2, 3, 1);
    src.set(3, 4, 1);

    const clip = copyFromGraphic(src);
    expect(clip.width).toBe(8);
    expect(clip.height).toBe(8);
    expect(clip.pixels[3 * 8 + 2]).toBe(1);
    expect(clip.pixels[4 * 8 + 3]).toBe(1);

    const dst = Graphic.newSprite('Dst', 8, 8);
    pasteToGraphic(dst, clip);
    expect(dst.get(2, 3)).toBe(1);
    expect(dst.get(3, 4)).toBe(1);
    expect(dst.get(0, 0)).toBe(0);
  });

  it('pastes from sprite into charset character, keeping whatever fits', async () => {
    const { copyFromGraphic, pasteToGraphic } = await import('./clipboard');
    // Large sprite: 24x21
    const sprite = Graphic.newSprite('BigSprite', 24, 21);
    sprite.set(0, 0, 1);
    sprite.set(7, 7, 1);
    sprite.set(15, 15, 1); // Outside 8x8 character cell

    const clip = copyFromGraphic(sprite);
    expect(clip.width).toBe(24);
    expect(clip.height).toBe(21);

    // Paste into charset character (8x8)
    const charset = Graphic.newCharset('TestFont');
    const { pastedW, pastedH } = pasteToGraphic(charset, clip, 5); // Char 5
    expect(pastedW).toBe(8);
    expect(pastedH).toBe(8);
    expect(charset.getCharPixel(5, 0, 0)).toBe(1);
    expect(charset.getCharPixel(5, 7, 7)).toBe(1);
  });

  it('pastes from charset character into sprite', async () => {
    const { copyFromGraphic, pasteToGraphic } = await import('./clipboard');
    const charset = Graphic.newCharset('TestFont');
    charset.setCharPixel(2, 1, 1, 1);
    charset.setCharPixel(2, 3, 3, 1);

    // Copy character 2 (8x8)
    const clip = copyFromGraphic(charset, 2);
    expect(clip.width).toBe(8);
    expect(clip.height).toBe(8);

    const sprite = Graphic.newSprite('Player', 24, 21);
    const { pastedW, pastedH } = pasteToGraphic(sprite, clip, 0, { x: 10, y: 10 });
    expect(pastedW).toBe(8);
    expect(pastedH).toBe(8);
    expect(sprite.get(11, 11)).toBe(1);
    expect(sprite.get(13, 13)).toBe(1);
    expect(sprite.get(0, 0)).toBe(0);
  });

  it('converts multicolor 2bpp slots when pasting into 1bpp hires graphic', async () => {
    const { copyFromGraphic, pasteToGraphic } = await import('./clipboard');
    const multi = Graphic.newSprite('Multi', 4, 4, 4, 'wide');
    multi.set(0, 0, 1);
    multi.set(1, 1, 2);
    multi.set(2, 2, 3);
    multi.set(3, 3, 0);

    const clip = copyFromGraphic(multi);
    const hires = Graphic.newSprite('Hires', 4, 4, 2, 'hires');
    pasteToGraphic(hires, clip);

    // Any non-zero slot becomes 1 in 1bpp
    expect(hires.get(0, 0)).toBe(1);
    expect(hires.get(1, 1)).toBe(1);
    expect(hires.get(2, 2)).toBe(1);
    expect(hires.get(3, 3)).toBe(0);
  });

  it('detaches bpp from pixel aspect ratio from size', () => {
    const g = Graphic.newSprite('Test', 24, 21);
    expect(g.bpp).toBe(1);
    expect(g.depth).toBe(2);
    expect(g.pixelAspectRatio).toBe('1:1');
    expect(g.width).toBe(24);
    expect(g.height).toBe(21);

    // Change pixel aspect ratio: dimensions must NOT change
    g.setPixelAspectRatio('2:1');
    expect(g.pixelAspectRatio).toBe('2:1');
    expect(g.pixelMode).toBe('wide');
    expect(g.width).toBe(24);
    expect(g.height).toBe(21);

    // Change BPP through 1, 2, 3, 4, 8
    g.setBpp(2);
    expect(g.bpp).toBe(2);
    expect(g.depth).toBe(4);
    expect(g.slots.length).toBe(4);

    g.setBpp(3);
    expect(g.bpp).toBe(3);
    expect(g.depth).toBe(8);
    expect(g.slots.length).toBe(8);

    g.setBpp(4);
    expect(g.bpp).toBe(4);
    expect(g.depth).toBe(16);
    expect(g.slots.length).toBe(16);

    // Dimensions still untouched
    expect(g.width).toBe(24);
    expect(g.height).toBe(21);
    expect(g.pixelAspectRatio).toBe('2:1');

    // Convert to 8bpp direct mode
    g.slots[1] = 42; // slot 1 points to palette color 42
    g.set(0, 0, 1);
    g.setBpp(8);
    expect(g.bpp).toBe(8);
    expect(g.depth).toBe(256);
    expect(g.slots.length).toBe(0);
    // Pixel value converted from slot 1 to color 42
    expect(g.get(0, 0)).toBe(42);

    // Convert from 8bpp back to 2bpp
    g.setBpp(2);
    expect(g.bpp).toBe(2);
    expect(g.depth).toBe(4);
    expect(g.slots.length).toBe(4);
    // Slot 0 holds the color 42
    expect(g.slots[0]).toBe(42);
    expect(g.get(0, 0)).toBe(0);
  });

  it('serializes and deserializes 8bpp graphic with 2-char hex', () => {
    const g = Graphic.newSprite('VgaSprite', 4, 4);
    g.setBpp(8);
    g.setPixelAspectRatio('2:1');
    g.set(0, 0, 0);
    g.set(1, 0, 15);
    g.set(2, 0, 128);
    g.set(3, 0, 255);

    const json = g.toJson();
    expect(json.depth).toBe(256);
    expect(json.bpp).toBe(8);
    expect(json.pixel_aspect).toBe('2:1');
    expect(json.pixel_mode).toBe('wide');
    // Pixels string should have 16 pixels * 2 chars = 32 chars
    expect(typeof json.pixels).toBe('string');
    expect((json.pixels as string).length).toBe(32);
    // First 4 pixels: '00', '0f', '80', 'ff'
    expect((json.pixels as string).slice(0, 8)).toBe('000f80ff');

    const restored = Graphic.fromJson(json);
    expect(restored.bpp).toBe(8);
    expect(restored.depth).toBe(256);
    expect(restored.pixelAspectRatio).toBe('2:1');
    expect(restored.get(0, 0)).toBe(0);
    expect(restored.get(1, 0)).toBe(15);
    expect(restored.get(2, 0)).toBe(128);
    expect(restored.get(3, 0)).toBe(255);
  });

  it('includes all built-in palettes with power of 2 colors: VGA 256, Mono 2, CGA Cool 4, CGA Warm 4, Game Boy 4, Teletext 8, ZX 16, C64 16, Drean 16', async () => {
    const { BUILTIN_PALETTES, getBuiltinPalette, isPowerOfTwo } = await import('./palette');
    expect(BUILTIN_PALETTES.length).toBeGreaterThanOrEqual(9);

    // Verify all built-in palettes have power-of-two color counts from 2 to 256
    for (const pal of BUILTIN_PALETTES) {
      expect(isPowerOfTwo(pal.colors.length)).toBe(true);
    }

    const vga = getBuiltinPalette('vga-256');
    expect(vga).toBeDefined();
    expect(vga?.colors.length).toBe(256);

    const mono = getBuiltinPalette('mono-2');
    expect(mono).toBeDefined();
    expect(mono?.colors.length).toBe(2);

    const cgaCool = getBuiltinPalette('cga-cool-4');
    expect(cgaCool).toBeDefined();
    expect(cgaCool?.colors.length).toBe(4);

    const cgaWarm = getBuiltinPalette('cga-warm-4');
    expect(cgaWarm).toBeDefined();
    expect(cgaWarm?.colors.length).toBe(4);

    const gb = getBuiltinPalette('gameboy-4');
    expect(gb).toBeDefined();
    expect(gb?.colors.length).toBe(4);
    // 00 is brightest (Lightest Green) and 11 is darkest (Darkest Green)
    expect(gb?.colors[0]).toEqual({ r: 0x9b, g: 0xbc, b: 0x0f });
    expect(gb?.colors[3]).toEqual({ r: 0x0f, g: 0x38, b: 0x0f });

    const teletext = getBuiltinPalette('teletext-8');
    expect(teletext).toBeDefined();
    expect(teletext?.colors.length).toBe(8);

    const zx = getBuiltinPalette('zx-16');
    expect(zx).toBeDefined();
    expect(zx?.colors.length).toBe(16);
    // Dark black and light black are just black: #000000
    expect(zx?.colors[0]).toEqual({ r: 0, g: 0, b: 0 });
    expect(zx?.colors[8]).toEqual({ r: 0, g: 0, b: 0 });
    // Dark white is grey (215, 215, 215)
    expect(zx?.colors[7]).toEqual({ r: 0xd7, g: 0xd7, b: 0xd7 });
    // Light white is pure white (255, 255, 255)
    expect(zx?.colors[15]).toEqual({ r: 0xff, g: 0xff, b: 0xff });

    const drean = getBuiltinPalette('drean-16');
    expect(drean).toBeDefined();
    expect(drean?.name).toBe('Drean 64 (16)');
    expect(drean?.colors.length).toBe(16);

    // Legacy aliases
    expect(getBuiltinPalette('cga-4')?.id).toBe('cga-cool-4');
    expect(getBuiltinPalette('zx-8')?.id).toBe('zx-16');
  });

  it('renders direct color in slotColor when palette size matches BPP capacity', async () => {
    const { getBuiltinPalette } = await import('./palette');
    const { slotColor } = await import('./render');
    const cga = getBuiltinPalette('cga-cool-4')!;

    const g = Graphic.newSprite('CgaSprite', 4, 4);
    g.setBpp(2); // 2bpp -> 4 colors, matches cga 4 colors
    // In direct mode, slotColor(g, cga, 2) directly returns cga.colors[2]
    const c = slotColor(g, cga, 2);
    expect(c).toEqual(cga.colors[2]);
  });
});

