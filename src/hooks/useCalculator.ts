import { useCallback, useMemo, useReducer } from 'react';
import {
  evaluateAddition,
  evaluateSubtraction,
  type HistoryEntry,
} from '../domain/history';
import type { SegmentDefinition } from '../domain/segments';
import { validateStartValue, type StartValueValidation } from '../domain/startValue';
import {
  calculatorReducer,
  createInitialState,
  type CalculationMode,
} from '../state/calculatorReducer';

export interface CalculatorView {
  mode: CalculationMode;
  /** 入力順（古い順）の履歴。表示側で並び順を決める。 */
  entries: HistoryEntry[];
  /** 足し算モードは合計値、引き算モードは残り点数。 */
  currentValue: number;
  lastEntry: HistoryEntry | null;
  startValueText: string;
  startValueValidation: StartValueValidation;
  /** 盤面タップを受け付けられるか（引き算モードで開始値が不正なら false）。 */
  canInput: boolean;
  setMode: (mode: CalculationMode) => void;
  addThrow: (segment: SegmentDefinition) => void;
  undo: () => void;
  removeEntry: (entryId: string) => void;
  clear: () => void;
  setStartValue: (text: string) => void;
}

/**
 * 足し算・引き算それぞれの状態をページ表示中だけ保持する。
 * 永続化は一切行わないため、リロードで初期状態へ戻る。
 */
export function useCalculator(): CalculatorView {
  const [state, dispatch] = useReducer(calculatorReducer, undefined, createInitialState);

  const startValueValidation = useMemo(
    () => validateStartValue(state.subtraction.startValueText),
    [state.subtraction.startValueText],
  );

  const additionResult = useMemo(
    () => evaluateAddition(state.addition.inputs),
    [state.addition.inputs],
  );

  const subtractionResult = useMemo(
    () =>
      evaluateSubtraction(
        startValueValidation.ok ? startValueValidation.value : 0,
        state.subtraction.inputs,
      ),
    [startValueValidation, state.subtraction.inputs],
  );

  const isAddition = state.mode === 'addition';
  const entries = isAddition ? additionResult.entries : subtractionResult.entries;
  const currentValue = isAddition ? additionResult.total : subtractionResult.remaining;

  const setMode = useCallback((mode: CalculationMode) => dispatch({ type: 'setMode', mode }), []);
  const addThrow = useCallback(
    (segment: SegmentDefinition) => dispatch({ type: 'addThrow', segment }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const removeEntry = useCallback(
    (entryId: string) => dispatch({ type: 'removeEntry', entryId }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const setStartValue = useCallback(
    (text: string) => dispatch({ type: 'setStartValue', text }),
    [],
  );

  return {
    mode: state.mode,
    entries,
    currentValue,
    lastEntry: entries.length > 0 ? entries[entries.length - 1] : null,
    startValueText: state.subtraction.startValueText,
    startValueValidation,
    canInput: isAddition || startValueValidation.ok,
    setMode,
    addThrow,
    undo,
    removeEntry,
    clear,
    setStartValue,
  };
}
