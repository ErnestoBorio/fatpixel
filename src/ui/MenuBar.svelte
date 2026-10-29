<script lang="ts">
  import { APP_VERSION } from '../version';
  import { SYSTEM_PRESETS } from '../model/presets';

  let {
    canUndo = false,
    canRedo = false,
    canPaste = false,
    showGrid = true,
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
    onApplyPreset,
    onZoomIn,
    onZoomOut,
    onFit,
    onToggleGrid,
    onShift,
    onRotate,
    onMirrorH,
    onMirrorV,
    showLeftPanel = true,
    showRightPanel = true,
    onToggleLeftPanel,
    onToggleRightPanel,
  } = $props<{
    canUndo?: boolean;
    canRedo?: boolean;
    canPaste?: boolean;
    canInvert?: boolean;
    showGrid?: boolean;
    showLeftPanel?: boolean;
    showRightPanel?: boolean;
    onToggleLeftPanel?: () => void;
    onToggleRightPanel?: () => void;
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
    onApplyPreset?: (presetId: string) => void;
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
        <div class="dropdown-divider"></div>
        <div class="dropdown-section-title">Apply System Preset</div>
        {#each SYSTEM_PRESETS as preset}
          <button
            class="dropdown-item"
            onclick={() => { onApplyPreset?.(preset.id); closeMenu(); }}
          >
            <span>{preset.name}</span>
          </button>
        {/each}
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
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" onclick={() => { onToggleLeftPanel?.(); closeMenu(); }}>
          <span>{showLeftPanel ? '✓ ' : ''}Tools</span> <span class="shortcut">⌥1</span>
        </button>
        <button class="dropdown-item" onclick={() => { onToggleRightPanel?.(); closeMenu(); }}>
          <span>{showRightPanel ? '✓ ' : ''}Properties</span> <span class="shortcut">⌥2</span>
        </button>
      </div>
    {/if}
  </div>
  </div>

  <div class="menu-right">
    <button
      type="button"
      class="header-toggle-btn {showLeftPanel ? 'active' : ''}"
      onclick={() => onToggleLeftPanel?.()}
      title="Toggle Tools (⌥1)"
      aria-label="Toggle Tools"
    >
      Tools
    </button>
    <button
      type="button"
      class="header-toggle-btn {showRightPanel ? 'active' : ''}"
      onclick={() => onToggleRightPanel?.()}
      title="Toggle Properties (⌥2)"
      aria-label="Toggle Properties"
    >
      Properties
    </button>
    <div class="header-divider"></div>
    <span class="app-title">Pixel</span>
    <span class="version-badge" title="Pixel v{APP_VERSION}">v{APP_VERSION}</span>
    <a
      href="https://github.com/ErnestoBorio/pixel"
      target="_blank"
      rel="noopener noreferrer"
      class="github-badge"
      title="GitHub - ErnestoBorio/pixel"
      aria-label="GitHub repository"
    >
      <svg class="github-icon" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
      <span class="github-text">GitHub</span>
    </a>
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
  .dropdown-section-title {
    padding: 5px 12px 3px;
    font-size: 9px;
    font-weight: 700;
    color: #6a7c92;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    user-select: none;
  }
  .header-toggle-btn {
    background: transparent;
    border: 1px solid transparent;
    color: #888;
    padding: 2px 7px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .header-toggle-btn:hover {
    background: #2a2a34;
    color: #fff;
  }
  .header-toggle-btn.active {
    color: #60a5fa;
    border-color: #384860;
    background: #1e2838;
  }
  .header-divider {
    width: 1px;
    height: 14px;
    background: #333342;
    margin: 0 2px;
  }
  .github-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #20202a;
    border: 1px solid #363646;
    color: #c0c0d0;
    text-decoration: none;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: 12px;
    line-height: 1;
    transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
  }
  .github-badge:hover {
    background: #2a2a38;
    border-color: #60a5fa;
    color: #fff;
    box-shadow: 0 0 6px rgba(96, 165, 250, 0.25);
  }
  .github-icon {
    width: 13px;
    height: 13px;
    fill: currentColor;
    flex-shrink: 0;
  }
  @media (max-width: 650px) {
    .app-title,
    .version-badge {
      display: none;
    }
    .github-text {
      display: none;
    }
    .github-badge {
      padding: 3px 5px;
    }
  }
</style>
