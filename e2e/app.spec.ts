import { expect, test, type Page } from '@playwright/test';

const BOARD_NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

/** 通常のセグメントは重心付近をクリックできる。 */
async function tapSegment(page: Page, segmentId: string) {
  await page.getByTestId(segmentId).click();
}

/**
 * バウンディングボックス中心が領域外になるセグメント（円環・同心円）向け。
 * 中心からの相対位置を指定してクリックする。
 */
async function tapSegmentAt(page: Page, segmentId: string, relX: number, relY: number) {
  const target = page.getByTestId(segmentId);
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  await target.click({ position: { x: box!.width * relX, y: box!.height * relY } });
}

/** MISS はドーナツ状のため、ダブルリングより外側にあたる上端付近をクリックする。 */
async function tapMiss(page: Page) {
  await tapSegmentAt(page, 'segment-miss', 0.5, 0.035);
}

/** アウターブルは中心にインナーブルが重なるため、少し外した位置をクリックする。 */
async function tapOuterBull(page: Page) {
  await tapSegmentAt(page, 'segment-outer-bull', 0.5, 0.15);
}

async function currentValue(page: Page): Promise<string> {
  return (await page.getByTestId('current-value').innerText()).trim();
}

async function switchToSubtraction(page: Page, startValue: string) {
  await page.getByTestId('mode-subtraction').click();
  await page.getByTestId('start-value-input').fill(startValue);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('表示', () => {
  test('アプリとSVGダーツボードが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'SVGダーツボード電卓' })).toBeVisible();
    await expect(page.getByTestId('dartboard')).toBeVisible();
    await expect(page.locator('.dartboard__svg')).toBeVisible();
  });

  test('83領域すべてがタップ可能要素として存在する', async ({ page }) => {
    await expect(page.locator('path[data-testid^="segment-"]')).toHaveCount(83);
  });

  test('外周のナンバーが標準配置（20から時計回り）で表示される', async ({ page }) => {
    const numbers = await page.locator('.dartboard__numbers text').allTextContents();
    expect(numbers.map((value) => Number(value))).toEqual(BOARD_NUMBERS);
  });

  test('得点領域にスクリーンリーダー向けの名前が設定されている', async ({ page }) => {
    await expect(page.getByTestId('segment-t20')).toHaveAttribute(
      'aria-label',
      /Triple 20, 60 points/,
    );
    await expect(page.getByTestId('segment-inner-bull')).toHaveAttribute(
      'aria-label',
      /Inner bull, 50 points/,
    );
  });
});

test.describe('足し算モード', () => {
  test('T20 をクリックすると60点が入力される', async ({ page }) => {
    await tapSegment(page, 'segment-t20');
    expect(await currentValue(page)).toBe('60');
  });

  test('D20 をクリックすると40点が入力される', async ({ page }) => {
    await tapSegment(page, 'segment-d20');
    expect(await currentValue(page)).toBe('40');
  });

  test('インナーブルは50点、アウターブルは25点が入力される', async ({ page }) => {
    await tapSegment(page, 'segment-inner-bull');
    expect(await currentValue(page)).toBe('50');

    await tapOuterBull(page);
    expect(await currentValue(page)).toBe('75');
  });

  test('MISS領域をクリックすると0点が履歴へ追加される', async ({ page }) => {
    await tapMiss(page);
    expect(await currentValue(page)).toBe('0');
    await expect(page.getByTestId('history-item')).toHaveCount(1);
    await expect(page.getByTestId('history-throw').first()).toHaveText('MISS：0');
  });

  test('盤面外の余白をクリックしても入力されない', async ({ page }) => {
    await page.getByRole('heading', { name: 'SVGダーツボード電卓' }).click();
    await expect(page.getByTestId('history-empty')).toBeVisible();
    expect(await currentValue(page)).toBe('0');
  });

  test('複数回入力できる（T20 → S20 → D10 で100）', async ({ page }) => {
    await tapSegment(page, 'segment-t20');
    await tapSegment(page, 'segment-s20-outer');
    await tapSegment(page, 'segment-d10');
    expect(await currentValue(page)).toBe('100');
    await expect(page.getByTestId('history-item')).toHaveCount(3);
  });

  test('タップしたセグメントがハイライトされる', async ({ page }) => {
    await tapSegment(page, 'segment-t20');
    await expect(page.getByTestId('segment-highlight')).toHaveAttribute(
      'data-highlight-target',
      'segment-t20',
    );
  });

  test('1回のクリックで二重入力されない', async ({ page }) => {
    await tapSegment(page, 'segment-t20');
    await expect(page.getByTestId('history-item')).toHaveCount(1);
    expect(await currentValue(page)).toBe('60');
  });
});

