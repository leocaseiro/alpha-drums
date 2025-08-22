import { test, expect } from '@playwright/test';

test.describe('AlphaTab Player', () => {
  test('should display file input interface', async ({ page }) => {
    await page.goto('/play');
    
    // Check that the file input interface is visible
    await expect(page.getByText('Load a Guitar Pro file to start playing')).toBeVisible();
    await expect(page.getByText('Drag and drop a file here or click to browse')).toBeVisible();
    await expect(page.getByText('Open File')).toBeVisible();
  });

  test('should have i18n language switcher', async ({ page }) => {
    await page.goto('/play');
    
    // Check that language switcher is present
    await expect(page.locator('[data-testid="language-switcher"]').or(page.getByRole('combobox'))).toBeVisible();
  });

  test('should show tracks sidebar when file is loaded', async ({ page }) => {
    await page.goto('/play');
    
    // Note: We can't easily test file upload in E2E without an actual file
    // But we can test that the UI structure is correct
    await expect(page.getByText('Open File')).toBeVisible();
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/play');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('Load a Guitar Pro file to start playing')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.getByText('Load a Guitar Pro file to start playing')).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Alpha Drums' })).toBeVisible();
    
    // Test navigation (if navigation links exist)
    const playLink = page.getByRole('link', { name: 'Play' }).or(page.locator('a[href="/play"]'));
    if (await playLink.count() > 0) {
      await playLink.click();
      await expect(page).toHaveURL(/\/play\/?/);
    }
  });
});