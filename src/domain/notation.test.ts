import { describe, expect, it } from 'vitest';
import { DEFAULT_NOTATION_FORMAT, formatThrow, isNotationFormat } from './notation';

const T20 = { label: 'T20', score: 60 };

describe('formatThrow', () => {
  it('同じT20データを3形式へ正しく整形する', () => {
    expect(formatThrow(T20, 'name-score')).toBe('T20：60');
    expect(formatThrow(T20, 'name')).toBe('T20');
    expect(formatThrow(T20, 'score')).toBe('60');
  });

  it('D16 / S5 / BULL / OUTER BULL / MISS も整形できる', () => {
    expect(formatThrow({ label: 'D16', score: 32 }, 'name-score')).toBe('D16：32');
    expect(formatThrow({ label: 'S5', score: 5 }, 'name-score')).toBe('S5：5');
    expect(formatThrow({ label: 'BULL', score: 50 }, 'name-score')).toBe('BULL：50');
    expect(formatThrow({ label: 'OUTER BULL', score: 25 }, 'name')).toBe('OUTER BULL');
    expect(formatThrow({ label: 'MISS', score: 0 }, 'score')).toBe('0');
  });
});

describe('isNotationFormat', () => {
  it('許可された値だけを受け入れる', () => {
    expect(isNotationFormat('name-score')).toBe(true);
    expect(isNotationFormat('name')).toBe(true);
    expect(isNotationFormat('score')).toBe(true);
  });

  it('想定外の値を拒否する', () => {
    expect(isNotationFormat('formatA')).toBe(false);
    expect(isNotationFormat('')).toBe(false);
    expect(isNotationFormat(null)).toBe(false);
    expect(isNotationFormat(123)).toBe(false);
    expect(isNotationFormat({ format: 'name' })).toBe(false);
  });

  it('既定値は形式A（セグメント名＋得点）', () => {
    expect(DEFAULT_NOTATION_FORMAT).toBe('name-score');
  });
});
