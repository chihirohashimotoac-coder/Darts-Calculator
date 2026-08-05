import { createThrowInput, type ThrowInput } from '../domain/history';
import type { SegmentDefinition } from '../domain/segments';
import { validateStartValue } from '../domain/startValue';

export type CalculationMode = 'addition' | 'subtraction';

export const CALCULATION_MODES: readonly CalculationMode[] = ['addition', 'subtraction'];

export const MODE_LABELS: Record<CalculationMode, string> = {
  addition: '足し算モード',
  subtraction: '引き算モード',
};

/** 初期表示用の開始値。固定仕様ではなく、ユーザーが自由に変更できる。 */
export const DEFAULT_START_VALUE_TEXT = '501';

export interface CalculatorState {
  mode: CalculationMode;
  /** 足し算モードの状態。モード切り替えでは破棄しない。 */
  addition: { inputs: ThrowInput[] };
  /** 引き算モードの状態。モード切り替えでは破棄しない。 */
  subtraction: { startValueText: string; inputs: ThrowInput[] };
  /** 履歴 ID 採番用のカウンタ。 */
  sequence: number;
}

export type CalculatorAction =
  | { type: 'setMode'; mode: CalculationMode }
  | { type: 'addThrow'; segment: SegmentDefinition }
  | { type: 'undo' }
  | { type: 'removeEntry'; entryId: string }
  | { type: 'clear' }
  | { type: 'setStartValue'; text: string };

export function createInitialState(): CalculatorState {
  return {
    mode: 'addition',
    addition: { inputs: [] },
    subtraction: { startValueText: DEFAULT_START_VALUE_TEXT, inputs: [] },
    sequence: 0,
  };
}

function currentInputs(state: CalculatorState): ThrowInput[] {
  return state.mode === 'addition' ? state.addition.inputs : state.subtraction.inputs;
}

function withInputs(state: CalculatorState, inputs: ThrowInput[]): CalculatorState {
  return state.mode === 'addition'
    ? { ...state, addition: { inputs } }
    : { ...state, subtraction: { ...state.subtraction, inputs } };
}

/**
 * 計算状態のリデューサ。
 *
 * 保持するのは「開始値」と「入力履歴」だけで、合計値・残り点数・BUST 判定は
 * 常にここから再評価して求める（部分的な差し引きは行わない）。
 */
export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  switch (action.type) {
    case 'setMode':
      return state.mode === action.mode ? state : { ...state, mode: action.mode };

    case 'addThrow': {
      // 開始値が不正な間は盤面入力を受け付けない。
      if (
        state.mode === 'subtraction' &&
        !validateStartValue(state.subtraction.startValueText).ok
      ) {
        return state;
      }
      const sequence = state.sequence + 1;
      const input = createThrowInput(action.segment, `throw-${sequence}`);
      const next = withInputs(state, [...currentInputs(state), input]);
      return { ...next, sequence };
    }

    case 'undo': {
      const inputs = currentInputs(state);
      if (inputs.length === 0) return state;
      return withInputs(state, inputs.slice(0, -1));
    }

    case 'removeEntry': {
      const inputs = currentInputs(state);
      const next = inputs.filter((input) => input.id !== action.entryId);
      return next.length === inputs.length ? state : withInputs(state, next);
    }

    case 'clear': {
      const inputs = currentInputs(state);
      return inputs.length === 0 ? state : withInputs(state, []);
    }

    case 'setStartValue':
      return {
        ...state,
        subtraction: { ...state.subtraction, startValueText: action.text },
      };
  }
}
