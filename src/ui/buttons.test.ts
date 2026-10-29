// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount, flushSync } from 'svelte';
import App from '../App.svelte';
import Canvas from './Canvas.svelte';
import { Graphic } from '../model/graphic';
import { defaultPalette } from '../model/palette';
import { setPlatformOverride } from '../platform';
import { copyFromGraphic, convertClipboardPixels } from '../model/clipboard';

describe('App Graphic actions and mode switching', () => {
  it('toggles mode, updates buttons, status bar, and slot states', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    const bppButtons = target.querySelectorAll<HTMLButtonElement>('.bpp-btn');
    const bpp1Btn = Array.from(bppButtons).find((b) => b.textContent?.trim() === '1');
    const bpp2Btn = Array.from(bppButtons).find((b) => b.textContent?.trim() === '2');
    const bpp8Btn = Array.from(bppButtons).find((b) => b.textContent?.trim() === '8');

    const ratioButtons = target.querySelectorAll<HTMLButtonElement>('.ratio-btn');
    const ratio1Btn = Array.from(ratioButtons).find((b) => b.textContent?.trim() === '1:1');
    const ratio2Btn = Array.from(ratioButtons).find((b) => b.textContent?.trim() === '2:1');

    expect(bpp1Btn).toBeDefined();
    expect(bpp2Btn).toBeDefined();
    expect(bpp8Btn).toBeDefined();
    expect(ratio1Btn).toBeDefined();
    expect(ratio2Btn).toBeDefined();

    const statusDim = target.querySelector<HTMLElement>('.status-bar .dim-text');
    expect(statusDim?.textContent).toContain('8 bpp · 2:1');

    // Initially in 8 bpp, 2:1 (FatPixel default sprite)
    expect(bpp8Btn?.classList.contains('active')).toBe(true);
    expect(ratio2Btn?.classList.contains('active')).toBe(true);

    // Switch to 1 bpp and 1:1
    bpp1Btn?.click();
    flushSync();
    expect(bpp1Btn?.classList.contains('active')).toBe(true);
    ratio1Btn?.click();
    flushSync();
    expect(ratio1Btn?.classList.contains('active')).toBe(true);
    expect(statusDim?.textContent).toContain('1 bpp · 1:1');

    // Click 2 bpp
    bpp2Btn?.click();
    flushSync();
    expect(bpp2Btn?.classList.contains('active')).toBe(true);
    expect(statusDim?.textContent).toContain('2 bpp · 1:1');

    // Click 2:1 aspect ratio
    ratio2Btn?.click();
    flushSync();
    expect(ratio2Btn?.classList.contains('active')).toBe(true);
    expect(statusDim?.textContent).toContain('2 bpp · 2:1');

    // Switch palette to C64 (16-color) -> 8 bpp is disabled
    const palSelect = target.querySelector<HTMLSelectElement>('.palette-select');
    if (palSelect) {
      palSelect.value = 'c64-pepto';
      palSelect.dispatchEvent(new Event('change', { bubbles: true }));
      flushSync();
    }
    expect(bpp8Btn?.disabled).toBe(true);

    // Switch palette to VGA 256 so 8 bpp is enabled and active
    if (palSelect) {
      palSelect.value = 'vga-256';
      palSelect.dispatchEvent(new Event('change', { bubbles: true }));
      flushSync();
    }
    expect(bpp8Btn?.disabled).toBe(false);
    expect(bpp8Btn?.classList.contains('active')).toBe(true);
    expect(statusDim?.textContent).toContain('8 bpp · 2:1');

    // Switch back to C64 palette (clamps BPP down to 4 on 16-color palette)
    if (palSelect) {
      palSelect.value = 'c64-pepto';
      palSelect.dispatchEvent(new Event('change', { bubbles: true }));
      flushSync();
    }

    // Back to 1 bpp and 1:1
    bpp1Btn?.click();
    ratio1Btn?.click();
    flushSync();
    expect(bpp1Btn?.classList.contains('active')).toBe(true);
    expect(ratio1Btn?.classList.contains('active')).toBe(true);
    expect(statusDim?.textContent).toContain('1 bpp · 1:1');
  });

  it('resizes sprite via size inputs', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    const inputs = target.querySelectorAll<HTMLInputElement>('.num-input');
    expect(inputs.length).toBeGreaterThanOrEqual(2);

    const wInput = inputs[0];
    const hInput = inputs[1];

    expect(wInput.value).toBe('160');
    expect(hInput.value).toBe('200');

    // Change width to 16
    wInput.value = '16';
    wInput.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();

    // Change height to 16
    hInput.value = '16';
    hInput.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();

    expect(wInput.value).toBe('16');
    expect(hInput.value).toBe('16');

    const statusDim = target.querySelector<HTMLElement>('.status-bar .dim-text');
    expect(statusDim?.textContent).toContain('16 × 16');
  });

  it('duplicates and deletes graphics', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    let listItems = target.querySelectorAll('.graphic-item');
    const initialCount = listItems.length;

    // Duplicate graphic
    const dupBtn = target.querySelector<HTMLButtonElement>('.icon-btn[title*="Duplicate"]');
    expect(dupBtn).toBeDefined();
    dupBtn?.click();
    flushSync();

    listItems = target.querySelectorAll('.graphic-item');
    expect(listItems.length).toBe(initialCount + 1);

    // Delete graphic
    const delBtn = target.querySelector<HTMLButtonElement>('.delete-btn[title*="Delete"]');
    expect(delBtn).toBeDefined();
    delBtn?.click();
    flushSync();

    listItems = target.querySelectorAll('.graphic-item');
    expect(listItems.length).toBe(initialCount);
  });

  it('keeps properties panel height and graphics list position stable between sprite and charset', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // Add a charset
    const addCharsetBtn = target.querySelector<HTMLButtonElement>('.add-btn[title*="Charset"]');
    expect(addCharsetBtn).toBeDefined();
    addCharsetBtn?.click();
    flushSync();

    const listItems = target.querySelectorAll('.graphic-item');
    expect(listItems.length).toBe(2);

    const propsSection = target.querySelector<HTMLElement>('.properties-section');
    expect(propsSection).toBeDefined();

    // Initially sprite is item 0, charset is item 1 (active)
    const selectCharsetBtn = listItems[1].querySelector<HTMLButtonElement>('.select-btn');
    const selectSpriteBtn = listItems[0].querySelector<HTMLButtonElement>('.select-btn');

    // Select sprite
    selectSpriteBtn?.click();
    flushSync();
    expect(propsSection?.querySelector('.toggle-btn')).not.toBeNull();
    const sizeRow = Array.from(propsSection?.querySelectorAll('.field-row') ?? []).find((r) =>
      r.textContent?.includes('Size:')
    );
    expect(sizeRow).not.toBeUndefined();
    const spriteDimInputs = sizeRow?.querySelectorAll('input.num-input');
    expect(spriteDimInputs?.length).toBe(2);

    // Select charset
    selectCharsetBtn?.click();
    flushSync();
    expect(propsSection?.querySelector('.readonly-badge')).not.toBeNull();
    const charRow = Array.from(propsSection?.querySelectorAll('.field-row') ?? []).find((r) =>
      r.textContent?.includes('Char:')
    );
    expect(charRow).not.toBeUndefined();
    const charsetDimInputs = charRow?.querySelectorAll('input.num-input');
    expect(charsetDimInputs?.length).toBe(2);

    // Active charset status bar should show 8x8 dimensions
    const statusDim = target.querySelector<HTMLElement>('.status-bar .dim-text');
    expect(statusDim?.textContent).toContain('8 × 8 (1 bpp · 1:1)');

    // Properties badge should show 128x128 sheet
    const charsetBadge = target.querySelector<HTMLElement>('.charset-info-badge');
    expect(charsetBadge?.textContent).toContain('256 chars · 16 cols · 128×128 sheet');
  });

  it('manages menu bar click-to-open and hover-when-open submenus', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    const menuItems = target.querySelectorAll<HTMLElement>('.menu-bar .menu-item');
    expect(menuItems.length).toBeGreaterThanOrEqual(4);

    const fileItem = menuItems[0];
    const editItem = menuItems[1];
    const viewItem = menuItems[3];

    const fileBtn = fileItem.querySelector<HTMLButtonElement>('.menu-btn');

    // 1. Hovering before click does NOT show dropdown
    fileItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    flushSync();
    expect(target.querySelector('.dropdown')).toBeNull();

    editItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    flushSync();
    expect(target.querySelector('.dropdown')).toBeNull();

    // 2. Clicking File opens its dropdown
    fileBtn?.click();
    flushSync();
    let dropdown = target.querySelector('.dropdown');
    expect(dropdown).not.toBeNull();
    expect(dropdown?.textContent).not.toContain('New Project');
    expect(dropdown?.textContent).toContain('Open…');
    expect(dropdown?.textContent).toContain('Import PNG…');
    expect(dropdown?.textContent).toContain('Import CSV…');
    expect(dropdown?.textContent).toContain('Export PNG…');
    expect(dropdown?.textContent).toContain('Export CSV…');

    // 3. Hovering Edit while menu is open switches to Edit dropdown
    editItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    flushSync();
    dropdown = target.querySelector('.dropdown');
    expect(dropdown).not.toBeNull();
    expect(dropdown?.textContent).toContain('Undo');
    expect(dropdown?.textContent).not.toContain('New Project');

    // 4. Hovering View switches to View dropdown
    viewItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    flushSync();
    dropdown = target.querySelector('.dropdown');
    expect(dropdown).not.toBeNull();
    expect(dropdown?.textContent).toContain('Pixel Grid');

    // 5. Clicking View button toggles the menu closed
    const viewBtn = viewItem.querySelector<HTMLButtonElement>('.menu-btn');
    viewBtn?.click();
    flushSync();
    expect(target.querySelector('.dropdown')).toBeNull();

    // 6. Clicking File opens again, pressing Escape closes it
    fileBtn?.click();
    flushSync();
    expect(target.querySelector('.dropdown')).not.toBeNull();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    flushSync();
    expect(target.querySelector('.dropdown')).toBeNull();
  });

  it('verifies select tool, deselect in edit menu, and performs selection, copy and paste', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // 1. Select tool button IS present in ToolsPanel, Eraser is NOT present
    const toolButtons = target.querySelectorAll<HTMLButtonElement>('.tool-btn');
    const selectToolBtn = Array.from(toolButtons).find((b) => b.textContent?.includes('Select'));
    expect(selectToolBtn).toBeDefined();
    const eraserToolBtn = Array.from(toolButtons).find((b) => b.textContent?.includes('Eraser'));
    expect(eraserToolBtn).toBeUndefined();

    // 2. Click Select tool button
    selectToolBtn?.click();
    flushSync();
    expect(selectToolBtn?.classList.contains('active')).toBe(true);

    // 3. Edit menu has Copy, Paste, and Deselect
    const editMenuBtn = Array.from(target.querySelectorAll<HTMLButtonElement>('.menu-btn')).find(
      (b) => b.textContent?.trim() === 'Edit'
    );
    expect(editMenuBtn).toBeDefined();
    editMenuBtn?.click();
    flushSync();

    const dropdown = target.querySelector('.dropdown');
    expect(dropdown?.textContent).toContain('Copy');
    expect(dropdown?.textContent).toContain('Paste');
    expect(dropdown?.textContent).toContain('Deselect');

    // Close menu with Escape
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    flushSync();

    // 4. Test Copy shortcut (⌘C)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', metaKey: true, bubbles: true }));
    flushSync();

    // 5. Add a charset and paste (⌘V) into it
    const addCharsetBtn = target.querySelector<HTMLButtonElement>('.add-btn[title*="Charset"]');
    addCharsetBtn?.click();
    flushSync();

    // Char navigation bar does NOT contain Clear or Invert buttons
    const charNavBar = target.querySelector('.char-nav-bar');
    expect(charNavBar).not.toBeNull();
    expect(charNavBar?.querySelector('.char-act-btn')).toBeNull();
    expect(charNavBar?.textContent).not.toContain('Clear');
    expect(charNavBar?.textContent).not.toContain('Invert');

    // Pasting into charset creates floating paste layer and switches to select tool
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', metaKey: true, bubbles: true }));
    flushSync();

    // Canvas container has tool-select-move class indicating 4-way arrow cursor
    const canvasContainer = target.querySelector('.canvas-container');
    expect(canvasContainer?.classList.contains('tool-select-move')).toBe(true);

    // Pressing Enter commits the floating paste layer
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(canvasContainer?.classList.contains('tool-select-move')).toBe(false);

    // Deselect via ⌘D
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', metaKey: true, bubbles: true }));
    flushSync();
  });

  it('verifies Save As window, direct save with last used name, and first save prompt', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // 1. Open File menu: both Save and Save As… should be present
    const fileBtn = Array.from(target.querySelectorAll<HTMLButtonElement>('.menu-btn')).find(
      (b) => b.textContent?.trim() === 'File'
    );
    expect(fileBtn).toBeDefined();
    fileBtn?.click();
    flushSync();

    const dropdown = target.querySelector('.dropdown');
    expect(dropdown?.textContent).toContain('Save');
    expect(dropdown?.textContent).toContain('Save As…');

    // 2. Click Save on fresh/first project: prompts with the Save As window
    const saveMenuItem = Array.from(target.querySelectorAll<HTMLButtonElement>('.dropdown-item')).find(
      (b) => b.textContent?.trim().startsWith('Save\n') || b.textContent?.trim().startsWith('Save ')
    );
    expect(saveMenuItem).toBeDefined();
    saveMenuItem?.click();
    flushSync();

    // 3. Save As modal window should now be visible for the first save
    let saveModal = target.querySelector('.save-as-modal');
    expect(saveModal).not.toBeNull();
    let nameInput = saveModal?.querySelector<HTMLInputElement>('#save-as-filename');
    expect(nameInput).not.toBeNull();

    // 4. Enter filename without extension: 'my_c64_game'
    if (nameInput) {
      nameInput.value = 'my_c64_game';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const saveSubmitBtn = saveModal?.querySelector<HTMLButtonElement>('.dialog-btn-primary');
    saveSubmitBtn?.click();
    flushSync();

    // Modal closes
    expect(target.querySelector('.save-as-modal')).toBeNull();

    // 5. Subsequent Save (⌘S) should directly download WITHOUT opening any prompt
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true, bubbles: true }));
    flushSync();

    // Save As modal should NOT be opened
    expect(target.querySelector('.save-as-modal')).toBeNull();

    // 6. Explicit Save As (⇧⌘S) should open the window with previous name prefilled
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true, shiftKey: true, bubbles: true }));
    flushSync();

    saveModal = target.querySelector('.save-as-modal');
    expect(saveModal).not.toBeNull();
    nameInput = saveModal?.querySelector<HTMLInputElement>('#save-as-filename');
    expect(nameInput?.value).toBe('my_c64_game');

    // 7. Test cancel button closes the window
    const cancelBtn = saveModal?.querySelector<HTMLButtonElement>('.dialog-btn-secondary');
    cancelBtn?.click();
    flushSync();
    expect(target.querySelector('.save-as-modal')).toBeNull();
  });

  it('renders a github badge at the top right linking to ErnestoBorio/pixel', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    const githubBadge = target.querySelector<HTMLAnchorElement>('.github-badge');
    expect(githubBadge).not.toBeNull();
    expect(githubBadge?.href).toBe('https://github.com/ErnestoBorio/pixel');
    expect(githubBadge?.target).toBe('_blank');
    expect(githubBadge?.rel).toContain('noopener');
    expect(githubBadge?.querySelector('svg.github-icon')).not.toBeNull();
  });

  it('renders a centered FatPixel logo in the top bar and FatPixel version tooltip', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    const menuCenter = target.querySelector('.menu-bar .menu-center');
    expect(menuCenter).not.toBeNull();
    const logo = menuCenter?.querySelector('.fatpixel-logo');
    expect(logo).not.toBeNull();
    expect(logo?.getAttribute('title')).toBe('FatPixel');
    expect(logo?.querySelector('.logo-icon')).not.toBeNull();
    expect(logo?.querySelector('.logo-fat')?.textContent).toBe('Fat');
    expect(logo?.querySelector('.logo-pixel')?.textContent).toBe('Pixel');

    const versionBadge = target.querySelector('.menu-bar .version-badge');
    expect(versionBadge?.getAttribute('title')).toContain('FatPixel');
  });

  it('renders compact swatches for 32 and 64 color palettes with color readout', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    const palSelect = target.querySelector<HTMLSelectElement>('.palette-select');
    expect(palSelect).not.toBeNull();

    // Switch to C64 (16 colors)
    if (palSelect) {
      palSelect.value = 'c64-pepto';
      palSelect.dispatchEvent(new Event('change', { bubbles: true }));
      flushSync();
    }
    let grid = target.querySelector<HTMLElement>('.palette-grid');
    expect(grid?.classList.contains('dense-32')).toBe(false);
    expect(grid?.classList.contains('dense-small')).toBe(false);
    expect(target.querySelectorAll('.color-btn').length).toBe(16);

    // Switch to Amiga 32
    if (palSelect) {
      palSelect.value = 'amiga-32';
      palSelect.dispatchEvent(new Event('change', { bubbles: true }));
      flushSync();
    }
    grid = target.querySelector<HTMLElement>('.palette-grid');
    expect(grid?.classList.contains('dense-32')).toBe(true);
    expect(grid?.classList.contains('dense-small')).toBe(false);
    expect(target.querySelectorAll('.color-btn').length).toBe(32);
    expect(target.querySelector('.color-readout')).not.toBeNull();

    // Switch to NES 64
    if (palSelect) {
      palSelect.value = 'nes-64';
      palSelect.dispatchEvent(new Event('change', { bubbles: true }));
      flushSync();
    }
    grid = target.querySelector<HTMLElement>('.palette-grid');
    expect(grid?.classList.contains('dense-64')).toBe(true);
    expect(target.querySelectorAll('.color-btn').length).toBe(64);
    expect(target.querySelector('.color-readout')).not.toBeNull();

    // Switch to SMS 64
    if (palSelect) {
      palSelect.value = 'sms-64';
      palSelect.dispatchEvent(new Event('change', { bubbles: true }));
      flushSync();
    }
    grid = target.querySelector<HTMLElement>('.palette-grid');
    expect(grid?.classList.contains('dense-64')).toBe(true);
    expect(target.querySelectorAll('.color-btn').length).toBe(64);
    expect(target.querySelector('.color-readout')).not.toBeNull();
    const readoutRgb = target.querySelector<HTMLElement>('.readout-rgb');
    expect(readoutRgb?.textContent).toMatch(/^\(\d+,\s*\d+,\s*\d+\)$/);

    // Check palette names
    if (palSelect) {
      const vgaOption = Array.from(palSelect.options).find((o) => o.value === 'vga-256');
      expect(vgaOption?.textContent).toBe('VGA');

      const egaOption = Array.from(palSelect.options).find((o) => o.value === 'ega-16');
      expect(egaOption?.textContent).toBe('EGA');

      const msxOption = Array.from(palSelect.options).find((o) => o.value === 'msx-16');
      expect(msxOption?.textContent).toBe('MSX');

      const teletextOption = Array.from(palSelect.options).find((o) => o.value === 'teletext-8');
      expect(teletextOption?.textContent).toBe('Teletext');

      palSelect.value = 'vga-256';
      palSelect.dispatchEvent(new Event('change', { bubbles: true }));
      flushSync();
    }
    const vgaReadoutRgb = target.querySelector<HTMLElement>('.readout-rgb');
    expect(vgaReadoutRgb?.textContent).toMatch(/^\(\d+,\s*\d+,\s*\d+\)$/);
  });

  it('draws circles constrained to visual 1:1 shape in 2:1 mode', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // Select 2:1 ratio
    const ratio2Btn = Array.from(target.querySelectorAll<HTMLButtonElement>('.ratio-btn')).find(
      (b) => b.textContent?.trim() === '2:1'
    );
    ratio2Btn?.click();
    flushSync();

    // Select Ellipse tool
    const ellipseToolBtn = Array.from(target.querySelectorAll<HTMLButtonElement>('.tool-btn')).find(
      (b) => b.textContent?.includes('Ellipse')
    );
    expect(ellipseToolBtn).toBeDefined();
    ellipseToolBtn?.click();
    flushSync();

    const canvas = target.querySelector<HTMLCanvasElement>('canvas.pixel-canvas');
    expect(canvas).not.toBeNull();
  });

  it('allows selecting color #00 and other colors using the right button in 4bpp direct mode', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // Switch to C64 (16 colors) and select 4 bpp
    const palSelect = target.querySelector<HTMLSelectElement>('.palette-select');
    if (palSelect) {
      palSelect.value = 'c64-pepto';
      palSelect.dispatchEvent(new Event('change', { bubbles: true }));
      flushSync();
    }

    const bpp4Btn = Array.from(target.querySelectorAll<HTMLButtonElement>('.bpp-btn')).find(
      (b) => b.textContent?.trim() === '4'
    );
    expect(bpp4Btn).toBeDefined();
    bpp4Btn?.click();
    flushSync();

    // Verify direct mode (no slots container rendered)
    expect(target.querySelector('.slots-container')).toBeNull();

    const swatches = target.querySelectorAll<HTMLButtonElement>('.color-btn');
    expect(swatches.length).toBe(16);

    const swatch0 = swatches[0];
    const swatch5 = swatches[5];

    // Right-click on swatch 5
    swatch5.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    flushSync();
    expect(swatch5.classList.contains('is-sec')).toBe(true);
    expect(swatch0.classList.contains('is-sec')).toBe(false);

    // Right-click back on swatch 0 (#00 color)
    swatch0.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    flushSync();
    expect(swatch0.classList.contains('is-sec')).toBe(true);
    expect(swatch5.classList.contains('is-sec')).toBe(false);
  });

  it('renders BPP label and a pure graphical 4x4 tiling preview in the charset preview panel', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // Verify BPP label is used in properties panel instead of Depth
    const labels = Array.from(target.querySelectorAll<HTMLElement>('.properties-section .label')).map(
      (l) => l.textContent?.trim()
    );
    expect(labels).toContain('BPP:');
    expect(labels).not.toContain('Depth:');

    // Add a charset
    const addCharsetBtn = target.querySelector<HTMLButtonElement>('.add-btn[title*="Charset"]');
    expect(addCharsetBtn).toBeDefined();
    addCharsetBtn?.click();
    flushSync();

    // Ensure floating panel is open
    const openPill = target.querySelector<HTMLButtonElement>('.floating-panel-pill');
    if (openPill) {
      openPill.click();
      flushSync();
    }

    // Verify charset preview panel exists
    const sheetPanel = target.querySelector('.charset-sheet-panel');
    expect(sheetPanel).not.toBeNull();

    // Verify 5x5 tiling preview exists at the bottom with NO buttons and NO title text
    const tilePreviewSection = sheetPanel?.querySelector('.tile-preview-section');
    expect(tilePreviewSection).not.toBeNull();
    expect(tilePreviewSection?.querySelectorAll('button').length).toBe(0);
    expect(tilePreviewSection?.textContent?.trim()).toBe('');

    // Verify canvas exists with 5x5 matrix dimensions (8x8 char at 2x scale: 5 * 8 * 2 = 80)
    const tileCanvas = tilePreviewSection?.querySelector<HTMLCanvasElement>('canvas.tile-preview-canvas');
    expect(tileCanvas).not.toBeNull();
    expect(tileCanvas?.width).toBe(80);
    expect(tileCanvas?.height).toBe(80);
  });

  it('applies system presets to turn current graphic into Commodore 64, Game Boy, ZX Spectrum, IBM PC, and NES settings', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    const openGraphicMenu = () => {
      const graphicMenuBtn = Array.from(target.querySelectorAll<HTMLButtonElement>('.menu-btn')).find(
        (b) => b.textContent?.trim() === 'Graphic'
      );
      expect(graphicMenuBtn).toBeDefined();
      graphicMenuBtn?.click();
      flushSync();
    };

    const clickPreset = (presetName: string) => {
      openGraphicMenu();
      const presetBtn = Array.from(target.querySelectorAll<HTMLButtonElement>('.dropdown-item')).find(
        (b) => b.textContent?.trim() === presetName
      );
      expect(presetBtn).toBeDefined();
      presetBtn?.click();
      flushSync();
    };

    // 1. Test Commodore 64 preset on Sprite: C64 palette, 2 bpp, 2:1 aspect, 12x21 size
    clickPreset('Commodore 64');
    expect(target.querySelector('.aspect-buttons .ratio-btn.active')?.textContent?.trim()).toBe('2:1');
    expect(target.querySelector('.bpp-buttons .bpp-btn.active')?.textContent?.trim()).toBe('2');
    const inputs = target.querySelectorAll<HTMLInputElement>('.num-input');
    expect(inputs[0]?.value).toBe('12');
    const getPaletteName = () => {
      const labels = Array.from(target.querySelectorAll('.palette-panel .section-label')).map(el => el.textContent?.trim());
      return labels[labels.length - 1];
    };
    expect(getPaletteName()).toContain('Commodore 64');

    // 2. Test IBM PC preset on Sprite: VGA palette, 8 bpp, 1:1 aspect
    clickPreset('IBM PC');
    expect(target.querySelector('.aspect-buttons .ratio-btn.active')?.textContent?.trim()).toBe('1:1');
    expect(target.querySelector('.bpp-buttons .bpp-btn.active')?.textContent?.trim()).toBe('8');
    expect(getPaletteName()).toBe('VGA');

    // 3. Test NES preset on Sprite: NES palette, 2 bpp, 1:1 aspect
    clickPreset('NES');
    expect(target.querySelector('.aspect-buttons .ratio-btn.active')?.textContent?.trim()).toBe('1:1');
    expect(target.querySelector('.bpp-buttons .bpp-btn.active')?.textContent?.trim()).toBe('2');
    expect(getPaletteName()).toBe('NES');

    // 4. Test on Charset
    const addCharsetBtn = target.querySelector<HTMLButtonElement>('.add-btn[title*="Charset"]');
    addCharsetBtn?.click();
    flushSync();

    // IBM PC on Charset: 1 bpp, 1:1, 9x14 size
    clickPreset('IBM PC');
    expect(target.querySelector('.bpp-buttons .bpp-btn.active')?.textContent?.trim()).toBe('1');
    expect(target.querySelector('.aspect-buttons .ratio-btn.active')?.textContent?.trim()).toBe('1:1');
    expect(getPaletteName()).toBe('VGA');
    const charW = target.querySelector<HTMLInputElement>('.dim-inputs input[title*="width"]')?.value;
    const charH = target.querySelector<HTMLInputElement>('.dim-inputs input[title*="height"]')?.value;
    expect(charW).toBe('9');
    expect(charH).toBe('14');

    // NES on Charset: 2 bpp, 1:1, 8x8 size
    clickPreset('NES');
    expect(target.querySelector('.bpp-buttons .bpp-btn.active')?.textContent?.trim()).toBe('2');
    expect(getPaletteName()).toBe('NES');
    const nesCharW = target.querySelector<HTMLInputElement>('.dim-inputs input[title*="width"]')?.value;
    const nesCharH = target.querySelector<HTMLInputElement>('.dim-inputs input[title*="height"]')?.value;
    expect(nesCharW).toBe('8');
    expect(nesCharH).toBe('8');
  });

  it('verifies panel toggle buttons use text Tools and Properties, no icons, and minimized sidebar shows Properties', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // 1. Verify header toggle buttons are text "Tools" and "Properties" without icons
    const headerToggleBtns = target.querySelectorAll<HTMLButtonElement>('.header-toggle-btn');
    expect(headerToggleBtns.length).toBe(2);
    const toolsBtn = headerToggleBtns[0];
    const propertiesBtn = headerToggleBtns[1];

    expect(toolsBtn.textContent?.trim()).toBe('Tools');
    expect(propertiesBtn.textContent?.trim()).toBe('Properties');
    expect(toolsBtn.textContent).not.toContain('🛠');
    expect(propertiesBtn.textContent).not.toContain('🎨');

    // 2. Verify View menu dropdown contains "Tools" and "Properties"
    const menuItems = target.querySelectorAll('.menu-item');
    const viewItem = Array.from(menuItems).find((el) => el.querySelector('.menu-btn')?.textContent?.trim() === 'View');
    const viewBtn = viewItem?.querySelector<HTMLButtonElement>('.menu-btn');
    viewBtn?.click();
    flushSync();

    const viewDropdown = target.querySelector('.dropdown');
    expect(viewDropdown?.textContent).toContain('Tools');
    expect(viewDropdown?.textContent).toContain('Properties');
    expect(viewDropdown?.textContent).not.toContain('Tools Panel');
    expect(viewDropdown?.textContent).not.toContain('Right Sidebar');

    // Close view menu
    viewBtn?.click();
    flushSync();

    // 3. Minimize / collapse right panel (properties) and verify minimized button shows "Properties"
    expect(propertiesBtn.classList.contains('active')).toBe(true);
    propertiesBtn.click();
    flushSync();
    expect(propertiesBtn.classList.contains('active')).toBe(false);

    const rightMinimizedBtn = target.querySelector<HTMLButtonElement>('.floating-panel-toggle.right-toggle');
    expect(rightMinimizedBtn).not.toBeNull();
    expect(rightMinimizedBtn?.textContent?.trim()).toBe('Properties');
    expect(rightMinimizedBtn?.textContent).not.toContain('🎨');
    expect(rightMinimizedBtn?.textContent).not.toContain('Sidebar');

    // Clicking minimized button restores the properties panel
    rightMinimizedBtn?.click();
    flushSync();
    expect(propertiesBtn.classList.contains('active')).toBe(true);
    expect(target.querySelector('.floating-panel-toggle.right-toggle')).toBeNull();

    // 4. Minimize / collapse left panel (tools) and verify minimized button shows "Tools"
    toolsBtn.click();
    flushSync();
    expect(toolsBtn.classList.contains('active')).toBe(false);

    const leftMinimizedBtn = target.querySelector<HTMLButtonElement>('.floating-panel-toggle.left-toggle');
    expect(leftMinimizedBtn).not.toBeNull();
    expect(leftMinimizedBtn?.textContent?.trim()).toBe('Tools');
    expect(leftMinimizedBtn?.textContent).not.toContain('🛠');

    // Clicking minimized button restores the tools panel
    leftMinimizedBtn?.click();
    flushSync();
    expect(toolsBtn.classList.contains('active')).toBe(true);
    expect(target.querySelector('.floating-panel-toggle.left-toggle')).toBeNull();
  });

  it('renders empty canvas thumbnail in graphics list for empty graphics instead of S / C badge', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // Switch to Graphics tab
    const graphicsTabBtn = Array.from(target.querySelectorAll<HTMLButtonElement>('.tab-btn')).find((b) =>
      b.textContent?.includes('Graphics')
    );
    graphicsTabBtn?.click();
    flushSync();

    // Check graphic items in the list
    const graphicItems = target.querySelectorAll('.graphic-item');
    expect(graphicItems.length).toBeGreaterThanOrEqual(1);

    // Each empty graphic item should contain a canvas.thumb-canvas and NO .badge or S/C badges
    for (const item of graphicItems) {
      const thumbCanvas = item.querySelector('canvas.thumb-canvas');
      expect(thumbCanvas).not.toBeNull();
      expect(item.querySelector('.badge')).toBeNull();
      expect(item.querySelector('.sprite-badge')).toBeNull();
      expect(item.querySelector('.charset-badge')).toBeNull();
    }
  });

  it('verifies palette names and palette panel titles do not state the color count', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // Switch to Palette tab
    const paletteTabBtn = Array.from(target.querySelectorAll<HTMLButtonElement>('.tab-btn')).find((b) =>
      b.textContent?.includes('Palette')
    );
    paletteTabBtn?.click();
    flushSync();

    // Verify all options in the palette select do NOT contain (16), (32), (64), (4), (2)
    const palSelect = target.querySelector<HTMLSelectElement>('.palette-select');
    expect(palSelect).not.toBeNull();
    const options = Array.from(palSelect?.options ?? []);
    expect(options.length).toBeGreaterThan(0);
    for (const opt of options) {
      expect(opt.textContent).not.toMatch(/\(\d+\)/);
    }

    // Verify default C64 option text is "Commodore 64" without "(16)"
    const c64Opt = options.find((o) => o.value === 'c64-pepto');
    expect(c64Opt?.textContent).toBe('Commodore 64');

    // Switch to C64 and 1 bpp to test Color Slots section labels
    if (palSelect) {
      palSelect.value = 'c64-pepto';
      palSelect.dispatchEvent(new Event('change', { bubbles: true }));
      flushSync();
    }
    const bpp1Btn = Array.from(target.querySelectorAll<HTMLButtonElement>('.bpp-btn')).find((b) =>
      b.textContent?.trim() === '1'
    );
    bpp1Btn?.click();
    flushSync();

    // Verify section labels do not contain counts like "(16)" or "Color Slots (2)"
    const sectionLabels = target.querySelectorAll('.palette-panel .section-label');
    const labelTexts = Array.from(sectionLabels).map((el) => el.textContent?.trim());
    expect(labelTexts).toContain('Color Slots');
    expect(labelTexts).not.toContain('Color Slots (2)');
    for (const text of labelTexts) {
      expect(text).not.toMatch(/\(\d+\)/);
    }
  });

  it('verifies charsets in the graphics list display their size e.g. 8×8 instead of 256c', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // Switch to Graphics tab
    const graphicsTabBtn = Array.from(target.querySelectorAll<HTMLButtonElement>('.tab-btn')).find((b) =>
      b.textContent?.includes('Graphics')
    );
    graphicsTabBtn?.click();
    flushSync();

    // Add a charset
    const addCharsetBtn = target.querySelector<HTMLButtonElement>('.add-btn[title*="Charset"]');
    addCharsetBtn?.click();
    flushSync();

    // Find the charset item in the list
    const graphicItems = target.querySelectorAll('.graphic-item');
    const charsetItem = Array.from(graphicItems).find((item) =>
      item.querySelector('.name')?.textContent?.toLowerCase().includes('charset')
    );
    expect(charsetItem).toBeDefined();

    const subtext = charsetItem?.querySelector('.subtext')?.textContent?.trim();
    expect(subtext).toContain('8×8');
    expect(subtext).not.toContain('256c');
  });

  it('displays Command and Option shortcuts on macOS', async () => {
    setPlatformOverride(true);
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    const fileBtn = Array.from(target.querySelectorAll<HTMLButtonElement>('.menu-btn')).find(
      (b) => b.textContent?.trim() === 'File'
    );
    fileBtn?.click();
    flushSync();

    const dropdown = target.querySelector('.dropdown');
    expect(dropdown?.textContent).toContain('⌘O');
    expect(dropdown?.textContent).toContain('⌘S');
    expect(dropdown?.textContent).toContain('⇧⌘S');

    // Header toggle buttons
    const toolsBtn = target.querySelector<HTMLButtonElement>('.header-toggle-btn[title*="Tools"]');
    expect(toolsBtn?.getAttribute('title')).toContain('⌥1');

    setPlatformOverride(null);
  });

  it('displays Control and Alt shortcuts on Windows/Linux', async () => {
    setPlatformOverride(false);
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    const fileBtn = Array.from(target.querySelectorAll<HTMLButtonElement>('.menu-btn')).find(
      (b) => b.textContent?.trim() === 'File'
    );
    fileBtn?.click();
    flushSync();

    const dropdown = target.querySelector('.dropdown');
    expect(dropdown?.textContent).toContain('Ctrl+O');
    expect(dropdown?.textContent).toContain('Ctrl+S');
    expect(dropdown?.textContent).toContain('Ctrl+Shift+S');

    // Header toggle buttons
    const toolsBtn = target.querySelector<HTMLButtonElement>('.header-toggle-btn[title*="Tools"]');
    expect(toolsBtn?.getAttribute('title')).toContain('Alt+1');

    setPlatformOverride(null);
  });

  it('triggers shortcuts via Ctrl key on Windows/Linux', async () => {
    setPlatformOverride(false);
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // Ctrl+S opens Save As modal on a fresh project
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }));
    flushSync();

    const saveModal = target.querySelector('.save-as-modal');
    expect(saveModal).not.toBeNull();

    setPlatformOverride(null);
  });

  it('reflects 2:1 aspect ratio in charset sheet by rendering 8 chars per row instead of 16', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // 1. Add a charset
    const addCharsetBtn = target.querySelector<HTMLButtonElement>('.add-btn[title*="Charset"]');
    addCharsetBtn?.click();
    flushSync();

    // If floating panel is minimized, open it
    const openPill = target.querySelector<HTMLButtonElement>('.floating-panel-pill');
    if (openPill) {
      openPill.click();
      flushSync();
    }

    // 2. Locate the sheet canvas
    const sheetCanvas = target.querySelector<HTMLCanvasElement>('.sheet-canvas-wrapper canvas');
    expect(sheetCanvas).not.toBeNull();

    // Initially 1:1 mode -> 16 columns per row
    // cellW = 8*2 = 16, cellH = 8*2 = 16
    // totalW = 16 * (16 + 1) + 1 = 273, totalH = 16 * (16 + 1) + 1 = 273
    expect(sheetCanvas?.width).toBe(273);
    expect(sheetCanvas?.height).toBe(273);

    // 3. Switch aspect ratio to 2:1
    const ratio21Btn = Array.from(target.querySelectorAll<HTMLButtonElement>('.ratio-btn')).find(
      (b) => b.textContent?.trim() === '2:1'
    );
    expect(ratio21Btn).toBeDefined();
    ratio21Btn?.click();
    flushSync();

    // 4. In 2:1 mode -> 8 columns per row, each char cell is 32x16
    // cellW = 8 * 4 = 32, cellH = 8 * 2 = 16
    // totalW = 8 * (32 + 1) + 1 = 265 (does not grow horizontally)
    // totalH = 32 * (16 + 1) + 1 = 545 (grows vertically)
    expect(sheetCanvas?.width).toBe(265);
    expect(sheetCanvas?.height).toBe(545);

    // 5. Clicking on col 2, row 3 should select char # (3 * 8 + 2) = 26
    const rect = sheetCanvas!.getBoundingClientRect();
    sheetCanvas?.dispatchEvent(
      new MouseEvent('mousedown', {
        clientX: rect.left + 72,
        clientY: rect.top + 57,
        bubbles: true,
      })
    );
    flushSync();

    const charTitle = target.querySelector('.char-title');
    expect(charTitle?.textContent).toContain('Char #26');
  });

  it('displays all graphic properties including Size W/H and allows resizing sprite', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // Verify properties section exists
    const propsSection = target.querySelector<HTMLElement>('.properties-section');
    expect(propsSection).not.toBeNull();

    // Verify all rows exist: Name, BPP, Aspect, Size
    const labels = Array.from(propsSection!.querySelectorAll<HTMLElement>('.field-row .label')).map(
      (l) => l.textContent?.trim()
    );
    expect(labels).toContain('Name:');
    expect(labels).toContain('BPP:');
    expect(labels).toContain('Aspect:');
    expect(labels).toContain('Size:');

    // Find W and H inputs
    const sizeRow = Array.from(propsSection!.querySelectorAll<HTMLElement>('.field-row')).find((r) =>
      r.textContent?.includes('Size:')
    );
    const numInputs = sizeRow?.querySelectorAll<HTMLInputElement>('input.num-input');
    expect(numInputs?.length).toBe(2);

    const wInput = numInputs![0];
    const hInput = numInputs![1];
    expect(wInput.value).toBe('160');
    expect(hInput.value).toBe('200');

    // Resize sprite using W input
    wInput.value = '32';
    wInput.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();

    expect(wInput.value).toBe('32');
    const statusDim = target.querySelector<HTMLElement>('.status-bar .dim-text');
    expect(statusDim?.textContent).toContain('32 × 200');
  });

  it('renders 1x, 2x, and 3x zoom levels in sprite preview panel', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // Ensure floating panel is open
    const openPill = target.querySelector<HTMLButtonElement>('.floating-panel-pill');
    if (openPill) {
      openPill.click();
      flushSync();
    }

    const previewPanel = target.querySelector('.sprite-preview-panel');
    expect(previewPanel).not.toBeNull();

    // Verify preview boxes and labels: 1×, 2×, 3×
    const labels = Array.from(previewPanel!.querySelectorAll('.preview-label span')).map((s) => s.textContent?.trim());
    expect(labels).toEqual(['1×', '2×', '3×']);

    // Verify 3 preview viewports exist with canvas elements
    const viewports = previewPanel!.querySelectorAll('.preview-viewport');
    expect(viewports.length).toBe(3);

    const canvases = Array.from(viewports).map((v) => v.querySelector('canvas'));
    expect(canvases.every((c) => c !== null)).toBe(true);

    // Initial default sprite is 160x200, 2:1 wide pixel aspect ratio (width = 160 * 2 = 320 at 1x)
    const c1 = canvases[0] as HTMLCanvasElement;
    const c2 = canvases[1] as HTMLCanvasElement;
    const c3 = canvases[2] as HTMLCanvasElement;

    expect(c1.width).toBe(320); // 160 * 2 * 1
    expect(c1.height).toBe(200); // 200 * 1

    expect(c2.width).toBe(640); // 160 * 2 * 2
    expect(c2.height).toBe(400); // 200 * 2

    expect(c3.width).toBe(960); // 160 * 2 * 3
    expect(c3.height).toBe(600); // 200 * 3
  });

  it('provides the Pan tool with 4-way arrow cursor, dragging to pan view, and Spacebar hold shortcut', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // 1. Verify Pan tool button exists in Tools panel
    const panBtn = Array.from(target.querySelectorAll<HTMLButtonElement>('.tool-btn')).find(
      (b) => b.querySelector('.tool-label')?.textContent?.trim() === 'Pan'
    );
    expect(panBtn).toBeDefined();
    expect(panBtn?.querySelector('.tool-shortcut')?.textContent?.trim()).toBe('Space');

    const canvasContainer = target.querySelector<HTMLElement>('.canvas-container');
    expect(canvasContainer).not.toBeNull();
    expect(canvasContainer?.classList.contains('tool-pan')).toBe(false);

    // 2. Click Pan button to select Pan tool
    panBtn?.click();
    flushSync();

    expect(panBtn?.classList.contains('active')).toBe(true);
    expect(canvasContainer?.classList.contains('tool-pan')).toBe(true);

    // 3. Pan on canvas by dragging: does not modify graphic pixels
    const canvas = target.querySelector<HTMLCanvasElement>('canvas.pixel-canvas');
    expect(canvas).not.toBeNull();

    canvas?.dispatchEvent(new MouseEvent('mousedown', { clientX: 200, clientY: 200, button: 0, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 230, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 250, clientY: 230, bubbles: true }));
    flushSync();

    // 4. Select Pencil tool again
    const pencilBtn = Array.from(target.querySelectorAll<HTMLButtonElement>('.tool-btn')).find(
      (b) => b.querySelector('.tool-label')?.textContent?.trim() === 'Pencil'
    );
    pencilBtn?.click();
    flushSync();

    expect(pencilBtn?.classList.contains('active')).toBe(true);
    expect(panBtn?.classList.contains('active')).toBe(false);
    expect(canvasContainer?.classList.contains('tool-pan')).toBe(false);

    // 5. Hold Space: temporarily activates Pan tool without user selecting it
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
    flushSync();

    expect(canvasContainer?.classList.contains('tool-pan')).toBe(true);
    expect(panBtn?.classList.contains('active')).toBe(true);

    // 6. Release Space: restores previously selected tool (Pencil)
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
    flushSync();

    expect(canvasContainer?.classList.contains('tool-pan')).toBe(false);
    expect(pencilBtn?.classList.contains('active')).toBe(true);
    expect(panBtn?.classList.contains('active')).toBe(false);

    // 7. Shortcut 'P' selects Pan tool
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }));
    flushSync();

    expect(panBtn?.classList.contains('active')).toBe(true);
    expect(canvasContainer?.classList.contains('tool-pan')).toBe(true);
  });

  it('paning should be done dragging from inside the image, not on the outside', () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    const graphic = Graphic.newSprite('spr 1'); // 24x21
    const palette = defaultPalette();

    const canvasComponent = mount(Canvas, {
      target,
      props: {
        graphic,
        palette,
        tool: 'pan',
        brushShape: 'square',
        brushSize: 1,
        fillMode: false,
      },
    }) as any;
    flushSync();

    const canvas = target.querySelector<HTMLCanvasElement>('canvas.pixel-canvas');
    expect(canvas).not.toBeNull();

    // Initial pan offset is (0, 0)
    expect(canvasComponent.getPanOffsets()).toEqual({ x: 0, y: 0 });

    // 1. Mouse down OUTSIDE the image (e.g. clientX: -100, clientY: -100) and drag:
    canvas?.dispatchEvent(new MouseEvent('mousedown', { clientX: -100, clientY: -100, button: 0, bubbles: true }));
    canvas?.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 50, clientY: 50, bubbles: true }));
    flushSync();

    // Pan offsets must remain (0, 0) because panning cannot start outside image
    expect(canvasComponent.getPanOffsets()).toEqual({ x: 0, y: 0 });

    // 2. Mouse down INSIDE the image (e.g. clientX: 20, clientY: 20) and drag:
    canvas?.dispatchEvent(new MouseEvent('mousedown', { clientX: 20, clientY: 20, button: 0, bubbles: true }));
    canvas?.dispatchEvent(new MouseEvent('mousemove', { clientX: 60, clientY: 70, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 60, clientY: 70, bubbles: true }));
    flushSync();

    // Pan offsets must update by the drag delta (40, 50)
    expect(canvasComponent.getPanOffsets()).toEqual({ x: 40, y: 50 });
  });

  it('opens and interacts with the Help window citing shortcuts, workflows, and author Drean64', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    // 1. Help modal is initially closed
    expect(target.querySelector('.help-window')).toBeNull();

    // 2. Open via top menu bar Help dropdown
    const menuButtons = Array.from(target.querySelectorAll<HTMLButtonElement>('.menu-btn'));
    const helpMenuBtn = menuButtons.find((b) => b.textContent?.trim() === 'Help');
    expect(helpMenuBtn).toBeDefined();

    helpMenuBtn?.click();
    flushSync();

    const dropdownItems = Array.from(target.querySelectorAll<HTMLButtonElement>('.dropdown-item'));
    const shortcutsItem = dropdownItems.find((item) => item.textContent?.includes('Keyboard Shortcuts'));
    expect(shortcutsItem).toBeDefined();

    // Click "Keyboard Shortcuts…"
    shortcutsItem?.click();
    flushSync();

    // Modal is now open on top of everything
    const helpWindow = target.querySelector<HTMLElement>('.help-window');
    expect(helpWindow).not.toBeNull();
    expect(helpWindow?.textContent).toContain('FatPixel Help & User Guide');

    // 3. Active tab is "Shortcuts", cites key combinations
    const activeTab = helpWindow?.querySelector<HTMLButtonElement>('.tab-btn.active');
    expect(activeTab?.textContent).toContain('Shortcuts');
    expect(helpWindow?.textContent).toContain('Pencil / Brush tool');
    expect(helpWindow?.textContent).toContain('Pan tool');

    // Test shortcut filtering in search bar
    const searchInput = target.querySelector<HTMLInputElement>('.search-input');
    expect(searchInput).not.toBeNull();
    if (searchInput) {
      searchInput.value = 'pan';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      flushSync();
      expect(helpWindow?.textContent).toContain('Pan tool');
    }

    // 4. Switch to Workflows tab
    const tabs = Array.from(helpWindow?.querySelectorAll<HTMLButtonElement>('.tab-btn') ?? []);
    const workflowsTab = tabs.find((t) => t.textContent?.includes('Workflows'));
    workflowsTab?.click();
    flushSync();

    expect(helpWindow?.textContent).toContain('Creating & Ordering Graphics');
    expect(helpWindow?.textContent).toContain('Panning & Navigating the View');
    expect(helpWindow?.textContent).toContain('Copying, Pasting & History');

    // 5. Switch to BPP & Palettes tab
    const bppTab = tabs.find((t) => t.textContent?.includes('BPP & Palettes'));
    bppTab?.click();
    flushSync();

    expect(helpWindow?.textContent).toContain('1 bpp');
    expect(helpWindow?.textContent).toContain('2 bpp');
    expect(helpWindow?.textContent).toContain('8 bpp');
    expect(helpWindow?.textContent).toContain('2:1 Fat Pixels');
    expect(helpWindow?.textContent).toContain('Commodore 64');
    expect(helpWindow?.textContent).toContain('Drean 16');

    // 6. Switch to About tab and verify copyright notice citing Drean64
    const aboutTab = tabs.find((t) => t.textContent?.includes('About'));
    aboutTab?.click();
    flushSync();

    expect(helpWindow?.textContent).toContain('Drean64');
    expect(helpWindow?.textContent).toContain('Copyright © 2026 Drean64. All rights reserved.');

    // 7. Close via close button (✕)
    const closeBtn = target.querySelector<HTMLButtonElement>('.help-close-btn');
    closeBtn?.click();
    flushSync();

    expect(target.querySelector('.help-window')).toBeNull();

    // 8. Open via F1 keyboard shortcut
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1', bubbles: true }));
    flushSync();
    expect(target.querySelector('.help-window')).not.toBeNull();

    // 9. Close via Escape key
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    flushSync();
    expect(target.querySelector('.help-window')).toBeNull();

    // 10. Open via '?' keyboard shortcut
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
    flushSync();
    expect(target.querySelector('.help-window')).not.toBeNull();
    const shortcutsTab = target.querySelector<HTMLButtonElement>('.help-window .tab-btn.active');
    expect(shortcutsTab?.textContent).toContain('Shortcuts');

    // 11. Close via bottom Close button
    const closeActionBtn = target.querySelector<HTMLButtonElement>('.close-action-btn');
    closeActionBtn?.click();
    flushSync();
    expect(target.querySelector('.help-window')).toBeNull();

    // 12. Open via top header Help button
    const headerHelpBtn = target.querySelector<HTMLButtonElement>('.help-link-btn');
    expect(headerHelpBtn).not.toBeNull();
    headerHelpBtn?.click();
    flushSync();
    expect(target.querySelector('.help-window')).not.toBeNull();
  });

  it('tests rectangular selection, copy, paste, floating layer move, Enter merge, and deselect', async () => {
    // 1. Create a 16x16 sprite with some pixels
    const g1 = Graphic.newSprite('Sprite 1', 16, 16, 256, 'hires');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        g1.set(x, y, (x + y) % 16);
      }
    }
    const pal = defaultPalette();

    // 2. Copy a 4x4 sub-rectangle from (2, 2)
    const item = copyFromGraphic(g1, pal, { x: 2, y: 2, w: 4, h: 4 });
    expect(item.width).toBe(4);
    expect(item.height).toBe(4);
    expect(item.pixels[0]).toBe((2 + 2) % 16);
    expect(item.pixels[15]).toBe((5 + 5) % 16);

    // 3. Paste onto a 2bpp graphic (down-sampling)
    const g2 = Graphic.newSprite('Sprite 2', 16, 16, 4, 'hires');
    const converted = convertClipboardPixels(item, g2, pal);
    expect(converted.length).toBe(16);
    // Values clamped / mapped to 2bpp (depth 4 -> slots 0..3)
    for (let i = 0; i < converted.length; i++) {
      expect(converted[i]).toBeLessThan(4);
    }

    // 4. Mount Canvas directly to test floatingPaste, startFloatingPaste, commitFloatingPaste, deselect
    const target = document.createElement('div');
    document.body.appendChild(target);

    let currentTool: any = 'pencil';
    let selRect: any = null;
    let floatPaste: any = null;

    const comp = mount(Canvas, {
      target,
      props: {
        graphic: g2,
        palette: pal,
        tool: currentTool,
        brushShape: 'square',
        brushSize: 1,
        fillMode: false,
        selectionRect: selRect,
        floatingPaste: floatPaste,
      },
    });
    flushSync();

    // Start floating paste
    comp.startFloatingPaste(item);
    flushSync();
    expect(comp.hasFloatingPaste()).toBe(true);

    // Commit floating paste
    comp.commitFloatingPaste();
    flushSync();
    expect(comp.hasFloatingPaste()).toBe(false);

    // Test selection and deselect
    comp.setSelection({ x: 1, y: 1, w: 5, h: 5 });
    flushSync();
    expect(comp.hasSelection()).toBe(true);
    expect(comp.getSelection()).toEqual({ x: 1, y: 1, w: 5, h: 5 });

    comp.deselect();
    flushSync();
    expect(comp.hasSelection()).toBe(false);
    expect(comp.getSelection()).toBeNull();
  });
});
