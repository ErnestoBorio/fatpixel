<script lang="ts">
  import { APP_VERSION } from '../version';

  let {
    canUndo = false,
    canRedo = false,
    canPaste = false,
    showGrid = true,
    onNewProject,
    onOpenProject,
    onSaveProject,
    onSaveProjectAs,
    onExportPng,
    onExportCsv,
    onUndo,
    onRedo,
    onCopy,
    onPaste,
    onClear,
    onInvert,
    canInvert = true,
    onNewSprite,
    onNewCharset,
    onZoomIn,
    onZoomOut,
    onFit,
    onToggleGrid,
    onShift,
    onRotate,
    onMirrorH,
    onMirrorV,
  } = $props<{
    canUndo?: boolean;
    canRedo?: boolean;
    canPaste?: boolean;
    canInvert?: boolean;
    showGrid?: boolean;
    onNewProject?: () => void;
    onOpenProject?: () => void;
    onSaveProject?: () => void;
    onSaveProjectAs?: () => void;
    onExportPng?: () => void;
    onExportCsv?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onCopy?: () => void;
    onPaste?: () => void;
    onClear?: () => void;
    onInvert?: () => void;
    onNewSprite?: () => void;
    onNewCharset?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onFit?: () => void;
    onToggleGrid?: () => void;
    onShift?: (dx: number, dy: number) => void;
    onRotate?: (clockwise: boolean) => void;
    onMirrorH?: () => void;
    onMirrorV?: () => void;
  }>();

  let activeMenu = $state<string | null>(null);

  function handleMenuClick(menu: string) {
    activeMenu = activeMenu === menu ? null : menu;
  }

  function handleMenuMouseEnter(menu: string) {
    if (activeMenu !== null) {
      activeMenu = menu;
    }
  }

  function closeMenu() {
    activeMenu = null;
  }
</script>

<svelte:window
  onclick={(e) => {
    if (!(e.target as HTMLElement).closest('.menu-bar')) {
      closeMenu();
    }
  }}
  onkeydown={(e) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  }}
/>

