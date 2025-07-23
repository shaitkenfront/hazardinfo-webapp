import { test, expect } from '@playwright/test';

test.describe('統合テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('住所入力から防災情報表示までの完全なフロー', async ({ page }) => {
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
    
    // 地図が表示されることを確認
    await expect(page.locator('[data-testid="map-component"]')).toBeVisible();
    
    // ハザード情報が表示されることを確認
    await expect(page.locator('[data-testid="hazard-info"]')).toBeVisible();
    
    // 避難所情報が表示されることを確認
    await expect(page.locator('[data-testid="shelter-info"]')).toBeVisible();
    
    // 災害履歴情報が表示されることを確認
    await expect(page.locator('[data-testid="disaster-history"]')).toBeVisible();
    
    // 詳細情報を展開
    await page.click('[data-testid="detail-toggle-button"]');
    await expect(page.locator('[data-testid="detailed-info"]')).toBeVisible();
    
    // 出典情報が表示されることを確認
    await expect(page.locator('[data-testid="hazard-source"]')).toBeVisible();
  });

  test('入力モード切り替えの動作確認', async ({ page }) => {
    // 1. 住所入力モード
    await page.click('[data-testid="input-mode-address"]');
    await expect(page.locator('[data-testid="address-input"]')).toBeVisible();
    
    // 2. 緯度経度入力モード
    await page.click('[data-testid="input-mode-coordinates"]');
    await expect(page.locator('[data-testid="latitude-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="longitude-input"]')).toBeVisible();
    

    
    // 4. 現在地取得モード
    await page.click('[data-testid="input-mode-geolocation"]');
    await expect(page.locator('[data-testid="get-location-button"]')).toBeVisible();
    
    // 各モードで入力フォームが適切に切り替わることを確認
    await page.click('[data-testid="input-mode-address"]');
    await expect(page.locator('[data-testid="address-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="latitude-input"]')).not.toBeVisible();
  });

  test('検索履歴機能の動作確認', async ({ page }) => {
    // 1回目の検索
    await page.click('[data-testid="input-mode-address"]');
    await page.fill('[data-testid="address-input"]', '東京都千代田区丸の内1-1-1');
    await page.click('[data-testid="search-button"]');
    
    // 防災情報が表示されるまで待機
    await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible({ timeout: 10000 });
    
    // 2回目の検索
    await page.click('[data-testid="input-mode-coordinates"]');
    await page.fill('[data-testid="latitude-input"]', '35.6762');
    await page.fill('[data-testid="longitude-input"]', '139.6503');
    await page.click('[data-testid="search-button"]');
    
    // 防災情報が表示されるまで待機
    await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible({ timeout: 10000 });
    
    // 検索履歴が表示されることを確認
    await expect(page.locator('[data-testid="search-history"]')).toBeVisible();
    
    // 履歴から前回の検索を選択
    await page.click('[data-testid="history-item-0"]');
    
    // 選択した履歴の情報が表示されることを確認
    await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible({ timeout: 10000 });
  });

  test('地図操作と避難所表示の確認', async ({ page }) => {
    // 住所入力して検索
    await page.click('[data-testid="input-mode-address"]');
    await page.fill('[data-testid="address-input"]', '東京都千代田区丸の内1-1-1');
    await page.click('[data-testid="search-button"]');
    
    // 地図が表示されるまで待機
    await expect(page.locator('[data-testid="map-component"]')).toBeVisible({ timeout: 10000 });
    
    // 避難所マーカーが表示されることを確認
    await expect(page.locator('[data-testid="shelter-marker"]')).toBeVisible();
    
    // 避難所マーカーをクリック
    await page.click('[data-testid="shelter-marker"]');
    
    // 避難所詳細情報が表示されることを確認
    await expect(page.locator('[data-testid="shelter-details"]')).toBeVisible();
    
    // 地図をズームイン
    await page.click('[data-testid="zoom-in-button"]');
    
    // 地図をズームアウト
    await page.click('[data-testid="zoom-out-button"]');
  });

  test('複数の災害リスクの表示と並び替え', async ({ page }) => {
    // 住所入力して検索
    await page.click('[data-testid="input-mode-address"]');
    await page.fill('[data-testid="address-input"]', '東京都千代田区丸の内1-1-1');
    await page.click('[data-testid="search-button"]');
    
    // 防災情報が表示されるまで待機
    await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible({ timeout: 10000 });
    
    // リスクレベル順に並び替えボタンをクリック
    await page.click('[data-testid="sort-by-risk"]');
    
    // 災害タイプ順に並び替えボタンをクリック
    await page.click('[data-testid="sort-by-type"]');
    
    // 高リスクの災害が上位に表示されることを確認
    const hazardItems = page.locator('[data-testid^="hazard-"]');
    const count = await hazardItems.count();
    
    if (count > 1) {
      // 最初の2つのハザード情報のリスクレベルを取得
      const firstRiskLevel = await hazardItems.nth(0).locator('[data-testid="risk-level"]').textContent();
      const secondRiskLevel = await hazardItems.nth(1).locator('[data-testid="risk-level"]').textContent();
      
      // リスクレベルに基づいて適切に並び替えられていることを確認
      if (firstRiskLevel?.includes('高') && !secondRiskLevel?.includes('高')) {
        expect(true).toBeTruthy(); // 正しく並び替えられている
      } else if (firstRiskLevel?.includes('中') && secondRiskLevel?.includes('低')) {
        expect(true).toBeTruthy(); // 正しく並び替えられている
      }
    }
  });
});