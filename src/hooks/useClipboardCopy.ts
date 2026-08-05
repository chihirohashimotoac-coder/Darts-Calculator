import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyFeedback = { status: 'success' | 'error'; message: string } | null;

const FEEDBACK_DURATION_MS = 2600;

/** Clipboard API が使えない環境向けのフォールバック。 */
function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '-1000px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  try {
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * 現在値のクリップボードコピー。
 * Clipboard API → execCommand の順に試し、結果を画面フィードバックとして返す。
 */
export function useClipboardCopy() {
  const [feedback, setFeedback] = useState<CopyFeedback>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const publish = useCallback((next: NonNullable<CopyFeedback>) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    setFeedback(next);
    timerRef.current = setTimeout(() => {
      setFeedback(null);
      timerRef.current = null;
    }, FEEDBACK_DURATION_MS);
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          publish({ status: 'success', message: `「${text}」をコピーしました` });
          return true;
        }
      } catch {
        // 権限拒否や非セキュアコンテキストではフォールバックへ進む。
      }

      if (legacyCopy(text)) {
        publish({ status: 'success', message: `「${text}」をコピーしました` });
        return true;
      }

      publish({
        status: 'error',
        message: 'コピーできませんでした。表示中の数値を手動で選択してください。',
      });
      return false;
    },
    [publish],
  );

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  return { feedback, copy };
}
