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
  pl,
  cs,
  sk,
  hu,
  ro,
  bg,
  et,
  lv,
  lt,
  uk,
  mk,
  sl,
  hr,
  sr,
  bs,
  sq,
  ar,
  he,
  SUPPORTED_LOCALES,
  RTL_LOCALES,
} from '@klopilot/i18n';

const LANG_KEY = 'klo-language';

/** Setzt das HTML-`dir`/`lang`-Attribut (RTL für Arabisch/Hebräisch). */
export function applyDir(lang: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = (RTL_LOCALES as string[]).includes(lang) ? 'rtl' : 'ltr';
}

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

const initialLang = detectInitialLang();

i18next.use(initReactI18next).init({
  lng: initialLang,
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
    pl: { translation: pl },
    cs: { translation: cs },
    sk: { translation: sk },
    hu: { translation: hu },
    ro: { translation: ro },
    bg: { translation: bg },
    et: { translation: et },
    lv: { translation: lv },
    lt: { translation: lt },
    uk: { translation: uk },
    mk: { translation: mk },
    sl: { translation: sl },
    hr: { translation: hr },
    sr: { translation: sr },
    bs: { translation: bs },
    sq: { translation: sq },
    ar: { translation: ar },
    he: { translation: he },
  },
  interpolation: { escapeValue: false },
});

applyDir(initialLang);

export function changeLanguage(lang: string) {
  i18next.changeLanguage(lang);
  if (typeof window !== 'undefined') localStorage.setItem(LANG_KEY, lang);
  applyDir(lang);
}

export default i18next;
