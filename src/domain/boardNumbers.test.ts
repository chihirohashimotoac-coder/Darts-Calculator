import { describe, expect, it } from 'vitest';
import { BOARD_NUMBERS, SEGMENT_ANGLE, angleRangeOf, centerAngleOf } from './boardNumbers';

describe('BOARD_NUMBERS', () => {
  it('盤面上部を20とした標準配置（時計回り）である', () => {
    expect([...BOARD_NUMBERS]).toEqual([
      20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
    ]);
  });

  it('1〜20が重複なく1回ずつ含まれる', () => {
    expect([...BOARD_NUMBERS].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
  });

  it('1セグメントは18度である', () => {
    expect(SEGMENT_ANGLE).toBe(18);
  });

  it('先頭（20）は真上に配置される', () => {
    expect(centerAngleOf(0)).toBe(-90);
    expect(angleRangeOf(0)).toEqual({ start: -99, end: -81 });
  });

  it('インデックスが増えるほど時計回りに進む', () => {
    expect(centerAngleOf(1)).toBe(-72);
    expect(centerAngleOf(5)).toBe(0);
  });
});
