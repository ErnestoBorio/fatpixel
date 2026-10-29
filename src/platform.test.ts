import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isMac, getShortcuts, setPlatformOverride } from './platform';

describe('platform detection and shortcuts', () => {
  beforeEach(() => {
    setPlatformOverride(null);
  });

  afterEach(() => {
    setPlatformOverride(null);
  });

  it('detects macOS on current test environment (Darwin)', () => {
    // Current machine is Mac Darwin
    expect(isMac()).toBe(true);
  });

  it('generates macOS shortcuts with Command (⌘) and Option (⌥)', () => {
    setPlatformOverride(true);
    const shortcuts = getShortcuts();
    expect(shortcuts.isMac).toBe(true);
    expect(shortcuts.open).toBe('⌘O');
    expect(shortcuts.save).toBe('⌘S');
    expect(shortcuts.saveAs).toBe('⇧⌘S');
    expect(shortcuts.undo).toBe('⌘Z');
    expect(shortcuts.redo).toBe('⇧⌘Z');
    expect(shortcuts.copy).toBe('⌘C');
    expect(shortcuts.paste).toBe('⌘V');
    expect(shortcuts.clear).toBe('⌘K');
    expect(shortcuts.invert).toBe('⌘I');
    expect(shortcuts.toggleTools).toBe('⌥1');
    expect(shortcuts.toggleProperties).toBe('⌥2');
  });

  it('generates Windows / Linux shortcuts with Control (Ctrl+) and Alt (Alt+)', () => {
    setPlatformOverride(false);
    const shortcuts = getShortcuts();
    expect(shortcuts.isMac).toBe(false);
    expect(shortcuts.open).toBe('Ctrl+O');
    expect(shortcuts.save).toBe('Ctrl+S');
    expect(shortcuts.saveAs).toBe('Ctrl+Shift+S');
    expect(shortcuts.undo).toBe('Ctrl+Z');
    expect(shortcuts.redo).toBe('Ctrl+Y');
    expect(shortcuts.copy).toBe('Ctrl+C');
    expect(shortcuts.paste).toBe('Ctrl+V');
    expect(shortcuts.clear).toBe('Ctrl+K');
    expect(shortcuts.invert).toBe('Ctrl+I');
    expect(shortcuts.toggleTools).toBe('Alt+1');
    expect(shortcuts.toggleProperties).toBe('Alt+2');
  });
});
