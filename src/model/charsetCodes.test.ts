import { describe, it, expect } from 'vitest';
import { getCharsetCodeInfo } from './charsetCodes';

describe('charsetCodes mapping', () => {
  it('maps Screen Code 0 (@) correctly', () => {
    const info = getCharsetCodeInfo(0);
    expect(info.screenCode).toBe('0');
    expect(info.petscii).toBe('64');
    expect(info.ascii).toBe('64 (0x40)');
    expect(info.asciiDec).toBe(64);
    expect(info.asciiHex).toBe('0x40');
  });

  it('maps Screen Code 1 (A) correctly', () => {
    const info = getCharsetCodeInfo(1);
    expect(info.screenCode).toBe('1');
    expect(info.petscii).toBe('65');
    expect(info.ascii).toBe('65 (0x41)');
    expect(info.asciiDec).toBe(65);
    expect(info.asciiHex).toBe('0x41');
  });

  it('maps Screen Code 26 (Z) correctly', () => {
    const info = getCharsetCodeInfo(26);
    expect(info.screenCode).toBe('26');
    expect(info.petscii).toBe('90');
    expect(info.ascii).toBe('90 (0x5A)');
    expect(info.asciiDec).toBe(90);
    expect(info.asciiHex).toBe('0x5A');
  });

  it('maps Screen Code 27 ([) correctly', () => {
    const info = getCharsetCodeInfo(27);
    expect(info.screenCode).toBe('27');
    expect(info.petscii).toBe('91');
    expect(info.ascii).toBe('91 (0x5B)');
  });

  it('maps Screen Code 32 (Space) correctly', () => {
    const info = getCharsetCodeInfo(32);
    expect(info.screenCode).toBe('32');
    expect(info.petscii).toBe('32');
    expect(info.ascii).toBe('32 (0x20)');
  });

  it('maps Screen Code 48 (0) through 57 (9) correctly', () => {
    const info0 = getCharsetCodeInfo(48);
    expect(info0.screenCode).toBe('48');
    expect(info0.petscii).toBe('48');
    expect(info0.ascii).toBe('48 (0x30)');

    const info9 = getCharsetCodeInfo(57);
    expect(info9.screenCode).toBe('57');
    expect(info9.petscii).toBe('57');
    expect(info9.ascii).toBe('57 (0x39)');
  });

  it('maps Screen Code 64 (horizontal line) with no ASCII', () => {
    const info = getCharsetCodeInfo(64);
    expect(info.screenCode).toBe('64');
    expect(info.petscii).toBe('96');
    expect(info.ascii).toBe('—');
    expect(info.asciiDec).toBeNull();
  });

  it('maps Screen Code 94 (Pi) to PETSCII 255', () => {
    const info = getCharsetCodeInfo(94);
    expect(info.screenCode).toBe('94');
    expect(info.petscii).toBe('255');
    expect(info.ascii).toBe('—');
  });

  it('maps reverse video characters (128..255) to their base character codes', () => {
    // Reverse @ (128)
    const revAt = getCharsetCodeInfo(128);
    expect(revAt.screenCode).toBe('128');
    expect(revAt.petscii).toBe('64');
    expect(revAt.ascii).toBe('64 (0x40)');

    // Reverse A (129)
    const revA = getCharsetCodeInfo(129);
    expect(revA.screenCode).toBe('129');
    expect(revA.petscii).toBe('65');
    expect(revA.ascii).toBe('65 (0x41)');

    // Reverse Space (160)
    const revSpace = getCharsetCodeInfo(160);
    expect(revSpace.screenCode).toBe('160');
    expect(revSpace.petscii).toBe('32');
    expect(revSpace.ascii).toBe('32 (0x20)');
  });
});
