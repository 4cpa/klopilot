import { ImageResponse } from 'next/og';
import { LOCALES, RTL_LOCALES, OG_STATIC_LOCALES, normalizeLocale } from '@klopilot/i18n';

export const runtime = 'edge';

const SIZE = { width: 1200, height: 630 };

/** `?lang=` / `?lng=` auf eine unterstützte Locale abbilden (Default 'de'). */
function resolveLocale(params: URLSearchParams) {
  return normalizeLocale(params.get('lang') ?? params.get('lng'));
}

/**
 * Lokalisiertes OpenGraph-Vorschaubild (1200×630). Liest `?lang=` und rendert
 * Untertitel + Tags in der jeweiligen Sprache aus bereits vorhandenen
 * Übersetzungs-Keys. Wird von der Landing-Seite via `?lang=` referenziert
 * (siehe app/page.tsx) — ersetzt die statische Datei-Konvention.
 *
 * Ausnahme arabische Schrift (ar, ckb, sdh, hac): Die in Next 14 gebündelte
 * @vercel/og-/Satori-Version crasht beim arabischen Ligatur-Shaping
 * („lookupType: 5 - substFormat: 3 is not yet supported") — mit JEDER arabischen
 * Font, da das rlig-Feature stets verarbeitet wird. Für diese Locales gibt es
 * vorab per Headless-Chromium gerenderte statische Bilder (public/og/og-<code>.png,
 * erzeugt via scripts/generate-og-static.mjs), auf die hier umgeleitet wird; die
 * Landing-Seite referenziert sie direkt in generateMetadata.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  const locale = resolveLocale(url.searchParams);

  if ((OG_STATIC_LOCALES as string[]).includes(locale)) {
    // Plain Response statt Response.redirect(): Letzteres erzeugt eine immutable
    // Response, die der Next-Edge-Handler nicht weiterverarbeiten kann.
    // RELATIVE Location: Hinter dem Prod-Reverse-Proxy liefert url.origin die
    // interne Bind-Adresse (0.0.0.0:3102) — ein relativer Pfad wird vom Client
    // korrekt gegen die öffentliche Request-URL (klopilot.ch) aufgelöst.
    return new Response(null, {
      status: 307,
      headers: { Location: `/og/og-${locale}.png` },
    });
  }

  const t = LOCALES[locale];
  const rtl = (RTL_LOCALES as string[]).includes(locale);

  const subtitle = t.landing.hero_badge;
  const tags = [
    `🌸 ${t.landing.stat_rating}`,
    `🗺️ ${t.tabs.map}`,
    `♿ ${t.filter.accessible}`,
    `🔍 ${t.tabs.search}`,
  ];

  return new ImageResponse(
    <div
      style={{
        width: SIZE.width,
        height: SIZE.height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFBF2',
        position: 'relative',
        overflow: 'hidden',
        direction: rtl ? 'rtl' : 'ltr',
      }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: -100,
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -150,
          right: -80,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,214,160,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          borderRadius: 28,
          background: '#FF6B35',
          marginBottom: 32,
          boxShadow: '0 16px 48px rgba(255,107,53,0.4)',
        }}
      >
        {/* Toilet bowl */}
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

      {/* Title */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: '#0B132B',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          marginBottom: 16,
        }}
      >
        klopilot
      </div>

      {/* Subtitle (localized) */}
      <div
        style={{
          fontSize: 30,
          color: '#6B7280',
          fontWeight: 500,
          marginBottom: 40,
          maxWidth: 1000,
          textAlign: 'center',
        }}
      >
        {subtitle}
      </div>

      {/* Tags (localized) */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          maxWidth: 1120,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {tags.map((tag) => (
          <div
            key={tag}
            style={{
              padding: '8px 20px',
              borderRadius: 999,
              background: '#FFF3DC',
              border: '1.5px solid #E7E0CF',
              fontSize: 18,
              fontWeight: 600,
              color: '#0B132B',
            }}
          >
            {tag}
          </div>
        ))}
      </div>

      {/* URL badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          fontSize: 18,
          color: '#FF6B35',
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}
      >
        klopilot.ch
      </div>
    </div>,
    { ...SIZE },
  );
}
