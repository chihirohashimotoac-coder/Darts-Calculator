import { describe, expect, it } from 'vitest';
import { evaluateAddition, evaluateSubtraction } from '../domain/history';
import { getSegmentById, type SegmentDefinition } from '../domain/segments';
import {
  calculatorReducer,
  createInitialState,
  type CalculatorAction,
  type CalculatorState,
} from './calculatorReducer';

function segment(id: string): SegmentDefinition {
  const found = getSegmentById(id);
  if (!found) throw new Error(`unknown segment: ${id}`);
  return found;
}

function run(state: CalculatorState, ...actions: CalculatorAction[]): CalculatorState {
  return actions.reduce(calculatorReducer, state);
}

const tap = (id: string): CalculatorAction => ({ type: 'addThrow', segment: segment(id) });

describe('calculatorReducer - 足し算モード', () => {
  it('初期状態は足し算モードで合計0', () => {
    const state = createInitialState();
    expect(state.mode).toBe('addition');
    expect(evaluateAddition(state.addition.inputs).total).toBe(0);
  });

  it('T20 → S20 → D10 で 100 になる', () => {
    const state = run(
      createInitialState(),
      tap('segment-t20'),
      tap('segment-s20-outer'),
      tap('segment-d10'),
    );
    expect(evaluateAddition(state.addition.inputs).total).toBe(100);
  });

  it('一つ戻るで直前入力が消える', () => {
    const state = run(
      createInitialState(),
      tap('segment-t20'),
      tap('segment-s20-outer'),
      { type: 'undo' },
    );
    expect(state.addition.inputs).toHaveLength(1);
    expect(evaluateAddition(state.addition.inputs).total).toBe(60);
  });

  it('履歴が無い状態で一つ戻るを実行しても状態は変わらない', () => {
    const initial = createInitialState();
    expect(calculatorReducer(initial, { type: 'undo' })).toBe(initial);
  });

  it('任意の履歴を削除すると再計算される', () => {
    const state = run(
      createInitialState(),
      tap('segment-t20'),
      tap('segment-s20-outer'),
      tap('segment-d10'),
    );
    const targetId = state.addition.inputs[1].id;
    const removed = calculatorReducer(state, { type: 'removeEntry', entryId: targetId });
    expect(removed.addition.inputs).toHaveLength(2);
    expect(evaluateAddition(removed.addition.inputs).total).toBe(80);
  });

  it('オールクリアで0に戻る', () => {
    const state = run(createInitialState(), tap('segment-t20'), { type: 'clear' });
    expect(state.addition.inputs).toHaveLength(0);
    expect(evaluateAddition(state.addition.inputs).total).toBe(0);
  });

  it('履歴IDが一意に採番される', () => {
    const state = run(
      createInitialState(),
      tap('segment-t20'),
      tap('segment-t20'),
      tap('segment-t20'),
    );
    const ids = new Set(state.addition.inputs.map((item) => item.id));
    expect(ids.size).toBe(3);
  });
});

describe('calculatorReducer - 引き算モード', () => {
  const subtractionState = () =>
    calculatorReducer(createInitialState(), { type: 'setMode', mode: 'subtraction' });

  it('501からT20を3回で321になる', () => {
    const state = run(
      subtractionState(),
      tap('segment-t20'),
      tap('segment-t20'),
      tap('segment-t20'),
    );
    expect(evaluateSubtraction(501, state.subtraction.inputs).remaining).toBe(321);
  });

  it('開始値が不正な間は盤面入力を受け付けない', () => {
    const state = run(subtractionState(), { type: 'setStartValue', text: 'abc' });
    const afterTap = calculatorReducer(state, tap('segment-t20'));
    expect(afterTap).toBe(state);
    expect(afterTap.subtraction.inputs).toHaveLength(0);
  });

  it('開始値を修正すると再び入力できる', () => {
    const state = run(
      subtractionState(),
      { type: 'setStartValue', text: '' },
      tap('segment-t20'),
      { type: 'setStartValue', text: '100' },
      tap('segment-t20'),
    );
    expect(state.subtraction.inputs).toHaveLength(1);
    expect(evaluateSubtraction(100, state.subtraction.inputs).remaining).toBe(40);
  });

  it('オールクリア（開始値にリセット）で履歴だけが消え、開始値は維持される', () => {
    const state = run(
      subtractionState(),
      { type: 'setStartValue', text: '301' },
      tap('segment-t20'),
      { type: 'clear' },
    );
    expect(state.subtraction.inputs).toHaveLength(0);
    expect(state.subtraction.startValueText).toBe('301');
  });

  it('BUSTも一つ戻るで削除できる', () => {
    const state = run(
      subtractionState(),
      { type: 'setStartValue', text: '32' },
      tap('segment-t20'),
    );
    expect(evaluateSubtraction(32, state.subtraction.inputs).entries[0].isBust).toBe(true);

    const undone = calculatorReducer(state, { type: 'undo' });
    expect(undone.subtraction.inputs).toHaveLength(0);
    expect(evaluateSubtraction(32, undone.subtraction.inputs).remaining).toBe(32);
  });
});

describe('calculatorReducer - モード切り替え', () => {
  it('各モードの状態はページ表示中は別々に保持される', () => {
    let state = run(
      createInitialState(),
      tap('segment-t20'),
      tap('segment-d20'),
      { type: 'setMode', mode: 'subtraction' },
      { type: 'setStartValue', text: '501' },
      tap('segment-t20'),
    );

    expect(evaluateSubtraction(501, state.subtraction.inputs).remaining).toBe(441);

    state = calculatorReducer(state, { type: 'setMode', mode: 'addition' });
    expect(state.addition.inputs).toHaveLength(2);
    expect(evaluateAddition(state.addition.inputs).total).toBe(100);
  });

  it('クリアは選択中モードの履歴だけを消す', () => {
    let state = run(
      createInitialState(),
      tap('segment-t20'),
      { type: 'setMode', mode: 'subtraction' },
      tap('segment-d20'),
      { type: 'clear' },
    );
    expect(state.subtraction.inputs).toHaveLength(0);

    state = calculatorReducer(state, { type: 'setMode', mode: 'addition' });
    expect(state.addition.inputs).toHaveLength(1);
  });
});
