'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  de,
  fr,
  it,
  en,
  es,
  pt,
  da,
  sv,
  no,
  fi,
  nl,
  is,
  el,
  SUPPORTED_LOCALES,
} from '@klopilot/i18n';

const LANG_KEY = 'klo-language';

// Initiale Sprache bestimmen: URL-Param `?lang=` (bzw. `?lng=`) hat Vorrang —
// damit funktionieren teilbare Vorschaulinks (z. B. klopilot.ch/?lang=el) und die
// Wahl wird gemerkt. Danach localStorage, sonst Default 'de'.
function detectInitialLang(): string {
  if (typeof window === 'undefined') return 'de';
  try {
    const params = new URLSearchParams(window.location.search);
    const q = (params.get('lang') ?? params.get('lng') ?? '').toLowerCase();
    if (q && (SUPPORTED_LOCALES as string[]).includes(q)) {
      localStorage.setItem(LANG_KEY, q);
      return q;
    }
    return localStorage.getItem(LANG_KEY) ?? 'de';
  } catch {
    return 'de';
  }
}

i18next.use(initReactI18next).init({
  lng: detectInitialLang(),
  fallbackLng: 'de',
  resources: {
    de: { translation: de },
    fr: { translation: fr },
    it: { translation: it },
    en: { translation: en },
    es: { translation: es },
    pt: { translation: pt },
    da: { translation: da },
    sv: { translation: sv },
    no: { translation: no },
    fi: { translation: fi },
    nl: { translation: nl },
    is: { translation: is },
    el: { translation: el },
  },
  interpolation: { escapeValue: false },
});

export function changeLanguage(lang: string) {
  i18next.changeLanguage(lang);
  if (typeof window !== 'undefined') localStorage.setItem(LANG_KEY, lang);
}

export default i18next;
