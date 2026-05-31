'use client';

import '@/lib/i18n';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next, { applyDir } from '@/lib/i18n';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function I18nProvider({ children }: { children: any }) {
  // Das HTML-`dir`/`lang`-Attribut erst nach der Hydration setzen — sonst
  // überschreibt React beim Abgleich des <html>-Elements unsere Werte wieder.
  useEffect(() => {
    applyDir(i18next.language);
    const onChange = (lng: string) => applyDir(lng);
    i18next.on('languageChanged', onChange);
    return () => {
      i18next.off('languageChanged', onChange);
    };
  }, []);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
