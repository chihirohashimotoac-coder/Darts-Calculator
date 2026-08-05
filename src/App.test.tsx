import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { NOTATION_STORAGE_KEY } from './storage/notationStorage';

function tapSegment(segmentId: string) {
  fireEvent.click(screen.getByTestId(segmentId));
}

function currentValue(): string {
  return screen.getByTestId('current-value').textContent ?? '';
}

function historyItems(): HTMLElement[] {
  return screen.queryAllByTestId('history-item');
}

function switchToSubtraction(startValue = '501') {
  fireEvent.click(screen.getByTestId('mode-subtraction'));
  fireEvent.change(screen.getByTestId('start-value-input'), { target: { value: startValue } });
}

describe('App - 表示と基本操作', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('アプリ名とダーツボードが表示される', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'SVGダーツボード電卓' })).toBeInTheDocument();
    expect(screen.getByTestId('dartboard')).toBeInTheDocument();
    expect(screen.getByTestId('segment-t20')).toBeInTheDocument();
    expect(screen.getByTestId('segment-inner-bull')).toBeInTheDocument();
    expect(screen.getByTestId('segment-miss')).toBeInTheDocument();
  });

  it('83領域すべてが個別のタップ可能要素として存在する', () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('path[data-testid^="segment-"]')).toHaveLength(83);
  });

  it('得点領域にスクリーンリーダー向けの名前が設定されている', () => {
    render(<App />);
    expect(screen.getByTestId('segment-t20')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Triple 20, 60 points'),
    );
    expect(screen.getByTestId('segment-inner-bull')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Inner bull, 50 points'),
    );
  });
});

describe('App - 足し算モード', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('初期値は0', () => {
    render(<App />);
    expect(currentValue()).toContain('0');
    expect(screen.getByTestId('history-empty')).toBeInTheDocument();
  });

  it('T20 → S20 → D10 で 100 になる', () => {
    render(<App />);
    tapSegment('segment-t20');
    expect(currentValue()).toContain('60');
    tapSegment('segment-s20-outer');
    expect(currentValue()).toContain('80');
    tapSegment('segment-d10');
    expect(currentValue()).toContain('100');
  });

  it('BULLとMISSが正しく計算される', () => {
    render(<App />);
    tapSegment('segment-inner-bull');
    expect(currentValue()).toContain('50');
    tapSegment('segment-outer-bull');
    expect(currentValue()).toContain('75');
    tapSegment('segment-miss');
    expect(currentValue()).toContain('75');
    expect(historyItems()).toHaveLength(3);
  });

  it('キーボード（Enter）でも入力できる', () => {
    render(<App />);
    fireEvent.keyDown(screen.getByTestId('segment-d20'), { key: 'Enter' });
    expect(currentValue()).toContain('40');
  });

  it('タップしたセグメントが一時的にハイライトされる', () => {
    render(<App />);
    expect(screen.queryByTestId('segment-highlight')).not.toBeInTheDocument();
    tapSegment('segment-t20');
    expect(screen.getByTestId('segment-highlight')).toHaveAttribute(
      'data-highlight-target',
      'segment-t20',
    );
  });

  it('一つ戻るで直前の入力が取り消される', () => {
    render(<App />);
    tapSegment('segment-t20');
    tapSegment('segment-d10');
    expect(currentValue()).toContain('80');

    fireEvent.click(screen.getByTestId('undo-button'));
    expect(currentValue()).toContain('60');
    expect(historyItems()).toHaveLength(1);
  });

  it('任意の履歴を削除すると再計算される', () => {
    render(<App />);
    tapSegment('segment-t20');
    tapSegment('segment-s20-outer');
    tapSegment('segment-d10');
    expect(currentValue()).toContain('100');

    // 新しい順表示なので、2投目（S20）は中央の項目
    const items = historyItems();
    fireEvent.click(within(items[1]).getByTestId('history-remove'));

    expect(currentValue()).toContain('80');
    expect(historyItems()).toHaveLength(2);
  });

  it('オールクリアは確認ダイアログを経て実行される', () => {
    render(<App />);
    tapSegment('segment-t20');

    fireEvent.click(screen.getByTestId('all-clear-button'));
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-cancel'));
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    expect(currentValue()).toContain('60');

    fireEvent.click(screen.getByTestId('all-clear-button'));
    fireEvent.click(screen.getByTestId('confirm-accept'));
    expect(currentValue()).toContain('0');
    expect(screen.getByTestId('history-empty')).toBeInTheDocument();
  });
});

