<script lang="ts">
  import type { Graphic } from '../model/graphic';
  import {
    BUILTIN_PALETTES,
    getColorName,
    rgbToHexStr,
    type Palette,
  } from '../model/palette';
  import { slotColor } from '../model/render';

  let {
    graphic,
    palette,
    projectRevision = 0,
    primary = $bindable(1),
    secondary = $bindable(0),
    onBeforeChange,
    onColorChange,
    onPaletteSelect,
  } = $props<{
    graphic: Graphic;
    palette: Palette;
    projectRevision?: number;
    primary: number;
    secondary: number;
    onBeforeChange?: () => void;
    onColorChange?: () => void;
    onPaletteSelect?: (paletteId: string) => void;
  }>();

  let colorMapCanvas: HTMLCanvasElement | undefined = $state();
  let hoveredColorIdx = $state<number | null>(null);

  function getHex(rgb: { r: number; g: number; b: number }) {
    return rgbToHexStr(rgb);
  }

  let isDirect = $derived.by(() => {
    projectRevision;
    return (
      graphic.depth === 256 ||
      graphic.bpp === 8 ||
      palette.colors.length === 256 ||
      (1 << graphic.bpp) === palette.colors.length
    );
  });

  $effect(() => {
    // In 1bpp mode (depth 2) with slots, slot 0 is strictly for right-button, primary must be slot 1
    if (!isDirect && graphic.depth === 2 && primary === 0) {
      primary = 1;
    }
  });

  let graphicDepth = $derived.by(() => {
    projectRevision;
    return graphic.depth;
  });

  let graphicSlots = $derived.by(() => {
    projectRevision;
    return [...graphic.slots];
  });

  let priRgb = $derived.by(() => {
    projectRevision;
    graphicSlots;
    if (isDirect) {
      return palette.colors[primary % palette.colors.length] ?? palette.colors[0];
    }
    return slotColor(graphic, palette, primary);
  });

  let secRgb = $derived.by(() => {
    projectRevision;
    graphicSlots;
    if (isDirect) {
      return palette.colors[0] ?? palette.colors[0];
    }
    return slotColor(graphic, palette, 0);
  });

  function setSlotColor(slotIdx: number, paletteIndex: number) {
    onBeforeChange?.();
    graphic.slots[slotIdx] = paletteIndex;
    graphic.slots = [...graphic.slots];
    onColorChange?.();
  }

  function getSlotColor(idx: number, _slots: number[]) {
    return slotColor(graphic, palette, idx);
  }

  function handlePaletteSelect(e: Event) {
    const id = (e.target as HTMLSelectElement).value;
    hoveredColorIdx = null;
    onPaletteSelect?.(id);
  }

  function drawColorMap() {
    if (!colorMapCanvas || palette.colors.length !== 256) return;
    const ctx = colorMapCanvas.getContext('2d');
    if (!ctx) return;

    const cellSize = 10;
    // Draw 16x16 swatches
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        const idx = row * 16 + col;
        const c = palette.colors[idx];
        if (c) {
          ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    const priIdx = isDirect ? primary : (graphicSlots[primary] ?? 0);
    const secIdx = isDirect ? 0 : (graphicSlots[0] ?? 0);

    // Secondary marker (R)
    if (secIdx >= 0 && secIdx < 256) {
      const sCol = secIdx % 16;
      const sRow = Math.floor(secIdx / 16);
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.strokeRect(sCol * cellSize + 1, sRow * cellSize + 1, cellSize - 2, cellSize - 2);
    }

    // Primary marker (L)
    if (priIdx >= 0 && priIdx < 256) {
      const pCol = priIdx % 16;
      const pRow = Math.floor(priIdx / 16);
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(pCol * cellSize + 1, pRow * cellSize + 1, cellSize - 2, cellSize - 2);
    }

    // Hover marker
    if (hoveredColorIdx !== null && hoveredColorIdx >= 0 && hoveredColorIdx < 256) {
      const hCol = hoveredColorIdx % 16;
      const hRow = Math.floor(hoveredColorIdx / 16);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(hCol * cellSize, hRow * cellSize, cellSize, cellSize);
    }
  }

  $effect(() => {
    projectRevision;
    palette;
    primary;
    secondary;
    graphicSlots;
    hoveredColorIdx;
    if (colorMapCanvas) {
      drawColorMap();
    }
  });

  function handleMapMouseMove(e: MouseEvent) {
    if (!colorMapCanvas) return;
    const rect = colorMapCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 10);
    const y = Math.floor((e.clientY - rect.top) / 10);
    if (x >= 0 && x < 16 && y >= 0 && y < 16) {
      hoveredColorIdx = y * 16 + x;
    } else {
      hoveredColorIdx = null;
    }
  }

  function handleMapClick(e: MouseEvent) {
    if (!colorMapCanvas) return;
    const rect = colorMapCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 10);
    const y = Math.floor((e.clientY - rect.top) / 10);
    if (x >= 0 && x < 16 && y >= 0 && y < 16) {
      const idx = y * 16 + x;
      if (isDirect) {
        primary = idx;
      } else {
        setSlotColor(primary, idx);
      }
    }
  }

  function handleMapContextMenu(e: MouseEvent) {
    e.preventDefault();
    if (!colorMapCanvas) return;
    const rect = colorMapCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 10);
    const y = Math.floor((e.clientY - rect.top) / 10);
    if (x >= 0 && x < 16 && y >= 0 && y < 16) {
      const idx = y * 16 + x;
      if (isDirect) {
        secondary = 0;
      } else {
        setSlotColor(0, idx);
      }
    }
  }
