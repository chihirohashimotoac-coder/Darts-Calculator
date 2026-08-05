/**
 * ダーツボードのナンバー配置。
 *
 * 盤面上部（12時方向）を 20 とし、時計回りに並ぶ標準配置。
 * 目視で SVG に直接書き込まず、この配列を唯一の情報源として
 * セグメント定義・座標計算・表示のすべてを生成する。
 */
export const BOARD_NUMBERS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
] as const;

export type BoardNumber = (typeof BOARD_NUMBERS)[number];

/** 1 セグメントあたりの角度（度）。20 分割なので 18 度。 */
export const SEGMENT_ANGLE = 360 / BOARD_NUMBERS.length;

/**
 * 配列インデックスから、そのウェッジの中心角度（度）を返す。
 * SVG の座標系は y 軸が下向きなので、真上は -90 度。
 */
export function centerAngleOf(index: number): number {
  return -90 + SEGMENT_ANGLE * index;
}

/** 指定インデックスのウェッジの開始・終了角度（度）を返す。 */
export function angleRangeOf(index: number): { start: number; end: number } {
  const center = centerAngleOf(index);
  return { start: center - SEGMENT_ANGLE / 2, end: center + SEGMENT_ANGLE / 2 };
}
