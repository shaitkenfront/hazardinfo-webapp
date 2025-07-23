import { test, expect } from '@playwright/test';

test.describe('レスポンシブデザインテスト', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(({ name, width, height }) => {
    test.describe(`${name} (${width}x${height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');
      });

      test('入力フォームが適切に表示される', async ({ page }) => {
        // 入力モード選択ボタンが表示されることを確認
        await expect(page.locator('[data-testid="input-mode-selector"]')).toBeVisible();
        
        // 住所入力モードを選択
        await page.click('[data-testid="input-mode-address"]');
        
        // 入力フィールドが適切なサイズで表示されることを確認
        const addressInput = page.locator('[data-testid="address-input"]');
        await expect(addressInput).toBeVisible();
        
        // モバイルでは入力フィールドが画面幅に合わせて調整されることを確認
        if (width <= 768) {
          const inputBox = await addressInput.boundingBox();
          expect(inputBox?.width).toBeLessThanOrEqual(width - 40); // マージンを考慮
        }
      });

      test('防災情報表示が適切にレイアウトされる', async ({ page }) => {
        // テスト用データで防災情報を表示
        await page.click('[data-testid="input-mode-address"]');
        await page.fill('[data-testid="address-input"]', '東京都千代田区丸の内1-1-1');
        await page.click('[data-testid="search-button"]');
        
        await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible({ timeout: 10000 });
        
        // モバイルでは縦積みレイアウト、デスクトップでは横並びレイアウトを確認
        const infoDisplay = page.locator('[data-testid="disaster-info-display"]');
        
        if (width <= 768) {
          // モバイル: 縦積みレイアウト
          await expect(infoDisplay).toHaveClass(/mobile-layout/);
        } else {
          // デスクトップ: 横並びレイアウト
          await expect(infoDisplay).toHaveClass(/desktop-layout/);
        }
      });

      test('地図コンポーネントが適切にサイズ調整される', async ({ page }) => {
        // 防災情報を表示
        await page.click('[data-testid="input-mode-coordinates"]');
        await page.fill('[data-testid="latitude-input"]', '35.6762');
        await page.fill('[data-testid="longitude-input"]', '139.6503');
        await page.click('[data-testid="search-button"]');
        
        await expect(page.locator('[data-testid="map-component"]')).toBeVisible({ timeout: 10000 });
        
        // 地図が画面サイズに適応していることを確認
        const mapComponent = page.locator('[data-testid="map-component"]');
        const mapBox = await mapComponent.boundingBox();
        
        expect(mapBox?.width).toBeLessThanOrEqual(width);
        
        // モバイルでは地図の高さが調整されることを確認
        if (width <= 768) {
          expect(mapBox?.height).toBeLessThanOrEqual(300); // モバイル用の最大高さ
        }
      });

      test('ナビゲーションとボタンが適切に表示される', async ({ page }) => {
        // 入力モード切り替えボタンの表示を確認
        const modeButtons = page.locator('[data-testid^="input-mode-"]');
        const buttonCount = await modeButtons.count();
        
        for (let i = 0; i < buttonCount; i++) {
          const button = modeButtons.nth(i);
          await expect(button).toBeVisible();
          
          // ボタンがクリック可能な領域を持つことを確認
          const buttonBox = await button.boundingBox();
          expect(buttonBox?.width).toBeGreaterThan(40);
          expect(buttonBox?.height).toBeGreaterThan(40);
        }
        
        // モバイルでは検索ボタンが大きく表示されることを確認
        await page.click('[data-testid="input-mode-address"]');
        const searchButton = page.locator('[data-testid="search-button"]');
        
        if (width <= 768) {
          const searchBox = await searchButton.boundingBox();
          expect(searchBox?.height).toBeGreaterThanOrEqual(48); // モバイル推奨タップサイズ
        }
      });

      test('テキストとコンテンツが読みやすく表示される', async ({ page }) => {
        // 防災情報を表示
        await page.click('[data-testid="input-mode-address"]');
        await page.fill('[data-testid="address-input"]', '東京都千代田区丸の内1-1-1');
        await page.click('[data-testid="search-button"]');
        
        await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible({ timeout: 10000 });
        
        // テキストが適切なサイズで表示されることを確認
        const hazardInfo = page.locator('[data-testid="hazard-info"]').first();
        if (await hazardInfo.isVisible()) {
          const textStyle = await hazardInfo.evaluate((el) => {
            return window.getComputedStyle(el).fontSize;
          });
          
          // モバイルでは最小14px、デスクトップでは最小16pxのフォントサイズ
          const minFontSize = width <= 768 ? 14 : 16;
          const fontSize = parseInt(textStyle.replace('px', ''));
          expect(fontSize).toBeGreaterThanOrEqual(minFontSize);
        }
      });

      test('スクロール動作が適切に機能する', async ({ page }) => {
        // 長いコンテンツを表示
        await page.click('[data-testid="input-mode-address"]');
        await page.fill('[data-testid="address-input"]', '東京都千代田区丸の内1-1-1');
        await page.click('[data-testid="search-button"]');
        
        await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible({ timeout: 10000 });
        
        // ページの最下部までスクロール
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        
        // スクロール位置が変更されたことを確認
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBeGreaterThan(0);
        
        // 最上部に戻る
        await page.evaluate(() => window.scrollTo(0, 0));
        
        const newScrollY = await page.evaluate(() => window.scrollY);
        expect(newScrollY).toBe(0);
      });
    });
  });

  test('画面回転時の動作確認（モバイル）', async ({ page }) => {
    // 縦向きで開始
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // 防災情報を表示
    await page.click('[data-testid="input-mode-address"]');
    await page.fill('[data-testid="address-input"]', '東京都千代田区丸の内1-1-1');
    await page.click('[data-testid="search-button"]');
    
    await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible({ timeout: 10000 });
    
    // 横向きに回転
    await page.setViewportSize({ width: 667, height: 375 });
    
    // コンテンツが適切に再配置されることを確認
    await expect(page.locator('[data-testid="disaster-info-display"]')).toBeVisible();
    
    // 地図が横向きに適応することを確認
    const mapComponent = page.locator('[data-testid="map-component"]');
    if (await mapComponent.isVisible()) {
      const mapBox = await mapComponent.boundingBox();
      expect(mapBox?.width).toBeLessThanOrEqual(667);
      expect(mapBox?.height).toBeLessThanOrEqual(375);
    }
  });
});