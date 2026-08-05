import type { CalculationMode } from '../state/calculatorReducer';
import './ControlPanel.css';

interface ControlPanelProps {
  mode: CalculationMode;
  canUndo: boolean;
  hasHistory: boolean;
  onUndo: () => void;
  onClear: () => void;
}

export function ControlPanel({
  mode,
  canUndo,
  hasHistory,
  onUndo,
  onClear,
}: ControlPanelProps) {
  /**
   * 引き算モードでは「オールクリア」＝「履歴を消して開始値へ戻す」なので、
   * 意味が伝わるラベルへ差し替える（処理内容は同一）。
   */
  const clearLabel = mode === 'addition' ? 'オールクリア' : '開始値にリセット';
  const clearDescription =
    mode === 'addition'
      ? '履歴をすべて削除して合計を0に戻します'
      : '履歴をすべて削除して残り点数を開始値に戻します';

  return (
    <section className="control-panel" aria-label="操作">
      <button
        type="button"
        className="control-panel__button"
        data-testid="undo-button"
        onClick={onUndo}
        disabled={!canUndo}
      >
        <span aria-hidden="true">↩</span> 一つ戻る
      </button>
      <button
        type="button"
        className="control-panel__button control-panel__button--danger"
        data-testid="all-clear-button"
        onClick={onClear}
        disabled={!hasHistory}
        title={clearDescription}
      >
        <span aria-hidden="true">✕</span> {clearLabel}
      </button>
    </section>
  );
}
