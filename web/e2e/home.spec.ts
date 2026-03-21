import { test, expect } from '@playwright/test';

test('home page redirects to default locale', async ({ page }) => {
  await page.goto('/');
  // Middleware redirects / to /ja
  await expect(page).toHaveURL(/\/ja/);
});

test('home page renders app name', async ({ page }) => {
  await page.goto('/ja');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('h1')).toContainText('勇者の宿題帳');
});

test('english locale renders in English', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('h1')).toContainText('Hero Homework Quest');
});

test('arabic locale sets RTL direction', async ({ page }) => {
  await page.goto('/ar');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('dir', 'rtl');
  await expect(html).toHaveAttribute('lang', 'ar');
});
