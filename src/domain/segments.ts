import { BOARD_NUMBERS } from './boardNumbers';
import {
  calculateScore,
  multiplierOf,
  type BullType,
  type SegmentKind,
} from './scoring';

/**
 * SVG 上の領域（リング）種別。
 * インナーシングルとアウターシングルは SVG 上では別領域だが、
 * 計算上はどちらも SegmentKind = 'single' として扱う。
 */
export type SegmentRing =
  | 'inner-single'
  | 'triple'
  | 'outer-single'
  | 'double'
  | 'outer-bull'
  | 'inner-bull'
  | 'miss';

/** 盤面の配色グループ。色は CSS 側で解決する。 */
export type SegmentColorGroup = 'dark' | 'light' | 'red' | 'green' | 'miss';

export interface SegmentDefinition {
  /** E2E テストや DOM 参照で使う安定した識別子（例: segment-t20）。 */
  id: string;
  ring: SegmentRing;
  kind: SegmentKind;
  /** 1〜20 の表示数字。BULL / MISS は null。 */
  baseNumber: number | null;
  bullType: BullType;
  /** BOARD_NUMBERS 上のインデックス。BULL / MISS は null。 */
  index: number | null;
  multiplier: number;
  score: number;
  /** 表示用の短縮名（例: T20 / BULL / OUTER BULL / MISS）。 */
  label: string;
  /** スクリーンリーダー向けの名前。 */
  ariaLabel: string;
  colorGroup: SegmentColorGroup;
}

const KIND_LABEL_JA: Record<Exclude<SegmentKind, 'bull' | 'miss'>, string> = {
  single: 'シングル',
  double: 'ダブル',
  triple: 'トリプル',
};

const KIND_LABEL_EN: Record<Exclude<SegmentKind, 'bull' | 'miss'>, string> = {
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
};

const KIND_PREFIX: Record<Exclude<SegmentKind, 'bull' | 'miss'>, string> = {
  single: 'S',
  double: 'D',
  triple: 'T',
};

function buildWedgeSegment(
  index: number,
  ring: 'inner-single' | 'triple' | 'outer-single' | 'double',
): SegmentDefinition {
  const baseNumber = BOARD_NUMBERS[index];
  const kind: SegmentKind =
    ring === 'triple' ? 'triple' : ring === 'double' ? 'double' : 'single';
  const score = calculateScore({ kind, baseNumber, bullType: null });
  const label = `${KIND_PREFIX[kind]}${baseNumber}`;

  const id =
    ring === 'inner-single'
      ? `segment-s${baseNumber}-inner`
      : ring === 'outer-single'
        ? `segment-s${baseNumber}-outer`
        : `segment-${KIND_PREFIX[kind].toLowerCase()}${baseNumber}`;

  // 20 を含む偶数インデックスを黒／赤系、奇数インデックスを白（クリーム）／緑系にする。
  const isDarkWedge = index % 2 === 0;
  const colorGroup: SegmentColorGroup =
    kind === 'single' ? (isDarkWedge ? 'dark' : 'light') : isDarkWedge ? 'red' : 'green';

  return {
    id,
    ring,
    kind,
    baseNumber,
    bullType: null,
    index,
    multiplier: multiplierOf(kind),
    score,
    label,
    ariaLabel: `${KIND_LABEL_JA[kind]}${baseNumber}、${score}点 (${KIND_LABEL_EN[kind]} ${baseNumber}, ${score} points)`,
    colorGroup,
  };
}

const MISS_SEGMENT: SegmentDefinition = {
  id: 'segment-miss',
  ring: 'miss',
  kind: 'miss',
  baseNumber: null,
  bullType: null,
  index: null,
  multiplier: 0,
  score: 0,
  label: 'MISS',
  ariaLabel: 'ミス、0点 (Miss, 0 points)',
  colorGroup: 'miss',
};

const OUTER_BULL_SEGMENT: SegmentDefinition = {
  id: 'segment-outer-bull',
  ring: 'outer-bull',
  kind: 'bull',
  baseNumber: null,
  bullType: 'outer',
  index: null,
  multiplier: 1,
  score: calculateScore({ kind: 'bull', baseNumber: null, bullType: 'outer' }),
  label: 'OUTER BULL',
  ariaLabel: 'アウターブル、25点 (Outer bull, 25 points)',
  colorGroup: 'green',
};

const INNER_BULL_SEGMENT: SegmentDefinition = {
  id: 'segment-inner-bull',
  ring: 'inner-bull',
  kind: 'bull',
  baseNumber: null,
  bullType: 'inner',
  index: null,
  multiplier: 1,
  score: calculateScore({ kind: 'bull', baseNumber: null, bullType: 'inner' }),
  label: 'BULL',
  ariaLabel: 'インナーブル、50点 (Inner bull, 50 points)',
  colorGroup: 'red',
};

/**
 * 全 83 領域のセグメント定義。
 * 描画順（背面 → 前面）でもあるため、MISS リング → ウェッジ → BULL の順に並べている。
 */
export const SEGMENTS: SegmentDefinition[] = [
  MISS_SEGMENT,
  ...BOARD_NUMBERS.flatMap((_, index) => [
    buildWedgeSegment(index, 'inner-single'),
    buildWedgeSegment(index, 'triple'),
    buildWedgeSegment(index, 'outer-single'),
    buildWedgeSegment(index, 'double'),
  ]),
  OUTER_BULL_SEGMENT,
  INNER_BULL_SEGMENT,
];

const SEGMENT_BY_ID = new Map(SEGMENTS.map((segment) => [segment.id, segment]));

export function getSegmentById(id: string): SegmentDefinition | undefined {
  return SEGMENT_BY_ID.get(id);
}