test.describe('引き算モード', () => {
  test('モードを切り替えて開始値を入力し、結果が更新される', async ({ page }) => {
    await switchToSubtraction(page, '501');
    await expect(page.getByTestId('mode-subtraction')).toHaveAttribute('aria-pressed', 'true');
    expect(await currentValue(page)).toBe('501');

    await tapSegment(page, 'segment-t20');
    expect(await currentValue(page)).toBe('441');
    await tapSegment(page, 'segment-t20');
    await tapSegment(page, 'segment-t20');
    expect(await currentValue(page)).toBe('321');
  });

  test('BUST時に超過点数が表示され、残り点数は変わらない', async ({ page }) => {
    await switchToSubtraction(page, '32');
    await tapSegment(page, 'segment-t20');

    await expect(page.getByTestId('bust-message')).toHaveText('BUST：28点オーバー');
    expect(await currentValue(page)).toBe('32');

    await tapSegment(page, 'segment-d16');
    expect(await currentValue(page)).toBe('0');
  });

  test('開始値が不正な間は入力できず理由が表示される', async ({ page }) => {
    await switchToSubtraction(page, '');
    await expect(page.getByTestId('start-value-error')).toContainText('開始値を入力してください');
    await expect(page.getByTestId('board-disabled-reason')).toBeVisible();
    await expect(page.getByTestId('segment-t20')).toHaveAttribute('aria-disabled', 'true');

    // 無効状態でも強制的にクリックして、入力が発生しないことを確認する
    await page.getByTestId('segment-t20').click({ force: true });
    await expect(page.getByTestId('history-empty')).toBeVisible();
  });

  test('開始値を変更すると履歴全体が再計算される', async ({ page }) => {
    await switchToSubtraction(page, '501');
    await tapSegment(page, 'segment-t20');
    await tapSegment(page, 'segment-t20');
    expect(await currentValue(page)).toBe('381');

    await page.getByTestId('start-value-input').fill('100');
    expect(await currentValue(page)).toBe('40');
    await expect(page.getByTestId('bust-message')).toHaveText('BUST：20点オーバー');
  });

  test('モードを切り替えても各モードの状態が保持される', async ({ page }) => {
    await tapSegment(page, 'segment-t20');
    await tapSegment(page, 'segment-d20');
    expect(await currentValue(page)).toBe('100');

    await switchToSubtraction(page, '501');
    await tapSegment(page, 'segment-t20');
    expect(await currentValue(page)).toBe('441');

    await page.getByTestId('mode-addition').click();
    expect(await currentValue(page)).toBe('100');
  });
});

