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
    onShift,
    onRotate,
    onMirrorH,
    onMirrorV,
  } = $props<{
    tool: ToolType;
    brushShape: BrushShape;
    brushSize: number;
    fillMode: boolean;
    canInvert?: boolean;
    onClear?: () => void;
    onInvert?: () => void;
    onShift?: (dx: number, dy: number) => void;
    onRotate?: (clockwise: boolean) => void;
    onMirrorH?: () => void;
    onMirrorV?: () => void;
  }>();

  let activeToolDef = $derived(TOOLS.find((t) => t.id === tool));
</script>

<div class="tools-panel">
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
  <div class="section-label">Shift (WASD)</div>
  <div class="shift-grid">
    <div></div>
    <button class="shift-btn" onclick={() => onShift?.(0, -1)} title="Shift Up (W)">▲</button>
    <div></div>
    <button class="shift-btn" onclick={() => onShift?.(-1, 0)} title="Shift Left (A)">◀</button>
    <button class="shift-btn" onclick={() => onShift?.(0, 1)} title="Shift Down (S)">▼</button>
    <button class="shift-btn" onclick={() => onShift?.(1, 0)} title="Shift Right (D)">▶</button>
  </div>

  <div class="divider"></div>
  <div class="section-label">Transform</div>
  <div class="transform-buttons">
    <div class="button-row">
      <button
        class="transform-btn"
        onclick={() => onRotate?.(false)}
        title="Rotate 90° Counter-Clockwise (Shortcut: < or ,)"
        aria-label="Rotate 90° Counter-Clockwise"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
      <button
        class="transform-btn"
        onclick={() => onRotate?.(true)}
        title="Rotate 90° Clockwise (Shortcut: > or .)"
        aria-label="Rotate 90° Clockwise"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
        </svg>
      </button>
    </div>
    <div class="button-row">
      <button
        class="transform-btn"
        onclick={() => onMirrorH?.()}
        title="Flip / Mirror Horizontal (Shortcut: H)"
        aria-label="Flip / Mirror Horizontal"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="2 2" stroke-width="1.8"/>
          <path d="M8 7L3 12l5 5V7z" fill="currentColor"/>
          <path d="M16 7l5 5-5 5V7z"/>
        </svg>
      </button>
      <button
        class="transform-btn"
        onclick={() => onMirrorV?.()}
        title="Flip / Mirror Vertical (Shortcut: V)"
        aria-label="Flip / Mirror Vertical"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="2" y1="12" x2="22" y2="12" stroke-dasharray="2 2" stroke-width="1.8"/>
          <path d="M7 8L12 3l5 5H7z" fill="currentColor"/>
          <path d="M7 16l5 5 5-5H7z"/>
        </svg>
      </button>
    </div>
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
  .shift-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3px;
  }
  .shift-btn {
    height: 28px;
    background: #282832;
    border: 1px solid #3d3d4a;
    color: #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .shift-btn:hover {
    background: #38384a;
    color: #fff;
    border-color: #5588cc;
  }
  .transform-buttons {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .button-row {
    display: flex;
    gap: 4px;
  }
  .transform-btn {
    flex: 1;
    height: 36px;
    background: #282832;
    border: 1px solid #3d3d4a;
    color: #ddd;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.05s;
  }
  .transform-btn:hover {
    background: #38384a;
    color: #fff;
    border-color: #5588cc;
  }
  .transform-btn:active {
    background: #2b2b38;
    transform: translateY(1px);
  }
</style>
