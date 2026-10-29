<script lang="ts">
  import { APP_VERSION } from '../version';
  import { getShortcuts } from '../platform';

  let shortcuts = $derived(getShortcuts());

  export type HelpTab = 'overview' | 'workflows' | 'shortcuts' | 'palette-bpp' | 'about';

  let {
    open = false,
    activeTab = $bindable<HelpTab>('overview'),
    onClose,
  } = $props<{
    open: boolean;
    activeTab?: HelpTab;
    onClose?: () => void;
  }>();

  let searchQuery = $state('');

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose?.();
    }
  }

  const SHORTCUT_GROUPS = $derived([
    {
      title: 'Tools & Drawing',
      items: [
        { key: 'M', desc: 'Select tool (drag to select a rectangular area)' },
        { key: 'B', desc: 'Pencil / Brush tool' },
        { key: 'L', desc: 'Line tool' },
        { key: 'R', desc: 'Rectangle tool' },
        { key: 'C', desc: 'Ellipse / Circle tool' },
        { key: 'F', desc: 'Fill / Bucket tool' },
        { key: 'P', desc: 'Pan tool' },
        { key: 'I', desc: 'Eyedropper tool' },
        { key: 'Space (Hold)', desc: 'Temporary Pan view (drag inside image)' },
        { key: 'Alt + Click', desc: 'Sample color from canvas with eyedropper' },
        { key: 'Shift (Hold)', desc: 'Constrain Line angle or visual 1:1 Square/Circle' },
        { key: '[ / ]', desc: 'Decrease / Increase brush size (1–8 px)' },
        { key: 'X', desc: 'Swap primary and secondary colors' },
      ],
    },
    {
      title: 'Navigation & View',
      items: [
        { key: '+ or =', desc: 'Zoom In' },
        { key: '-', desc: 'Zoom Out' },
        { key: '0', desc: 'Fit to window and center graphic' },
        { key: 'G', desc: 'Toggle pixel grid on/off' },
        { key: 'Drag inside image', desc: 'Pan viewport with Pan tool or holding Space' },
        { key: 'Middle Mouse Drag', desc: 'Pan viewport anywhere from inside image' },
        { key: 'Mouse Wheel', desc: 'Zoom In / Out centered around cursor' },
        { key: 'Arrow Keys (← → ↑ ↓)', desc: 'Navigate character in Charset mode' },
      ],
    },
    {
      title: 'Editing & History',
      items: [
        { key: shortcuts.undo, desc: 'Undo last stroke or change' },
        { key: shortcuts.redo, desc: 'Redo previously undone change' },
        { key: shortcuts.copy, desc: 'Copy selected rectangular area or entire graphic' },
        { key: shortcuts.paste, desc: 'Paste copied pixels into center as a movable floating layer' },
        { key: 'Enter', desc: 'Merge / commit pasted floating layer onto graphic' },
        { key: 'Del / ⌫', desc: 'Clear selected pixels to background / Discard floating paste' },
        { key: shortcuts.deselect, desc: 'Deselect active selection or commit paste layer' },
        { key: shortcuts.clear, desc: 'Clear graphic / character to background slot' },
        { key: shortcuts.invert, desc: 'Invert pixel data (1 bpp modes)' },
      ],
    },
    {
      title: 'Transformations & Shifts',
      items: [
        { key: 'W / S', desc: 'Shift graphic 1 px Up / Down' },
        { key: 'A / D', desc: 'Shift graphic 1 px Left / Right' },
        { key: '< or ,', desc: 'Rotate graphic 90° counter-clockwise' },
        { key: '> or .', desc: 'Rotate graphic 90° clockwise' },
        { key: 'H', desc: 'Flip / Mirror graphic horizontally' },
        { key: 'V', desc: 'Flip / Mirror graphic vertically' },
      ],
    },
    {
      title: 'File & Panels',
      items: [
        { key: shortcuts.open, desc: 'Open project file (.pxp)' },
        { key: shortcuts.save, desc: 'Save project file' },
        { key: shortcuts.saveAs, desc: 'Save project as new filename' },
        { key: shortcuts.toggleTools, desc: 'Toggle Tools panel visibility' },
        { key: shortcuts.toggleProperties, desc: 'Toggle Properties panel visibility' },
        { key: 'F1', desc: 'Open Help & User Guide' },
        { key: '?', desc: 'Open Keyboard Shortcuts' },
        { key: 'Esc', desc: 'Discard floating paste layer, or close open modal/dialog' },
      ],
    },
  ]);

  let filteredShortcutGroups = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SHORTCUT_GROUPS;
    return SHORTCUT_GROUPS.map((group) => {
      const items = group.items.filter(
        (it) => it.key.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q)
      );
      return { ...group, items };
    }).filter((group) => group.items.length > 0);
  });
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
  <div
    class="help-backdrop"
    onclick={onClose}
    role="presentation"
  >
    <div
      class="help-window"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="help-window-title"
    >
      <!-- Header -->
      <div class="help-header">
        <div class="header-left">
          <div class="help-badge-icon" aria-hidden="true">
            <svg viewBox="0 0 36 17" width="28" height="13" fill="none">
              <path d="M16,0h4v1h-4z M24,0h2v1h-2z M2,1h2v1h-2z M16,1h2v1h-2z M22,1h2v1h-2z M0,2h2v1h-2z M16,2h2v1h-2z M22,2h2v1h-2z M0,3h2v1h-2z M16,3h10v1h-10z M0,4h2v1h-2z M12,4h4v1h-4z M18,4h2v1h-2z M26,4h2v1h-2z M0,5h2v1h-2z M10,5h6v1h-6z M20,5h2v1h-2z M24,5h4v1h-4z M2,6h10v1h-10z M14,6h2v1h-2z M20,6h2v1h-2z M24,6h2v1h-2z M28,6h2v1h-2z M4,7h2v1h-2z M14,7h2v1h-2z M30,7h2v1h-2z M4,8h2v1h-2z M14,8h2v1h-2z M30,8h4v1h-4z M4,9h2v1h-2z M14,9h4v1h-4z M30,9h6v1h-6z M4,10h2v1h-2z M8,10h14v1h-14z M28,10h8v1h-8z M4,11h6v1h-6z M16,11h2v1h-2z M20,11h8v1h-8z M32,11h2v1h-2z M2,12h4v1h-4z M8,12h2v1h-2z M16,12h2v1h-2z M20,12h2v1h-2z M2,13h2v1h-2z M8,13h2v1h-2z M16,13h2v1h-2z M20,13h2v1h-2z M2,14h2v1h-2z M8,14h4v1h-4z M14,14h4v1h-4z M22,14h2v1h-2z M0,15h4v1h-4z M10,15h2v1h-2z M14,15h2v1h-2z M22,15h2v1h-2z M0,16h2v1h-2z M10,16h2v1h-2z M14,16h2v1h-2z M22,16h2v1h-2z" fill="#ffaa33" />
            </svg>
          </div>
          <div>
            <h2 id="help-window-title" class="help-title">FatPixel Help & User Guide</h2>
            <span class="help-subtitle">Web-based pixel art editor for retro systems · by Drean64</span>
          </div>
        </div>
        <div class="header-right">
          <button
            type="button"
            class="help-close-btn"
            onclick={onClose}
            title="Close Help (Esc)"
            aria-label="Close Help"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="help-tabs" aria-label="Help Sections">
        <button
          type="button"
          class="tab-btn {activeTab === 'overview' ? 'active' : ''}"
          onclick={() => activeTab = 'overview'}
        >
          <span class="tab-icon">📖</span>
          <span>Overview</span>
        </button>
        <button
          type="button"
          class="tab-btn {activeTab === 'workflows' ? 'active' : ''}"
          onclick={() => activeTab = 'workflows'}
        >
          <span class="tab-icon">🎨</span>
          <span>Workflows</span>
        </button>
        <button
          type="button"
          class="tab-btn {activeTab === 'shortcuts' ? 'active' : ''}"
          onclick={() => activeTab = 'shortcuts'}
        >
          <span class="tab-icon">⌨️</span>
          <span>Shortcuts</span>
        </button>
        <button
          type="button"
          class="tab-btn {activeTab === 'palette-bpp' ? 'active' : ''}"
          onclick={() => activeTab = 'palette-bpp'}
        >
          <span class="tab-icon">🎛️</span>
          <span>BPP & Palettes</span>
        </button>
        <button
          type="button"
          class="tab-btn {activeTab === 'about' ? 'active' : ''}"
          onclick={() => activeTab = 'about'}
        >
          <span class="tab-icon">ℹ️</span>
          <span>About</span>
        </button>
      </nav>

      <!-- Content Area -->
      <div class="help-content">
        <!-- TAB 1: OVERVIEW -->
        {#if activeTab === 'overview'}
          <div class="tab-pane">
            <section class="help-section">
              <h3 class="section-title">Welcome to FatPixel</h3>
              <p class="section-desc">
                <strong>FatPixel</strong> is a modern, high-performance web-based pixel art editor specifically designed
                for classic computing graphics. It provides authentic tooling for editing sprites, tile sets, and charsets with
                support for slotted/indexed palettes, direct RGB index modes, variable bit depths (1, 2, and 8 bpp), and non-square pixel aspect ratios (such as 2:1 multicolor "fat pixels").
              </p>
            </section>

            <section class="help-section">
              <h3 class="section-title">Workspace Layout</h3>
              <div class="grid-2col">
                <div class="info-card">
                  <div class="card-header">
                    <span class="card-icon">🛠️</span>
                    <span class="card-title">Left Panel: Tools & Brushes</span>
                  </div>
                  <p class="card-text">
                    Contains the core drawing tools: <strong>Pencil</strong>, <strong>Line</strong>, <strong>Rectangle</strong>, <strong>Ellipse</strong>, <strong>Flood Fill</strong>, <strong>Pan</strong>, and <strong>Eyedropper</strong>.
                    Configure brush shapes (Square, Circle, Cross, Dither), size (1–8 px), and outline/fill mode.
                    Collapse or expand anytime using <kbd>{shortcuts.toggleTools}</kbd>.
                  </p>
                </div>

                <div class="info-card">
                  <div class="card-header">
                    <span class="card-icon">🖼️</span>
                    <span class="card-title">Center: Drawing Canvas</span>
                  </div>
                  <p class="card-text">
                    The active drawing viewport with pixel-crisp rendering, optional pixel grid (<kbd>G</kbd>), zoom controls (up to 64×),
                    interactive mouse and keyboard shortcuts, and full support for 1:1 and 2:1 fat pixel aspect ratios.
                  </p>
                </div>

                <div class="info-card">
                  <div class="card-header">
                    <span class="card-icon">🎨</span>
                    <span class="card-title">Right Panel: Palette & Properties</span>
                  </div>
                  <p class="card-text">
                    Switch between <strong>Palette</strong> and <strong>Graphics</strong> tabs (or view both split).
                    Pick from authentic retro palettes (C64, Drean 16, CGA, Game Boy, EGA, Amiga, etc.), configure background/transparent slots,
                    and manage graphic dimensions, bit depth, and aspect ratios.
                    Toggle anytime using <kbd>{shortcuts.toggleProperties}</kbd>.
                  </p>
                </div>

                <div class="info-card">
                  <div class="card-header">
                    <span class="card-icon">👁️</span>
                    <span class="card-title">Floating Previews</span>
                  </div>
                  <p class="card-text">
                    <strong>Sprite Previews</strong> display real-time 1×, 2×, and 3× zoomed views of your sprite.
                    For <strong>Charsets</strong>, a 256-character sheet view with quick character picking and a seamless 5×5 tiling pattern preview appear docked on the right.
                  </p>
                </div>
              </div>
            </section>
          </div>
        {/if}

        <!-- TAB 2: COMMON WORKFLOWS -->
        {#if activeTab === 'workflows'}
          <div class="tab-pane">
            <section class="help-section">
              <h3 class="section-title">Common Workflows</h3>

              <div class="workflow-card">
                <h4 class="workflow-title">1. Creating & Ordering Graphics</h4>
                <ul class="workflow-list">
                  <li><strong>Add New Graphic:</strong> In the <em>Graphics</em> panel (or via <em>Graphic</em> menu), click <strong>+ Sprite</strong> for individual sprites or <strong>+ Charset</strong> for 256-character tile sets.</li>
                  <li><strong>Apply Presets:</strong> Quickly create standard platform configurations (e.g. Commodore 64 Multicolor Sprite 24×21 2:1, Game Boy 8×8, NES, CGA) from the <em>Graphic &gt; Apply System Preset</em> menu.</li>
                  <li><strong>Reordering Graphics:</strong> Drag and drop cards in the Graphics list using the drag handles, or click the ▲ / ▼ buttons on any graphic card to move it up or down.</li>
                  <li><strong>Duplicating & Deleting:</strong> Click the duplicate icon to clone an entire sprite with its pixels, or the trash icon to delete.</li>
                </ul>
              </div>

              <div class="workflow-card">
                <h4 class="workflow-title">2. Drawing & Editing Tools</h4>
                <ul class="workflow-list">
                  <li><strong>Primary vs. Secondary Color:</strong> Left-click and drag draws with the Primary color/slot; Right-click and drag draws with the Secondary color (or Background Slot 0 in slotted modes). Press <kbd>X</kbd> to swap them.</li>
                  <li><strong>Constraining Shapes:</strong> While using <em>Line</em>, hold <kbd>Shift</kbd> to lock angles to horizontal, vertical, or 45°. While using <em>Rectangle</em> or <em>Ellipse</em>, hold <kbd>Shift</kbd> to create visual 1:1 square or circle shapes.</li>
                  <li><strong>Flood Fill:</strong> The <em>Bucket</em> tool (<kbd>F</kbd>) fills all contiguous connected pixels matching the clicked color/slot.</li>
                  <li><strong>Eyedropper:</strong> Press <kbd>I</kbd> to switch to Eyedropper, or simply hold <kbd>Alt</kbd> while using any tool and click on canvas to sample colors.</li>
                </ul>
              </div>

              <div class="workflow-card">
                <h4 class="workflow-title">3. Panning & Navigating the View</h4>
                <ul class="workflow-list">
                  <li><strong>Hold Spacebar:</strong> Holding <kbd>Space</kbd> temporarily switches to the Pan tool. Drag with the mouse from <em>inside</em> the graphic area to pan. Releasing Space immediately restores your previous drawing tool.</li>
                  <li><strong>Pan Tool:</strong> Press <kbd>P</kbd> or click the Pan tool in the toolbar. Clicking and dragging from <em>inside</em> the image pans the canvas view. Hovering inside shows the 4-way arrow cursor.</li>
                  <li><strong>Middle Click:</strong> Click and drag with the middle mouse button from inside the image at any time to pan.</li>
                  <li><strong>Zooming:</strong> Use <kbd>+</kbd> / <kbd>-</kbd>, mouse wheel, or click the bottom-left zoom buttons. Press <kbd>0</kbd> to fit and re-center the graphic.</li>
                </ul>
              </div>

              <div class="workflow-card">
                <h4 class="workflow-title">4. Selection, Copying, Pasting & History</h4>
                <ul class="workflow-list">
                  <li><strong>Select Tool (<kbd>M</kbd>):</strong> Drag across the graphic to select a rectangular portion; animated marching ants outline the selection. Clicking inside the graphic or on the space around it clears the selection. You can also deselect at any time with <kbd>{shortcuts.deselect}</kbd> (or <em>Edit &gt; Deselect</em>).</li>
                  <li><strong>Copy (<kbd>{shortcuts.copy}</kbd>):</strong> If an area is selected, copies only the selected pixels to the clipboard. If nothing is selected, copies the entire graphic or active character.</li>
                  <li><strong>Paste & Floating Layer (<kbd>{shortcuts.paste}</kbd>):</strong> Pasting places the content in the center of the graphic on a movable floating second layer. The Select tool automatically activates and changes from a cross to a 4-way arrow cursor so you can drag and drop the pasted content to any position.</li>
                  <li><strong>Merging to Graphic:</strong> Press <kbd>Enter</kbd>, navigate to another tool, or perform an action (such as Undo, Clear, Shift, or clicking outside) to merge the floating content onto the graphic and remove the virtual paste layer.</li>
                  <li><strong>Deleting Selection / Discarding Paste:</strong> When having a pixel selection active, pressing <kbd>Del</kbd> (or <kbd>Backspace</kbd>) turns all pixels in the selection to the graphic's background color. If content has just been pasted and is still floating, pressing <kbd>Del</kbd> or <kbd>Esc</kbd> discards the floating content immediately.</li>
                  <li><strong>Smart Palette & BPP Down-Sampling:</strong> Clipboard content can be pasted repeatedly across any graphic. Palettes and bit depths (1 bpp, 2 bpp, 8 bpp) are conserved as best as possible using perceptual color distance down-sampling.</li>
                  <li><strong>Undo & Redo:</strong> Full multi-level history. Press <kbd>{shortcuts.undo}</kbd> to undo and <kbd>{shortcuts.redo}</kbd> to redo.</li>
                  <li><strong>Clear & Invert:</strong> Press <kbd>{shortcuts.clear}</kbd> to clear the canvas to background, or <kbd>{shortcuts.invert}</kbd> to invert pixels (in 1 bpp modes).</li>
                </ul>
              </div>

              <div class="workflow-card">
                <h4 class="workflow-title">5. Shifting & Rotating</h4>
                <ul class="workflow-list">
                  <li><strong>Nudge / Shift:</strong> Use <kbd>W</kbd>, <kbd>A</kbd>, <kbd>S</kbd>, <kbd>D</kbd> keys (or Edit menu) to shift the entire artwork by 1 pixel in any direction.</li>
                  <li><strong>Rotate:</strong> Press <kbd>&gt;</kbd> to rotate 90° clockwise, or <kbd>&lt;</kbd> to rotate 90° counter-clockwise.</li>
                  <li><strong>Flip / Mirror:</strong> Press <kbd>H</kbd> to flip horizontally, or <kbd>V</kbd> to flip vertically.</li>
                </ul>
              </div>

              <div class="workflow-card">
                <h4 class="workflow-title">6. Charset & Tile Editing</h4>
                <ul class="workflow-list">
                  <li><strong>256-Character Font:</strong> Charsets hold 256 individual characters. Switch between them using the top-left navigation bar (<kbd>◀</kbd> / <kbd>▶</kbd>) or arrow keys (<kbd>←</kbd>, <kbd>→</kbd>, <kbd>↑</kbd>, <kbd>↓</kbd>).</li>
                  <li><strong>Sheet View:</strong> Click the character in the docked 256-character sheet view on the right to jump directly to it.</li>
                  <li><strong>Tiling Preview:</strong> Watch the 5×5 preview update live to verify how your tiles connect seamlessly.</li>
                </ul>
              </div>

              <div class="workflow-card">
                <h4 class="workflow-title">7. Project & File I/O</h4>
                <ul class="workflow-list">
                  <li><strong>Project (.pxp):</strong> Save complete projects (<kbd>{shortcuts.save}</kbd>) with all sprites, charsets, custom palettes, and configurations.</li>
                  <li><strong>PNG Export:</strong> Export high-resolution PNG images with pixel scaling and optional transparent backgrounds.</li>
                  <li><strong>CSV Export & Import:</strong> Export or import raw pixel data in CSV format for integration into retro assemblers, cross-compilers, and custom engines.</li>
                </ul>
              </div>
            </section>
          </div>
        {/if}

        <!-- TAB 3: KEYBOARD SHORTCUTS -->
        {#if activeTab === 'shortcuts'}
          <div class="tab-pane">
            <div class="search-bar">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                class="search-input"
                bind:value={searchQuery}
                placeholder="Search shortcuts (e.g. pan, brush, zoom, copy)..."
                aria-label="Filter shortcuts"
              />
              {#if searchQuery}
                <button type="button" class="search-clear-btn" onclick={() => searchQuery = ''}>✕</button>
              {/if}
            </div>

            {#if filteredShortcutGroups.length === 0}
              <div class="empty-results">No shortcuts matching "{searchQuery}".</div>
            {:else}
              <div class="shortcuts-grid">
                {#each filteredShortcutGroups as group}
                  <div class="shortcut-group">
                    <h4 class="group-title">{group.title}</h4>
                    <table class="shortcuts-table">
                      <tbody>
                        {#each group.items as item}
                          <tr>
                            <td class="key-cell"><kbd>{item.key}</kbd></td>
                            <td class="desc-cell">{item.desc}</td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        <!-- TAB 4: BPP & PALETTES -->
        {#if activeTab === 'palette-bpp'}
          <div class="tab-pane">
            <section class="help-section">
              <h3 class="section-title">Bit Depth (BPP) & Color Modes</h3>
              <p class="section-desc">
                The <strong>BPP (Bits Per Pixel)</strong> setting determines how many bits represent each pixel in memory,
                encompassing the maximum simultaneous colors and color mapping behavior:
              </p>

              <div class="mode-cards">
                <div class="mode-card">
                  <div class="mode-badge bpp-1">1 bpp · 2 Colors</div>
                  <h4 class="mode-name">Monochrome / Hi-Res</h4>
                  <p class="mode-desc">
                    Each pixel uses 1 bit: <code>0</code> (Background slot) or <code>1</code> (Foreground slot).
                    Ideal for classic hi-res sprites, retro text modes, and monochrome systems.
                    Supports instant inverting with <kbd>{shortcuts.invert}</kbd>.
                  </p>
                </div>

                <div class="mode-card">
                  <div class="mode-badge bpp-2">2 bpp · 4 Colors</div>
                  <h4 class="mode-name">Multicolor / Slotted Mode</h4>
                  <p class="mode-desc">
                    Each pixel uses 2 bits referencing 4 hardware color slots:
                    <strong>Slot 0</strong> (Background), <strong>Slot 1</strong> (Foreground),
                    <strong>Slot 2</strong> (Main), and <strong>Slot 3</strong> (Multicolor 2).
                    Changing a slot's color instantly updates every pixel painted with that slot!
                  </p>
                </div>

                <div class="mode-card">
                  <div class="mode-badge bpp-8">8 bpp · 256 Colors</div>
                  <h4 class="mode-name">Direct Color Index (FatPixel Default)</h4>
                  <p class="mode-desc">
                    Each pixel directly references an 8-bit index (0–255) in the active palette.
                    Provides full freedom to paint with hundreds of colors without slot constraints, ideal for modern retro art and VGA-style graphics.
                  </p>
                </div>
              </div>
            </section>

            <section class="help-section">
              <h3 class="section-title">Pixel Aspect Ratios: 1:1 vs. 2:1 Fat Pixels</h3>
              <div class="aspect-grid">
                <div class="info-card">
                  <h4 class="card-title">1:1 Square Pixels</h4>
                  <p class="card-text">
                    Standard square pixels where width equals height. Used by modern displays, Game Boy, NES, CGA, ZX Spectrum, and standard sprite modes.
                  </p>
                </div>
                <div class="info-card">
                  <h4 class="card-title">2:1 Fat Pixels (Wide Pixels)</h4>
                  <p class="card-text">
                    Classic retro aspect ratio where horizontal pixels are twice as wide as they are tall.
                    Emulates authentic CRT multicolor modes (such as Commodore 64 160×200 multicolor mode, Amiga low-res, and Atari).
                    FatPixel renders pixels with true 2:1 geometry, matching the authentic visual proportions.
                  </p>
                </div>
              </div>
            </section>

            <section class="help-section">
              <h3 class="section-title">Authentic Retro Palettes</h3>
              <p class="section-desc">
                FatPixel includes authentic, accurately calibrated palettes from iconic retro systems:
              </p>
              <ul class="palette-list">
                <li><strong>Commodore 64 (Pepto):</strong> Authentic 16-color palette based on Philip 'Pepto' Timmermann's research.</li>
                <li><strong>Drean 16:</strong> Palette used by Argentine Drean Commodore 64 computers.</li>
                <li><strong>CGA (Warm & Cool):</strong> Classic 4-color IBM PC modes.</li>
                <li><strong>Game Boy:</strong> 4-level greenish LCD contrast palette.</li>
                <li><strong>ZX Spectrum:</strong> Sinclair Spectrum 8-color / 16-shade bright palette.</li>
                <li><strong>Teletext:</strong> 8-color BBC Micro / Ceefax teletext standard.</li>
                <li><strong>Pico-8:</strong> Popular 16-color retro fantasy console palette.</li>
                <li><strong>EGA:</strong> 16-color IBM PC Enhanced Graphics Adapter palette.</li>
                <li><strong>MSX:</strong> 16-color MSX microcomputer palette.</li>
                <li><strong>Apple II:</strong> 16-color composite video artifact palette.</li>
                <li><strong>Amiga 32:</strong> Classic 32-color Amiga OCS palette.</li>
                <li><strong>NES & Sega Master System:</strong> 64-color master console palettes.</li>
                <li><strong>VGA 256:</strong> Full 256-color PC VGA color palette.</li>
              </ul>
            </section>
          </div>
        {/if}

        <!-- TAB 5: ABOUT -->
        {#if activeTab === 'about'}
          <div class="tab-pane about-pane">
            <div class="about-hero">
              <div class="about-logo" aria-hidden="true">
                <svg viewBox="0 0 36 17" width="56" height="26" fill="none">
                  <path d="M16,0h4v1h-4z M24,0h2v1h-2z M2,1h2v1h-2z M16,1h2v1h-2z M22,1h2v1h-2z M0,2h2v1h-2z M16,2h2v1h-2z M22,2h2v1h-2z M0,3h2v1h-2z M16,3h10v1h-10z M0,4h2v1h-2z M12,4h4v1h-4z M18,4h2v1h-2z M26,4h2v1h-2z M0,5h2v1h-2z M10,5h6v1h-6z M20,5h2v1h-2z M24,5h4v1h-4z M2,6h10v1h-10z M14,6h2v1h-2z M20,6h2v1h-2z M24,6h2v1h-2z M28,6h2v1h-2z M4,7h2v1h-2z M14,7h2v1h-2z M30,7h2v1h-2z M4,8h2v1h-2z M14,8h2v1h-2z M30,8h4v1h-4z M4,9h2v1h-2z M14,9h4v1h-4z M30,9h6v1h-6z M4,10h2v1h-2z M8,10h14v1h-14z M28,10h8v1h-8z M4,11h6v1h-6z M16,11h2v1h-2z M20,11h8v1h-8z M32,11h2v1h-2z M2,12h4v1h-4z M8,12h2v1h-2z M16,12h2v1h-2z M20,12h2v1h-2z M2,13h2v1h-2z M8,13h2v1h-2z M16,13h2v1h-2z M20,13h2v1h-2z M2,14h2v1h-2z M8,14h4v1h-4z M14,14h4v1h-4z M22,14h2v1h-2z M0,15h4v1h-4z M10,15h2v1h-2z M14,15h2v1h-2z M22,15h2v1h-2z M0,16h2v1h-2z M10,16h2v1h-2z M14,16h2v1h-2z M22,16h2v1h-2z" fill="#000000" />
                  <path d="M16,4h2v1h-2z M20,4h6v1h-6z M16,5h2v1h-2z M12,6h2v1h-2z M16,6h2v1h-2z M26,6h2v1h-2z M6,7h8v1h-8z M16,7h14v1h-14z M6,8h8v1h-8z M16,8h14v1h-14z M6,9h8v1h-8z M18,9h12v1h-12z M6,10h2v1h-2z M22,10h6v1h-6z" fill="#8b4513" />
                  <path d="M18,5h2v1h-2z M22,5h2v1h-2z M18,6h2v1h-2z M22,6h2v1h-2z" fill="#ffffff" />
                </svg>
              </div>
              <h3 class="about-title"><span class="brand-fat">Fat</span><span class="brand-pixel">Pixel</span></h3>
              <p class="about-tagline">Pixel art editor for old school graphics</p>
              <div class="about-version">Version {APP_VERSION}</div>
            </div>

            <div class="about-body">
              <p>
                Web-based pixel art editor for old school graphics. Edit sprites and charsets with different palettes, bpp and pixel aspect ratios. Import and export to raw data and .png.
              </p>

              <div class="copyright-box">
                <div class="author-line">
                  <strong>Author:</strong> Drean64
                </div>
                <div class="copyright-notice">
                  Copyright © 2026 Drean64. All rights reserved.
                </div>
              </div>

              <div class="about-links">
                <a
                  href="https://github.com/ErnestoBorio/pixel"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="about-github-link"
                >
                  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  <span>FatPixel on GitHub</span>
                </a>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="help-footer">
        <span class="footer-hint">Tip: Press <kbd>F1</kbd> anytime to open this guide, or <kbd>Esc</kbd> to close.</span>
        <button type="button" class="close-action-btn" onclick={onClose}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .help-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(8, 8, 14, 0.78);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 16px;
  }

  .help-window {
    background: #1e1e28;
    border: 1px solid #3c3c50;
    border-radius: 10px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05);
    width: 840px;
    max-width: 96vw;
    height: 640px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #e0e0ec;
    font-size: 13px;
    line-height: 1.5;
  }

  .help-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 18px;
    background: #242434;
    border-bottom: 1px solid #36364a;
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .help-badge-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #181822;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid #3d3d52;
  }

  .help-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.2px;
  }

  .help-subtitle {
    font-size: 11px;
    color: #8da2c0;
  }

  .help-close-btn {
    background: transparent;
    border: none;
    color: #889;
    font-size: 16px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
  }

  .help-close-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }

  .help-tabs {
    display: flex;
    background: #181822;
    border-bottom: 1px solid #323244;
    padding: 0 12px;
    gap: 4px;
    flex-shrink: 0;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #9aa;
    padding: 9px 14px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }

  .tab-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.04);
  }

  .tab-btn.active {
    color: #5599ff;
    border-bottom-color: #5599ff;
    font-weight: 600;
  }

  .help-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    background: #1a1a24;
  }

  .tab-pane {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .help-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .section-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    border-bottom: 1px solid #2d2d3e;
    padding-bottom: 6px;
  }

  .section-desc {
    margin: 0;
    color: #b0b0c4;
    font-size: 13px;
  }

  .grid-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .info-card {
    background: #222230;
    border: 1px solid #353548;
    border-radius: 6px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-title {
    font-size: 13px;
    font-weight: 600;
    color: #e4eaf4;
  }

  .card-text {
    margin: 0;
    font-size: 12px;
    color: #a0a8be;
    line-height: 1.45;
  }

  .workflow-card {
    background: #222230;
    border: 1px solid #353548;
    border-radius: 6px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .workflow-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: #ffaa44;
  }

  .workflow-list {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: #b5bdd0;
    font-size: 12px;
  }

  .workflow-list li {
    line-height: 1.45;
  }

  .workflow-list strong {
    color: #eef2ff;
  }

  .search-bar {
    position: relative;
    display: flex;
    align-items: center;
    background: #14141d;
    border: 1px solid #36364a;
    border-radius: 6px;
    padding: 6px 10px;
    gap: 8px;
  }

  .search-bar:focus-within {
    border-color: #5599ff;
  }

  .search-icon {
    font-size: 13px;
    opacity: 0.6;
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 13px;
    outline: none;
  }

  .search-clear-btn {
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 12px;
    padding: 2px 4px;
  }

  .search-clear-btn:hover {
    color: #fff;
  }

  .shortcuts-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .shortcut-group {
    background: #20202c;
    border: 1px solid #343448;
    border-radius: 6px;
    overflow: hidden;
  }

  .group-title {
    margin: 0;
    padding: 8px 14px;
    background: #282838;
    font-size: 12px;
    font-weight: 700;
    color: #cbd5e1;
    border-bottom: 1px solid #343448;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .shortcuts-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .shortcuts-table tr {
    border-bottom: 1px solid #282836;
  }

  .shortcuts-table tr:last-child {
    border-bottom: none;
  }

  .key-cell {
    padding: 7px 14px;
    width: 220px;
    vertical-align: middle;
  }

  .desc-cell {
    padding: 7px 14px;
    color: #bac4da;
    vertical-align: middle;
  }

  kbd {
    display: inline-block;
    background: #14141c;
    border: 1px solid #3e3e52;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
    border-radius: 4px;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 11px;
    color: #f0f0ff;
    font-weight: 600;
    white-space: nowrap;
  }

  .mode-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .mode-card {
    background: #222230;
    border: 1px solid #353548;
    border-radius: 6px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mode-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    width: fit-content;
  }

  .mode-badge.bpp-1 {
    background: #263850;
    color: #77b5fe;
    border: 1px solid #3d5880;
  }

  .mode-badge.bpp-2 {
    background: #3e2d58;
    color: #d199ff;
    border: 1px solid #64448c;
  }

  .mode-badge.bpp-8 {
    background: #423820;
    color: #ffcc55;
    border: 1px solid #6e5828;
  }

  .mode-name {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
  }

  .mode-desc {
    margin: 0;
    font-size: 12px;
    color: #a4adc4;
    line-height: 1.45;
  }

  .aspect-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .palette-list {
    margin: 0;
    padding-left: 18px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 16px;
    color: #bac4da;
    font-size: 12px;
  }

  .palette-list strong {
    color: #e4eaf4;
  }

  .about-pane {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 24px;
    padding: 10px 20px;
  }

  .about-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .about-logo {
    margin-bottom: 6px;
  }

  .about-title {
    margin: 0;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: -0.5px;
  }

  .brand-fat {
    color: #fff;
  }

  .brand-pixel {
    color: #ffaa33;
  }

  .about-tagline {
    margin: 0;
    font-size: 14px;
    color: #99aabf;
  }

  .about-version {
    font-family: monospace;
    font-size: 12px;
    color: #5599ff;
    background: rgba(85, 153, 255, 0.12);
    border: 1px solid rgba(85, 153, 255, 0.3);
    padding: 2px 8px;
    border-radius: 12px;
    margin-top: 4px;
  }

  .about-body {
    max-width: 580px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    color: #cad3e8;
    font-size: 13px;
    line-height: 1.6;
  }

  .copyright-box {
    background: #151520;
    border: 1px solid #333348;
    border-radius: 8px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .author-line {
    font-size: 13px;
    color: #fff;
  }

  .copyright-notice {
    font-size: 12px;
    color: #8da2c0;
    font-family: monospace;
  }

  .about-links {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .about-github-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #252535;
    border: 1px solid #3d3d52;
    color: #fff;
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    transition: background 0.15s, border-color 0.15s;
  }

  .about-github-link:hover {
    background: #333348;
    border-color: #5599ff;
    color: #fff;
  }

  .empty-results {
    padding: 30px;
    text-align: center;
    color: #889;
    font-style: italic;
  }

  .help-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 18px;
    background: #20202c;
    border-top: 1px solid #323244;
    flex-shrink: 0;
  }

  .footer-hint {
    font-size: 11px;
    color: #7e8ea6;
  }

  .close-action-btn {
    background: #2c2c3c;
    border: 1px solid #444458;
    color: #eee;
    padding: 6px 16px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }

  .close-action-btn:hover {
    background: #3c3c52;
    border-color: #667799;
    color: #fff;
  }
</style>
