import { test, expect } from '@playwright/test';

test.describe('住所入力機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('有効な住所を入力して防災情報を取得できる', async ({ page }) => {
    // 住所入力モードを選択
    await page.click('[data-testid="input-mode-address"]');
    
    // 住所を入力
    await page.fill('[data-testid="address-input"]', '東京都千代田区丸の内1-1-1');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // ローディング状態を確認
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // 防災情報が表示されることを確認
    await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible({ timeout: 10000 });
    
    // ハザード情報が表示されることを確認
    await expect(page.locator('[data-testid="hazard-info"]')).toBeVisible();
    
    // 避難所情報が表示されることを確認
    await expect(page.locator('[data-testid="shelter-info"]')).toBeVisible();
    
    // 地図が表示されることを確認
    await expect(page.locator('[data-testid="map-component"]')).toBeVisible();
  });

  test('無効な住所を入力した場合にエラーメッセージが表示される', async ({ page }) => {
    // 住所入力モードを選択
    await page.click('[data-testid="input-mode-address"]');
    
    // 無効な住所を入力
    await page.fill('[data-testid="address-input"]', '存在しない住所12345');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('住所が見つかりません');
  });

  test('空の住所を入力した場合にバリデーションエラーが表示される', async ({ page }) => {
    // 住所入力モードを選択
    await page.click('[data-testid="input-mode-address"]');
    
    // 空の状態で検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // バリデーションエラーが表示されることを確認
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('住所を入力してください');
  });
});