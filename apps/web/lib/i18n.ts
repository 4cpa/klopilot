'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { de, fr, it, en } from '@klopilot/i18n';

const LANG_KEY = 'klo-language';

i18next.use(initReactI18next).init({
  lng: (typeof window !== 'undefined' ? localStorage.getItem(LANG_KEY) : null) ?? 'de',
  fallbackLng: 'de',
  resources: {
    de: { translation: de },
    fr: { translation: fr },
    it: { translation: it },
    en: { translation: en },
  },
  interpolation: { escapeValue: false },
});

export function changeLanguage(lang: string) {
  i18next.changeLanguage(lang);
  if (typeof window !== 'undefined') localStorage.setItem(LANG_KEY, lang);
}

export default i18next;
