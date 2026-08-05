import { memo, useMemo } from 'react';
import { SEGMENTS, type SegmentDefinition } from '../domain/segments';
import {
  RADII,
  VIEWBOX,
  buildNumberLabelPositions,
  buildSegmentPath,
  buildWireLines,
} from '../geometry/dartboardGeometry';
import type { SegmentHighlight } from '../hooks/useSegmentHighlight';
import './Dartboard.css';

interface DartboardProps {
  onSegmentSelect: (segment: SegmentDefinition) => void;
  highlight: SegmentHighlight | null;
  disabled: boolean;
  /** 入力できない理由（開始値が不正な場合など）。 */
  disabledReason?: string;
}

/** セグメント定義から一度だけ生成する描画データ。 */
const SEGMENT_PATHS: ReadonlyArray<{ segment: SegmentDefinition; d: string }> = SEGMENTS.map(
  (segment) => ({ segment, d: buildSegmentPath(segment) }),
);

const NUMBER_LABELS = buildNumberLabelPositions();
const WIRE_LINES = buildWireLines();

function DartboardComponent({
  onSegmentSelect,
  highlight,
  disabled,
  disabledReason,
}: DartboardProps) {
  const highlightPath = useMemo(() => {
    if (!highlight) return null;
    const found = SEGMENT_PATHS.find((item) => item.segment.id === highlight.segmentId);
    return found ? found.d : null;
  }, [highlight]);

  return (
    <div className="dartboard" data-testid="dartboard">
      <svg
        viewBox={VIEWBOX}
        className="dartboard__svg"
        role="group"
        aria-label="ダーツボード (Dartboard). 得点領域を選択すると計算に入力されます。"
        aria-disabled={disabled}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 背景と盤面の境界を明確にするための外周リング（装飾・操作対象外） */}
        <circle className="dartboard__backdrop" cx={0} cy={0} r={RADII.missOuter} />

        {SEGMENT_PATHS.map(({ segment, d }) => (
          <path
            key={segment.id}
            id={segment.id}
            data-testid={segment.id}
            data-segment-ring={segment.ring}
            className={`dartboard__segment dartboard__segment--${segment.colorGroup}`}
            d={d}
            fillRule={segment.ring === 'miss' ? 'evenodd' : undefined}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={segment.ariaLabel}
            aria-disabled={disabled}
            /*
             * 入力は click のみで受ける。touchstart 等を併用すると
             * タッチ環境で二重入力になるため、意図的に登録しない。
             */
            onClick={() => {
              if (!disabled) onSegmentSelect(segment);
            }}
            onKeyDown={(event) => {
              if (disabled) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSegmentSelect(segment);
              }
            }}
          />
        ))}

        {/* ワイヤー（セグメント境界の視認性向上・操作対象外） */}
        <g className="dartboard__wires" aria-hidden="true">
          {WIRE_LINES.map((line, index) => (
            <line key={index} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
          ))}
          <circle cx={0} cy={0} r={RADII.doubleOuter} />
          <circle cx={0} cy={0} r={RADII.doubleInner} />
          <circle cx={0} cy={0} r={RADII.tripleOuter} />
          <circle cx={0} cy={0} r={RADII.tripleInner} />
          <circle cx={0} cy={0} r={RADII.outerBull} />
          <circle cx={0} cy={0} r={RADII.innerBull} />
        </g>

        {/* 外周のナンバー表示（操作対象外。クリックは背面の MISS 領域が受ける） */}
        <g className="dartboard__numbers" aria-hidden="true">
          {NUMBER_LABELS.map((label) => (
            <text key={label.value} x={label.x} y={label.y}>
              {label.value}
            </text>
          ))}
        </g>

        {/* タップハイライト。nonce を key にして連続タップでも再生し直す */}
        {highlight && highlightPath && (
          <path
            key={highlight.nonce}
            className="dartboard__highlight"
            data-testid="segment-highlight"
            data-highlight-target={highlight.segmentId}
            d={highlightPath}
            fillRule="evenodd"
            aria-hidden="true"
          />
        )}

        {disabled && (
          <circle
            className="dartboard__veil"
            cx={0}
            cy={0}
            r={RADII.missOuter}
            aria-hidden="true"
          />
        )}
      </svg>

      {disabled && disabledReason && (
        <p className="dartboard__disabled-reason" data-testid="board-disabled-reason">
          {disabledReason}
        </p>
      )}
    </div>
  );
}

export const Dartboard = memo(DartboardComponent);
