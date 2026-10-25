<script lang="ts">
  import { TOOLS, type ToolType } from '../tools';
  import type { BrushShape } from '../raster';

  let {
    tool = $bindable('pencil'),
    brushShape = $bindable('square'),
    brushSize = $bindable(1),
    fillMode = $bindable(false),
    canInvert = true,
    onClear,
    onInvert,
  } = $props<{
    tool: ToolType;
    brushShape: BrushShape;
    brushSize: number;
    fillMode: boolean;
    canInvert?: boolean;
    onClear?: () => void;
    onInvert?: () => void;
  }>();

  let activeToolDef = $derived(TOOLS.find((t) => t.id === tool));
</script>

<div class="tools-panel">
  <div class="title">Tools</div>

  <div class="tool-list">
    {#each TOOLS as t}
      <button
        class="tool-btn {tool === t.id ? 'active' : ''}"
        onclick={() => (tool = t.id)}
        title="{t.label} ({t.shortcut})"
      >
        <span class="tool-label">{t.label}</span>
        <span class="tool-shortcut">{t.shortcut}</span>
      </button>
    {/each}
  </div>

  <div class="divider"></div>
  <div class="section-label">Actions</div>
  <div class="action-buttons">
    <button
      class="action-btn"
      onclick={() => onClear?.()}
      title="Delete / Clear entire graphic (fill with background)"
    >
      🗑 Clear Graphic
    </button>
    <button
      class="action-btn"
      disabled={!canInvert}
      onclick={() => onInvert?.()}
      title={canInvert ? 'Invert all monochrome pixels (0 ↔ 1)' : 'Invert is only available for monochrome (1bpp) graphics'}
    >
      ◐ Invert Graphic
    </button>
  </div>

  {#if activeToolDef?.usesBrush}
    <div class="divider"></div>
    <div class="section-label">Brush Shape</div>
    <div class="button-group">
      <button
        class="toggle-btn {brushShape === 'square' ? 'active' : ''}"
        onclick={() => (brushShape = 'square')}
      >
        Square
      </button>
      <button
        class="toggle-btn {brushShape === 'round' ? 'active' : ''}"
        onclick={() => (brushShape = 'round')}
      >
        Round
      </button>
    </div>

    <div class="size-row">
      <span class="section-label">Size: {brushSize} px ([ / ])</span>
    </div>
    <input
      type="range"
      min="1"
      max="8"
      bind:value={brushSize}
      class="slider"
    />
  {/if}

  {#if activeToolDef?.usesFillOption}
    <div class="divider"></div>
    <div class="section-label">Fill Mode</div>
    <div class="button-group">
      <button
        class="toggle-btn {!fillMode ? 'active' : ''}"
        onclick={() => (fillMode = false)}
      >
        Outline
      </button>
      <button
        class="toggle-btn {fillMode ? 'active' : ''}"
        onclick={() => (fillMode = true)}
      >
        Filled
      </button>
    </div>
  {/if}
</div>

<style>
  .tools-panel {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: #ccc;
    font-size: 12px;
  }
  .title {
    font-weight: bold;
    font-size: 14px;
    color: #fff;
  }
  .tool-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .tool-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    background: #2a2a32;
    border: 1px solid #33333d;
    color: #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  .tool-btn:hover {
    background: #353540;
  }
  .tool-btn.active {
    background: #3a4b68;
    border-color: #5882c4;
    color: #fff;
    font-weight: 500;
  }
  .tool-shortcut {
    color: #888;
    font-size: 10px;
  }
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .action-btn {
    padding: 5px 8px;
    background: #282832;
    border: 1px solid #3d3d4a;
    color: #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .action-btn:hover:not(:disabled) {
    background: #353545;
    color: #fff;
  }
  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .divider {
    height: 1px;
    background: #333;
    margin: 4px 0;
  }
  .section-label {
    font-size: 11px;
    color: #aaa;
  }
  .button-group {
    display: flex;
    gap: 4px;
  }
  .toggle-btn {
    flex: 1;
    padding: 4px 6px;
    background: #2a2a32;
    border: 1px solid #383842;
    color: #bbb;
    border-radius: 3px;
    font-size: 11px;
    cursor: pointer;
  }
  .toggle-btn.active {
    background: #445577;
    border-color: #6688cc;
    color: #fff;
  }
  .size-row {
    margin-top: 4px;
  }
  .slider {
    width: 100%;
    cursor: pointer;
  }
</style>
