'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { auth as authApi } from '@/lib/api';
import { authStore } from '@/lib/auth-store';
import { Suspense } from 'react';

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMsg('Kein Token in der URL');
      return;
    }

    authApi
      .verify(token)
      .then(({ accessToken }) => {
        authStore.setToken(accessToken);
        return authStore.loadUser();
      })
      .then(() => {
        setStatus('ok');
        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      })
      .catch((err) => {
        setStatus('error');
        setMsg(err.message ?? 'Link abgelaufen oder ungültig');
      });
  }, [token]);

  return (
    <main
      className="min-h-[calc(100vh-var(--mvp-banner-h))] flex flex-col items-center justify-center gap-6 p-8"
      style={{ background: 'var(--paper)' }}
    >
      <span className="text-5xl" aria-hidden>
        🚽
      </span>
      <h1 className="text-2xl font-display font-semibold text-[var(--ink)]">klopilot</h1>

      {status === 'loading' && (
        <>
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
          <p className="text-[var(--muted)]">Anmeldung wird verarbeitet…</p>
        </>
      )}

      {status === 'ok' && (
        <>
          <div className="text-4xl">✅</div>
          <p className="text-[var(--ink)] font-medium">
            Erfolgreich angemeldet — du wirst weitergeleitet.
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="text-4xl">❌</div>
          <p className="text-[var(--error-text)] font-medium">{msg}</p>
          <a
            href="/"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--btn-primary-bg)' }}
          >
            Zurück zur Karte
          </a>
        </>
      )}
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
