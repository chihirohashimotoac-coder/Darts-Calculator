import { useCallback, useState } from 'react';
import { Dartboard } from './components/Dartboard';
import { ModeSwitcher } from './components/ModeSwitcher';
import { ScoreDisplay } from './components/ScoreDisplay';
import { StartValueInput } from './components/StartValueInput';
import { LastInputPanel } from './components/LastInputPanel';
import { ControlPanel } from './components/ControlPanel';
import { HistoryList } from './components/HistoryList';
import { NotationSettings } from './components/NotationSettings';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useCalculator } from './hooks/useCalculator';
import { useNotationFormat } from './hooks/useNotationFormat';
import { useSegmentHighlight } from './hooks/useSegmentHighlight';
import { useClipboardCopy } from './hooks/useClipboardCopy';
import type { SegmentDefinition } from './domain/segments';
import './App.css';

export default function App() {
  const calculator = useCalculator();
  const [notationFormat, setNotationFormat] = useNotationFormat();
  const { highlight, trigger } = useSegmentHighlight();
  const { feedback, copy } = useClipboardCopy();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isSubtraction = calculator.mode === 'subtraction';
  const hasHistory = calculator.entries.length > 0;

  const handleSegmentSelect = useCallback(
    (segment: SegmentDefinition) => {
      calculator.addThrow(segment);
      trigger(segment.id);
    },
    [calculator, trigger],
  );

  const handleClearRequest = useCallback(() => {
    if (!hasHistory) return;
    setConfirmOpen(true);
  }, [hasHistory]);

  const handleClearConfirm = useCallback(() => {
    calculator.clear();
    setConfirmOpen(false);
  }, [calculator]);

  const disabledReason =
    isSubtraction && !calculator.startValueValidation.ok
      ? `開始値が正しくないため入力できません。${calculator.startValueValidation.message}`
      : undefined;

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">SVGダーツボード電卓</h1>
        <p className="app__subtitle">
          盤面をタップして足し算・引き算。計算内容は保存されません。
        </p>
      </header>

      {/*
        DOM 順はスマートフォン向けの表示順（モード → 現在値 → 開始値 → 盤面 → …）。
        PC 幅では CSS グリッドで盤面だけを左カラムへ移動する。
      */}
      <main className="app__layout">
        <div className="app__cell app__cell--panel">
          <ModeSwitcher mode={calculator.mode} onChange={calculator.setMode} />
        </div>

        {/* 引き算モードでは、計算の起点になる開始値を残り点数より先に表示する */}
        {isSubtraction && (
          <div className="app__cell app__cell--panel">
            <StartValueInput
              value={calculator.startValueText}
              validation={calculator.startValueValidation}
              onChange={calculator.setStartValue}
            />
          </div>
        )}

        <div className="app__cell app__cell--panel">
          <ScoreDisplay
            mode={calculator.mode}
            value={calculator.currentValue}
            copyFeedback={feedback}
            onCopy={() => void copy(String(calculator.currentValue))}
          />
        </div>

        <div className="app__cell app__cell--board">
          <Dartboard
            onSegmentSelect={handleSegmentSelect}
            highlight={highlight}
            disabled={!calculator.canInput}
            disabledReason={disabledReason}
          />
        </div>

        <div className="app__cell app__cell--panel">
          <LastInputPanel
            entry={calculator.lastEntry}
            format={notationFormat}
            mode={calculator.mode}
          />
        </div>

        <div className="app__cell app__cell--panel">
          <ControlPanel
            mode={calculator.mode}
            canUndo={hasHistory}
            hasHistory={hasHistory}
            onUndo={calculator.undo}
            onClear={handleClearRequest}
          />
        </div>

        <div className="app__cell app__cell--panel">
          <HistoryList
            entries={calculator.entries}
            format={notationFormat}
            mode={calculator.mode}
            onRemove={calculator.removeEntry}
          />
        </div>

        <div className="app__cell app__cell--panel">
          <NotationSettings format={notationFormat} onChange={setNotationFormat} />
        </div>
      </main>

      <footer className="app__footer">
        <p>
          計算状態はブラウザに保存されません（表記設定のみ保存）。オフラインでも利用できます。
        </p>
      </footer>

      <ConfirmDialog
        open={confirmOpen}
        title={isSubtraction ? '開始値にリセットします' : 'オールクリアします'}
        message={
          isSubtraction
            ? `入力履歴${calculator.entries.length}件をすべて削除し、残り点数を開始値に戻します。よろしいですか？`
            : `入力履歴${calculator.entries.length}件をすべて削除し、合計を0に戻します。よろしいですか？`
        }
        confirmLabel={isSubtraction ? 'リセットする' : 'クリアする'}
        onConfirm={handleClearConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