<div class="menu-bar" role="menubar" tabindex="0">
  <div class="menu-left">
    <div class="menu-item" role="none" onmouseenter={() => handleMenuMouseEnter('file')}>
    <button class="menu-btn {activeMenu === 'file' ? 'active' : ''}" onclick={() => handleMenuClick('file')}>
      File
    </button>
    {#if activeMenu === 'file'}
      <div class="dropdown">
        <button class="dropdown-item" onclick={() => { onNewProject?.(); closeMenu(); }}>
          <span>New Project</span> <span class="shortcut">⌘N</span>
        </button>
        <button class="dropdown-item" onclick={() => { onOpenProject?.(); closeMenu(); }}>
          <span>Open…</span> <span class="shortcut">⌘O</span>
        </button>
        <button class="dropdown-item" onclick={() => { onSaveProject?.(); closeMenu(); }}>
          <span>Save</span> <span class="shortcut">⌘S</span>
        </button>
        <button class="dropdown-item" onclick={() => { onSaveProjectAs?.(); closeMenu(); }}>
          <span>Save As…</span> <span class="shortcut">⇧⌘S</span>
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" onclick={() => { onExportPng?.(); closeMenu(); }}>
          <span>Export PNG…</span>
        </button>
        <button class="dropdown-item" onclick={() => { onExportCsv?.(); closeMenu(); }}>
          <span>Export CSV…</span>
        </button>
      </div>
    {/if}
  </div>

  <div class="menu-item" role="none" onmouseenter={() => handleMenuMouseEnter('edit')}>
    <button class="menu-btn {activeMenu === 'edit' ? 'active' : ''}" onclick={() => handleMenuClick('edit')}>
      Edit
    </button>
    {#if activeMenu === 'edit'}
      <div class="dropdown">
        <button
          class="dropdown-item"
          disabled={!canUndo}
          onclick={() => { onUndo?.(); closeMenu(); }}
        >
          <span>Undo</span> <span class="shortcut">⌘Z</span>
        </button>
        <button
          class="dropdown-item"
          disabled={!canRedo}
          onclick={() => { onRedo?.(); closeMenu(); }}
        >
          <span>Redo</span> <span class="shortcut">⇧⌘Z</span>
        </button>
        <div class="dropdown-divider"></div>
        <button
          class="dropdown-item"
          onclick={() => { onCopy?.(); closeMenu(); }}
        >
          <span>Copy</span> <span class="shortcut">⌘C</span>
        </button>
        <button
          class="dropdown-item"
          disabled={!canPaste}
          onclick={() => { onPaste?.(); closeMenu(); }}
        >
          <span>Paste</span> <span class="shortcut">⌘V</span>
        </button>
        <div class="dropdown-divider"></div>
        <button
          class="dropdown-item"
          onclick={() => { onClear?.(); closeMenu(); }}
        >
          <span>Clear Graphic</span> <span class="shortcut">⌘K</span>
        </button>
        <button
          class="dropdown-item"
          disabled={!canInvert}
          onclick={() => { onInvert?.(); closeMenu(); }}
        >
          <span>Invert Graphic</span> <span class="shortcut">⌘I</span>
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" onclick={() => { onShift?.(-1, 0); closeMenu(); }}>
          <span>Shift Left</span> <span class="shortcut">A</span>
        </button>
        <button class="dropdown-item" onclick={() => { onShift?.(1, 0); closeMenu(); }}>
          <span>Shift Right</span> <span class="shortcut">D</span>
        </button>
        <button class="dropdown-item" onclick={() => { onShift?.(0, -1); closeMenu(); }}>
          <span>Shift Up</span> <span class="shortcut">W</span>
        </button>
        <button class="dropdown-item" onclick={() => { onShift?.(0, 1); closeMenu(); }}>
          <span>Shift Down</span> <span class="shortcut">S</span>
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" onclick={() => { onRotate?.(true); closeMenu(); }}>
          <span>Rotate 90° CW</span> <span class="shortcut">></span>
        </button>
        <button class="dropdown-item" onclick={() => { onRotate?.(false); closeMenu(); }}>
          <span>Rotate 90° CCW</span> <span class="shortcut">&lt;</span>
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" onclick={() => { onMirrorH?.(); closeMenu(); }}>
          <span>Flip Horizontal</span> <span class="shortcut">H</span>
        </button>
        <button class="dropdown-item" onclick={() => { onMirrorV?.(); closeMenu(); }}>
          <span>Flip Vertical</span> <span class="shortcut">V</span>
        </button>
      </div>
    {/if}
  </div>

  <div class="menu-item" role="none" onmouseenter={() => handleMenuMouseEnter('graphic')}>
    <button class="menu-btn {activeMenu === 'graphic' ? 'active' : ''}" onclick={() => handleMenuClick('graphic')}>
      Graphic
    </button>
    {#if activeMenu === 'graphic'}
      <div class="dropdown">
        <button class="dropdown-item" onclick={() => { onNewSprite?.(); closeMenu(); }}>
          <span>New Sprite</span>
        </button>
        <button class="dropdown-item" onclick={() => { onNewCharset?.(); closeMenu(); }}>
          <span>New Charset</span>
        </button>
      </div>
    {/if}
  </div>

  <div class="menu-item" role="none" onmouseenter={() => handleMenuMouseEnter('view')}>
    <button class="menu-btn {activeMenu === 'view' ? 'active' : ''}" onclick={() => handleMenuClick('view')}>
      View
    </button>
    {#if activeMenu === 'view'}
      <div class="dropdown">
        <button class="dropdown-item" onclick={() => { onZoomIn?.(); closeMenu(); }}>
          <span>Zoom In</span> <span class="shortcut">+</span>
        </button>
        <button class="dropdown-item" onclick={() => { onZoomOut?.(); closeMenu(); }}>
          <span>Zoom Out</span> <span class="shortcut">-</span>
        </button>
        <button class="dropdown-item" onclick={() => { onFit?.(); closeMenu(); }}>
          <span>Fit to Window</span> <span class="shortcut">0</span>
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" onclick={() => { onToggleGrid?.(); closeMenu(); }}>
          <span>{showGrid ? '✓ ' : ''}Pixel Grid</span> <span class="shortcut">G</span>
        </button>
      </div>
    {/if}
  </div>
  </div>

  <div class="menu-right">
    <span class="app-title">Pixel</span>
    <span class="version-badge" title="Pixel v{APP_VERSION}">v{APP_VERSION}</span>
  </div>
</div>

<style>
  .menu-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #18181e;
    border-bottom: 1px solid #282832;
    padding: 2px 8px;
    height: 30px;
    font-size: 12px;
    position: relative;
    z-index: 100;
  }
  .menu-left {
    display: flex;
    align-items: center;
  }
  .menu-right {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-right: 4px;
    user-select: none;
  }
  .app-title {
    font-weight: 600;
    font-size: 11px;
    color: #e0e0e8;
    letter-spacing: 0.5px;
  }
  .version-badge {
    background: #252532;
    border: 1px solid #3d3d4e;
    color: #88aacc;
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;
    font-family: monospace;
    font-weight: 500;
  }
  .menu-item {
    position: relative;
  }
  .menu-btn {
    background: none;
    border: none;
    color: #ccc;
    padding: 4px 8px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
  }
  .menu-btn:hover,
  .menu-btn.active {
    background: #2a2a34;
    color: #fff;
  }
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    background: #22222a;
    border: 1px solid #383844;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    min-width: 170px;
    padding: 4px 0;
    z-index: 200;
  }
  .dropdown-item {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 12px;
    background: none;
    border: none;
    color: #ddd;
    font-size: 11px;
    cursor: pointer;
    text-align: left;
  }
  .dropdown-item:hover:not(:disabled) {
    background: #354562;
    color: #fff;
  }
  .dropdown-item:disabled {
    color: #555;
    cursor: default;
  }
  .shortcut {
    color: #888;
    font-size: 10px;
  }
  .dropdown-divider {
    height: 1px;
    background: #33333d;
    margin: 4px 0;
  }
</style>
