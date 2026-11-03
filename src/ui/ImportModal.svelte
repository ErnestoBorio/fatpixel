<script lang="ts">
  import type { DecodedImage } from '../model/importPng';
  import { createGraphicFromRgba, createCharsetFromRgbaSheet } from '../model/importPng';
  import { BUILTIN_PALETTES } from '../model/palette';
  import type { Graphic, PixelAspectRatio } from '../model/graphic';

  interface Props {
    open: boolean;
    imageInfo: DecodedImage | null;
    onImport: (graphic: Graphic) => void;
    onClose: () => void;
  }

  let { open = $bindable(false), imageInfo, onImport, onClose }: Props = $props();

  let mode = $state<'sprite' | 'charset'>('sprite');
  let charWidth = $state<number>(8);
  let charHeight = $state<number>(8);
  let aspect = $state<PixelAspectRatio>('1:1');
  let paletteId = $state<string>('vga-256');

  // When imageInfo changes, pick smart defaults
  $effect(() => {
    if (imageInfo) {
      const w = imageInfo.width;
      const h = imageInfo.height;
      // If square or standard tile sheet dimensions, default to charset
      if (w >= 16 && h >= 16 && w % 8 === 0 && h % 8 === 0 && (w === h || w === 128 || w === 256)) {
        mode = 'charset';
        charWidth = 8;
        charHeight = 8;
      } else {
        mode = 'sprite';
      }
      aspect = (w === 160 && h === 200) ? '2:1' : '1:1';
      paletteId = 'vga-256';
    }
  });

  let columns = $derived(
    imageInfo ? Math.max(1, Math.floor(imageInfo.width / Math.max(1, charWidth))) : 1
  );
  let rows = $derived(
    imageInfo ? Math.max(1, Math.floor(imageInfo.height / Math.max(1, charHeight))) : 1
  );
  let totalChars = $derived(columns * rows);

  function handleConfirm() {
    if (!imageInfo) return;
    const palObj = BUILTIN_PALETTES.find((p) => p.id === paletteId);
    const colors = palObj ? palObj.colors : undefined;

    let graphic: Graphic;
    if (mode === 'charset') {
      graphic = createCharsetFromRgbaSheet(
        imageInfo.name,
        imageInfo.width,
        imageInfo.height,
        charWidth,
        charHeight,
        imageInfo.rgbaData,
        colors,
        paletteId,
        aspect
      );
    } else {
      graphic = createGraphicFromRgba(
        imageInfo.name,
        imageInfo.width,
        imageInfo.height,
        imageInfo.rgbaData,
        colors,
        paletteId,
        aspect
      );
    }

    onImport(graphic);
    onClose();
  }
</script>

