import { test, expect } from '@playwright/test';

test.describe('現在地取得機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('位置情報許可時に現在地の防災情報を取得できる', async ({ page }) => {
    // 位置情報の許可をモック
    await page.context().grantPermissions(['geolocation']);
    await page.setGeolocation({ latitude: 35.6762, longitude: 139.6503 });
    
    // 現在地取得モードを選択
    await page.click('[data-testid="input-mode-geolocation"]');
    
    // 現在地取得ボタンをクリック
    await page.click('[data-testid="get-location-button"]');
    
    // ローディング状態を確認
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // 防災情報が表示されることを確認
    await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible({ timeout: 10000 });
    
    // 現在地マーカーが地図上に表示されることを確認
    await expect(page.locator('[data-testid="current-location-marker"]')).toBeVisible();
  });

  test('位置情報拒否時に手動入力を促すメッセージが表示される', async ({ page }) => {
    // 位置情報の拒否をモック
    await page.context().clearPermissions();
    
    // 現在地取得モードを選択
    await page.click('[data-testid="input-mode-geolocation"]');
    
    // 現在地取得ボタンをクリック
    await page.click('[data-testid="get-location-button"]');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('位置情報の取得が拒否されました');
    
    // 手動入力を促すメッセージが表示されることを確認
    await expect(page.locator('[data-testid="manual-input-prompt"]')).toBeVisible();
    await expect(page.locator('[data-testid="manual-input-prompt"]')).toContainText('手動で住所または座標を入力してください');
  });

  test('位置情報取得タイムアウト時にエラーメッセージが表示される', async ({ page }) => {
    // 位置情報の許可はするが、タイムアウトをシミュレート
    await page.context().grantPermissions(['geolocation']);
    
    // 現在地取得モードを選択
    await page.click('[data-testid="input-mode-geolocation"]');
    
    // getCurrentPositionをモックしてタイムアウトエラーを発生させる
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any, error: any) => {
            setTimeout(() => {
              error({ code: 3, message: 'Timeout' });
            }, 100);
          }
        }
      });
    });
    
    // 現在地取得ボタンをクリック
    await page.click('[data-testid="get-location-button"]');
    
    // タイムアウトエラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('位置情報の取得がタイムアウトしました');
  });
});