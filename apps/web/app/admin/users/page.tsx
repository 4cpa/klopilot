'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { adminUsers, type AdminUser } from '@/lib/api';
import { useAuth } from '@/lib/hooks';
import { RequireAdmin } from '@/components/admin/RequireAdmin';

const ROLE_OPTIONS = ['anon', 'user', 'verified', 'moderator', 'admin'];

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active: { label: '✓ Aktiv', color: '#06D6A0' },
  banned: { label: '⛔ Gesperrt', color: '#EF476F' },
};

// ── Benutzer-Zeile ────────────────────────────────────────────────────────────
function UserRow({
  u,
  isSelf,
  onRoleChange,
  onBan,
  onUnban,
  onAnonymize,
}: {
  u: AdminUser;
  isSelf: boolean;
  onRoleChange: (id: string, role: string) => Promise<void>;
  onBan: (id: string) => Promise<void>;
  onUnban: (id: string) => Promise<void>;
  onAnonymize: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handle(action: () => Promise<unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await action();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setBusy(false);
    }
  }

  const st = STATUS_LABEL[u.status] ?? { label: u.status, color: '#9AA4B2' };
  const deleted = Boolean(u.deletedAt);

  return (
    <tr style={{ borderBottom: '1px solid var(--line)', opacity: deleted ? 0.5 : 1 }}>
      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
          @{u.handle}
          {isSelf && (
            <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--muted)' }}>(du)</span>
          )}
        </div>
        {u.email && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{u.email}</div>
        )}
      </td>

      <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
        <select
          value={u.role}
          disabled={busy || deleted}
          onChange={(e) => {
            if (isSelf && e.target.value !== 'admin') {
              if (!confirm('Eigene Admin-Rolle wirklich ändern? Danach ggf. kein Zugriff mehr.')) {
                e.target.value = u.role;
                return;
              }
            }
            handle(() => onRoleChange(u.id, e.target.value));
          }}
          style={{
            padding: '5px 8px',
            borderRadius: 7,
            border: '1px solid var(--line)',
            background: 'var(--paper)',
            color: 'var(--ink)',
            fontSize: 12,
          }}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </td>

      <td
        style={{
          padding: '10px 8px',
          verticalAlign: 'middle',
          fontSize: 12,
          color: 'var(--muted)',
          textAlign: 'center',
        }}
      >
        🚽 {u._count.toiletsCreated} · 🌸 {u._count.ratings} · 🚨 {u._count.reports}
      </td>

      <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 9px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background: st.color + '22',
            color: st.color,
            border: `1px solid ${st.color}44`,
          }}
          title={u.bannedReason ?? undefined}
        >
          {st.label}
        </span>
        {deleted && (
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>anonymisiert</div>
        )}
      </td>

      <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
        {err && (
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--brand-berry)' }}>⚠ {err}</p>
        )}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {!isSelf && !deleted && u.status === 'active' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => handle(() => onBan(u.id))}
              style={{
                padding: '4px 9px',
                borderRadius: 7,
                border: '1px solid #FFD23F',
                background: '#FFF9E6',
                color: '#A07800',
                fontSize: 11,
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.6 : 1,
              }}
            >
              Sperren
            </button>
          )}
          {!isSelf && !deleted && u.status === 'banned' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => handle(() => onUnban(u.id))}
              style={{
                padding: '4px 9px',
                borderRadius: 7,
                border: '1px solid #06D6A0',
                background: '#E8FBF6',
                color: '#006D52',
                fontSize: 11,
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.6 : 1,
              }}
            >
              Entsperren
            </button>
          )}
          {!isSelf && !deleted && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (
                  confirm(
                    `@${u.handle} wirklich löschen (DSGVO-Anonymisierung)? E-Mail und Handle werden entfernt, Bewertungen bleiben erhalten. Dies kann nicht rückgängig gemacht werden.`,
                  )
                )
                  handle(() => onAnonymize(u.id));
              }}
              style={{
                padding: '4px 9px',
                borderRadius: 7,
                border: '1px solid var(--brand-berry)',
                background: 'transparent',
                color: 'var(--brand-berry)',
                fontSize: 11,
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.6 : 1,
              }}
            >
              🗑 Löschen
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Admin Users Page ──────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  return (
    <RequireAdmin>
      <AdminUsersPageContent />
    </RequireAdmin>
  );
}