describe('App - 引き算モード', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('開始値からの引き算ができる', () => {
    render(<App />);
    switchToSubtraction('501');
    expect(currentValue()).toContain('501');

    tapSegment('segment-t20');
    tapSegment('segment-t20');
    tapSegment('segment-t20');
    expect(currentValue()).toContain('321');
  });

  it('0未満になる入力だけがBUSTになり、超過点数が表示される', () => {
    render(<App />);
    switchToSubtraction('32');

    tapSegment('segment-t20');
    expect(screen.getByTestId('bust-message')).toHaveTextContent('BUST：28点オーバー');
    expect(currentValue()).toContain('32');

    // BUST 前と同じ残り点数から継続する
    tapSegment('segment-d16');
    expect(currentValue()).toContain('0');
  });

  it('得点と残り点数が同じならセグメント種別に関係なく0になる', () => {
    render(<App />);
    switchToSubtraction('20');
    tapSegment('segment-s20-inner');
    expect(currentValue()).toContain('0');
    expect(screen.queryByTestId('bust-message')).not.toBeInTheDocument();
  });

  it('残り1点も有効な状態として扱う', () => {
    render(<App />);
    switchToSubtraction('21');
    tapSegment('segment-s20-outer');
    expect(currentValue()).toContain('1');
    expect(screen.queryByTestId('bust-message')).not.toBeInTheDocument();
  });

  it('開始値を変更すると履歴全体が再計算される', () => {
    render(<App />);
    switchToSubtraction('501');
    tapSegment('segment-t20');
    tapSegment('segment-t20');
    expect(currentValue()).toContain('381');

    fireEvent.change(screen.getByTestId('start-value-input'), { target: { value: '100' } });
    expect(currentValue()).toContain('40');
    expect(screen.getByTestId('bust-message')).toHaveTextContent('BUST：20点オーバー');
  });

  it('開始値が不正な間は入力を無効にし、理由を表示する', () => {
    render(<App />);
    switchToSubtraction('abc');

    expect(screen.getByTestId('start-value-error')).toHaveTextContent('数字以外は入力できません');
    expect(screen.getByTestId('board-disabled-reason')).toBeInTheDocument();

    tapSegment('segment-t20');
    expect(historyItems()).toHaveLength(0);
  });

  it('未入力・小数・負数を適切に扱う', () => {
    render(<App />);
    switchToSubtraction('');
    expect(screen.getByTestId('start-value-error')).toHaveTextContent('開始値を入力してください');

    fireEvent.change(screen.getByTestId('start-value-input'), { target: { value: '10.5' } });
    expect(screen.getByTestId('start-value-error')).toHaveTextContent('小数は使用できません');

    fireEvent.change(screen.getByTestId('start-value-input'), { target: { value: '-3' } });
    expect(screen.getByTestId('start-value-error')).toHaveTextContent('負の数は使用できません');
  });

  it('開始値にリセットすると履歴だけが消える', () => {
    render(<App />);
    switchToSubtraction('301');
    tapSegment('segment-t20');
    expect(currentValue()).toContain('241');

    fireEvent.click(screen.getByTestId('all-clear-button'));
    fireEvent.click(screen.getByTestId('confirm-accept'));

    expect(currentValue()).toContain('301');
    expect(screen.getByTestId('start-value-input')).toHaveValue('301');
  });
});

describe('App - モード別の状態保持', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('モードを切り替えても各モードの状態が保持される', () => {
    render(<App />);
    tapSegment('segment-t20');
    tapSegment('segment-d20');
    expect(currentValue()).toContain('100');

    switchToSubtraction('501');
    tapSegment('segment-t20');
    expect(currentValue()).toContain('441');

    fireEvent.click(screen.getByTestId('mode-addition'));
    expect(currentValue()).toContain('100');
    expect(historyItems()).toHaveLength(2);
  });
});

describe('App - 表記設定', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('3形式を切り替えると既存の履歴表示へ即時反映される', () => {
    render(<App />);
    tapSegment('segment-t20');
    expect(screen.getByTestId('history-throw')).toHaveTextContent('T20：60');

    fireEvent.click(screen.getByTestId('notation-radio-name'));
    expect(screen.getByTestId('history-throw')).toHaveTextContent('T20');
    expect(screen.getByTestId('last-input-value')).toHaveTextContent('T20');

    fireEvent.click(screen.getByTestId('notation-radio-score'));
    expect(screen.getByTestId('history-throw')).toHaveTextContent('60');
  });

  it('表記設定はLocalStorageへ保存される', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('notation-radio-score'));
    expect(window.localStorage.getItem(NOTATION_STORAGE_KEY)).toBe('score');
  });

  it('保存済みの設定を起動時に読み込む', () => {
    window.localStorage.setItem(NOTATION_STORAGE_KEY, 'name');
    render(<App />);
    tapSegment('segment-d16');
    expect(screen.getByTestId('history-throw')).toHaveTextContent('D16');
    expect(screen.getByTestId('history-throw')).not.toHaveTextContent('：');
  });

  it('不正な保存値は形式Aへフォールバックする', () => {
    window.localStorage.setItem(NOTATION_STORAGE_KEY, 'unexpected');
    render(<App />);
    tapSegment('segment-d16');
    expect(screen.getByTestId('history-throw')).toHaveTextContent('D16：32');
  });
});

describe('App - 永続保存しないデータ', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('計算状態はLocalStorage / SessionStorage へ保存されない', () => {
    render(<App />);
    tapSegment('segment-t20');
    switchToSubtraction('501');
    tapSegment('segment-t20');

    expect(Object.keys(window.sessionStorage)).toHaveLength(0);
    expect(Object.keys(window.localStorage)).not.toContain('darts-calculator:state');

    const stored = Object.entries(window.localStorage).map(([, value]) => String(value));
    expect(stored.join(',')).not.toContain('501');
    expect(stored.join(',')).not.toContain('T20');
  });
});
