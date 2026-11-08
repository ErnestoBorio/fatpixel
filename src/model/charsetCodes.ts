/**
 * Utility functions for mapping Commodore 64 character set codes
 * across C64 Screen Codes, PETSCII, and ASCII encodings.
 */

export interface CharsetCodeInfo {
  ascii: string;
  asciiDec: number | null;
  asciiHex: string | null;
  petscii: string;
  petsciiDec: number;
  screenCode: string;
  screenCodeDec: number;
}

/**
 * Returns encoding representations for a given C64 screen code (0..255).
 *
 * In Commodore 64 charsets (stored in sequential ROM order), character index
 * 0..255 corresponds to C64 Screen Code 0..255:
 * - Screen Code 0: '@' (PETSCII 64, ASCII 64 / 0x40)
 * - Screen Codes 1..26: 'A'..'Z' (PETSCII 65..90, ASCII 65..90 / 0x41..0x5A)
 * - Screen Codes 27..31: '[', '£'/'\', ']', '↑'/'^', '←'/'_' (PETSCII 91..95, ASCII 91..95 / 0x5B..0x5F)
 * - Screen Codes 32..63: Space, punctuation, digits 0..9 (PETSCII 32..63, ASCII 32..63 / 0x20..0x3F)
 * - Screen Codes 64..127: C64 semigraphics (PETSCII 96..127 and 160..191; no standard ASCII)
 * - Screen Codes 128..255: Reverse-video variants of 0..127
 */
export function getCharsetCodeInfo(sc: number): CharsetCodeInfo {
  const safeSc = Math.max(0, Math.min(255, Math.floor(sc)));
  const screenCodeDec = safeSc;
  const screenCode = safeSc.toString();
  const base = safeSc & 0x7f; // 0..127 (base glyph ignoring reverse video)

  // 1. PETSCII code decimal
  let petsciiDec: number;
  if (base === 0) {
    petsciiDec = 64;
  } else if (base >= 1 && base <= 31) {
    petsciiDec = base + 64; // 65..95
  } else if (base >= 32 && base <= 63) {
    petsciiDec = base; // 32..63
  } else if (base >= 64 && base <= 93) {
    petsciiDec = base + 32; // 96..125
  } else if (base === 94) {
    petsciiDec = 255; // Pi (π) in Commodore BASIC CHR$(255)
  } else if (base === 95) {
    petsciiDec = 127;
  } else {
    // 96..127
    petsciiDec = base + 64; // 160..191
  }
  const petscii = petsciiDec.toString();

  // 2. ASCII code decimal and hexadecimal
  let asciiDec: number | null = null;
  let asciiHex: string | null = null;
  if (base === 0) {
    asciiDec = 64;
  } else if (base >= 1 && base <= 31) {
    asciiDec = base + 64; // 65..95 ('A'..'Z', '[', '\', ']', '^', '_')
  } else if (base >= 32 && base <= 63) {
    asciiDec = base; // 32..63 (' '..'?')
  }

  let ascii: string;
  if (asciiDec !== null) {
    asciiHex = '0x' + asciiDec.toString(16).toUpperCase().padStart(2, '0');
    ascii = `${asciiDec} (${asciiHex})`;
  } else {
    ascii = '—';
  }

  return {
    ascii,
    asciiDec,
    asciiHex,
    petscii,
    petsciiDec,
    screenCode,
    screenCodeDec,
  };
}
