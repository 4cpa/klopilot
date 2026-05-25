'use client';

import { useState } from 'react';
import { auth as authApi } from '@/lib/api';

interface Props {
  onClose: () => void;
}

type Step = 'email' | 'sent';

export function LoginModal({ onClose }: Props) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.requestMagicLink(email.trim());
      setStep('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Senden');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Anmelden"
        className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl p-6 shadow-xl"
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">
            {step === 'email' ? 'Anmelden' : 'Link versendet'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schliessen"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)]"
            style={{ background: 'var(--cream)' }}
          >
            ✕
          </button>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-[var(--muted)]">
              Wir senden dir einen Magic Link — kein Passwort nötig.
            </p>
            <div>
              <label
                className="block text-sm font-medium text-[var(--ink)] mb-1"
                htmlFor="login-email"
              >
                E-Mail-Adresse
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="du@beispiel.ch"
                className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--line)] bg-[var(--cream)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
            {error && <p className="text-sm text-[var(--brand-berry)]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--brand-primary)' }}
            >
              {loading ? 'Wird gesendet…' : '✉️ Magic Link senden'}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="text-5xl">📬</div>
            <p className="text-sm text-[var(--muted)]">
              Wir haben einen Link an <strong className="text-[var(--ink)]">{email}</strong>{' '}
              gesendet. Klick darauf, um dich anzumelden.
            </p>
            <p className="text-xs text-[var(--muted)]">
              Lokal: Link im Mailhog unter{' '}
              <a
                href="http://localhost:8035"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: 'var(--brand-sky)' }}
              >
                localhost:8035
              </a>
            </p>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Schliessen
            </button>
          </div>
        )}
      </div>
    </>
  );
}
