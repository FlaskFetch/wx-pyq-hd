import { describe, it, expect } from 'vitest';
import { computeContainRect } from '../../src/utils/fit';

describe('[computeContainRect()](src/utils/fit.ts:6)', () => {
  it('centers and scales when src smaller than dest', () => {
    const r = computeContainRect(1000, 500, 2000, 1000);
    expect(r).toEqual({ x: 500, y: 250, w: 1000, h: 500 });
  });

  it('scales down proportionally when src larger than dest', () => {
    const r = computeContainRect(4000, 2000, 2000, 1000);
    expect(r).toEqual({ x: 0, y: 0, w: 2000, h: 1000 });
  });

  it('portrait target contain', () => {
    const r = computeContainRect(3000, 1000, 2200, 4400);
    // scale = min(2200/3000=0.7333, 4400/1000=4.4) = 0.7333
    expect(r.w).toBeCloseTo(2200, 0);
    expect(r.h).toBeCloseTo(Math.round(1000 * 0.7333), -1);
    expect(r.x).toBe(0);
    expect(r.y).toBeCloseTo((4400 - r.h) / 2, 0);
  });

  it('invalid inputs return zeros', () => {
    const r = computeContainRect(0, 100, 200, 200);
    expect(r).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });
});