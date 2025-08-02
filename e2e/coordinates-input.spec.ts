import { test, expect } from '@playwright/test';

test.describe('緯度経度入力機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('有効な緯度経度を入力して防災情報を取得できる', async ({ page }) => {
    // 緯度経度入力モードを選択
    await page.click('[data-testid="input-mode-coordinates"]');
    
    // 緯度を入力
    await page.fill('[data-testid="latitude-input"]', '35.6762');
    
    // 経度を入力
    await page.fill('[data-testid="longitude-input"]', '139.6503');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // ローディング状態を確認
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // 防災情報が表示されることを確認
    await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible({ timeout: 10000 });
    
    // 地図上に正確な位置が表示されることを確認
    await expect(page.locator('[data-testid="map-marker"]')).toBeVisible();
  });

  test('無効な緯度経度を入力した場合にエラーメッセージが表示される', async ({ page }) => {
    // 緯度経度入力モードを選択
    await page.click('[data-testid="input-mode-coordinates"]');
    
    // 無効な緯度を入力（範囲外）
    await page.fill('[data-testid="latitude-input"]', '91.0');
    await page.fill('[data-testid="longitude-input"]', '139.6503');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // バリデーションエラーが表示されることを確認
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('緯度は-90から90の範囲で入力してください');
  });

  test('日本国外の緯度経度を入力した場合に対応範囲外メッセージが表示される', async ({ page }) => {
    // 緯度経度入力モードを選択
    await page.click('[data-testid="input-mode-coordinates"]');
    
    // 日本国外の座標を入力（ニューヨーク）
    await page.fill('[data-testid="latitude-input"]', '40.7128');
    await page.fill('[data-testid="longitude-input"]', '-74.0060');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // 対応範囲外メッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('対応範囲外');
  });

  test('文字列を緯度経度に入力した場合にバリデーションエラーが表示される', async ({ page }) => {
    // 緯度経度入力モードを選択
    await page.click('[data-testid="input-mode-coordinates"]');
    
    // 文字列を入力
    await page.fill('[data-testid="latitude-input"]', 'abc');
    await page.fill('[data-testid="longitude-input"]', 'def');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // バリデーションエラーが表示されることを確認
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('数値を入力してください');
  });
});