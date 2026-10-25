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

  function getHex(rgb: { r: number; g: number; b: number }) {
    return rgbToHexStr(rgb);
  }

  $effect(() => {
    // In hi-res mode (depth 2), slot 0 is strictly for right-button, primary must be slot 1
    if (graphic.depth === 2 && primary === 0) {
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
    return slotColor(graphic, palette, primary);
  });
  let secRgb = $derived.by(() => {
    projectRevision;
    graphicSlots;
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
    onPaletteSelect?.(id);
  }

  const ALL_SLOTS = [
    { idx: 0, bin: '00', name: 'Background (R-click)' },
    { idx: 1, bin: '01', name: 'Color 1' },
    { idx: 2, bin: '10', name: 'Color 2' },
    { idx: 3, bin: '11', name: 'Color 3' },
  ];
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

  <!-- Color Slots (Fixed 4-slot single row, no layout shift) -->
  <div class="section-label">Color Slots</div>
  <div class="slots-container">
    {#each ALL_SLOTS as def}
      {@const isDisabled = def.idx >= graphicDepth}
      {@const sRgb = !isDisabled ? getSlotColor(def.idx, graphicSlots) : null}
      {@const isSelectedPri = primary === def.idx && !isDisabled}
      {@const isFixedBg = graphicDepth === 2 && def.idx === 0}
      <button
        class="slot-card {isSelectedPri ? 'active-slot' : ''} {isFixedBg ? 'fixed-bg' : ''} {isDisabled ? 'disabled-slot' : ''}"
        disabled={isDisabled}
        onclick={() => {
          if (isDisabled || isFixedBg) return;
          primary = def.idx;
        }}
        title={isDisabled
          ? `Slot ${def.bin}: Only available in Multicolor (2bpp) mode`
          : isFixedBg
          ? 'Slot 0 (00): Background (fixed to Right Click in Hi-Res mode)'
          : `Slot ${def.idx} (${def.bin}): Click to select for Left Click draw`}
      >
        <span class="slot-bin">{def.bin}</span>
        <div
          class="slot-color-preview"
          style={sRgb ? `background-color: ${getHex(sRgb)};` : 'background: #1a1a22; border-style: dashed;'}
        ></div>
        <div class="slot-badge-label">
          {#if isSelectedPri}
            <span class="slot-badge pri">L</span>
          {:else if isFixedBg}
            <span class="slot-badge sec">R</span>
          {:else if !isDisabled}
            <span class="slot-idx-num">{def.idx === 0 ? 'BG' : def.idx}</span>
          {:else}
            <span class="slot-idx-num dim">—</span>
          {/if}
        </div>
      </button>
    {/each}
  </div>

  <div class="divider"></div>

  <div class="section-label">{palette.name}</div>
  <div class="help-text">Left-click: assign to Slot {primary} · Right-click: assign to Slot 0 (00 BG)</div>

  <!-- 16-color palette grid -->
  <div class="palette-grid">
    {#each palette.colors as col, idx}
      {@const isPri = graphicSlots[primary] === idx}
      {@const isSec = graphicSlots[0] === idx}
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
    height: 56px;
    box-sizing: border-box;
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
  .slot-card:hover:not(:disabled) {
    background: #2d2d3a;
  }
  .slot-card.active-slot {
    border-color: #5882c4;
    background: #2d3b50;
  }
  .slot-card.disabled-slot {
    opacity: 0.28;
    cursor: not-allowed;
    border-style: dashed;
  }
  .slot-card.fixed-bg {
    border-style: dashed;
    border-color: #4a4a58;
  }
  .slot-bin {
    font-family: monospace;
    font-weight: bold;
    color: #aaa;
    font-size: 10px;
    line-height: 1;
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
  .slot-idx-num.dim {
    color: #555;
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
