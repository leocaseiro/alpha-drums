import { test, expect } from '@playwright/test';

test('should have a heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome to Next.js!' })).toBeVisible();
});
