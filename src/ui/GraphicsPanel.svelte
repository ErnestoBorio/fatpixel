<script lang="ts">
  import type { Project } from '../model/project';
  import type { Palette } from '../model/palette';
  import type { Graphic } from '../model/graphic';
  import { slotColor } from '../model/render';

  let {
    project,
    active = $bindable(0),
    projectRevision = 0,
    onBeforeChange,
    onGraphicChange,
    onAddSprite,
    onAddCharset,
    onDuplicateGraphic,
    onDeleteGraphic,
    onReorderGraphics,
  } = $props<{
    project: Project;
    active: number;
    projectRevision?: number;
    onBeforeChange?: () => void;
    onGraphicChange?: () => void;
    onAddSprite?: () => void;
    onAddCharset?: () => void;
    onDuplicateGraphic?: (idx: number) => void;
    onDeleteGraphic?: (idx: number) => void;
    onReorderGraphics?: (fromIdx: number, toIdx: number) => void;
  }>();

  let activeGraphic = $derived.by(() => {
    projectRevision;
    return project.graphics[active];
  });

  let activeBpp = $derived.by(() => {
    projectRevision;
    return activeGraphic?.bpp;
  });
  let activeAspect = $derived.by(() => {
    projectRevision;
    return activeGraphic?.pixelAspectRatio;
  });
  let activeWidth = $derived.by(() => {
    projectRevision;
    return activeGraphic?.width;
  });
  let activeHeight = $derived.by(() => {
    projectRevision;
    return activeGraphic?.height;
  });
  let activeName = $derived.by(() => {
    projectRevision;
    return activeGraphic?.name;
  });
  let activePalette = $derived.by(() => {
    projectRevision;
    return activeGraphic ? project.paletteOf(activeGraphic) : undefined;
  });

  let draggedIdx = $state<number | null>(null);
  let dragOverIdx = $state<number | null>(null);

  function handleDragStart(e: DragEvent, idx: number) {
    draggedIdx = idx;
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', String(idx));
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(e: DragEvent, idx: number) {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== idx) {
      dragOverIdx = idx;
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
    }
  }

  function handleDragLeave(idx: number) {
    if (dragOverIdx === idx) {
      dragOverIdx = null;
    }
  }

  function handleDrop(e: DragEvent, targetIdx: number) {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== targetIdx) {
      onReorderGraphics?.(draggedIdx, targetIdx);
    }
    draggedIdx = null;
    dragOverIdx = null;
  }

  function handleDragEnd() {
    draggedIdx = null;
    dragOverIdx = null;
  }

  function drawThumbnail(
    canvas: HTMLCanvasElement,
    params: { graphic: Graphic; pal: Palette; rev: number }
  ) {
    function render(p: { graphic: Graphic; pal: Palette; rev: number }) {
      const { graphic, pal } = p;
      const w = graphic.width;
      const h = graphic.height;
      const aspect = graphic.pixelMode === 'wide' ? 2 : 1;
      const targetW = Math.round(w * aspect);
      const targetH = h;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const bg = slotColor(graphic, pal, 0);
      ctx.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
      ctx.fillRect(0, 0, targetW, targetH);
      let displayChar = 0;
      if (graphic.isCharset()) {
        const info = graphic.charsetInfo();
        const totalChars = info?.charCount ?? 256;
        for (let c = 0; c < totalChars; c++) {
          let hasPx = false;
          for (let cy = 0; cy < h; cy++) {
            for (let cx = 0; cx < w; cx++) {
              const val = graphic.getCharPixel(c, cx, cy);
              if (val !== null && val !== 0 && graphic.transparentSlot !== val) {
                hasPx = true;
                break;
              }
            }
            if (hasPx) break;
          }
          if (hasPx) {
            displayChar = c;
            break;
          }
        }
      }

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const val = graphic.isCharset()
            ? graphic.getCharPixel(displayChar, x, y)
            : graphic.get(x, y);
          if (val === null || val === 0 || graphic.transparentSlot === val) continue;
          const col = slotColor(graphic, pal, val);
          ctx.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
          ctx.fillRect(x * aspect, y, aspect, 1);
        }
      }
    }
    render(params);
    return {
      update(newParams: { graphic: Graphic; pal: Palette; rev: number }) {
        render(newParams);
      },
    };
  }

  function graphicSubtext(g: Graphic, _rev: number): string {
    const bpp = g.bpp;
    const aspect = g.pixelAspectRatio;
    return `${g.width}×${g.height} · ${bpp}bpp (${aspect})`;
  }
