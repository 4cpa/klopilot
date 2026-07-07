import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Automatisierter WCAG-Smoke-Test (axe-core): fängt Regressionen bei Kontrast,
// fehlenden Labels/ARIA-Namen, Landmark-Struktur etc. ab. Ersetzt keine
// manuelle Prüfung mit Screenreader/Tastatur, deckt aber die mechanisch
// prüfbare Teilmenge von WCAG 2.1 A/AA ab.
test.describe('Barrierefreiheit (axe)', () => {
  test('Karte (/karte) hat keine kritischen/schwerwiegenden Verstösse', async ({ page }) => {
    await page.goto('/karte');
    await expect(page.locator('.maplibregl-canvas, canvas').first()).toBeVisible({
      timeout: 20_000,
    });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Next.js Dev-Overlay (nur `next dev`, nicht Teil der echten App-UI)
      .exclude('nextjs-portal')
      .analyze();

    const relevant = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(relevant, JSON.stringify(relevant, null, 2)).toEqual([]);
  });

  test('Startseite (/) hat keine kritischen/schwerwiegenden Verstösse', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Next.js Dev-Overlay (nur `next dev`, nicht Teil der echten App-UI)
      .exclude('nextjs-portal')
      .analyze();

    const relevant = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(relevant, JSON.stringify(relevant, null, 2)).toEqual([]);
  });
});
