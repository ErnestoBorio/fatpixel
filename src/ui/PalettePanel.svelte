<script lang="ts">
  import type { Graphic } from '../model/graphic';
  import {
    C64_COLOR_NAMES,
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
  } = $props<{
    graphic: Graphic;
    palette: Palette;
    primary: number;
    secondary: number;
    onColorChange?: () => void;
  }>();

  function getHex(rgb: { r: number; g: number; b: number }) {
    return rgbToHexStr(rgb);
  }

  let priRgb = $derived(slotColor(graphic, palette, primary));
  let secRgb = $derived(slotColor(graphic, palette, secondary));

  function setPrimaryColor(paletteIndex: number) {
    if (graphic.slots[primary] !== paletteIndex) {
      graphic.slots[primary] = paletteIndex;
      onColorChange?.();
    }
  }

  function setSecondaryColor(paletteIndex: number) {
    if (graphic.slots[secondary] !== paletteIndex) {
      graphic.slots[secondary] = paletteIndex;
      onColorChange?.();
    }
  }
</script>

<div class="palette-panel">
  <div class="header">
    <span class="title">Palette</span>
    <span class="palette-name">{palette.name}</span>
  </div>

  <!-- Primary and Secondary Swatches -->
  <div class="active-swatches">
    <div class="swatch-container">
      <div
        class="swatch sec-swatch"
        style="background-color: {getHex(secRgb)};"
        title="Right click color: Background (Slot {secondary})"
      ></div>
      <div
        class="swatch pri-swatch"
        style="background-color: {getHex(priRgb)};"
        title="Left click color: Foreground (Slot {primary})"
      ></div>
    </div>
    <div class="swatch-labels">
      <div>L: Slot {primary}</div>
      <div>R: Slot {secondary} (bg)</div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- In 4-color mode, allow selecting active slot -->
  {#if graphic.depth > 2}
    <div class="section-label">Graphic Slots</div>
    <div class="slots-row">
      {#each Array.from({ length: graphic.depth }, (_, i) => i) as slotIdx}
        {@const sRgb = slotColor(graphic, palette, slotIdx)}
        <button
          class="slot-btn {primary === slotIdx ? 'selected' : ''}"
          style="background-color: {getHex(sRgb)};"
          onclick={() => (primary = slotIdx)}
        >
          {slotIdx}
        </button>
      {/each}
    </div>
    <div class="divider"></div>
  {/if}

  <div class="section-label">C64 Palette (16 Colors)</div>
  <div class="help-text">Left-click: draw (L) · Right-click: bg (R)</div>

  <!-- 16-color palette grid -->
  <div class="palette-grid">
    {#each palette.colors as col, idx}
      {@const isPri = graphic.slots[primary] === idx}
      {@const isSec = graphic.slots[secondary] === idx}
      <button
        class="color-btn"
        style="background-color: {getHex(col)};"
        title="#{idx}: {C64_COLOR_NAMES[idx] ?? 'Color'} ({getHex(col)})\nLeft-click: set draw (L)\nRight-click: set bg (R)"
        onclick={() => setPrimaryColor(idx)}
        oncontextmenu={(e) => {
          e.preventDefault();
          setSecondaryColor(idx);
        }}
      >
        {#if isPri && isSec}
          <span class="badge pri-sec">L/R</span>
        {:else if isPri}
          <span class="badge pri">L</span>
        {:else if isSec}
          <span class="badge sec">R</span>
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
  }
  .title {
    font-weight: bold;
    font-size: 14px;
    color: #fff;
  }
  .palette-name {
    font-size: 11px;
    color: #888;
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
  }
  .sec-swatch {
    right: 0;
    bottom: 0;
  }
  .pri-swatch {
    left: 0;
    top: 0;
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
    color: #777;
  }
  .slots-row {
    display: flex;
    gap: 4px;
  }
  .slot-btn {
    width: 24px;
    height: 24px;
    border: 1px solid #222;
    color: #fff;
    text-shadow: 0 0 2px #000;
    font-size: 10px;
    cursor: pointer;
  }
  .slot-btn.selected {
    border: 2px solid #fff;
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
    font-size: 9px;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 0 3px #000, 0 0 1px #000;
  }
</style>
