import { describe, it, expect } from 'vitest';
import { isValidHex, ensureHex6 } from '../../src/utils/color';

describe('[isValidHex()](src/utils/color.ts:4) and [ensureHex6()](src/utils/color.ts:13)', () => {
  it('validates hex strings (#RGB and #RRGGBB, case-insensitive, optional #)', () => {
    const valid = ['#000', '#abc', '#ABC', '#a1b2c3', '#A1B2C3', '000', 'ABC', 'a1b2c3'];
    for (const s of valid) {
      expect(isValidHex(s)).toBe(true);
    }
  });

  it('rejects invalid hex strings', () => {
    const invalid = ['', ' ', '#', '##000', '#12', '#12345', '#1234567', 'ggg', '#zzzzzz', '#abcd', '12345g'];
    for (const s of invalid) {
      expect(isValidHex(s)).toBe(false);
    }
  });

  it('normalizes to #rrggbb lowercase and expands #rgb', () => {
    expect(ensureHex6('#000')).toBe('#000000');
    expect(ensureHex6('#fff')).toBe('#ffffff');
    expect(ensureHex6('#AbC')).toBe('#aabbcc');
    expect(ensureHex6('ABC')).toBe('#aabbcc');
    expect(ensureHex6('#123456')).toBe('#123456');
    expect(ensureHex6('123456')).toBe('#123456');
  });

  it('falls back to #000000 for invalid input', () => {
    expect(ensureHex6('')).toBe('#000000');
    expect(ensureHex6('#xyz')).toBe('#000000');
    expect(ensureHex6('#12345')).toBe('#000000');
  });
});