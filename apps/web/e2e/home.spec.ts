import { test, expect } from '@playwright/test';

// Die Karten-Seite (/karte) ist die zentrale App-Ansicht mit AppBar, Suche und
// MapLibre-Karte. (Die Landing-Seite "/" ist reine Marketing-Seite ohne diese
// Elemente.)
test.describe('Karte', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/karte');
    // Auf App-Bereitschaft warten: die Karte (dynamisch, client-only) erscheint
    // erst nach der Hydration → danach sind AppBar-Buttons interaktiv.
    await expect(page.locator('.maplibregl-canvas, canvas').first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('zeigt AppBar mit Logo und Suche', async ({ page }) => {
    await expect(page.getByRole('banner')).toBeVisible();
    // type="search" → ARIA-Rolle "searchbox" (nicht "textbox")
    await expect(page.getByRole('searchbox')).toBeVisible();
  });

  test('zeigt Karte', async ({ page }) => {
    await expect(page.locator('.maplibregl-canvas, canvas').first()).toBeVisible();
  });

  test('Login-Button öffnet Modal', async ({ page }) => {
    await page
      .getByRole('button', { name: /anmelden/i })
      .first()
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('Suche gibt Ergebnisse zurück', async ({ page }) => {
    await page.getByRole('searchbox').fill('WC');
    await page.waitForTimeout(500); // debounce
    const dropdown = page.getByTestId('search-results');
    await expect(dropdown).toBeVisible({ timeout: 8_000 });
  });
});
