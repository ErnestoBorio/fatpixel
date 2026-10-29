<script lang="ts">
  import { onMount } from 'svelte';
  import type { Graphic } from '../model/graphic';
  import type { Palette } from '../model/palette';
  import type { ToolType } from '../tools';
  import {
    linePoints,
    snapLine,
    rectPoints,
    ellipsePoints,
    brushPoints,
    floodFill,
    ZOOM_LEVELS,
    type BrushShape,
    type Point,
  } from '../raster';
  import { slotColor } from '../model/render';

  let {
    graphic,
    palette,
    projectRevision = 0,
    tool,
    brushShape,
    brushSize,
    fillMode,
    primary = $bindable(1),
    secondary = $bindable(0),
    activeCharIndex = $bindable(0),
    zoomIndex = $bindable(7),
    showGrid = true,
    onSnapshot,
    onPixelChange,
    onStrokeEnd,
    onHoverChange,
  } = $props<{
    graphic: Graphic;
    palette: Palette;
    projectRevision?: number;
    tool: ToolType;
    brushShape: BrushShape;
    brushSize: number;
    fillMode: boolean;
    primary?: number;
    secondary?: number;
    activeCharIndex?: number;
    zoomIndex?: number;
    showGrid?: boolean;
    onSnapshot?: () => void;
    onPixelChange?: () => void;
    onStrokeEnd?: () => void;
    onHoverChange?: (hover: { x: number; y: number } | null) => void;
  }>();



  let canvasElem: HTMLCanvasElement;
  let containerElem: HTMLDivElement;
  let sheetCanvasElem: HTMLCanvasElement | null = $state(null);
  let tileCanvasElem: HTMLCanvasElement | null = $state(null);
  let preview1xCanvasElem: HTMLCanvasElement | null = $state(null);
  let preview2xCanvasElem: HTMLCanvasElement | null = $state(null);
  let preview4xCanvasElem: HTMLCanvasElement | null = $state(null);

  // Charset active character (0..255)
  let sheetHoverChar = $state<number | null>(null);
  let showFloatingPanel = $state(typeof window !== 'undefined' ? window.innerWidth >= 1200 : true);

  let offsetX = 0;
  let offsetY = 0;
  let panOffsetX = 0;
  let panOffsetY = 0;

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

  let wheelAccumulator = 0;

  let graphicWidth = $derived.by(() => {
    projectRevision;
    return graphic.width;
  });
  let graphicHeight = $derived.by(() => {
    projectRevision;
    return graphic.height;
  });

  let isCharset = $derived(graphic.isCharset());
  let charsetInfo = $derived(graphic.charsetInfo());

  // Active draw bounds: 8x8 for character editing, graphic.width x graphic.height for sprite
  let drawWidth = $derived(isCharset ? (charsetInfo?.charWidth ?? 8) : graphicWidth);
  let drawHeight = $derived(isCharset ? (charsetInfo?.charHeight ?? 8) : graphicHeight);
  let drawAspect = $derived(graphic.pixelAspectRatio === '2:1' ? 2.0 : 1.0);
  let isDirect = $derived(
    graphic.depth === 256 ||
      graphic.bpp === 8 ||
      palette.colors.length === 256 ||
      (1 << graphic.bpp) === palette.colors.length
  );

  export function zoomIn() {
    if (zoomIndex < ZOOM_LEVELS.length - 1) {
      zoomIndex++;
      centerGraphic();
    }
  }

  export function zoomOut() {
    if (zoomIndex > 0) {
      zoomIndex--;
      centerGraphic();
    }
  }

  export function centerGraphic() {
    if (!containerElem) return;
    panOffsetX = 0;
    panOffsetY = 0;
    recalculateOffsets();
    redraw();
  }

  export function fitToWindow() {
    if (!containerElem) return;
    panOffsetX = 0;
    panOffsetY = 0;
    let sidePanelW = 0;
    if (showFloatingPanel && containerElem.clientWidth >= 900) {
      sidePanelW = isCharset ? 310 : 250;
    }
    const cw = Math.max(100, containerElem.clientWidth - sidePanelW - 30);
    const ch = Math.max(100, containerElem.clientHeight - 80);
    const gw = drawWidth * drawAspect;
    const gh = drawHeight;

    let bestIdx = 0;
    for (let i = ZOOM_LEVELS.length - 1; i >= 0; i--) {
      const z = ZOOM_LEVELS[i];
      if (gw * z <= cw && gh * z <= ch) {
        bestIdx = i;
        break;
      }
    }
    // For sprites, default to a centered zoom (16x default) instead of zooming in excessively
    zoomIndex = Math.min(bestIdx, isCharset ? 9 : 7);
    recalculateOffsets();
    redraw();
  }

  export function recalculateOffsets() {
    if (!containerElem) return;
    const zoom = ZOOM_LEVELS[zoomIndex];
    const pxW = zoom * drawAspect;
    const pxH = zoom;
    const imgW = drawWidth * pxW;
    const imgH = drawHeight * pxH;

    // Account for side panel on the right only if shown AND container has enough room
    let sidePanelW = 0;
    if (showFloatingPanel && containerElem.clientWidth >= (imgW + (isCharset ? 310 : 250) + 50)) {
      sidePanelW = isCharset ? 310 : 250;
    }
    const availableW = containerElem.clientWidth - sidePanelW;
    offsetX = Math.round((availableW - imgW) / 2) + panOffsetX;
    offsetY = Math.round((containerElem.clientHeight - imgH) / 2) + panOffsetY;

    // Guard against artwork being forced offscreen when not manually panning
    if (panOffsetX === 0 && (offsetX < 12 || (offsetX + imgW > containerElem.clientWidth && availableW < imgW))) {
      offsetX = Math.max(12, Math.round((containerElem.clientWidth - imgW) / 2));
    }
    if (panOffsetY === 0 && (offsetY < 12 || (offsetY + imgH > containerElem.clientHeight && containerElem.clientHeight < imgH))) {
      offsetY = Math.max(12, Math.round((containerElem.clientHeight - imgH) / 2));
    }
  }

  function stepZoom(delta: number) {
    const newIdx = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, zoomIndex + delta));
    if (newIdx !== zoomIndex) {
      zoomIndex = newIdx;
      recalculateOffsets();
      redraw();
    }
  }

  function screenToPixel(sx: number, sy: number): Point {
    const zoom = ZOOM_LEVELS[zoomIndex];
    const pxW = zoom * drawAspect;
    const pxH = zoom;
    return {
      x: Math.floor((sx - offsetX) / pxW),
      y: Math.floor((sy - offsetY) / pxH),
    };
  }

  function inDrawBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < drawWidth && y < drawHeight;
  }

  function getPixelVal(x: number, y: number): number | null {
    if (!inDrawBounds(x, y)) return null;
    if (isCharset) {
      return graphic.getCharPixel(activeCharIndex, x, y);
    }
    return graphic.get(x, y);
  }

  function setPixelVal(x: number, y: number, val: number): boolean {
    if (!inDrawBounds(x, y)) return false;
    if (isCharset) {
      return graphic.setCharPixel(activeCharIndex, x, y, val);
    }
    return graphic.set(x, y, val);
  }

  function getEffectivePaintValue(button: number): number {
    // Right button
    if (button === 2) {
      if (isDirect) {
        return secondary;
      }
      return 0; // In slotted mode, right button paints slot 0 (BG)
    }

    // Left button:
    if (isDirect) {
      return primary;
    }
    if (graphic.depth === 2) {
      // In 1bpp slotted mode, slot 0 is strictly for right-button, primary must be slot 1
      return 1;
    }
    if (graphic.depth === 4) {
      if (isShiftDown) return 2; // Slot 2 (Main)
      if (isAltDown) return 3;   // Slot 3 (Multicolor 2)
      return primary;
    }
    return primary;
  }

  export function redraw() {
    redrawMainCanvas();
    if (isCharset) {
      redrawSheetCanvas();
      redrawTilePreview();
    } else {
      redrawSpritePreviews();
    }
  }

  function redrawMainCanvas() {
    if (!canvasElem || !containerElem) return;
    const ctx = canvasElem.getContext('2d');
    if (!ctx) return;

    const width = containerElem.clientWidth;
    const height = containerElem.clientHeight;
    if (canvasElem.width !== width || canvasElem.height !== height) {
      canvasElem.width = width;
      canvasElem.height = height;
    }

    recalculateOffsets();

    // Background of viewport
    ctx.fillStyle = '#18181e';
    ctx.fillRect(0, 0, width, height);

    const zoom = ZOOM_LEVELS[zoomIndex];
    const pxW = zoom * drawAspect;
    const pxH = zoom;

    const imgW = drawWidth * pxW;
    const imgH = drawHeight * pxH;

    // Drawing background matching slot 0 (00 BG)
    const bg = slotColor(graphic, palette, 0);
    ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
    ctx.fillRect(offsetX, offsetY, imgW, imgH);

    // Render pixels
    for (let y = 0; y < drawHeight; y++) {
      for (let x = 0; x < drawWidth; x++) {
        const val = getPixelVal(x, y);
        if (val === null || graphic.transparentSlot === val) continue;
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
        if (inDrawBounds(pt.x, pt.y)) {
          ctx.fillRect(offsetX + pt.x * pxW, offsetY + pt.y * pxH, pxW, pxH);
        }
      }
    }

    // Pixel Grid: Subtle, faded difference mixing so grid lines are discernible
    // across all background/pixel colors without distracting from the artwork
    if (showGrid && zoom >= 2) {
      ctx.save();
      ctx.globalCompositeOperation = 'difference';
      const gridAlpha = zoom <= 3 ? 0.06 : (zoom <= 6 ? 0.09 : 0.12);
      ctx.strokeStyle = `rgba(255, 255, 255, ${gridAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Only draw internal pixel dividers so outer frame border remains crisp
      for (let x = 1; x < drawWidth; x++) {
        const sx = Math.floor(offsetX + x * pxW) + 0.5;
        ctx.moveTo(sx, offsetY);
        ctx.lineTo(sx, offsetY + imgH);
      }
      for (let y = 1; y < drawHeight; y++) {
        const sy = Math.floor(offsetY + y * pxH) + 0.5;
        ctx.moveTo(offsetX, sy);
        ctx.lineTo(offsetX + imgW, sy);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Border around graphic/character frame
    ctx.strokeStyle = isCharset ? 'rgba(80, 160, 255, 0.6)' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(offsetX - 0.5, offsetY - 0.5, imgW + 1, imgH + 1);

    // Hover footprint cursor
    if (hoverPt && inDrawBounds(hoverPt.x, hoverPt.y) && !isPanning) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5;
      const effectiveTool = isAltDown ? 'eyedropper' : tool;
      if (effectiveTool === 'pencil') {
        const pts = brushPoints(brushShape, brushSize, hoverPt.x, hoverPt.y);
        for (const pt of pts) {
          if (inDrawBounds(pt.x, pt.y)) {
            ctx.strokeRect(offsetX + pt.x * pxW, offsetY + pt.y * pxH, pxW, pxH);
          }
        }
      } else {
        ctx.strokeRect(offsetX + hoverPt.x * pxW, offsetY + hoverPt.y * pxH, pxW, pxH);
      }
    }
  }

  function redrawSheetCanvas() {
    if (!sheetCanvasElem || !isCharset || !charsetInfo) return;

    const { charWidth, charHeight, charCount, columns } = charsetInfo;
    const rows = Math.ceil(charCount / columns);
    const scale = 2; // 2x scale for clear display
    const cellW = charWidth * scale;
    const cellH = charHeight * scale;
    const gap = 1; // 1 virtual pixel separation

    const totalW = columns * (cellW + gap) + gap;
    const totalH = rows * (cellH + gap) + gap;

    if (sheetCanvasElem.width !== totalW || sheetCanvasElem.height !== totalH) {
      sheetCanvasElem.width = totalW;
      sheetCanvasElem.height = totalH;
    }

    const ctx = sheetCanvasElem.getContext('2d');
    if (!ctx) return;

    // Grid separator background
    ctx.fillStyle = '#262833';
    ctx.fillRect(0, 0, totalW, totalH);

    const bgRgb = slotColor(graphic, palette, 0);

    for (let c = 0; c < charCount; c++) {
      const col = c % columns;
      const row = Math.floor(c / columns);
      const cx = gap + col * (cellW + gap);
      const cy = gap + row * (cellH + gap);

      // Character cell background
      ctx.fillStyle = `rgb(${bgRgb.r},${bgRgb.g},${bgRgb.b})`;
      ctx.fillRect(cx, cy, cellW, cellH);

      // Render character pixels
      for (let ly = 0; ly < charHeight; ly++) {
        for (let lx = 0; lx < charWidth; lx++) {
          const val = graphic.getCharPixel(c, lx, ly);
          if (val === null || val === 0 || graphic.transparentSlot === val) continue;
          const colRgb = slotColor(graphic, palette, val);
          ctx.fillStyle = `rgb(${colRgb.r},${colRgb.g},${colRgb.b})`;
          ctx.fillRect(cx + lx * scale, cy + ly * scale, scale, scale);
        }
      }

      // Active character highlight
      if (c === activeCharIndex) {
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 1, cy - 1, cellW + 2, cellH + 2);
      } else if (c === sheetHoverChar) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 0.5, cy - 0.5, cellW + 1, cellH + 1);
      }
    }
  }

  function initTileCanvas(node: HTMLCanvasElement) {
    tileCanvasElem = node;
    redrawTilePreview();
  }

  function redrawTilePreview() {
    if (!tileCanvasElem || !isCharset || !charsetInfo) return;

    const { charWidth, charHeight } = charsetInfo;
    const aspect = graphic.pixelMode === 'wide' ? 2 : 1;
    const matrixCols = 5;
    const matrixRows = 5;
    const tileScale = 2;

    const tileW = charWidth * aspect * tileScale;
    const tileH = charHeight * tileScale;
    const totalW = matrixCols * tileW;
    const totalH = matrixRows * tileH;

    if (tileCanvasElem.width !== totalW || tileCanvasElem.height !== totalH) {
      tileCanvasElem.width = totalW;
      tileCanvasElem.height = totalH;
    }

    const ctx = tileCanvasElem.getContext('2d');
    if (!ctx) return;

    const bg = slotColor(graphic, palette, 0);
    ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
    ctx.fillRect(0, 0, totalW, totalH);

    // Cache current character's pixels
    const charPixels = new Array(charWidth * charHeight);
    for (let ly = 0; ly < charHeight; ly++) {
      for (let lx = 0; lx < charWidth; lx++) {
        charPixels[ly * charWidth + lx] = graphic.getCharPixel(activeCharIndex, lx, ly);
      }
    }

    // Render 4x4 matrix of activeCharIndex
    for (let tr = 0; tr < matrixRows; tr++) {
      for (let tc = 0; tc < matrixCols; tc++) {
        const originX = tc * tileW;
        const originY = tr * tileH;

        for (let ly = 0; ly < charHeight; ly++) {
          for (let lx = 0; lx < charWidth; lx++) {
            const val = charPixels[ly * charWidth + lx];
            if (val === null || val === 0 || graphic.transparentSlot === val) continue;
            const col = slotColor(graphic, palette, val);
            ctx.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
            ctx.fillRect(
              originX + lx * aspect * tileScale,
              originY + ly * tileScale,
              aspect * tileScale,
              tileScale
            );
          }
        }
      }
    }
  }

  function redrawSpritePreviews() {
    if (isCharset) return;

    const w = graphic.width;
    const h = graphic.height;
    const aspect = graphic.pixelMode === 'wide' ? 2 : 1;
    const bg = slotColor(graphic, palette, 0);
    const bgCss = `rgb(${bg.r},${bg.g},${bg.b})`;

    // 1x Preview (1:1 pixels)
    if (preview1xCanvasElem) {
      const targetW = Math.round(w * aspect);
      const targetH = h;
      if (preview1xCanvasElem.width !== targetW || preview1xCanvasElem.height !== targetH) {
        preview1xCanvasElem.width = targetW;
        preview1xCanvasElem.height = targetH;
      }
      const ctx1 = preview1xCanvasElem.getContext('2d');
      if (ctx1) {
        ctx1.fillStyle = bgCss;
        ctx1.fillRect(0, 0, targetW, targetH);
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const val = graphic.get(x, y);
            if (val === null || val === 0 || graphic.transparentSlot === val) continue;
            const col = slotColor(graphic, palette, val);
            ctx1.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
            ctx1.fillRect(x * aspect, y, aspect, 1);
          }
        }
      }
    }

    // 2x Preview (2x zoom)
    if (preview2xCanvasElem) {
      const targetW = Math.round(w * aspect * 2);
      const targetH = h * 2;
      if (preview2xCanvasElem.width !== targetW || preview2xCanvasElem.height !== targetH) {
        preview2xCanvasElem.width = targetW;
        preview2xCanvasElem.height = targetH;
      }
      const ctx2 = preview2xCanvasElem.getContext('2d');
      if (ctx2) {
        ctx2.fillStyle = bgCss;
        ctx2.fillRect(0, 0, targetW, targetH);
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const val = graphic.get(x, y);
            if (val === null || val === 0 || graphic.transparentSlot === val) continue;
            const col = slotColor(graphic, palette, val);
            ctx2.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
            ctx2.fillRect(x * aspect * 2, y * 2, aspect * 2, 2);
          }
        }
      }
    }

    // 4x Preview (4x zoom)
    if (preview4xCanvasElem) {
      const targetW = Math.round(w * aspect * 4);
      const targetH = h * 4;
      if (preview4xCanvasElem.width !== targetW || preview4xCanvasElem.height !== targetH) {
        preview4xCanvasElem.width = targetW;
        preview4xCanvasElem.height = targetH;
      }
      const ctx4 = preview4xCanvasElem.getContext('2d');
      if (ctx4) {
        ctx4.fillStyle = bgCss;
        ctx4.fillRect(0, 0, targetW, targetH);
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const val = graphic.get(x, y);
            if (val === null || val === 0 || graphic.transparentSlot === val) continue;
            const col = slotColor(graphic, palette, val);
            ctx4.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
            ctx4.fillRect(x * aspect * 4, y * 4, aspect * 4, 4);
          }
        }
      }
    }
  }

  function applyStrokePoints(points: Point[], value: number) {
    let changed = false;
    for (const pt of points) {
      if (setPixelVal(pt.x, pt.y, value)) {
        changed = true;
      }
    }
    if (changed) {
      onPixelChange?.();
      redraw();
    }
  }

  function pushHistory() {
    onSnapshot?.();
  }

  function handleMouseDown(e: MouseEvent) {
    if (e.button === 1 || isSpaceDown) {
      // Middle click or Space+click pan
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panStartOffsetX = panOffsetX;
      panStartOffsetY = panOffsetY;
      return;
    }

    const rect = canvasElem.getBoundingClientRect();
    const pt = screenToPixel(e.clientX - rect.left, e.clientY - rect.top);
    if (!inDrawBounds(pt.x, pt.y)) return;

    const effectiveTool = isAltDown ? 'eyedropper' : tool;

    if (effectiveTool === 'eyedropper') {
      const val = getPixelVal(pt.x, pt.y);
      if (val !== null) {
        if (e.button === 0) {
          if (!isDirect && graphic.depth === 2 && val === 0) {
            // In 1bpp slotted mode, slot 0 cannot be selected as primary draw slot
          } else {
            primary = val;
          }
        } else if (e.button === 2) {
          secondary = val;
        }
      }
      return;
    }



    paintValue = getEffectivePaintValue(e.button);

    if (effectiveTool === 'fill') {
      pushHistory();
      const pts = floodFill(
        drawWidth,
        drawHeight,
        (x, y) => getPixelVal(x, y),
        pt.x,
        pt.y,
        paintValue
      );
      applyStrokePoints(pts, paintValue);
      return;
    }

    if (effectiveTool === 'line' || effectiveTool === 'rectangle' || effectiveTool === 'ellipse') {
      dragShapeStart = pt;
      isPainting = true;
      return;
    }

    // Brush painting
    pushHistory();
    isPainting = true;
    lastPaintPt = pt;
    const pts = brushPoints(brushShape, brushSize, pt.x, pt.y);
    applyStrokePoints(pts, paintValue);
  }

  function updateShapePreview(pt: Point) {
    if (!isPainting || !dragShapeStart) return;
    let endPt = pt;
    if (isShiftDown) {
      if (tool === 'line') {
        endPt = snapLine(dragShapeStart.x, dragShapeStart.y, pt.x, pt.y, drawAspect);
      } else {
        // Visual 1:1 constraint for circle / square (adjusting horizontal pixels by drawAspect)
        const dx = pt.x - dragShapeStart.x;
        const dy = pt.y - dragShapeStart.y;
        const sx = dx === 0 ? 1 : Math.sign(dx);
        const sy = dy === 0 ? 1 : Math.sign(dy);
        const visualDx = Math.abs(dx) * drawAspect;
        const visualDy = Math.abs(dy);
        const visualD = Math.max(visualDx, visualDy);
        const targetDx = visualD === 0 ? 0 : Math.max(1, Math.round(visualD / drawAspect));
        const targetDy = visualD;
        endPt = {
          x: dragShapeStart.x + sx * targetDx,
          y: dragShapeStart.y + sy * targetDy,
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
  }

  function handleMouseMove(e: MouseEvent) {
    const rect = canvasElem.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (isPanning) {
      panOffsetX = panStartOffsetX + (e.clientX - panStartX);
      panOffsetY = panStartOffsetY + (e.clientY - panStartY);
      redraw();
      return;
    }

    const pt = screenToPixel(sx, sy);
    if (inDrawBounds(pt.x, pt.y)) {
      hoverPt = pt;
      onHoverChange?.(pt);
    } else {
      hoverPt = null;
      onHoverChange?.(null);
    }

    if (isPainting && dragShapeStart) {
      updateShapePreview(pt);
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
    const wasPainting = isPainting;
    if (isPainting && dragShapeStart && previewPoints.length > 0) {
      pushHistory();
      applyStrokePoints(previewPoints, paintValue);
      previewPoints = [];
      dragShapeStart = null;
    }
    isPainting = false;
    lastPaintPt = null;
    dragShapeStart = null;
    previewPoints = [];
    redraw();
    if (wasPainting) {
      onStrokeEnd?.();
    }
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    wheelAccumulator += e.deltaY;
    if (Math.abs(wheelAccumulator) >= 30) {
      const delta = wheelAccumulator < 0 ? 1 : -1;
      wheelAccumulator = 0;
      stepZoom(delta);
    }
  }

  function handleSheetMouseDown(e: MouseEvent) {
    if (!sheetCanvasElem || !charsetInfo) return;
    const rect = sheetCanvasElem.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const { charWidth, charHeight, columns, charCount } = charsetInfo;
    const scale = 2;
    const cellW = charWidth * scale;
    const cellH = charHeight * scale;
    const gap = 1;

    const col = Math.floor((mx - gap) / (cellW + gap));
    const row = Math.floor((my - gap) / (cellH + gap));

    if (col >= 0 && col < columns) {
      const idx = row * columns + col;
      if (idx >= 0 && idx < charCount) {
        activeCharIndex = idx;
        redraw();
      }
    }
  }

  function handleSheetMouseMove(e: MouseEvent) {
    if (!sheetCanvasElem || !charsetInfo) return;
    const rect = sheetCanvasElem.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const { charWidth, charHeight, columns, charCount } = charsetInfo;
    const scale = 2;
    const cellW = charWidth * scale;
    const cellH = charHeight * scale;
    const gap = 1;

    const col = Math.floor((mx - gap) / (cellW + gap));
    const row = Math.floor((my - gap) / (cellH + gap));

    if (col >= 0 && col < columns) {
      const idx = row * columns + col;
      if (idx >= 0 && idx < charCount) {
        sheetHoverChar = idx;
        redrawSheetCanvas();
        return;
      }
    }
    sheetHoverChar = null;
    redrawSheetCanvas();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;

    if (e.key === 'Alt') isAltDown = true;
    if (e.key === 'Shift') {
      isShiftDown = true;
      if (isPainting && dragShapeStart && hoverPt) {
        updateShapePreview(hoverPt);
      }
    }
    if (e.code === 'Space') isSpaceDown = true;

    // Slot selection hotkeys: 0..9 based on graphic depth
    if (!e.metaKey && !e.ctrlKey && graphic.depth <= 16) {
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num < graphic.depth) {
        primary = num;
      }
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Alt') isAltDown = false;
    if (e.key === 'Shift') {
      isShiftDown = false;
      if (isPainting && dragShapeStart && hoverPt) {
        updateShapePreview(hoverPt);
      }
    }
    if (e.code === 'Space') isSpaceDown = false;
  }

  function prevChar() {
    if (activeCharIndex > 0) {
      activeCharIndex--;
      redraw();
    }
  }

  function nextChar() {
    if (activeCharIndex < (charsetInfo?.charCount ?? 256) - 1) {
      activeCharIndex++;
      redraw();
    }
  }



  $effect(() => {
    // Redraw whenever graphic, palette, activeCharIndex or tool settings update
    projectRevision;
    graphic;
    palette;
    showGrid;
    secondary;
    primary;
    activeCharIndex;
    preview1xCanvasElem;
    preview2xCanvasElem;
    preview4xCanvasElem;
    tileCanvasElem;
    showFloatingPanel;
    recalculateOffsets();
    redraw();
  });

  onMount(() => {
    fitToWindow();
    const observer = new ResizeObserver(() => {
      recalculateOffsets();
      redraw();
    });
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
  <!-- Main Drawing Canvas (Sprite or Single Char) -->
  <canvas
    class="pixel-canvas"
    bind:this={canvasElem}
    onmousedown={handleMouseDown}
    onmousemove={handleMouseMove}
    onwheel={handleWheel}
  ></canvas>

  <!-- Charset Navigation Bar (when editing charset) -->
  {#if isCharset}
    <div class="char-nav-bar">
      <button class="nav-btn" onclick={prevChar} disabled={activeCharIndex === 0} title="Previous Character">◀</button>
      <div class="char-info">
        <span class="char-title">Char #{activeCharIndex}</span>
        <span class="char-hex">(0x{activeCharIndex.toString(16).toUpperCase().padStart(2, '0')})</span>
      </div>
      <button class="nav-btn" onclick={nextChar} disabled={activeCharIndex >= (charsetInfo?.charCount ?? 256) - 1} title="Next Character">▶</button>
    </div>

    <!-- 256 Character Sheet View (docked on right) -->
    {#if showFloatingPanel}
      <div class="charset-sheet-panel">
        <div class="sheet-header">
          <span class="sheet-title">256-Char Sheet</span>
          <div class="sheet-actions">
            <span class="sheet-meta">
              {sheetHoverChar !== null ? `Char #${sheetHoverChar} (0x${sheetHoverChar.toString(16).toUpperCase().padStart(2, '0')})` : '1px grid'}
            </span>
            <button
              type="button"
              class="sheet-minimize-btn"
              onclick={() => { showFloatingPanel = false; recalculateOffsets(); redraw(); }}
              title="Minimize Charset Sheet"
              aria-label="Minimize Charset Sheet"
            >
              −
            </button>
          </div>
        </div>
        <div class="sheet-canvas-wrapper">
          <canvas
            bind:this={sheetCanvasElem}
            onmousedown={handleSheetMouseDown}
            onmousemove={handleSheetMouseMove}
            onmouseleave={() => { sheetHoverChar = null; redrawSheetCanvas(); }}
          ></canvas>
        </div>

        <!-- 5x5 Tiling Preview (pure graphical preview) -->
        <div class="tile-preview-section">
          <div class="tile-preview-viewport">
            <canvas
              bind:this={tileCanvasElem}
              use:initTileCanvas
              class="tile-preview-canvas"
            ></canvas>
          </div>
        </div>
      </div>
    {:else}
      <button
        type="button"
        class="floating-panel-pill"
        onclick={() => { showFloatingPanel = true; recalculateOffsets(); redraw(); }}
        title="Open 256-Char Sheet View"
      >
        🔤 256-Char Sheet ▾
      </button>
    {/if}
  {/if}

  {#if !isCharset}
    {#if showFloatingPanel}
      <!-- Sprite Preview Panel (1x and 2x zoom views) -->
      <div class="sprite-preview-panel">
        <div class="sheet-header">
          <div class="sheet-title-group">
            <span class="sheet-title">Preview</span>
            <span class="sheet-meta">{graphicWidth}×{graphicHeight}</span>
          </div>
          <button
            type="button"
            class="sheet-minimize-btn"
            onclick={() => { showFloatingPanel = false; recalculateOffsets(); redraw(); }}
            title="Minimize Preview Panel"
            aria-label="Minimize Preview Panel"
          >
            −
          </button>
        </div>
        <div class="sprite-previews-container">
          <!-- 1x Preview (1:1 pixels) -->
          <div class="preview-box">
            <div class="preview-label">
              <span>1×</span>
            </div>
            <div class="preview-viewport">
              <canvas bind:this={preview1xCanvasElem}></canvas>
            </div>
          </div>

          <!-- 2x Preview (2x zoom) -->
          <div class="preview-box">
            <div class="preview-label">
              <span>2×</span>
            </div>
            <div class="preview-viewport">
              <canvas bind:this={preview2xCanvasElem}></canvas>
            </div>
          </div>

          <!-- 4x Preview (4x zoom) -->
          <div class="preview-box">
            <div class="preview-label">
              <span>4×</span>
            </div>
            <div class="preview-viewport">
              <canvas bind:this={preview4xCanvasElem}></canvas>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <button
        type="button"
        class="floating-panel-pill"
        onclick={() => { showFloatingPanel = true; recalculateOffsets(); redraw(); }}
        title="Open Sprite Preview Panel"
      >
        👁 Preview ({graphicWidth}×{graphicHeight}) ▾
      </button>
    {/if}
  {/if}

  <!-- Floating Zoom Toolbar -->
  <div class="zoom-toolbar">
    <button class="zoom-btn" onclick={zoomOut} title="Zoom Out (-)">−</button>
    <button class="zoom-btn zoom-level" onclick={fitToWindow} title="Click to fit and center (0)">
      {ZOOM_LEVELS[zoomIndex]}×
    </button>
    <button class="zoom-btn" onclick={zoomIn} title="Zoom In (+)">+</button>
    <button class="zoom-btn fit-btn" onclick={fitToWindow} title="Center & Fit (0)">⛶ Center</button>
  </div>
</div>

<style>
  .canvas-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    cursor: crosshair;
    background: #18181e;
  }
  canvas {
    display: block;
    image-rendering: pixelated;
  }
  .zoom-toolbar {
    position: absolute;
    bottom: 12px;
    left: 12px;
    display: flex;
    align-items: center;
    background: rgba(30, 30, 40, 0.85);
    backdrop-filter: blur(4px);
    border: 1px solid #38384a;
    border-radius: 6px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    z-index: 50;
  }
  .zoom-btn {
    background: none;
    border: none;
    color: #ccc;
    padding: 5px 9px;
    font-size: 12px;
    cursor: pointer;
    border-right: 1px solid #38384a;
  }
  .zoom-btn:last-child {
    border-right: none;
  }
  .zoom-btn:hover {
    background: #323244;
    color: #fff;
  }
  .zoom-level {
    font-weight: bold;
    font-size: 11px;
    min-width: 42px;
    text-align: center;
  }
  .fit-btn {
    font-size: 11px;
    padding: 5px 10px;
  }
  .char-nav-bar {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(30, 30, 40, 0.9);
    backdrop-filter: blur(4px);
    border: 1px solid #38384a;
    border-radius: 6px;
    padding: 4px 8px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
    z-index: 50;
    color: #eee;
    font-size: 12px;
  }
  .nav-btn {
    background: #252532;
    border: 1px solid #3e3e52;
    color: #fff;
    padding: 3px 8px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
  }
  .nav-btn:hover:not(:disabled) {
    background: #39394e;
  }
  .nav-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .char-info {
    display: flex;
    align-items: baseline;
    gap: 4px;
    font-weight: 600;
  }
  .char-hex {
    font-family: monospace;
    color: #88aacc;
    font-size: 11px;
  }

  .charset-sheet-panel {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 295px;
    max-height: calc(100% - 24px);
    background: rgba(26, 26, 36, 0.94);
    backdrop-filter: blur(8px);
    border: 1px solid #36364a;
    border-radius: 8px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 40;
  }
  .sheet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 10px;
    background: #20202c;
    border-bottom: 1px solid #333344;
  }
  .sheet-title-group {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .sheet-title {
    font-weight: bold;
    font-size: 12px;
    color: #eee;
  }
  .sheet-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sheet-minimize-btn {
    background: #282836;
    border: 1px solid #3d3d50;
    color: #bbb;
    width: 20px;
    height: 20px;
    border-radius: 3px;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }
  .sheet-minimize-btn:hover {
    background: #38384a;
    color: #fff;
    border-color: #5588cc;
  }
  .floating-panel-pill {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(26, 26, 36, 0.92);
    backdrop-filter: blur(6px);
    border: 1px solid #3d3d50;
    color: #c0d0e8;
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    z-index: 40;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .floating-panel-pill:hover {
    background: #2d3b52;
    border-color: #5882c4;
    color: #fff;
  }
  .sheet-meta {
    font-size: 11px;
    color: #88aacc;
    font-family: monospace;
  }
  .sheet-canvas-wrapper {
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: #14141b;
    flex-shrink: 1;
    min-height: 100px;
  }
  .tile-preview-section {
    display: flex;
    flex-direction: column;
    border-top: 1px solid #333344;
    background: #14141b;
    flex-shrink: 0;
  }
  .tile-preview-viewport {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    background: #121218;
    overflow: auto;
  }
  .tile-preview-canvas {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.12);
    image-rendering: pixelated;
  }
  .sprite-preview-panel {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 235px;
    max-height: calc(100% - 24px);
    background: rgba(26, 26, 36, 0.94);
    backdrop-filter: blur(8px);
    border: 1px solid #36364a;
    border-radius: 8px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 40;
  }
  .sprite-previews-container {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
  }
  .preview-box {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .preview-label {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 600;
    color: #aaa;
  }
  .preview-viewport {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: #14141b;
    border: 1px solid #2b2b3a;
    border-radius: 5px;
    min-height: 36px;
    overflow: auto;
  }
  .preview-viewport canvas {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.12);
    image-rendering: pixelated;
    max-width: 100%;
    height: auto;
  }
</style>
