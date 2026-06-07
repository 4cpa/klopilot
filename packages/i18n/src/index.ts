import de from './locales/de.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import da from './locales/da.json';
import sv from './locales/sv.json';
import no from './locales/no.json';
import fi from './locales/fi.json';
import nl from './locales/nl.json';
import is from './locales/is.json';
import el from './locales/el.json';
// Erweiterung: Mittel-/Osteuropa, Baltikum, Ukraine, Balkan + Mittelmeer (AR/HE)
import pl from './locales/pl.json';
import cs from './locales/cs.json';
import sk from './locales/sk.json';
import hu from './locales/hu.json';
import ro from './locales/ro.json';
import bg from './locales/bg.json';
import et from './locales/et.json';
import lv from './locales/lv.json';
import lt from './locales/lt.json';
import uk from './locales/uk.json';
import mk from './locales/mk.json';
import sl from './locales/sl.json';
import hr from './locales/hr.json';
import sr from './locales/sr.json';
import bs from './locales/bs.json';
import sq from './locales/sq.json';
import ar from './locales/ar.json';
import he from './locales/he.json';
// Erweiterung: Türkei + Anatolien
import tr from './locales/tr.json';
// Erweiterung: kurdische Varietäten (Kurmancî/Zazakî Latein; Soranî/Südkurdisch/
// Goranî arabische Schrift, RTL). Hinweis: zza/sdh/hac sind aktuell von der
// nächsten verlässlichen Varietät (kmr bzw. ckb) abgeleitet — Native-Review offen.
import kmr from './locales/kmr.json';
import ckb from './locales/ckb.json';
import sdh from './locales/sdh.json';
import zza from './locales/zza.json';
import hac from './locales/hac.json';

// prettier-ignore
export {
  de, fr, it, en, es, pt, da, sv, no, fi, nl, is, el,
  pl, cs, sk, hu, ro, bg, et, lv, lt, uk, mk, sl, hr, sr, bs, sq, ar, he,
  tr, kmr, ckb, sdh, zza, hac,
};

export type Locale =
  // prettier-ignore
  | 'de'
  | 'fr'
  | 'it'
  | 'en'
  | 'es'
  | 'pt'
  | 'da'
  | 'sv'
  | 'no'
  | 'fi'
  | 'nl'
  | 'is'
  | 'el'
  // prettier-ignore
  | 'pl'
  | 'cs'
  | 'sk'
  | 'hu'
  | 'ro'
  | 'bg'
  | 'et'
  | 'lv'
  | 'lt'
  | 'uk'
  | 'mk'
  | 'sl'
  | 'hr'
  | 'sr'
  | 'bs'
  | 'sq'
  | 'ar'
  | 'he'
  | 'tr'
  // prettier-ignore
  | 'kmr'
  | 'ckb'
  | 'sdh'
  | 'zza'
  | 'hac';

// prettier-ignore
export const SUPPORTED_LOCALES: Locale[] = [
  'de', 'fr', 'it', 'en', 'es', 'pt', 'da', 'sv', 'no', 'fi', 'nl', 'is', 'el',
  'pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'et', 'lv', 'lt', 'uk', 'mk', 'sl',
  'hr', 'sr', 'bs', 'sq', 'ar', 'he', 'tr',
  'kmr', 'ckb', 'sdh', 'zza', 'hac',
];

/** Rechts-nach-links-Sprachen (für das HTML-`dir`-Attribut). */
export const RTL_LOCALES: Locale[] = ['ar', 'he', 'ckb', 'sdh', 'hac'];

export const DEFAULT_LOCALE: Locale = 'de';

export type TranslationKeys = typeof de;

/**
 * Code → Übersetzungsobjekt. Erlaubt programmatischen (z. B. server-seitigen)
 * Zugriff auf einzelne Locales, etwa für `generateMetadata` (OpenGraph/SEO),
 * ohne i18next initialisieren zu müssen.
 */
// prettier-ignore
export const LOCALES: Record<Locale, TranslationKeys> = {
  de, fr, it, en, es, pt, da, sv, no, fi, nl, is, el,
  pl, cs, sk, hu, ro, bg, et, lv, lt, uk, mk, sl, hr, sr, bs, sq, ar, he, tr,
  kmr, ckb, sdh, zza, hac,
};

/**
 * OpenGraph-`og:locale`-Werte (`language_TERRITORY`) je Sprache — als Hinweis
 * für Social-Crawler beim Entfalten geteilter Links. `de` bleibt `de_CH`
 * (Heimatmarkt klopilot.ch), die übrigen nutzen das jeweils dominante Land.
 */
// prettier-ignore
export const OG_LOCALES: Record<Locale, string> = {
  de: 'de_CH', fr: 'fr_FR', it: 'it_IT', en: 'en_GB', es: 'es_ES', pt: 'pt_PT',
  da: 'da_DK', sv: 'sv_SE', no: 'no_NO', fi: 'fi_FI', nl: 'nl_NL', is: 'is_IS',
  el: 'el_GR', pl: 'pl_PL', cs: 'cs_CZ', sk: 'sk_SK', hu: 'hu_HU', ro: 'ro_RO',
  bg: 'bg_BG', et: 'et_EE', lv: 'lv_LV', lt: 'lt_LT', uk: 'uk_UA', mk: 'mk_MK',
  sl: 'sl_SI', hr: 'hr_HR', sr: 'sr_RS', bs: 'bs_BA', sq: 'sq_AL', ar: 'ar_AR',
  he: 'he_IL', tr: 'tr_TR',
  kmr: 'ku_TR', ckb: 'ckb_IQ', sdh: 'sdh_IR', zza: 'zza_TR', hac: 'hac_IR',
};

/**
 * Locales, deren OG-Vorschaubild STATISCH ausgeliefert wird: arabische Schrift,
 * bei der die in Next gebündelte Satori-Version beim Ligatur-Shaping crasht
 * (vgl. app/api/og). Diese Codes werden auf ein vorgerendertes PNG umgeleitet.
 */
export const OG_STATIC_LOCALES: Locale[] = ['ar', 'ckb', 'sdh', 'hac'];

/**
 * Beliebigen Sprach-Tag auf eine unterstützte Locale abbilden:
 *   1. exakte Übereinstimmung (z. B. „kmr", „tr", „de")
 *   2. 2-Buchstaben-Präfix (z. B. „de-CH" → „de", „ku" → erste passende)
 *   3. Default ('de')
 * Ersetzt verstreute `slice(0, 2)`-Logik, die 3-stellige Codes verstümmeln würde.
 */
export function normalizeLocale(raw?: string | null): Locale {
  const v = (raw ?? '').toLowerCase();
  if ((SUPPORTED_LOCALES as string[]).includes(v)) return v as Locale;
  const two = v.slice(0, 2);
  if ((SUPPORTED_LOCALES as string[]).includes(two)) return two as Locale;
  return DEFAULT_LOCALE;
}
