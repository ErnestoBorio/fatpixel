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
        <span class="tool-btn-left">
          {#if t.id === 'select'}
            <svg class="tool-svg" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2 2"><rect x="1.5" y="1.5" width="13" height="13" rx="1.5"/></svg>
          {:else if t.id === 'pencil'}
            <svg class="tool-svg" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 1.5l3 3L4.5 14.5H1.5v-3L11.5 1.5z"/></svg>
          {:else if t.id === 'line'}
            <svg class="tool-svg" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="2" y1="14" x2="14" y2="2"/></svg>
          {:else if t.id === 'rectangle'}
            <svg class="tool-svg" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="3" width="12" height="10" rx="1.5"/></svg>
          {:else if t.id === 'ellipse'}
            <svg class="tool-svg" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6"/></svg>
          {:else if t.id === 'fill'}
            <svg class="tool-svg" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.5 7L7 1.5 1.5 7l5.5 5.5L12.5 7z"/><path d="M5 10.5l-2.5 2.5a2 2 0 0 0 3 0L5 10.5z"/></svg>
          {:else if t.id === 'eyedropper'}
            <svg class="tool-svg" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 1.5a1.8 1.8 0 0 1 2.5 2.5L12 8l-3-3 4.5-3.5z"/><path d="M9 5L2 12v3h3l7-7"/></svg>
          {:else if t.id === 'pan'}
            <svg class="tool-svg" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1v14M1 8h14M3 3l10 10M13 3L3 13"/></svg>
          {/if}
          <span class="tool-label">{t.label}</span>
        </span>
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: #e5e5ea;
    font-size: 12px;
    user-select: none;
  }
  .tool-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .tool-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 9px;
    background: transparent;
    border: 1px solid transparent;
    color: #d1d1d6;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 400;
    transition: all 0.12s ease;
  }
  .tool-btn-left {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }
  .tool-svg {
    flex-shrink: 0;
    opacity: 0.85;
  }
  .tool-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tool-btn:hover {
    background: rgba(255, 255, 255, 0.07);
    color: #ffffff;
  }
  .tool-btn.active {
    background: #0a84ff;
    border-color: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
  .tool-btn.active .tool-svg {
    opacity: 1;
  }
  .tool-shortcut {
    color: #8e8e93;
    font-size: 10px;
    font-weight: 500;
  }
  .tool-btn.active .tool-shortcut {
    color: rgba(255, 255, 255, 0.85);
  }
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .action-btn {
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #d1d1d6;
    border-radius: 6px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.12s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  .action-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.18);
    color: #ffffff;
  }
  .action-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    margin: 4px 0;
  }
  .section-label {
    font-size: 10px;
    font-weight: 600;
    color: #8e8e93;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  /* macOS Segmented Control */
  .button-group {
    display: flex;
    background: rgba(0, 0, 0, 0.35);
    padding: 2px;
    border-radius: 7px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    gap: 2px;
  }
  .toggle-btn {
    flex: 1;
    padding: 4px 6px;
    background: transparent;
    border: none;
    color: #a1a1a6;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.12s ease;
  }
  .toggle-btn:hover {
    color: #f5f5f7;
  }
  .toggle-btn.active {
    background: rgba(255, 255, 255, 0.14);
    color: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35), inset 0 0.5px 0 rgba(255, 255, 255, 0.2);
  }
  .size-row {
    margin-top: 4px;
  }
  /* macOS Slider */
  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.14);
    outline: none;
    cursor: pointer;
    margin: 8px 0 4px;
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #f5f5f7;
    border: 0.5px solid rgba(0, 0, 0, 0.2);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
    cursor: pointer;
    transition: transform 0.1s ease;
  }
  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }
  .slider::-webkit-slider-thumb:active {
    transform: scale(0.95);
    background: #0a84ff;
  }
  .shift-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3px;
  }
  .shift-btn {
    height: 28px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #d1d1d6;
    border-radius: 6px;
    cursor: pointer;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  .shift-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.18);
  }
  .shift-btn:active {
    transform: translateY(1px);
    box-shadow: none;
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
    height: 32px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #d1d1d6;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  .transform-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.18);
  }
  .transform-btn:active {
    background: rgba(255, 255, 255, 0.03);
    transform: translateY(1px);
    box-shadow: none;
  }
</style>