{#if open && imageInfo}
  <div class="modal-backdrop" onclick={onClose} role="presentation">
    <div
      class="modal-card import-modal"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="import-title"
    >
      <div class="modal-header">
        <h3 id="import-title" class="modal-title">Import PNG Image</h3>
        <button type="button" class="modal-close-btn" onclick={onClose} aria-label="Close">✕</button>
      </div>

      <div class="modal-body">
        <div class="file-summary">
          <span class="file-icon">🖼</span>
          <div class="file-meta">
            <span class="file-name">{imageInfo.name}.png</span>
            <span class="file-dims">{imageInfo.width} × {imageInfo.height} px</span>
          </div>
        </div>

        <div class="option-group">
          <span class="group-label">Interpret Graphic As</span>
          <div class="segmented-control">
            <button
              type="button"
              class="segment-btn {mode === 'sprite' ? 'active' : ''}"
              onclick={() => (mode = 'sprite')}
            >
              🖼 Single Sprite
            </button>
            <button
              type="button"
              class="segment-btn {mode === 'charset' ? 'active' : ''}"
              onclick={() => (mode = 'charset')}
            >
              🔤 Character Set
            </button>
          </div>
        </div>

        {#if mode === 'charset'}
          <div class="option-group charset-options">
            <span class="group-label">Character / Tile Size</span>
            <div class="segmented-control tile-size-control">
              <button
                type="button"
                class="segment-btn {charWidth === 8 && charHeight === 8 ? 'active' : ''}"
                onclick={() => { charWidth = 8; charHeight = 8; }}
              >
                8 × 8 (Retro)
              </button>
              <button
                type="button"
                class="segment-btn {charWidth === 16 && charHeight === 16 ? 'active' : ''}"
                onclick={() => { charWidth = 16; charHeight = 16; }}
              >
                16 × 16
              </button>
            </div>

            <div class="slice-summary">
              <span class="slice-icon">✂️</span>
              <div class="slice-text">
                <strong>{totalChars} characters</strong>
                <span class="slice-detail">({columns} columns × {rows} rows of {charWidth}×{charHeight} px)</span>
              </div>
            </div>
          </div>
        {/if}

        <div class="option-row">
          <div class="option-half">
            <span class="group-label">Aspect Ratio</span>
            <div class="segmented-control compact">
              <button
                type="button"
                class="segment-btn {aspect === '1:1' ? 'active' : ''}"
                onclick={() => (aspect = '1:1')}
              >
                1:1 Square
              </button>
              <button
                type="button"
                class="segment-btn {aspect === '2:1' ? 'active' : ''}"
                onclick={() => (aspect = '2:1')}
              >
                2:1 Fat Pixel
              </button>
            </div>
          </div>

          <div class="option-half">
            <label for="import-pal-select" class="group-label">Palette</label>
            <select id="import-pal-select" class="modal-select" bind:value={paletteId}>
              {#each BUILTIN_PALETTES as pal}
                <option value={pal.id}>{pal.name}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="dialog-btn dialog-btn-secondary" onclick={onClose}>
          Cancel
        </button>
        <button type="button" class="dialog-btn dialog-btn-primary" onclick={handleConfirm}>
          Import
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal-card {
    background: rgba(36, 36, 44, 0.94);
    backdrop-filter: blur(30px) saturate(190%);
    -webkit-backdrop-filter: blur(30px) saturate(190%);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0, 0, 0, 0.3);
    width: 440px;
    max-width: 90vw;
    overflow: hidden;
    color: #f5f5f7;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 18px;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .modal-title {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: -0.1px;
  }
  .modal-close-btn {
    background: transparent;
    border: none;
    color: #8e8e93;
    font-size: 14px;
    cursor: pointer;
    padding: 3px 6px;
    border-radius: 4px;
    transition: all 0.12s ease;
  }
  .modal-close-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }
  .modal-body {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .file-summary {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 10px 14px;
  }
  .file-icon {
    font-size: 24px;
    line-height: 1;
  }
  .file-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .file-name {
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .file-dims {
    font-size: 11px;
    color: #8e8e93;
    font-family: ui-monospace, monospace;
  }
  .option-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .group-label {
    font-size: 11px;
    font-weight: 600;
    color: #8e8e93;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .segmented-control {
    display: flex;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 7px;
    padding: 2px;
    gap: 2px;
  }
  .segment-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: transparent;
    border: 1px solid transparent;
    color: #a1a1a6;
    font-size: 12px;
    font-weight: 500;
    padding: 6px 10px;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.12s ease;
  }
  .segment-btn:hover {
    color: #f5f5f7;
    background: rgba(255, 255, 255, 0.04);
  }
  .segment-btn.active {
    background: #0a84ff;
    color: #ffffff;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  }
  .slice-summary {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(10, 132, 255, 0.12);
    border: 1px solid rgba(10, 132, 255, 0.3);
    border-radius: 6px;
    padding: 8px 12px;
  }
  .slice-icon {
    font-size: 16px;
  }
  .slice-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: #f5f5f7;
  }
  .slice-detail {
    font-size: 11px;
    color: #a1a1a6;
  }
  .option-row {
    display: flex;
    gap: 12px;
  }
  .option-half {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .modal-select {
    width: 100%;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 6px;
    color: #ffffff;
    font-size: 12px;
    padding: 6px 10px;
    outline: none;
    cursor: pointer;
    transition: all 0.12s ease;
  }
  .modal-select:focus {
    border-color: #0a84ff;
    box-shadow: 0 0 0 2px rgba(10, 132, 255, 0.3);
  }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 18px;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .dialog-btn {
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s ease;
  }
  .dialog-btn-secondary {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
    color: #f5f5f7;
  }
  .dialog-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  .dialog-btn-primary {
    background: #0a84ff;
    border-color: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  .dialog-btn-primary:hover {
    background: #0071e3;
  }
</style>
