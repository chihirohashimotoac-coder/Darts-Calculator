import type { ThrowInput } from './history';

/**
 * 履歴および直近入力の表記形式。
 * - name-score: セグメント名＋得点（例: T20：60）
 * - name:       セグメント名のみ（例: T20）
 * - score:      得点のみ（例: 60）
 */
export type NotationFormat = 'name-score' | 'name' | 'score';

export const NOTATION_FORMATS: readonly NotationFormat[] = ['name-score', 'name', 'score'];

export const DEFAULT_NOTATION_FORMAT: NotationFormat = 'name-score';

export const NOTATION_FORMAT_LABELS: Record<NotationFormat, string> = {
  'name-score': '形式A：セグメント名＋得点',
  name: '形式B：セグメント名のみ',
  score: '形式C：得点のみ',
};

export const NOTATION_FORMAT_EXAMPLES: Record<NotationFormat, string> = {
  'name-score': 'T20：60',
  name: 'T20',
  score: '60',
};

export function isNotationFormat(value: unknown): value is NotationFormat {
  return typeof value === 'string' && (NOTATION_FORMATS as readonly string[]).includes(value);
}

/** 表記に必要な最小限の入力（履歴データからそのまま渡せる）。 */
export type NotationSource = Pick<ThrowInput, 'label' | 'score'>;

/**
 * 構造化された入力データを、選択中の表記形式の文字列へ変換する。
 * 履歴には表示用文字列を保存せず、常にこの関数で整形する。
 */
export function formatThrow(source: NotationSource, format: NotationFormat): string {
  switch (format) {
    case 'name-score':
      return `${source.label}：${source.score}`;
    case 'name':
      return source.label;
    case 'score':
      return String(source.score);
  }
}
