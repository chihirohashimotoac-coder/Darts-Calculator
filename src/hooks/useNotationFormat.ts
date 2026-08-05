import { useCallback, useState } from 'react';
import type { NotationFormat } from '../domain/notation';
import { loadNotationFormat, saveNotationFormat } from '../storage/notationStorage';

/**
 * 表記形式の設定。唯一 LocalStorage へ永続化する項目。
 * 変更した時点で保存し、起動時は保存値（不正なら形式A）を初期値にする。
 */
export function useNotationFormat(): [NotationFormat, (format: NotationFormat) => void] {
  const [format, setFormat] = useState<NotationFormat>(loadNotationFormat);

  const update = useCallback((next: NotationFormat) => {
    setFormat(next);
    saveNotationFormat(next);
  }, []);

  return [format, update];
}
