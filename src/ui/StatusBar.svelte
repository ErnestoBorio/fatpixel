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
    selection = null,
  } = $props<{
    graphic: Graphic;
    projectRevision?: number;
    hoverPt?: { x: number; y: number } | null;
    zoom?: number;
    isDirty?: boolean;
    savedLocally?: boolean;
    activeCharIndex?: number;
    selection?: { x: number; y: number; w: number; h: number } | null;
  }>();

  let modeStr = $derived.by(() => {
    projectRevision;
    if (graphic.isCharset()) return 'Hi-Res Charset';
    if (graphic.depth === 2) return '1 bpp (Hi-Res)';
    if (graphic.depth === 4 && graphic.pixelMode === 'wide') return '2 bpp (Wide)';
    if (graphic.depth === 4) return '2 bpp';
    return `${graphic.depth} colors`;
  });

  let hoverText = $derived.by(() => {
    if (!hoverPt) return '—';
    const { x, y } = hoverPt;
    if (graphic.isCharset()) {
      const v = graphic.getCharPixel(activeCharIndex, x, y) ?? 0;
      return `Char #${activeCharIndex} · Pixel (${x}, ${y}) · slot ${v}`;
    }
    const v = graphic.get(x, y) ?? 0;
    return `Pixel (${x}, ${y}) · slot ${v}`;
  });
</script>

<div class="status-bar">
  <div class="left-section">
    <span class="dim-text">{graphic.width} × {graphic.height} ({modeStr})</span>
    <span class="sep">|</span>
    <span class="zoom-text">zoom {zoom}×</span>
    <span class="sep">|</span>
    <span class="hover-text">{hoverText}</span>
    {#if selection}
      <span class="sep">|</span>
      <span class="selection-badge">Sel: {selection.w}×{selection.h}</span>
    {/if}
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
    <span class="version-tag" title="Pixel v{APP_VERSION}">v{APP_VERSION}</span>
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
  }
  .left-section,
  .right-section {
    display: flex;
    align-items: center;
    gap: 8px;
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
</style>
