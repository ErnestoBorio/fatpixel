import { describe, it, expect } from 'vitest';
import { getCharsetCodeInfo } from './charsetCodes';

describe('charsetCodes mapping (ASCII only)', () => {
  it('maps Char 0 (ASCII NUL) with decimal and hex', () => {
    const info = getCharsetCodeInfo(0);
    expect(info.ascii).toBe('0 ($00)');
    expect(info.asciiDec).toBe(0);
    expect(info.asciiHex).toBe('$00');
    expect(info.asciiChar).toBeNull();
  });

  it('maps printable ASCII Space (32) with character representation', () => {
    const info = getCharsetCodeInfo(32);
    expect(info.ascii).toBe("32 ($20) ' '");
    expect(info.asciiDec).toBe(32);
    expect(info.asciiHex).toBe('$20');
    expect(info.asciiChar).toBe(' ');
  });

  it('escapes single quote (ASCII 39) with double quotes in display string', () => {
    const info = getCharsetCodeInfo(39);
    expect(info.ascii).toBe('39 ($27) "\'"');
    expect(info.asciiDec).toBe(39);
    expect(info.asciiHex).toBe('$27');
    expect(info.asciiChar).toBe("'");
  });

  it('maps printable ASCII digits 0 (48) through 9 (57)', () => {
    const info0 = getCharsetCodeInfo(48);
    expect(info0.ascii).toBe("48 ($30) '0'");
    expect(info0.asciiDec).toBe(48);
    expect(info0.asciiHex).toBe('$30');
    expect(info0.asciiChar).toBe('0');

    const info9 = getCharsetCodeInfo(57);
    expect(info9.ascii).toBe("57 ($39) '9'");
    expect(info9.asciiDec).toBe(57);
    expect(info9.asciiHex).toBe('$39');
    expect(info9.asciiChar).toBe('9');
  });

  it('maps ASCII 64 (@)', () => {
    const info = getCharsetCodeInfo(64);
    expect(info.ascii).toBe("64 ($40) '@'");
    expect(info.asciiDec).toBe(64);
    expect(info.asciiHex).toBe('$40');
    expect(info.asciiChar).toBe('@');
  });

  it('maps uppercase letters A..Z (ASCII 65..90)', () => {
    const infoA = getCharsetCodeInfo(65);
    expect(infoA.ascii).toBe("65 ($41) 'A'");
    expect(infoA.asciiDec).toBe(65);
    expect(infoA.asciiHex).toBe('$41');
    expect(infoA.asciiChar).toBe('A');

    const infoZ = getCharsetCodeInfo(90);
    expect(infoZ.ascii).toBe("90 ($5A) 'Z'");
    expect(infoZ.asciiDec).toBe(90);
    expect(infoZ.asciiHex).toBe('$5A');
    expect(infoZ.asciiChar).toBe('Z');
  });

  it('maps punctuation and symbols [ (91), ] (93), ^ (94), _ (95)', () => {
    const info91 = getCharsetCodeInfo(91);
    expect(info91.ascii).toBe("91 ($5B) '['");

    const info93 = getCharsetCodeInfo(93);
    expect(info93.ascii).toBe("93 ($5D) ']'");

    const info94 = getCharsetCodeInfo(94);
    expect(info94.ascii).toBe("94 ($5E) '^'");

    const info95 = getCharsetCodeInfo(95);
    expect(info95.ascii).toBe("95 ($5F) '_'");
  });

  it('maps lowercase letters a..z (ASCII 97..122)', () => {
    const infoA = getCharsetCodeInfo(97);
    expect(infoA.ascii).toBe("97 ($61) 'a'");
    expect(infoA.asciiDec).toBe(97);
    expect(infoA.asciiHex).toBe('$61');
    expect(infoA.asciiChar).toBe('a');

    const infoZ = getCharsetCodeInfo(122);
    expect(infoZ.ascii).toBe("122 ($7A) 'z'");
    expect(infoZ.asciiDec).toBe(122);
    expect(infoZ.asciiHex).toBe('$7A');
    expect(infoZ.asciiChar).toBe('z');
  });

  it('maps braces and tilde (ASCII 123..126)', () => {
    const info123 = getCharsetCodeInfo(123);
    expect(info123.ascii).toBe("123 ($7B) '{'");

    const info126 = getCharsetCodeInfo(126);
    expect(info126.ascii).toBe("126 ($7E) '~'");
  });

  it('maps extended Pound sterling £ (ASCII 156 / 163) and Pi π (ASCII 227)', () => {
    const infoPound163 = getCharsetCodeInfo(163);
    expect(infoPound163.ascii).toBe("163 ($A3) '£'");
    expect(infoPound163.asciiChar).toBe('£');

    const infoPound156 = getCharsetCodeInfo(156);
    expect(infoPound156.ascii).toBe("156 ($9C) '£'");
    expect(infoPound156.asciiChar).toBe('£');

    const infoPi = getCharsetCodeInfo(227);
    expect(infoPi.ascii).toBe("227 ($E3) 'π'");
    expect(infoPi.asciiChar).toBe('π');
  });

  it('handles extended character slots without printable glyph', () => {
    const info128 = getCharsetCodeInfo(128);
    expect(info128.ascii).toBe('128 ($80)');
    expect(info128.asciiChar).toBeNull();

    const info255 = getCharsetCodeInfo(255);
    expect(info255.ascii).toBe('255 ($FF)');
    expect(info255.asciiChar).toBeNull();
  });

  it('clamps and normalizes invalid or out-of-range character indices', () => {
    const neg = getCharsetCodeInfo(-10);
    expect(neg.asciiDec).toBe(0);
    expect(neg.ascii).toBe('0 ($00)');

    const overflow = getCharsetCodeInfo(300);
    expect(overflow.asciiDec).toBe(255);
    expect(overflow.ascii).toBe('255 ($FF)');

    const nanInfo = getCharsetCodeInfo(NaN);
    expect(nanInfo.asciiDec).toBe(0);
  });
});
