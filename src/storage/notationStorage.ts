import {
  DEFAULT_NOTATION_FORMAT,
  isNotationFormat,
  type NotationFormat,
} from '../domain/notation';

/**
 * LocalStorage へ永続保存するのは「表記形式」の設定だけ。
 * 計算状態（合計値・残り点数・開始値・履歴・モード等）は一切保存しない。
 */
export const NOTATION_STORAGE_KEY = 'darts-calculator:notation-format';

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    // プライベートブラウジング等で参照自体が例外になる環境を考慮する。
    return null;
  }
}

/**
 * 保存済みの表記形式を読み込む。
 * 値が無い場合・型や許可値が想定外の場合は形式A（name-score）を返す。
 */
export function loadNotationFormat(): NotationFormat {
  const storage = getStorage();
  if (!storage) return DEFAULT_NOTATION_FORMAT;

  try {
    const raw: unknown = storage.getItem(NOTATION_STORAGE_KEY);
    return isNotationFormat(raw) ? raw : DEFAULT_NOTATION_FORMAT;
  } catch {
    return DEFAULT_NOTATION_FORMAT;
  }
}

/** 表記形式を保存する。保存できない環境でもアプリの動作は継続する。 */
export function saveNotationFormat(format: NotationFormat): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(NOTATION_STORAGE_KEY, format);
  } catch {
    // 容量超過などは無視する（表記設定は失われても計算に影響しない）。
  }
}
