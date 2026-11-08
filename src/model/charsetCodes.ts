/**
 * Utility functions for mapping Commodore 64 character set codes
 * across C64 Screen Codes, PETSCII, and ASCII encodings.
 *
 * In FatPixel and Commodore 64 character sets, characters are indexed
 * in standard PETSCII order (0..255):
 * - 0..31: PETSCII Control codes (Screen Codes 128..159, no ASCII)
 * - 32..63: Space, punctuation, digits 0..9 (Screen Codes 32..63, ASCII 32..63)
 * - 64: '@' (Screen Code 0, ASCII 64 / 0x40)
 * - 65..90: 'A'..'Z' (Screen Codes 1..26, ASCII 65..90 / 0x41..0x5A)
 * - 91..95: '[', '£', ']', '↑', '←' (Screen Codes 27..31; ASCII 91, 93, 94, 95)
 * - 96..127: C64 semigraphics (Screen Codes 64..95, no ASCII)
 * - 128..159: PETSCII Control / color codes (Screen Codes 192..223, no ASCII)
 * - 160..191: Shifted space & C64 graphics (Screen Codes 96..127, no ASCII)
 * - 192..254: Shifted graphics / characters (Screen Codes 64..126, no ASCII)
 * - 255: Pi (π) (Screen Code 94, no ASCII)
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

export function getCharsetCodeInfo(charIndex: number): CharsetCodeInfo {
  const p = Math.max(0, Math.min(255, Math.floor(charIndex)));
  const petsciiDec = p;
  const petscii = p.toString();

  // Convert PETSCII code to C64 Screen Code using standard KERNAL rules
  let sc: number;
  if (p <= 31) {
    sc = p + 128; // 0..31 -> 128..159
  } else if (p <= 63) {
    sc = p; // 32..63 -> 32..63 (space, punctuation, digits)
  } else if (p <= 95) {
    sc = p - 64; // 64..95 -> 0..31 (@, A..Z, [, £, ], ↑, ←)
  } else if (p <= 127) {
    sc = p - 32; // 96..127 -> 64..95 (semigraphics)
  } else if (p <= 159) {
    sc = p + 64; // 128..159 -> 192..223 (control/color codes)
  } else if (p <= 191) {
    sc = p - 64; // 160..191 -> 96..127 (shifted space & graphics)
  } else if (p <= 254) {
    sc = p - 128; // 192..254 -> 64..126 (shifted graphics)
  } else {
    sc = 94; // 255 -> Pi symbol (Screen Code 94)
  }

  const screenCodeDec = sc;
  const screenCode = sc.toString();

  // Convert PETSCII code to ASCII code (decimal and hex) when valid
  let asciiDec: number | null = null;
  let asciiHex: string | null = null;
  if (p >= 32 && p <= 91) {
    asciiDec = p; // 32..91 (' '..'Z', '[')
  } else if (p === 93 || p === 94 || p === 95) {
    asciiDec = p; // ']', '^' / '↑', '_' / '←'
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
