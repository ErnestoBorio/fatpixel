<script lang="ts">
  import { onMount } from 'svelte';
  import type { Graphic } from '../model/graphic';
  import type { Palette } from '../model/palette';
  import type { History } from '../model/history';
  import type { ToolType } from '../tools';
  import {
    linePoints,
    snapLine,
    rectPoints,
    ellipsePoints,
    brushPoints,
    floodFill,
    type BrushShape,
    type Point,
  } from '../raster';
  import { slotColor } from '../model/render';

  let {
    graphic,
    palette,
    history,
    tool,
    brushShape,
    brushSize,
    fillMode,
    primary = $bindable(1),
    secondary = $bindable(0),
    showGrid = true,
    onPixelChange,
    onHoverChange,
  } = $props<{
    graphic: Graphic;
    palette: Palette;
    history: History;
    tool: ToolType;
    brushShape: BrushShape;
    brushSize: number;
    fillMode: boolean;
    primary?: number;
    secondary?: number;
    showGrid?: boolean;
    onPixelChange?: () => void;
    onHoverChange?: (hover: { x: number; y: number } | null) => void;
  }>();

  let canvasElem: HTMLCanvasElement;
  let containerElem: HTMLDivElement;

  const ZOOM_LEVELS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64];
  let zoomIndex = $state(7); // 16x zoom default
  let offsetX = $state(0);
  let offsetY = $state(0);
  let isPanning = $state(false);
  let panStartX = 0;
  let panStartY = 0;
  let panStartOffsetX = 0;
  let panStartOffsetY = 0;

  let isPainting = $state(false);
  let paintValue = 0;
  let lastPaintPt: Point | null = null;
  let dragShapeStart: Point | null = null;
  let previewPoints: Point[] = $state([]);
  let hoverPt: Point | null = $state(null);
  let isAltDown = $state(false);
  let isShiftDown = $state(false);
  let isSpaceDown = $state(false);

  export function zoomIn() {
    if (zoomIndex < ZOOM_LEVELS.length - 1) {
      stepZoom(1, containerElem.clientWidth / 2, containerElem.clientHeight / 2);
    }
  }

  export function zoomOut() {
    if (zoomIndex > 0) {
      stepZoom(-1, containerElem.clientWidth / 2, containerElem.clientHeight / 2);
    }
  }

  export function fitToWindow() {
    if (!containerElem) return;
    const cw = containerElem.clientWidth - 40;
    const ch = containerElem.clientHeight - 40;
    const aspect = graphic.pixelMode === 'wide' ? 2 : 1;
    const gw = graphic.width * aspect;
    const gh = graphic.height;

    let bestIdx = 0;
    for (let i = ZOOM_LEVELS.length - 1; i >= 0; i--) {
      const z = ZOOM_LEVELS[i];
      if (gw * z <= cw && gh * z <= ch) {
        bestIdx = i;
        break;
      }
    }
    zoomIndex = bestIdx;
    const currentZoom = ZOOM_LEVELS[zoomIndex];
    offsetX = Math.round((containerElem.clientWidth - gw * currentZoom) / 2);
    offsetY = Math.round((containerElem.clientHeight - gh * currentZoom) / 2);
    redraw();
  }

  function stepZoom(delta: number, anchorX: number, anchorY: number) {
    const newIdx = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, zoomIndex + delta));
    if (newIdx === zoomIndex) return;

    const oldZoom = ZOOM_LEVELS[zoomIndex];
    const newZoom = ZOOM_LEVELS[newIdx];
    const ratio = newZoom / oldZoom;

    offsetX = Math.round(anchorX - (anchorX - offsetX) * ratio);
    offsetY = Math.round(anchorY - (anchorY - offsetY) * ratio);
    zoomIndex = newIdx;
    redraw();
  }

  function screenToPixel(sx: number, sy: number): Point {
    const zoom = ZOOM_LEVELS[zoomIndex];
    const aspect = graphic.pixelMode === 'wide' ? 2 : 1;
    const pxW = zoom * aspect;
    const pxH = zoom;
    return {
      x: Math.floor((sx - offsetX) / pxW),
      y: Math.floor((sy - offsetY) / pxH),
    };
  }

  export function redraw() {
    if (!canvasElem || !containerElem) return;
    const ctx = canvasElem.getContext('2d');
    if (!ctx) return;

    const width = containerElem.clientWidth;
    const height = containerElem.clientHeight;
    if (canvasElem.width !== width || canvasElem.height !== height) {
      canvasElem.width = width;
      canvasElem.height = height;
    }

    // Background of viewport
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, width, height);

    const zoom = ZOOM_LEVELS[zoomIndex];
    const aspect = graphic.pixelMode === 'wide' ? 2 : 1;
    const pxW = zoom * aspect;
    const pxH = zoom;

    const imgW = graphic.width * pxW;
    const imgH = graphic.height * pxH;

    // Canvas graphic solid background (matching secondary slot)
    const bg = slotColor(graphic, palette, secondary);
    ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
    ctx.fillRect(offsetX, offsetY, imgW, imgH);

    // Render graphic pixels
    for (let y = 0; y < graphic.height; y++) {
      for (let x = 0; x < graphic.width; x++) {
        const val = graphic.pixels[y * graphic.width + x];
        if (graphic.transparentSlot === val) continue;
        const col = slotColor(graphic, palette, val);
        ctx.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
        ctx.fillRect(offsetX + x * pxW, offsetY + y * pxH, pxW, pxH);
      }
    }

    // Geometry preview layer (Line, Rect, Ellipse)
    if (previewPoints.length > 0) {
      const col = slotColor(graphic, palette, paintValue);
      ctx.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
      for (const pt of previewPoints) {
        if (graphic.inBounds(pt.x, pt.y)) {
          ctx.fillRect(offsetX + pt.x * pxW, offsetY + pt.y * pxH, pxW, pxH);
        }
      }
    }

    // Pixel Grid
    if (showGrid && zoom >= 3) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= graphic.width; x++) {
        const sx = Math.floor(offsetX + x * pxW) + 0.5;
        ctx.moveTo(sx, offsetY);
        ctx.lineTo(sx, offsetY + imgH);
      }
      for (let y = 0; y <= graphic.height; y++) {
        const sy = Math.floor(offsetY + y * pxH) + 0.5;
        ctx.moveTo(offsetX, sy);
        ctx.lineTo(offsetX + imgW, sy);
      }
      ctx.stroke();
    }

    // Charset Character Grid (if graphic is charset)
    const charsetInfo = graphic.charsetInfo();
    if (showGrid && charsetInfo) {
      const { charWidth, charHeight } = charsetInfo;
      ctx.strokeStyle = 'rgba(100, 160, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= graphic.width; x += charWidth) {
        const sx = Math.floor(offsetX + x * pxW) + 0.5;
        ctx.moveTo(sx, offsetY);
        ctx.lineTo(sx, offsetY + imgH);
      }
      for (let y = 0; y <= graphic.height; y += charHeight) {
        const sy = Math.floor(offsetY + y * pxH) + 0.5;
        ctx.moveTo(offsetX, sy);
        ctx.lineTo(offsetX + imgW, sy);
      }
      ctx.stroke();
    }

    // Border around graphic frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX - 0.5, offsetY - 0.5, imgW + 1, imgH + 1);

    // Hover footprint cursor
    if (hoverPt && graphic.inBounds(hoverPt.x, hoverPt.y) && !isPanning) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      const effectiveTool = isAltDown ? 'eyedropper' : tool;
      if (effectiveTool === 'pencil' || effectiveTool === 'eraser') {
        const pts = brushPoints(brushShape, brushSize, hoverPt.x, hoverPt.y);
        for (const pt of pts) {
          if (graphic.inBounds(pt.x, pt.y)) {
            ctx.strokeRect(offsetX + pt.x * pxW, offsetY + pt.y * pxH, pxW, pxH);
          }
        }
      } else {
        ctx.strokeRect(offsetX + hoverPt.x * pxW, offsetY + hoverPt.y * pxH, pxW, pxH);
      }
    }
  }

  function applyStrokePoints(points: Point[], value: number) {
    let changed = false;
    for (const pt of points) {
      if (graphic.set(pt.x, pt.y, value)) {
        changed = true;
      }
    }
    if (changed) {
      onPixelChange?.();
      redraw();
    }
  }

  function handleMouseDown(e: MouseEvent) {
    if (e.button === 1 || isSpaceDown) {
      // Middle click or Space+click pan
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panStartOffsetX = offsetX;
      panStartOffsetY = offsetY;
      return;
    }

    const rect = canvasElem.getBoundingClientRect();
    const pt = screenToPixel(e.clientX - rect.left, e.clientY - rect.top);
    if (!graphic.inBounds(pt.x, pt.y)) return;

    const effectiveTool = isAltDown ? 'eyedropper' : tool;

    if (effectiveTool === 'eyedropper') {
      const val = graphic.get(pt.x, pt.y);
      if (val !== null) {
        if (e.button === 0) primary = val;
        else if (e.button === 2) secondary = val;
      }
      return;
    }

    paintValue = effectiveTool === 'eraser' ? 0 : e.button === 2 ? secondary : primary;

    if (effectiveTool === 'fill') {
      history.pushSnapshot(graphic.clonePixels());
      const pts = floodFill(graphic.width, graphic.height, (x, y) => graphic.get(x, y), pt.x, pt.y, paintValue);
      applyStrokePoints(pts, paintValue);
      return;
    }

    if (effectiveTool === 'line' || effectiveTool === 'rectangle' || effectiveTool === 'ellipse') {
      dragShapeStart = pt;
      isPainting = true;
      return;
    }

    // Brush painting
    history.pushSnapshot(graphic.clonePixels());
    isPainting = true;
    lastPaintPt = pt;
    const pts = brushPoints(brushShape, brushSize, pt.x, pt.y);
    applyStrokePoints(pts, paintValue);
  }

  function handleMouseMove(e: MouseEvent) {
    const rect = canvasElem.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (isPanning) {
      offsetX = panStartOffsetX + (e.clientX - panStartX);
      offsetY = panStartOffsetY + (e.clientY - panStartY);
      redraw();
      return;
    }

    const pt = screenToPixel(sx, sy);
    if (graphic.inBounds(pt.x, pt.y)) {
      hoverPt = pt;
      onHoverChange?.(pt);
    } else {
      hoverPt = null;
      onHoverChange?.(null);
    }

    if (isPainting && dragShapeStart) {
      // Live geometric preview
      let endPt = pt;
      if (isShiftDown) {
        if (tool === 'line') {
          endPt = snapLine(dragShapeStart.x, dragShapeStart.y, pt.x, pt.y);
        } else {
          // Square constraint
          const dx = pt.x - dragShapeStart.x;
          const dy = pt.y - dragShapeStart.y;
          const d = Math.max(Math.abs(dx), Math.abs(dy));
          endPt = {
            x: dragShapeStart.x + Math.sign(dx) * d,
            y: dragShapeStart.y + Math.sign(dy) * d,
          };
        }
      }

      if (tool === 'line') {
        previewPoints = linePoints(dragShapeStart.x, dragShapeStart.y, endPt.x, endPt.y);
      } else if (tool === 'rectangle') {
        previewPoints = rectPoints(dragShapeStart.x, dragShapeStart.y, endPt.x, endPt.y, fillMode);
      } else if (tool === 'ellipse') {
        previewPoints = ellipsePoints(dragShapeStart.x, dragShapeStart.y, endPt.x, endPt.y, fillMode);
      }
      redraw();
      return;
    }

    if (isPainting && lastPaintPt) {
      const line = linePoints(lastPaintPt.x, lastPaintPt.y, pt.x, pt.y);
      const allPts: Point[] = [];
      for (const p of line) {
        allPts.push(...brushPoints(brushShape, brushSize, p.x, p.y));
      }
      applyStrokePoints(allPts, paintValue);
      lastPaintPt = pt;
    } else {
      redraw();
    }
  }

  function handleMouseUp() {
    if (isPanning) {
      isPanning = false;
    }
    if (isPainting && dragShapeStart && previewPoints.length > 0) {
      history.pushSnapshot(graphic.clonePixels());
      applyStrokePoints(previewPoints, paintValue);
      previewPoints = [];
      dragShapeStart = null;
    }
    isPainting = false;
    lastPaintPt = null;
    dragShapeStart = null;
    previewPoints = [];
    redraw();
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const rect = canvasElem.getBoundingClientRect();
    const anchorX = e.clientX - rect.left;
    const anchorY = e.clientY - rect.top;
    const delta = e.deltaY < 0 ? 1 : -1;
    stepZoom(delta, anchorX, anchorY);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Alt') isAltDown = true;
    if (e.key === 'Shift') isShiftDown = true;
    if (e.code === 'Space') isSpaceDown = true;
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Alt') isAltDown = false;
    if (e.key === 'Shift') isShiftDown = false;
    if (e.code === 'Space') isSpaceDown = false;
  }

  $effect(() => {
    // Redraw whenever graphic, palette, or tool settings update
    graphic;
    palette;
    showGrid;
    secondary;
    redraw();
  });

  onMount(() => {
    fitToWindow();
    const observer = new ResizeObserver(() => redraw());
    observer.observe(containerElem);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });
</script>

<div
  bind:this={containerElem}
  class="canvas-container"
  role="region"
  aria-label="Pixel Drawing Canvas"
  oncontextmenu={(e) => e.preventDefault()}
>
  <canvas
    bind:this={canvasElem}
    onmousedown={handleMouseDown}
    onmousemove={handleMouseMove}
    onwheel={handleWheel}
  ></canvas>
</div>

<style>
  .canvas-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    cursor: crosshair;
  }
  canvas {
    display: block;
    image-rendering: pixelated;
  }
</style>
