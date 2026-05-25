'use client';

import { useTranslation } from 'react-i18next';
import { ThemeToggle, ThemeToggleMini } from './ThemeToggle';
import { SearchBar } from './SearchBar';
import { Logo } from './Logo';
import { HelpButton } from './HelpOverlay';
import { useAuth } from '@/lib/hooks';
import type { Toilet } from '@/lib/api';

interface Props {
  onLoginClick: () => void;
  onAddClick: () => void;
  onProfileClick: () => void;
  onSearchSelect: (toilet: Toilet) => void;
  userLocation?: [number, number];
}

const ROLE_COLOR: Record<string, string> = {
  admin: '#EF476F',
  moderator: '#FF6B35',
  verified: '#06D6A0',
  user: '#118AB2',
};

export function AppBar({
  onLoginClick,
  onAddClick,
  onProfileClick,
  onSearchSelect,
  userLocation,
}: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <header
      className="absolute top-0 left-0 right-0 z-20 px-4 py-2.5 flex items-center gap-3"
      style={{
        background: 'linear-gradient(to bottom, var(--paper) 60%, transparent)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Logo size={32} />
        <span className="font-display font-semibold text-lg text-[var(--ink)] hidden sm:block">
          klopilot
        </span>
      </div>

      {/* ThemeToggle Desktop — zwischen Logo und Suchfeld, getrennt von Admin-Aktionen */}
      <ThemeToggle />

      {/* Suche — ThemeToggleMini auf Mobile als trailing eingebettet */}
      <SearchBar
        userLocation={userLocation}
        onSelect={onSearchSelect}
        trailing={
          <span className="sm:hidden">
            <ThemeToggleMini />
          </span>
        }
      />

      {/* Aktionen — nur Add / Help / Admin / Avatar (kein ThemeToggle mehr) */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Hilfe-Button — immer sichtbar */}
        <HelpButton />

        {user ? (
          <>
            <button
              type="button"
              onClick={onAddClick}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors hidden sm:block"
              style={{ background: 'var(--brand-primary)' }}
            >
              + {t('tabs.contribute')}
            </button>

            {/* Admin-Link — nur für Admins und Moderatoren */}
            {(user.role === 'admin' || user.role === 'moderator') && (
              <a
                href="/admin"
                title="Moderation"
                aria-label="Admin-Panel"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#EF476F18',
                  border: '2px solid #EF476F',
                  color: '#EF476F',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = '#EF476F30')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = '#EF476F18')
                }
              >
                {/* SVG Schraubenschlüssel (kein Emoji, da Rendering-Probleme auf Linux) */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </a>
            )}

            {/* Avatar button → opens ProfileSidebar */}
            <button
              type="button"
              onClick={onProfileClick}
              title={`@${user.handle}`}
              aria-label="Profil öffnen"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: `2px solid ${ROLE_COLOR[user.role] ?? ROLE_COLOR.user}`,
                background: `${ROLE_COLOR[user.role] ?? ROLE_COLOR.user}18`,
                color: ROLE_COLOR[user.role] ?? ROLE_COLOR.user,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                letterSpacing: '-0.02em',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.boxShadow =
                  `0 0 0 3px ${ROLE_COLOR[user.role] ?? ROLE_COLOR.user}30`)
              }
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}
            >
              {user.handle.slice(0, 2).toUpperCase()}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onLoginClick}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: 'var(--brand-primary)' }}
          >
            {t('profile.login_title')}
          </button>
        )}
      </div>
    </header>
  );
}
