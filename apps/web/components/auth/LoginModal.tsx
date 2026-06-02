'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { auth as authApi } from '@/lib/api';
import { authStore } from '@/lib/auth-store';

interface Props {
  onClose: () => void;
}

type Step = 'email' | 'sent' | 'loggedIn';

export function LoginModal({ onClose }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling-Intervall aufräumen wenn Modal geschlossen oder gemountet wird
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling(sessionId: string) {
    // Magic Link ist 15 Minuten gültig — danach sinnlos weiter pollen
    const deadline = Date.now() + 15 * 60 * 1000;

    pollRef.current = setInterval(async () => {
      if (Date.now() > deadline) {
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      try {
        const res = await authApi.poll(sessionId);
        if ('accessToken' in res) {
          // Handy hat den Link bestätigt → Laptop einloggen
          if (pollRef.current) clearInterval(pollRef.current);
          authStore.setToken(res.accessToken);
          await authStore.loadUser();
          setStep('loggedIn');
          // Kurz "Angemeldet!" zeigen, dann schliessen
          setTimeout(onClose, 1500);
        }
      } catch {
        // Netzwerkfehler → nächste Runde versuchen, nicht abbrechen
      }
    }, 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { sessionId } = await authApi.requestMagicLink(email.trim());
      setStep('sent');
      startPolling(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.send_error'));
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
        aria-label={t('profile.login_title')}
        className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl p-6 shadow-xl"
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">
            {step === 'email'
              ? t('profile.login_title')
              : step === 'sent'
                ? t('profile.sent_title')
                : t('profile.logged_in_title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)]"
            style={{ background: 'var(--cream)' }}
          >
            ✕
          </button>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-[var(--muted)]">{t('profile.login_subtitle')}</p>
            <div>
              <label
                className="block text-sm font-medium text-[var(--ink)] mb-1"
                htmlFor="login-email"
              >
                {t('profile.email_label')}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('profile.email_placeholder')}
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
              {loading ? t('profile.sending') : t('profile.send_magic_link')}
            </button>
          </form>
        )}

        {step === 'sent' && (
          <div className="space-y-4 text-center">
            <div className="text-5xl">📬</div>
            <p className="text-sm text-[var(--muted)] whitespace-pre-line">
              {t('profile.sent_text', { email })}
            </p>
            <p className="text-sm text-[var(--muted)]">{t('profile.sent_hint')}</p>
            {/* Animierter Pulse zeigt dass aktiv gepollt wird */}
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
              <span
                className="inline-block w-2 h-2 rounded-full animate-pulse"
                style={{ background: 'var(--brand-primary)' }}
              />
              {t('profile.waiting_confirm')}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
            >
              {t('common.close')}
            </button>
          </div>
        )}

        {step === 'loggedIn' && (
          <div className="space-y-4 text-center">
            <div className="text-5xl">✅</div>
            <p className="text-sm font-medium text-[var(--ink)]">{t('profile.logged_in_msg')}</p>
          </div>
        )}
      </div>
    </>
  );
}
