import { useMemo } from 'react';
import type { HistoryEntry } from '../domain/history';
import { formatThrow, type NotationFormat } from '../domain/notation';
import type { CalculationMode } from '../state/calculatorReducer';
import './HistoryList.css';

interface HistoryListProps {
  entries: HistoryEntry[];
  format: NotationFormat;
  mode: CalculationMode;
  onRemove: (entryId: string) => void;
}

export function HistoryList({ entries, format, mode, onRemove }: HistoryListProps) {
  // 表示は常に新しい順で統一する。
  const ordered = useMemo(() => [...entries].reverse(), [entries]);
  const afterLabel = mode === 'addition' ? '累計' : '残り';

  return (
    <section className="history" aria-label="入力履歴">
      <div className="history__head">
        <h2 className="history__title">入力履歴</h2>
        <span className="history__count" data-testid="history-count">
          {`${entries.length}件（新しい順）`}
        </span>
      </div>

      {ordered.length === 0 ? (
        <p className="history__empty" data-testid="history-empty">
          履歴はまだありません。ダーツボードをタップしてください。
        </p>
      ) : (
        <ol className="history__list" data-testid="history-list">
          {ordered.map((entry) => (
            <li
              key={entry.id}
              className={`history__item${entry.isBust ? ' history__item--bust' : ''}`}
              data-testid="history-item"
              data-entry-id={entry.id}
              data-bust={entry.isBust ? 'true' : 'false'}
            >
              <span className="history__order" data-testid="history-order">
                {entry.order}
              </span>

              <span className="history__content">
                <span className="history__throw" data-testid="history-throw">
                  {formatThrow(entry, format)}
                </span>
                {entry.isBust ? (
                  <span className="history__bust" data-testid="history-bust">
                    {`BUST：${entry.bustOver}点オーバー`}
                  </span>
                ) : (
                  <span className="history__after" data-testid="history-after">
                    {`${afterLabel} ${entry.valueAfter}`}
                  </span>
                )}
              </span>

              <button
                type="button"
                className="history__remove"
                data-testid="history-remove"
                aria-label={`${entry.order}投目 ${entry.label} を削除`}
                onClick={() => onRemove(entry.id)}
              >
                削除
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
