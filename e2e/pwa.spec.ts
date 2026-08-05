import { expect, test } from '@playwright/test';

test.describe('PWA', () => {
  test('Web App Manifest が配信され、インストール要件を満たす', async ({ page, request }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBeTruthy();

    const response = await request.get(new URL(href!, 'http://127.0.0.1:4173/').toString());
    expect(response.ok()).toBe(true);

    const manifest = (await response.json()) as {
      name: string;
      display: string;
      theme_color: string;
      start_url: string;
      icons: Array<{ sizes: string; purpose?: string }>;
    };

    expect(manifest.name).toBe('SVGダーツボード電卓');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0d0f13');
    expect(manifest.icons.map((icon) => icon.sizes)).toContain('192x192');
    expect(manifest.icons.map((icon) => icon.sizes)).toContain('512x512');
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });

  test('Service Worker が登録され、オフラインでも起動して計算できる', async ({
    page,
    context,
  }) => {
    await page.goto('/');

    // Service Worker がページを制御するまで待つ
    await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, {
      timeout: 20_000,
    });

    await context.setOffline(true);
    await page.reload();

    await expect(page.getByTestId('dartboard')).toBeVisible();
    await page.getByTestId('segment-t20').click();
    await expect(page.getByTestId('current-value')).toHaveText('60');

    await page.getByTestId('mode-subtraction').click();
    await page.getByTestId('start-value-input').fill('100');
    await page.getByTestId('segment-t20').click();
    await expect(page.getByTestId('current-value')).toHaveText('40');

    await page.getByTestId('undo-button').click();
    await expect(page.getByTestId('current-value')).toHaveText('100');

    await context.setOffline(false);
  });
});