function AdminUsersPageContent() {
  const { user: me } = useAuth();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (pg: number, query: string, role: string, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminUsers.list(
        pg,
        query || undefined,
        role || undefined,
        status || undefined,
      );
      setItems(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch {
      setError('Benutzer konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, q, roleFilter, statusFilter);
  }, [page, roleFilter, statusFilter, load]); // q handled via debounce below

  function handleSearch(val: string) {
    setQ(val);
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, val, roleFilter, statusFilter), 350);
  }

  async function handleRoleChange(id: string, role: string) {
    await adminUsers.updateRole(id, role);
    setItems((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  }

  async function handleBan(id: string) {
    const reason = prompt('Grund für die Sperre:') ?? '';
    if (reason.trim().length < 3) return;
    const updated = await adminUsers.ban(id, reason.trim());
    setItems((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: updated.status as 'banned' } : u)),
    );
  }

  async function handleUnban(id: string) {
    const updated = await adminUsers.unban(id);
    setItems((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: updated.status as 'active' } : u)),
    );
  }

  async function handleAnonymize(id: string) {
    const updated = await adminUsers.anonymize(id);
    setItems((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              handle: updated.handle,
              deletedAt: updated.deletedAt,
              status: 'banned',
              email: null,
            }
          : u,
      ),
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper)', paddingBottom: 48 }}>
      {/* Header */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 22 }}>👤</span>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
          Benutzerverwaltung
          {total > 0 && (
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>
              ({total})
            </span>
          )}
        </h1>
      </div>

      {/* Filter-Bar */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
          padding: '12px 24px',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="search"
          placeholder="Suche nach Handle oder E-Mail…"
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'var(--paper)',
            color: 'var(--ink)',
            fontSize: 13,
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'var(--paper)',
            color: 'var(--ink)',
            fontSize: 13,
          }}
        >
          <option value="">Alle Rollen</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'var(--paper)',
            color: 'var(--ink)',
            fontSize: 13,
          }}
        >
          <option value="">Alle Status</option>
          <option value="active">✓ Aktiv</option>
          <option value="banned">⛔ Gesperrt</option>
        </select>
      </div>

      {/* Inhalt */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div
              className="animate-spin"
              style={{
                display: 'inline-block',
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2px solid var(--brand-primary)',
                borderTopColor: 'transparent',
              }}
            />
          </div>
        )}

        {error && (
          <p style={{ textAlign: 'center', color: 'var(--brand-berry)', padding: '24px 0' }}>
            ⚠ {error}
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 600 }}>Keine Benutzer gefunden</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 14,
              border: '1px solid var(--line)',
              overflow: 'hidden',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--cream)', fontSize: 11, color: 'var(--muted)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>
                    Benutzer
                  </th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700 }}>Rolle</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700 }}>
                    Aktivität
                  </th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700 }}>
                    Status
                  </th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700 }}>
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <UserRow
                    key={u.id}
                    u={u}
                    isSelf={u.id === me?.id}
                    onRoleChange={handleRoleChange}
                    onBan={handleBan}
                    onUnban={handleUnban}
                    onAnonymize={handleAnonymize}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              marginTop: 24,
            }}
          >
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: 13,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.4 : 1,
              }}
            >
              ← Zurück
            </button>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              Seite {page} / {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: 13,
                cursor: page >= pages ? 'not-allowed' : 'pointer',
                opacity: page >= pages ? 0.4 : 1,
              }}
            >
              Weiter →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
