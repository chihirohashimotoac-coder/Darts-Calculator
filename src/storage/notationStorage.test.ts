import { beforeEach, describe, expect, it } from 'vitest';
import {
  NOTATION_STORAGE_KEY,
  loadNotationFormat,
  saveNotationFormat,
} from './notationStorage';

describe('notationStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('保存値が無い場合は形式A（name-score）を返す', () => {
    expect(loadNotationFormat()).toBe('name-score');
  });

  it('保存した表記形式を読み込める', () => {
    saveNotationFormat('score');
    expect(window.localStorage.getItem(NOTATION_STORAGE_KEY)).toBe('score');
    expect(loadNotationFormat()).toBe('score');
  });

  it('想定外の文字列はそのまま使わず既定値へフォールバックする', () => {
    window.localStorage.setItem(NOTATION_STORAGE_KEY, 'formatB');
    expect(loadNotationFormat()).toBe('name-score');

    window.localStorage.setItem(NOTATION_STORAGE_KEY, '{"format":"name"}');
    expect(loadNotationFormat()).toBe('name-score');
  });

  it('保存するのは表記形式のキーだけ', () => {
    saveNotationFormat('name');
    expect(Object.keys(window.localStorage)).toEqual([NOTATION_STORAGE_KEY]);
  });
});
