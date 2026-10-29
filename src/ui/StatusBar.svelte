<script lang="ts">
  import type { Graphic } from '../model/graphic';
  import { APP_VERSION } from '../version';

  let {
    graphic,
    projectRevision = 0,
    hoverPt = null,
    zoom = 16,
    isDirty = false,
    savedLocally = true,
    activeCharIndex = 0,
  } = $props<{
    graphic: Graphic;
    projectRevision?: number;
    hoverPt?: { x: number; y: number } | null;
    zoom?: number;
    isDirty?: boolean;
    savedLocally?: boolean;
    activeCharIndex?: number;
  }>();

  let modeStr = $derived.by(() => {
    projectRevision;
    const bpp = graphic.bpp;
    const aspect = graphic.pixelAspectRatio;
    return `${bpp} bpp · ${aspect}`;
  });

  let hoverText = $derived.by(() => {
    if (!hoverPt) return '—';
    const { x, y } = hoverPt;
    const isDirect = graphic.bpp === 8;
    if (graphic.isCharset()) {
      const v = graphic.getCharPixel(activeCharIndex, x, y) ?? 0;
      return isDirect
        ? `Char #${activeCharIndex} · Pixel (${x}, ${y}) · color #${v}`
        : `Char #${activeCharIndex} · Pixel (${x}, ${y}) · slot ${v}`;
    }
    const v = graphic.get(x, y) ?? 0;
    return isDirect
      ? `Pixel (${x}, ${y}) · color #${v}`
      : `Pixel (${x}, ${y}) · slot ${v}`;
  });
</script>

<div class="status-bar">
  <div class="left-section">
    <span class="dim-text">{graphic.width} × {graphic.height} ({modeStr})</span>
    <span class="sep">|</span>
    <span class="zoom-text">zoom {zoom}×</span>
    <span class="sep">|</span>
    <span class="hover-text">{hoverText}</span>
  </div>

  <div class="right-section">
    {#if savedLocally}
      <span class="saved-badge" title="All edits are stored in your browser">✓ Saved in browser</span>
    {:else}
      <span class="saving-badge">Saving...</span>
    {/if}
    <span class="sep">|</span>
    {#if isDirty}
      <span class="dirty-badge" title="Changes not yet downloaded to a .pxp file">● Unexported</span>
      <span class="sep">|</span>
    {/if}
    <span class="hints">Hold Alt: eyedropper · Hold Shift: snap</span>
    <span class="sep">|</span>
    <span class="version-tag" title="Fat Pixel v{APP_VERSION}">v{APP_VERSION}</span>
  </div>
</div>

<style>
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #18181e;
    border-top: 1px solid #282832;
    padding: 0 10px;
    height: 24px;
    font-size: 11px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
  }
  .left-section,
  .right-section {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .hover-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sep {
    color: #333;
  }
  .saved-badge {
    color: #4ade80;
    font-weight: 500;
  }
  .saving-badge {
    color: #60a5fa;
  }
  .dirty-badge {
    color: #ffaa55;
    font-weight: 500;
  }
  .hints {
    color: #666;
  }
  .version-tag {
    color: #778899;
    font-family: monospace;
    font-size: 10px;
    padding: 1px 4px;
    background: #202028;
    border-radius: 3px;
    border: 1px solid #2d2d3a;
  }
  @media (max-width: 900px) {
    .hints {
      display: none;
    }
  }
  @media (max-width: 650px) {
    .version-tag {
      display: none;
    }
  }
</style>
