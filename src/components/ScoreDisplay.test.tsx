import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from '../App';

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', {
    value,
    configurable: true,
    writable: true,
  });
}

/** jsdom は execCommand を実装していないため、テスト側で差し替える。 */
function setExecCommand(result: boolean) {
  Object.defineProperty(document, 'execCommand', {
    value: vi.fn().mockReturnValue(result),
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  Reflect.deleteProperty(document, 'execCommand');
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('現在値のコピー', () => {
  it('Clipboard API が使える場合は現在値をコピーして成功を表示する', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    render(<App />);
    fireEvent.click(screen.getByTestId('segment-t20'));
    fireEvent.click(screen.getByTestId('copy-button'));

    expect(writeText).toHaveBeenCalledWith('60');
    expect(await screen.findByText(/「60」をコピーしました/)).toBeInTheDocument();
  });

  it('Clipboard API が無い環境ではフォールバックし、失敗時はエラーを表示する', async () => {
    setClipboard(undefined);
    setExecCommand(false);

    render(<App />);
    fireEvent.click(screen.getByTestId('copy-button'));

    expect(await screen.findByText(/コピーできませんでした/)).toBeInTheDocument();
  });

  it('Clipboard API が失敗しても execCommand で成功すれば成功を表示する', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    setExecCommand(true);

    render(<App />);
    fireEvent.click(screen.getByTestId('segment-inner-bull'));
    fireEvent.click(screen.getByTestId('copy-button'));

    expect(await screen.findByText(/「50」をコピーしました/)).toBeInTheDocument();
  });
});
