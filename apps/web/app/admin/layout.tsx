'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { AdminNav } from '@/components/admin/AdminNav';

const ADMIN_AREA_ROLES = ['moderator', 'admin'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !ADMIN_AREA_ROLES.includes(user.role))) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--paper)',
        }}
      >
        <div
          className="animate-spin"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '2px solid var(--brand-primary)',
            borderTopColor: 'transparent',
          }}
        />
      </div>
    );
  }

  if (!user || !ADMIN_AREA_ROLES.includes(user.role)) return null;

  return (
    <>
      <AdminNav role={user.role} />
      {children}
    </>
  );
}
