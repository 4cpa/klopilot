// Erzeugt die statischen OpenGraph-Vorschaubilder für arabisch-schriftige
// Locales (public/og/og-<code>.png, 1200×630) per Headless-Chromium.
//
// Hintergrund: Die in Next 14 gebündelte @vercel/og-/Satori-Version crasht beim
// arabischen Ligatur-Shaping („lookupType: 5 - substFormat: 3 is not yet
// supported"), unabhängig von der Font. Für diese Locales rendern wir das
// Karten-Bild daher einmalig im echten Browser (korrektes Shaping) und committen
// das Ergebnis. Alle übrigen Sprachen laufen dynamisch über app/api/og.
//
// Hält sich an OG_STATIC_LOCALES aus @klopilot/i18n. Neu ausführen, wenn sich die
// betreffenden Strings oder das Karten-Design ändern:
//   node apps/web/scripts/generate-og-static.mjs
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = resolve(__dirname, '..', '..', '..', 'packages/i18n/src/locales');
const outDir = join(__dirname, '..', 'public', 'og');
mkdirSync(outDir, { recursive: true });

// Synchron zu OG_STATIC_LOCALES (arabische Schrift, RTL).
const LOCALES = ['ar', 'ckb', 'sdh', 'hac'];

const cardHtml = (t) => {
  const subtitle = t.landing.hero_badge;
  const tags = [
    `🌸 ${t.landing.stat_rating}`,
    `🗺️ ${t.tabs.map}`,
    `♿ ${t.filter.accessible}`,
    `🔍 ${t.tabs.search}`,
  ];
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; }
  .card {
    width: 1200px; height: 630px; display: flex; flex-direction: column;
    align-items: center; justify-content: center; background: #FFFBF2;
    position: relative; overflow: hidden;
    font-family: 'Noto Sans Arabic','Noto Naskh Arabic','Segoe UI',Tahoma,Arial,sans-serif;
  }
  .blob1 { position: absolute; top: -200px; left: -100px; width: 700px; height: 700px;
    border-radius: 50%; background: radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%); }
  .blob2 { position: absolute; bottom: -150px; right: -80px; width: 600px; height: 600px;
    border-radius: 50%; background: radial-gradient(circle, rgba(6,214,160,0.12) 0%, transparent 70%); }
  .logo { display: flex; align-items: center; justify-content: center; width: 120px; height: 120px;
    border-radius: 28px; background: #FF6B35; margin-bottom: 32px; box-shadow: 0 16px 48px rgba(255,107,53,0.4); }
  .brand { font-size: 72px; font-weight: 900; color: #0B132B; letter-spacing: -0.03em; line-height: 1;
    margin-bottom: 16px; font-family: 'Segoe UI',Tahoma,Arial,sans-serif; }
  .subtitle { font-size: 30px; color: #6B7280; font-weight: 500; margin-bottom: 40px; max-width: 1000px; text-align: center; }
  .tags { display: flex; gap: 12px; max-width: 1120px; flex-wrap: wrap; justify-content: center; }
  .tag { padding: 8px 20px; border-radius: 999px; background: #FFF3DC; border: 1.5px solid #E7E0CF;
    font-size: 18px; font-weight: 600; color: #0B132B; }
  .url { position: absolute; bottom: 40px; font-size: 18px; color: #FF6B35; font-weight: 700; letter-spacing: 0.02em;
    font-family: 'Segoe UI',Tahoma,Arial,sans-serif; }
</style></head><body>
<div class="card">
  <div class="blob1"></div><div class="blob2"></div>
  <div class="logo">
    <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="42" rx="16" ry="10" fill="white" opacity="0.95" />
      <ellipse cx="32" cy="40" rx="16" ry="10" fill="white" />
      <ellipse cx="32" cy="40" rx="11" ry="7" fill="#FF6B35" />
      <path d="M18 32 Q18 24 32 24 Q46 24 46 32 Q46 34 32 34 Q18 34 18 32Z" fill="white" />
      <circle cx="32" cy="18" r="6" fill="white" opacity="0.9" />
      <path d="M32 13 L34 21 L32 19 L30 21Z" fill="#EF476F" />
      <path d="M32 23 L30 15 L32 17 L34 15Z" fill="white" opacity="0.5" />
    </svg>
  </div>
  <div class="brand">klopilot</div>
  <div class="subtitle">${subtitle}</div>
  <div class="tags">${tags.map((tg) => `<div class="tag">${tg}</div>`).join('')}</div>
  <div class="url">klopilot.ch</div>
</div>
</body></html>`;
};

const browser = await chromium.launch();
for (const code of LOCALES) {
  const t = JSON.parse(readFileSync(join(localesDir, `${code}.json`), 'utf8'));
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(cardHtml(t), { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const out = join(outDir, `og-${code}.png`);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await page.close();
  console.log('OG geschrieben:', out);
}
await browser.close();
