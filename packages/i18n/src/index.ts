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

export { de, fr, it, en, es, pt, da, sv, no, fi };
export type Locale = 'de' | 'fr' | 'it' | 'en' | 'es' | 'pt' | 'da' | 'sv' | 'no' | 'fi';
export const SUPPORTED_LOCALES: Locale[] = [
  'de',
  'fr',
  'it',
  'en',
  'es',
  'pt',
  'da',
  'sv',
  'no',
  'fi',
];
export const DEFAULT_LOCALE: Locale = 'de';

export type TranslationKeys = typeof de;
