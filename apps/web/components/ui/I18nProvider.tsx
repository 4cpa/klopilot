'use client';

import '@/lib/i18n';
import { I18nextProvider } from 'react-i18next';
import i18next from '@/lib/i18n';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function I18nProvider({ children }: { children: any }) {
  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
