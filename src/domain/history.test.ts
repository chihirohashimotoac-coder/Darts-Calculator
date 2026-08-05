import { describe, expect, it } from 'vitest';
import { createThrowInput, evaluateAddition, evaluateSubtraction, type ThrowInput } from './history';
import { getSegmentById } from './segments';

let counter = 0;

/** セグメントIDから履歴入力を作るテスト用ヘルパー。 */
function input(segmentId: string): ThrowInput {
  const segment = getSegmentById(segmentId);
  if (!segment) throw new Error(`unknown segment: ${segmentId}`);
  counter += 1;
  return createThrowInput(segment, `throw-${counter}`);
}

const T20 = () => input('segment-t20');
const S20 = () => input('segment-s20-outer');
const D10 = () => input('segment-d10');
const D16 = () => input('segment-d16');
const MISS = () => input('segment-miss');
const INNER_BULL = () => input('segment-inner-bull');

describe('evaluateAddition', () => {
  it('初期値は0', () => {
    expect(evaluateAddition([]).total).toBe(0);
    expect(evaluateAddition([]).entries).toEqual([]);
  });

  it('T20 → S20 → D10 で 100 になる', () => {
    const result = evaluateAddition([T20(), S20(), D10()]);
    expect(result.total).toBe(100);
    expect(result.entries.map((entry) => entry.valueAfter)).toEqual([60, 80, 100]);
  });

  it('MISSは履歴に残るが合計を変化させない', () => {
    const result = evaluateAddition([T20(), MISS(), MISS()]);
    expect(result.total).toBe(60);
    expect(result.entries).toHaveLength(3);
    expect(result.entries[1].isMiss).toBe(true);
    expect(result.entries[1].score).toBe(0);
    expect(result.entries[2].valueAfter).toBe(60);
  });

  it('足し算モードではBUSTが発生しない', () => {
    const result = evaluateAddition([T20(), INNER_BULL()]);
    expect(result.entries.every((entry) => entry.isBust === false)).toBe(true);
    expect(result.entries.every((entry) => entry.bustOver === null)).toBe(true);
  });

  it('直前入力を取り消すと合計が再計算される（一つ戻る相当）', () => {
    const inputs = [T20(), S20(), D10()];
    expect(evaluateAddition(inputs.slice(0, -1)).total).toBe(80);
  });

  it('途中の履歴を削除すると先頭から再計算される', () => {
    const inputs = [T20(), S20(), D10()];
    const removed = inputs.filter((item) => item.id !== inputs[1].id);
    const result = evaluateAddition(removed);
    expect(result.total).toBe(80);
    expect(result.entries.map((entry) => entry.order)).toEqual([1, 2]);
    expect(result.entries.map((entry) => entry.valueAfter)).toEqual([60, 80]);
  });

  it('オールクリアで0に戻る', () => {
    expect(evaluateAddition([]).total).toBe(0);
  });

  it('投入順（order）は1始まりの連番になる', () => {
    const result = evaluateAddition([T20(), MISS(), D10()]);
    expect(result.entries.map((entry) => entry.order)).toEqual([1, 2, 3]);
  });
});