test.describe('履歴操作', () => {
  test('一つ戻るが機能する', async ({ page }) => {
    await tapSegment(page, 'segment-t20');
    await tapSegment(page, 'segment-d10');
    expect(await currentValue(page)).toBe('80');

    await page.getByTestId('undo-button').click();
    expect(await currentValue(page)).toBe('60');
    await expect(page.getByTestId('history-item')).toHaveCount(1);
  });

  test('任意履歴削除が機能する', async ({ page }) => {
    await tapSegment(page, 'segment-t20');
    await tapSegment(page, 'segment-s20-outer');
    await tapSegment(page, 'segment-d10');
    expect(await currentValue(page)).toBe('100');

    // 新しい順表示のため、2件目が S20
    await page.getByTestId('history-item').nth(1).getByTestId('history-remove').click();
    expect(await currentValue(page)).toBe('80');
    await expect(page.getByTestId('history-item')).toHaveCount(2);
  });

  test('引き算モードで途中の履歴を削除するとBUST判定を含めて再計算される', async ({ page }) => {
    await switchToSubtraction(page, '100');
    await tapSegment(page, 'segment-d16');
    await tapSegment(page, 'segment-t20');
    await tapSegment(page, 'segment-t20');
    await expect(page.getByTestId('bust-message')).toHaveText('BUST：52点オーバー');
    expect(await currentValue(page)).toBe('8');

    // 一番古い D16 を削除する（新しい順表示なので末尾）
    await page.getByTestId('history-item').last().getByTestId('history-remove').click();
    expect(await currentValue(page)).toBe('40');
    await expect(page.getByTestId('bust-message')).toHaveText('BUST：20点オーバー');
  });

  test('オールクリアが機能する（確認ダイアログあり）', async ({ page }) => {
    await tapSegment(page, 'segment-t20');
    await page.getByTestId('all-clear-button').click();
    await expect(page.getByTestId('confirm-dialog')).toBeVisible();

    await page.getByTestId('confirm-cancel').click();
    expect(await currentValue(page)).toBe('60');

    await page.getByTestId('all-clear-button').click();
    await page.getByTestId('confirm-accept').click();
    expect(await currentValue(page)).toBe('0');
    await expect(page.getByTestId('history-empty')).toBeVisible();
  });

  test('引き算モードの「開始値にリセット」で開始値へ戻る', async ({ page }) => {
    await switchToSubtraction(page, '301');
    await tapSegment(page, 'segment-t20');
    expect(await currentValue(page)).toBe('241');

    await expect(page.getByTestId('all-clear-button')).toContainText('開始値にリセット');
    await page.getByTestId('all-clear-button').click();
    await page.getByTestId('confirm-accept').click();

    expect(await currentValue(page)).toBe('301');
    await expect(page.getByTestId('start-value-input')).toHaveValue('301');
  });
});

test.describe('表記設定', () => {
  test('3種類の表記形式へ変更でき、既存履歴へ即時反映される', async ({ page }) => {
    await tapSegment(page, 'segment-t20');
    await expect(page.getByTestId('history-throw').first()).toHaveText('T20：60');

    await page.getByTestId('notation-radio-name').check();
    await expect(page.getByTestId('history-throw').first()).toHaveText('T20');
    await expect(page.getByTestId('last-input-value')).toHaveText('T20');

    await page.getByTestId('notation-radio-score').check();
    await expect(page.getByTestId('history-throw').first()).toHaveText('60');

    await page.getByTestId('notation-radio-name-score').check();
    await expect(page.getByTestId('history-throw').first()).toHaveText('T20：60');
  });

  test('表記設定はリロード後も保持され、計算状態は保持されない', async ({ page }) => {
    await page.getByTestId('notation-radio-score').check();
    await tapSegment(page, 'segment-t20');
    expect(await currentValue(page)).toBe('60');

    await page.reload();

    // 計算状態は初期化される
    expect(await currentValue(page)).toBe('0');
    await expect(page.getByTestId('history-empty')).toBeVisible();

    // 表記設定は保持される
    await expect(page.getByTestId('notation-radio-score')).toBeChecked();
    await tapSegment(page, 'segment-t20');
    await expect(page.getByTestId('history-throw').first()).toHaveText('60');
  });

  test('LocalStorage に保存されるのは表記設定だけ', async ({ page }) => {
    await switchToSubtraction(page, '501');
    await tapSegment(page, 'segment-t20');

    const storage = await page.evaluate(() => ({
      local: Object.entries(localStorage),
      session: Object.entries(sessionStorage),
    }));

    expect(storage.session).toHaveLength(0);
    expect(storage.local.every(([key]) => key === 'darts-calculator:notation-format')).toBe(true);
  });
});

test.describe('コピー', () => {
  test('現在値をコピーでき、フィードバックが表示される', async ({ page, browserName }) => {
    if (browserName === 'chromium') {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    }

    await tapSegment(page, 'segment-t20');
    await page.getByTestId('copy-button').click();

    // 成功・失敗どちらの場合でも必ずフィードバックが表示される
    await expect(page.getByTestId('copy-feedback')).not.toBeEmpty();
    await expect(page.getByTestId('copy-feedback')).toContainText(/コピー/);
  });
});

test.describe('レスポンシブ', () => {
  test('スマートフォン相当の画面幅で横スクロールが発生しない', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await tapSegment(page, 'segment-t20');
    await switchToSubtraction(page, '501');
    await tapSegment(page, 'segment-t20');

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test('PC相当の画面幅でも横スクロールが発生しない', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });
});
