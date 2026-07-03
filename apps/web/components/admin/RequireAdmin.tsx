'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';

/** Zusätzliches Client-Gate für Admin-only-Unterseiten (Benutzer/Daten) innerhalb des
 * Admin-Bereichs, der Moderatoren und Admins gemeinsam betreten dürfen. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/admin');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') return null;
  return <>{children}</>;
}
