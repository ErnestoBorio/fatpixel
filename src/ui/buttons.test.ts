// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount, flushSync } from 'svelte';
import App from '../App.svelte';

describe('App Graphic actions and mode switching', () => {
  it('toggles mode, updates buttons, status bar, and slot states', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);

    mount(App, { target });
    flushSync();

    const buttons = target.querySelectorAll<HTMLButtonElement>('.toggle-btn');
    const hiresBtn = Array.from(buttons).find((b) => b.textContent?.includes('Hi-Res'));
    const multiBtn = Array.from(buttons).find((b) => b.textContent?.includes('Multi'));

    expect(hiresBtn).toBeDefined();
    expect(multiBtn).toBeDefined();

    const statusDim = target.querySelector<HTMLElement>('.status-bar .dim-text');
    expect(statusDim?.textContent).toContain('1 bpp (Hi-Res)');

    // Initially in Hi-Res mode
    expect(hiresBtn?.classList.contains('active')).toBe(true);
    expect(multiBtn?.classList.contains('active')).toBe(false);

    // Click Multi (2bpp)
    multiBtn?.click();
    flushSync();

    // Now in Multi mode
    expect(multiBtn?.classList.contains('active')).toBe(true);
    expect(hiresBtn?.classList.contains('active')).toBe(false);
    expect(statusDim?.textContent).toContain('2 bpp (Wide)');

    // Click Hi-Res (1bpp)
    hiresBtn?.click();
    flushSync();

    // Back to Hi-Res mode
    expect(hiresBtn?.classList.contains('active')).toBe(true);
    expect(multiBtn?.classList.contains('active')).toBe(false);
    expect(statusDim?.textContent).toContain('1 bpp (Hi-Res)');
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

    expect(wInput.value).toBe('24');
    expect(hInput.value).toBe('21');

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
    const spriteHeight = propsSection?.clientHeight ?? 0;

    // Select charset
    selectCharsetBtn?.click();
    flushSync();
    expect(propsSection?.querySelector('.readonly-badge')).not.toBeNull();
    const charsetHeight = propsSection?.clientHeight ?? 0;

    // Both should maintain the exact same height
    expect(spriteHeight).toBe(charsetHeight);

    // Active charset status bar should show 8x8 dimensions
    const statusDim = target.querySelector<HTMLElement>('.status-bar .dim-text');
    expect(statusDim?.textContent).toContain('8 × 8 (Hi-Res Charset)');

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
    expect(dropdown?.textContent).toContain('New Project');

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
});
