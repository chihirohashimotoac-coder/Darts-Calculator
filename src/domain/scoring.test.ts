import { describe, expect, it } from 'vitest';
import { calculateScore, multiplierOf } from './scoring';
import { getSegmentById, SEGMENTS } from './segments';

/** ID からセグメントを取り出し、必ず存在することを保証するヘルパー。 */
function segment(id: string) {
  const found = getSegmentById(id);
  expect(found, `segment ${id} should exist`).toBeDefined();
  return found!;
}

describe('calculateScore', () => {
  it('シングルは表示数字 × 1 になる', () => {
    expect(calculateScore({ kind: 'single', baseNumber: 20, bullType: null })).toBe(20);
    expect(calculateScore({ kind: 'single', baseNumber: 1, bullType: null })).toBe(1);
  });

  it('ダブルは表示数字 × 2 になる', () => {
    expect(calculateScore({ kind: 'double', baseNumber: 20, bullType: null })).toBe(40);
    expect(calculateScore({ kind: 'double', baseNumber: 1, bullType: null })).toBe(2);
  });

  it('トリプルは表示数字 × 3 になる', () => {
    expect(calculateScore({ kind: 'triple', baseNumber: 20, bullType: null })).toBe(60);
    expect(calculateScore({ kind: 'triple', baseNumber: 1, bullType: null })).toBe(3);
  });

  it('アウターブルは25点、インナーブルは50点になる', () => {
    expect(calculateScore({ kind: 'bull', baseNumber: null, bullType: 'outer' })).toBe(25);
    expect(calculateScore({ kind: 'bull', baseNumber: null, bullType: 'inner' })).toBe(50);
  });

  it('MISSは0点になる', () => {
    expect(calculateScore({ kind: 'miss', baseNumber: null, bullType: null })).toBe(0);
  });

  it('倍率が種別ごとに正しい', () => {
    expect(multiplierOf('single')).toBe(1);
    expect(multiplierOf('double')).toBe(2);
    expect(multiplierOf('triple')).toBe(3);
    expect(multiplierOf('bull')).toBe(1);
    expect(multiplierOf('miss')).toBe(0);
  });

  it('数字が必要な種別で baseNumber が無い場合は例外になる', () => {
    expect(() => calculateScore({ kind: 'single', baseNumber: null, bullType: null })).toThrow();
  });
});

describe('セグメント定義', () => {
  it('S20は20点、T20は60点、D20は40点', () => {
    expect(segment('segment-s20-inner').score).toBe(20);
    expect(segment('segment-s20-outer').score).toBe(20);
    expect(segment('segment-t20').score).toBe(60);
    expect(segment('segment-d20').score).toBe(40);
  });

  it('S1は1点、T1は3点、D1は2点', () => {
    expect(segment('segment-s1-inner').score).toBe(1);
    expect(segment('segment-s1-outer').score).toBe(1);
    expect(segment('segment-t1').score).toBe(3);
    expect(segment('segment-d1').score).toBe(2);
  });

  it('BULLとMISSの得点が正しい', () => {
    expect(segment('segment-outer-bull').score).toBe(25);
    expect(segment('segment-inner-bull').score).toBe(50);
    expect(segment('segment-miss').score).toBe(0);
  });

  it('インナーシングルとアウターシングルは同じシングル得点として扱う', () => {
    const inner = segment('segment-s13-inner');
    const outer = segment('segment-s13-outer');
    expect(inner.kind).toBe('single');
    expect(outer.kind).toBe('single');
    expect(inner.score).toBe(outer.score);
    expect(inner.ring).not.toBe(outer.ring);
  });

  it('83領域（インナー/トリプル/アウター/ダブル×20 + ブル2 + MISS）が定義されている', () => {
    expect(SEGMENTS).toHaveLength(83);
    const countByRing = SEGMENTS.reduce<Record<string, number>>((acc, item) => {
      acc[item.ring] = (acc[item.ring] ?? 0) + 1;
      return acc;
    }, {});
    expect(countByRing).toEqual({
      'inner-single': 20,
      triple: 20,
      'outer-single': 20,
      double: 20,
      'outer-bull': 1,
      'inner-bull': 1,
      miss: 1,
    });
  });

  it('セグメントIDが一意である', () => {
    const ids = new Set(SEGMENTS.map((item) => item.id));
    expect(ids.size).toBe(SEGMENTS.length);
  });

  it('スクリーンリーダー向けの名前が設定されている', () => {
    expect(segment('segment-t20').ariaLabel).toContain('Triple 20, 60 points');
    expect(segment('segment-d16').ariaLabel).toContain('Double 16, 32 points');
    expect(segment('segment-s5-inner').ariaLabel).toContain('Single 5, 5 points');
    expect(segment('segment-inner-bull').ariaLabel).toContain('Inner bull, 50 points');
    expect(segment('segment-outer-bull').ariaLabel).toContain('Outer bull, 25 points');
    expect(segment('segment-miss').ariaLabel).toContain('Miss, 0 points');
  });
});
