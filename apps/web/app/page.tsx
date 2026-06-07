import type { Metadata } from 'next';
import { LOCALES, OG_LOCALES, OG_STATIC_LOCALES, normalizeLocale } from '@klopilot/i18n';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { CallToAction } from '@/components/landing/CallToAction';
import { Footer } from '@/components/landing/Footer';

type SearchParams = Record<string, string | string[] | undefined>;

/** `?lang=` / `?lng=` aus den Query-Params auf eine unterstützte Locale abbilden. */
function resolveLocale(searchParams?: SearchParams): ReturnType<typeof normalizeLocale> {
  const raw = searchParams?.lang ?? searchParams?.lng;
  return normalizeLocale(Array.isArray(raw) ? raw[0] : raw);
}

/**
 * Server-seitige, lokalisierte Link-Vorschau (OpenGraph/Twitter): Beim Teilen
 * von z. B. klopilot.ch/?lang=uk entfalten Social-Crawler die Karte jetzt in
 * der jeweiligen Sprache — inkl. lokalisiertem Vorschaubild (siehe app/api/og).
 * Titel/Beschreibung stammen aus bereits übersetzten Landing-Strings.
 *
 * Hinweis: Next.js merged das `openGraph`-Objekt NICHT tief mit dem Root-Layout
 * — daher hier vollständig (siteName/url/type/images) angeben, sonst gingen
 * diese Felder verloren.
 */
export function generateMetadata({ searchParams }: { searchParams?: SearchParams }): Metadata {
  const locale = resolveLocale(searchParams);
  const t = LOCALES[locale];
  const title = `klopilot — ${t.landing.hero_badge}`;
  const description = t.landing.hero_subtitle;

  // Lokalisiertes Vorschaubild: dynamisch über /api/og — außer arabisch-schriftige
  // Locales, die wegen eines Satori-Shaping-Bugs als statisches PNG ausgeliefert
  // werden (siehe app/api/og/route.tsx bzw. scripts/generate-og-static.mjs).
  const imageUrl = (OG_STATIC_LOCALES as string[]).includes(locale)
    ? `/og/og-${locale}.png`
    : `/api/og?lang=${locale}`;
  const image = { url: imageUrl, width: 1200, height: 630, alt: title };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'klopilot.ch',
      locale: OG_LOCALES[locale],
      type: 'website',
      url: 'https://klopilot.ch',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
