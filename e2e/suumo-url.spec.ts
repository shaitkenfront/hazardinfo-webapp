import { test, expect } from '@playwright/test';

test.describe('SUUMO URL入力機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('有効なSUUMO URLを入力して防災情報を取得できる', async ({ page }) => {
    // SUUMO URL入力モードを選択
    await page.click('[data-testid="input-mode-suumo"]');
    
    // SUUMO URLを入力（サンプルURL）
    await page.fill('[data-testid="suumo-url-input"]', 'https://suumo.jp/chintai/jnc_000012345/');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // ローディング状態を確認
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // 防災情報が表示されることを確認
    await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible({ timeout: 15000 });
    
    // 物件情報から抽出された位置情報が表示されることを確認
    await expect(page.locator('[data-testid="location-info"]')).toBeVisible();
  });

  test('無効なSUUMO URLを入力した場合にエラーメッセージが表示される', async ({ page }) => {
    // SUUMO URL入力モードを選択
    await page.click('[data-testid="input-mode-suumo"]');
    
    // 無効なURLを入力
    await page.fill('[data-testid="suumo-url-input"]', 'https://example.com/invalid');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('SUUMO URLの解析に失敗しました');
  });

  test('SUUMO以外のURLを入力した場合にバリデーションエラーが表示される', async ({ page }) => {
    // SUUMO URL入力モードを選択
    await page.click('[data-testid="input-mode-suumo"]');
    
    // SUUMO以外のURLを入力
    await page.fill('[data-testid="suumo-url-input"]', 'https://google.com');
    
    // 検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // バリデーションエラーが表示されることを確認
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('SUUMO URLを入力してください');
  });

  test('空のURLを入力した場合にバリデーションエラーが表示される', async ({ page }) => {
    // SUUMO URL入力モードを選択
    await page.click('[data-testid="input-mode-suumo"]');
    
    // 空の状態で検索ボタンをクリック
    await page.click('[data-testid="search-button"]');
    
    // バリデーションエラーが表示されることを確認
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('URLを入力してください');
  });
});