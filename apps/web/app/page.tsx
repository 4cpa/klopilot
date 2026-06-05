import type { Metadata } from 'next';
import {
  LOCALES,
  OG_LOCALES,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type Locale,
} from '@klopilot/i18n';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { CallToAction } from '@/components/landing/CallToAction';
import { Footer } from '@/components/landing/Footer';

type SearchParams = Record<string, string | string[] | undefined>;

/** `?lang=` / `?lng=` aus den Query-Params auf eine unterstützte Locale abbilden. */
function resolveLocale(searchParams?: SearchParams): Locale {
  const raw = searchParams?.lang ?? searchParams?.lng;
  const code = (Array.isArray(raw) ? raw[0] : raw)?.toLowerCase().slice(0, 2) ?? '';
  return (SUPPORTED_LOCALES as string[]).includes(code) ? (code as Locale) : DEFAULT_LOCALE;
}

/**
 * Server-seitige, lokalisierte Link-Vorschau (OpenGraph/Twitter): Beim Teilen
 * von z. B. klopilot.ch/?lang=uk entfalten Social-Crawler die Karte jetzt in
 * der jeweiligen Sprache. Titel/Beschreibung stammen aus bereits übersetzten
 * Landing-Strings; `og:image` wird weiterhin per Datei-Konvention
 * (app/opengraph-image.tsx) automatisch ergänzt.
 *
 * Hinweis: Next.js merged das `openGraph`-Objekt NICHT tief mit dem Root-Layout
 * — daher hier vollständig (siteName/url/type) angeben, sonst gingen diese
 * Felder verloren.
 */
export function generateMetadata({ searchParams }: { searchParams?: SearchParams }): Metadata {
  const locale = resolveLocale(searchParams);
  const t = LOCALES[locale];
  const title = `klopilot — ${t.landing.hero_badge}`;
  const description = t.landing.hero_subtitle;

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
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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
