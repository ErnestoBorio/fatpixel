<script lang="ts">
  let {
    canUndo = false,
    canRedo = false,
    showGrid = true,
    onNewProject,
    onOpenProject,
    onSaveProject,
    onSaveProjectAs,
    onExportPng,
    onExportCsv,
    onUndo,
    onRedo,
    onNewSprite,
    onNewCharset,
    onZoomIn,
    onZoomOut,
    onFit,
    onToggleGrid,
  } = $props<{
    canUndo?: boolean;
    canRedo?: boolean;
    showGrid?: boolean;
    onNewProject?: () => void;
    onOpenProject?: () => void;
    onSaveProject?: () => void;
    onSaveProjectAs?: () => void;
    onExportPng?: () => void;
    onExportCsv?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onNewSprite?: () => void;
    onNewCharset?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onFit?: () => void;
    onToggleGrid?: () => void;
  }>();

  let activeMenu = $state<string | null>(null);

  function toggleMenu(menu: string) {
    activeMenu = activeMenu === menu ? null : menu;
  }

  function closeMenu() {
    activeMenu = null;
  }
</script>

<svelte:window onclick={(e) => {
  if (!(e.target as HTMLElement).closest('.menu-bar')) {
    closeMenu();
  }
}} />

<div class="menu-bar">
  <div class="menu-item">
    <button class="menu-btn {activeMenu === 'file' ? 'active' : ''}" onclick={() => toggleMenu('file')}>
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

  <div class="menu-item">
    <button class="menu-btn {activeMenu === 'edit' ? 'active' : ''}" onclick={() => toggleMenu('edit')}>
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
      </div>
    {/if}
  </div>

  <div class="menu-item">
    <button class="menu-btn {activeMenu === 'graphic' ? 'active' : ''}" onclick={() => toggleMenu('graphic')}>
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

  <div class="menu-item">
    <button class="menu-btn {activeMenu === 'view' ? 'active' : ''}" onclick={() => toggleMenu('view')}>
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

<style>
  .menu-bar {
    display: flex;
    align-items: center;
    background: #18181e;
    border-bottom: 1px solid #282832;
    padding: 2px 8px;
    height: 30px;
    font-size: 12px;
    position: relative;
    z-index: 100;
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