describe('evaluateSubtraction', () => {
  it('501からT20を3回入力すると321になる', () => {
    const result = evaluateSubtraction(501, [T20(), T20(), T20()]);
    expect(result.remaining).toBe(321);
    expect(result.entries.map((entry) => entry.valueAfter)).toEqual([441, 381, 321]);
    expect(result.entries.every((entry) => entry.isBust === false)).toBe(true);
  });

  it('残り32でT20を入力するとBUSTになり、超過は28点、残りは32のまま', () => {
    const result = evaluateSubtraction(32, [T20()]);
    const entry = result.entries[0];
    expect(entry.isBust).toBe(true);
    expect(entry.bustOver).toBe(28);
    expect(entry.valueAfter).toBe(32);
    expect(result.remaining).toBe(32);
  });

  it('BUSTの次の入力はBUST前と同じ残り点数から継続する', () => {
    const result = evaluateSubtraction(32, [T20(), D16()]);
    expect(result.entries[0].isBust).toBe(true);
    expect(result.entries[1].isBust).toBe(false);
    expect(result.entries[1].valueAfter).toBe(0);
    expect(result.remaining).toBe(0);
  });

  it('残り32からD16でちょうど0になる', () => {
    expect(evaluateSubtraction(32, [D16()]).remaining).toBe(0);
  });

  it('残り20からS20でも0になる（ダブルアウトは実装しない）', () => {
    const result = evaluateSubtraction(20, [S20()]);
    expect(result.remaining).toBe(0);
    expect(result.entries[0].isBust).toBe(false);
  });

  it('残り50でインナーブルはちょうど0になる', () => {
    expect(evaluateSubtraction(50, [INNER_BULL()]).remaining).toBe(0);
  });

  it('残り1を有効な状態として許可する（BUSTにしない）', () => {
    const result = evaluateSubtraction(21, [S20()]);
    expect(result.remaining).toBe(1);
    expect(result.entries[0].isBust).toBe(false);
  });

  it('残り1でMISSしてもBUSTにならず残り点数も変化しない', () => {
    const result = evaluateSubtraction(1, [MISS()]);
    expect(result.remaining).toBe(1);
    expect(result.entries[0].isBust).toBe(false);
    expect(result.entries[0].score).toBe(0);
  });

  it('MISSは残り点数を変化させない', () => {
    const result = evaluateSubtraction(100, [MISS(), T20(), MISS()]);
    expect(result.remaining).toBe(40);
    expect(result.entries.map((entry) => entry.valueAfter)).toEqual([100, 40, 40]);
  });

  it('BUSTを一つ戻るで取り消せる', () => {
    const inputs = [T20(), T20()];
    const withBust = evaluateSubtraction(70, inputs);
    expect(withBust.entries[1].isBust).toBe(true);
    expect(withBust.remaining).toBe(10);

    const afterUndo = evaluateSubtraction(70, inputs.slice(0, -1));
    expect(afterUndo.entries).toHaveLength(1);
    expect(afterUndo.remaining).toBe(10);
  });

  it('履歴途中の削除でBUST判定を含めて再計算される', () => {
    // 開始値100: D16(→68) → T20(→8) → T20(BUST:52超過、残り8)
    const inputs = [D16(), T20(), T20()];
    const before = evaluateSubtraction(100, inputs);
    expect(before.entries.map((entry) => entry.valueAfter)).toEqual([68, 8, 8]);
    expect(before.entries.map((entry) => entry.isBust)).toEqual([false, false, true]);
    expect(before.entries[2].bustOver).toBe(52);
    expect(before.remaining).toBe(8);

    // 先頭の D16 を削除すると、BUST になる位置が 2 件目へ移動する
    const removed = inputs.filter((item) => item.id !== inputs[0].id);
    const afterRemoval = evaluateSubtraction(100, removed);
    expect(afterRemoval.entries.map((entry) => entry.isBust)).toEqual([false, true]);
    expect(afterRemoval.entries[1].bustOver).toBe(20);
    expect(afterRemoval.remaining).toBe(40);
  });

  it('BUSTだった入力が、前の入力削除により通常入力へ変わる', () => {
    const inputs = [T20(), T20(), T20()];
    const before = evaluateSubtraction(130, inputs);
    expect(before.entries.map((entry) => entry.isBust)).toEqual([false, false, true]);
    expect(before.entries[2].bustOver).toBe(50);
    expect(before.remaining).toBe(10);

    const removed = inputs.filter((item) => item.id !== inputs[0].id);
    const after = evaluateSubtraction(130, removed);
    expect(after.entries.map((entry) => entry.isBust)).toEqual([false, false]);
    expect(after.remaining).toBe(10);
  });

  it('開始値を変更すると履歴全体が再計算される', () => {
    const inputs = [T20(), T20()];
    expect(evaluateSubtraction(501, inputs).remaining).toBe(381);

    const changed = evaluateSubtraction(100, inputs);
    expect(changed.entries.map((entry) => entry.isBust)).toEqual([false, true]);
    expect(changed.entries[1].bustOver).toBe(20);
    expect(changed.remaining).toBe(40);
  });

  it('開始値0ではすべての得点入力がBUSTになる（MISSを除く）', () => {
    const result = evaluateSubtraction(0, [MISS(), S20()]);
    expect(result.entries[0].isBust).toBe(false);
    expect(result.entries[1].isBust).toBe(true);
    expect(result.entries[1].bustOver).toBe(20);
    expect(result.remaining).toBe(0);
  });

  it('履歴には構造化データ（種別・基準数字・倍率・得点・BULL種別・MISS・BUST）が含まれる', () => {
    const result = evaluateSubtraction(32, [T20()]);
    expect(result.entries[0]).toMatchObject({
      kind: 'triple',
      ring: 'triple',
      baseNumber: 20,
      multiplier: 3,
      score: 60,
      bullType: null,
      isMiss: false,
      isBust: true,
      bustOver: 28,
      label: 'T20',
    });
  });
});
