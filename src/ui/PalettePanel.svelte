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
    primary = $bindable(1),
    secondary = $bindable(0),
    onColorChange,
    onPaletteSelect,
  } = $props<{
    graphic: Graphic;
    palette: Palette;
    primary: number;
    secondary: number;
    onColorChange?: () => void;
    onPaletteSelect?: (paletteId: string) => void;
  }>();

  function getHex(rgb: { r: number; g: number; b: number }) {
    return rgbToHexStr(rgb);
  }

  $effect(() => {
    // In hi-res mode (depth 2), slot 0 is strictly for right-button, primary must be slot 1
    if (graphic.depth === 2 && primary === 0) {
      primary = 1;
    }
  });

  let priRgb = $derived(slotColor(graphic, palette, primary));
  let secRgb = $derived(slotColor(graphic, palette, 0));

  function setSlotColor(slotIdx: number, paletteIndex: number) {
    graphic.slots[slotIdx] = paletteIndex;
    graphic.slots = [...graphic.slots];
    onColorChange?.();
  }

  function handlePaletteSelect(e: Event) {
    const id = (e.target as HTMLSelectElement).value;
    onPaletteSelect?.(id);
  }

  const slotLabels4 = [
    { idx: 0, bin: '00', name: 'Background (R-click)' },
    { idx: 1, bin: '01', name: 'Multicolor 1' },
    { idx: 2, bin: '10', name: 'Main Color' },
    { idx: 3, bin: '11', name: 'Multicolor 2' },
  ];

  const slotLabels2 = [
    { idx: 0, bin: '00', name: 'Background (R-click only)' },
    { idx: 1, bin: '01', name: 'Foreground (L-click)' },
  ];

  let currentSlotDefs = $derived(graphic.depth === 4 ? slotLabels4 : slotLabels2);
</script>

<div class="palette-panel">
  <div class="header">
    <span class="title">Palette</span>
    <select
      class="palette-select"
      value={palette.id}
      onchange={handlePaletteSelect}
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
        title="Right click color: Background (Slot 0)"
      ></div>
      <div
        class="swatch pri-swatch"
        style="background-color: {getHex(priRgb)};"
        title="Left click color: Active slot (Slot {primary})"
      ></div>
    </div>
    <div class="swatch-labels">
      <div><strong>L:</strong> Slot {primary} (Draw)</div>
      <div><strong>R:</strong> Slot 0 (00 BG)</div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Color Slots (2 or 4) -->
  <div class="section-label">
    {graphic.depth === 4 ? 'Multicolor Slots (4 Colors)' : 'Color Slots (2 Colors)'}
  </div>
  <div class="slots-container">
    {#each currentSlotDefs as def}
      {@const sRgb = slotColor(graphic, palette, def.idx)}
      {@const isSelectedPri = primary === def.idx}
      {@const isFixedBg = graphic.depth === 2 && def.idx === 0}
      <button
        class="slot-card {isSelectedPri ? 'active-slot' : ''} {isFixedBg ? 'fixed-bg' : ''}"
        onclick={() => {
          if (isFixedBg) return;
          primary = def.idx;
        }}
        title={isFixedBg
          ? 'Slot 0 (00): Background (fixed to Right Click in Hi-Res mode)'
          : `Slot ${def.idx} (${def.bin}): ${def.name} - Click to select for Left Click draw`}
      >
        <span class="slot-bin">{def.bin}</span>
        <div class="slot-color-preview" style="background-color: {getHex(sRgb)};"></div>
        <span class="slot-name">{def.idx === 0 ? 'BG (R)' : `Slot ${def.idx}`}</span>
        {#if isSelectedPri}
          <span class="slot-badge">L</span>
        {:else if isFixedBg}
          <span class="slot-badge-fixed">R</span>
        {/if}
      </button>
    {/each}
  </div>

  <div class="divider"></div>

  <div class="section-label">{palette.name}</div>
  <div class="help-text">Left-click: assign to Slot {primary} · Right-click: assign to Slot 0 (00 BG)</div>

  <!-- 16-color palette grid -->
  <div class="palette-grid">
    {#each palette.colors as col, idx}
      {@const isPri = graphic.slots[primary] === idx}
      {@const isSec = graphic.slots[0] === idx}
      {@const colorName = getColorName(palette.id, idx)}
      <button
        class="color-btn"
        style="background-color: {getHex(col)};"
        title="#{idx}: {colorName} ({getHex(col)})\nLeft-click: assign to Slot {primary}\nRight-click: assign to Slot 0 (00)"
        onclick={() => setSlotColor(primary, idx)}
        oncontextmenu={(e) => {
          e.preventDefault();
          setSlotColor(0, idx);
        }}
      >
        {#if isPri && isSec}
          <span class="badge pri-sec">L/00</span>
        {:else if isPri}
          <span class="badge pri">L</span>
        {:else if isSec}
          <span class="badge sec">00</span>
        {/if}
      </button>
    {/each}
  </div>
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
  }
  .help-text {
    font-size: 10px;
    color: #888;
    line-height: 1.3;
  }
  .slots-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
  }
  .slot-card {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px;
    background: #252530;
    border: 1px solid #383848;
    border-radius: 4px;
    color: #eee;
    cursor: pointer;
    font-size: 10px;
    position: relative;
    text-align: left;
  }
  .slot-card:hover {
    background: #2d2d3a;
  }
  .slot-card.active-slot {
    border-color: #5882c4;
    background: #2d3b50;
  }
  .slot-bin {
    font-family: monospace;
    font-weight: bold;
    color: #aaa;
    font-size: 10px;
    min-width: 14px;
  }
  .slot-color-preview {
    width: 16px;
    height: 16px;
    border: 1px solid #111;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .slot-name {
    font-size: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .slot-badge {
    position: absolute;
    right: 3px;
    top: 3px;
    background: #5882c4;
    color: #fff;
    font-size: 9px;
    font-weight: bold;
    padding: 0 3px;
    border-radius: 2px;
  }
  .slot-card.fixed-bg {
    opacity: 0.85;
    cursor: default;
    border-style: dashed;
  }
  .slot-badge-fixed {
    position: absolute;
    right: 3px;
    top: 3px;
    background: #444455;
    color: #bbb;
    font-size: 9px;
    font-weight: bold;
    padding: 0 3px;
    border-radius: 2px;
  }
  .palette-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 5px;
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
</style>
