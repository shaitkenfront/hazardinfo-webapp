import { test, expect } from '@playwright/test';

test.describe('防災情報表示機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // テスト用の住所を入力して防災情報を取得
    await page.click('[data-testid="input-mode-address"]');
    await page.fill('[data-testid="address-input"]', '東京都千代田区丸の内1-1-1');
    await page.click('[data-testid="search-button"]');
    
    // 防災情報が表示されるまで待機
    await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible({ timeout: 10000 });
  });

  test('ハザードマップ情報が適切に表示される', async ({ page }) => {
    // ハザード情報セクションが表示されることを確認
    await expect(page.locator('[data-testid="hazard-info"]')).toBeVisible();
    
    // 各災害タイプの情報が表示されることを確認
    const hazardTypes = ['flood', 'earthquake', 'landslide', 'tsunami', 'large_scale_fill'];
    
    for (const hazardType of hazardTypes) {
      const hazardElement = page.locator(`[data-testid="hazard-${hazardType}"]`);
      if (await hazardElement.isVisible()) {
        // リスクレベルが表示されることを確認
        await expect(hazardElement.locator('[data-testid="risk-level"]')).toBeVisible();
        
        // 説明文が表示されることを確認
        await expect(hazardElement.locator('[data-testid="description"]')).toBeVisible();
        
        // 出典情報が表示されることを確認
        await expect(hazardElement.locator('[data-testid="source"]')).toBeVisible();
      }
    }
  });

  test('リスクレベル別の色分け表示が機能する', async ({ page }) => {
    const hazardItems = page.locator('[data-testid^="hazard-"]');
    const count = await hazardItems.count();
    
    for (let i = 0; i < count; i++) {
      const hazardItem = hazardItems.nth(i);
      const riskLevel = await hazardItem.locator('[data-testid="risk-level"]').textContent();
      
      // リスクレベルに応じた色クラスが適用されていることを確認
      if (riskLevel?.includes('高')) {
        await expect(hazardItem).toHaveClass(/risk-high/);
      } else if (riskLevel?.includes('中')) {
        await expect(hazardItem).toHaveClass(/risk-medium/);
      } else if (riskLevel?.includes('低')) {
        await expect(hazardItem).toHaveClass(/risk-low/);
      }
    }
  });

  test('避難所情報が適切に表示される', async ({ page }) => {
    // 避難所情報セクションが表示されることを確認
    await expect(page.locator('[data-testid="shelter-info"]')).toBeVisible();
    
    // 避難所リストが表示されることを確認
    const shelterItems = page.locator('[data-testid^="shelter-"]');
    const count = await shelterItems.count();
    
    if (count > 0) {
      const firstShelter = shelterItems.first();
      
      // 避難所名が表示されることを確認
      await expect(firstShelter.locator('[data-testid="shelter-name"]')).toBeVisible();
      
      // 住所が表示されることを確認
      await expect(firstShelter.locator('[data-testid="shelter-address"]')).toBeVisible();
      
      // 距離が表示されることを確認
      await expect(firstShelter.locator('[data-testid="shelter-distance"]')).toBeVisible();
      
      // 収容人数が表示されることを確認
      await expect(firstShelter.locator('[data-testid="shelter-capacity"]')).toBeVisible();
    }
  });

  test('災害履歴情報が適切に表示される', async ({ page }) => {
    // 災害履歴セクションが表示されることを確認
    await expect(page.locator('[data-testid="disaster-history"]')).toBeVisible();
    
    // 災害履歴リストが表示されることを確認
    const historyItems = page.locator('[data-testid^="history-"]');
    const count = await historyItems.count();
    
    if (count > 0) {
      const firstHistory = historyItems.first();
      
      // 災害タイプが表示されることを確認
      await expect(firstHistory.locator('[data-testid="disaster-type"]')).toBeVisible();
      
      // 発生日時が表示されることを確認
      await expect(firstHistory.locator('[data-testid="disaster-date"]')).toBeVisible();
      
      // 説明が表示されることを確認
      await expect(firstHistory.locator('[data-testid="disaster-description"]')).toBeVisible();
      
      // 深刻度が表示されることを確認
      await expect(firstHistory.locator('[data-testid="disaster-severity"]')).toBeVisible();
    }
  });

  test('詳細情報の展開/折りたたみ機能が動作する', async ({ page }) => {
    // 詳細情報ボタンをクリック
    const detailButton = page.locator('[data-testid="detail-toggle-button"]').first();
    await detailButton.click();
    
    // 詳細情報が展開されることを確認
    await expect(page.locator('[data-testid="detailed-info"]').first()).toBeVisible();
    
    // もう一度クリックして折りたたみ
    await detailButton.click();
    
    // 詳細情報が非表示になることを確認
    await expect(page.locator('[data-testid="detailed-info"]').first()).toBeHidden();
  });

  test('出典と更新日時が表示される', async ({ page }) => {
    // 各情報セクションで出典が表示されることを確認
    await expect(page.locator('[data-testid="hazard-source"]')).toBeVisible();
    await expect(page.locator('[data-testid="shelter-source"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-source"]')).toBeVisible();
    
    // 更新日時が表示されることを確認
    await expect(page.locator('[data-testid="last-updated"]')).toBeVisible();
    
    // 更新日時の形式が正しいことを確認
    const lastUpdated = await page.locator('[data-testid="last-updated"]').textContent();
    expect(lastUpdated).toMatch(/\d{4}-\d{2}-\d{2}/); // YYYY-MM-DD形式
  });

  test('防災情報が存在しない場合の表示', async ({ page }) => {
    // 防災情報が存在しない地域の座標を入力
    await page.goto('/');
    await page.click('[data-testid="input-mode-coordinates"]');
    await page.fill('[data-testid="latitude-input"]', '26.2041'); // 沖縄の離島など
    await page.fill('[data-testid="longitude-input"]', '127.6792');
    await page.click('[data-testid="search-button"]');
    
    // 情報なしメッセージが表示されることを確認
    await expect(page.locator('[data-testid="no-disaster-info"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="no-disaster-info"]')).toContainText('この地域の防災情報は見つかりませんでした');
  });
});