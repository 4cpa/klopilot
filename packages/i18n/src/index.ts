import de from './locales/de.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import en from './locales/en.json';

export { de, fr, it, en };
export type Locale = 'de' | 'fr' | 'it' | 'en';
export const SUPPORTED_LOCALES: Locale[] = ['de', 'fr', 'it', 'en'];
export const DEFAULT_LOCALE: Locale = 'de';

export type TranslationKeys = typeof de;
