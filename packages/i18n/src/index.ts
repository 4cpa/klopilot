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

// prettier-ignore
export {
  de, fr, it, en, es, pt, da, sv, no, fi, nl, is, el,
  pl, cs, sk, hu, ro, bg, et, lv, lt, uk, mk, sl, hr, sr, bs, sq, ar, he,
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
  | 'he';

// prettier-ignore
export const SUPPORTED_LOCALES: Locale[] = [
  'de', 'fr', 'it', 'en', 'es', 'pt', 'da', 'sv', 'no', 'fi', 'nl', 'is', 'el',
  'pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'et', 'lv', 'lt', 'uk', 'mk', 'sl',
  'hr', 'sr', 'bs', 'sq', 'ar', 'he',
];

/** Rechts-nach-links-Sprachen (für das HTML-`dir`-Attribut). */
export const RTL_LOCALES: Locale[] = ['ar', 'he'];

export const DEFAULT_LOCALE: Locale = 'de';

export type TranslationKeys = typeof de;
