/**
 * 得点計算。UI から完全に独立した純粋関数のみを置く。
 */

/** 計算上のセグメント種別（インナー/アウターシングルはどちらも single）。 */
export type SegmentKind = 'single' | 'double' | 'triple' | 'bull' | 'miss';

/** BULL の種別。BULL 以外は null。 */
export type BullType = 'inner' | 'outer' | null;

/** 得点計算に必要な最小限の情報。 */
export interface ScoreSource {
  kind: SegmentKind;
  /** 1〜20 の表示数字。BULL / MISS では null。 */
  baseNumber: number | null;
  bullType: BullType;
}

export const OUTER_BULL_SCORE = 25;
export const INNER_BULL_SCORE = 50;

/**
 * セグメント種別に対する倍率。
 * BULL は「数字 × 倍率」では表現しないため 1、MISS は 0 とする。
 */
export function multiplierOf(kind: SegmentKind): number {
  switch (kind) {
    case 'single':
      return 1;
    case 'double':
      return 2;
    case 'triple':
      return 3;
    case 'bull':
      return 1;
    case 'miss':
      return 0;
  }
}

/**
 * 得点を計算する。
 *
 * - シングル: 表示数字 × 1
 * - ダブル:   表示数字 × 2
 * - トリプル: 表示数字 × 3
 * - アウターブル: 25
 * - インナーブル: 50
 * - MISS: 0
 */
export function calculateScore(source: ScoreSource): number {
  switch (source.kind) {
    case 'miss':
      return 0;
    case 'bull':
      return source.bullType === 'inner' ? INNER_BULL_SCORE : OUTER_BULL_SCORE;
    case 'single':
    case 'double':
    case 'triple': {
      if (source.baseNumber === null) {
        throw new Error(`baseNumber is required for kind "${source.kind}"`);
      }
      return source.baseNumber * multiplierOf(source.kind);
    }
  }
}
