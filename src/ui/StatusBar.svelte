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
    <span class="version-tag" title="FatPixel v{APP_VERSION}">v{APP_VERSION}</span>
  </div>
</div>

<style>
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(22, 22, 26, 0.95);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0 12px;
    height: 25px;
    font-size: 11px;
    color: #8e8e93;
    white-space: nowrap;
    overflow: hidden;
    user-select: none;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  }
  .left-section,
  .right-section {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .dim-text {
    color: #e5e5ea;
    font-weight: 500;
  }
  .zoom-text {
    font-family: ui-monospace, monospace;
    color: #a1a1a6;
  }
  .hover-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #a1a1a6;
  }
  .sep {
    color: rgba(255, 255, 255, 0.12);
  }
  .saved-badge {
    color: #30d158;
    font-weight: 500;
  }
  .saving-badge {
    color: #0a84ff;
    font-weight: 500;
  }
  .dirty-badge {
    color: #ff9f0a;
    font-weight: 500;
  }
  .hints {
    color: #6e6e73;
  }
  .version-tag {
    color: #8e8e93;
    font-family: ui-monospace, monospace;
    font-size: 10px;
    padding: 1px 6px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
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