</script>

<div class="graphics-panel">
  <!-- Active graphic properties (top of panel) -->
  {#if activeGraphic}
    <div class="properties-section">
      <div class="section-label">Graphic Properties</div>
      <div class="field-row">
        <span class="label">Name:</span>
        <input
          type="text"
          value={activeName}
          class="text-input"
          oninput={(e) => {
            const val = (e.target as HTMLInputElement).value;
            if (activeGraphic) {
              activeGraphic.name = val;
            }
          }}
          onchange={() => {
            onGraphicChange?.();
          }}
        />
      </div>

      <!-- Depth (BPP) -->
      <div class="field-row">
        <span class="label">BPP:</span>
        <div class="button-group bpp-buttons">
          {#each [1, 2, 3, 4, 8] as bppVal}
            {@const palCount = activePalette?.colors.length ?? 16}
            {@const reqColors = bppVal === 8 ? 256 : (1 << bppVal)}
            {@const isDisabled = reqColors > palCount || bppVal >= palCount}
            <button
              class="toggle-btn bpp-btn {activeBpp === bppVal ? 'active' : ''} {isDisabled ? 'disabled' : ''}"
              disabled={isDisabled}
              title={isDisabled
                ? `Disabled: Requires a palette with more than ${bppVal} colors`
                : `${bppVal} bpp (${bppVal === 8 ? '256 colors' : `${1 << bppVal} colors`})`}
              onclick={() => {
                if (isDisabled || activeGraphic.bpp === bppVal) return;
                onBeforeChange?.();
                activeGraphic.setBpp(bppVal as any);
                onGraphicChange?.();
              }}
            >
              {bppVal}
            </button>
          {/each}
        </div>
      </div>

      <!-- Pixel Aspect Ratio -->
      <div class="field-row">
        <span class="label">Aspect:</span>
        <div class="button-group aspect-buttons">
          {#each ['1:1', '2:1'] as ratioVal}
            <button
              class="toggle-btn ratio-btn {activeAspect === ratioVal ? 'active' : ''}"
              title="{ratioVal === '1:1' ? '1:1 Square pixels' : '2:1 Wide/Fat pixels'}"
              onclick={() => {
                if (activeGraphic.pixelAspectRatio === ratioVal) return;
                onBeforeChange?.();
                activeGraphic.setPixelAspectRatio(ratioVal as any);
                onGraphicChange?.();
              }}
            >
              {ratioVal}
            </button>
          {/each}
        </div>
      </div>

      {#if activeGraphic.isSprite()}

        <div class="field-row">
          <span class="label">Size:</span>
          <div class="dim-inputs">
            <span>W:</span>
            <input
              type="number"
              min="1"
              max="256"
              value={activeWidth}
              class="num-input"
              onchange={(e) => {
                const input = e.target as HTMLInputElement;
                const val = parseInt(input.value, 10);
                if (val > 0 && val !== activeGraphic.width) {
                  onBeforeChange?.();
                  activeGraphic.resize(val, activeGraphic.height);
                  onGraphicChange?.();
                }
              }}
            />
            <span>H:</span>
            <input
              type="number"
              min="1"
              max="256"
              value={activeHeight}
              class="num-input"
              onchange={(e) => {
                const input = e.target as HTMLInputElement;
                const val = parseInt(input.value, 10);
                if (val > 0 && val !== activeGraphic.height) {
                  onBeforeChange?.();
                  activeGraphic.resize(activeGraphic.width, val);
                  onGraphicChange?.();
                }
              }}
            />
          </div>
        </div>
      {:else if activeGraphic.isCharset()}
        {@const info = activeGraphic.charsetInfo()}
        {#if info}
          <div class="field-row">
            <span class="label">Type:</span>
            <div class="readonly-badge">Charset ({info.charCount} chars)</div>
          </div>
          <div class="field-row">
            <span class="label">Char:</span>
            <div class="dim-inputs">
              <span>W:</span>
              <input
                type="number"
                value={info.charWidth}
                class="num-input"
                disabled
                title="Character width: 8px"
              />
              <span>H:</span>
              <input
                type="number"
                value={info.charHeight}
                class="num-input"
                disabled
                title="Character height: 8px"
              />
            </div>
          </div>
          <div class="presets-row">
            <span class="charset-info-badge">{info.charCount} chars · {info.columns} cols · {activeGraphic.sheetWidth()}×{activeGraphic.sheetHeight()} sheet</span>
          </div>
        {/if}
      {/if}
    </div>
  {:else}
    <div class="properties-section empty-props">
      <div class="section-label">Graphic Properties</div>
      <div class="empty-hint">No graphic selected</div>
    </div>
  {/if}

  <div class="divider"></div>

  <!-- Graphics View (bottom of panel, taking all remaining space) -->
  <div class="graphics-view-section">
    <div class="header">
      <div class="header-title-row">
        <span class="title">Graphics</span>
        <span class="count-pill">{project.graphics.length}</span>
      </div>
      <div class="add-buttons">
        <button class="add-btn" onclick={() => onAddSprite?.()} title="Add new C64 Sprite (24×21, 1 bpp)">
          + Sprite
        </button>
        <button class="add-btn" onclick={() => onAddCharset?.()} title="Add new C64 Charset (8×8, 256 chars)">
          + Charset
        </button>
      </div>
    </div>

    <!-- Framed Layers List (Photoshop-style container) -->
    <div class="graphics-frame">
      <div class="graphics-list" role="list">
        {#each project.graphics as g, idx (g)}
          {@const isActive = active === idx}
          <div
            class="graphic-item {isActive ? 'active' : ''} {draggedIdx === idx ? 'dragging' : ''} {dragOverIdx === idx ? 'drag-over' : ''}"
            draggable="true"
            ondragstart={(e) => handleDragStart(e, idx)}
            ondragover={(e) => handleDragOver(e, idx)}
            ondragleave={() => handleDragLeave(idx)}
            ondrop={(e) => handleDrop(e, idx)}
            ondragend={handleDragEnd}
            role="listitem"
          >
            <button class="select-btn" onclick={() => (active = idx)} title={g.name}>
              <div class="thumb-container {isActive ? 'active-thumb' : ''}">
                <canvas
                  class="thumb-canvas"
                  use:drawThumbnail={{ graphic: g, pal: project.paletteOf(g), rev: projectRevision }}
                ></canvas>
              </div>
              <div class="graphic-meta">
                <span class="name">{g.name}</span>
                <span class="subtext">
                  {graphicSubtext(g, projectRevision)}
                </span>
              </div>
            </button>

            <div class="actions">
              <button
                class="icon-btn"
                title="Duplicate (Undoable)"
                onclick={() => onDuplicateGraphic?.(idx)}
              >
                ⧉
              </button>
              {#if project.graphics.length > 1}
                <button
                  class="icon-btn delete-btn"
                  title="Delete (Undoable)"
                  onclick={() => onDeleteGraphic?.(idx)}
                >
                  ×
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .graphics-panel {
    padding: 8px;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    gap: 8px;
    color: #e5e5ea;
    font-size: 12px;
    user-select: none;
  }
  .properties-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
    box-sizing: border-box;
  }
  .presets-row {
    display: flex;
    margin-left: 46px;
  }
  .divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    margin: 2px 0;
    flex-shrink: 0;
  }
  .graphics-view-section {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    gap: 6px;
    overflow: hidden;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }
  .header-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .title {
    font-weight: 600;
    font-size: 12px;
    color: #ffffff;
    letter-spacing: -0.1px;
  }
  .count-pill {
    background: rgba(255, 255, 255, 0.08);
    color: #a1a1a6;
    font-size: 9px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-family: ui-monospace, monospace;
  }
  .add-buttons {
    display: flex;
    gap: 4px;
  }
  .add-btn {
    padding: 3px 8px;
    background: rgba(10, 132, 255, 0.12);
    border: 1px solid rgba(10, 132, 255, 0.3);
    color: #5ac8fa;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.12s ease;
  }
  .add-btn:hover {
    background: rgba(10, 132, 255, 0.25);
    color: #ffffff;
    border-color: rgba(10, 132, 255, 0.5);
  }
  /* macOS Frame / Sidebar List */
  .graphics-frame {
    flex: 1;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    overflow: hidden;
  }
  .graphics-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.16) transparent;
    padding: 3px 0;
  }
  .graphic-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: transparent;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    padding: 5px 8px;
    margin: 1px 3px;
    border-radius: 6px;
    cursor: grab;
    transition: all 0.12s ease;
    user-select: none;
  }
  .graphic-item:last-child {
    border-bottom: none;
  }
  .graphic-item:hover:not(.active) {
    background: rgba(255, 255, 255, 0.06);
  }
  .graphic-item.active {
    background: #0a84ff;
    color: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  }
  .graphic-item.dragging {
    opacity: 0.35;
    cursor: grabbing;
  }
  .graphic-item.drag-over {
    border-top: 2px solid #00d2ff;
    background: rgba(10, 132, 255, 0.25);
  }
  .select-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    color: inherit;
    font-size: 11px;
    cursor: pointer;
    text-align: left;
    padding: 0;
    flex: 1;
    min-width: 0;
  }
  .thumb-container {
    width: 28px;
    height: 28px;
    min-width: 28px;
    background: #0d0d12;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
  .thumb-container.active-thumb {
    border-color: rgba(255, 255, 255, 0.4);
  }
  .thumb-canvas {
    max-width: 26px;
    max-height: 26px;
    image-rendering: pixelated;
  }
  .graphic-meta {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    flex: 1;
  }
  .name {
    font-weight: 500;
    color: #e5e5ea;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 11px;
  }
  .graphic-item.active .name {
    color: #ffffff;
    font-weight: 600;
  }
  .subtext {
    font-size: 9px;
    color: #8e8e93;
    font-family: ui-monospace, monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .graphic-item.active .subtext {
    color: rgba(255, 255, 255, 0.85);
  }
  .actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
    opacity: 0.8;
  }
  .graphic-item:hover .actions,
  .graphic-item.active .actions {
    opacity: 1;
  }
  .icon-btn {
    background: none;
    border: none;
    color: #a1a1a6;
    cursor: pointer;
    font-size: 12px;
    padding: 2px 4px;
    border-radius: 4px;
    transition: all 0.12s ease;
  }
  .graphic-item.active .icon-btn {
    color: rgba(255, 255, 255, 0.9);
  }
  .icon-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.15);
  }
  .delete-btn:hover {
    color: #ff453a;
    background: rgba(255, 69, 58, 0.2);
  }
  .section-label {
    font-weight: 600;
    font-size: 10px;
    color: #8e8e93;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .field-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .label {
    color: #8e8e93;
    font-size: 11px;
    width: 40px;
  }
  .text-input {
    flex: 1;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
    padding: 4px 7px;
    border-radius: 6px;
    font-size: 11px;
    outline: none;
    transition: all 0.12s ease;
  }
  .text-input:focus {
    border-color: #0a84ff;
    box-shadow: 0 0 0 2px rgba(10, 132, 255, 0.3);
  }
  /* macOS Segmented Control */
  .button-group {
    display: flex;
    background: rgba(0, 0, 0, 0.35);
    padding: 2px;
    border-radius: 7px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    gap: 2px;
    flex: 1;
  }
  .toggle-btn {
    flex: 1;
    padding: 3px 2px;
    background: transparent;
    border: none;
    color: #a1a1a6;
    border-radius: 5px;
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.12s ease;
  }
  .toggle-btn.active {
    background: rgba(255, 255, 255, 0.14);
    color: #ffffff;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35), inset 0 0.5px 0 rgba(255, 255, 255, 0.2);
  }
  .toggle-btn:hover:not(.active):not(:disabled) {
    background: rgba(255, 255, 255, 0.06);
    color: #f5f5f7;
  }
  .toggle-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }
  .dim-inputs {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #8e8e93;
  }
  .num-input {
    width: 50px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
    padding: 4px 6px;
    border-radius: 6px;
    font-size: 11px;
    outline: none;
    transition: all 0.12s ease;
  }
  .num-input:focus {
    border-color: #0a84ff;
    box-shadow: 0 0 0 2px rgba(10, 132, 255, 0.3);
  }
  .readonly-badge {
    flex: 1;
    padding: 4px 7px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #8e8e93;
    border-radius: 6px;
    font-size: 10px;
    line-height: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .num-input:disabled {
    opacity: 0.5;
    cursor: default;
    background: rgba(255, 255, 255, 0.02);
    border-color: rgba(255, 255, 255, 0.06);
    color: #6e6e73;
  }
  .charset-info-badge {
    font-size: 10px;
    color: #8e8e93;
    line-height: 18px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .empty-props {
    justify-content: flex-start;
  }
  .empty-hint {
    font-size: 11px;
    color: #6e6e73;
    font-style: italic;
    padding: 10px 0;
  }
</style>
