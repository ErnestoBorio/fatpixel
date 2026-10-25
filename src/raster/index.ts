export type BrushShape = 'square' | 'round';

export interface Point {
  x: number;
  y: number;
}

export const ZOOM_LEVELS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 40, 48, 64];

export function linePoints(x0: number, y0: number, x1: number, y1: number): Point[] {
  const points: Point[] = [];
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  let cx = x0;
  let cy = y0;

  while (true) {
    points.push({ x: cx, y: cy });
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      cx += sx;
    }
    if (e2 <= dx) {
      err += dx;
      cy += sy;
    }
  }

  return points;
}

export function snapLine(x0: number, y0: number, x1: number, y1: number): Point {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);

  if (ax === 0 && ay === 0) return { x: x1, y: y1 };

  if (ay < ax * 0.414) {
    return { x: x1, y: y0 };
  } else if (ax < ay * 0.414) {
    return { x: x0, y: y1 };
  } else {
    const d = Math.round((ax + ay) / 2);
    return {
      x: x0 + Math.sign(dx) * d,
      y: y0 + Math.sign(dy) * d,
    };
  }
}

export function brushOffsets(shape: BrushShape, size: number): Point[] {
  if (size <= 1) return [{ x: 0, y: 0 }];

  const offsets: Point[] = [];
  const half = Math.floor(size / 2);
  const isEven = size % 2 === 0;
  const min = -half;
  const max = isEven ? half - 1 : half;

  if (shape === 'square') {
    for (let dy = min; dy <= max; dy++) {
      for (let dx = min; dx <= max; dx++) {
        offsets.push({ x: dx, y: dy });
      }
    }
  } else {
    // Round brush
    const r = (size - 1) / 2;
    const rSq = r * r + 0.25;
    for (let dy = min; dy <= max; dy++) {
      for (let dx = min; dx <= max; dx++) {
        const cx = isEven ? dx + 0.5 : dx;
        const cy = isEven ? dy + 0.5 : dy;
        if (cx * cx + cy * cy <= rSq) {
          offsets.push({ x: dx, y: dy });
        }
      }
    }
  }

  return offsets;
}

export function brushPoints(shape: BrushShape, size: number, x: number, y: number): Point[] {
  return brushOffsets(shape, size).map((o) => ({ x: x + o.x, y: y + o.y }));
}

export function rectPoints(x0: number, y0: number, x1: number, y1: number, filled: boolean): Point[] {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  const points: Point[] = [];

  if (filled) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        points.push({ x, y });
      }
    }
  } else {
    for (let x = minX; x <= maxX; x++) {
      points.push({ x, y: minY });
      if (minY !== maxY) points.push({ x, y: maxY });
    }
    for (let y = minY + 1; y < maxY; y++) {
      points.push({ x: minX, y });
      if (minX !== maxX) points.push({ x: maxX, y });
    }
  }

  return points;
}

export function ellipsePoints(x0: number, y0: number, x1: number, y1: number, filled: boolean): Point[] {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  const rx = (maxX - minX) / 2;
  const ry = (maxY - minY) / 2;
  if (rx <= 0 || ry <= 0) {
    return rectPoints(x0, y0, x1, y1, filled);
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const points: Point[] = [];

  if (filled) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        if (nx * nx + ny * ny <= 1.05) {
          points.push({ x, y });
        }
      }
    }
  } else {
    // Midpoint ellipse perimeter
    const visited = new Set<string>();
    const addPt = (x: number, y: number) => {
      const key = `${x},${y}`;
      if (!visited.has(key)) {
        visited.add(key);
        points.push({ x, y });
      }
    };

    let x = 0;
    let y = Math.round(ry);
    let d1 = ry * ry - rx * rx * ry + 0.25 * rx * rx;
    let dx = 2 * ry * ry * x;
    let dy = 2 * rx * rx * y;

    const plotSymmetric = (px: number, py: number) => {
      addPt(Math.round(cx + px), Math.round(cy + py));
      addPt(Math.round(cx - px), Math.round(cy + py));
      addPt(Math.round(cx + px), Math.round(cy - py));
      addPt(Math.round(cx - px), Math.round(cy - py));
    };

    while (dx < dy) {
      plotSymmetric(x, y);
      if (d1 < 0) {
        x++;
        dx += 2 * ry * ry;
        d1 += dx + ry * ry;
      } else {
        x++;
        y--;
        dx += 2 * ry * ry;
        dy -= 2 * rx * rx;
        d1 += dx - dy + ry * ry;
      }
    }

    let d2 =
      ry * ry * ((x + 0.5) * (x + 0.5)) +
      rx * rx * ((y - 1) * (y - 1)) -
      rx * rx * ry * ry;

    while (y >= 0) {
      plotSymmetric(x, y);
      if (d2 > 0) {
        y--;
        dy -= 2 * rx * rx;
        d2 += rx * rx - dy;
      } else {
        y--;
        x++;
        dx += 2 * ry * ry;
        dy -= 2 * rx * rx;
        d2 += dx - dy + rx * rx;
      }
    }
  }

  return points;
}

export function floodFill(
  width: number,
  height: number,
  getPixel: (x: number, y: number) => number | null,
  startX: number,
  startY: number,
  targetValue: number
): Point[] {
  const originVal = getPixel(startX, startY);
  if (originVal === null || originVal === targetValue) return [];

  const filled: Point[] = [];
  const visited = new Uint8Array(width * height);
  const queue: [number, number][] = [[startX, startY]];
  visited[startY * width + startX] = 1;

  while (queue.length > 0) {
    const [x, y] = queue.pop()!;
    filled.push({ x, y });

    const neighbors: [number, number][] = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = ny * width + nx;
        if (!visited[idx] && getPixel(nx, ny) === originVal) {
          visited[idx] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  return filled;
}
