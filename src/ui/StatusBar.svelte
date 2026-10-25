<script lang="ts">
  import type { Graphic } from '../model/graphic';

  let {
    graphic,
    hoverPt = null,
    zoom = 16,
    isDirty = false,
    savedLocally = true,
  } = $props<{
    graphic: Graphic;
    hoverPt?: { x: number; y: number } | null;
    zoom?: number;
    isDirty?: boolean;
    savedLocally?: boolean;
  }>();

  let modeStr = $derived.by(() => {
    if (graphic.depth === 2) return '1 bpp (Hi-Res)';
    if (graphic.depth === 4 && graphic.pixelMode === 'wide') return '2 bpp (Wide)';
    if (graphic.depth === 4) return '2 bpp';
    return `${graphic.depth} colors`;
  });

  let hoverText = $derived.by(() => {
    if (!hoverPt) return '—';
    const { x, y } = hoverPt;
    const v = graphic.get(x, y) ?? 0;
    const charset = graphic.charsetInfo();
    if (charset) {
      const cx = Math.floor(x / charset.charWidth);
      const cy = Math.floor(y / charset.charHeight);
      const cIdx = cy * charset.columns + cx;
      return `Char #${cIdx} (${cx}, ${cy}) · Pixel (${x}, ${y}) · slot ${v}`;
    }
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
</style>
