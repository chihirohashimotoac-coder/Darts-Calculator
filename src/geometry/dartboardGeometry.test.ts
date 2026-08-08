import { describe, expect, it } from 'vitest';
import { SEGMENTS, getSegmentById } from '../domain/segments';
import {
  MIN_RING_WIDTH,
  RADII,
  buildNumberLabelPositions,
  buildSegmentPath,
  polarToCartesian,
} from './dartboardGeometry';

describe('polarToCartesian', () => {
  it('-90度は真上（y が負）になる', () => {
    const point = polarToCartesian(100, -90);
    expect(point.x).toBeCloseTo(0, 6);
    expect(point.y).toBeCloseTo(-100, 6);
  });

  it('0度は右方向になる', () => {
    const point = polarToCartesian(100, 0);
    expect(point.x).toBeCloseTo(100, 6);
    expect(point.y).toBeCloseTo(0, 6);
  });
});

describe('buildSegmentPath', () => {
  it('全83領域のパスを生成できる', () => {
    for (const segment of SEGMENTS) {
      const path = buildSegmentPath(segment);
      expect(path.startsWith('M ')).toBe(true);
      expect(path.endsWith('Z')).toBe(true);
      expect(path).not.toContain('NaN');
    }
  });

  it('リングの半径が内側から外側の順に並んでいる', () => {
    expect(RADII.innerBull).toBeLessThan(RADII.outerBull);
    expect(RADII.outerBull).toBeLessThan(RADII.tripleInner);
    expect(RADII.tripleInner).toBeLessThan(RADII.tripleOuter);
    expect(RADII.tripleOuter).toBeLessThan(RADII.doubleInner);
    expect(RADII.doubleInner).toBeLessThan(RADII.doubleOuter);
    expect(RADII.doubleOuter).toBeLessThan(RADII.missOuter);
  });

  it('トリプル・ダブル・ブルがタップしやすい幅を確保している', () => {
    const tripleWidth = RADII.tripleOuter - RADII.tripleInner;
    const doubleWidth = RADII.doubleOuter - RADII.doubleInner;
    const outerBullWidth = RADII.outerBull - RADII.innerBull;

    expect(tripleWidth).toBeGreaterThanOrEqual(MIN_RING_WIDTH);
    expect(doubleWidth).toBeGreaterThanOrEqual(MIN_RING_WIDTH);
    expect(outerBullWidth).toBeGreaterThanOrEqual(MIN_RING_WIDTH);
    // インナーブルは円なので、直径で同等のタップ幅を確保する
    expect(RADII.innerBull * 2).toBeGreaterThanOrEqual(MIN_RING_WIDTH);
  });

  it('シングル領域はリングを広げてもリングより広いままである', () => {
    const innerSingleWidth = RADII.tripleInner - RADII.outerBull;
    const outerSingleWidth = RADII.doubleInner - RADII.tripleOuter;
    expect(innerSingleWidth).toBeGreaterThan(RADII.tripleOuter - RADII.tripleInner);
    expect(outerSingleWidth).toBeGreaterThan(RADII.doubleOuter - RADII.doubleInner);
  });

  it('MISSはダブルリングより外側の円環である', () => {
    const miss = getSegmentById('segment-miss');
    expect(miss).toBeDefined();
    const path = buildSegmentPath(miss!);
    expect(path).toContain(String(-RADII.missOuter));
    expect(path).toContain(String(-RADII.doubleOuter));
  });
});

describe('buildNumberLabelPositions', () => {
  it('20が最上部に配置される', () => {
    const positions = buildNumberLabelPositions();
    expect(positions).toHaveLength(20);
    const twenty = positions[0];
    expect(twenty.value).toBe(20);
    expect(twenty.x).toBeCloseTo(0, 2);
    expect(twenty.y).toBeCloseTo(-RADII.numberRing, 2);
  });

  it('時計回りに 20 → 1 → 18 の順で並ぶ', () => {
    const positions = buildNumberLabelPositions();
    expect(positions.slice(0, 3).map((item) => item.value)).toEqual([20, 1, 18]);
    // 20 の次（1）は右上（x > 0, y < 0）
    expect(positions[1].x).toBeGreaterThan(0);
    expect(positions[1].y).toBeLessThan(0);
  });
});
