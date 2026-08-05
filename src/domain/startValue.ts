/**
 * 引き算モードの開始値バリデーション。
 * 固定の 301 / 501 専用にはせず、0 以上の整数であれば自由に設定できる。
 */

export const MAX_START_VALUE = 999_999;

export type StartValueValidation =
  | { ok: true; value: number }
  | { ok: false; message: string };

/** 全角数字を半角へ寄せてから判定する（スマートフォンでの入力ゆれ対策）。 */
function normalize(raw: string): string {
  return raw
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[，,\s]/g, '')
    .trim();
}

export function validateStartValue(raw: string): StartValueValidation {
  const text = normalize(raw);

  if (text === '') {
    return { ok: false, message: '開始値を入力してください。' };
  }
  if (text.startsWith('-')) {
    return { ok: false, message: '負の数は使用できません。0以上の整数を入力してください。' };
  }
  if (text.includes('.')) {
    return { ok: false, message: '小数は使用できません。0以上の整数を入力してください。' };
  }
  if (!/^\d+$/.test(text)) {
    return { ok: false, message: '数字以外は入力できません。0以上の整数を入力してください。' };
  }

  const value = Number(text);
  if (!Number.isSafeInteger(value)) {
    return { ok: false, message: '入力できる範囲を超えています。' };
  }
  if (value > MAX_START_VALUE) {
    return {
      ok: false,
      message: `開始値は ${MAX_START_VALUE.toLocaleString('ja-JP')} 以下で入力してください。`,
    };
  }

  return { ok: true, value };
}
