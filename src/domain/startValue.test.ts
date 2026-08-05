import { describe, expect, it } from 'vitest';
import { MAX_START_VALUE, validateStartValue } from './startValue';

describe('validateStartValue', () => {
  it('0以上の整数を受け入れる', () => {
    expect(validateStartValue('501')).toEqual({ ok: true, value: 501 });
    expect(validateStartValue('0')).toEqual({ ok: true, value: 0 });
    expect(validateStartValue('1')).toEqual({ ok: true, value: 1 });
    expect(validateStartValue(' 301 ')).toEqual({ ok: true, value: 301 });
  });

  it('全角数字とカンマを正規化する', () => {
    expect(validateStartValue('５０１')).toEqual({ ok: true, value: 501 });
    expect(validateStartValue('1,001')).toEqual({ ok: true, value: 1001 });
  });

  it('未入力はエラーになる', () => {
    const result = validateStartValue('');
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.message).toContain('開始値を入力してください');
  });

  it('負数はエラーになる', () => {
    const result = validateStartValue('-1');
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.message).toContain('負の数');
  });

  it('小数はエラーになる', () => {
    const result = validateStartValue('30.5');
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.message).toContain('小数');
  });

  it('数値以外はエラーになる', () => {
    expect(validateStartValue('abc').ok).toBe(false);
    expect(validateStartValue('50a').ok).toBe(false);
    expect(validateStartValue('+5').ok).toBe(false);
  });

  it('上限を超える値はエラーになる', () => {
    expect(validateStartValue(String(MAX_START_VALUE)).ok).toBe(true);
    expect(validateStartValue(String(MAX_START_VALUE + 1)).ok).toBe(false);
  });
});
