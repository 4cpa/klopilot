'use client';

import '@/lib/i18n';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next, { applyDir, detectInitialLang } from '@/lib/i18n';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function I18nProvider({ children }: { children: any }) {
  // i18next startet bewusst auf 'de' (= SSR), damit Server- und erster
  // Client-Render identisch sind (kein Hydration-Mismatch). Erst NACH dem Mount
  // bestimmen wir die gewünschte Sprache (?lang= → System → de) und schalten um;
  // das `dir`/`lang`-Attribut wird ebenfalls erst hier gesetzt, sonst
  // überschreibt React beim Hydration-Abgleich des <html>-Elements unsere Werte.
  useEffect(() => {
    const desired = detectInitialLang();
    if (desired !== i18next.language) i18next.changeLanguage(desired);
    applyDir(i18next.language);
    const onChange = (lng: string) => applyDir(lng);
    i18next.on('languageChanged', onChange);
    return () => {
      i18next.off('languageChanged', onChange);
    };
  }, []);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
