/**
 * Platform and operating system detection and shortcut formatting.
 */

let platformOverride: boolean | null = null;

/**
 * Override OS detection for testing.
 * Pass true for macOS, false for Windows/Linux, or null to clear override.
 */
export function setPlatformOverride(val: boolean | null): void {
  platformOverride = val;
}

/**
 * Returns true if the client OS is macOS or iOS.
 */
export function isMac(): boolean {
  if (platformOverride !== null) {
    return platformOverride;
  }
  if (typeof navigator === 'undefined') {
    return true; // Default fallback for SSR or non-browser environments
  }
  const nav = navigator as any;
  const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent || '';
  return /Mac|iPhone|iPod|iPad|Darwin/i.test(platform);
}

export interface PlatformShortcuts {
  isMac: boolean;
  cmdSymbol: string;
  shiftSymbol: string;
  altSymbol: string;
  open: string;
  save: string;
  saveAs: string;
  undo: string;
  redo: string;
  copy: string;
  paste: string;
  clear: string;
  invert: string;
  toggleTools: string;
  toggleProperties: string;
}

/**
 * Returns the localized shortcut strings according to the operating system.
 */
export function getShortcuts(mac = isMac()): PlatformShortcuts {
  if (mac) {
    return {
      isMac: true,
      cmdSymbol: '⌘',
      shiftSymbol: '⇧',
      altSymbol: '⌥',
      open: '⌘O',
      save: '⌘S',
      saveAs: '⇧⌘S',
      undo: '⌘Z',
      redo: '⇧⌘Z',
      copy: '⌘C',
      paste: '⌘V',
      clear: '⌘K',
      invert: '⌘I',
      toggleTools: '⌥1',
      toggleProperties: '⌥2',
    };
  } else {
    return {
      isMac: false,
      cmdSymbol: 'Ctrl+',
      shiftSymbol: 'Shift+',
      altSymbol: 'Alt+',
      open: 'Ctrl+O',
      save: 'Ctrl+S',
      saveAs: 'Ctrl+Shift+S',
      undo: 'Ctrl+Z',
      redo: 'Ctrl+Y',
      copy: 'Ctrl+C',
      paste: 'Ctrl+V',
      clear: 'Ctrl+K',
      invert: 'Ctrl+I',
      toggleTools: 'Alt+1',
      toggleProperties: 'Alt+2',
    };
  }
}
