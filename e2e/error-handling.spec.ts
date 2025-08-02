import { test, expect } from '@playwright/test';

test.describe('エラーハンドリング機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ネットワークエラー時に適切なエラーメッセージが表示される', async ({ page }) => {
    // ネットワークリクエストをモックしてエラーを発生させる
    await page.route('**/api/disaster-info/**', (route) => {
      route.abort('failed');
    });
    
    // 住所入力モードを選択
    await page.click('[data-testid="input-mode-address"]');
    
    // 住所を入力
    await page.fill('[data-testid="address-input"]', '東京都千代田区丸の内1-1-1');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('通信エラーが発生しました');
    
    // リトライボタンが表示されることを確認
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('サーバーエラー時に適切なエラーメッセージが表示される', async ({ page }) => {
    // サーバーエラーをモック
    await page.route('**/api/location/resolve', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // 住所入力モードを選択
    await page.click('[data-testid="input-mode-address"]');
    
    // 住所を入力
    await page.fill('[data-testid="address-input"]', '東京都千代田区丸の内1-1-1');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('サーバーエラーが発生しました');
  });

  test('タイムアウト時に適切なエラーメッセージが表示される', async ({ page }) => {
    // タイムアウトをモック
    await page.route('**/api/disaster-info/**', async (route) => {
      // 15秒後に応答するが、テストのタイムアウト設定より長い時間を設定
      await new Promise(resolve => setTimeout(resolve, 15000));
      route.fulfill({
        status: 200,
        body: JSON.stringify({ data: {} })
      });
    });
    
    // 住所入力モードを選択
    await page.click('[data-testid="input-mode-address"]');
    
    // 住所を入力
    await page.fill('[data-testid="address-input"]', '東京都千代田区丸の内1-1-1');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // タイムアウトエラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('タイムアウトしました');
  });

  test('古い情報の警告が表示される', async ({ page }) => {
    // 古い情報を返すようにモック
    await page.route('**/api/disaster-info/**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          hazards: [
            {
              type: 'flood',
              riskLevel: 'high',
              description: '洪水リスク',
              source: '国土交通省',
              lastUpdated: '2020-01-01T00:00:00.000Z' // 古い日付
            }
          ],
          shelters: [],
          history: []
        })
      });
    });
    
    // 住所入力モードを選択
    await page.click('[data-testid="input-mode-address"]');
    
    // 住所を入力
    await page.fill('[data-testid="address-input"]', '東京都千代田区丸の内1-1-1');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // 古い情報の警告が表示されることを確認
    await expect(page.locator('[data-testid="outdated-warning"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="outdated-warning"]')).toContainText('情報が古い可能性があります');
  });

  test('入力フォームのバリデーションエラーが適切に表示される', async ({ page }) => {
    // 各入力モードでバリデーションエラーをテスト
    
    // 1. 住所入力
    await page.click('[data-testid="input-mode-address"]');
    await page.click('[data-testid="search-button"]');
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('住所を入力してください');
    
    // 2. 緯度経度入力
    await page.click('[data-testid="input-mode-coordinates"]');
    await page.fill('[data-testid="latitude-input"]', '100'); // 範囲外の値
    await page.fill('[data-testid="longitude-input"]', '200'); // 範囲外の値
    await page.click('[data-testid="search-button"]');
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('緯度は-90から90の範囲で入力してください');
    

  });
});