/**
 * Utility functions for Commodore 64 / FatPixel character set code information.
 *
 * In FatPixel, the character index (0..255) represents ASCII encoding:
 * - ASCII: character index in the charset (0..255) shown in decimal and hex ($XX),
 *   with the printable text character for standard printable ASCII (32..126).
 */

export interface CharsetCodeInfo {
  ascii: string;
  asciiDec: number;
  asciiHex: string;
  asciiChar: string | null;
}

export function getCharsetCodeInfo(charIndex: number): CharsetCodeInfo {
  const normalized = Number.isFinite(charIndex)
    ? Math.max(0, Math.min(255, Math.floor(charIndex)))
    : 0;

  const asciiDec = normalized;
  const asciiHex = '$' + asciiDec.toString(16).toUpperCase().padStart(2, '0');

  // Printable ASCII character (32..126) or recognizable extended characters
  let asciiChar: string | null = null;
  let ascii: string;

  if (asciiDec >= 32 && asciiDec <= 126) {
    asciiChar = String.fromCharCode(asciiDec);
    const charDisplay = asciiChar === "'" ? `"'"` : `'${asciiChar}'`;
    ascii = `${asciiDec} (${asciiHex}) ${charDisplay}`;
  } else if (asciiDec === 156 || asciiDec === 163) {
    asciiChar = '£';
    ascii = `${asciiDec} (${asciiHex}) '£'`;
  } else if (asciiDec === 227) {
    asciiChar = 'π';
    ascii = `${asciiDec} (${asciiHex}) 'π'`;
  } else {
    ascii = `${asciiDec} (${asciiHex})`;
  }

  return {
    ascii,
    asciiDec,
    asciiHex,
    asciiChar,
  };
}
