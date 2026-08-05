import type { HistoryEntry } from '../domain/history';
import { formatThrow, type NotationFormat } from '../domain/notation';
import type { CalculationMode } from '../state/calculatorReducer';
import './LastInputPanel.css';

interface LastInputPanelProps {
  entry: HistoryEntry | null;
  format: NotationFormat;
  mode: CalculationMode;
}

export function LastInputPanel({ entry, format, mode }: LastInputPanelProps) {
  const isBust = entry?.isBust ?? false;
  const afterLabel = mode === 'addition' ? '累計' : '残り';

  return (
    <section
      className={`last-input${isBust ? ' last-input--bust' : ''}`}
      aria-label="直近の入力"
      data-testid="last-input"
    >
      <p className="last-input__title">直近の入力</p>

      {entry === null ? (
        <p className="last-input__value" data-testid="last-input-value">
          まだ入力がありません
        </p>
      ) : (
        <>
          <p className="last-input__value" data-testid="last-input-value">
            {formatThrow(entry, format)}
          </p>
          {isBust ? (
            <p className="last-input__bust" data-testid="bust-message">
              {`BUST：${entry.bustOver}点オーバー`}
            </p>
          ) : (
            <p className="last-input__after" data-testid="last-input-after">
              {`${afterLabel} ${entry.valueAfter}`}
            </p>
          )}
        </>
      )}

      {/* BUST を含む状態変化の読み上げ用 */}
      <p className="visually-hidden" role="alert">
        {isBust && entry ? `BUST。${entry.bustOver}点オーバーです。残り点数は変わりません。` : ''}
      </p>
    </section>
  );
}
