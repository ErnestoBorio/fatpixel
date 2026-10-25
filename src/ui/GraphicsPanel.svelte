<script lang="ts">
  import type { Project } from '../model/project';

  let {
    project,
    active = $bindable(0),
    onGraphicChange,
    onAddSprite,
    onAddCharset,
    onDuplicateGraphic,
    onDeleteGraphic,
  } = $props<{
    project: Project;
    active: number;
    onGraphicChange?: () => void;
    onAddSprite?: () => void;
    onAddCharset?: () => void;
    onDuplicateGraphic?: (idx: number) => void;
    onDeleteGraphic?: (idx: number) => void;
  }>();

  let activeGraphic = $derived(project.graphics[active]);
</script>

<div class="graphics-panel">
  <div class="header">
    <span class="title">Graphics</span>
  </div>

  <!-- 2 buttons for sprite and charset -->
  <div class="add-buttons">
    <button class="add-btn" onclick={() => onAddSprite?.()} title="Add new C64 Sprite (24×21, 1 bpp)">
      + Sprite
    </button>
    <button class="add-btn" onclick={() => onAddCharset?.()} title="Add new C64 Charset (8×8, 256 chars)">
      + Charset
    </button>
  </div>

  <!-- Graphics List -->
  <div class="graphics-list">
    {#each project.graphics as g, idx}
      {@const isActive = active === idx}
      <div class="graphic-item {isActive ? 'active' : ''}">
        <button class="select-btn" onclick={() => (active = idx)}>
          <span class="badge {g.isSprite() ? 'sprite-badge' : 'charset-badge'}">
            {g.isSprite() ? 'S' : 'C'}
          </span>
          <span class="name">{g.name}</span>
        </button>
        {#if isActive}
          <div class="actions">
            <button
              class="icon-btn"
              title="Duplicate"
              onclick={() => onDuplicateGraphic?.(idx)}
            >
              ⧉
            </button>
            {#if project.graphics.length > 1}
              <button
                class="icon-btn"
                title="Delete"
                onclick={() => onDeleteGraphic?.(idx)}
              >
                ×
              </button>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="divider"></div>

  <!-- Active graphic properties -->
  {#if activeGraphic}
    <div class="section-label">Properties</div>
    <div class="field-row">
      <span class="label">Name:</span>
      <input
        type="text"
        bind:value={activeGraphic.name}
        class="text-input"
        onchange={onGraphicChange}
      />
    </div>

    {#if activeGraphic.isSprite()}
      <div class="field-row">
        <span class="label">Mode:</span>
        <div class="button-group">
          <button
            class="toggle-btn {activeGraphic.depth === 2 && activeGraphic.pixelMode === 'hires' ? 'active' : ''}"
            onclick={() => {
              activeGraphic.setDepthAndMode(2, 'hires');
              onGraphicChange?.();
            }}
          >
            Hi-Res (1bpp)
          </button>
          <button
            class="toggle-btn {activeGraphic.depth === 4 && activeGraphic.pixelMode === 'wide' ? 'active' : ''}"
            onclick={() => {
              activeGraphic.setDepthAndMode(4, 'wide');
              onGraphicChange?.();
            }}
          >
            Multi (2bpp)
          </button>
        </div>
      </div>

      <div class="field-row">
        <span class="label">Size:</span>
        <div class="dim-inputs">
          <span>W:</span>
          <input
            type="number"
            min="1"
            max="256"
            value={activeGraphic.width}
            class="num-input"
            onchange={(e) => {
              const input = e.target as HTMLInputElement;
              const val = parseInt(input.value, 10);
              if (val > 0) {
                if (activeGraphic.hasDrawnPixelsOutside(val, activeGraphic.height)) {
                  const ok = confirm(`Resizing width from ${activeGraphic.width} to ${val} will discard drawn pixels. Do you want to continue?`);
                  if (!ok) {
                    input.value = String(activeGraphic.width);
                    return;
                  }
                }
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
            value={activeGraphic.height}
            class="num-input"
            onchange={(e) => {
              const input = e.target as HTMLInputElement;
              const val = parseInt(input.value, 10);
              if (val > 0) {
                if (activeGraphic.hasDrawnPixelsOutside(activeGraphic.width, val)) {
                  const ok = confirm(`Resizing height from ${activeGraphic.height} to ${val} will discard drawn pixels. Do you want to continue?`);
                  if (!ok) {
                    input.value = String(activeGraphic.height);
                    return;
                  }
                }
                activeGraphic.resize(activeGraphic.width, val);
                onGraphicChange?.();
              }
            }}
          />
        </div>
      </div>

      <div class="presets-row">
        <button
          class="preset-btn"
          onclick={() => {
            if (activeGraphic.hasDrawnPixelsOutside(24, 21)) {
              if (!confirm('Applying 24×21 preset will discard pixels outside this size. Do you want to continue?')) return;
            }
            activeGraphic.resize(24, 21);
            activeGraphic.setDepthAndMode(2, 'hires');
            onGraphicChange?.();
          }}
          title="C64 Hi-Res 24×21"
        >
          24×21
        </button>
        <button
          class="preset-btn"
          onclick={() => {
            if (activeGraphic.hasDrawnPixelsOutside(12, 21)) {
              if (!confirm('Applying 12×21 Wide preset will discard pixels outside this size. Do you want to continue?')) return;
            }
            activeGraphic.resize(12, 21);
            activeGraphic.setDepthAndMode(4, 'wide');
            onGraphicChange?.();
          }}
          title="C64 Multicolor Wide 12×21"
        >
          12×21 Wide
        </button>
      </div>
    {:else if activeGraphic.isCharset()}
      {@const info = activeGraphic.charsetInfo()}
      {#if info}
        <div class="info-text">{info.charWidth}×{info.charHeight} px · {info.charCount} chars</div>
        <div class="info-text">Grid: {info.columns} cols · {activeGraphic.width}×{activeGraphic.height} px</div>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .graphics-panel {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: #ccc;
    font-size: 12px;
  }
  .header {
    display: flex;
    align-items: center;
  }
  .title {
    font-weight: bold;
    font-size: 14px;
    color: #fff;
  }
  .add-buttons {
    display: flex;
    gap: 4px;
  }
  .add-btn {
    flex: 1;
    padding: 5px;
    background: #2a2a34;
    border: 1px solid #3d3d4a;
    color: #eee;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
  }
  .add-btn:hover {
    background: #393946;
  }
  .graphics-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 140px;
    overflow-y: auto;
    border: 1px solid #282830;
    border-radius: 4px;
    background: #1b1b22;
    padding: 2px;
  }
  .graphic-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 6px;
    border-radius: 3px;
  }
  .graphic-item.active {
    background: #2f3b4e;
  }
  .select-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 11px;
    flex: 1;
    text-align: left;
  }
  .badge {
    font-size: 9px;
    font-weight: bold;
    padding: 1px 4px;
    border-radius: 2px;
  }
  .sprite-badge {
    background: #295577;
    color: #9cd5ff;
  }
  .charset-badge {
    background: #665022;
    color: #ffdf88;
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .actions {
    display: flex;
    gap: 2px;
  }
  .icon-btn {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 11px;
    padding: 0 4px;
  }
  .icon-btn:hover {
    color: #fff;
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
  }
  .field-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .label {
    color: #888;
    font-size: 11px;
    width: 40px;
  }
  .text-input {
    flex: 1;
    background: #22222a;
    border: 1px solid #383844;
    color: #fff;
    padding: 3px 6px;
    border-radius: 3px;
    font-size: 11px;
  }
  .button-group {
    display: flex;
    gap: 3px;
    flex: 1;
  }
  .toggle-btn {
    flex: 1;
    padding: 3px;
    background: #2a2a32;
    border: 1px solid #383842;
    color: #bbb;
    border-radius: 3px;
    font-size: 10px;
    cursor: pointer;
  }
  .toggle-btn.active {
    background: #445577;
    border-color: #6688cc;
    color: #fff;
  }
  .dim-inputs {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
  }
  .num-input {
    width: 50px;
    background: #22222a;
    border: 1px solid #383844;
    color: #fff;
    padding: 3px 4px;
    border-radius: 3px;
    font-size: 11px;
  }
  .presets-row {
    display: flex;
    gap: 4px;
    margin-left: 46px;
  }
  .preset-btn {
    padding: 2px 6px;
    background: #252530;
    border: 1px solid #383842;
    color: #bbb;
    border-radius: 3px;
    font-size: 10px;
    cursor: pointer;
  }
  .preset-btn:hover {
    background: #333342;
    color: #fff;
  }
  .info-text {
    font-size: 11px;
    color: #999;
  }
</style>
