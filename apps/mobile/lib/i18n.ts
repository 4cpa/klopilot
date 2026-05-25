import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { de, fr, it, en, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@klopilot/i18n';

const LANG_KEY = 'klo_language';

function detectLocale(): string {
  const tag = getLocales()[0]?.languageTag ?? DEFAULT_LOCALE;
  const lang = tag.split('-')[0] as string;
  return (SUPPORTED_LOCALES as string[]).includes(lang) ? lang : DEFAULT_LOCALE;
}

i18next.use(initReactI18next).init({
  lng: detectLocale(),
  fallbackLng: DEFAULT_LOCALE,
  resources: {
    de: { translation: de },
    fr: { translation: fr },
    it: { translation: it },
    en: { translation: en },
  },
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export async function initLanguage() {
  try {
    const saved = await SecureStore.getItemAsync(LANG_KEY);
    if (saved && (SUPPORTED_LOCALES as string[]).includes(saved)) {
      await i18next.changeLanguage(saved);
    }
  } catch (_e) {
    /* gespeicherte Sprache konnte nicht gelesen werden */
  }
}

export async function changeLanguage(lang: string) {
  await i18next.changeLanguage(lang);
  SecureStore.setItemAsync(LANG_KEY, lang).catch(() => {});
}

export default i18next;
export { detectLocale };