</script>

<div class="palette-panel">
  <div class="header">
    <span class="title">Palette</span>
    <select
      class="palette-select"
      value={palette.id}
      onchange={handlePaletteSelect}
      oninput={handlePaletteSelect}
    >
      {#each BUILTIN_PALETTES as p}
        <option value={p.id}>{p.name}</option>
      {/each}
    </select>
  </div>

  <!-- Active Draw Swatches -->
  <div class="active-swatches">
    <div class="swatch-container">
      <div
        class="swatch sec-swatch"
        style="background-color: {getHex(secRgb)};"
        title="Right click color: {isDirect ? 'Color #0 (BG)' : 'Background (Slot 0)'}"
      ></div>
      <div
        class="swatch pri-swatch"
        style="background-color: {getHex(priRgb)};"
        title="Left click color: {isDirect ? `Color #${primary}` : `Active slot (Slot ${primary})`}"
      ></div>
    </div>
    <div class="swatch-labels">
      <div><strong>L:</strong> {isDirect ? `Color #${primary}` : `Slot ${primary}`}</div>
      <div><strong>R:</strong> {isDirect ? 'Color #0 (BG)' : 'Slot 0 (BG)'}</div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Color Slots (only for 1, 2, 3, 4 bpp; hidden in direct mode) -->
  {#if !isDirect}
    <div class="section-label">Color Slots ({graphicDepth})</div>
    <div class="slots-container" class:dense={graphicDepth > 4}>
      {#each Array.from({ length: graphicDepth }, (_, i) => i) as slotIdx}
        {@const sRgb = getSlotColor(slotIdx, graphicSlots)}
        {@const isSelectedPri = primary === slotIdx}
        {@const isFixedBg = graphicDepth === 2 && slotIdx === 0}
        <button
          class="slot-card {isSelectedPri ? 'active-slot' : ''} {isFixedBg ? 'fixed-bg' : ''}"
          onclick={() => {
            if (isFixedBg) return;
            primary = slotIdx;
          }}
          title={isFixedBg
            ? 'Slot 0: Background (fixed to Right Click in 1bpp mode)'
            : `Slot ${slotIdx}: Click to select for Left Click draw`}
        >
          <div
            class="slot-color-preview"
            style={sRgb ? `background-color: ${getHex(sRgb)};` : 'background: #1a1a22; border-style: dashed;'}
          ></div>
          <div class="slot-badge-label">
            {#if isSelectedPri}
              <span class="slot-badge pri">L</span>
            {:else if isFixedBg}
              <span class="slot-badge sec">R</span>
            {:else}
              <span class="slot-idx-num">{slotIdx === 0 ? 'BG' : slotIdx}</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
    <div class="divider"></div>
  {/if}

  <div class="section-label">{palette.name}</div>
  <div class="help-text">
    {#if isDirect}
      Left-click: pick color to draw · Right-click: Color #0 (BG)
    {:else}
      Left-click: assign to Slot {primary} · Right-click: assign to Slot 0 (BG)
    {/if}
  </div>

  <!-- Palette swatches: 256-color map canvas OR standard swatch grid -->
  {#if palette.colors.length === 256}
    <div class="color-map-wrapper">
      <canvas
        bind:this={colorMapCanvas}
        width={160}
        height={160}
        class="color-map-canvas"
        onmousemove={handleMapMouseMove}
        onmouseleave={() => (hoveredColorIdx = null)}
        onclick={handleMapClick}
        oncontextmenu={handleMapContextMenu}
      ></canvas>

      <div class="color-readout">
        {#if hoveredColorIdx !== null && palette.colors[hoveredColorIdx]}
          {@const hc = palette.colors[hoveredColorIdx]}
          <div class="readout-content">
            <span class="readout-dot" style="background-color: {getHex(hc)};"></span>
            <span class="readout-idx">#{hoveredColorIdx}</span>
            <span class="readout-rgb">({hc.r}, {hc.g}, {hc.b})</span>
            <span class="readout-hex">{getHex(hc)}</span>
          </div>
        {:else}
          {@const activeIdx = isDirect ? primary : (graphicSlots[primary] ?? 0)}
          {@const ac = palette.colors[activeIdx % palette.colors.length] ?? palette.colors[0]}
          <div class="readout-content">
            <span class="readout-dot" style="background-color: {getHex(ac)};"></span>
            <span class="readout-idx">#{activeIdx}</span>
            <span class="readout-rgb">({ac.r}, {ac.g}, {ac.b})</span>
            <span class="readout-hex">{getHex(ac)}</span>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    {@const count = palette.colors.length}
    {@const gridCols = count >= 128 ? 16 : count >= 32 ? 8 : Math.min(4, count)}
    <div
      class="palette-grid"
      class:dense-32={count === 32}
      class:dense-64={count === 64}
      class:dense-small={count >= 128}
      style="grid-template-columns: repeat({gridCols}, 1fr);"
    >
      {#each palette.colors as col, idx}
        {@const isPri = isDirect ? primary === idx : graphicSlots[primary] === idx}
        {@const isSec = isDirect ? idx === 0 : graphicSlots[0] === idx}
        {@const colorName = getColorName(palette.id, idx)}
        <button
          class="color-btn"
          class:is-pri={isPri}
          class:is-sec={isSec}
          class:is-both={isPri && isSec}
          style="background-color: {getHex(col)};"
          title="#{idx}: {colorName} ({getHex(col)})"
          onmouseenter={() => (hoveredColorIdx = idx)}
          onmouseleave={() => (hoveredColorIdx = null)}
          onclick={() => {
            if (isDirect) {
              primary = idx;
            } else {
              setSlotColor(primary, idx);
            }
          }}
          oncontextmenu={(e) => {
            e.preventDefault();
            if (isDirect) {
              secondary = 0;
            } else {
              setSlotColor(0, idx);
            }
          }}
        >
          {#if isPri && isSec}
            <span class="badge pri-sec">L/0</span>
          {:else if isPri}
            <span class="badge pri">L</span>
          {:else if isSec}
            <span class="badge sec">0</span>
          {/if}
        </button>
      {/each}
    </div>

    {#if count >= 32}
      <div class="color-readout">
        {#if hoveredColorIdx !== null && palette.colors[hoveredColorIdx]}
          {@const hc = palette.colors[hoveredColorIdx]}
          <div class="readout-content">
            <span class="readout-dot" style="background-color: {getHex(hc)};"></span>
            <span class="readout-idx">#{hoveredColorIdx}</span>
            <span class="readout-rgb">({hc.r}, {hc.g}, {hc.b})</span>
            <span class="readout-hex">{getHex(hc)}</span>
          </div>
        {:else}
          {@const activeIdx = isDirect ? primary : (graphicSlots[primary] ?? 0)}
          {@const ac = palette.colors[activeIdx % palette.colors.length] ?? palette.colors[0]}
          <div class="readout-content">
            <span class="readout-dot" style="background-color: {getHex(ac)};"></span>
            <span class="readout-idx">#{activeIdx}</span>
            <span class="readout-rgb">({ac.r}, {ac.g}, {ac.b})</span>
            <span class="readout-hex">{getHex(ac)}</span>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .palette-panel {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: #ccc;
    font-size: 12px;
  }
  .header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .title {
    font-weight: bold;
    font-size: 14px;
    color: #fff;
  }
  .palette-select {
    width: 100%;
    background: #181820;
    color: #eee;
    border: 1px solid #3d3d4e;
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 11px;
    cursor: pointer;
  }
  .palette-select:focus {
    outline: none;
    border-color: #5588cc;
  }
  .active-swatches {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .swatch-container {
    position: relative;
    width: 48px;
    height: 42px;
  }
  .swatch {
    position: absolute;
    width: 28px;
    height: 28px;
    border: 1px solid #111;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    border-radius: 2px;
  }
  .sec-swatch {
    right: 0;
    bottom: 0;
  }
  .pri-swatch {
    left: 0;
    top: 0;
    z-index: 2;
  }
  .swatch-labels {
    font-size: 11px;
    line-height: 1.4;
  }
  .divider {
    height: 1px;
    background: #333;
    margin: 4px 0;
  }
  .section-label {
    font-weight: 600;
    font-size: 11px;
    color: #bbb;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .help-text {
    font-size: 10px;
    color: #888;
    line-height: 1.3;
  }
  .slots-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    box-sizing: border-box;
  }
  .slots-container.dense {
    grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
  }
  .slot-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 3px 2px;
    background: #252530;
    border: 1px solid #383848;
    border-radius: 4px;
    color: #eee;
    cursor: pointer;
    position: relative;
    text-align: center;
    transition: background 0.15s, border-color 0.15s;
  }
  .slot-card:hover {
    background: #2d2d3a;
  }
  .slot-card.active-slot {
    border-color: #5882c4;
    background: #2d3b50;
  }
  .slot-card.fixed-bg {
    border-style: dashed;
    border-color: #4a4a58;
  }
  .slot-color-preview {
    width: 20px;
    height: 20px;
    border: 1px solid #111;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .slot-badge-label {
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .slot-badge {
    font-size: 9px;
    font-weight: bold;
    padding: 0 4px;
    border-radius: 2px;
    line-height: 12px;
  }
  .slot-badge.pri {
    background: #5882c4;
    color: #fff;
  }
  .slot-badge.sec {
    background: #444455;
    color: #bbb;
  }
  .slot-idx-num {
    font-size: 9px;
    color: #888;
    line-height: 12px;
  }
  .palette-grid {
    display: grid;
    gap: 5px;
  }
  .palette-grid.dense-32,
  .palette-grid.dense-64 {
    gap: 2px;
  }
  .palette-grid.dense-32 .color-btn,
  .palette-grid.dense-64 .color-btn {
    height: 15px;
    border: 1px solid rgba(0, 0, 0, 0.45);
    border-radius: 2px;
  }
  .palette-grid.dense-32 .color-btn.is-pri,
  .palette-grid.dense-64 .color-btn.is-pri {
    box-shadow: inset 0 0 0 1.5px #00d2ff;
    z-index: 2;
  }
  .palette-grid.dense-32 .color-btn.is-sec,
  .palette-grid.dense-64 .color-btn.is-sec {
    box-shadow: inset 0 0 0 1.5px #f87171;
    z-index: 2;
  }
  .palette-grid.dense-32 .color-btn.is-both,
  .palette-grid.dense-64 .color-btn.is-both {
    box-shadow: inset 0 0 0 1.5px #00d2ff, inset 0 0 0 3px #f87171;
    z-index: 2;
  }
  .palette-grid.dense-32 .badge,
  .palette-grid.dense-64 .badge {
    font-size: 8px;
    padding: 0 2px;
    line-height: 9px;
    border-radius: 2px;
  }
  .palette-grid.dense-small {
    gap: 1.5px;
  }
  .palette-grid.dense-small .color-btn {
    height: 11px;
    border: 1px solid rgba(0, 0, 0, 0.45);
    border-radius: 1px;
  }
  .palette-grid.dense-small .color-btn.is-pri {
    box-shadow: inset 0 0 0 1.5px #00d2ff;
    z-index: 2;
  }
  .palette-grid.dense-small .color-btn.is-sec {
    box-shadow: inset 0 0 0 1.5px #f87171;
    z-index: 2;
  }
  .palette-grid.dense-small .color-btn.is-both {
    box-shadow: inset 0 0 0 1.5px #00d2ff, inset 0 0 0 3px #f87171;
    z-index: 2;
  }
  .palette-grid.dense-small .badge {
    display: none;
  }
  .color-btn {
    height: 28px;
    border: 1px solid #222;
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;
    box-sizing: border-box;
    padding: 0;
  }
  .color-btn:hover {
    outline: 1px solid #ffffff;
    z-index: 3;
  }
  .badge {
    font-size: 10px;
    font-weight: 700;
    color: #ffffff;
    background: rgba(0, 0, 0, 0.65);
    padding: 1px 4px;
    border-radius: 3px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
    pointer-events: none;
    letter-spacing: 0.5px;
  }
  .badge.pri {
    border: 1px solid #4a90e2;
    color: #90c2ff;
  }
  .badge.sec {
    border: 1px solid #e0e0e0;
    color: #ffffff;
  }
  .badge.pri-sec {
    border: 1px solid #f5a623;
    color: #ffd070;
  }
  /* 256 Color Map */
  .color-map-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
  }
  .color-map-canvas {
    image-rendering: pixelated;
    border: 1px solid #383848;
    border-radius: 4px;
    cursor: crosshair;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }
  .color-readout {
    width: 100%;
    background: #181822;
    border: 1px solid #282836;
    border-radius: 4px;
    padding: 4px 6px;
    font-family: monospace;
    font-size: 10px;
  }
  .readout-content {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .readout-dot {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    border: 1px solid #111;
    flex-shrink: 0;
  }
  .readout-idx {
    font-weight: bold;
    color: #60a5fa;
  }
  .readout-rgb {
    color: #aaa;
    flex: 1;
  }
  .readout-hex {
    color: #fff;
    font-weight: 600;
  }
</style>
