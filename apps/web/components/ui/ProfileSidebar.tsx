'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/hooks';
import { users, type UserStats, type Badge, type Toilet } from '@/lib/api';

/* ── Role colours ────────────────────────────────────────────────────────── */
const ROLE_COLOR: Record<string, string> = {
  admin: '#EF476F',
  moderator: '#FF6B35',
  verified: '#06D6A0',
  user: '#118AB2',
};

/* ── Avatar ──────────────────────────────────────────────────────────────── */
function Avatar({ handle, role, size = 56 }: { handle: string; role: string; size?: number }) {
  const color = ROLE_COLOR[role] ?? ROLE_COLOR.user;
  const initials = handle.slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${color}22`,
        border: `2.5px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 800,
        color,
        flexShrink: 0,
        letterSpacing: '-0.02em',
      }}
    >
      {initials}
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({
  value,
  label,
  emoji,
}: {
  value: number | string;
  label: string;
  emoji: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: '12px 8px',
        borderRadius: 12,
        background: 'var(--cream)',
        border: '1px solid var(--line)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 13, marginBottom: 2 }}>{emoji}</div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--ink)',
          lineHeight: 1,
          fontFamily: 'var(--font-fraunces)',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, lineHeight: 1.2 }}>
        {label}
      </div>
    </div>
  );
}

/* ── Toilet row ──────────────────────────────────────────────────────────── */
function ToiletRow({ toilet, onSelect }: { toilet: Toilet; onSelect: (id: string) => void }) {
  const cat: Record<string, string> = {
    public: '🚽',
    nette_toilette: '🤝',
    gastronomy: '🍽️',
    transport: '🚂',
    mall: '🏬',
    event: '🎪',
    private: '🔒',
  };
  const net = toilet.score?.net ?? 0;
  const netColor = net > 0 ? 'var(--brand-mint)' : net < 0 ? 'var(--brand-berry)' : 'var(--muted)';

  return (
    <button
      type="button"
      onClick={() => onSelect(toilet.id)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        borderBottom: '1px solid var(--line)',
        textAlign: 'left',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{cat[toilet.category] ?? '🚽'}</span>
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {toilet.name}
      </span>
      {toilet.score && (
        <span style={{ fontSize: 12, fontWeight: 700, color: netColor, flexShrink: 0 }}>
          {net > 0 ? '+' : ''}
          {net.toFixed(1)}
        </span>
      )}
    </button>
  );
}

/* ── ProfileSidebar ──────────────────────────────────────────────────────── */
interface Props {
  open: boolean;
  onClose: () => void;
  onToiletSelect: (id: string) => void;
  onLoginClick: () => void;
}

export function ProfileSidebar({ open, onClose, onToiletSelect, onLoginClick }: Props) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [myToilets, setMyToilets] = useState<Toilet[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllToilets, setShowAllToilets] = useState(false);

  const load = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const [s, b, t] = await Promise.all([
        users.stats(userId),
        users.myBadges(),
        users.myToilets(),
      ]);
      setStats(s);
      setBadges(b);
      setMyToilets(t);
    } catch {
      /* silent */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open && user) load(user.id);
  }, [open, user, load]);

  // Trap scroll on body when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleLogout = useCallback(async () => {
    await logout();
    onClose();
  }, [logout, onClose]);

  const handleToiletClick = useCallback(
    (id: string) => {
      onToiletSelect(id);
      onClose();
    },
    [onToiletSelect, onClose],
  );

  const roleColor = ROLE_COLOR[user?.role ?? 'user'] ?? ROLE_COLOR.user;
  const visibleToilets = showAllToilets ? myToilets : myToilets.slice(0, 5);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 29,
          background: 'rgba(11,19,43,0.45)',
          backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s',
        }}
      />

      {/* Panel */}
      <aside
        aria-label="Nutzerprofil"
        role="complementary"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
          width: 360,
          maxWidth: '100vw',
          background: 'var(--paper)',
          boxShadow: '-8px 0 48px rgba(11,19,43,0.18)',
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          overflowY: 'auto',
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
            {t('profile.title')}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'var(--cream)',
              cursor: 'pointer',
              fontSize: 16,
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.15s',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          {!user ? (
            /* ── Not logged in ── */
            <div style={{ textAlign: 'center', paddingTop: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
                {t('profile.login_subtitle')}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLoginClick();
                }}
                style={{
                  padding: '12px 32px',
                  borderRadius: 10,
                  background: 'var(--brand-primary)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                {t('profile.login_title')}
              </button>
            </div>
          ) : (
            <>
              {/* ── User header ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <Avatar handle={user.handle} role={user.role} size={56} />
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>
                    @{user.handle}
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: 4,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: `${roleColor}18`,
                      border: `1px solid ${roleColor}44`,
                      fontSize: 11,
                      fontWeight: 700,
                      color: roleColor,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {user.role}
                  </div>
                  {user.email && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      {user.email}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Stats ── */}
              {loading ? (
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 72,
                        borderRadius: 12,
                        background: 'var(--line)',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                  ))}
                </div>
              ) : stats ? (
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                  <StatCard value={stats.points} label={t('profile.points')} emoji="⭐" />
                  <StatCard
                    value={stats.toiletCount}
                    label={t('profile.stat_toilets')}
                    emoji="🚽"
                  />
                  <StatCard
                    value={stats.ratingCount}
                    label={t('profile.stat_ratings')}
                    emoji="🌸"
                  />
                  <StatCard value={stats.photoCount} label={t('profile.stat_photos')} emoji="📷" />
                </div>
              ) : null}

              {/* ── Badges ── */}
              {badges.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 10,
                    }}
                  >
                    Badges
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {badges.map((b) => (
                      <div
                        key={b.id}
                        title={b.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 10px',
                          borderRadius: 999,
                          background: 'var(--cream)',
                          border: '1px solid var(--line)',
                          fontSize: 13,
                          color: 'var(--ink)',
                          fontWeight: 600,
                        }}
                      >
                        <span>{b.emoji}</span>
                        <span style={{ fontSize: 12 }}>{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── My Toilets ── */}
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 4,
                  }}
                >
                  {t('profile.my_toilets')}
                </div>

                {loading ? (
                  <div style={{ height: 80, borderRadius: 8, background: 'var(--line)' }} />
                ) : myToilets.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)', padding: '12px 0' }}>
                    {t('profile.my_toilets_empty')}
                  </p>
                ) : (
                  <>
                    {visibleToilets.map((toilet) => (
                      <ToiletRow key={toilet.id} toilet={toilet} onSelect={handleToiletClick} />
                    ))}
                    {myToilets.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowAllToilets((v) => !v)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          marginTop: 4,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 13,
                          color: 'var(--brand-primary)',
                          fontWeight: 600,
                        }}
                      >
                        {showAllToilets
                          ? '▲ Weniger anzeigen'
                          : `▼ Alle ${myToilets.length} anzeigen`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {user && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--line)',
              flexShrink: 0,
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={handleLogout}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 10,
                border: '1.5px solid var(--line)',
                background: 'var(--cream)',
                color: 'var(--muted)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-berry)';
                (e.currentTarget as HTMLElement).style.color = 'var(--brand-berry)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)';
                (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
              }}
            >
              {t('profile.logout')} ↩
            </button>
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </aside>
    </>
  );
}
