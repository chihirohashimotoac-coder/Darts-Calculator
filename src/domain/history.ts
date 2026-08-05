import type { SegmentDefinition, SegmentRing } from './segments';
import type { BullType, SegmentKind } from './scoring';

/**
 * 履歴に保持する 1 投分の入力データ。
 *
 * 表示用の文字列ではなく構造化データで保持し、表記形式は表示時に適用する。
 * BUST 判定と超過点数は「開始値 + 入力列」から毎回再評価するため、
 * この生データには含めない（= 部分的な差し引きを行わない）。
 */
export interface ThrowInput {
  /** 履歴内で一意な ID（削除・再計算の対象特定に使う）。 */
  id: string;
  segmentId: string;
  ring: SegmentRing;
  kind: SegmentKind;
  /** 1〜20 の表示数字。BULL / MISS は null。 */
  baseNumber: number | null;
  bullType: BullType;
  multiplier: number;
  score: number;
  isMiss: boolean;
  /** 表示用の短縮名（例: T20）。 */
  label: string;
}

/** 再評価済みの履歴 1 件。表示に必要な派生値を含む。 */
export interface HistoryEntry extends ThrowInput {
  /** 1 始まりの投入順。 */
  order: number;
  isBust: boolean;
  /** BUST 時の超過点数。BUST でなければ null。 */
  bustOver: number | null;
  /** この入力を反映した後の値（足し算モード=累計、引き算モード=残り点数）。 */
  valueAfter: number;
}

export interface AdditionResult {
  entries: HistoryEntry[];
  total: number;
}

export interface SubtractionResult {
  entries: HistoryEntry[];
  remaining: number;
}

export function createThrowInput(segment: SegmentDefinition, id: string): ThrowInput {
  return {
    id,
    segmentId: segment.id,
    ring: segment.ring,
    kind: segment.kind,
    baseNumber: segment.baseNumber,
    bullType: segment.bullType,
    multiplier: segment.multiplier,
    score: segment.score,
    isMiss: segment.kind === 'miss',
    label: segment.label,
  };
}

/**
 * 足し算モードの再評価。
 * 初期値 0 から順に加算するだけで、BUST は発生しない。
 * MISS は 0 点なので履歴には残るが合計は変化しない。
 */
export function evaluateAddition(inputs: readonly ThrowInput[]): AdditionResult {
  let total = 0;
  const entries = inputs.map((input, i) => {
    total += input.score;
    return {
      ...input,
      order: i + 1,
      isBust: false,
      bustOver: null,
      valueAfter: total,
    } satisfies HistoryEntry;
  });
  return { entries, total };
}

/**
 * 引き算モードの再評価。
 *
 * 計算結果が 0 未満になる入力だけを BUST として扱う。
 * - BUST 時は残り点数を変更せず、超過点数（得点 - BUST 直前の残り点数）を記録する
 * - 得点と残り点数が同じ場合はセグメント種別に関係なく 0 とする
 * - 残り 1 点も有効な状態として許可する
 *
 * 部分的な差し引きではなく、常に開始値と入力列の先頭から全件を再評価する。
 */
export function evaluateSubtraction(
  startValue: number,
  inputs: readonly ThrowInput[],
): SubtractionResult {
  let remaining = startValue;
  const entries = inputs.map((input, i) => {
    const isBust = input.score > remaining;
    const bustOver = isBust ? input.score - remaining : null;
    if (!isBust) {
      remaining -= input.score;
    }
    return {
      ...input,
      order: i + 1,
      isBust,
      bustOver,
      valueAfter: remaining,
    } satisfies HistoryEntry;
  });
  return { entries, remaining };
}
