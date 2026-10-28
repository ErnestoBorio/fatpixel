import { describe, it, expect } from 'vitest';
import {
  linePoints,
  snapLine,
  rectPoints,
  ellipsePoints,
  brushOffsets,
  floodFill,
} from './index';

describe('Line rasterization', () => {
  it('draws single point when start and end are equal', () => {
    const pts = linePoints(2, 3, 2, 3);
    expect(pts).toEqual([{ x: 2, y: 3 }]);
  });

  it('draws horizontal line', () => {
    const pts = linePoints(1, 2, 4, 2);
    expect(pts).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ]);
  });

  it('snaps line to 45 degree angle', () => {
    const snapped = snapLine(0, 0, 10, 9);
    expect(snapped.x).toBe(snapped.y);
  });

  it('snaps line to visual 45 degree angle in 2:1 aspect ratio', () => {
    const snapped = snapLine(0, 0, 5, 9, 2.0);
    // In 2:1 mode, 5 horizontal pixels equals 10 visual units, so targetDy is 10 and targetDx is 5
    expect(snapped.x * 2).toBe(snapped.y);
  });
});

describe('Brush shapes', () => {
  it('size 1 is a single offset', () => {
    expect(brushOffsets('square', 1)).toEqual([{ x: 0, y: 0 }]);
    expect(brushOffsets('round', 1)).toEqual([{ x: 0, y: 0 }]);
  });

  it('square size 3 has 9 pixels', () => {
    expect(brushOffsets('square', 3).length).toBe(9);
  });

  it('round size 3 has plus shape with 5 pixels', () => {
    expect(brushOffsets('round', 3).length).toBe(5);
  });
});

describe('Shapes', () => {
  it('rectangle outline and filled', () => {
    const outline = rectPoints(0, 0, 2, 2, false);
    expect(outline.length).toBe(8);
    const filled = rectPoints(0, 0, 2, 2, true);
    expect(filled.length).toBe(9);
  });

  it('ellipse generates points', () => {
    const pts = ellipsePoints(0, 0, 4, 4, true);
    expect(pts.length).toBeGreaterThan(0);
  });
});

describe('Flood fill', () => {
  it('fills contained area', () => {
    const grid = [
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
    ];
    const pts = floodFill(
      3,
      3,
      (x, y) => grid[y * 3 + x],
      1,
      1,
      1
    );
    expect(pts.length).toBe(9);
  });
});
