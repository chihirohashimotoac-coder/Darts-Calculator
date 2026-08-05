import type { CalculationMode } from '../state/calculatorReducer';
import type { CopyFeedback } from '../hooks/useClipboardCopy';
import './ScoreDisplay.css';

interface ScoreDisplayProps {
  mode: CalculationMode;
  value: number;
  onCopy: () => void;
  copyFeedback: CopyFeedback;
}

export function ScoreDisplay({ mode, value, onCopy, copyFeedback }: ScoreDisplayProps) {
  const isAddition = mode === 'addition';
  const title = isAddition ? '現在の合計' : '現在の残り点数';

  return (
    <section className="score-display" aria-label={title}>
      <div className="score-display__head">
        <p className="score-display__title">{title}</p>
        <button
          type="button"
          className="score-display__copy"
          data-testid="copy-button"
          onClick={onCopy}
        >
          コピー
        </button>
      </div>

      <p className="score-display__value">
        <span data-testid="current-value">{value}</span>
      </p>

      {/* 状態変化をスクリーンリーダーへ通知する */}
      <p className="visually-hidden" role="status" aria-live="polite">
        {`${title}は${value}点です`}
      </p>

      <p
        className={`score-display__copy-feedback score-display__copy-feedback--${copyFeedback?.status ?? 'idle'}`}
        data-testid="copy-feedback"
        role="status"
        aria-live="polite"
      >
        {copyFeedback?.message ?? ''}
      </p>
    </section>
  );
}
