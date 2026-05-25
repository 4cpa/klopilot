import { test, expect } from '@playwright/test';

test.describe('Startseite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('zeigt AppBar mit Logo und Suche', async ({ page }) => {
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /suche/i })).toBeVisible();
  });

  test('zeigt Karte', async ({ page }) => {
    const map = page.locator('.maplibregl-canvas, canvas').first();
    await expect(map).toBeVisible({ timeout: 10_000 });
  });

  test('Login-Button öffnet Modal', async ({ page }) => {
    await page.getByRole('button', { name: /anmelden/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('Suche gibt Ergebnisse zurück', async ({ page }) => {
    const input = page.getByRole('textbox', { name: /suche/i });
    await input.fill('WC');
    await page.waitForTimeout(400); // debounce
    const dropdown = page.locator('[data-testid="search-results"]');
    await expect(dropdown).toBeVisible({ timeout: 5_000 });
  });
});
