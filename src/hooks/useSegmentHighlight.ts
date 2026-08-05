import { useCallback, useEffect, useRef, useState } from 'react';

export interface SegmentHighlight {
  segmentId: string;
  /** 連続タップでもアニメーションを確実に再生し直すための通し番号。 */
  nonce: number;
}

export const HIGHLIGHT_DURATION_MS = 450;

/**
 * タップしたセグメントの一時ハイライト。
 *
 * 盤面本来の色は変更せず、上に重ねる専用要素の表示だけを制御する。
 * 連続タップ時は nonce を更新して再マウントさせるため、表示が破綻しない。
 */
export function useSegmentHighlight(durationMs = HIGHLIGHT_DURATION_MS) {
  const [highlight, setHighlight] = useState<SegmentHighlight | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nonceRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const trigger = useCallback(
    (segmentId: string) => {
      clearTimer();
      nonceRef.current += 1;
      setHighlight({ segmentId, nonce: nonceRef.current });
      timerRef.current = setTimeout(() => {
        setHighlight(null);
        timerRef.current = null;
      }, durationMs);
    },
    [clearTimer, durationMs],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return { highlight, trigger };
}
