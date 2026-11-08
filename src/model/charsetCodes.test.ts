import { describe, it, expect } from 'vitest';
import { getCharsetCodeInfo } from './charsetCodes';

describe('charsetCodes mapping', () => {
  it('maps Char 0 (Control-@) correctly', () => {
    const info = getCharsetCodeInfo(0);
    expect(info.screenCode).toBe('128');
    expect(info.petscii).toBe('0');
    expect(info.ascii).toBe('—');
    expect(info.asciiDec).toBeNull();
  });

  it('maps Char 32 (Space) correctly', () => {
    const info = getCharsetCodeInfo(32);
    expect(info.screenCode).toBe('32');
    expect(info.petscii).toBe('32');
    expect(info.ascii).toBe('32 (0x20)');
    expect(info.asciiDec).toBe(32);
    expect(info.asciiHex).toBe('0x20');
  });

  it('maps Char 48 (0) through 57 (9) correctly', () => {
    const info0 = getCharsetCodeInfo(48);
    expect(info0.screenCode).toBe('48');
    expect(info0.petscii).toBe('48');
    expect(info0.ascii).toBe('48 (0x30)');

    const info9 = getCharsetCodeInfo(57);
    expect(info9.screenCode).toBe('57');
    expect(info9.petscii).toBe('57');
    expect(info9.ascii).toBe('57 (0x39)');
  });

  it('maps Char 64 (@) correctly', () => {
    const info = getCharsetCodeInfo(64);
    expect(info.screenCode).toBe('0');
    expect(info.petscii).toBe('64');
    expect(info.ascii).toBe('64 (0x40)');
    expect(info.asciiDec).toBe(64);
    expect(info.asciiHex).toBe('0x40');
  });

  it('maps Char 65 (A) through 90 (Z) correctly', () => {
    const infoA = getCharsetCodeInfo(65);
    expect(infoA.screenCode).toBe('1');
    expect(infoA.petscii).toBe('65');
    expect(infoA.ascii).toBe('65 (0x41)');
    expect(infoA.asciiDec).toBe(65);
    expect(infoA.asciiHex).toBe('0x41');

    const infoZ = getCharsetCodeInfo(90);
    expect(infoZ.screenCode).toBe('26');
    expect(infoZ.petscii).toBe('90');
    expect(infoZ.ascii).toBe('90 (0x5A)');
    expect(infoZ.asciiDec).toBe(90);
    expect(infoZ.asciiHex).toBe('0x5A');
  });

  it('maps Char 91 ([), 92 (£), 93 (]), 94 (↑), 95 (←) correctly', () => {
    const info91 = getCharsetCodeInfo(91);
    expect(info91.screenCode).toBe('27');
    expect(info91.petscii).toBe('91');
    expect(info91.ascii).toBe('91 (0x5B)');

    const info92 = getCharsetCodeInfo(92);
    expect(info92.screenCode).toBe('28');
    expect(info92.petscii).toBe('92');
    expect(info92.ascii).toBe('—');

    const info93 = getCharsetCodeInfo(93);
    expect(info93.screenCode).toBe('29');
    expect(info93.petscii).toBe('93');
    expect(info93.ascii).toBe('93 (0x5D)');

    const info94 = getCharsetCodeInfo(94);
    expect(info94.screenCode).toBe('30');
    expect(info94.petscii).toBe('94');
    expect(info94.ascii).toBe('94 (0x5E)');

    const info95 = getCharsetCodeInfo(95);
    expect(info95.screenCode).toBe('31');
    expect(info95.petscii).toBe('95');
    expect(info95.ascii).toBe('95 (0x5F)');
  });

  it('maps Char 96 (horizontal bar) with no ASCII', () => {
    const info = getCharsetCodeInfo(96);
    expect(info.screenCode).toBe('64');
    expect(info.petscii).toBe('96');
    expect(info.ascii).toBe('—');
    expect(info.asciiDec).toBeNull();
  });

  it('maps Char 160 (shifted space) to Screen Code 96', () => {
    const info = getCharsetCodeInfo(160);
    expect(info.screenCode).toBe('96');
    expect(info.petscii).toBe('160');
    expect(info.ascii).toBe('—');
  });

  it('maps Char 193 (Shift-A) to Screen Code 65', () => {
    const info = getCharsetCodeInfo(193);
    expect(info.screenCode).toBe('65');
    expect(info.petscii).toBe('193');
    expect(info.ascii).toBe('—');
  });

  it('maps Char 255 (Pi) to Screen Code 94 with no ASCII', () => {
    const info = getCharsetCodeInfo(255);
    expect(info.screenCode).toBe('94');
    expect(info.petscii).toBe('255');
    expect(info.ascii).toBe('—');
  });
});
