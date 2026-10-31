<script lang="ts">
  import { APP_VERSION } from '../version';
  import { SYSTEM_PRESETS } from '../model/presets';
  import { getShortcuts } from '../platform';
  import type { HelpTab } from './HelpModal.svelte';

  let shortcuts = $derived(getShortcuts());

  let {
    canUndo = false,
    canRedo = false,
    canPaste = false,
    showGrid = true,
    onOpenProject,
    onSaveProject,
    onSaveProjectAs,
    onImportPng,
    onImportCsv,
    onExportPng,
    onExportCsv,
    onUndo,
    onRedo,
    onCopy,
    onPaste,
    onDeselect,
    canDeselect = false,
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
    onOpenHelp,
  } = $props<{
    canUndo?: boolean;
    canRedo?: boolean;
    canPaste?: boolean;
    canDeselect?: boolean;
    canInvert?: boolean;
    showGrid?: boolean;
    showLeftPanel?: boolean;
    showRightPanel?: boolean;
    onToggleLeftPanel?: () => void;
    onToggleRightPanel?: () => void;
    onOpenHelp?: (tab?: HelpTab) => void;
    onOpenProject?: () => void;
    onSaveProject?: () => void;
    onSaveProjectAs?: () => void;
    onImportPng?: () => void;
    onImportCsv?: () => void;
    onExportPng?: () => void;
    onExportCsv?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onCopy?: () => void;
    onPaste?: () => void;
    onDeselect?: () => void;
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
    <div class="window-controls" aria-hidden="true">
      <span class="window-dot dot-close"></span>
      <span class="window-dot dot-minimize"></span>
      <span class="window-dot dot-zoom"></span>
    </div>

    <div class="menu-item" role="none" onmouseenter={() => handleMenuMouseEnter('file')}>
    <button class="menu-btn {activeMenu === 'file' ? 'active' : ''}" onclick={() => handleMenuClick('file')}>
      File
    </button>
    {#if activeMenu === 'file'}
      <div class="dropdown">
        <button class="dropdown-item" onclick={() => { onOpenProject?.(); closeMenu(); }}>
          <span>Open…</span> <span class="shortcut">{shortcuts.open}</span>
        </button>
        <button class="dropdown-item" onclick={() => { onSaveProject?.(); closeMenu(); }}>
          <span>Save</span> <span class="shortcut">{shortcuts.save}</span>
        </button>
        <button class="dropdown-item" onclick={() => { onSaveProjectAs?.(); closeMenu(); }}>
          <span>Save As…</span> <span class="shortcut">{shortcuts.saveAs}</span>
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" onclick={() => { onImportPng?.(); closeMenu(); }}>
          <span>Import PNG…</span>
        </button>
        <button class="dropdown-item" onclick={() => { onImportCsv?.(); closeMenu(); }}>
          <span>Import CSV…</span>
        </button>
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
          <span>Undo</span> <span class="shortcut">{shortcuts.undo}</span>
        </button>
        <button
          class="dropdown-item"
          disabled={!canRedo}
          onclick={() => { onRedo?.(); closeMenu(); }}
        >
          <span>Redo</span> <span class="shortcut">{shortcuts.redo}</span>
        </button>
        <div class="dropdown-divider"></div>
        <button
          class="dropdown-item"
          onclick={() => { onCopy?.(); closeMenu(); }}
        >
          <span>Copy</span> <span class="shortcut">{shortcuts.copy}</span>
        </button>
        <button
          class="dropdown-item"
          disabled={!canPaste}
          onclick={() => { onPaste?.(); closeMenu(); }}
        >
          <span>Paste</span> <span class="shortcut">{shortcuts.paste}</span>
        </button>
        <button
          class="dropdown-item"
          disabled={!canDeselect}
          onclick={() => { onDeselect?.(); closeMenu(); }}
        >
          <span>Deselect</span> <span class="shortcut">{shortcuts.deselect}</span>
        </button>
        <div class="dropdown-divider"></div>
        <button
          class="dropdown-item"
          onclick={() => { onClear?.(); closeMenu(); }}
        >
          <span>Clear Graphic</span> <span class="shortcut">{shortcuts.clear}</span>
        </button>
        <button
          class="dropdown-item"
          disabled={!canInvert}
          onclick={() => { onInvert?.(); closeMenu(); }}
        >
          <span>Invert Graphic</span> <span class="shortcut">{shortcuts.invert}</span>
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
          <span>{showLeftPanel ? '✓ ' : ''}Tools</span> <span class="shortcut">{shortcuts.toggleTools}</span>
        </button>
        <button class="dropdown-item" onclick={() => { onToggleRightPanel?.(); closeMenu(); }}>
          <span>{showRightPanel ? '✓ ' : ''}Properties</span> <span class="shortcut">{shortcuts.toggleProperties}</span>
        </button>
      </div>
    {/if}
  </div>

  <div class="menu-item" role="none" onmouseenter={() => handleMenuMouseEnter('help')}>
    <button class="menu-btn {activeMenu === 'help' ? 'active' : ''}" onclick={() => handleMenuClick('help')}>
      Help
    </button>
    {#if activeMenu === 'help'}
      <div class="dropdown">
        <button class="dropdown-item" onclick={() => { onOpenHelp?.('workflows'); closeMenu(); }}>
          <span>User Guide & Workflows…</span> <span class="shortcut">F1</span>
        </button>
        <button class="dropdown-item" onclick={() => { onOpenHelp?.('shortcuts'); closeMenu(); }}>
          <span>Keyboard Shortcuts…</span> <span class="shortcut">?</span>
        </button>
        <button class="dropdown-item" onclick={() => { onOpenHelp?.('palette-bpp'); closeMenu(); }}>
          <span>BPP & Palettes Guide…</span>
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" onclick={() => { onOpenHelp?.('about'); closeMenu(); }}>
          <span>About FatPixel…</span>
        </button>
      </div>
    {/if}
  </div>
  </div>

  <div class="menu-center">
    <div class="fatpixel-logo" title="FatPixel">
      <svg class="logo-icon" viewBox="0 0 36 17" width="34" height="16" fill="none" aria-hidden="true">
        <path d="M16,0h4v1h-4z M24,0h2v1h-2z M2,1h2v1h-2z M16,1h2v1h-2z M22,1h2v1h-2z M0,2h2v1h-2z M16,2h2v1h-2z M22,2h2v1h-2z M0,3h2v1h-2z M16,3h10v1h-10z M0,4h2v1h-2z M12,4h4v1h-4z M18,4h2v1h-2z M26,4h2v1h-2z M0,5h2v1h-2z M10,5h6v1h-6z M20,5h2v1h-2z M24,5h4v1h-4z M2,6h10v1h-10z M14,6h2v1h-2z M20,6h2v1h-2z M24,6h2v1h-2z M28,6h2v1h-2z M4,7h2v1h-2z M14,7h2v1h-2z M30,7h2v1h-2z M4,8h2v1h-2z M14,8h2v1h-2z M30,8h4v1h-4z M4,9h2v1h-2z M14,9h4v1h-4z M30,9h6v1h-6z M4,10h2v1h-2z M8,10h14v1h-14z M28,10h8v1h-8z M4,11h6v1h-6z M16,11h2v1h-2z M20,11h8v1h-8z M32,11h2v1h-2z M2,12h4v1h-4z M8,12h2v1h-2z M16,12h2v1h-2z M20,12h2v1h-2z M2,13h2v1h-2z M8,13h2v1h-2z M16,13h2v1h-2z M20,13h2v1h-2z M2,14h2v1h-2z M8,14h4v1h-4z M14,14h4v1h-4z M22,14h2v1h-2z M0,15h4v1h-4z M10,15h2v1h-2z M14,15h2v1h-2z M22,15h2v1h-2z M0,16h2v1h-2z M10,16h2v1h-2z M14,16h2v1h-2z M22,16h2v1h-2z" fill="#000000" />
        <path d="M16,4h2v1h-2z M20,4h6v1h-6z M16,5h2v1h-2z M12,6h2v1h-2z M16,6h2v1h-2z M26,6h2v1h-2z M6,7h8v1h-8z M16,7h14v1h-14z M6,8h8v1h-8z M16,8h14v1h-14z M6,9h8v1h-8z M18,9h12v1h-12z M6,10h2v1h-2z M22,10h6v1h-6z" fill="#8b4513" />
        <path d="M18,5h2v1h-2z M22,5h2v1h-2z M18,6h2v1h-2z M22,6h2v1h-2z" fill="#ffffff" />
      </svg>
      <span class="logo-text"><span class="logo-fat">Fat</span><span class="logo-pixel">Pixel</span></span>
    </div>
  </div>

  <div class="menu-right">
    <button
      type="button"
      class="header-toggle-btn {showLeftPanel ? 'active' : ''}"
      onclick={() => onToggleLeftPanel?.()}
      title="Toggle Tools ({shortcuts.toggleTools})"
      aria-label="Toggle Tools"
    >
      Tools
    </button>
    <button
      type="button"
      class="header-toggle-btn {showRightPanel ? 'active' : ''}"
      onclick={() => onToggleRightPanel?.()}
      title="Toggle Properties ({shortcuts.toggleProperties})"
      aria-label="Toggle Properties"
    >
      Properties
    </button>
    <button
      type="button"
      class="help-link-btn"
      onclick={() => onOpenHelp?.('workflows')}
      title="Help & User Guide (F1)"
      aria-label="Help & User Guide"
    >
      Help
    </button>
    <div class="header-divider"></div>
    <span class="version-badge" title="FatPixel v{APP_VERSION}">v{APP_VERSION}</span>
    <a
      href="https://github.com/ErnestoBorio/pixel"
      target="_blank"
      rel="noopener noreferrer"
      class="github-badge"
      title="GitHub - FatPixel repository"
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
    background: rgba(24, 24, 28, 0.88);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0 10px;
    height: 32px;
    font-size: 12px;
    position: relative;
    z-index: 100;
  }
  .menu-left {
    display: flex;
    align-items: center;
  }
  .window-controls {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-right: 14px;
    padding-left: 2px;
  }
  .window-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
    transition: filter 0.15s ease, transform 0.1s ease;
  }
  .dot-close {
    background: #ff5f56;
    border: 0.5px solid rgba(0, 0, 0, 0.25);
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.3);
  }
  .dot-minimize {
    background: #ffbd2e;
    border: 0.5px solid rgba(0, 0, 0, 0.25);
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.3);
  }
  .dot-zoom {
    background: #27c93f;
    border: 0.5px solid rgba(0, 0, 0, 0.25);
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.3);
  }
  .window-controls:hover .window-dot {
    filter: brightness(1.08);
  }
  .menu-right {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-right: 4px;
    user-select: none;
  }
  .menu-center {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    user-select: none;
    z-index: 10;
  }
  .fatpixel-logo {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 2px 8px;
    border-radius: 6px;
    line-height: 1;
    cursor: default;
    transition: all 0.15s ease;
  }
  .fatpixel-logo:hover {
    background: rgba(255, 255, 255, 0.05);
    filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.4));
  }
  .logo-icon {
    display: block;
    flex-shrink: 0;
    filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.45));
  }
  .logo-text {
    font-size: 13px;
    letter-spacing: 0.4px;
    line-height: 1;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif;
  }
  .logo-fat {
    font-weight: 800;
    color: #38bdf8;
    text-shadow: 0 0 8px rgba(56, 189, 248, 0.35);
  }
  .logo-pixel {
    font-weight: 600;
    color: #f5f5f7;
  }
  .version-badge {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #8e8e93;
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 999px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-weight: 500;
  }
  .menu-item {
    position: relative;
  }
  .menu-btn {
    background: none;
    border: none;
    color: #d1d1d6;
    padding: 4px 9px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: -0.1px;
    transition: background 0.1s ease, color 0.1s ease;
  }
  .menu-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }
  .menu-btn.active {
    background: rgba(255, 255, 255, 0.14);
    color: #ffffff;
  }
  .dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    background: rgba(32, 32, 38, 0.94);
    backdrop-filter: blur(25px) saturate(190%);
    -webkit-backdrop-filter: blur(25px) saturate(190%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.35), inset 0 0.5px 0.5px rgba(255, 255, 255, 0.15);
    min-width: 190px;
    padding: 5px;
    z-index: 200;
  }
  .dropdown-item {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    background: none;
    border: none;
    color: #e5e5ea;
    font-size: 12px;
    font-weight: 400;
    cursor: pointer;
    text-align: left;
    border-radius: 5px;
    transition: background 0.08s ease, color 0.08s ease;
  }
  .dropdown-item:hover:not(:disabled) {
    background: #0a84ff;
    color: #ffffff;
  }
  .dropdown-item:hover:not(:disabled) .shortcut {
    color: rgba(255, 255, 255, 0.85);
  }
  .dropdown-item:disabled {
    color: rgba(255, 255, 255, 0.28);
    cursor: default;
  }
  .shortcut {
    color: #8e8e93;
    font-size: 11px;
    font-weight: 400;
    margin-left: 16px;
    letter-spacing: 0.2px;
  }
  .dropdown-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    margin: 5px 4px;
  }
  .dropdown-section-title {
    padding: 6px 10px 3px;
    font-size: 10px;
    font-weight: 600;
    color: #8e8e93;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    user-select: none;
  }
  .header-toggle-btn,
  .help-link-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #c7c7cc;
    padding: 3px 9px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  .header-toggle-btn:hover,
  .help-link-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.18);
  }
  .header-toggle-btn.active {
    color: #ffffff;
    border-color: rgba(10, 132, 255, 0.5);
    background: rgba(10, 132, 255, 0.3);
    box-shadow: 0 0 8px rgba(10, 132, 255, 0.25);
  }
  .header-divider {
    width: 1px;
    height: 14px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 2px;
  }
  .github-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #d1d1d6;
    text-decoration: none;
    font-size: 11px;
    font-weight: 500;
    padding: 3px 9px;
    border-radius: 999px;
    line-height: 1;
    transition: all 0.15s ease;
  }
  .github-badge:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
    color: #fff;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
  }
  .github-icon {
    width: 13px;
    height: 13px;
    fill: currentColor;
    flex-shrink: 0;
  }
  @media (max-width: 650px) {
    .menu-center,
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
