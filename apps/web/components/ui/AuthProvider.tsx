'use client';

import { useEffect } from 'react';
import { authStore } from '@/lib/auth-store';

/** Initialisiert den Auth-Store genau einmal beim App-Start.
 *  Muss im Root-Layout eingebunden sein, damit alle Seiten
 *  (Karte, Admin, Profil …) sofort auf den User zugreifen können. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    authStore.init();
  }, []);

  return <>{children}</>;
}
